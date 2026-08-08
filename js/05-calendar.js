/* ---------------------------------------------------
   KALENDER (Startseite)
   Fortlaufende Monatsliste (wie 05-calendar.js der Trainings-App), aber in
   BEIDE Richtungen per IntersectionObserver nachladbar (dort nur abwärts).
   Start: das gesamte aktuelle Kalenderjahr, danach automatisches Scrollen
   zum aktuellen Monat. Sobald mehr als ein Jahr geladen ist (durch Scrollen
   ODER weil echte Daten aus einem Vorjahr existieren), erscheint oben eine
   Jahres-Pillenleiste zum direkten Springen — s. updateYearNav().

   Klick-Logik zum Eintragen einer Periode:
   1. Klick auf leeren Tag  -> setzt Perioden-START (State.calendar.selection.start)
   2. Klick auf Folgetag (0–12 Tage nach dem Start) -> füllt den Bereich als
      Periode und speichert ihn (01-storage.js)
   3. Klick auf einen Tag VOR dem Start oder MEHR als 12 Tage danach
      -> verwirft die alte Auswahl, der geklickte Tag wird der neue Start
   4. Klick auf einen bereits markierten Tag (keine laufende Auswahl aktiv)
      -> löscht den Eintrag wieder (einzige Korrekturmöglichkeit, solange es
      noch keine eigene Tagesdetail-Ansicht/08-log-day.js gibt)
--------------------------------------------------- */

// Nur Lade-Guards für den Infinite-Scroll, kein Anwendungs-State (der liegt
// ausschließlich in State.calendar, siehe 02-state-theme.js).
let calendarLoadingPrev = false;
let calendarLoadingNext = false;
let calendarTopObserver = null;
let calendarBottomObserver = null;

function findPeriodForDate(iso){
  return State.periods.find(p => iso >= p.start && iso <= p.end) || null;
}

function dayCellClasses(iso, date){
  const classes = ['day-cell'];
  if (isToday(date)) classes.push('is-today');
  if (findPeriodForDate(iso)) classes.push('has-period');
  if (State.calendar.selection.start === iso) classes.push('is-selecting');
  return classes.join(' ');
}

function monthBlockHTML(year, month0){
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const firstWeekday = (new Date(year, month0, 1).getDay() + 6) % 7; // 0 = Montag

  const weekdayLabelsHTML = APP_DATA.WEEKDAYS_DE.map(l => `<span class="weekday-label">${l}</span>`).join('');
  const blanksHTML = Array.from({ length: firstWeekday }, () => `<span class="day-cell empty"></span>`).join('');
  const dayCellsHTML = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(year, month0, day);
    const iso = formatISODate(date);
    return `<button type="button" class="${dayCellClasses(iso, date)}" data-date="${iso}">${day}</button>`;
  }).join('');

  return `
    <section class="month-block" data-year="${year}" data-month="${month0}">
      <h2 class="month-title">${getMonthLabel(year, month0)}</h2>
      <div class="weekday-row">${weekdayLabelsHTML}</div>
      <div class="days-grid">${blanksHTML}${dayCellsHTML}</div>
    </section>
  `;
}

/** Aktualisiert nur die Zustands-Klassen bestehender Tageszellen (kein Neuaufbau des HTML) —
    günstig genug, um nach jedem Klick über ALLE geladenen Monate zu laufen. */
function refreshDayCellClasses(){
  document.querySelectorAll('#calendarMonths .day-cell[data-date]').forEach(btn => {
    const iso = btn.dataset.date;
    const date = parseISODate(iso);
    btn.className = dayCellClasses(iso, date);
  });
}

function handleDayClick(iso){
  const clickedDate = parseISODate(iso);
  const existingPeriod = findPeriodForDate(iso);
  const selectionStart = State.calendar.selection.start;

  if (!selectionStart){
    if (existingPeriod){
      State.periods = deletePeriodEntry(existingPeriod.id);
    } else {
      State.calendar.selection.start = iso;
    }
  } else {
    const startDate = parseISODate(selectionStart);
    const diff = daysBetween(startDate, clickedDate);
    if (diff < 0 || diff > APP_DATA.CYCLE_DEFAULTS.MAX_SELECTION_RANGE_DAYS){
      // Vor dem Start oder mehr als 12 Tage danach geklickt -> neuer Start statt Bereich
      State.calendar.selection.start = iso;
    } else {
      addPeriodEntry(selectionStart, iso);
      State.periods = loadPeriods();
      State.calendar.selection.start = null;
    }
  }
  refreshDayCellClasses();
}

// Ein delegierter Klick-Handler auf dem Monats-Container statt Wiring pro Tageszelle:
// Die Liste wächst per Infinite-Scroll unbegrenzt, ein Handler pro Zelle würde bei
// mehreren Jahren unnötig viele Listener anhäufen.
function wireCalendarDayClicks(){
  const container = document.getElementById('calendarMonths');
  container.onclick = (e) => {
    const btn = e.target.closest('.day-cell[data-date]');
    if (!btn) return;
    handleDayClick(btn.dataset.date);
  };
}

function appendMonthsToEnd(monthsAscending){
  const container = document.getElementById('calendarMonths');
  const html = monthsAscending.map(({ year, month }) => monthBlockHTML(year, month)).join('');
  container.insertAdjacentHTML('beforeend', html);
  monthsAscending.forEach(({ year }) => State.calendar.loadedYears.add(year));
}

function prependMonthsToStart(monthsAscending){
  const container = document.getElementById('calendarMonths');
  const scrollEl = document.getElementById('calendarScroll');
  const prevHeight = scrollEl.scrollHeight;
  const prevTop = scrollEl.scrollTop;

  const html = monthsAscending.map(({ year, month }) => monthBlockHTML(year, month)).join('');
  container.insertAdjacentHTML('afterbegin', html);
  monthsAscending.forEach(({ year }) => State.calendar.loadedYears.add(year));

  // Scroll-Position kompensieren, damit sich die sichtbaren Monate beim Nachladen
  // nach oben NICHT verschieben (klassisches Infinite-Scroll-nach-oben-Problem).
  const newHeight = scrollEl.scrollHeight;
  scrollEl.scrollTop = prevTop + (newHeight - prevHeight);
}

function loadPreviousMonths(count){
  if (calendarLoadingPrev) return;
  calendarLoadingPrev = true;

  const before = State.calendar.earliestLoaded;
  let cursor = { year: before.year, month: before.month };
  const monthsToAdd = [];
  for (let i = 0; i < count; i++){
    cursor = shiftYearMonth(cursor.year, cursor.month, -1);
    monthsToAdd.unshift(cursor); // ergibt aufsteigende Reihenfolge (älteste zuerst)
  }
  prependMonthsToStart(monthsToAdd);
  State.calendar.earliestLoaded = monthsToAdd[0];
  updateYearNav();

  calendarLoadingPrev = false;
}

function loadNextMonths(count){
  if (calendarLoadingNext) return;
  calendarLoadingNext = true;

  const after = State.calendar.latestLoaded;
  let cursor = { year: after.year, month: after.month };
  const monthsToAdd = [];
  for (let i = 0; i < count; i++){
    cursor = shiftYearMonth(cursor.year, cursor.month, 1);
    monthsToAdd.push(cursor);
  }
  appendMonthsToEnd(monthsToAdd);
  State.calendar.latestLoaded = monthsToAdd[monthsToAdd.length - 1];
  updateYearNav();

  calendarLoadingNext = false;
}

function setupCalendarObservers(){
  const scrollEl = document.getElementById('calendarScroll');
  const topSentinel = document.getElementById('calendarSentinelTop');
  const bottomSentinel = document.getElementById('calendarSentinelBottom');

  if (calendarTopObserver) calendarTopObserver.disconnect();
  if (calendarBottomObserver) calendarBottomObserver.disconnect();

  // rootMargin sorgt dafür, dass schon VOR dem Erreichen des Rands nachgeladen wird,
  // damit das Scrollen ohne sichtbares Ruckeln/Nachladen-Stottern wirkt.
  const options = { root: scrollEl, rootMargin: '600px 0px 600px 0px', threshold: 0 };

  calendarTopObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) loadPreviousMonths(3); });
  }, options);
  calendarBottomObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) loadNextMonths(3); });
  }, options);

  calendarTopObserver.observe(topSentinel);
  calendarBottomObserver.observe(bottomSentinel);
}

/** Zeigt eine Jahres-Pillenleiste NUR, sobald mehr als ein Jahr geladen ist — frisch
    installiert sieht man also nur das laufende Jahr ohne Navigations-Ballast; sobald
    man (durch Scrollen oder echte Alt-Daten) in ein Nachbarjahr gerät, erscheint sie
    automatisch, damit man nicht endlos zurückscrollen muss. */
function updateYearNav(){
  const nav = document.getElementById('yearNav');
  if (!nav) return;
  const years = Array.from(State.calendar.loadedYears).sort((a, b) => a - b);

  if (years.length <= 1){
    nav.classList.add('is-empty');
    nav.innerHTML = '';
    return;
  }
  nav.classList.remove('is-empty');
  nav.innerHTML = years.map(y => `
    <button type="button" class="year-pill${y === State.today.getFullYear() ? ' is-current-year' : ''}" data-year="${y}">${y}</button>
  `).join('');
  nav.querySelectorAll('.year-pill').forEach(btn => {
    btn.onclick = () => jumpToYear(Number(btn.dataset.year));
  });
}

function jumpToYear(year){
  const targetMonth = year === State.today.getFullYear() ? State.today.getMonth() : 0;
  const block = document.querySelector(`.month-block[data-year="${year}"][data-month="${targetMonth}"]`);
  if (block) block.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToCurrentMonth(){
  const y = State.today.getFullYear();
  const m = State.today.getMonth();
  const block = document.querySelector(`.month-block[data-year="${y}"][data-month="${m}"]`);
  if (block) block.scrollIntoView({ block: 'start' });
}

function renderCalendarView(){
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="app-header app-header-row">
      <span class="app-title">${APP_DATA.APP_NAME}</span>
      <span class="header-icon-group">
        <button type="button" class="header-icon-btn" id="settingsBtn" aria-label="Einstellungen">${APP_DATA.ICONS.SETTINGS}</button>
        <button type="button" class="header-icon-btn" id="importBtn" aria-label="Aus Drip importieren">${APP_DATA.ICONS.IMPORT}</button>
      </span>
    </header>
    <div class="year-nav is-empty" id="yearNav"></div>
    <div class="calendar-scroll" id="calendarScroll">
      <div class="calendar-sentinel-top" id="calendarSentinelTop"></div>
      <div class="calendar-months" id="calendarMonths"></div>
      <div class="calendar-sentinel-bottom" id="calendarSentinelBottom"></div>
    </div>
    ${bottomNavHTML('calendar')}
  `;
  document.getElementById('importBtn').onclick = () => goImport();
  document.getElementById('settingsBtn').onclick = () => goSettings();

  // Zustand VOR dem HTML-Aufbau zurücksetzen: monthBlockHTML() liest
  // State.calendar.selection.start direkt beim Rendern — ein Reset danach
  // würde eine evtl. noch offene Auswahl aus einem früheren Aufruf (z.B. Tab
  // gewechselt, ohne die Perioden-Auswahl abzuschließen) im frischen HTML
  // fälschlich weiter als "is-selecting" anzeigen.
  State.calendar.selection.start = null;

  // Initial: das GESAMTE laufende Kalenderjahr, damit von Anfang an in beide
  // Richtungen flüssig gescrollt werden kann, ohne sofort nachladen zu müssen.
  const year = State.today.getFullYear();
  const container = document.getElementById('calendarMonths');
  let html = '';
  for (let m = 0; m <= 11; m++) html += monthBlockHTML(year, m);
  container.innerHTML = html;

  State.calendar.loadedYears = new Set([year]);
  State.calendar.earliestLoaded = { year, month: 0 };
  State.calendar.latestLoaded = { year, month: 11 };

  wireCalendarDayClicks();
  setupCalendarObservers();
  updateYearNav();
  wireBottomNav();
  scrollToCurrentMonth();
}
