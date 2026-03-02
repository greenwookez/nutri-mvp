if (window.__nutriAppInitialized) {
  console.warn('Nutri app already initialized, skipping duplicate listeners.');
} else {
  window.__nutriAppInitialized = true;

  const dateInput = document.getElementById('date');
  const mealDateInput = document.getElementById('mealDate');
  const mealTimeInput = document.getElementById('mealTime');
  const addMealModal = document.getElementById('addMealModal');

  const today = new Date();
  dateInput.value = formatLocalDate(today);
  mealDateInput.value = dateInput.value;
  mealTimeInput.value = currentTimeHHMM();

  for (const tab of document.querySelectorAll('.tab')) {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.view).classList.add('active');
    });
  }

  document.getElementById('openAddMealModal').addEventListener('click', openAddMealModal);
  document.getElementById('closeAddMealModal').addEventListener('click', closeAddMealModal);
  document.getElementById('cancelAddMealModal').addEventListener('click', closeAddMealModal);

  addMealModal.addEventListener('click', (e) => {
    const rect = addMealModal.getBoundingClientRect();
    const clickedOnBackdrop =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;

    if (clickedOnBackdrop) closeAddMealModal();
  });

  document.getElementById('prevDay').addEventListener('click', () => shiftDate(-1));
  document.getElementById('nextDay').addEventListener('click', () => shiftDate(1));

  function parseLocalDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function shiftDate(deltaDays) {
    const sourceDate = dateInput.value ? parseLocalDate(dateInput.value) : new Date();
    sourceDate.setDate(sourceDate.getDate() + deltaDays);
    dateInput.value = formatLocalDate(sourceDate);
    refreshAll();
  }

  function currentTimeHHMM() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  function openAddMealModal() {
    mealDateInput.value = dateInput.value;
    mealTimeInput.value = currentTimeHHMM();
    if (!addMealModal.open) {
      addMealModal.showModal();
    }
    document.getElementById('foodName').focus();
  }

  function closeAddMealModal() {
    if (addMealModal.open) {
      addMealModal.close();
    }
  }

  function fmtCalories(value) {
    return Math.round(Number(value) || 0);
  }

  function fmtMacro(value) {
    return (Math.round((Number(value) || 0) * 10) / 10).toFixed(1);
  }

  function mealTypeLabel(type) {
    const labels = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack',
      other: 'Other'
    };
    return labels[type] || type;
  }

  function budgetZone(remainingCalories) {
    if (remainingCalories < -200) return 'red';
    if (remainingCalories < 0) return 'orange';
    return 'green';
  }

  function budgetZoneText(zone, budget) {
    const abs = Math.abs(fmtCalories(budget));
    if (zone === 'green') return `Within budget · ${abs} kcal remaining`;
    if (zone === 'red') return `Over budget · ${abs} kcal over`;
    return `Close to budget · ${abs} kcal over`;
  }

  function weekZoneText(zone, balance) {
    const abs = Math.abs(fmtCalories(balance));
    if (zone === 'green') return `Good weekly balance · ${abs} kcal under target`;
    if (zone === 'red') return `Weekly overage · ${abs} kcal above target`;
    return `Near weekly target · ${abs} kcal difference`;
  }

  function setState(containerId, text, type = 'info') {
    document.getElementById(containerId).innerHTML = `<div class="state-box state-${type}">${text}</div>`;
  }

  async function loadToday() {
    const date = dateInput.value;
    setState('daySummary', 'Loading summary...');
    setState('todayEntries', 'Loading entries...');

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

      const consumed = fmtCalories(summary.totals.calories);
      const target = fmtCalories(summary.targetCalories || 2200);
      const active = fmtCalories(summary.activeCalories || 0);
      const budget = target + active - consumed;
      const zone = budgetZone(budget);

      document.getElementById('daySummary').innerHTML = `
        <div class="kpi-main">${budget} kcal</div>
        <p class="kpi-delta">Consumed ${consumed} · Baseline target ${target} · Activity ${active}</p>
        <div class="kpi-macros">
          <div class="macro-pill"><span class="macro-name">Protein</span><strong>${fmtMacro(summary.totals.protein)} g</strong></div>
          <div class="macro-pill"><span class="macro-name">Fat</span><strong>${fmtMacro(summary.totals.fat)} g</strong></div>
          <div class="macro-pill"><span class="macro-name">Carbs</span><strong>${fmtMacro(summary.totals.carbs)} g</strong></div>
        </div>
        <span class="zone-badge zone-${zone}"><span class="zone-dot"></span>${budgetZoneText(zone, budget)}</span>
      `;

      if (!entries.length) {
        document.getElementById('todayEntries').innerHTML = '<div class="feed-empty">No entries yet. Add your first meal.</div>';
        return;
      }

      const grouped = entries.reduce((acc, e) => {
        const type = mealTypeLabel(e.meal_type);
        if (!acc[type]) acc[type] = [];
        acc[type].push(e);
        return acc;
      }, {});

      const groupOrder = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other'];

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
                    <div class="entry-kcal">${fmtCalories(e.calories)} kcal</div>
                    <div class="entry-macros">P ${fmtMacro(e.protein)} · F ${fmtMacro(e.fat)} · C ${fmtMacro(e.carbs)}</div>
                    <button class="delete-entry" data-id="${e.id}" type="button">Delete</button>
                  </div>
                </div>`
            )
            .join('');

          return `<div class="meal-group"><p class="group-title">${group}</p>${rows}</div>`;
        })
        .join('');

      document.getElementById('todayEntries').innerHTML = entriesHtml;
    } catch {
      setState('daySummary', 'Could not load summary. Please try again.', 'error');
      setState('todayEntries', 'Could not load entries. Refresh the page and retry.', 'error');
    }
  }

  function renderWeekChart(days) {
    if (!days.length) return '<div class="feed-empty">Week started. Add more days to see trend.</div>';

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
                  <span class="bar-value">${fmtCalories(value)}</span>
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
    setState('weekSummary', 'Calculating weekly balance...');
    setState('weekDays', 'Loading days...');

    try {
      const res = await fetch(`/api/summary/week?date=${dateInput.value}`);
      if (!res.ok) throw new Error('week failed');
      const data = await res.json();

      document.getElementById('weekSummary').innerHTML = `
        <span class="zone-badge zone-${data.zone}"><span class="zone-dot"></span>${weekZoneText(data.zone, data.balance)}</span>
        <div class="small">Period: ${data.startDate} — ${data.endDate}</div>
        ${renderWeekChart(data.days || [])}
      `;

      document.getElementById('weekDays').innerHTML = (data.days || []).length
        ? data.days
            .map(
              (d) => `
                <div class="day-row">
                  <div>
                    <div class="entry-title">${d.date}</div>
                    <div class="entry-meta">Target ${fmtCalories(d.targetCalories)} kcal</div>
                  </div>
                  <div class="entry-kcal">${fmtCalories(d.calories)} kcal <span class="entry-macros">(${fmtCalories(d.delta)})</span></div>
                </div>
              `
            )
            .join('')
        : '<div class="feed-empty">Week started. Add more days to see trend.</div>';
    } catch {
      setState('weekSummary', 'Could not load weekly summary.', 'error');
      setState('weekDays', 'Could not load week days.', 'error');
    }
  }

  async function loadMonth() {
    setState('monthSummary', 'Building monthly summary...');
    setState('monthDays', 'Loading month days...');

    try {
      const res = await fetch(`/api/summary/month?date=${dateInput.value}`);
      if (!res.ok) throw new Error('month failed');
      const data = await res.json();

      document.getElementById('monthSummary').innerHTML = `
        <div class="metrics">
          <div class="metric"><span class="label">Calories</span><span class="value">${fmtCalories(data.totals.calories)}</span></div>
          <div class="metric"><span class="label">Protein</span><span class="value">${fmtMacro(data.totals.protein)} g</span></div>
          <div class="metric"><span class="label">Fat</span><span class="value">${fmtMacro(data.totals.fat)} g</span></div>
          <div class="metric"><span class="label">Carbs</span><span class="value">${fmtMacro(data.totals.carbs)} g</span></div>
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
                  <div class="entry-kcal">${fmtCalories(d.calories)} kcal <span class="entry-macros">P${fmtMacro(d.protein)} F${fmtMacro(d.fat)} C${fmtMacro(d.carbs)}</span></div>
                </div>
              `
            )
            .join('')
        : '<div class="feed-empty">Not enough data yet. Add logs to build your monthly view.</div>';
    } catch {
      setState('monthSummary', 'Could not load monthly summary.', 'error');
      setState('monthDays', 'Could not load month days.', 'error');
    }
  }

  document.getElementById('mealForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      date: mealDateInput.value,
      time: mealTimeInput.value,
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
      alert('Could not save entry. Please try again.');
      return;
    }

    ['foodName', 'calories', 'protein', 'fat', 'carbs', 'notes'].forEach((id) => {
      document.getElementById(id).value = '';
    });
    document.getElementById('mealType').value = '';

    dateInput.value = mealDateInput.value;
    closeAddMealModal();
    await refreshAll();
  });

  document.getElementById('todayEntries').addEventListener('click', async (e) => {
    const btn = e.target.closest('.delete-entry');
    if (!btn) return;

    const id = btn.dataset.id;
    if (!id) return;

    if (!confirm('Delete this entry?')) return;

    const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('Failed to delete entry');
      return;
    }

    await refreshAll();
  });

  dateInput.addEventListener('change', () => {
    mealDateInput.value = dateInput.value;
    refreshAll();
  });

  async function refreshAll() {
    await Promise.all([loadToday(), loadWeek(), loadMonth()]);
  }

  refreshAll();
}
