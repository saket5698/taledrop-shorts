// SPOOKY STICK STORY 3D shot list. 12 shots, one per line, spooky scenes.
// Reuses the stick-story kit (livingRoom, hallway, door, person, flashlight, candle, phone, stepCard, cross, check, counterPill, cinemaBars).
// All timing is line-based (L(i)) so any 12-line script renders without word dependencies.
import { ctx, W, H, clamp, lerp, seg, eo, eio, eob, rnd, rr, circle, ell, line } from './core/lib.js';
import { L, T } from './core/timing.js';
import * as K from './core/kit.js';
const { P, GROUND } = K;

export function buildShots() {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const blink = (t) => ((t % 3.1) < 0.12 ? 1 : 0);

  // 1 · hook: dark living room, hero on couch, a shadow on the wall
  { const st = cut(0);
    add({ id: 'S01', at: st, cam: [540, 1100], note: 'evening, hero on couch, shadow on wall', draw(lt, d, t) {
      K.livingRoom({ night: true, lampOn: false }); ctx.fillStyle = 'rgba(5,8,18,0.55)'; ctx.fillRect(-300, -300, W + 600, H + 600);
      // shadow on wall
      ctx.save(); ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 1.2); ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(820, 700, 120, 260, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      K.person({ glow: true, x: 520, y: GROUND, h: 840, mood: 'scared', look: [1, 0], blink: blink(t) });
      K.counterPill('11:47 P.M.', 540, 300, eob(seg(lt, 0, 0.3)));
    } });
    cue(st, 'whoosh'); cue(st + 0.4, 'heartbeat', { gain: 0.4, dur: 1.2 }); }

  // 2 · creep: hallway, door slightly open, hero scared
  { const st = cut(1);
    add({ id: 'S02', at: st, cam: [540, 1050], note: 'hallway, door ajar, hero scared', draw(lt, d, t) {
      K.hallway({ night: true, a: '4A', openA: 0.18, b: '4B', openB: 0 });
      ctx.fillStyle = 'rgba(5,8,18,0.4)'; ctx.fillRect(-300, -300, W + 600, H + 600);
      // creak lines
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(260, 900 + i * 40); ctx.lineTo(320, 900 + i * 40 + Math.sin(t * 3 + i) * 6); ctx.stroke(); }
      K.person({ glow: true, x: 760, y: GROUND, h: 840, dir: -1, mood: 'scared', look: [-1, 0], blink: blink(t), arms: { L: [-40, 30], R: [-40, 30] } });
      K.counterPill('DON\u2019T OPEN IT', 540, 300, eob(seg(lt, 0.1, 0.4)));
    } });
    cue(st, 'whoosh'); cue(st + 0.1, 'thud'); }

  // 3 · step 1: don't go toward the sound
  { const st = cut(2);
    add({ id: 'S03', at: st, cam: [540, 1100], note: 'hero stops, red X on the door', draw(lt, d, t) {
      K.hallway({ night: true, a: '4A', openA: 0.18, b: '4B', openB: 0 });
      ctx.fillStyle = 'rgba(5,8,18,0.45)'; ctx.fillRect(-300, -300, W + 600, H + 600);
      K.person({ glow: true, x: 760, y: GROUND, h: 840, dir: -1, mood: 'determined', look: [-1, 0], blink: blink(t) });
      K.cross(270, 900, eob(seg(lt, 0.15, 0.4)));
      K.stepCard(1, 'STAY BACK', 540, 300, eob(seg(lt, 0.05, 0.3)));
    } });
    cue(st, 'whoosh'); cue(st + 0.1, 'pop'); }

  // 4 · close-up: door handle turning
  { const st = cut(3);
    add({ id: 'S04', at: st, cam: [300, 900], zoom: 0.12, note: 'close-up door handle turning', draw(lt, d, t) {
      K.hallway({ night: true, a: '4A', openA: 0.18 + 0.12 * Math.sin(t * 2), b: '4B', openB: 0 });
      ctx.fillStyle = 'rgba(5,8,18,0.5)'; ctx.fillRect(-300, -300, W + 600, H + 600);
      // turning handle
      ctx.save(); ctx.translate(360, 1080); ctx.rotate(Math.sin(t * 2.5) * 0.4);
      rr(-40, -20, 80, 40, 12); ctx.fillStyle = '#C9BFA9'; ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
      K.counterPill('DON\u2019T TOUCH', 540, 330, eob(seg(lt, 0.2, 0.45)));
    } });
    cue(st, 'whoosh'); cue(st + 0.2, 'boing', { gain: 0.5 }); }

  // 5 · step 2: flashlight, not your phone screen
  { const st = cut(4);
    add({ id: 'S05', at: st, cam: [540, 1100], note: 'flashlight beam sweeps the dark', draw(lt, d, t) {
      K.livingRoom({ night: true, lampOn: false }); ctx.fillStyle = 'rgba(5,8,18,0.6)'; ctx.fillRect(-300, -300, W + 600, H + 600);
      const on = lt > 0.3;
      K.person({ glow: true, x: 420, y: GROUND, h: 840, mood: 'determined', look: [1, 0], arms: { L: [-6, 14], R: [80, 10] }, hold: (x, y) => K.flashlight(x + 10, y, 1.2, on, -0.05) });
      K.stepCard(2, 'FLASHLIGHT', 540, 300, eob(seg(lt, 0.05, 0.3)));
    } });
    cue(st, 'whoosh'); cue(st + 0.05, 'pop'); cue(st + 0.3, 'tock'); }

  // 6 · shadow moves across the wall
  { const st = cut(5);
    add({ id: 'S06', at: st, cam: [540, 1000], zoom: 0.12, note: 'shadow slides across the wall', draw(lt, d, t) {
      K.livingRoom({ night: true, lampOn: false }); ctx.fillStyle = 'rgba(5,8,18,0.5)'; ctx.fillRect(-300, -300, W + 600, H + 600);
      const sx = lerp(200, 720, eio(clamp(lt / 1.6)));
      ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(sx, 760, 90, 220, 0.15, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      K.person({ glow: true, x: 520, y: GROUND, h: 840, mood: 'scared', look: [1, -0.3], blink: blink(t) });
      K.counterPill('IT MOVED', 540, 330, eob(seg(lt, 0.3, 0.55)));
    } });
    cue(st, 'whoosh'); cue(st + 0.3, 'heartbeat', { gain: 0.5, dur: 1.2 }); }

  // 7 · step 3: stay quiet, hide
  { const st = cut(6);
    add({ id: 'S07', at: st, cam: [540, 1100], note: 'hero hides behind the couch', draw(lt, d, t) {
      K.livingRoom({ night: true, lampOn: false }); ctx.fillStyle = 'rgba(5,8,18,0.6)'; ctx.fillRect(-300, -300, W + 600, H + 600);
      K.person({ glow: true, x: 900, y: GROUND, h: 840, dir: -1, mood: 'scared', look: [-1, 0], blink: 0, arms: { L: [-60, 20], R: [-60, 20] } });
      K.stepCard(3, 'STAY QUIET', 540, 300, eob(seg(lt, 0.05, 0.3)));
    } });
    cue(st, 'whoosh'); cue(st + 0.05, 'pop'); }

  // 8 · threat: creaking sound
  { const st = cut(7);
    add({ id: 'S08', at: st, cam: [540, 1000], zoom: 0.12, note: 'creak lines, heartbeat', draw(lt, d, t) {
      K.livingRoom({ night: true, lampOn: false }); ctx.fillStyle = 'rgba(5,8,18,0.65)'; ctx.fillRect(-300, -300, W + 600, H + 600);
      // creak waves
      ctx.strokeStyle = 'rgba(255,120,120,0.35)'; ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(540, 900, 60 + i * 40 + Math.sin(t * 4) * 8, 0, Math.PI * 2); ctx.stroke(); }
      K.counterPill('CREAK...', 540, 330, eob(seg(lt, 0.15, 0.4)));
    } });
    cue(st, 'whoosh'); cue(st + 0.15, 'heartbeat', { gain: 0.6, dur: 1.4 }); }

  // 9 · step 4: call for help
  { const st = cut(8);
    add({ id: 'S09', at: st, cam: [540, 1100], note: 'hero pulls out phone, dials', draw(lt, d, t) {
      K.livingRoom({ night: true, lampOn: false }); ctx.fillStyle = 'rgba(5,8,18,0.5)'; ctx.fillRect(-300, -300, W + 600, H + 600);
      K.person({ glow: true, x: 520, y: GROUND, h: 840, mood: 'determined', look: [0.5, -0.5], blink: blink(t), hold: (x, y) => K.phone(x, y - 60, 1.1, true) });
      K.stepCard(4, 'CALL FOR HELP', 540, 300, eob(seg(lt, 0.05, 0.3)));
    } });
    cue(st, 'whoosh'); cue(st + 0.05, 'pop'); }

  // 10 · payoff: lights flicker on
  { const st = cut(9);
    add({ id: 'S10', at: st, cam: [540, 1000], note: 'lights flicker back on', draw(lt, d, t) {
      K.livingRoom({ night: true, lampOn: lt > 0.4 }); ctx.fillStyle = lt > 0.4 ? 'rgba(240,220,160,0.15)' : 'rgba(5,8,18,0.4)'; ctx.fillRect(-300, -300, W + 600, H + 600);
      K.person({ glow: true, x: 520, y: GROUND, h: 840, mood: lt > 0.4 ? 'happy' : 'scared', look: [0, 0], blink: blink(t) });
      K.counterPill(lt > 0.4 ? 'SAFE' : '...', 540, 330, eob(seg(lt, 0.1, 0.4)));
    } });
    cue(st, 'whoosh'); cue(st + 0.4, 'sparkle', { dur: 0.8 }); }

  // 11 · morning: daylight, hero relaxed
  { const st = cut(10);
    add({ id: 'S11', at: st, cam: [540, 1000], note: 'daylight, hero relaxed', draw(lt, d, t) {
      K.livingRoom({ night: false, lampOn: true }); ctx.fillStyle = 'rgba(240,220,160,0.08)'; ctx.fillRect(-300, -300, W + 600, H + 600);
      K.person({ glow: false, x: 520, y: GROUND, h: 840, mood: 'happy', look: [0.5, -0.3], blink: blink(t) });
      K.check(880, 500, eob(seg(lt, 0.2, 0.45)));
    } });
    cue(st, 'whoosh'); }

  // 12 · outro: big check, end card
  { const st = cut(11);
    add({ id: 'S12', at: st, cam: [540, 1000], zoom: 0.1, note: 'end card, big check', draw(lt, d, t) {
      K.livingRoom({ night: false, lampOn: true });
      K.person({ glow: false, x: 520, y: GROUND, h: 840, mood: 'happy', look: [0.5, -0.3], blink: blink(t) });
      K.check(540, 600, eob(seg(lt, 0, 0.35)));
      K.counterPill('STAY SAFE', 540, 900, eob(seg(lt, 0.2, 0.45)));
    } });
    cue(st, 'whoosh'); cue(st + 0.2, 'sparkle', { dur: 0.6 }); }

  return { shots: S, cues: CUES };
}
