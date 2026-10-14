/* ===== EDIT HERE: your photos (put them in the images folder) ===== */
const FACES = ["images/face1.jpg", "images/face2.jpg", "images/face3.jpg"];
const WATERMARK = "UNVERIFIED";            // small text in the corner of the "leaked" photo
const STAMP = "03.14.2009  02:47";         // camera date stamp
/* ================================================================== */
const $ = id => document.getElementById(id);
const slab = $("slab"), cover = $("cover"), face = $("face"), fctx = face.getContext("2d"), hint = $("hint");
let photos = [], cur = 0, filterOn = true, revealed = false, drag = null, last = null;

// ---------- photos ----------
const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
function placeholder() {               // used until you add real photos
  const c = document.createElement("canvas"); c.width = 600; c.height = 800; const x = c.getContext("2d");
  x.fillStyle = "#222a29"; x.fillRect(0, 0, 600, 800);
  x.fillStyle = "#2b3333"; x.beginPath(); x.ellipse(300, 860, 300, 190, 0, 0, 7); x.fill();
  const g = x.createRadialGradient(270, 330, 40, 300, 380, 260); g.addColorStop(0, "#d4cdbd"); g.addColorStop(1, "#8f8a7c");
  x.fillStyle = g; x.beginPath(); x.ellipse(300, 390, 170, 230, 0, 0, 7); x.fill();
  x.fillStyle = "#17120f"; x.beginPath(); x.ellipse(300, 230, 178, 118, 0, Math.PI, 0); x.fill();
  x.strokeStyle = "#3b332c"; x.lineWidth = 7; x.lineCap = "round";
  [[215, 385, 275, 390], [325, 390, 385, 385]].forEach(([a, b, c2, d]) => { x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo((a + c2) / 2, b + 14, c2, d); x.stroke(); });
  x.strokeStyle = "rgba(60,50,60,.55)"; x.lineWidth = 16; [[245, 408], [355, 408]].forEach(([a, b]) => { x.beginPath(); x.moveTo(a - 28, b); x.lineTo(a + 28, b); x.stroke(); });
  x.strokeStyle = "#7a6f68"; x.lineWidth = 5; x.beginPath(); x.moveTo(300, 400); x.lineTo(292, 470); x.lineTo(310, 474); x.stroke();
  x.strokeStyle = "#6b5557"; x.lineWidth = 6; x.beginPath(); x.moveTo(258, 540); x.quadraticCurveTo(300, 548, 342, 540); x.stroke();
  return c;
}

// ---------- the "leaked photo" look ----------
// low-res capture -> washed-out harsh flash -> grain -> brutal JPEG recompression -> date stamp
function leak(img) {
  const W = 420, H = 560, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
  const s = Math.max(W / img.width, H / img.height), sw = W / s, sh = H / s, sx = (img.width - sw) / 2, sy = (img.height - sh) * .3;
  if (!filterOn) { x.drawImage(img, sx, sy, sw, sh, 0, 0, W, H); return Promise.resolve(c); }
  const lo = document.createElement("canvas"); lo.width = 150; lo.height = 200; lo.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, 150, 200);
  x.drawImage(lo, 0, 0, W, H);
  const d = x.getImageData(0, 0, W, H), p = d.data, src = new Uint8ClampedArray(p);
  for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
    const k = (y * W + i) * 4;
    let r = src[i > 1 ? k - 8 : k], g = src[k + 1], b = src[i < W - 2 ? k + 10 : k + 2];          // colour fringing
    const l = .3 * r + .59 * g + .11 * b;
    r = l + (r - l) * .35; g = l + (g - l) * .35; b = l + (b - l) * .35;                           // drained colour
    const dx = i / W - .5, dy = y / H - .42, q = dx * dx + dy * dy;
    const f = Math.exp(-q * 7) * 50 - q * 190 + (Math.random() - .5) * 34 - (y & 1 ? 9 : 0);     // flash hotspot, vignette, grain, scanlines
    p[k] = (r - 128) * 1.45 + 128 + f + 8; p[k + 1] = (g - 128) * 1.45 + 128 + f + 4; p[k + 2] = (b - 128) * 1.45 + 128 + f - 10;
  }
  x.putImageData(d, 0, 0);
  return new Promise(res => {
    const j = new Image();
    j.onload = () => {
      x.drawImage(j, 0, 0);
      x.font = "bold 16px 'Courier New',monospace"; x.shadowColor = "#000"; x.shadowBlur = 3;
      x.fillStyle = "#ffa733"; x.textAlign = "right"; x.fillText(STAMP, W - 10, H - 12);
      x.fillStyle = "rgba(255,255,255,.55)"; x.textAlign = "left"; x.font = "13px 'Courier New',monospace"; x.fillText(WATERMARK, 10, H - 12);
      res(c);
    };
    j.src = c.toDataURL("image/jpeg", .13);
  });
}
async function show() {
  last = await leak(photos[cur]);
  fctx.clearRect(0, 0, 420, 560); fctx.drawImage(last, 60, 70, 300, 400, 0, 0, 420, 560);
  $("next").hidden = photos.length < 2;
}
(async () => {
  photos = (await Promise.all(FACES.map(loadImg))).filter(Boolean);
  if (!photos.length) photos = [placeholder()];
  show();
})();
$("file").addEventListener("change", async e => {            // try any picture without touching the code
  const f = e.target.files[0]; if (!f) return;
  const i = await loadImg(URL.createObjectURL(f)); if (i) { photos.unshift(i); cur = 0; show(); }
});
$("next").addEventListener("click", () => { cur = (cur + 1) % photos.length; show(); });
$("filter").addEventListener("click", e => { filterOn = !filterOn; e.target.setAttribute("aria-pressed", filterOn); e.target.textContent = "Filter: " + (filterOn ? "on" : "off"); show(); });

// ---------- the sheet ----------
const setCover = (dx, dy) => cover.style.transform = `translate(${dx}px,${dy}px) rotate(${dx / 14}deg)`;
function reveal() {
  if (revealed) return; revealed = true;
  setCover(18, 150); slab.classList.add("revealed");
  $("flash").classList.remove("go"); void $("flash").offsetWidth; $("flash").classList.add("go");   // camera flash
  hint.textContent = "Click the face to look closer.";
}
function recover() { revealed = false; slab.classList.remove("revealed"); setCover(0, 0); hint.textContent = "Something is under the sheet."; }
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

// ---------- look closer ----------
face.addEventListener("click", () => {
  if (!revealed || !last) return;
  const b = $("big"); b.width = 420; b.height = 560; b.getContext("2d").drawImage(last, 0, 0); $("view").hidden = false;
});
$("view").addEventListener("click", () => $("view").hidden = true);
addEventListener("keydown", e => { if (e.key === "Escape") $("view").hidden = true; });

// ---------- it won't hold still ----------
setInterval(() => {
  if (!revealed) return; face.classList.add("glitch"); setTimeout(() => face.classList.remove("glitch"), 90);
}, 4000 + Math.random() * 5000);

/* ============ lights, sound & hallucinations (same as the portfolio, minus the heart monitor) ============ */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const dark = $("dark"), lamp = $("lamp"), lights = $("lights"), soundBtn = $("sound"), halluc = $("halluc"), glowLayer = $("glow");

// Flicker: briefly cuts the light. [ms since start, how far it drops: 0 normal .. 1 almost out].
// The last 0.52s of Light_buzzing.mp3 has this same pattern baked in, so the hum stutters with the light.
const FLICKER = [[0,.85],[70,0],[130,.6],[180,.05],[230,.9],[290,0],[400,.5],[450,0]], FLICKER_END = 520;
let flickAt = -1, buzzFlicked = false;
const startFlicker = () => flickAt = performance.now();
function flickLevel(now) {
  if (flickAt < 0) return 0;
  const e = now - flickAt;
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
const sfx = { click: mk("Light_switch.mp3", .7), buzz: mk("Light_buzzing.mp3", 0, true), whisper: mk("Whispers.mp3", 0, true) };
let soundOn = true, unlocked = false, buzzWanted = false, buzzEnv = 0, whVol = 0;
let lampLit = true, lightsOn = true, lampTimers = [], darkSince = 0;   // darkSince: when the lamp last went out
const BUZZ_VOL = .25, WHISPER_MAX = 1, DARK_MAX = .97;
function syncAudio() {
  buzzWanted = soundOn && unlocked && !document.hidden && lampLit;
  if (buzzWanted && sfx.buzz.paused) sfx.buzz.play().catch(() => {});
}
function playSwitch() { if (!soundOn) return; sfx.click.currentTime = 0; sfx.click.play().catch(() => {}); }
["pointerdown", "keydown"].forEach(ev => addEventListener(ev, () => { unlocked = true; syncAudio(); }, { once: true }));
document.addEventListener("visibilitychange", syncAudio);
soundBtn.addEventListener("click", () => { soundOn = !soundOn; soundBtn.setAttribute("aria-pressed", soundOn); renderSoundBtn(); syncAudio(); });

// ---------- the room light ----------
// Light ON: the lamp hangs lit and the room is visible. Light OFF: the lamp goes out and the room is nearly black.
//   off -> the lamp switches off, then is hauled up.   on -> the lamp drops in, THEN switches on (stutter + buzz).
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
lamp.classList.add("on");                                   // on load the lamp lowers itself into place, already lit
if (reduce) lamp.classList.add("down"); else setTimeout(() => lamp.classList.add("down"), 300);

// random flicker every 10-15 s (while the buzzing plays, its loop sets the rhythm instead)
if (!reduce) (function schedule() {
  setTimeout(() => { if (!(lampLit && !sfx.buzz.paused)) startFlicker(); schedule(); }, 10000 + Math.random() * 5000);
})();

// ---------- hallucinations: after 5 s without light the room starts showing you things, and the whispers swell ----------
const HALLUC_AFTER = 5000;    // ms of darkness before it starts
const HALLUC_RAMP = 40000;    // ms after that until it is at its worst
const hallucActive = now => !lampLit && darkSince > 0 && now - darkSince > HALLUC_AFTER;
const intensity = now => hallucActive(now) ? Math.min(1, (now - darkSince - HALLUC_AFTER) / HALLUC_RAMP) : 0;
const WORDS = ["behind you", "turn on the light", "it's still breathing", "you were not alone", "don't look", "listen", "he moved", "TURN AROUND", "so cold", "help me"];
const rnd = (a, b) => a + Math.random() * (b - a);
let nextSpawn = 0, figure = null;
function spawn(i) {
  if (halluc.children.length > 7) return;
  const el = document.createElement("i"), r = Math.random();
  if (r < .45) { el.className = "eyes"; el.innerHTML = "<b></b><b></b>"; el.style.cssText = `left:${rnd(5, 92)}%;top:${rnd(10, 85)}%;--a:${(.2 + .4 * i).toFixed(2)};--sc:${rnd(.7, 1.8).toFixed(2)}`; }
  else if (r < .8) { el.className = "word"; el.textContent = WORDS[Math.random() * WORDS.length | 0]; el.style.cssText = `left:${rnd(4, 70)}%;top:${rnd(12, 85)}%;--a:${(.16 + .3 * i).toFixed(2)};rotate:${rnd(-7, 7).toFixed(1)}deg`; }
  else { const left = Math.random() < .5; el.className = "peek"; el.style.cssText = `${left ? "left" : "right"}:-70px;top:${rnd(15, 65)}%;--d:${left ? 1 : -1}`; }
  el.addEventListener("animationend", () => el.remove());
  halluc.appendChild(el);
}
function hallucTick(now) {
  const active = hallucActive(now), i = intensity(now);
  halluc.classList.toggle("on", active); slab.classList.toggle("haunted", active);
  halluc.style.setProperty("--hi", i.toFixed(3));
  if (active) {
    if (i > .2 && !figure) { figure = document.createElement("i"); figure.className = "figure"; halluc.appendChild(figure); }
    if (figure) figure.style.setProperty("--s", (.6 + .9 * i).toFixed(2));          // it creeps closer
    if (now > nextSpawn) {
      spawn(i);
      if (figure && Math.random() < .3) figure.style.left = (Math.random() < .5 ? 5 : 84) + "%";   // and it is never where you left it
      nextSpawn = now + (3200 - 2400 * i) * rnd(.6, 1.4);
    }
  } else if (halluc.firstChild) { halluc.replaceChildren(); figure = null; nextSpawn = 0; }     // the light kills them instantly
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
let dk = 0, lastD = performance.now();
function applyDark(now) {
  const f = flickLevel(now), target = lampLit ? 0 : DARK_MAX, step = now - lastD; lastD = now;
  dk = reduce ? target : (target > dk ? Math.min(target, dk + step / 120) : Math.max(target, dk - step / 250));   // blacks out fast, brightens a little slower
  const v = Math.max(dk, .9 * f);                               // every flicker cuts the light
  dark.style.setProperty("--dk", v.toFixed(3));
  lamp.style.setProperty("--lit", (1 - .85 * f).toFixed(2));   // the bulb dims with every flicker
  updateGlows(v);
}

// ---------- one frame loop ----------
let lastA = performance.now();
(function frame() {
  const now = performance.now(), dt = now - lastA; lastA = now;
  // the buzz fades in/out smoothly and cuts out with every flicker
  buzzEnv = buzzWanted ? Math.min(1, buzzEnv + dt / 200) : Math.max(0, buzzEnv - dt / 250);
  sfx.buzz.volume = BUZZ_VOL * buzzEnv * (1 - .9 * Math.min(1, flickLevel(now)));
  if (!buzzWanted && buzzEnv === 0 && !sfx.buzz.paused) { sfx.buzz.pause(); sfx.buzz.currentTime = 0; }
  // whispers: silent until the hallucinations start, then louder and louder; gone the moment the light is back
  const wT = (soundOn && unlocked && !document.hidden && hallucActive(now)) ? WHISPER_MAX * (.12 + .88 * intensity(now)) : 0;
  whVol += (wT - whVol) * Math.min(1, dt / (wT > whVol ? 900 : 250));
  sfx.whisper.volume = Math.min(1, Math.max(0, whVol));
  if (wT > 0 && sfx.whisper.paused) sfx.whisper.play().catch(() => {});
  if (wT === 0 && whVol < .01 && !sfx.whisper.paused) { sfx.whisper.pause(); sfx.whisper.currentTime = 0; whVol = 0; }
  // loop-synced flicker: start the light flicker as the baked-in stutter at the end of the buzz begins
  const bz = sfx.buzz;
  if (!reduce && !bz.paused && bz.duration) {
    const left = (bz.duration - bz.currentTime) * 1000;
    if (left > 0 && left <= FLICKER_END) { if (!buzzFlicked) { buzzFlicked = true; flickAt = now - (FLICKER_END - left); } }
    else if (left > FLICKER_END + 500) buzzFlicked = false;
  }
  applyDark(now);
  if (!reduce) hallucTick(now);
  requestAnimationFrame(frame);
})();