# Dark Mythology History: old records and dark legends, 9:16

Quiet, reverent, investigative. Dark mythology and history told as what the records or legends say: a burial mound, a
temple, a night market, a field, a river with a strange glow. ONE light source per place, a single red-glowing subject,
everyone else a terracotta silhouette. Parchment maps, gold date ribbons, crimson string and case-file inserts,
typewriter captions, slow camera. No gore. Never accuse a real living person; attribute every claim to a record,
chronicle or legend.

Sheet: `style-sheet.png`. `example/` is the complete runnable reference project (engine, timing, captions, audio). The
cloud workflow replaces its `src/shots.js` with `scripts/shots-dark-mythology-history.template.js` for the 10-line 12:00
slot; the example itself still renders as-is.

## 1. Rules
- 10 lines, 90-110 words total; hook in the first 2 seconds; 10 uppercase labels of at most 14 chars; exactly 2 verified
  `https://` sources. All writing in English and original.
- Voice: low and calm, `am_onyx` x0.95 (`speed: 0.95`), `gap: 0.42`, `music: "tension"`.
- Captions: FreeMono typewriter, 1-3 words, cream with one red word, typed on letter by letter at y 1560. Keep every
  label, ribbon, map and case-file insert above y 1200 so nothing enters the caption zone (y 1250-1550).
- Slow: 3-5 s shots, push-ins and drifts. Soft cues only: `whoosh`, `slide`, `pop` at low gain. No `alarm`, `thud` or
  `slam`.
- One light per scene, with a soft visible cone; everything else falls into darkness.
- Red means THE subject. Other people are terracotta; the world is stone, earth, parchment and gold. Crimson is only for
  string, route marks, pins and case-file stamps.
- Frame each fact as what a record, chronicle or legend says ("the chronicle records...", "the legend tells..."). No
  gore, no weapons shown, no accusations against real living people.

## 2. Engine map (`example/src/`)
The 3D core (`engine.js`, `sdf.js`, `human.js`) and the 2D kit (`lib.js`, `kit.js`, `captions.js`, `timing.js`) are shared
with Night File 3D (see its STYLE.md). Useful pieces:

| file | gives you |
|---|---|
| `core/engine.js` | `makeEngine`, `camera`; `E.render(scene, cam, { bloom, focus, aperture, vignette, grain, t })` |
| `core/human.js` | `new Human({ face: false })`, `.pose()`, `.walk()`, `.setAllMaterial()`; feet at y 0 |
| `core/sets3d.js` | `subjectMat()` (red glow), `witnessMat()`, `lightCone()`; plus corridor/houseNight/caseWall/planeCabin as references |
| `core/kit.js` | `caseFile`, `polaroid`, `dateStamp`, `redCircle`, `captionMono`, `filmLook` |
| `core/timing.js` | `L(i)`, `Le(i)`, `Wd(word, line)` |

The CI template builds its own mound, temple, market, field and mercury-river scenes inline from three.js primitives,
each with one `SpotLight`, then draws the parchment map, gold date ribbon and crimson string in 2D after the blit.

## 3. Story shape
Date + place from the record → the red subject appears → the legend unfolds step by step (map, market, temple, river) →
the case-file and crimson-string insert where accounts meet → what the record says was found later → the open question.
End on the drone.

## 4. QA pitfalls we've hit
- Camera inside a light cone = a flat brown frame. Use a wider lens (fov 36-42) for dark spaces.
- Seats, stalls or columns between camera and subject can block the view; aim at the red figure, not at the set.
- Only one figure may glow red; terracotta witnesses must stay dim.
- Keep all 2D overlays above y 1200; the typewriter caption owns y 1560.
- Rendering speed: see Deep Dive STYLE.md section 5 (`SOFTWARE_GL=1 QS='&res=0.6&aa=0&shadow=1024' FPS=24`).
