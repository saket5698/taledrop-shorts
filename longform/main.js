// Dream-Toon-style 2D animated renderer for Hindi suspense long-form.
// Deterministic canvas drawing; no AI images/video. window.OP drives tools/capture.mjs.
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const W = 1080, H = 1920;
const OP = (window.OP = { ready: false });
const FONT = '"Noto Devanagari", "Nirmala UI", "Mangal", sans-serif';
const norm = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => k * k * (3 - 2 * k);
const TAU = Math.PI * 2;

let script = null, T = null, caps = [], cues = [];
const INK = '#0a0b14';
const PAL = {
  gold: '#e8b04b', amber: '#f0c56a', red: '#e0525c', mutedRed: '#b8434c',
  teal: '#59c6d0', pale: '#f4ead6', grey: '#9aa3b8', dark: '#0e1222',
  skin: '#c98f6b', cloth: '#2c3550', cloth2: '#3d4a68',
};
function accent(lab) {
  if (/MOTHER|VOICE|PHRASE|WHISPER_BACK|TEARS|INNER|DISCOVER/.test(lab)) return PAL.amber;
  if (/WARNING|DARK|SHAKE|CLUE_INSIDE|FEAR|ANGER/.test(lab)) return PAL.red;
  if (/ARCHIVE|FILE|CASSETTE|SOURCE|RECORD|SCHOOL|SPEAKER/.test(lab)) return PAL.teal;
  if (/ECHO|CLAP|COIN|TALI|WALL|SOUND|WAVE|WHISPER/.test(lab)) return PAL.gold;
  return PAL.pale;
}
function chapterFor(i) {
  return Array.isArray(script && script.chapters) ? (script.chapters[i] ?? 0) : 0;
}
const CH_NAMES = ['ठंडी शुरुआत', 'शीर्षक', 'स्थापना', 'पहला सुराग · १९४५', 'दूसरा सुराग · गूंज',
  'तीसरा सुराग · कैसेट', 'सच', 'अंतिम झटका', 'स्रोत'];

/* --------------------------- primitive drawing --------------------------- */
function strokeFill(fill, lw = 8) {
  ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = INK; ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
}
function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function ellipse(x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); }

/** flat 2D character with breathing, blink, mouth and arm gesture */
function person(x, y, s, o) {
  const t = o.t, ph = o.phase || 0, br = Math.sin(t * 2.1 + ph) * 0.018;
  const blink = ((t * 0.9 + ph) % 4.2) < 0.13;
  const mouth = clamp(o.mouth || 0, 0, 1), turn = o.turn || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (1 + br * 0.4), s * (1 + br));
  // legs
  const step = o.walk ? Math.sin(t * 7 + ph) * 26 : 0;
  ctx.save(); ctx.translate(-28, 0); ctx.rotate(step / 180); rr(-20, 0, 40, 200, 14); strokeFill(PAL.cloth); ctx.restore();
  ctx.save(); ctx.translate(28, 0); ctx.rotate(-step / 180); rr(-20, 0, 40, 200, 14); strokeFill(PAL.cloth); ctx.restore();
  // body
  rr(-92, -300, 184, 320, 46); strokeFill(o.coat || PAL.cloth2);
  // arm gesture
  const arm = (o.gesture || 0) * Math.sin(t * 2.6 + ph) * 0.5;
  ctx.save(); ctx.translate(86, -240); ctx.rotate(-0.3 + arm); rr(-18, 0, 36, 170, 16); strokeFill(o.coat || PAL.cloth2); ctx.restore();
  ctx.save(); ctx.translate(-86, -240); ctx.rotate(0.3 - arm); rr(-18, 0, 36, 170, 16); strokeFill(o.coat || PAL.cloth2); ctx.restore();
  // head
  ctx.save(); ctx.translate(0, -420); ctx.rotate(turn);
  ellipse(0, 0, 112, 126); strokeFill(o.skin || PAL.skin);
  // hair / hood
  ctx.beginPath(); ctx.arc(0, -18, 114, Math.PI * 1.04, Math.PI * 1.96); ctx.lineTo(100, -60); ctx.lineTo(-100, -60); ctx.closePath();
  strokeFill(o.hair || '#1b2030');
  // eyes
  const eye = (ex) => {
    if (blink) { ctx.beginPath(); ctx.moveTo(ex - 26, -8); ctx.lineTo(ex + 26, -8); ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.stroke(); }
    else { ellipse(ex + (turn > 0 ? 6 : -4), -8, 22, 27); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
      ellipse(ex + (turn > 0 ? 12 : 2), -5, 9, 13); ctx.fillStyle = o.eye || INK; ctx.fill(); }
  };
  eye(-44); eye(44);
  // mouth (talks)
  if (mouth > 0.02) { ellipse(0, 62, 26 + mouth * 10, 5 + mouth * 22); ctx.fillStyle = '#5a2330'; ctx.fill(); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(-24, 65); ctx.lineTo(24, 65); ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.stroke(); }
  ctx.restore(); ctx.restore();
}

/* --------------------------- scene backgrounds --------------------------- */
function baseSky(col, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#080a13'); g.addColorStop(0.55, '#10152a'); g.addColorStop(1, '#05060c');
  ctx.fillStyle = g; ctx.fillRect(-400, -300, W + 800, H + 600);
  const glow = ctx.createRadialGradient(540, 820, 20, 540, 820, 900);
  glow.addColorStop(0, col + '20'); glow.addColorStop(0.5, col + '08'); glow.addColorStop(1, '#00000000');
  ctx.fillStyle = glow; ctx.fillRect(-400, -300, W + 800, H + 600);
}
function dust(col, t) {
  ctx.fillStyle = col + '45';
  for (let k = 0; k < 80; k++) {
    const a = ((Math.sin(k * 12.9898) * 43758.5453) % 1 + 1) % 1;
    const b = ((Math.sin(k * 78.233) * 12345.6789) % 1 + 1) % 1;
    const x = a * W + Math.sin(t * 0.25 + k) * 24;
    const y = ((b * H - t * (9 + a * 18)) % H + H) % H;
    ctx.beginPath(); ctx.arc(x, y, 1.2 + a * 2.2, 0, TAU); ctx.fill();
  }
}
function dome(col, t, opts = {}) {
  baseSky(col, t);
  // arches
  ctx.save(); ctx.lineWidth = 7;
  for (let k = 0; k < 6; k++) {
    const r = 320 + k * 130;
    ctx.strokeStyle = k % 2 ? col + '24' : col + '38';
    ctx.beginPath(); ctx.arc(540, 1430, r, Math.PI * 1.03, Math.PI * 1.97); ctx.stroke();
  }
  // pillars
  for (const x of [110, 970]) { ctx.fillStyle = '#1a2038'; ctx.strokeStyle = col + '55'; rr(x - 42, 300, 84, 1300, 12); strokeFill('#161c31'); }
  // floor
  ctx.strokeStyle = col + '2e'; ctx.lineWidth = 4;
  for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(540 + k * 90, 1430); ctx.lineTo(540 + k * 260, 2100); ctx.stroke(); }
  // moonlight shaft
  const mx = 540 + Math.sin(t * 0.22) * 200;
  const beam = ctx.createLinearGradient(mx, 0, mx + 160, 1500);
  beam.addColorStop(0, col + '2e'); beam.addColorStop(1, '#00000000');
  ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(mx - 90, -100); ctx.lineTo(mx + 90, -100); ctx.lineTo(mx + 300, 1600); ctx.lineTo(mx - 300, 1600); ctx.closePath(); ctx.fill();
  ctx.restore();
  dust(col, t);
}
function archive(col, t) {
  baseSky(col, t);
  ctx.fillStyle = '#151b2e'; ctx.fillRect(-100, 250, 1280, 1450);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const x = 40 + c * 260, y = 360 + r * 320;
    ctx.strokeStyle = col + '44'; ctx.lineWidth = 6;
    rr(x, y, 220, 260, 10); ctx.fillStyle = '#202945'; ctx.fill(); ctx.stroke();
    for (let f = 0; f < 5; f++) { ctx.fillStyle = f % 2 ? '#c9bda0' : '#8d96ad'; ctx.fillRect(x + 18, y + 30 + f * 42, 184, 26); }
  }
  dust(col, t);
}
function cassette(col, t) {
  baseSky(col, t);
  ctx.save(); ctx.translate(540, 1000); ctx.scale(1.15, 1.15);
  rr(-380, -240, 760, 480, 34); strokeFill('#25304a', 12);
  rr(-300, -170, 600, 260, 18); strokeFill('#e4dcc6', 8);
  for (const rx of [-150, 150]) {
    ctx.save(); ctx.translate(rx, -40); ctx.rotate(t * 1.6 * (rx < 0 ? 1 : -1));
    ellipse(0, 0, 92, 92); strokeFill('#3b4663', 8);
    for (let k = 0; k < 6; k++) { ctx.rotate(TAU / 6); ctx.fillStyle = '#e4dcc6'; ctx.fillRect(-8, -78, 16, 56); }
    ellipse(0, 0, 24, 24); strokeFill(col, 6); ctx.restore();
  }
  rr(-260, 130, 520, 56, 10); strokeFill('#1b2238', 8);
  ctx.fillStyle = col; ctx.font = `700 30px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(' rescue 1992  ·  00:41', 0, 168);
  ctx.restore(); dust(col, t);
}
function diagram(col, t) {
  baseSky(col, t);
  ctx.save(); ctx.translate(540, 950);
  ctx.beginPath(); ctx.arc(0, 220, 520, Math.PI * 1.08, Math.PI * 1.92); ctx.lineWidth = 26; ctx.strokeStyle = '#2c3654'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 220, 520, Math.PI * 1.08, Math.PI * 1.92); ctx.lineWidth = 8; ctx.strokeStyle = col; ctx.stroke();
  // travelling sound dots
  for (let k = 0; k < 12; k++) {
    const ang = Math.PI * 1.08 + ((k / 12 + t * 0.12) % 1) * Math.PI * 0.84;
    const x = Math.cos(ang) * 520, y = 220 + Math.sin(ang) * 520;
    ctx.beginPath(); ctx.arc(x, y, 10 + (k % 3) * 4, 0, TAU); ctx.fillStyle = col; ctx.fill();
  }
  // listener dots
  for (const x of [-430, 430]) { ellipse(x, 610, 46, 54); strokeFill(PAL.pale, 8); }
  ctx.fillStyle = col; ctx.font = `700 44px ${FONT}`; ctx.textAlign = 'center';
  ctx.fillText('आवाज़ दीवार के साथ चलती है', 0, -320);
  ctx.restore(); dust(col, t);
}
function closeFace(col, t, mouth, blink) {
  baseSky(col, t);
  ctx.save(); ctx.translate(540, 900); ctx.scale(2.2, 2.2);
  ellipse(0, 0, 130, 156); strokeFill(PAL.skin, 10);
  ctx.beginPath(); ctx.arc(0, -20, 132, Math.PI * 1.02, Math.PI * 1.98); ctx.lineTo(116, -80); ctx.lineTo(-116, -80); ctx.closePath();
  strokeFill('#171d2c', 10);
  const eye = (ex) => {
    if (blink) { ctx.beginPath(); ctx.moveTo(ex - 28, -6); ctx.lineTo(ex + 28, -6); ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.stroke(); }
    else { ellipse(ex, -6, 24, 29); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); ellipse(ex + 6, -2, 10, 14); ctx.fillStyle = col; ctx.fill(); }
  };
  eye(-48); eye(48);
  if (mouth > 0.02) { ellipse(0, 76, 30 + mouth * 12, 6 + mouth * 24); ctx.fillStyle = '#5a2330'; ctx.fill(); ctx.stroke(); }
  ctx.restore(); dust(col, t);
}
function ripple(col, t, at, period = 2.4) {
  const age = ((t - at) % period + period) % period;
  for (let k = 0; k < 3; k++) {
    const a = (age - k * 0.5) / 1.8;
    if (a < 0 || a > 1) continue;
    ctx.beginPath(); ctx.arc(540, 1000, 60 + a * 620, 0, TAU);
    ctx.lineWidth = 6; ctx.strokeStyle = col + Math.floor((1 - a) * 110).toString(16).padStart(2, '0'); ctx.stroke();
  }
}

/* --------------------------- captions / titles --------------------------- */
function buildCaptions() {
  caps = [];
  const words = T.words || [];
  script.lines.forEach((ln, i) => {
    const chunks = (ln.caps ? ln.caps.split('|') : [ln.text]).map((s) => s.trim()).filter(Boolean);
    const ws = words.filter((w) => w.line === i);
    const counts = chunks.map((c) => c.split(/\s+/).length);
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    let from = 0, acc = 0;
    chunks.forEach((c, j) => {
      const first = norm(c.split(/\s+/)[0]);
      let idx = j === 0 ? 0 : -1;
      if (j > 0) for (let k = from; k < ws.length; k++) {
        const nw = norm(ws[k].w);
        if (nw && (nw === first || (first.length > 2 && nw.startsWith(first)))) { idx = k; break; }
      }
      if (idx < 0) idx = Math.min(ws.length - 1, Math.round(acc * ws.length / total));
      if (idx < from) idx = from;
      const s = ws.length ? Math.max(T.lines[i].start, ws[idx].s - 0.05)
        : T.lines[i].start + (acc / total) * (T.lines[i].end - T.lines[i].start);
      acc += counts[j]; from = idx;
      caps.push({ line: i, s, words: c.split(/\s+/).map((w) => ({ txt: w.replace('*', ''), hi: w.startsWith('*') })) });
    });
  });
  caps.forEach((c, k) => {
    const next = caps[k + 1], end = T.lines[c.line].end;
    c.e = next ? (next.line !== c.line && next.s - end > 0.8 ? end + 0.3 : next.s) : T.dur;
  });
}
function activeCaption(t) {
  for (let i = caps.length - 1; i >= 0; i--) if (t >= caps[i].s && t < caps[i].e) return caps[i];
  return null;
}
function lineIndex(t) { let i = T.lines.length - 1; while (i > 0 && T.lines[i].start > t) i--; return i; }
function fmt(t) { return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`; }

function drawCaption(c, col, t) {
  if (!c) return;
  const txt = c.words.map((w) => w.txt).join(' ');
  const pop = 0.8 + 0.2 * ease(clamp((t - c.s) / 0.18));
  let size = 108;
  ctx.font = `900 ${size}px ${FONT}`;
  while (ctx.measureText(txt).width > 930 && size > 54) { size -= 4; ctx.font = `900 ${size}px ${FONT}`; }
  ctx.save(); ctx.translate(540, 1550); ctx.scale(pop, pop); ctx.translate(-540, -1550);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(10, size * 0.16); ctx.strokeStyle = '#03040a';
  const widths = c.words.map((w) => ctx.measureText(w.txt + ' ').width);
  const total = widths.reduce((a, b) => a + b, 0);
  let x = 540 - total / 2;
  c.words.forEach((w, k) => {
    const s = w.txt + ' ', mid = x + ctx.measureText(s).width / 2;
    ctx.strokeText(s, mid, 1550); ctx.fillStyle = w.hi ? col : '#ffffff'; ctx.fillText(s, mid, 1550);
    x += widths[k];
  });
  ctx.restore();
}
function drawTitle(lab, t, col) {
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const k = ease(clamp(t / 0.5));
  ctx.globalAlpha = k;
  ctx.fillStyle = col + '66'; ctx.fillRect(250, 690, 580, 4); ctx.fillRect(250, 950, 580, 4);
  const one = lab === 'EP_TITLE' ? 'गुम्बज में किसने फुसफुसाया?' : 'अंधेरे के पीछे';
  ctx.font = `900 ${lab === 'EP_TITLE' ? 74 : 112}px ${FONT}`;
  ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.strokeText(one, 540, 820 - (1 - k) * 30); ctx.fillStyle = '#fff'; ctx.fillText(one, 540, 820 - (1 - k) * 30);
  if (lab === 'TITLE' || lab === 'OUTRO') {
    ctx.font = `700 38px ${FONT}`; ctx.fillStyle = col;
    ctx.fillText('एक सच्चा सुराग · दो गलत रास्ते · एक अजीब सच', 540, 1010);
  }
  ctx.restore();
}
function drawHUD(t, i, col) {
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = col; ctx.fillRect(70, 92, 8, 54);
  ctx.font = `700 46px ${FONT}`; ctx.fillStyle = PAL.pale;
  ctx.fillText(CH_NAMES[chapterFor(i)] || '', 100, 135);
  ctx.font = '700 28px sans-serif'; ctx.fillStyle = '#ffffff88'; ctx.textAlign = 'right';
  ctx.fillText(`${fmt(t)} · PREVIEW`, 1010, 130);
  const sh = ctx.createLinearGradient(0, 1260, 0, H);
  sh.addColorStop(0, '#00000000'); sh.addColorStop(0.5, '#03040acc'); sh.addColorStop(1, '#020308ee');
  ctx.fillStyle = sh; ctx.fillRect(0, 1260, W, H - 1260);
}

/* --------------------------- master draw --------------------------- */
function draw(t) {
  t = clamp(t, 0, T.dur - 0.001);
  const i = lineIndex(t), lab = script.visual_labels[i] || '';
  const col = accent(lab), start = T.lines[i].start, end = i < T.lines.length - 1 ? T.lines[i + 1].start : T.dur;
  const k = ease(clamp((t - start) / Math.max(0.3, end - start)));
  const cap = activeCaption(t);
  const beat = cap ? 0.55 + 0.45 * Math.abs(Math.sin(t * 11)) : 0;
  const blink = ((t * 0.95) % 4.1) < 0.13;
  const ch = chapterFor(i);

  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.letterSpacing = '0px';
  // camera: slow push-in per shot, small drift, shake on fear beats
  const shake = /WARNING|FEAR|SHAKE|DARKER/.test(lab) ? Math.sin(t * 37) * 5 : 0;
  const zoom = 1.02 + k * 0.055;
  ctx.save();
  ctx.translate(W / 2 + shake, H / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-W / 2 - Math.sin(t * 0.13) * 12, -H / 2 - Math.cos(t * 0.11) * 8);

  if (ch === 3) archive(col, t);
  else if (ch === 5) cassette(col, t);
  else if (ch === 6) diagram(col, t);
  else if (i < 4 || /COLD_OPEN|NICKNAME|MOTHER|ECHO_CALL/.test(lab)) closeFace(col, t, beat, blink);
  else dome(col, t);

  if (/ECHO|CLAP|COIN|TALI|SOUND/.test(lab)) ripple(col, t, start);

  // characters
  if (ch === 0 || ch === 1 || ch === 7) {
    person(540, 1420, 2.0, { t, phase: 0, mouth: beat, blink, turn: Math.sin(t * 0.3) * 0.12, gesture: /ANGER|WARNING/.test(lab) ? 1 : 0.2 });
  } else if (ch === 3) {
    person(790, 1420, 1.5, { t, phase: 1.2, mouth: beat * 0.4, blink: (t % 3.7) < 0.12, turn: -0.1 });
    person(330, 1400, 1.5, { t, phase: 2.4, mouth: beat, blink, turn: 0.12, coat: '#3a4a60' });
  } else if (ch === 4 || ch === 8) {
    person(320, 1440, 1.45, { t, phase: 0.5, mouth: beat, blink, turn: 0.08 });
    person(790, 1440, 1.45, { t, phase: 1.9, mouth: beat * 0.3, blink: (t % 4.4) < 0.12, coat: '#3a4a60', turn: -0.08 });
  } else if (ch === 2 || ch === 6) {
    person(540, 1500, 1.25, { t, phase: 0.9, mouth: beat * 0.7, blink });
  }
  ctx.restore();

  drawHUD(t, i, col);
  if (/^(TITLE|EP_TITLE|PROMISE|PROMISE2|OUTRO)$/.test(lab)) drawTitle(lab, t - start, col);
  drawCaption(cap, col, t);
  const fade = Math.min(clamp(t / 0.35), clamp((T.dur - t) / 0.7));
  if (fade < 1) { ctx.fillStyle = '#000'; ctx.globalAlpha = 1 - fade; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}

(async () => {
  try {
    try { await document.fonts.load(`900 100px ${FONT}`); } catch (_) {}
    script = await (await fetch('script.json', { cache: 'no-store' })).json();
    const lines = await (await fetch('data/lines.json', { cache: 'no-store' })).json();
    let words = [];
    try { words = await (await fetch('data/words.json', { cache: 'no-store' })).json(); } catch (_) {}
    T = { dur: lines.duration, lines: lines.lines, words };
    buildCaptions();
    let last = -1;
    script.chapters.forEach((ch, i) => {
      if (ch !== last) { cues.push({ t: +T.lines[i].start.toFixed(3), type: 'whoosh', gain: 0.35 }); last = ch; }
    });
    script.visual_labels.forEach((lab, i) => {
      const t = +T.lines[i].start.toFixed(3);
      if (/ECHO14|ECHO_RETURN|CLAP|COIN|TALI/.test(lab)) cues.push({ t, type: 'tock', gain: 0.4 });
      if (/WARNING|DARK_SPEAKS|DARKER|SHAKE/.test(lab)) cues.push({ t, type: 'heartbeat', gain: 0.5 });
      if (/SOURCE_NAMES|OUTRO/.test(lab)) cues.push({ t, type: 'sparkle', gain: 0.3 });
    });
    cues.sort((a, b) => a.t - b.t);
    OP.duration = () => T.dur;
    OP.draw = draw;
    OP.frame = (tt, q = 0.92) => { draw(tt); return cv.toDataURL('image/jpeg', q); };
    OP.shots = () => T.lines.map((ln, i) => ({ id: `S${String(i + 1).padStart(2, '0')}`, at: +ln.start.toFixed(3),
      end: +(i < T.lines.length - 1 ? T.lines[i + 1].start : T.dur).toFixed(3), note: script.visual_labels[i] || '' }));
    OP.captions = () => caps.map((c) => ({ s: +c.s.toFixed(3), e: +c.e.toFixed(3),
      text: c.words.map((w) => (w.hi ? '*' : '') + w.txt).join(' ') }));
    OP.cues = () => cues;
    OP.ready = true;
    const q = new URLSearchParams(location.search);
    if (!q.has('capture')) {
      if (q.has('t')) draw(+q.get('t'));
      else {
        const audio = new Audio('data/mix.wav'); let t0 = null;
        const btn = document.getElementById('play'); btn.hidden = false;
        btn.onclick = () => { btn.hidden = true; t0 = performance.now(); audio.currentTime = 0; audio.play().catch(() => {}); };
        const loop = (now) => { const tt = t0 == null ? 0 : (now - t0) / 1000; draw(tt); if (t0 != null && tt > T.dur) { t0 = null; btn.hidden = false; } requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
      }
    }
  } catch (e) { OP.bootError = String((e && e.stack) || e); console.error(e); }
})();
