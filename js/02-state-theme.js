/**
 * 02-state-theme.js
 * -----------------------------------------------------------------------
 * Einzige Quelle für globalen State. Tiefere Module (05, 06, ...) lesen
 * und schreiben ausschließlich über das State-Objekt, legen aber NIE neue
 * globale Variablen an.
 * -----------------------------------------------------------------------
 */

const State = {
  // Geladene Perioden-Einträge: [{ id, start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }]
  periods: [],

  // Aktive Tab-View: 'calendar' | 'chart' | 'stats'
  currentView: 'calendar',

  // Kalender-Laufzeitstatus
  calendar: {
    loadedYears: new Set(),      // Jahre, die aktuell im DOM gerendert sind
    earliestLoaded: null,        // { year, month } ältester geladener Monat
    latestLoaded: null,          // { year, month } neuester geladener Monat
    selection: { start: null }   // laufende Klick-Auswahl (ISO-Datum) für Perioden-Eingabe
  },

  today: new Date()
};

/**
 * Wendet Theme-Overrides (falls vom Nutzer in einer künftigen 13-settings.js
 * gesetzt) als CSS-Custom-Properties auf :root an. Ohne Overrides gelten die
 * Defaults aus css/styles.css unverändert.
 */
function applyThemeVars(overrides) {
  if (!overrides || typeof overrides !== 'object') return;
  const root = document.documentElement;
  Object.keys(overrides).forEach(key => {
    if (key.startsWith('--')) {
      root.style.setProperty(key, overrides[key]);
    }
  });
}
