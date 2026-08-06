/**
 * app-data.js
 * -----------------------------------------------------------------------
 * Zentrale Datenschicht: Konstanten, Defaults, Storage-Key-Namen.
 * Enthält KEINE Logik und KEINEN State — nur statische Werte.
 * Wird als erstes Skript geladen (vor 01-storage.js).
 * -----------------------------------------------------------------------
 */

const APP_DATA = {
  APP_NAME: 'Tracker',
  APP_VERSION: '0.1.0',

  // Zentrale Storage-Keys (Single Source of Truth für 01-storage.js)
  STORAGE_KEYS: {
    PERIODS: 'tracker_periods_v1',
    THEME: 'tracker_theme_v1',
    SETTINGS: 'tracker_settings_v1',
    PAIN_DAYS: 'tracker_pain_days_v1'
  },

  // Zyklus-Defaults für die spätere Vorhersage-Engine (03-utils.js)
  CYCLE_DEFAULTS: {
    AVERAGE_CYCLE_LENGTH: 28,   // Tage zwischen zwei Periodenstarts
    AVERAGE_PERIOD_LENGTH: 5,   // Tage Regelblutung
    LUTEAL_PHASE_LENGTH: 14,    // Tage zwischen Eisprung und nächster Periode
    MAX_SELECTION_RANGE_DAYS: 12 // Max. Abstand für Drag/Klick-Bereichsauswahl
  },

  // Wochentags-Labels, Montag-first (wie im Kalenderraster verwendet)
  WEEKDAYS_DE: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],

  // Inline-SVGs für die Bottom-Nav (stroke="currentColor" -> folgt automatisch der
  // Textfarbe/den Theme-Variablen, kein externer Icon-Font/CDN nötig -> offlinefest).
  ICONS: {
    NAV_CALENDAR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"></rect><line x1="3" y1="10" x2="21" y2="10"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="16" y1="2" x2="16" y2="6"></line></svg>',
    NAV_CHART: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 8 10 12 14 16 6 21 11"></polyline><line x1="3" y1="21" x2="21" y2="21"></line></svg>',
    NAV_STATS: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 3 v9 h9"></path></svg>',
    IMPORT: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"></path><path d="M7 10l5 5 5-5"></path><path d="M4 21h16"></path></svg>',
    SETTINGS: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>'
  },

  // Auswahl an Akzentfarben für die Design-Sektion in 09-settings.js. Der erste
  // Eintrag entspricht dem Default aus THEME_DEFAULTS weiter unten.
  THEME_ACCENT_PRESETS: [
    { name: 'Orange', value: '#F0923D' },
    { name: 'Pink', value: '#E85D75' },
    { name: 'Blau', value: '#4A90D9' },
    { name: 'Grün', value: '#4CAF7D' },
    { name: 'Lila', value: '#8B6FD9' }
  ],

  // Standard-Farbwerte (Referenzwerte für 09-settings.js, sobald es existiert).
  // Die tatsächlich wirksamen Werte liegen als CSS-Variablen in css/styles.css.
  // Diese Kopie hier dient nur als Fallback/Reset-Referenz für die künftige
  // Farb-Anpassung durch den Nutzer.
  THEME_DEFAULTS: {
    '--color-header-bg': '#3C2E6B',
    '--color-header-text': '#FFFFFF',
    '--color-brand': '#5FD6C0',
    '--color-bg': '#E9F2EA',
    '--color-accent': '#F0923D',
    '--color-text-heading': '#2E2360',
    '--color-text-day': '#4B4B55',
    '--color-period-bg': '#F5D0CB',
    '--color-period-text': '#7A3B34',
    '--color-predicted-rgb': '214, 58, 58',
    '--color-pain': '#8B6FD9',
    '--color-selecting-outline': '#F0923D'
  },

  // Zentrale Liste aller Stats-/Chart-Elemente, die per langem Druck ausgeblendet
  // werden können (siehe hideItem()/showItem() in 02-state-theme.js). Jede id
  // taucht als data-vis-id im jeweiligen Karten-Markup auf (08-stats-progress.js,
  // 07-chart.js) UND als Zeile in der "Sichtbare Bereiche"-Liste in den
  // Einstellungen (09-settings.js) — eine Quelle für beide Stellen, damit nichts
  // auseinanderlaufen kann.
  VISIBILITY_ITEMS: [
    { id: 'stat-avgCycle', label: 'Ø Zykluslänge (Stats)' },
    { id: 'stat-avgPeriod', label: 'Ø Periodendauer (Stats)' },
    { id: 'stat-regularity', label: 'Regelmäßigkeit (Stats)' },
    { id: 'stat-lastPeriod', label: 'Letzte Periode (Stats)' },
    { id: 'stat-nextPeriod', label: 'Nächste Periode (Stats)' },
    { id: 'stat-fertileWindow', label: 'Fruchtbares Fenster (Stats)' },
    { id: 'stat-ovulation', label: 'Geschätzter Eisprung (Stats)' },
    { id: 'stat-painTotal', label: 'Schmerztage insgesamt (Stats)' },
    { id: 'chart-periodLength', label: 'Periodendauer-Diagramm (Chart)' },
    { id: 'chart-cycleLength', label: 'Zykluslängen-Diagramm (Chart)' },
    { id: 'chart-painPhase', label: 'Schmerztage-nach-Phase-Diagramm (Chart)' }
  ]
};
