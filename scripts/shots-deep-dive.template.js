// GENERIC DEEP DIVE 3D shot list. visual_labels are injected by scripts/generate_shots.py.
// Every shot is timed from cut(i) only, so any 10-line sourced script renders without an agent loop.
import * as THREE from 'three';
import { ctx, W, H, clamp, lerp, seg, eo, eio, eob } from './core/lib.js';
import { L } from './core/timing.js';
import { camera } from './core/engine.js';
import { Human } from './core/human.js';
import * as SETS from './core/sets.js';
import { label, pill, warning, blackout } from './core/look2d.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lerpV = (a, b, k) => a.clone().lerp(b, k);
function screen(p, cam) { const v = p.clone().project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; }
const LABELS = @@LABELS@@;

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const cam = camera(30);
  const KLOOK = { aperture: 0.003, maxblur: 0.01, bloom: 0.2 };
  const XLOOK = { aperture: 0.0015, bloom: 0.55, bloomThreshold: 0.4, vignette: 0.45 };
  const VLOOK = { aperture: 0.005, maxblur: 0.012, bloom: 0.6, bloomThreshold: 0.5, focus: 3.2 };

  const K = SETS.kitchen(E), hero = new Human({}); hero.group.position.set(0.1, 0, -0.6); K.scene.add(hero.group);
  const X = SETS.xrayStage(E), xh = new Human({}), xmat = SETS.xrayMaterial();
  xh.setBodyMaterial(xmat); const I = SETS.insides(); xh.spine.add(I.group); X.scene.add(xh.group);
  const VS = SETS.vessel(E);
  const CYAN = new THREE.Color('#4FD1E8'), RED = new THREE.Color('#FF3B3B');
  const FACE = V3(0.1, 1.68, -0.6);
  const pulse = (lt, speed = 5) => 0.5 + 0.5 * Math.sin(lt * speed);
  const reset = () => { hero.pose({}); xh.pose({}); xmat.uniforms.uCol.value.copy(CYAN); I.heart.scale.setScalar(1); };

  for (let i = 0; i < LABELS.length; i++) {
    const st = cut(i), text = LABELS[i];
    add({ id: `S${String(i + 1).padStart(2, '0')}`, at: st, note: `line ${i + 1}: ${text}`, draw(lt, d, t, blit) {
      reset();
      const k = eio(clamp(lt / Math.max(0.25, d)));
      if (i <= 1) {
        hero.pose({ head: [4 * Math.sin(lt * 1.8), -4 + 3 * k, 0], lid: -0.12, look: [0, 0], shL: [5, 0, 6], shR: [5, 0, 6] });
        cam.position.copy(lerpV(V3(0.42, 1.72, 0.46), V3(0.28, 1.68, 0.1), k)); cam.lookAt(FACE);
        E.render(K.scene, cam, { ...KLOOK, focus: cam.position.distanceTo(FACE) }); blit();
        pill(text, 540, 360, eob(seg(lt, 0.05, 0.3)), '#FFD43B', 'rgba(12,14,20,0.8)', 64);
      } else if (i <= 4) {
        const p = pulse(lt, 4 + i * 0.4);
        I.heart.scale.setScalar(1 + p * 0.12);
        xh.pose({ head: [3, -4, 0], lid: -0.2, spine: [0, 0, Math.sin(lt * 3) * 0.8] });
        cam.position.copy(lerpV(V3(0.5, 1.5, 1.65), V3(0.3, 1.42, 1.05), k)); cam.lookAt(0, 1.33, 0);
        E.render(X.scene, cam, { ...XLOOK, focus: cam.position.distanceTo(V3(0, 1.33, 0)) }); blit();
        label(text, 760, 520, ...screen(V3(0.1, 1.42, 0.05), cam), eob(seg(lt, 0.15, 0.4)));
      } else if (i <= 7) {
        VS.update(t, -lt * 1.4, 0.12 + 0.78 * k, 0.3 * k);
        cam.position.set(Math.sin(lt * 0.8) * 0.12, 0, -lt * 1.4); cam.lookAt(0.15, -0.08, -lt * 1.4 - 5);
        E.render(VS.scene, cam, VLOOK); blit();
        pill(text, 540, 330, eob(seg(lt, 0.1, 0.35)), '#FFFFFF', 'rgba(12,14,20,0.8)', 64);
      } else {
        const p = pulse(lt, 6);
        I.heart.scale.setScalar(1 + p * 0.16);
        xmat.uniforms.uCol.value.copy(CYAN).lerp(RED, 0.4 + 0.5 * p);
        xh.pose({ head: [-4, 8 * Math.sin(lt), 0], lid: -0.3, spine: [0, 0, Math.sin(lt * 6) * 1.2] });
        cam.position.copy(lerpV(V3(-0.4, 1.6, 1.9), V3(-0.15, 1.6, 1.25), k)); cam.lookAt(0, 1.45, 0);
        E.render(X.scene, cam, { ...XLOOK, bloom: 0.75, focus: cam.position.distanceTo(V3(0, 1.45, 0)) }); blit();
        pill(text, 540, 1180, eob(seg(lt, 0.2, 0.45)), '#FF8A8A', 'rgba(12,14,20,0.82)', 64);
        if (i === 8) warning(540, 620, eob(seg(lt, 0.3, 0.6)) * 0.9);
        if (i === 9) blackout(seg(lt, d * 0.7, d) * 0.35);
      }
    } });
    cue(st, 'whoosh');
    if (i === 0) cue(st + 0.16, 'pop', { gain: 0.55 });
    if (i === 8) cue(st + 0.3, 'alarm', { dur: 1.1, gain: 0.55 });
  }
  return { shots: S, cues: CUES };
}
