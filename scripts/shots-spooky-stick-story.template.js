// GENERIC STICK STORY shot list. visual_labels are injected by scripts/generate_shots.py.
// Every shot is timed from cut(i) only, so any 12-line sourced script renders without an agent loop.
import { ctx, W, H, clamp, lerp, seg, eo, eio, eob } from './core/lib.js';
import { L } from './core/timing.js';
import * as K from './core/kit.js';
const { P, GROUND } = K;
const LABELS = @@LABELS@@;

export function buildShots() {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const blink = (t) => ((t % 3.1) < 0.12 ? 1 : 0);

  for (let i = 0; i < LABELS.length; i++) {
    const st = cut(i), text = LABELS[i], night = i < 10;
    add({ id: `S${String(i + 1).padStart(2, '0')}`, at: st, cam: [540, 1080 + (i % 3) * 35], zoom: i % 4 === 0 ? 0.07 : 0, note: `line ${i + 1}: ${text}`, draw(lt, d, t) {
      if (i >= 2 && i <= 4) K.kitchen({ night });
      else if (i >= 9 && i <= 10) K.hallway({ night });
      else K.livingRoom({ night, lampOn: !night || i > 9 });
      if (night) { ctx.fillStyle = 'rgba(5,8,18,0.18)'; ctx.fillRect(-300, -300, W + 600, H + 600); }

      const mood = i === 11 ? 'happy' : (i >= 9 ? 'worried' : 'determined');
      const lean = i >= 9 ? 8 : 0;
      K.person({ glow: true, x: 520, y: GROUND, h: 840, mood, lean, look: [Math.sin(lt * 1.4) * 0.35, 0], blink: blink(t),
        arms: i % 2 === 0 ? { L: [-14, 22], R: [42, 26] } : { L: [-6, 14], R: [68, 46] } });

      K.stepCard(Math.min(4, Math.floor(i / 3) + 1), text, 540, 300, eob(seg(lt, 0.05, 0.3)));
      if (i === 2 || i === 5 || i === 8) K.cross(860, 900, eob(seg(lt, 0.35, 0.6)) * 0.85);
      if (i === 11) K.check(860, 780, eob(seg(lt, 0.35, 0.65)) * 1.2);
      if (i >= 9 && i <= 10) K.cinemaBars(eo(seg(lt, 0.2, 0.5)) * 0.7);
    } });
    cue(st, 'whoosh');
    cue(st + 0.08, 'pop', { gain: 0.4 });
    if (i === 2 || i === 5 || i === 8) cue(st + 0.38, 'boing', { gain: 0.45 });
    if (i === 11) cue(st + 0.4, 'sparkle', { dur: 0.7 });
  }
  return { shots: S, cues: CUES };
}
