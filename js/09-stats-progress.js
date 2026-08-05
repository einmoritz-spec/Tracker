/* ---------------------------------------------------
   STATS (dritter Bottom-Nav-Tab)
   Reine Darstellung — die eigentliche Berechnung übernimmt komplett
   computeCycleStats() aus 04-utils.js (Ø über ALLE vorhandenen Zyklen,
   siehe Absprache im Chat). Diese Datei kennt kein Storage-Detail, nur
   State.periods + das fertige Stats-Objekt.
--------------------------------------------------- */

function fmtDateReadable(date){
  return date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function statCardHTML(label, value){
  return `
    <div class="stat-card">
      <div class="stat-card-value">${value}</div>
      <div class="stat-card-label">${label}</div>
    </div>
  `;
}

function statsEmptyHTML(){
  return `
    <div class="placeholder-content">
      <p class="placeholder-title">Noch keine Daten</p>
      <p class="placeholder-text">Trage im Kalender den Start deiner Periode ein — hier erscheinen dann Zykluslänge, Vorhersage und fruchtbares Fenster.</p>
    </div>
  `;
}

function statsContentHTML(stats){
  const cycleDayLabel = 'Zyklustag ' + stats.currentCycleDay;

  const predictionNote = !stats.hasPrediction
    ? `Noch keine zweite Periode erfasst — Schätzung basiert auf einem Standardwert von ${stats.avgCycleLength} Tagen.`
    : `Basierend auf ${stats.cycleCount} erfasste${stats.cycleCount === 1 ? 'm' : 'n'} Zyklus${stats.cycleCount === 1 ? '' : 'sen'}.`;

  return `
    <div class="stats-hero">
      <div class="stats-hero-day">${cycleDayLabel}</div>
      <div class="stats-hero-phase">${stats.currentPhase}</div>
    </div>

    <div class="stats-grid">
      ${statCardHTML('Ø Zykluslänge', stats.avgCycleLength + ' Tage')}
      ${statCardHTML('Ø Periodendauer', stats.avgPeriodLength + ' Tage')}
    </div>

    <div class="stats-section">
      <div class="stats-section-title">Nächste Periode</div>
      <div class="stats-section-value">${stats.nextPeriodStart ? fmtDateReadable(stats.nextPeriodStart) : 'noch keine Vorhersage'}</div>
    </div>

    <div class="stats-section">
      <div class="stats-section-title">Fruchtbares Fenster</div>
      <div class="stats-section-value">${fmtDateReadable(stats.fertileStart)} – ${fmtDateReadable(stats.fertileEnd)}</div>
    </div>

    <div class="stats-section">
      <div class="stats-section-title">Geschätzter Eisprung</div>
      <div class="stats-section-value">${fmtDateReadable(stats.ovulationDate)}</div>
    </div>

    <p class="stats-note">${predictionNote}</p>
  `;
}

function renderStatsView(){
  const app = document.getElementById('app');
  const stats = computeCycleStats(State.periods, State.today);

  app.innerHTML = `
    <header class="app-header"><span class="app-title">${APP_DATA.APP_NAME}</span></header>
    <div class="stats-scroll">
      ${stats.hasData ? statsContentHTML(stats) : statsEmptyHTML()}
    </div>
    ${bottomNavHTML('stats')}
  `;
  wireBottomNav();
}
