// GENERIC DARK MYTHOLOGY HISTORY 3D shot list. visual_labels are injected by scripts/generate_shots.py.
// Every shot is timed from cut(i) only, so any 10-line sourced script renders without an agent loop.
// Look: quiet one-light places, ONE red-glowing subject, terracotta silhouettes, parchment maps,
// gold date ribbons, crimson string and case files. All overlays stay above the caption zone (y 1250-1550).
import * as THREE from 'three';
import { ctx, W, H, clamp, lerp, seg, eo, eio, eob, rr } from './core/lib.js';
import { L } from './core/timing.js';
import { camera } from './core/engine.js';
import { Human } from './core/human.js';
import * as SETS from './core/sets3d.js';
import * as K from './core/kit.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lerpV = (a, b, k) => a.clone().lerp(b, k);
const LABELS = @@LABELS@@;

const M = {
  earth: new THREE.MeshStandardMaterial({ color: '#151217', roughness: 1 }),
  stone: new THREE.MeshStandardMaterial({ color: '#2A2B33', roughness: 0.95 }),
  terra: new THREE.MeshStandardMaterial({ color: '#8A4B35', roughness: 0.9 }),
  gold: new THREE.MeshStandardMaterial({ color: '#D2AC55', emissive: '#7A5518', emissiveIntensity: 0.3, metalness: 0.45, roughness: 0.4 }),
  mercury: new THREE.MeshStandardMaterial({ color: '#8FA9B6', emissive: '#A6D6E6', emissiveIntensity: 0.55, metalness: 0.6, roughness: 0.25, side: THREE.DoubleSide }),
};
const box = (w, h, d, m, x, y, z, rot = 0) => {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z); o.rotation.y = rot; o.castShadow = o.receiveShadow = true; return o;
};
const cyl = (rt, rb, h, m, x, y, z, n = 16) => {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m);
  o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o;
};
/** one warm/cold light per place, with a soft visible cone */
function oneLight(scene, x, y, z, color, intensity, target) {
  const s = new THREE.SpotLight(color, intensity, 18, 0.72, 0.75, 1.4);
  s.position.set(x, y, z); s.target.position.set(...target);
  s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0004; s.shadow.radius = 4;
  scene.add(s, s.target);
  const cone = SETS.lightCone(y, 1.05, color, 0.075); cone.position.set(x, y, z); scene.add(cone);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), new THREE.MeshBasicMaterial({ color }));
  bulb.position.set(x, y, z); scene.add(bulb);
  return s;
}
const darkScene = (fogNear = 5, fogFar = 22) => {
  const s = new THREE.Scene(); s.background = new THREE.Color('#06070A');
  s.fog = new THREE.Fog('#06070A', fogNear, fogFar);
  return s;
};

function moundSet() {
  const scene = darkScene();
  scene.add(box(24, 0.1, 24, M.earth, 0, -0.05, -6));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), M.stone);
  dome.position.set(0, 0, -5); dome.scale.set(1.35, 0.55, 1); dome.castShadow = dome.receiveShadow = true; scene.add(dome);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    scene.add(cyl(0.13, 0.18, 0.45, M.stone, Math.cos(a) * 2.7, 0.22, -5 + Math.sin(a) * 2.1));
  }
  oneLight(scene, 2.0, 3.0, -2.4, '#F1D7A2', 20, [0, 0.4, -5]);
  scene.add(new THREE.HemisphereLight('#20263A', '#000000', 0.4));
  return { scene, update() {} };
}
function templeSet() {
  const scene = darkScene();
  scene.add(box(5.6, 0.3, 5.6, M.stone, 0, 0.15, -6));
  for (const x of [-1.8, 1.8]) for (const z of [-4.6, -7.4]) scene.add(cyl(0.16, 0.19, 2.6, M.stone, x, 1.65, z));
  scene.add(box(4.6, 0.35, 0.9, M.stone, 0, 3.05, -6));
  for (let i = 0; i < 3; i++) scene.add(box(5.2 - i * 0.4, 0.16, 0.55, M.stone, 0, 0.24 + i * 0.16, -3.2 + i * 0.55));
  oneLight(scene, -2.2, 2.9, -3.0, '#F3D9A2', 18, [0, 0.8, -5.6]);
  scene.add(new THREE.HemisphereLight('#1C2236', '#000000', 0.4));
  return { scene, update() {} };
}
function marketSet() {
  const scene = darkScene();
  scene.add(box(22, 0.1, 22, M.earth, 0, -0.05, -6));
  for (const x of [-2.4, 2.4]) {
    scene.add(box(2.1, 0.15, 1.3, M.stone, x, 0.75, -5.5));
    for (const z of [-6.1, -4.9]) scene.add(cyl(0.055, 0.06, 2.0, M.stone, x - 0.9, 1.45, z));
    const awning = box(2.4, 0.12, 1.7, M.terra, x, 2.48, -5.5);
    awning.rotation.z = x < 0 ? -0.12 : 0.12; scene.add(awning);
    scene.add(cyl(0.28, 0.24, 0.35, M.terra, x + 0.5, 1.0, -5.5));
  }
  oneLight(scene, 0.2, 3.4, -4.3, '#F2D7A4', 17, [0, 0.8, -5.5]);
  scene.add(new THREE.HemisphereLight('#202438', '#000000', 0.35));
  return { scene, update() {} };
}
function fieldSet() {
  const scene = darkScene(6, 24);
  scene.add(box(26, 0.1, 26, M.earth, 0, -0.05, -7));
  for (let i = 0; i < 9; i++) {
    const x = -4 + i;
    scene.add(box(0.08, 0.5, 11, M.terra, x, 0.25, -7));
    for (let j = 0; j < 6; j++) scene.add(cyl(0.02, 0.06, 0.5, M.terra, x, 0.72, -3.5 - j * 1.5, 6));
  }
  scene.add(cyl(0.05, 0.06, 2.5, M.stone, 1.5, 1.25, -3));
  oneLight(scene, 1.5, 2.6, -3, '#F4D08A', 15, [0, 0.5, -5.5]);
  scene.add(new THREE.HemisphereLight('#1A2134', '#000000', 0.4));
  return { scene, update() {} };
}
function riverSet() {
  const scene = darkScene(6, 26);
  scene.add(box(26, 0.1, 26, M.earth, 0, -0.05, -8));
  const geo = new THREE.PlaneGeometry(3.2, 30, 14, 60);
  const river = new THREE.Mesh(geo, M.mercury);
  river.rotation.x = -Math.PI / 2; river.position.set(0, 0.03, -8); river.receiveShadow = true; scene.add(river);
  const base = Float32Array.from(geo.attributes.position.array);
  for (let i = 0; i < 18; i++) {
    const x = (i % 2 ? 1 : -1) * (2.1 + (i % 3) * 0.35), z = -2 - (i / 18) * 16;
    scene.add(cyl(0.02, 0.05, 0.7, M.terra, x, 0.35, z, 6));
  }
  oneLight(scene, -2.2, 3.2, -2.5, '#CBE4F0', 14, [0, 0, -7]);
  scene.add(new THREE.HemisphereLight('#182438', '#000000', 0.4));
  return {
    scene,
    update(t) {
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = base[i * 3], y = base[i * 3 + 1];
        p.setZ(i, 0.035 * Math.sin(x * 2.4 + t * 1.1) + 0.025 * Math.sin(y * 3.1 - t * 0.7));
      }
      p.needsUpdate = true; geo.computeVertexNormals();
    },
  };
}

/** parchment map with a crimson route, drawn above the caption zone */
function parchmentMap(x, y, s, p) {
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = clamp(p * 1.5);
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 30;
  rr(-300, -190, 600, 380, 10); ctx.fillStyle = K.P.paper; ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(90,70,45,0.35)'; ctx.lineWidth = 2;
  for (let gx = -200; gx <= 200; gx += 100) { ctx.beginPath(); ctx.moveTo(gx, -190); ctx.lineTo(gx, 190); ctx.stroke(); }
  for (let gy = -100; gy <= 100; gy += 100) { ctx.beginPath(); ctx.moveTo(-300, gy); ctx.lineTo(300, gy); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-260, 90); ctx.bezierCurveTo(-140, -110, 40, 130, 260, -80);
  ctx.strokeStyle = '#6E6656'; ctx.lineWidth = 5; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-230, 20); ctx.lineTo(-60, -70); ctx.lineTo(120, 40); ctx.lineTo(240, -40);
  ctx.strokeStyle = K.P.red; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.arc(230, 120, 34, 0, Math.PI * 2); ctx.strokeStyle = '#7A5A22'; ctx.lineWidth = 4; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(230, 86); ctx.lineTo(230, 154); ctx.moveTo(196, 120); ctx.lineTo(264, 120); ctx.stroke();
  ctx.font = `700 26px FreeMono`; ctx.fillStyle = '#4A3A28'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('OLD MAP · RECORD', -260, -140);
  ctx.restore();
}
/** gold ribbon with the injected label, drawn at y ~1060 (still clear of captions) */
function goldRibbon(text, x, y, p) {
  if (p <= 0) return;
  const k = eob(clamp(p)), w = Math.min(820, 170 + text.length * 30);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, 1); ctx.globalAlpha = clamp(p * 1.6);
  ctx.fillStyle = '#6B4A18';
  ctx.beginPath(); ctx.moveTo(-w / 2 - 64, -30); ctx.lineTo(-w / 2 + 10, -30); ctx.lineTo(-w / 2 + 10, 34); ctx.lineTo(-w / 2 - 64, 34); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(w / 2 + 64, -30); ctx.lineTo(w / 2 - 10, -30); ctx.lineTo(w / 2 - 10, 34); ctx.lineTo(w / 2 + 64, 34); ctx.closePath(); ctx.fill();
  rr(-w / 2, -40, w, 80, 6); ctx.fillStyle = M.gold.color.getStyle(); ctx.fill();
  ctx.strokeStyle = '#7A5520'; ctx.lineWidth = 4; ctx.stroke();
  ctx.font = '700 50px FreeMono'; ctx.fillStyle = '#2A1C0D'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 2);
  ctx.restore();
}
/** crimson string joining two small parchment evidence cards */
function crimsonString(p) {
  if (p <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(p * 1.4);
  const a = [350, 620], b = [730, 900];
  ctx.strokeStyle = K.P.red; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(...a); ctx.quadraticCurveTo(540, 880, ...b); ctx.stroke();
  for (const [pt, word] of [[a, 'RECORD'], [b, 'LEGEND']]) {
    rr(pt[0] - 92, pt[1] - 52, 184, 104, 6); ctx.fillStyle = K.P.paper; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(pt[0], pt[1] - 52, 9, 0, Math.PI * 2); ctx.fillStyle = K.P.red; ctx.fill();
    ctx.font = '700 30px FreeMono'; ctx.fillStyle = K.P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(word, pt[0], pt[1] + 8);
  }
  ctx.restore();
}
const place = (scene, h, x, z, pose = {}) => {
  scene.add(h.group); h.group.position.set(x, 0, z); h.group.rotation.set(0, 0, 0);
  h.hips.position.y = 0.93; h.pose(pose); return h;
};

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const cam = camera(36);
  const LOOK = { exposure: 1.18, bloom: 0.52, bloomThreshold: 0.55, vignette: 0.58, grain: 0.045, warm: 0.01, aperture: 0.0014, maxblur: 0.012 };
  const render = (set, focusP, t, extra = {}) => {
    const fov = extra.fov || 36;
    if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    E.render(set.scene, cam, { ...LOOK, focus: cam.position.distanceTo(focusP), t, ...extra });
  };

  const sets = { mound: moundSet(), temple: templeSet(), market: marketSet(), field: fieldSet(), river: riverSet() };
  const subject = new Human({ face: false }); subject.setAllMaterial(SETS.subjectMat(2.4));
  const witnesses = [0, 1, 2].map(() => { const h = new Human({ face: false }); h.setAllMaterial(M.terra); return h; });

  // Ten quiet views. i % 10 keeps one shot per injected label even if a label's wording changes.
  const PLAN = [
    { set: sets.mound,  a: V3(0.9, 1.6, 2.2),  b: V3(0.4, 1.55, 0.8),  look: V3(0, 0.9, -5),  focus: V3(0, 0.7, -5),  sub: [0.9, -4.2], wit: [[-1.9, -3.9], [2.1, -3.6]], fov: 38 },
    { set: sets.mound,  a: V3(0.6, 1.5, 1.2),  b: V3(0.2, 1.45, 0.1),  look: V3(0, 0.8, -5),  focus: V3(0, 0.6, -5),  sub: [0.7, -4.4], wit: [], fov: 36 },
    { set: sets.market, a: V3(0.4, 1.6, 1.6),  b: V3(0.1, 1.55, 0.2),  look: V3(0, 1.0, -5.5), focus: V3(0, 1.0, -5),  sub: [0, -4.5], wit: [[-2.3, -4.8], [2.4, -4.7]], fov: 38 },
    { set: sets.temple, a: V3(0.5, 1.7, 1.8),  b: V3(0.2, 1.6, 0.5),   look: V3(0, 1.1, -6),  focus: V3(0, 1.0, -6),  sub: [0, -5.1], wit: [[-2.2, -5.4], [2.2, -5.2]], fov: 38 },
    { set: sets.river,  a: V3(-0.8, 1.7, 1.9), b: V3(-0.5, 1.6, 0.4),  look: V3(-0.4, 0.8, -8), focus: V3(0, 0.1, -7), sub: [-2.2, -4.4], wit: [], fov: 40 },
    { set: sets.field,  a: V3(0.4, 1.65, 1.7), b: V3(0.1, 1.6, 0.3),   look: V3(0, 0.9, -7),  focus: V3(0, 0.8, -6),  sub: [0.3, -4.9], wit: [[-2.1, -4.6], [2.0, -4.4]], fov: 38 },
    { set: sets.market, a: V3(0.2, 1.7, 0.8),  b: V3(0.1, 1.65, -0.2), look: V3(0, 0.9, -5.5), focus: V3(0, 1.0, -6),  sub: [0.4, -5.0], wit: [], fov: 36 },
    { set: sets.temple, a: V3(0.3, 1.6, 0.9),  b: V3(0.1, 1.55, -0.3), look: V3(0, 0.9, -6),  focus: V3(0, 1.0, -6),  sub: [0, -5.5], wit: [], fov: 36 },
    { set: sets.mound,  a: V3(1.1, 1.75, 3.1), b: V3(0.7, 1.7, 1.6),   look: V3(0, 0.8, -5),  focus: V3(0, 0.7, -5),  sub: [0.8, -4.3], wit: [[-2.0, -4.0]], fov: 42 },
    { set: sets.river,  a: V3(-0.6, 1.8, 2.4), b: V3(-0.3, 1.7, 0.9),  look: V3(-0.3, 0.8, -8), focus: V3(0, 0.1, -7), sub: [-2.1, -4.7], wit: [[1.9, -4.5]], fov: 40 },
  ];

  for (let i = 0; i < LABELS.length; i++) {
    const spec = PLAN[i % PLAN.length], st = cut(i), text = LABELS[i];
    add({ id: `S${String(i + 1).padStart(2, '0')}`, at: st, note: `line ${i + 1}: ${text}`, draw(lt, d, t, blit) {
      const k = eio(clamp(lt / Math.max(0.35, d)));
      spec.set.update(t);
      place(spec.set.scene, subject, spec.sub[0], spec.sub[1], i === 2
        ? { spine: [3, 3 * Math.sin(lt * 1.6), 0], head: [2, -4, 0], shL: [-12, 0, 6], shR: [12, 0, 6] }
        : { spine: [2, -2 * Math.sin(lt * 1.2), 0], head: [3, -4 + 2 * Math.sin(lt * 1.4), 0], shL: [6, 0, 7], shR: [6, 0, 7] });
      witnesses.forEach((h, j) => {
        h.group.visible = j < spec.wit.length;
        if (h.group.visible) { const [x, z] = spec.wit[j]; place(spec.set.scene, h, x, z, { head: [0, 8 * Math.sin(lt * 0.9 + j), 0], spine: [0, 2, 0] }); }
      });
      cam.position.copy(lerpV(spec.a, spec.b, k)); cam.lookAt(spec.look);
      render(spec.set, spec.focus, t, { fov: spec.fov });
      blit();

      // Typewriter date stamp: the injected label plus a record/legend qualifier. Never enters the caption zone.
      K.dateStamp(text, i < 5 ? 'THE RECORD' : 'THE LEGEND', eob(seg(lt, 0.08, 0.55)), 80, 210);
      if (i === 1 || i === 9) parchmentMap(540, 760, 1, seg(lt, 0.25, 0.9));
      if (i === 3 || i === 6 || i === 9) goldRibbon(text, 540, 1060, seg(lt, 0.3, 0.9));
      if (i === 6 || i === 7 || i === 9) {
        K.caseFile(540, 820, 1.05, 'OLD FILE', 0, -0.03);
        crimsonString(seg(lt, 0.35, 1.1));
      }
      K.filmLook(t, 0.58);
    } });
    cue(st, 'whoosh', { gain: 0.3, dur: 0.5 });
    if (i === 1 || i === 4 || i === 7) cue(st + Math.min(0.6, d * 0.35), 'slide', { gain: 0.25, dur: 0.9 });
    if (i === 9) cue(st + 0.2, 'pop', { gain: 0.2 });
  }
  return { shots: S, cues: CUES };
}
