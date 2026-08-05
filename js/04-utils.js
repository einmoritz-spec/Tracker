/* ---------------------------------------------------
   Utils (Datum)
   Reine Helferfunktionen, kein State, kein DOM-Rendering.
--------------------------------------------------- */
function pad2(n){ return n < 10 ? '0' + n : String(n); }

/** Date -> 'YYYY-MM-DD' (lokale Zeit, keine UTC-Verschiebung) */
function formatISODate(date){
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
}

/** 'YYYY-MM-DD' -> Date (lokale Zeit, 00:00 Uhr) */
function parseISODate(iso){
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isSameDay(a, b){
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isToday(date){ return isSameDay(date, new Date()); }

function addDays(date, n){
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Ganzzahlige Differenz in Tagen (b - a), unabhängig von Uhrzeit/Zeitumstellung */
function daysBetween(a, b){
  const msPerDay = 24 * 60 * 60 * 1000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / msPerDay);
}

function getMonthLabel(year, month0){
  const label = new Date(year, month0, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** year/month0 (0-basiert) um n Monate verschieben -> { year, month } */
function shiftYearMonth(year, month0, n){
  const d = new Date(year, month0 + n, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

/* ---------------------------------------------------
   Vorhersage-Engine
   Reine Funktion: bekommt die gespeicherten Perioden + "heute" übergeben,
   liefert ein fertig berechnetes Stats-Objekt zurück. Kein State-Zugriff,
   kein DOM — die Stats-View (09-stats-progress.js) übernimmt nur noch die
   Darstellung. Umfang wie besprochen: Ø Zykluslänge/-dauer über ALLE
   vorhandenen Zyklen, Vorhersage nächste Periode, Eisprung- & Fruchtbares-
   Fenster-Schätzung (rückwärts von der Lutealphase, siehe APP_DATA.CYCLE_
   DEFAULTS.LUTEAL_PHASE_LENGTH — deutlich konstanter als die Follikelphase).
--------------------------------------------------- */
function average(numbers){
  if (!numbers.length) return null;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function computeCycleStats(periods, today){
  const sorted = [...periods].sort((a, b) => a.start.localeCompare(b.start));
  if (!sorted.length){
    return { hasData: false, hasPrediction: false };
  }

  // Zykluslänge = Abstand zwischen zwei aufeinanderfolgenden Periodenstarts.
  // Braucht mind. 2 Perioden -> bei nur 1 gespeicherten Periode ist dieses
  // Array leer, hasPrediction wird dann false.
  const cycleLengths = [];
  for (let i = 0; i < sorted.length - 1; i++){
    cycleLengths.push(daysBetween(parseISODate(sorted[i].start), parseISODate(sorted[i + 1].start)));
  }
  const periodLengths = sorted.map(p => daysBetween(parseISODate(p.start), parseISODate(p.end)) + 1);

  const hasPrediction = cycleLengths.length > 0;
  // Ohne eigene Zyklusdaten auf den App-weiten Erfahrungswert zurückfallen
  // (28/5 Tage, siehe APP_DATA.CYCLE_DEFAULTS), damit Eisprung/Fenster auch
  // nach der allerersten Periode schon eine grobe Schätzung zeigen können.
  const avgCycleLength = Math.round(average(cycleLengths) ?? APP_DATA.CYCLE_DEFAULTS.AVERAGE_CYCLE_LENGTH);
  const avgPeriodLength = Math.round(average(periodLengths) ?? APP_DATA.CYCLE_DEFAULTS.AVERAGE_PERIOD_LENGTH);

  const lastPeriod = sorted[sorted.length - 1];
  const lastPeriodStart = parseISODate(lastPeriod.start);

  const ovulationCycleDay = avgCycleLength - APP_DATA.CYCLE_DEFAULTS.LUTEAL_PHASE_LENGTH;
  const ovulationDate = addDays(lastPeriodStart, ovulationCycleDay - 1);
  // Fenster = Spermien-Überlebenszeit (~5 Tage vor Eisprung) + Eizell-Lebensdauer (~1 Tag danach)
  const fertileStart = addDays(ovulationDate, -5);
  const fertileEnd = addDays(ovulationDate, 1);
  const nextPeriodStart = hasPrediction ? addDays(lastPeriodStart, avgCycleLength) : null;

  const currentCycleDay = daysBetween(lastPeriodStart, today) + 1;
  const todayISO = formatISODate(today);
  const inCurrentPeriod = sorted.some(p => todayISO >= p.start && todayISO <= p.end);
  const inFertileWindow = todayISO >= formatISODate(fertileStart) && todayISO <= formatISODate(fertileEnd);

  let currentPhase;
  if (inCurrentPeriod) currentPhase = 'Menstruation';
  else if (inFertileWindow) currentPhase = 'Fruchtbares Fenster';
  else if (currentCycleDay < ovulationCycleDay) currentPhase = 'Follikelphase';
  else currentPhase = 'Lutealphase';

  return {
    hasData: true,
    hasPrediction,
    cycleCount: cycleLengths.length,
    avgCycleLength,
    avgPeriodLength,
    lastPeriodStart,
    nextPeriodStart,
    ovulationDate,
    fertileStart,
    fertileEnd,
    currentCycleDay,
    currentPhase
  };
}
