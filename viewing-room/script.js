/* ===== EDIT HERE ===== */
const PHOTO = "images/face1.jpg";          // the photo for the case file (it is shown with a grainy "leaked photo" filter). Missing = a placeholder is shown instead.
const WATERMARK = "UNVERIFIED";            // small text in the corner of the "leaked" photo
const STAMP = "03.14.2009  02:47";         // camera date stamp on the photo
const CASE = {                             // what the case file says
  title: "UNIDENTIFIED MALE",
  no: "2009-0314-07",
  rows: [
    ["Estimated age", "# (\u00B1 1 years)"], ["Sex", "Male"], ["Height / weight", "158 cm / 85 kg"], ["Hair / eyes", "Dark brown / closed"],
    ["Recovered", "14 March 2026, 02:47"], ["Location", "Riverbank, below the north bridge"], ["Time since death", "36\u201348 hours (est.)"],
    ["Cause of death", "Pending examination"], ["Marks", "Healed fracture, left wrist. No tattoos."], ["Effects", "None recovered"]
  ],
  notes: "Rigor does not match the estimate. He was still warm when we brought him in. Please don't leave the room dark."
};
/* ====================== */
const $ = id => document.getElementById(id);
const slab = $("slab"), cover = $("cover"), face = $("face"), hint = $("hint");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
let revealed = false, drag = null;

// ===== Opening: a cold-room door swings open, then you walk through it =====
const intro = $("intro");
let introPending = !!intro;
let safeMode = true; try { safeMode = localStorage.getItem("morgue.safe") !== "0"; } catch (e) {}   // epilepsy mode: ON unless you switched it off
let chaos = 0;                                                  // extra flicker pushed in by the black box (-1 to 1)
function openIntro() {
  if (!introPending) return;
  if (intro.classList.contains("go")) { intro.classList.add("through"); return; }    // a second click hurries you through
  intro.classList.add("go");                                    // the lever drops, the door swings
  playDoor();
  const k = reduce ? .45 : 1;                                   // reduced motion: the door fades open instead of swinging
  setTimeout(() => intro.classList.add("through"), 3100 * k);
  setTimeout(() => { intro.remove(); introPending = false; document.body.classList.remove("introing"); if (!lampLit) darkSince = performance.now(); }, 4600 * k);
}
if (introPending) {
  document.body.classList.add("introing");
  intro.addEventListener("click", openIntro);
  addEventListener("keydown", e => { if (introPending && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openIntro(); } });
  setTimeout(openIntro, reduce ? 2500 : 6500);
}

// ===== the photo =====
const loadImg = src => new Promise(r => {
  const i = new Image();
  i.onload = async () => { try { r(await createImageBitmap(i)); } catch (e) { r(i); } };   // a bitmap has the true, upright size (phone photos are often stored sideways)
  i.onerror = () => r(null); i.src = src;
});
function placeholder() {                   // a stand-in face: used for the mosaic when there is no photo yet
  const c = document.createElement("canvas"); c.width = 600; c.height = 800; const x = c.getContext("2d");
  x.fillStyle = "#222a29"; x.fillRect(0, 0, 600, 800);
  const g = x.createRadialGradient(270, 330, 40, 300, 380, 260); g.addColorStop(0, "#d4cdbd"); g.addColorStop(1, "#8f8a7c");
  x.fillStyle = g; x.beginPath(); x.ellipse(300, 390, 170, 230, 0, 0, 7); x.fill();
  x.fillStyle = "#17120f"; x.beginPath(); x.ellipse(300, 230, 178, 118, 0, Math.PI, 0); x.fill();
  x.strokeStyle = "#3b332c"; x.lineWidth = 9; x.lineCap = "round";
  [[215, 395, 275, 395], [325, 395, 385, 395], [262, 545, 338, 545]].forEach(([a, b, c2, d]) => { x.beginPath(); x.moveTo(a, b); x.lineTo(c2, d); x.stroke(); });
  return c;
}
let photo = null;
function cropOf(src, ratio) {              // centred, leaning towards the top (where faces are)
  const cw = Math.min(src.width, src.height * ratio), ch = cw / ratio;
  return [(src.width - cw) / 2, (src.height - ch) * .25, cw, ch];
}
const zoomIn = ([x, y, w, h], z) => [x + w * (1 - z) / 2, y + h * (1 - z) * .4, w * z, h * z];   // closer on the face
function drawMosaic(src) {                 // an extreme mosaic: 9 x 12 blocks, drained of colour to sit in the lamp's cold light
  const W = 9, H = 12, mid = document.createElement("canvas"); mid.width = W * 4; mid.height = H * 4;
  const m = mid.getContext("2d"); m.imageSmoothingQuality = "high"; m.drawImage(src, ...zoomIn(cropOf(src, W / H), .7), 0, 0, mid.width, mid.height);
  const x = face.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(mid, 0, 0, W, H);
  // (only canvas blending below, never reading pixels back: browsers refuse that for images opened straight from disk)
  x.globalCompositeOperation = "saturation"; x.fillStyle = "#777"; x.globalAlpha = .8; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = "multiply"; x.fillStyle = "#9fb0b8"; x.globalAlpha = .45; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
}
// the "leaked photo" look: low-res capture -> harsh flash -> drained colour -> grain -> heavy JPEG -> date stamp
// (built from canvas blending only, so it also works for a photo opened straight from disk)
function leak(img) {
  const W = 420, H = 560, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
  const [sx, sy, sw, sh] = cropOf(img, W / H);
  const lo = document.createElement("canvas"); lo.width = 150; lo.height = 200; lo.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, 150, 200);
  x.drawImage(lo, 0, 0, W, H);                                                                        // low-res capture, blown up
  const lo2 = document.createElement("canvas"); lo2.width = 70; lo2.height = 93; lo2.getContext("2d").drawImage(lo, 0, 0, 70, 93);
  x.imageSmoothingEnabled = false; x.globalAlpha = .26; x.drawImage(lo2, 0, 0, W, H); x.imageSmoothingEnabled = true;   // blocky compression artefacts
  x.globalCompositeOperation = "screen"; x.globalAlpha = .55; x.drawImage(lo, 0, 0, W, H);            // auto-exposure: a dark photo is lifted, a bright one just blows out like a flash
  x.globalAlpha = 1;
  x.globalCompositeOperation = "saturation"; x.fillStyle = "#808080"; x.globalAlpha = .66; x.fillRect(0, 0, W, H);   // drained colour
  x.globalCompositeOperation = "overlay"; x.globalAlpha = .6; x.drawImage(lo, 0, 0, W, H);           // harsh contrast
  x.globalCompositeOperation = "screen"; x.globalAlpha = 1;
  let g = x.createRadialGradient(W * .5, H * .42, 10, W * .5, H * .42, W * .6); g.addColorStop(0, "rgba(255,246,220,.42)"); g.addColorStop(1, "rgba(255,246,220,0)");
  x.fillStyle = g; x.fillRect(0, 0, W, H);                                                            // flash hotspot
  x.globalCompositeOperation = "multiply";
  g = x.createRadialGradient(W * .5, H * .45, H * .2, W * .5, H * .5, H * .72); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,.5)");
  x.fillStyle = g; x.fillRect(0, 0, W, H);                                                            // dark corners
  x.fillStyle = "rgba(215,225,190,1)"; x.globalAlpha = .14; x.fillRect(0, 0, W, H);                  // sickly cast
  x.globalCompositeOperation = "screen"; x.fillStyle = "rgb(34,38,34)"; x.globalAlpha = .6; x.fillRect(0, 0, W, H);   // lift the blacks, so a dark photo does not vanish
  const n = document.createElement("canvas"); n.width = W / 2; n.height = H / 2; const nx = n.getContext("2d"), nd = nx.createImageData(n.width, n.height);
  for (let i = 0; i < nd.data.length; i += 4) { const v = Math.random() * 255; nd.data[i] = nd.data[i + 1] = nd.data[i + 2] = v; nd.data[i + 3] = 255; }
  nx.putImageData(nd, 0, 0);
  x.globalCompositeOperation = "overlay"; x.globalAlpha = .42; x.drawImage(n, 0, 0, W, H);            // grain
  x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.fillStyle = "rgba(0,0,0,.09)";
  for (let y = 0; y < H; y += 2) x.fillRect(0, y, W, 1);                                              // scanlines
  return new Promise(res => {
    const stamp = () => {
      x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
      x.font = "bold 16px 'Courier New',monospace"; x.shadowColor = "#000"; x.shadowBlur = 3;
      x.fillStyle = "#ffa733"; x.textAlign = "right"; x.fillText(STAMP, W - 10, H - 12);
      x.fillStyle = "rgba(255,255,255,.55)"; x.textAlign = "left"; x.font = "13px 'Courier New',monospace"; x.fillText(WATERMARK, 10, H - 12);
      res(c);
    };
    let url; try { url = c.toDataURL("image/jpeg", .13); } catch (e) { return stamp(); }              // heavy compression (skipped if the browser won't allow it)
    const j = new Image(); j.onload = () => { x.drawImage(j, 0, 0); stamp(); }; j.src = url;
  });
}
// the photo is looked for as PHOTO first, then as face1 / face / photo with .jpg .jpeg .png .webp (any capitals) in the images folder
const PHOTO_TRY = [PHOTO, ...["face1", "face", "photo"].flatMap(n => ["jpg", "jpeg", "png", "webp", "JPG", "JPEG", "PNG"].map(x => `images/${n}.${x}`))];
async function findPhoto() { for (const p of [...new Set(PHOTO_TRY)]) { const im = await loadImg(p); if (im) return { im, path: p }; } return null; }
(async () => {
  const msg = $("holder-path"), pic = $("pic");
  const found = await findPhoto();
  photo = found && found.im;
  try { drawMosaic(photo || placeholder()); } catch (e) { console.warn("mosaic failed:", e); }
  msg.textContent = "place your photo at " + PHOTO + "  (jpg, jpeg, png or webp)";
  if (photo) {
    try { const c = await leak(photo); pic.getContext("2d").drawImage(c, 0, 0); pic.parentNode.classList.add("has"); }
    catch (e) { console.warn("photo filter failed:", e); msg.textContent = found.path + " loaded, but could not be processed: " + e.message; }
  }
})();

// ===== the case file =====
$("f-tab").textContent = "CASE FILE \u00B7 SLAB 07"; $("f-title").textContent = CASE.title; $("f-no").textContent = "CASE NO. " + CASE.no; $("f-notes").textContent = CASE.notes;
$("f-list").innerHTML = CASE.rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
const file = $("file");
function openFile() { file.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => file.classList.add("open"))); $("f-close").focus({ preventScroll: true }); }
function closeFile() { file.classList.remove("open"); setTimeout(() => { file.hidden = true; }, 400); }
face.addEventListener("click", () => { if (revealed && !window.__s3) openFile(); });
face.addEventListener("keydown", e => { if (revealed && !window.__s3 && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openFile(); } });
$("f-close").addEventListener("click", closeFile);
file.addEventListener("click", e => { if (e.target === file) closeFile(); });
addEventListener("keydown", e => { if (e.key === "Escape" && !file.hidden) closeFile(); });

// ===== the sheet =====
const setCover = (dx, dy) => cover.style.transform = `translate(${dx}px,${dy}px) rotate(${dx / 10}deg)`;
function reveal() {
  if (revealed) return; revealed = true;
  setCover(44, 228); slab.classList.add("revealed"); face.tabIndex = 0; face.setAttribute("role", "button");
  $("flash").classList.remove("go"); void $("flash").offsetWidth; $("flash").classList.add("go");   // camera flash
  hint.textContent = "Look closer.";
}
function recover() { revealed = false; slab.classList.remove("revealed"); face.tabIndex = -1; setCover(0, 0); hint.textContent = "Something is under the sheet."; if (!file.hidden) closeFile(); }
cover.addEventListener("pointerdown", e => { if (revealed) return; drag = { x: e.clientX, y: e.clientY, m: 0 }; cover.setPointerCapture(e.pointerId); slab.classList.add("dragging"); });
cover.addEventListener("pointermove", e => {
  if (!drag) return;
  const u = 800 / slab.getBoundingClientRect().height, dx = (e.clientX - drag.x) * u, dy = Math.max(0, (e.clientY - drag.y) * u);
  drag.m = Math.max(drag.m, Math.abs(dx) + dy); drag.dy = dy; setCover(dx * .4, dy);
});
cover.addEventListener("pointerup", () => {
  if (!drag) return; const d = drag; drag = null; slab.classList.remove("dragging");
  if (d.m < 8 || d.dy > 55) reveal(); else setCover(0, 0);      // a tap or a good pull uncovers it; a small tug springs back
});
cover.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reveal(); } });
$("recover").addEventListener("click", recover);
setInterval(() => { if (revealed) { face.classList.add("glitch"); setTimeout(() => face.classList.remove("glitch"), 90); } }, 4000 + Math.random() * 5000);

/* ============ lights, sound & hallucinations (same as the portfolio, minus the heart monitor) ============ */
const dark = $("dark"), lamp = $("lamp"), lights = $("lights"), soundBtn = $("sound"), halluc = $("halluc"), glowLayer = $("glow");

// Flicker: briefly cuts the light. [ms since start, how far it drops: 0 normal .. 1 almost out].
// The last 0.52s of Light_buzzing.mp3 has this same pattern baked in, so the hum stutters with the light.
const FLICKER = [[0,.85],[70,0],[130,.6],[180,.05],[230,.9],[290,0],[400,.5],[450,0]], FLICKER_END = 520;
let flickAt = -1, buzzFlicked = false;
const startFlicker = () => flickAt = performance.now();
function flickLevel(now) {
  if (flickAt < 0) return 0;
  const e = now - flickAt;
  if (safeMode) { if (e > 1100) { flickAt = -1; return 0; } return .42 * Math.sin(Math.PI * e / 1100); }   // epilepsy mode: one slow, gentle dip instead of a strobe
  if (e > FLICKER_END) { flickAt = -1; return 0; }
  let lv = 0; for (const [t, l] of FLICKER) if (e >= t) lv = l; return lv;
}

// ---------- audio ----------  (browsers block sound until the visitor interacts, so it starts on the first click/key/tap)
const AUDIO_DIR = "../audio/";   // shared with the portfolio. If you copy the MP3s into viewing-room/audio/ it finds them there too.
const missing = new Set();
function renderSoundBtn() { soundBtn.textContent = "Sound: " + (soundOn ? "on" : "off") + (missing.size ? " \u26A0 can't find " + [...missing].join(", ") : ""); }
const mk = (file, vol, loop) => {
  const a = new Audio(AUDIO_DIR + file); a.volume = vol; a.loop = !!loop; a.preload = "auto";
  a.addEventListener("error", () => {
    if (!a.dataset.retried) { a.dataset.retried = "1"; a.src = "audio/" + file; a.load(); syncAudio(); }
    else { console.warn("Could not load audio:", a.src); missing.add(file); soundBtn.title = "Tried: " + a.src; renderSoundBtn(); }
  });
  return a;
};
const sfx = { click: mk("Light_switch.mp3", .7), buzz: mk("Light_buzzing.mp3", 0, true), whisper: mk("Whispers.mp3", 0, true), door: mk("Door_creak.mp3", .9) };
let soundOn = true, unlocked = false, buzzWanted = false, buzzEnv = 0, whVol = 0;
let lampLit = false, lightsOn = false, lampTimers = [], darkSince = introPending ? 0 : performance.now();   // the room starts DARK; darkSince = when the lamp last went out
const BUZZ_VOL = .25, WHISPER_MAX = 1, DARK_MAX = .97;
function syncAudio() {
  buzzWanted = soundOn && unlocked && !document.hidden && lampLit;
  if (buzzWanted && sfx.buzz.paused) sfx.buzz.play().catch(() => {});
}
function playSwitch() { if (!soundOn) return; sfx.click.currentTime = 0; sfx.click.play().catch(() => {}); }
function playDoor() { if (!soundOn) return; sfx.door.currentTime = 0; sfx.door.play().catch(() => {}); }
["pointerdown", "keydown"].forEach(ev => addEventListener(ev, () => { unlocked = true; syncAudio(); }, { once: true }));
document.addEventListener("visibilitychange", syncAudio);
soundBtn.addEventListener("click", () => { soundOn = !soundOn; soundBtn.setAttribute("aria-pressed", soundOn); renderSoundBtn(); syncAudio(); });

// ---------- the room light ----------
// You arrive in the dark. Light ON: the lamp drops in and lights. Light OFF: the lamp goes out and the room is nearly black.
const LAMP_DROP_MS = 1150, LAMP_HAUL_MS = 550;
function lampLight(on) { lampLit = on; lamp.classList.toggle("on", on); darkSince = on ? 0 : performance.now(); syncAudio(); }
lights.addEventListener("click", () => {
  lampTimers.forEach(clearTimeout); lampTimers = [];
  lightsOn = !lightsOn;
  lights.setAttribute("aria-pressed", lightsOn); lights.textContent = "Light: " + (lightsOn ? "on" : "off");
  playSwitch();
  if (lightsOn) {
    const wasDown = lamp.classList.contains("down");
    lamp.classList.add("down");
    lampTimers.push(setTimeout(() => { lampLight(true); playSwitch(); if (!reduce) startFlicker(); }, wasDown ? 350 : LAMP_DROP_MS));
  } else {
    lampLight(false);
    lampTimers.push(setTimeout(() => lamp.classList.remove("down"), LAMP_HAUL_MS));
  }
  applyDark(performance.now());
});

// random flicker every 10-15 s (while the buzzing plays, its loop sets the rhythm instead)
if (!reduce) (function schedule() {
  setTimeout(() => { if (!(lampLit && !sfx.buzz.paused)) startFlicker(); schedule(); }, 10000 + Math.random() * 5000);
})();

// ---------- hallucinations: after 4 s without light the room starts talking to you, slowly ----------
const HALLUC_AFTER = 4000;    // ms after the light goes out before it starts
const HALLUC_RAMP = 70000;    // ms after that until it is at its worst (it creeps in: the first minute is mostly whispers and the odd word)
const hallucActive = now => !lampLit && darkSince > 0 && now - darkSince > HALLUC_AFTER;
const intensity = now => { if (!hallucActive(now)) return 0; const x = Math.min(1, (now - darkSince - HALLUC_AFTER) / HALLUC_RAMP); return x * x * (1.4 - .4 * x); };   // eased: slow at first
// the voices want you to stop: stop fighting, stay, leave it dark
const LINES = ["stop fighting it", "rest now", "let it go", "the dark is kind", "you've done enough", "stay with us", "it's quiet here", "just close your eyes",
  "leave it dark", "you don't need the light", "it's quiet under the sheet", "stay a while"];
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.random() * arr.length | 0];
let nextSpawn = 0;
function spawn(i) {
  if (halluc.children.length > 7) return;
  const el = document.createElement("i");
  if (Math.random() < (i < .08 ? 1 : .62)) {   // a whispered invitation (only words at first)
    el.className = "word"; el.textContent = pick(LINES);
    el.style.cssText = `left:${rnd(4, 68)}%;top:${rnd(12, 85)}%;--a:${(.08 + .5 * i).toFixed(2)}`;
  } else {                                      // a warm light that drifts toward the middle: somewhere safe to go
    const fromLeft = Math.random() < .5;
    el.className = "lure"; el.style.cssText = `left:${fromLeft ? 4 : 92}%;top:${rnd(20, 75)}%;--tx:${fromLeft ? 38 : -38}vw;--ty:${rnd(-8, 8).toFixed(1)}vh;--a:${(.06 + .4 * i).toFixed(2)}`;
  }
  el.addEventListener("animationend", () => el.remove());
  halluc.appendChild(el);
}
function hallucTick(now) {
  const active = hallucActive(now), i = intensity(now);
  halluc.classList.toggle("on", active); slab.classList.toggle("haunted", active);
  halluc.style.setProperty("--hi", i.toFixed(3));
  if (active) {
    if (nextSpawn === 0) nextSpawn = now + 3500;
    if (now > nextSpawn) { spawn(i); nextSpawn = now + (6500 - 5000 * i) * rnd(.6, 1.4); }
  } else if (halluc.firstChild) { halluc.replaceChildren(); nextSpawn = 0; }     // the light chases them off
}

// ---------- dim glowing lights: something to find in the dark ----------
const GLOWS = [
  { x: .93, y: .1,  c: "88,214,141", w: 40, h: 16, cls: "exit", text: "EXIT" },                     // exit sign over a door
  { x: .07, y: .1,  c: "255,60,60",  w: 5,  h: 5,  cls: "blink" },                                 // a camera's recording light
  { el: ".slab", x: .97, y: .55, c: "88,214,141", w: 5, h: 5 },                                      // instrument lights on the slab frame
  { el: ".slab", x: .03, y: .55, c: "255,179,71", w: 5, h: 5, cls: "blink" }
];
GLOWS.forEach(g => {
  g.t = g.el ? document.querySelector(g.el) : null;
  g.node = document.createElement("i"); g.node.className = "led " + (g.cls || "");
  g.node.style.cssText = `width:${g.w}px;height:${g.h}px;--c:${g.c}`;
  if (g.text) g.node.textContent = g.text;
  glowLayer.appendChild(g.node);
});
function updateGlows(v) {                                       // v: how dark it is right now (0 to 1)
  const show = Math.max(0, Math.min(1, (v - .6) / .3));         // they only appear once it is properly dark
  GLOWS.forEach(g => {
    g.node.style.opacity = show > 0 ? (show * .55).toFixed(2) : 0;   // very dim
    if (show <= 0) return;
    const r = g.t ? g.t.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
    g.node.style.transform = `translate(${(r.left + r.width * g.x - g.w / 2).toFixed(1)}px,${(r.top + r.height * g.y - g.h / 2).toFixed(1)}px)`;
  });
}

// ---------- darkness ----------
let dk = DARK_MAX, lastD = performance.now();
function applyDark(now) {
  const f = flickLevel(now), target = lampLit ? 0 : DARK_MAX, step = now - lastD; lastD = now;
  dk = reduce ? target : (target > dk ? Math.min(target, dk + step / 120) : Math.max(target, dk - step / 250));   // blacks out fast, brightens a little slower
  const v = Math.min(DARK_MAX, Math.max(0, Math.max(dk, .9 * f) + chaos));                               // every flicker cuts the light
  dark.style.setProperty("--dk", v.toFixed(3));
  lamp.style.setProperty("--lit", (1 - .85 * Math.max(f, Math.abs(chaos))).toFixed(2));   // the bulb dims with every flicker
  updateGlows(v);
}

// ---------- one frame loop ----------
let lastA = performance.now();
(function frame() {
  const now = performance.now(), dt = Math.max(0, now - lastA); lastA = now;
  // the buzz fades in/out smoothly and cuts out with every flicker
  buzzEnv = buzzWanted ? Math.min(1, buzzEnv + dt / 200) : Math.max(0, buzzEnv - dt / 250);
  sfx.buzz.volume = BUZZ_VOL * buzzEnv * (1 - .9 * Math.min(1, flickLevel(now)));
  if (!buzzWanted && buzzEnv === 0 && !sfx.buzz.paused) { sfx.buzz.pause(); sfx.buzz.currentTime = 0; }
  // whispers: silent until the hallucinations start, then louder and louder; gone the moment the light is back
  const wT = (soundOn && unlocked && !document.hidden && hallucActive(now)) ? WHISPER_MAX * (.04 + .96 * intensity(now)) : 0;
  whVol += (wT - whVol) * Math.min(1, dt / (wT > whVol ? 900 : 250));
  sfx.whisper.volume = Math.min(1, Math.max(0, whVol));
  if (wT > 0 && sfx.whisper.paused) sfx.whisper.play().catch(() => {});
  if (wT === 0 && whVol < .01 && !sfx.whisper.paused) { sfx.whisper.pause(); sfx.whisper.currentTime = 0; whVol = 0; }
  // loop-synced flicker: start the light flicker as the baked-in stutter at the end of the buzz begins
  const bz = sfx.buzz;
  if (!reduce && !bz.paused && bz.duration) {
    const left = (bz.duration - bz.currentTime) * 1000;
    if (left > 0 && left <= FLICKER_END) { if (!buzzFlicked) { buzzFlicked = true; flickAt = safeMode ? now : now - (FLICKER_END - left); } }
    else if (left > FLICKER_END + 500) buzzFlicked = false;
  }
  applyDark(now);
  if (!reduce) hallucTick(now);
  if (typeof Atmos !== "undefined") Atmos.tick();
  requestAnimationFrame(frame);
})();
