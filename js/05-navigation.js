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
   renderChartView() liegt in 07-chart.js (siehe dort für die SVG-Diagramme).
--------------------------------------------------- */
/* Klick auf den "Tracker"-Schriftzug oben links: auf dem Kalender selbst nur zum
   aktuellen Monat zurueckscrollen (kein unnoetiger Re-Render/History-Eintrag),
   von Chart/Stats aus normal zum Kalender wechseln (der scrollt beim Rendern
   ohnehin automatisch zum aktuellen Monat, siehe renderCalendarView()). */
function goCalendarHome(){
  if (document.getElementById('calendarScroll')){
    scrollToCurrentMonth();
  } else {
    goCalendar();
  }
}

function goCalendar(push){ if (push !== false) pushView('calendar'); renderCalendarView(); }
function goChart(push){ if (push !== false) pushView('chart'); renderChartView(); }
function goStats(push){ if (push !== false) pushView('stats'); renderStatsView(); }

function renderViewByState(state){
  switch (state.view){
    case 'chart': renderChartView(); break;
    case 'stats': renderStatsView(); break;
    case 'import': renderImportView(); break;
    case 'settings': renderSettingsView(); break;
    case 'calendar':
    default: renderCalendarView();
  }
}

window.addEventListener('popstate', (event) => {
  const state = event.state || { view: 'calendar' };
  renderViewByState(state);
});
