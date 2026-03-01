const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const defaultDbPath = path.join(__dirname, '..', 'data', 'nutri.db');
const dbPath = process.env.NUTRI_DB_PATH || defaultDbPath;
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function seedData() {
  const existing = await get('SELECT COUNT(*) as count FROM meal_entries');
  if (existing.count > 0) return;

  const today = new Date();
  const targets = [2100, 2200, 2000, 2300, 2150, 2250, 2050];
  const meals = [
    { name: 'Овсянка с ягодами', calories: 420, protein: 18, fat: 10, carbs: 63, mealType: 'breakfast' },
    { name: 'Курица с рисом', calories: 680, protein: 47, fat: 16, carbs: 78, mealType: 'lunch' },
    { name: 'Творог и орехи', calories: 310, protein: 24, fat: 18, carbs: 12, mealType: 'snack' },
    { name: 'Лосось и салат', calories: 560, protein: 40, fat: 28, carbs: 22, mealType: 'dinner' },
    { name: 'Паста болоньезе', calories: 740, protein: 34, fat: 22, carbs: 88, mealType: 'lunch' },
    { name: 'Йогурт и банан', calories: 260, protein: 12, fat: 5, carbs: 44, mealType: 'snack' },
    { name: 'Омлет с овощами', calories: 390, protein: 29, fat: 22, carbs: 15, mealType: 'breakfast' }
  ];

  for (let i = 0; i < 35; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const targetCalories = targets[i % targets.length];

    await run(
      `INSERT OR REPLACE INTO daily_goals (date, target_calories, target_protein, target_fat, target_carbs)
       VALUES (?, ?, 140, 70, 240)`,
      [dateStr, targetCalories]
    );

    const mealCount = 2 + (i % 3);
    for (let m = 0; m < mealCount; m++) {
      const meal = meals[(i + m) % meals.length];
      await run(
        `INSERT INTO meal_entries (date, time, meal_type, food_name, calories, protein, fat, carbs, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dateStr,
          `${String(8 + m * 4).padStart(2, '0')}:15`,
          meal.mealType,
          meal.name,
          meal.calories + ((i + m) % 5) * 15,
          meal.protein,
          meal.fat,
          meal.carbs,
          ''
        ]
      );
    }
  }
}

async function init() {
  await run(`
    CREATE TABLE IF NOT EXISTS meal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      food_name TEXT NOT NULL,
      calories INTEGER NOT NULL,
      protein REAL NOT NULL,
      fat REAL NOT NULL,
      carbs REAL NOT NULL,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS daily_goals (
      date TEXT PRIMARY KEY,
      target_calories INTEGER NOT NULL DEFAULT 2200,
      target_protein REAL NOT NULL DEFAULT 140,
      target_fat REAL NOT NULL DEFAULT 70,
      target_carbs REAL NOT NULL DEFAULT 240
    )
  `);

  await seedData();

  db.close((err) => {
    if (err) {
      console.error('DB close error', err);
      process.exit(1);
    }
    console.log('DB initialized:', dbPath);
  });
}

init().catch((err) => {
  console.error('Init DB failed:', err);
  db.close();
  process.exit(1);
});
