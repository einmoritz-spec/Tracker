/* ---------------------------------------------------
   APP-INIT
   Letztes Skript im Ladeauftrag (ohne defer, daher ist die Reihenfolge der
   <script>-Tags in index.html verbindlich). DOM ist zu diesem Zeitpunkt
   bereits geparst, da die Tags am Ende von <body> stehen.
--------------------------------------------------- */
function initApp(){
  State.periods = loadPeriods();
  applyThemeVars(loadThemeOverrides());

  // Bei einem Reload überlebt history.state für den aktuellen Verlaufseintrag
  // (siehe pushView/replaceView in 06-navigation.js) — so bleibt man z.B. nach
  // einem Reload auf "Stats" statt immer auf den Kalender zurückzuspringen.
  if (history.state && history.state.view){
    renderViewByState(history.state);
  } else {
    replaceView('calendar');
    renderCalendarView();
  }
}

initApp();
