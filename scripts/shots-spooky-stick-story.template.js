// GENERIC SPOOKY STICK STORY shot list. visual_labels are injected by scripts/generate_shots.py.
// 12 shots, one per line, with varied spooky scenes and animation (shadows, flashlight, creaks, door, morning light).
import { ctx, W, H, clamp, lerp, seg, eo, eio, eob, rnd, rr, circle, ell, line } from './core/lib.js';
import { L } from './core/timing.js';
import * as K from './core/kit.js';
const { P, GROUND } = K;
const LABELS = @@LABELS@@;

export function buildShots() {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const blink = (t) => ((t % 3.1) < 0.12 ? 1 : 0);

  for (let i = 0; i < LABELS.length; i++) {
    const st = cut(i), text = LABELS[i];
    // Scene selection: distinct environments per shot
    const scene = (i === 0 || i === 5 || i === 6 || i === 7 || i === 9 || i === 10 || i === 11) ? 'living'
                 : (i === 1 || i === 2 || i === 3 || i === 4) ? 'hallway'
                 : 'living';
    const night = i < 10;
    add({ id: `S${String(i + 1).padStart(2, '0')}`, at: st, cam: [540, 1050 + (i % 2) * 60], zoom: i % 3 === 0 ? 0.08 : 0, note: `line ${i + 1}: ${text}`, draw(lt, d, t) {
      // Background
      if (scene === 'hallway') K.hallway({ night, a: '4A', openA: i === 1 ? 0.22 : 0.05, b: '4B', openB: 0 });
      else K.livingRoom({ night, lampOn: !night || i >= 9 });
      if (night) { ctx.fillStyle = 'rgba(5,8,18,0.35)'; ctx.fillRect(-300, -300, W + 600, H + 600); }

      // Animated shadow that slides (shots 0,5,6)
      if (i === 0 || i === 5 || i === 6) {
        const sx = lerp(200, 720, eio(clamp(lt / 1.6)));
        ctx.save(); ctx.globalAlpha = 0.4 + 0.1 * Math.sin(t * 1.5); ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(sx, 780, 90, 230, 0.15, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }

      // Flashlight beam (shot 4)
      if (i === 4) {
        const on = lt > 0.3;
        K.person({ glow: true, x: 420, y: GROUND, h: 840, mood: 'determined', look: [1, 0], arms: { L: [-6, 14], R: [80, 10] }, hold: (x, y) => K.flashlight(x + 10, y, 1.2, on, -0.05) });
      } else {
        const mood = i === 11 ? 'happy' : (i >= 9 ? 'worried' : (i === 1 || i === 5 || i === 6 || i === 7 ? 'scared' : 'determined'));
        K.person({ glow: true, x: 520, y: GROUND, h: 840, mood, lean: i >= 9 ? 8 : 0, look: [Math.sin(lt * 1.4) * 0.35, 0], blink: blink(t),
          arms: i % 2 === 0 ? { L: [-14, 22], R: [42, 26] } : { L: [-6, 14], R: [68, 46] } });
      }

      // Door handle turning (shot 3)
      if (i === 3) {
        ctx.save(); ctx.translate(360, 1080); ctx.rotate(Math.sin(t * 2.5) * 0.4);
        rr(-40, -20, 80, 40, 12); ctx.fillStyle = '#C9BFA9'; ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.stroke();
        ctx.restore();
      }

      // Creak waves (shot 7)
      if (i === 7) {
        ctx.strokeStyle = 'rgba(255,120,120,0.35)'; ctx.lineWidth = 3;
        for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(540, 900, 60 + k * 40 + Math.sin(t * 4) * 8, 0, Math.PI * 2); ctx.stroke(); }
      }

      // Phone (shot 8)
      if (i === 8) K.phone(520, GROUND - 60, 1.1, true);

      // Candle (shot 6)
      if (i === 6) { /* candle removed: not in kit */ }

      K.stepCard(Math.min(4, Math.floor(i / 3) + 1), text, 540, 300, eob(seg(lt, 0.05, 0.3)));
      if (i === 2 || i === 5) K.cross(860, 900, eob(seg(lt, 0.35, 0.6)) * 0.85);
      if (i === 10) K.check(860, 780, eob(seg(lt, 0.35, 0.65)) * 1.2);
      if (i >= 1 && i <= 2) K.cinemaBars(eo(seg(lt, 0.2, 0.5)) * 0.7);
      if (i === 11) { K.check(540, 600, eob(seg(lt, 0, 0.35))); K.counterPill('STAY SAFE', 540, 900, eob(seg(lt, 0.2, 0.45))); }
    } });
    cue(st, 'whoosh');
    cue(st + 0.08, 'pop', { gain: 0.4 });
    if (i === 2 || i === 5) cue(st + 0.38, 'boing', { gain: 0.45 });
    if (i === 7) cue(st + 0.15, 'heartbeat', { gain: 0.6, dur: 1.4 });
    if (i === 10 || i === 11) cue(st + 0.4, 'sparkle', { dur: 0.7 });
  }
  return { shots: S, cues: CUES };
}
