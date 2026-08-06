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
    earliestLoaded: null,        // { year, month } ältester geladener Monat
    latestLoaded: null,          // { year, month } neuester geladener Monat
    selection: { start: null }   // laufende Klick-Auswahl (ISO-Datum) für Perioden-Eingabe
  },

  today: new Date(),

  // Nutzer-Einstellungen (09-settings.js). colorScheme: 'light' | 'dark' | 'system'.
  // hiddenItems: Array von IDs aus APP_DATA.VISIBILITY_ITEMS, die per langem Druck
  // ausgeblendet wurden (siehe hideItem()/showItem() unten).
  // Wird in initApp() (10-app-init.js) mit dem gespeicherten Wert aus loadSettings()
  // überschrieben; die Defaults hier gelten nur für Erstinstallationen.
  settings: { colorScheme: 'system', hiddenItems: [] },

  // Set von ISO-Daten, die per langem Druck auf eine Tageszelle als Schmerztag
  // markiert wurden (siehe handleDayLongPress() in 04-calendar.js). Wird in
  // initApp() aus loadPainDays() befüllt.
  painDays: new Set()
};

/**
 * Setzt Hell/Dunkel über ein data-Attribut auf <html> — die dunklen Varianten der
 * Farb-Variablen liegen als :root[data-theme="dark"]-Block in css/styles.css.
 * Bei 'system' wird die Betriebssystem-Einstellung per prefers-color-scheme gelesen.
 */
function applyColorScheme(mode){
  const resolved = mode === 'system'
    ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;
  document.documentElement.dataset.theme = resolved;
  State.settings.colorScheme = mode;
}

/**
 * Wendet Theme-Overrides (falls vom Nutzer in einer künftigen 09-settings.js
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

/* ---------------------------------------------------
   SICHTBARKEIT VON STATS-/CHART-ELEMENTEN
   Jede Karte/Zeile in Stats und Chart kann per langem Druck ausgeblendet
   werden (siehe attachLongPress() unten, verwendet in 08-stats-progress.js
   und 07-chart.js) und in den Einstellungen unter "Sichtbare Bereiche"
   wieder eingeblendet werden (09-settings.js). Die IDs kommen zentral aus
   APP_DATA.VISIBILITY_ITEMS. Persistiert als Teil von State.settings, also
   über dieselbe loadSettings()/saveSettings()-Ablage wie das Farbschema.
--------------------------------------------------- */
function isItemHidden(id){
  return (State.settings.hiddenItems || []).includes(id);
}

function hideItem(id){
  const hidden = new Set(State.settings.hiddenItems || []);
  hidden.add(id);
  State.settings.hiddenItems = Array.from(hidden);
  saveSettings(State.settings);
}

function showItem(id){
  const hidden = new Set(State.settings.hiddenItems || []);
  hidden.delete(id);
  State.settings.hiddenItems = Array.from(hidden);
  saveSettings(State.settings);
}

/** Registriert Long-Press (500ms Pointer-Halten, bricht bei >10px Bewegung ab —
    gleiches Timing wie der Schmerztag-Long-Press im Kalender, 04-calendar.js,
    aber als eigenständige, wiederverwendbare Version für einzelne Elemente statt
    einen delegierten Container-Handler) auf einem einzelnen Element. Pointer
    Events statt separater Touch-/Maus-Handler, deckt beides ab. Unterdrückt den
    direkt folgenden Klick, damit kein onClick auf demselben Element danach
    zusätzlich feuert. */
function attachLongPress(el, onLongPress, duration){
  let timer = null;
  let startX = 0, startY = 0;
  let triggered = false;

  const cancelTimer = () => { if (timer) clearTimeout(timer); timer = null; };

  el.addEventListener('pointerdown', (e) => {
    startX = e.clientX; startY = e.clientY;
    triggered = false;
    cancelTimer();
    timer = setTimeout(() => { triggered = true; onLongPress(); }, duration ?? 500);
  });
  el.addEventListener('pointermove', (e) => {
    if (!timer) return;
    if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) cancelTimer();
  });
  el.addEventListener('pointerup', cancelTimer);
  el.addEventListener('pointercancel', cancelTimer);
  el.addEventListener('click', (e) => {
    if (triggered){
      e.preventDefault();
      e.stopPropagation();
      triggered = false;
    }
  }, true);
}

/** Sucht innerhalb von `root` alle Elemente mit einem data-vis-id-Attribut und
    hängt attachLongPress() dran: beim Auslösen wird das Element ausgeblendet
    und ein kurzer Toast als Bestätigung/Hinweis auf die Einstellungen gezeigt,
    danach rerenderFn() aufgerufen, damit die Karte sofort verschwindet. */
function wireVisibilityLongPress(root, rerenderFn){
  root.querySelectorAll('[data-vis-id]').forEach(el => {
    attachLongPress(el, () => {
      const id = el.dataset.visId;
      hideItem(id);
      const item = APP_DATA.VISIBILITY_ITEMS.find(i => i.id === id);
      showToast((item ? item.label : 'Element') + ' ausgeblendet — in den Einstellungen wieder einblendbar');
      rerenderFn();
    });
  });
}

/** Kurzer, selbst verschwindender Hinweistext unten im Bildschirm (kein Tap zum
    Wegwischen nötig) — Feedback für Aktionen ohne eigene Ergebnis-Ansicht, wie
    das Ausblenden per langem Druck oben. */
function showToast(text){
  const el = document.createElement('div');
  el.className = 'visibility-toast';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
