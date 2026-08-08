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
    SETTINGS: 'tracker_settings_v1'
  },

  // Zyklus-Defaults für die spätere Vorhersage-Engine (04-utils.js)
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
    SETTINGS: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>'
  },

  // Auswählbare Farbthemen (13-settings.js). Jedes Theme liefert ALLE themefähigen
  // CSS-Variablen (siehe :root in css/styles.css) — ausgewählte Werte werden 1:1 als
  // Overrides gespeichert (01-storage.js) und über applyThemeVars() (02-state-theme.js)
  // gesetzt. Gemeinsame Idee aller Themes: ruhige, entsättigte Erdtöne statt der alten
  // knalligen Lila/Mint/Orange-Kombination — nichts soll "laut" wirken.
  // 'sand' ist das Standard-Theme (siehe DEFAULT_THEME_ID unten und :root-Defaults
  // in css/styles.css, die bewusst mit den sand-Werten übereinstimmen).
  THEME_PRESETS: [
    {
      id: 'sand',
      name: 'Sand',
      swatch: ['#C97B4A', '#F2E9DE', '#6B5744'],
      vars: {
        '--color-header-bg': '#6B5744',
        '--color-header-text': '#FBF6F0',
        '--color-brand': '#D9A679',
        '--color-bg': '#F2E9DE',
        '--color-surface': '#FBF6F0',
        '--color-accent': '#C97B4A',
        '--color-text-heading': '#4A3B2E',
        '--color-text-day': '#6B5D4F',
        '--color-text-muted': '#A79484',
        '--color-period-bg': '#E8C9B8',
        '--color-period-text': '#7A4A34',
        '--color-selecting-outline': '#C97B4A',
        '--color-nav-inactive': '#B8AA9A'
      }
    },
    {
      id: 'wald',
      name: 'Wald',
      swatch: ['#7A8F5C', '#EDF0E6', '#2F3B2A'],
      vars: {
        '--color-header-bg': '#2F3B2A',
        '--color-header-text': '#EDF0E6',
        '--color-brand': '#9CB68A',
        '--color-bg': '#EDF0E6',
        '--color-surface': '#FFFFFF',
        '--color-accent': '#7A8F5C',
        '--color-text-heading': '#2F3B2A',
        '--color-text-day': '#4C5645',
        '--color-text-muted': '#8B9483',
        '--color-period-bg': '#D8C9A3',
        '--color-period-text': '#6B5233',
        '--color-selecting-outline': '#7A8F5C',
        '--color-nav-inactive': '#A8AE9F'
      }
    },
    {
      id: 'ton',
      name: 'Ton',
      swatch: ['#B5583A', '#F5E6DA', '#5C3A2E'],
      vars: {
        '--color-header-bg': '#5C3A2E',
        '--color-header-text': '#F5E6DA',
        '--color-brand': '#E3A87C',
        '--color-bg': '#F5E6DA',
        '--color-surface': '#FFFBF7',
        '--color-accent': '#B5583A',
        '--color-text-heading': '#4A2E22',
        '--color-text-day': '#6E5347',
        '--color-text-muted': '#A6897B',
        '--color-period-bg': '#EAC5B8',
        '--color-period-text': '#7A3C2A',
        '--color-selecting-outline': '#B5583A',
        '--color-nav-inactive': '#C2AA9C'
      }
    },
    {
      id: 'stein',
      name: 'Stein',
      swatch: ['#9C8768', '#EDEAE3', '#4B4A45'],
      vars: {
        '--color-header-bg': '#4B4A45',
        '--color-header-text': '#FAF9F6',
        '--color-brand': '#BFAF9A',
        '--color-bg': '#EDEAE3',
        '--color-surface': '#FAF9F6',
        '--color-accent': '#9C8768',
        '--color-text-heading': '#3C3A35',
        '--color-text-day': '#5C594F',
        '--color-text-muted': '#96917F',
        '--color-period-bg': '#DCCFC0',
        '--color-period-text': '#6E5A44',
        '--color-selecting-outline': '#9C8768',
        '--color-nav-inactive': '#B1AC9E'
      }
    }
  ],
  DEFAULT_THEME_ID: 'sand'
};
