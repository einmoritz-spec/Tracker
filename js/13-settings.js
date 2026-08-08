/* ---------------------------------------------------
   EINSTELLUNGEN — Theme-Auswahl
   Eigenständiger Sub-Flow wie 07-import.js (kein Bottom-Nav-Tab, eigener
   Zurück-Header). Die auswählbaren Themes selbst liegen als Daten in
   APP_DATA.THEME_PRESETS (app-data.js) — diese Datei kennt nur Anzeige +
   Auswahl-Logik, keine Farbwerte im Code.

   Persistenz: ein gewähltes Theme wird 1:1 als Overrides-Objekt über
   saveThemeOverrides() gespeichert (01-storage.js) — plus ein "__id"-Feld,
   damit beim nächsten Öffnen der Einstellungen erkennbar ist, welches
   Theme aktuell aktiv ist (applyThemeVars() in 02-state-theme.js ignoriert
   dieses Feld ohnehin, da es nicht mit "--" beginnt).

   Zusätzlich: ein Farbwähler für eine frei wählbare Akzentfarbe, aufgeteilt
   in zwei Canvases (Ring außen = Farbton, Kreisfeld mittig = Sättigung/
   Helligkeit) statt einer einzelnen Scheibe — damit Farbton UND Intensität
   auf einen Blick getrennt bedienbar sind. Der Wähler ändert NICHT das
   komplette Theme, sondern übernimmt nur --color-accent/--color-selecting-
   outline über die aktuell aktiven Overrides hinweg (siehe applyCustomAccent())
   — Header, Hintergrund etc. bleiben vom gewählten Theme-Preset bestimmt.

   Der Drip-Import-Einstieg (07-import.js) sitzt hier als Listenpunkt statt
   als Dauer-Icon im Kalender-Header, da er nur sehr selten (einmalig beim
   Umstieg von Drip) gebraucht wird.
--------------------------------------------------- */

// Geometrie des Farbwählers: Ring außen (Farbton) + Kreisfeld mittig
// (Sättigung horizontal / Helligkeit vertikal). Als Konstanten, da sowohl
// beim Zeichnen als auch beim Positionieren der Punkte gebraucht.
const ACCENT_RING_SIZE = 240;
const ACCENT_RING_THICKNESS = 34;
const ACCENT_FIELD_SIZE = 164;
const ACCENT_FIELD_OFFSET = (ACCENT_RING_SIZE - ACCENT_FIELD_SIZE) / 2;

// Laufender Zustand des Farbwählers, ausschließlich für die Picker-UI in
// dieser Datei — kein State.*, da rein UI-lokal und nicht persistenzrelevant,
// bis "Übernehmen" gedrückt wird.
let pickerHue = 350;   // 0–360
let pickerSat = 60;    // 0–100
let pickerLight = 55;  // 0–100

function clamp(n, min, max){ return Math.min(max, Math.max(min, n)); }

/** HSL (h:0-360, s/l:0-100) -> [r,g,b] Bytes (0-255) */
function hslToRgbBytes(h, s, l){
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

function hslToHex(h, s, l){
  const [r, g, b] = hslToRgbBytes(h, s, l);
  const toHex = x => x.toString(16).padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

/** '#rrggbb' -> { h:0-360, s:0-100, l:0-100 } oder null bei ungültigem Format */
function hexToHsl(hex){
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0, s = 0;
  if (d !== 0){
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max){
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

/** Äußerer Ring: reiner Farbton (volle Sättigung, mittlere Helligkeit) über
    360°, unabhängig vom aktuellen Auswahlzustand — wird nur EINMAL gezeichnet. */
function drawHueRing(canvas){
  const size = canvas.width;
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const outerR = center;
  const innerR = center - ACCENT_RING_THICKNESS;
  const imageData = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++){
    for (let x = 0; x < size; x++){
      const dx = x - center, dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * size + x) * 4;
      if (dist > outerR || dist < innerR){
        imageData.data[idx + 3] = 0;
        continue;
      }
      const hue = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
      const [r, g, b] = hslToRgbBytes(hue, 100, 50);
      imageData.data[idx] = r;
      imageData.data[idx + 1] = g;
      imageData.data[idx + 2] = b;
      imageData.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/** Mittleres Kreisfeld: Sättigung (horizontal) × Helligkeit (vertikal) für
    den aktuell gewählten Farbton — wird bei jedem Farbton-Wechsel neu
    gezeichnet, da sich hier die komplette Fläche farblich ändert. */
function drawSatLightField(canvas, hue){
  const size = canvas.width;
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const imageData = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++){
    for (let x = 0; x < size; x++){
      const dx = x - center, dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * size + x) * 4;
      if (dist > center){
        imageData.data[idx + 3] = 0;
        continue;
      }
      const sat = (x / size) * 100;
      const light = 100 - (y / size) * 100;
      const [r, g, b] = hslToRgbBytes(hue, sat, light);
      imageData.data[idx] = r;
      imageData.data[idx + 1] = g;
      imageData.data[idx + 2] = b;
      imageData.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/** Liest den Farbton der zuletzt gespeicherten/angewendeten Akzentfarbe, damit
    der Picker beim Öffnen der Einstellungen dort weitermacht statt bei
    einem festen Default zu starten. */
function initPickerFromCurrentAccent(){
  const current = getComputedStyle(document.documentElement).getPropertyValue('--color-accent');
  const hsl = hexToHsl(current);
  if (hsl){
    pickerHue = hsl.h;
    pickerSat = hsl.s;
    pickerLight = hsl.l;
  }
}

/** Vier klassische Farbharmonie-Reihen aus dem aktuellen Farbton abgeleitet
    (mind. mittlere Sättigung, damit die Vorschläge auch bei einer fast
    entsättigten Wahl noch als Farbtöne erkennbar sind). */
function buildGuidePalettes(hue, sat){
  const guideSat = Math.max(sat, 40);
  const shadeLights = [25, 38, 50, 62, 75, 88];

  const primary = shadeLights.map(l => hslToHex(hue, guideSat, l));
  const complementary = shadeLights.map(l => hslToHex((hue + 180) % 360, guideSat, l));
  const analogous = [-30, -18, -6, 6, 18, 30].map(d => hslToHex((hue + d + 360) % 360, guideSat, 55));
  const triadic = [];
  [0, 120, 240].forEach(d => {
    const h = (hue + d) % 360;
    triadic.push(hslToHex(h, guideSat, 45));
    triadic.push(hslToHex(h, guideSat, 68));
  });

  return { primary, complementary, analogous, triadic };
}

/** Übernimmt nur die Akzentfarbe in die aktuell aktiven Theme-Overrides,
    Header/Hintergrund/etc. des gewählten Presets bleiben unverändert. */
function applyCustomAccent(hex){
  const activePreset = APP_DATA.THEME_PRESETS.find(t => t.id === getActiveThemeId());
  const base = loadThemeOverrides()
    || Object.assign({ __id: APP_DATA.DEFAULT_THEME_ID }, (activePreset || APP_DATA.THEME_PRESETS[0]).vars);
  const updated = Object.assign({}, base, {
    '--color-accent': hex,
    '--color-selecting-outline': hex
  });
  saveThemeOverrides(updated);
  applyThemeVars(updated);
}

function getActiveThemeId(){
  const overrides = loadThemeOverrides();
  if (overrides && overrides.__id) return overrides.__id;
  return APP_DATA.DEFAULT_THEME_ID;
}

function applyThemePreset(preset){
  const overrides = Object.assign({ __id: preset.id }, preset.vars);
  saveThemeOverrides(overrides);
  applyThemeVars(preset.vars);
}

function themeSwatchHTML(preset){
  return `
    <span class="theme-swatch">
      ${preset.swatch.map(color => `<span style="background:${color}"></span>`).join('')}
    </span>
  `;
}

function themeOptionHTML(preset, activeId){
  const isActive = preset.id === activeId;
  return `
    <button type="button" class="theme-option${isActive ? ' is-active' : ''}" data-theme-id="${preset.id}">
      ${themeSwatchHTML(preset)}
      <span class="theme-option-name">${preset.name}</span>
      <span class="theme-option-check">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </span>
    </button>
  `;
}

function wireSettingsView(){
  document.getElementById('settingsBackBtn').onclick = () => history.back();

  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.onclick = () => {
      const preset = APP_DATA.THEME_PRESETS.find(t => t.id === btn.dataset.themeId);
      if (!preset) return;
      applyThemePreset(preset);
      renderSettingsView();
    };
  });

  document.getElementById('settingsImportBtn').onclick = () => goImport();

  wireAccentPicker();
}

function wireAccentPicker(){
  const ringCanvas = document.getElementById('hueRingCanvas');
  const fieldCanvas = document.getElementById('satLightCanvas');
  const hueDot = document.getElementById('hueRingDot');
  const fieldDot = document.getElementById('satLightDot');
  const hexInput = document.getElementById('accentHexInput');
  const swatch = document.getElementById('accentPreviewSwatch');

  function updatePickerPreview(){
    const hex = hslToHex(pickerHue, pickerSat, pickerLight);

    const wrapCenter = ACCENT_RING_SIZE / 2;
    const ringDotRadius = wrapCenter - ACCENT_RING_THICKNESS / 2;
    const rad = pickerHue * Math.PI / 180;
    hueDot.style.left = (wrapCenter + ringDotRadius * Math.cos(rad)) + 'px';
    hueDot.style.top = (wrapCenter + ringDotRadius * Math.sin(rad)) + 'px';
    hueDot.style.background = hslToHex(pickerHue, 100, 50);

    const fieldCenter = ACCENT_FIELD_SIZE / 2;
    let fx = (pickerSat / 100) * ACCENT_FIELD_SIZE - fieldCenter;
    let fy = (1 - pickerLight / 100) * ACCENT_FIELD_SIZE - fieldCenter;
    const fDist = Math.sqrt(fx * fx + fy * fy);
    if (fDist > fieldCenter){
      const scale = fieldCenter / fDist;
      fx *= scale; fy *= scale;
    }
    fieldDot.style.left = (ACCENT_FIELD_OFFSET + fieldCenter + fx) + 'px';
    fieldDot.style.top = (ACCENT_FIELD_OFFSET + fieldCenter + fy) + 'px';
    fieldDot.style.background = hex;

    swatch.style.background = hex;
    hexInput.value = hex;
  }

  function fillGuideRow(containerId, hexList){
    const el = document.getElementById(containerId);
    el.innerHTML = hexList.map(hex => `<button type="button" class="guide-swatch" style="background:${hex}" data-hex="${hex}"></button>`).join('');
    el.querySelectorAll('.guide-swatch').forEach(swatchBtn => {
      swatchBtn.onclick = () => {
        const hsl = hexToHsl(swatchBtn.dataset.hex);
        if (!hsl) return;
        pickerHue = hsl.h; pickerSat = hsl.s; pickerLight = hsl.l;
        drawSatLightField(fieldCanvas, pickerHue);
        renderGuidePalettes();
        updatePickerPreview();
      };
    });
  }

  function renderGuidePalettes(){
    const palettes = buildGuidePalettes(pickerHue, pickerSat);
    fillGuideRow('guidePrimary', palettes.primary);
    fillGuideRow('guideComplementary', palettes.complementary);
    fillGuideRow('guideAnalogous', palettes.analogous);
    fillGuideRow('guideTriadic', palettes.triadic);
  }

  function setHueFromPointer(evt){
    const rect = ringCanvas.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    const dx = (evt.clientX - rect.left) - cx;
    const dy = (evt.clientY - rect.top) - cy;
    pickerHue = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
    drawSatLightField(fieldCanvas, pickerHue);
    updatePickerPreview();
  }

  function setSatLightFromPointer(evt){
    const rect = fieldCanvas.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    let dx = (evt.clientX - rect.left) - cx;
    let dy = (evt.clientY - rect.top) - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > cx){
      const scale = cx / dist;
      dx *= scale; dy *= scale;
    }
    pickerSat = clamp(((dx + cx) / rect.width) * 100, 0, 100);
    pickerLight = clamp(100 - ((dy + cy) / rect.height) * 100, 0, 100);
    updatePickerPreview();
  }

  let draggingRing = false;
  ringCanvas.onpointerdown = (e) => { draggingRing = true; ringCanvas.setPointerCapture(e.pointerId); setHueFromPointer(e); };
  ringCanvas.onpointermove = (e) => { if (draggingRing) setHueFromPointer(e); };
  ringCanvas.onpointerup = () => { draggingRing = false; renderGuidePalettes(); };
  ringCanvas.onpointercancel = () => { draggingRing = false; };

  let draggingField = false;
  fieldCanvas.onpointerdown = (e) => { draggingField = true; fieldCanvas.setPointerCapture(e.pointerId); setSatLightFromPointer(e); };
  fieldCanvas.onpointermove = (e) => { if (draggingField) setSatLightFromPointer(e); };
  fieldCanvas.onpointerup = () => { draggingField = false; renderGuidePalettes(); };
  fieldCanvas.onpointercancel = () => { draggingField = false; };

  hexInput.onchange = () => {
    const hsl = hexToHsl(hexInput.value);
    if (!hsl){ updatePickerPreview(); return; }
    pickerHue = hsl.h; pickerSat = hsl.s; pickerLight = hsl.l;
    drawSatLightField(fieldCanvas, pickerHue);
    renderGuidePalettes();
    updatePickerPreview();
  };

  document.getElementById('accentRandomBtn').onclick = () => {
    pickerHue = Math.random() * 360;
    pickerSat = 45 + Math.random() * 45;
    pickerLight = 40 + Math.random() * 30;
    drawSatLightField(fieldCanvas, pickerHue);
    renderGuidePalettes();
    updatePickerPreview();
  };

  document.getElementById('accentApplyBtn').onclick = () => {
    applyCustomAccent(hslToHex(pickerHue, pickerSat, pickerLight));
    renderSettingsView();
  };

  drawHueRing(ringCanvas);
  drawSatLightField(fieldCanvas, pickerHue);
  renderGuidePalettes();
  updatePickerPreview();
}

function renderSettingsView(){
  const app = document.getElementById('app');
  const activeId = getActiveThemeId();
  const optionsHTML = APP_DATA.THEME_PRESETS.map(preset => themeOptionHTML(preset, activeId)).join('');
  initPickerFromCurrentAccent();

  app.innerHTML = `
    <header class="app-header back-header">
      <button type="button" class="back-btn" id="settingsBackBtn" aria-label="Zurück">←</button>
      <span class="app-title">Einstellungen</span>
      <span class="header-spacer"></span>
    </header>
    <div class="settings-scroll">
      <p class="settings-section-label">Farbthema</p>
      <div class="theme-list">${optionsHTML}</div>

      <p class="settings-section-label settings-section-label-tight">Akzentfarbe anpassen</p>
      <div class="accent-picker">
        <div class="color-wheel-wrap" style="width:${ACCENT_RING_SIZE}px;height:${ACCENT_RING_SIZE}px;">
          <canvas id="hueRingCanvas" width="${ACCENT_RING_SIZE}" height="${ACCENT_RING_SIZE}"></canvas>
          <span class="hue-ring-dot" id="hueRingDot"></span>
          <canvas id="satLightCanvas" width="${ACCENT_FIELD_SIZE}" height="${ACCENT_FIELD_SIZE}" style="top:${ACCENT_FIELD_OFFSET}px;left:${ACCENT_FIELD_OFFSET}px;"></canvas>
          <span class="sat-light-dot" id="satLightDot"></span>
        </div>
        <div class="accent-preview-row">
          <span class="accent-preview-swatch" id="accentPreviewSwatch"></span>
          <input type="text" class="accent-hex-input" id="accentHexInput" maxlength="7" spellcheck="false" autocapitalize="off">
          <button type="button" class="accent-random-btn" id="accentRandomBtn" aria-label="Zufällige Farbe">🎲</button>
        </div>

        <div class="guide-block">
          <p class="guide-label">Primär</p>
          <div class="guide-row" id="guidePrimary"></div>
        </div>
        <div class="guide-block">
          <p class="guide-label">Komplementär</p>
          <div class="guide-row" id="guideComplementary"></div>
        </div>
        <div class="guide-block">
          <p class="guide-label">Analog</p>
          <div class="guide-row" id="guideAnalogous"></div>
        </div>
        <div class="guide-block">
          <p class="guide-label">Triadisch</p>
          <div class="guide-row" id="guideTriadic"></div>
        </div>

        <button type="button" class="import-confirm-btn" id="accentApplyBtn">Akzentfarbe übernehmen</button>
      </div>

      <p class="settings-section-label settings-section-label-tight">Daten</p>
      <button type="button" class="settings-link-row" id="settingsImportBtn">
        <span class="settings-link-icon">${APP_DATA.ICONS.IMPORT}</span>
        <span class="settings-link-label">Aus Drip importieren</span>
        <span class="settings-link-chevron">›</span>
      </button>
    </div>
  `;
  wireSettingsView();
}

function goSettings(push){ if (push !== false) pushView('settings'); renderSettingsView(); }
