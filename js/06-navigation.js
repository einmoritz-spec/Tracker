/* ---------------------------------------------------
   NAVIGATION (Bottom-Nav + Android-/Browser-Zurück-Taste)
   Gleiches Grundmuster wie in der Trainings-App: history.pushState pro
   Tab-Wechsel, ein globaler popstate-Handler rendert die passende View neu,
   damit die Hardware-/Browser-Zurück-Taste zwischen den Tabs statt aus der
   App heraus navigiert.
--------------------------------------------------- */

function pushView(view){
  history.pushState({ view }, '', '');
}
function replaceView(view){
  history.replaceState({ view }, '', '');
}

function bottomNavHTML(active){
  const tab = (id, label, icon) => `
    <button type="button" class="nav-tab${active === id ? ' is-active' : ''}" data-tab="${id}">
      <span class="nav-tab-icon">${icon}</span>
      <span class="nav-tab-label">${label}</span>
    </button>
  `;
  return `
    <nav class="bottom-nav">
      ${tab('calendar', 'Kalender', APP_DATA.ICONS.NAV_CALENDAR)}
      ${tab('chart', 'Chart', APP_DATA.ICONS.NAV_CHART)}
      ${tab('stats', 'Stats', APP_DATA.ICONS.NAV_STATS)}
    </nav>
  `;
}

function wireBottomNav(){
  document.querySelectorAll('.bottom-nav .nav-tab').forEach(btn => {
    btn.onclick = () => {
      const tab = btn.dataset.tab;
      if (tab === 'calendar') goCalendar();
      else if (tab === 'chart') goChart();
      else if (tab === 'stats') goStats();
    };
  });
}

/* ---------------------------------------------------
   Platzhalter-View für Chart.
   TODO: Sobald das Konzept für Inhalte/Berechnung feststeht (siehe Absprache
   im Chat), in eigene 07-chart.js auslagern. Bis dahin hier, um keine leere
   Modul-Datei ohne Inhalt anzulegen. renderStatsView() liegt bereits fertig
   in 09-stats-progress.js, da der Umfang dafür geklärt ist.
--------------------------------------------------- */
function renderChartView(){
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="app-header"><span class="app-title">${APP_DATA.APP_NAME}</span></header>
    <div class="placeholder-content">
      <p class="placeholder-title">Chart</p>
      <p class="placeholder-text">Hier entsteht als Nächstes der Verlauf von Zykluslänge und Periodendauer über die Zeit.</p>
    </div>
    ${bottomNavHTML('chart')}
  `;
  wireBottomNav();
}

function goCalendar(push){ if (push !== false) pushView('calendar'); renderCalendarView(); }
function goChart(push){ if (push !== false) pushView('chart'); renderChartView(); }
function goStats(push){ if (push !== false) pushView('stats'); renderStatsView(); }

function renderViewByState(state){
  switch (state.view){
    case 'chart': renderChartView(); break;
    case 'stats': renderStatsView(); break;
    case 'import': renderImportView(); break;
    case 'calendar':
    default: renderCalendarView();
  }
}

window.addEventListener('popstate', (event) => {
  const state = event.state || { view: 'calendar' };
  renderViewByState(state);
});
