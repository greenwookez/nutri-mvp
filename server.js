const path = require('path');
const fs = require('fs');
const express = require('express');
const { Pool } = require('pg');
const { newDb } = require('pg-mem');

const app = express();
const PORT = process.env.PORT || 3000;
let DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.SUPABASE_DB_URL;
const USE_MEMORY_DB = !DATABASE_URL;
const SKIP_DB_BOOTSTRAP = process.env.NUTRI_SKIP_DB_BOOTSTRAP === 'true';
const ACTIVITY_API_KEY = process.env.ACTIVITY_API_KEY || '';

function normalizePgUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    const sslmode = u.searchParams.get('sslmode');
    const hasCompat = u.searchParams.has('uselibpqcompat');
    if ((sslmode === 'prefer' || sslmode === 'require' || sslmode === 'verify-ca') && !hasCompat) {
      u.searchParams.set('uselibpqcompat', 'true');
    }
    return u.toString();
  } catch {
    return url;
  }
}

DATABASE_URL = normalizePgUrl(DATABASE_URL);

if (USE_MEMORY_DB) {
  console.warn('[nutri-mvp] DATABASE_URL is not set. Using local in-memory PostgreSQL (pg-mem) for dev/testing.');
}

let pool;
if (USE_MEMORY_DB) {
  const mem = newDb();
  const pgMem = mem.adapters.createPg();
  pool = new pgMem.Pool();
} else {
  // Let pg parse SSL settings from DATABASE_URL/POSTGRES_URL.
  // We avoid overriding ssl object here to keep behavior aligned with provider URLs.
  pool = new Pool({
    connectionString: DATABASE_URL
  });
}

let dbInitialized = false;

function loadJsonSafe(candidates, fallback) {
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
    } catch (_) {}
  }
  return fallback;
}

function loadTextSafe(candidates, fallback = '') {
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8');
    } catch (_) {}
  }
  return fallback;
}

const FOODS = loadJsonSafe(
  [
    path.join(__dirname, '..', 'nutri-mvp-domain', 'FOODS.json'),
    path.join(__dirname, 'domain', 'FOODS.json')
  ],
  {
    version: 'fallback',
    foods: [
      { id: 'egg_whole_raw', name_ru: 'Яйцо куриное (целое, сырое)', category: 'protein', kcal: 143, protein: 12.6, fat: 9.5, carbs: 0.7 },
      { id: 'chicken_breast_cooked', name_ru: 'Куриная грудка (готовая)', category: 'protein', kcal: 165, protein: 31, fat: 3.6, carbs: 0 },
      { id: 'olive_oil', name_ru: 'Оливковое масло', category: 'fats', kcal: 884, protein: 0, fat: 100, carbs: 0 },
      { id: 'potato_boiled', name_ru: 'Картофель отварной', category: 'carbs', kcal: 82, protein: 2, fat: 0.1, carbs: 18 }
    ]
  }
);

const PORTIONS = loadJsonSafe(
  [
    path.join(__dirname, '..', 'nutri-mvp-domain', 'PORTIONS.json'),
    path.join(__dirname, 'domain', 'PORTIONS.json')
  ],
  { version: 'fallback', default_rules: { unknown_piece_grams: 100, unknown_cup_grams: 240, unknown_spoon_grams: 15 } }
);

const RULES_TEXT = loadTextSafe(
  [
    path.join(__dirname, '..', 'nutri-mvp-domain', 'ESTIMATION_RULES.md'),
    path.join(__dirname, 'domain', 'ESTIMATION_RULES.md')
  ],
  ''
);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function query(sql, params = []) {
  return pool.query(sql, params);
}

async function seedDevData() {
  const { rows } = await query('SELECT COUNT(*)::int AS c FROM meal_entries');
  if (rows[0].c > 0) return;

  const d = new Date().toISOString().slice(0, 10);
  await query(
    `INSERT INTO daily_goals (date, target_calories, target_protein, target_fat, target_carbs)
     VALUES ($1, 2200, 140, 70, 240)
     ON CONFLICT (date) DO NOTHING`,
    [d]
  );

  await query(
    `INSERT INTO meal_entries (date, time, meal_type, food_name, calories, protein, fat, carbs, notes)
     VALUES
     ($1, '08:30', 'breakfast', 'Oatmeal with berries', 420, 18, 10, 63, 'dev seed'),
     ($1, '13:00', 'lunch', 'Chicken with rice', 680, 47, 16, 78, 'dev seed')`,
    [d]
  );
}

async function initDb() {
  if (dbInitialized || SKIP_DB_BOOTSTRAP) {
    dbInitialized = true;
    return;
  }

  await query(`
    CREATE TABLE IF NOT EXISTS meal_entries (
      id BIGSERIAL PRIMARY KEY,
      date DATE NOT NULL,
      time TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      food_name TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      fat REAL NOT NULL,
      carbs REAL NOT NULL,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS daily_goals (
      date DATE PRIMARY KEY,
      target_calories REAL NOT NULL DEFAULT 2200,
      target_protein REAL NOT NULL DEFAULT 140,
      target_fat REAL NOT NULL DEFAULT 70,
      target_carbs REAL NOT NULL DEFAULT 240
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS daily_activity (
      date DATE PRIMARY KEY,
      active_calories REAL NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'manual',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  if (USE_MEMORY_DB) {
    await seedDevData();
  }

  dbInitialized = true;
}

function dateShift(baseDate, shiftDays) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + shiftDays);
  return d.toISOString().slice(0, 10);
}

function requireActivityApiKey(req, res, next) {
  if (!ACTIVITY_API_KEY) return next();
  const provided = req.header('x-api-key');
  if (provided !== ACTIVITY_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: invalid API key' });
  }
  return next();
}

const FOOD_ALIASES = {
  egg_whole_raw: ['egg', 'eggs', 'яйцо', 'яйца'],
  chicken_breast_cooked: ['chicken breast', 'chicken', 'куриная грудка', 'курица'],
  olive_oil: ['olive oil', 'оливковое масло', 'oil', 'масло'],
  potato_boiled: ['potato', 'картофель', 'картошка']
};

const PIECE_GRAMS = {
  egg_whole_raw: 50,
  apple: 180,
  banana: 120,
  orange: 180,
  pizza_margherita: 125,
  burger_beef: 220,
  croissant: 60
};

function levelScore(level) {
  return level === 'high' ? 3 : level === 'medium' ? 2 : 1;
}

function scoreLevel(score) {
  return score >= 2.5 ? 'high' : score >= 1.6 ? 'medium' : 'low';
}

function normalizeText(input = '') {
  return input
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/ст\.л\.?/g, ' tbsp ')
    .replace(/ч\.л\.?/g, ' tsp ')
    .replace(/грамм|грамма|граммов|гр\.?/g, ' g ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSegments(text) {
  return text
    .split(/,|\+|\band\b|\bи\b|\n/gi)
    .map((s) => s.trim())
    .filter(Boolean);
}

function detectFood(segment) {
  const seg = ` ${segment} `;

  for (const food of FOODS.foods) {
    if (food.name_ru && seg.includes(` ${String(food.name_ru).toLowerCase()} `)) {
      return food;
    }
  }

  for (const food of FOODS.foods) {
    if (seg.includes(food.id.replaceAll('_', ' '))) return food;
    const aliases = FOOD_ALIASES[food.id] || [];
    if (aliases.some((a) => seg.includes(a))) return food;
  }

  return null;
}

function parseQuantity(segment) {
  const rangeMatch = segment.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
  const rangeValue = rangeMatch ? (Number(rangeMatch[1]) + Number(rangeMatch[2])) / 2 : null;

  const gramMatch = segment.match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/);
  if (gramMatch) {
    const raw = Number(gramMatch[1]);
    return {
      grams: gramMatch[2] === 'kg' ? raw * 1000 : raw,
      source: 'grams',
      confidence: 'high',
      rangeInput: Boolean(rangeMatch)
    };
  }

  const tbspMatch = segment.match(/(\d+(?:\.\d+)?)?\s*tbsp\b/);
  if (tbspMatch) {
    const amount = Number(tbspMatch[1] || rangeValue || 1);
    return { grams: amount * 14, source: 'tbsp', confidence: 'medium', rangeInput: Boolean(rangeMatch) };
  }

  const tspMatch = segment.match(/(\d+(?:\.\d+)?)?\s*tsp\b/);
  if (tspMatch) {
    const amount = Number(tspMatch[1] || rangeValue || 1);
    return { grams: amount * 5, source: 'tsp', confidence: 'medium', rangeInput: Boolean(rangeMatch) };
  }

  const cupMatch = segment.match(/(\d+(?:\.\d+)?)?\s*(cup|стакан)\b/);
  if (cupMatch) {
    const amount = Number(cupMatch[1] || rangeValue || 1);
    return {
      grams: amount * (PORTIONS.default_rules?.unknown_cup_grams || 240),
      source: 'cup',
      confidence: 'medium',
      rangeInput: Boolean(rangeMatch)
    };
  }

  const pieceMatch = segment.match(/(\d+(?:\.\d+)?)\s*(pc|pcs|piece|pieces|шт)\b/) || segment.match(/^(\d+(?:\.\d+)?)\b/);
  if (pieceMatch) {
    return {
      pieces: Number(pieceMatch[1] || rangeValue || 1),
      source: 'piece',
      confidence: 'medium',
      rangeInput: Boolean(rangeMatch)
    };
  }

  return {
    grams: null,
    source: 'heuristic',
    confidence: 'low',
    rangeInput: Boolean(rangeMatch)
  };
}

function estimateItem(segment) {
  const food = detectFood(segment);
  if (!food) {
    return {
      unresolved: true,
      original: segment,
      confidence: 'low'
    };
  }

  const qty = parseQuantity(segment);
  let grams = qty.grams;

  if (!grams && qty.pieces) {
    grams = qty.pieces * (PIECE_GRAMS[food.id] || PORTIONS.default_rules?.unknown_piece_grams || 100);
  }

  if (!grams) {
    if (food.category === 'fats') {
      grams = PORTIONS.default_rules?.unknown_spoon_grams || 15;
    } else {
      grams = 100;
    }
  }

  let confidenceScore = levelScore(qty.confidence);
  if (qty.rangeInput) confidenceScore -= 0.6;
  const confidence = scoreLevel(Math.max(1, confidenceScore));

  const ratio = grams / 100;
  const macros = {
    calories: Math.round(food.kcal * ratio * 10) / 10,
    protein: Math.round(food.protein * ratio * 10) / 10,
    fat: Math.round(food.fat * ratio * 10) / 10,
    carbs: Math.round(food.carbs * ratio * 10) / 10
  };

  return {
    original: segment,
    foodId: food.id,
    foodName: food.name_ru,
    grams: Math.round(grams),
    source: qty.source,
    estimated: qty.source !== 'grams',
    confidence,
    macros
  };
}

function estimateFromText(text) {
  const normalized = normalizeText(text);
  const segments = splitSegments(normalized);
  const items = segments.map(estimateItem);

  const resolved = items.filter((i) => !i.unresolved);
  const unresolved = items.filter((i) => i.unresolved);

  const totals = resolved.reduce(
    (acc, item) => {
      acc.calories += item.macros.calories;
      acc.protein += item.macros.protein;
      acc.fat += item.macros.fat;
      acc.carbs += item.macros.carbs;
      return acc;
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  Object.keys(totals).forEach((k) => {
    totals[k] = Math.round(totals[k] * 10) / 10;
  });

  const confidenceScore =
    resolved.length > 0
      ? resolved.reduce((sum, i) => sum + levelScore(i.confidence), 0) / resolved.length
      : 1;

  const overallConfidence = unresolved.length > 0 ? 'low' : scoreLevel(confidenceScore);

  return {
    original_input: text,
    normalized_input: normalized,
    items: resolved,
    unresolved,
    totals,
    confidence: overallConfidence,
    parsing_rules: {
      portions_version: PORTIONS.version,
      foods_version: FOODS.version,
      rules_loaded: Boolean(RULES_TEXT)
    }
  };
}

app.get('/api/entries', async (req, res) => {
  try {
    await initDb();
    const from = req.query.from;
    const to = req.query.to;

    const sql = from && to
      ? `SELECT * FROM meal_entries WHERE date BETWEEN $1 AND $2 ORDER BY date DESC, time DESC`
      : `SELECT * FROM meal_entries ORDER BY date DESC, time DESC LIMIT 100`;
    const params = from && to ? [from, to] : [];

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

app.post('/api/entries', async (req, res) => {
  try {
    await initDb();
    const { date, time, mealType, foodName, calories, protein, fat, carbs, notes } = req.body;

    if (!date || !time || !foodName) {
      return res.status(400).json({ error: 'date, time, foodName are required' });
    }

    const { rows } = await query(
      `INSERT INTO meal_entries (date, time, meal_type, food_name, calories, protein, fat, carbs, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id`,
      [
        date,
        time,
        mealType || 'other',
        foodName,
        Number(calories) || 0,
        Number(protein) || 0,
        Number(fat) || 0,
        Number(carbs) || 0,
        notes || ''
      ]
    );

    res.status(201).json({ id: rows[0].id });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

app.post('/api/log-text', async (req, res) => {
  try {
    await initDb();
    const { text, date, time, mealType } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }

    const entryDate = date || new Date().toISOString().slice(0, 10);
    const entryTime = time || new Date().toTimeString().slice(0, 5);
    const entryMealType = mealType || 'other';

    const estimation = estimateFromText(text);

    for (const item of estimation.items) {
      await query(
        `INSERT INTO meal_entries (date, time, meal_type, food_name, calories, protein, fat, carbs, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          entryDate,
          entryTime,
          entryMealType,
          `${item.foodName} (${item.grams}g)`,
          Math.round(item.macros.calories),
          item.macros.protein,
          item.macros.fat,
          item.macros.carbs,
          `log-text:${text}; source:${item.source}; confidence:${item.confidence}`
        ]
      );
    }

    res.status(201).json({
      date: entryDate,
      time: entryTime,
      mealType: entryMealType,
      ...estimation,
      saved_entries: estimation.items.length
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to log text meal' });
  }
});


app.post('/api/activity/active-calories', requireActivityApiKey, async (req, res) => {
  try {
    await initDb();
    const { date, activeCalories, source } = req.body;
    const entryDate = date || new Date().toISOString().slice(0, 10);
    const calories = Number(activeCalories);

    if (!Number.isFinite(calories) || calories < 0) {
      return res.status(400).json({ error: 'activeCalories must be a non-negative number' });
    }

    const activitySource = String(source || 'ios-healthkit').slice(0, 100);

    const { rows } = await query(
      `INSERT INTO daily_activity (date, active_calories, source, updated_at)
       VALUES ($1::date, $2, $3, NOW())
       ON CONFLICT (date)
       DO UPDATE SET
         active_calories = EXCLUDED.active_calories,
         source = EXCLUDED.source,
         updated_at = NOW()
       RETURNING active_calories, source, updated_at`,
      [entryDate, calories, activitySource]
    );

    res.status(200).json({
      message: 'Active calories synced',
      activity: {
        date: entryDate,
        activeCalories: Number(rows[0].active_calories),
        source: rows[0].source,
        updatedAt: rows[0].updated_at
      }
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to sync active calories' });
  }
});

app.get('/api/activity/day', async (req, res) => {
  try {
    await initDb();
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const { rows } = await query(
      `SELECT active_calories, source, updated_at
       FROM daily_activity
       WHERE date = $1::date`,
      [date]
    );

    if (!rows[0]) {
      return res.json({ date, activeCalories: 0, source: null, updatedAt: null });
    }

    return res.json({
      date,
      activeCalories: Number(rows[0].active_calories),
      source: rows[0].source,
      updatedAt: rows[0].updated_at
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to get activity data' });
  }
});

app.get('/api/summary/day', async (req, res) => {
  try {
    await initDb();
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    const totalsRes = await query(
      `SELECT
          COALESCE(SUM(calories), 0) as calories,
          COALESCE(SUM(protein), 0) as protein,
          COALESCE(SUM(fat), 0) as fat,
          COALESCE(SUM(carbs), 0) as carbs,
          COUNT(*) as meals
       FROM meal_entries
       WHERE date = $1`,
      [date]
    );

    const goalRes = await query(`SELECT * FROM daily_goals WHERE date = $1`, [date]);
    const activityRes = await query(
      `SELECT active_calories FROM daily_activity WHERE date = $1::date`,
      [date]
    );
    const totals = totalsRes.rows[0];
    const goal = goalRes.rows[0];
    const targetCalories = Number(goal?.target_calories || 2200);
    const consumedCalories = Number(totals.calories);
    const activeCalories = Number(activityRes.rows[0]?.active_calories || 0);
    const netCalories = consumedCalories - activeCalories;

    res.json({
      date,
      totals: {
        calories: consumedCalories,
        protein: Number(totals.protein),
        fat: Number(totals.fat),
        carbs: Number(totals.carbs),
        meals: Number(totals.meals)
      },
      targetCalories,
      activeCalories,
      netCalories,
      deltaCalories: netCalories - targetCalories
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get day summary' });
  }
});

app.get('/api/summary/week', async (req, res) => {
  try {
    await initDb();
    const endDate = req.query.date || new Date().toISOString().slice(0, 10);
    const startDate = dateShift(endDate, -6);

    const dailyRes = await query(
      `SELECT
         e.date::text as date,
         COALESCE(SUM(e.calories), 0) as calories,
         COALESCE(g.target_calories, 2200) as "targetCalories",
         (COALESCE(SUM(e.calories), 0) - COALESCE(g.target_calories, 2200)) as delta
       FROM meal_entries e
       LEFT JOIN daily_goals g ON g.date = e.date
       WHERE e.date BETWEEN $1::date AND $2::date
       GROUP BY e.date, g.target_calories
       ORDER BY e.date ASC`,
      [startDate, endDate]
    );

    const byDate = new Map(
      dailyRes.rows.map((d) => [d.date, { ...d, calories: Number(d.calories), targetCalories: Number(d.targetCalories), delta: Number(d.delta) }])
    );

    const full = [];
    for (let i = 0; i < 7; i++) {
      const d = dateShift(startDate, i);
      if (byDate.has(d)) {
        full.push(byDate.get(d));
      } else {
        const g = await query(`SELECT target_calories FROM daily_goals WHERE date = $1`, [d]);
        const targetCalories = Number(g.rows[0]?.target_calories || 2200);
        full.push({ date: d, calories: 0, targetCalories, delta: 0 - targetCalories });
      }
    }

    const balance = full.reduce((sum, d) => sum + d.delta, 0);
    const zone = balance < -200 ? 'green' : balance > 200 ? 'red' : 'orange';

    res.json({ startDate, endDate, days: full, balance, zone });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get week summary' });
  }
});

app.get('/api/summary/month', async (req, res) => {
  try {
    await initDb();
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const from = `${year}-${month}-01`;
    const to = `${year}-${month}-31`;

    const rowsRes = await query(
      `SELECT date::text as date,
              COALESCE(SUM(calories), 0) as calories,
              COALESCE(SUM(protein), 0) as protein,
              COALESCE(SUM(fat), 0) as fat,
              COALESCE(SUM(carbs), 0) as carbs
       FROM meal_entries
       WHERE date BETWEEN $1::date AND $2::date
       GROUP BY date
       ORDER BY date ASC`,
      [from, to]
    );

    const rows = rowsRes.rows.map((r) => ({
      date: r.date,
      calories: Number(r.calories),
      protein: Number(r.protein),
      fat: Number(r.fat),
      carbs: Number(r.carbs)
    }));

    const totals = rows.reduce(
      (acc, r) => {
        acc.calories += r.calories;
        acc.protein += r.protein;
        acc.fat += r.fat;
        acc.carbs += r.carbs;
        return acc;
      },
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );

    res.json({ month: `${year}-${month}`, days: rows, totals });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get month summary' });
  }
});

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Nutri MVP running on http://localhost:${PORT}`);
  });
}

module.exports = app;
