/* ---------------------------------------------------
   APP-INIT
   Letztes Skript im Ladeauftrag (ohne defer, daher ist die Reihenfolge der
   <script>-Tags in index.html verbindlich). DOM ist zu diesem Zeitpunkt
   bereits geparst, da die Tags am Ende von <body> stehen.
--------------------------------------------------- */
function initApp(){
  State.periods = loadPeriods();
  State.painDays = new Set(loadPainDays());
  State.settings = { ...State.settings, ...loadSettings() };
  if (!Array.isArray(State.settings.hiddenItems)) State.settings.hiddenItems = [];
  applyColorScheme(State.settings.colorScheme || 'system');
  applyThemeVars(loadThemeOverrides());

  // Bei 'system' live auf eine OS-Umschaltung zwischen Hell/Dunkel reagieren
  // (z.B. automatischer Wechsel bei Sonnenuntergang), ohne dass die App neu
  // geladen werden muss.
  if (window.matchMedia){
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (State.settings.colorScheme === 'system') applyColorScheme('system');
    });
  }

  // Bei einem Reload überlebt history.state für den aktuellen Verlaufseintrag
  // (siehe pushView/replaceView in 05-navigation.js) — so bleibt man z.B. nach
  // einem Reload auf "Stats" statt immer auf den Kalender zurückzuspringen.
  if (history.state && history.state.view){
    renderViewByState(history.state);
  } else {
    replaceView('calendar');
    renderCalendarView();
  }
}

initApp();
