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

/* ===================== lights & sound (same as the portfolio, minus the heart monitor) ===================== */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const dark = $("dark"), beamEl = $("beam"), lamp = $("lamp"), lights = $("lights"), soundBtn = $("sound");
addEventListener("pointermove", e => { dark.style.setProperty("--mx", e.clientX + "px"); dark.style.setProperty("--my", e.clientY + "px"); });

// Flicker: briefly cuts the active light. [ms since start, how far the light drops: 0 normal .. 1 almost out].
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

// Audio: browsers block sound until the visitor interacts, so it starts on the first click/key/tap.
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
const sfx = { click: mk("Light_switch.mp3", .7), buzz: mk("Light_buzzing.mp3", 0, true) };
let soundOn = true, unlocked = false, lampLit = false, lampTimers = [], buzzWanted = false, buzzEnv = 0;
const BUZZ_VOL = .25;
function syncAudio() {
  buzzWanted = soundOn && unlocked && !document.hidden && lampLit;
  if (buzzWanted && sfx.buzz.paused) sfx.buzz.play().catch(() => {});
}
function playSwitch() { if (!soundOn) return; sfx.click.currentTime = 0; sfx.click.play().catch(() => {}); }
["pointerdown", "keydown"].forEach(ev => addEventListener(ev, () => { unlocked = true; syncAudio(); }, { once: true }));
document.addEventListener("visibilitychange", syncAudio);
soundBtn.addEventListener("click", () => { soundOn = !soundOn; soundBtn.setAttribute("aria-pressed", soundOn); renderSoundBtn(); syncAudio(); });

// Torch toggle, choreographed with the lamp:
//   OFF -> flashlight goes out, room blacks out, lamp drops in, THEN it switches on (shaft of light + buzz + stutter)
//   ON  -> lamp switches off, flashlight returns, THEN the lamp is hauled back up
const LAMP_DROP_MS = 1150, LAMP_HAUL_MS = 550;
lights.addEventListener("click", () => {
  lampTimers.forEach(clearTimeout); lampTimers = [];
  const off = dark.classList.toggle("off");
  lights.setAttribute("aria-pressed", !off); lights.textContent = "Torch: " + (off ? "off" : "on");
  playSwitch();
  lampLit = false; lamp.classList.remove("on"); beamEl.classList.remove("lit");
  if (off) {
    lamp.classList.add("down");
    lampTimers.push(setTimeout(() => {
      lampLit = true; lamp.classList.add("on"); beamEl.classList.add("lit");
      playSwitch(); syncAudio(); if (!reduce) startFlicker();
    }, LAMP_DROP_MS));
  } else lampTimers.push(setTimeout(() => lamp.classList.remove("down"), LAMP_HAUL_MS));
  syncAudio();
});

// random flicker every 10-15 s (while the buzzing plays, its loop sets the rhythm instead)
if (!reduce) (function schedule() {
  setTimeout(() => { if (!(lampLit && !sfx.buzz.paused)) startFlicker(); schedule(); }, 10000 + Math.random() * 5000);
})();

function applyDark(p) {   // p: 0 normal .. 1 nearly out (driven by flicker here)
  dark.style.setProperty("--r", (260 - 215 * p).toFixed(0) + "px");
  dark.style.setProperty("--m", (.35 + .55 * p).toFixed(2));
  dark.style.setProperty("--o", (.88 + .12 * p).toFixed(2));
  beamEl.style.cssText = `--m:${(.22 + .68 * p).toFixed(2)};--o:${(.82 + .18 * p).toFixed(2)};--bw:${(26 - 21 * p).toFixed(1)}%;--t:${(.07 * (1 - p)).toFixed(3)}`;
  lamp.style.setProperty("--lit", (1 - .85 * p).toFixed(2));
}
let lastA = performance.now();
(function frame(now) {
  now = performance.now(); const dt = now - lastA; lastA = now;
  // the buzz fades in/out smoothly and cuts out with every flicker
  buzzEnv = buzzWanted ? Math.min(1, buzzEnv + dt / 200) : Math.max(0, buzzEnv - dt / 250);
  sfx.buzz.volume = BUZZ_VOL * buzzEnv * (1 - .9 * Math.min(1, flickLevel(now)));
  if (!buzzWanted && buzzEnv === 0 && !sfx.buzz.paused) { sfx.buzz.pause(); sfx.buzz.currentTime = 0; }
  // loop-synced flicker: start the light flicker as the baked-in stutter at the end of the buzz begins
  const bz = sfx.buzz;
  if (!reduce && !bz.paused && bz.duration) {
    const left = (bz.duration - bz.currentTime) * 1000;
    if (left > 0 && left <= FLICKER_END) { if (!buzzFlicked) { buzzFlicked = true; flickAt = now - (FLICKER_END - left); } }
    else if (left > FLICKER_END + 500) buzzFlicked = false;
  }
  if (!reduce) applyDark(flickLevel(now));
  requestAnimationFrame(frame);
})();