const dateInput = document.getElementById('date');
const timeInput = document.getElementById('time');
const quickLogResult = document.getElementById('quickLogResult');

const todayISO = new Date().toISOString().slice(0, 10);
dateInput.value = todayISO;
timeInput.value = new Date().toTimeString().slice(0, 5);

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.view).classList.add('active');
  });
}

document.getElementById('scrollToAdd').addEventListener('click', () => {
  document.getElementById('addMealCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('prevDay').addEventListener('click', () => shiftDate(-1));
document.getElementById('nextDay').addEventListener('click', () => shiftDate(1));

function shiftDate(deltaDays) {
  const d = new Date(`${dateInput.value}T00:00:00`);
  d.setDate(d.getDate() + deltaDays);
  dateInput.value = d.toISOString().slice(0, 10);
  refreshAll();
}

function fmt(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

function mealTypeLabel(type) {
  const labels = {
    breakfast: 'Завтрак',
    lunch: 'Обед',
    dinner: 'Ужин',
    snack: 'Перекус',
    other: 'Другое'
  };
  return labels[type] || type;
}

function dayZone(deltaCalories) {
  if (deltaCalories < -200) return 'green';
  if (deltaCalories > 200) return 'red';
  return 'orange';
}

function zoneText(zone, delta) {
  const abs = Math.abs(fmt(delta));
  if (zone === 'green') return `В пределах плана · запас ${abs} kcal`;
  if (zone === 'red') return `Небольшой перебор · +${abs} kcal`;
  return `Около цели · отклонение ${abs} kcal`;
}

function setState(containerId, text, type = 'info') {
  document.getElementById(containerId).innerHTML = `<div class="state-box state-${type}">${text}</div>`;
}

async function loadToday() {
  const date = dateInput.value;
  setState('daySummary', 'Загружаем сводку...');
  setState('todayEntries', 'Загружаем записи...');

  try {
    const [summaryRes, entriesRes] = await Promise.all([
      fetch(`/api/summary/day?date=${date}`),
      fetch(`/api/entries?from=${date}&to=${date}`)
    ]);

    if (!summaryRes.ok || !entriesRes.ok) {
      throw new Error('fetch failed');
    }

    const summary = await summaryRes.json();
    const entries = await entriesRes.json();

    const consumed = fmt(summary.totals.calories);
    const target = fmt(summary.targetCalories);
    const active = fmt(summary.activeCalories || 0);
    const net = fmt(summary.netCalories ?? consumed - active);
    const delta = fmt(summary.deltaCalories ?? (net - target));
    const zone = dayZone(delta);

    document.getElementById('daySummary').innerHTML = `
      <p class="kpi-title">${date}</p>
      <div class="kpi-main">Net ${net} / ${target} kcal</div>
      <p class="kpi-delta">Съедено ${consumed} · Активность ${active}</p>
      <p class="kpi-delta">${delta <= 0 ? `Осталось ${Math.abs(delta)} kcal` : `+${delta} kcal сверх цели`}</p>
      <div class="kpi-macros">
        <div class="macro-pill"><span class="macro-name">Белки</span><strong>${fmt(summary.totals.protein)} г</strong></div>
        <div class="macro-pill"><span class="macro-name">Жиры</span><strong>${fmt(summary.totals.fat)} г</strong></div>
        <div class="macro-pill"><span class="macro-name">Углеводы</span><strong>${fmt(summary.totals.carbs)} г</strong></div>
      </div>
      <span class="zone-badge zone-${zone}"><span class="zone-dot"></span>${zoneText(zone, delta)}</span>
    `;

    if (!entries.length) {
      document.getElementById('todayEntries').innerHTML = '<div class="feed-empty">Пока пусто. Добавим первый приём?</div>';
      return;
    }

    const grouped = entries.reduce((acc, e) => {
      const type = mealTypeLabel(e.meal_type);
      if (!acc[type]) acc[type] = [];
      acc[type].push(e);
      return acc;
    }, {});

    const groupOrder = ['Завтрак', 'Обед', 'Ужин', 'Перекус', 'Другое'];

    const entriesHtml = groupOrder
      .filter((group) => grouped[group]?.length)
      .map((group) => {
        const rows = grouped[group]
          .map(
            (e) => `
              <div class="entry">
                <div>
                  <div class="entry-title">${e.food_name}</div>
                  <div class="entry-meta">${e.time} · ${group}${e.notes ? ` · ${e.notes}` : ''}</div>
                </div>
                <div>
                  <div class="entry-kcal">${fmt(e.calories)} kcal</div>
                  <div class="entry-macros">Б ${fmt(e.protein)} · Ж ${fmt(e.fat)} · У ${fmt(e.carbs)}</div>
                </div>
              </div>`
          )
          .join('');

        return `<div class="meal-group"><p class="group-title">${group}</p>${rows}</div>`;
      })
      .join('');

    document.getElementById('todayEntries').innerHTML = entriesHtml;
  } catch {
    setState('daySummary', 'Не удалось загрузить сводку. Попробуйте снова.', 'error');
    setState('todayEntries', 'Ошибка загрузки записей. Нажмите обновить страницу.', 'error');
  }
}

function renderWeekChart(days) {
  if (!days.length) return '<div class="feed-empty">Неделя начата — добавьте больше дней, чтобы увидеть тренд.</div>';

  const maxCalories = Math.max(...days.map((d) => Number(d.calories) || 0), 1);

  return `
    <div class="week-chart">
      <div class="chart-bars">
        ${days
          .map((d) => {
            const value = Number(d.calories) || 0;
            const target = Number(d.targetCalories) || 0;
            const height = Math.max(8, Math.round((value / maxCalories) * 92));
            const targetHeight = Math.max(8, Math.round((target / maxCalories) * 92));
            return `
              <div class="bar-wrap">
                <span class="bar-value">${fmt(value)}</span>
                <div style="height: 96px; width: 100%; display:flex; align-items:flex-end; position:relative;">
                  <div class="bar" style="height:${height}px"></div>
                  <div class="bar-target" style="position:absolute; bottom:${targetHeight}px;"></div>
                </div>
                <span class="bar-label">${d.date.slice(5)}</span>
              </div>
            `;
          })
          .join('')}
      </div>
    </div>
  `;
}

async function loadWeek() {
  setState('weekSummary', 'Считаем баланс недели...');
  setState('weekDays', 'Загружаем дни...');

  try {
    const res = await fetch(`/api/summary/week?date=${dateInput.value}`);
    if (!res.ok) throw new Error('week failed');
    const data = await res.json();

    document.getElementById('weekSummary').innerHTML = `
      <span class="zone-badge zone-${data.zone}"><span class="zone-dot"></span>${zoneText(data.zone, data.balance)}</span>
      <div class="small">Период: ${data.startDate} — ${data.endDate}</div>
      ${renderWeekChart(data.days || [])}
    `;

    document.getElementById('weekDays').innerHTML = (data.days || []).length
      ? data.days
          .map(
            (d) => `
              <div class="day-row">
                <div>
                  <div class="entry-title">${d.date}</div>
                  <div class="entry-meta">Цель ${fmt(d.targetCalories)} kcal</div>
                </div>
                <div class="entry-kcal">${fmt(d.calories)} kcal <span class="entry-macros">(${fmt(d.delta)})</span></div>
              </div>
            `
          )
          .join('')
      : '<div class="feed-empty">Неделя начата — добавьте больше дней, чтобы увидеть тренд.</div>';
  } catch {
    setState('weekSummary', 'Не удалось загрузить недельную сводку.', 'error');
    setState('weekDays', 'Не удалось загрузить дни недели.', 'error');
  }
}

async function loadMonth() {
  setState('monthSummary', 'Собираем данные месяца...');
  setState('monthDays', 'Загружаем дни месяца...');

  try {
    const res = await fetch(`/api/summary/month?date=${dateInput.value}`);
    if (!res.ok) throw new Error('month failed');
    const data = await res.json();

    document.getElementById('monthSummary').innerHTML = `
      <div class="metrics">
        <div class="metric"><span class="label">Калории</span><span class="value">${fmt(data.totals.calories)}</span></div>
        <div class="metric"><span class="label">Белки</span><span class="value">${fmt(data.totals.protein)} г</span></div>
        <div class="metric"><span class="label">Жиры</span><span class="value">${fmt(data.totals.fat)} г</span></div>
        <div class="metric"><span class="label">Углеводы</span><span class="value">${fmt(data.totals.carbs)} г</span></div>
      </div>
    `;

    document.getElementById('monthDays').innerHTML = (data.days || []).length
      ? data.days
          .map(
            (d) => `
              <div class="day-row">
                <div>
                  <div class="entry-title">${d.date}</div>
                </div>
                <div class="entry-kcal">${fmt(d.calories)} kcal <span class="entry-macros">Б${fmt(d.protein)} Ж${fmt(d.fat)} У${fmt(d.carbs)}</span></div>
              </div>
            `
          )
          .join('')
      : '<div class="feed-empty">Собираем картину месяца. Вернитесь через пару дней логов.</div>';
  } catch {
    setState('monthSummary', 'Не удалось загрузить сводку месяца.', 'error');
    setState('monthDays', 'Не удалось загрузить дни месяца.', 'error');
  }
}

async function submitQuickLog(text, keepFocus = false) {
  const payload = {
    text: text.trim(),
    date: dateInput.value,
    time: timeInput.value,
    mealType: document.getElementById('mealType').value
  };

  if (!payload.text) return;

  const res = await fetch('/api/log-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    quickLogResult.textContent = 'Не удалось распознать и сохранить запись.';
    return;
  }

  const data = await res.json();
  quickLogResult.innerHTML = `Сохранено <strong>${data.saved_entries}</strong> · ${fmt(data.totals.calories)} kcal, Б${fmt(data.totals.protein)} / Ж${fmt(data.totals.fat)} / У${fmt(data.totals.carbs)} · уверенность <strong>${data.confidence}</strong>`;

  document.getElementById('quickText').value = '';
  document.getElementById('quickTextSticky').value = '';

  await refreshAll();

  if (keepFocus) {
    document.getElementById('quickText').focus();
  }
}

document.getElementById('mealForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    date: dateInput.value,
    time: timeInput.value,
    mealType: document.getElementById('mealType').value,
    foodName: document.getElementById('foodName').value.trim(),
    calories: document.getElementById('calories').value,
    protein: document.getElementById('protein').value,
    fat: document.getElementById('fat').value,
    carbs: document.getElementById('carbs').value,
    notes: document.getElementById('notes').value.trim()
  };

  const res = await fetch('/api/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    alert('Не удалось сохранить запись. Попробуйте ещё раз.');
    return;
  }

  ['foodName', 'calories', 'protein', 'fat', 'carbs', 'notes'].forEach((id) => {
    document.getElementById(id).value = '';
  });

  await refreshAll();
});

document.getElementById('quickLogForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  await submitQuickLog(document.getElementById('quickText').value, false);
});

document.getElementById('saveAndMore').addEventListener('click', async () => {
  await submitQuickLog(document.getElementById('quickText').value, true);
});

document.getElementById('quickLogStickyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  await submitQuickLog(document.getElementById('quickTextSticky').value, false);
});

dateInput.addEventListener('change', refreshAll);

async function refreshAll() {
  await Promise.all([loadToday(), loadWeek(), loadMonth()]);
}

refreshAll();
