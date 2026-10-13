/* ===== EDIT YOUR CONTENT HERE ===== */
const projects = [
  { id: "001", title: "Project One", year: "2025", role: "Design & development",
    cause: "Describe what this project is and the problem it solved.",
    tags: ["HTML", "CSS", "JavaScript"], link: "#" },
  { id: "002", title: "Project Two", year: "2024", role: "Full-stack",
    cause: "Describe what this project is and the problem it solved.",
    tags: ["React", "Node", "PostgreSQL"], link: "#" },
  { id: "003", title: "Project Three", year: "2023", role: "UI / Branding",
    cause: "Describe what this project is and the problem it solved.",
    tags: ["Figma", "Illustration"], link: "#" }
];
const skills = [
  ["Front-end", 4], ["Back-end", 4], ["UI design", 10], ["Dread", 100]
];
/* =================================== */

// Dynamic background: the room changes with the section you are reading.
const room = document.getElementById("room");
const steel = room.querySelector(".s-steel");
for (let i = 1; i <= 60; i++)   // wall of refrigerator doors; a few hang slightly ajar
  steel.insertAdjacentHTML("beforeend", `<i class="door${Math.random() < .07 ? " ajar" : ""}"><b class="slot">${String(i).padStart(2, "0")}</b><b class="handle"></b></i>`);
function setScene(name) {
  if (room.dataset.scene === name) return;
  room.dataset.scene = name;
  room.classList.remove("flick"); void room.offsetWidth;
  if (!reduce) room.classList.add("flick");   // the light stutters as the room changes
}
const sceneIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setScene(e.target.dataset.scene); }),
  { rootMargin: "-45% 0px -45% 0px" });
document.querySelectorAll("[data-scene]").forEach(el => sceneIO.observe(el));

// parallax: scene props drift with scroll position and the mouse
let px = 0, par = false;
function parallax() {
  par = false;
  if (scrollY + innerHeight >= document.documentElement.scrollHeight - 6) setScene("satin");   // short pages can't scroll the last section to the middle
  const sec = document.querySelector(`section[data-scene="${room.dataset.scene}"]`);
  if (sec) { const r = sec.getBoundingClientRect(); room.style.setProperty("--p", Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight)).toFixed(3)); }
  room.style.setProperty("--mx", px.toFixed(3));
}
const queue = () => { if (!par) { par = true; requestAnimationFrame(parallax); } };
addEventListener("scroll", queue, { passive: true });
addEventListener("pointermove", e => { px = (e.clientX / innerWidth - .5) * 2; queue(); });
// something knocks from inside a refrigerator door now and then
(function knock() {
  setTimeout(() => {
    const ds = steel.children;
    if (room.dataset.scene === "steel" && !reduce) { const d = ds[Math.floor(Math.random() * ds.length)]; d.classList.add("knock"); setTimeout(() => d.classList.remove("knock"), 700); }
    knock();
  }, 8000 + Math.random() * 12000);
})();


// Cold-storage drawers
const cabinet = document.getElementById("cabinet");
projects.forEach(p => {
  const d = document.createElement("div");
  d.className = "drawer";
  d.innerHTML = `
    <button aria-expanded="false" aria-controls="b${p.id}">
      <span>${p.title}</span><span class="case">CASE ${p.id}</span>
    </button>
    <div class="slide" id="b${p.id}"><div><div class="body">
      <div class="cloth">[ cover image / screenshot ]</div>
      <p>${p.cause}</p>
      <p class="meta"><b>Filed:</b> ${p.year} &nbsp; <b>Role:</b> ${p.role}<br><b>Tools:</b> ${p.tags.join(", ")}</p>
      <a href="${p.link}">View the remains</a>
    </div></div></div>`;
  const btn = d.querySelector("button");
  btn.addEventListener("click", () => {
    const open = d.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  });
  cabinet.appendChild(d);
});

// Vital signs
const skillList = document.getElementById("skills");
skills.forEach(([name, v]) => {
  const li = document.createElement("li");
  li.innerHTML = `<span>${name}</span><div class="bar-bg"><div class="bar-fill" data-v="${v}"></div></div>`;
  skillList.appendChild(li);
});
new IntersectionObserver((es, ob) => es.forEach(e => {
  if (e.isIntersecting) {
    document.querySelectorAll(".bar-fill").forEach(b => b.style.width = b.dataset.v + "%");
    ob.disconnect();
  }
}), { threshold: .4 }).observe(skillList);

// Torch following the cursor
const dark = document.getElementById("dark"), lights = document.getElementById("lights"), lamp = document.getElementById("lamp"), beamEl = document.getElementById("beam");
addEventListener("pointermove", e => {
  dark.style.setProperty("--mx", e.clientX + "px");
  dark.style.setProperty("--my", e.clientY + "px");
});
// Torch toggle, choreographed with the lamp:
//   torch OFF -> flashlight goes out, room blacks out, lamp drops in, THEN the lamp switches on (beam + buzz + stutter)
//   torch ON  -> lamp switches off (beam goes), flashlight returns, THEN the lamp is hauled back up
const LAMP_DROP_MS = 1150;   // time for the lamp to drop before it lights
const LAMP_HAUL_MS = 550;    // pause after it switches off before it is hauled up
let lampLit = false, lampTimers = [];
lights.addEventListener("click", () => {
  lampTimers.forEach(clearTimeout); lampTimers = [];
  const off = dark.classList.toggle("off");
  lights.setAttribute("aria-pressed", !off);
  lights.textContent = "Torch: " + (off ? "off" : "on");
  playSwitch();
  lampLit = false; lamp.classList.remove("on"); beamEl.classList.remove("lit");
  if (off) {
    lamp.classList.add("down");
    lampTimers.push(setTimeout(() => {
      lampLit = true; lamp.classList.add("on"); beamEl.classList.add("lit");
      playSwitch(); syncAudio();
      if (!reduce) startFlicker();            // the lamp stutters on
    }, LAMP_DROP_MS));
  } else {
    lampTimers.push(setTimeout(() => lamp.classList.remove("down"), LAMP_HAUL_MS));
  }
  syncAudio();
});

// Heart monitor: beats, then flatlines. Click to revive.
const cv = document.getElementById("ecg"), ctx = cv.getContext("2d");
const pulse = document.getElementById("pulse"), status = document.getElementById("status");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const g = (t, m, s) => Math.exp(-((t - m) ** 2) / (2 * s * s));
const wave = t => .1 * g(t,.15,.03) - .15 * g(t,.27,.01) + g(t,.3,.012) - .25 * g(t,.33,.01) + .2 * g(t,.55,.05);
// Timing measured from Heart_monitor.mp3: 43 beeps in its 60.996 s loop, first beep at 0.032 s (~42 bpm).
const BEAT_PERIOD = 60.996 / 43, BEAT_T0 = 0.032, BPM = Math.round(60 / BEAT_PERIOD);
const SAMPLE_RATE = 60;             // line samples per second, so the sweep speed is the same on any screen
const buf = new Array(cv.width).fill(0);
let alive = true, born = performance.now(), sampleAcc = 0, lastDraw = performance.now();
// Where we are in the heartbeat cycle (0..1, with the R-spike at .3). Follows the audio clock when the
// heartbeat is playing, so every beep lands exactly on a spike; otherwise it free-runs at the same rate.
function beatPhase(now) {
  const a = sfx.beat, sec = (!a.paused && a.readyState >= 2) ? a.currentTime : now / 1000;
  const ph = (((sec - BEAT_T0) / BEAT_PERIOD) % 1 + 1) % 1;
  return (ph + .3) % 1;
}

// Penalty: while the pulse is flat, the torch shrinks and the dark closes in.
const penaltyBtn = document.getElementById("penalty");
const BEAT_TIME = 25000;            // ms the pulse beats before it flatlines
const GRACE = 3000, RAMP = 15000;   // ms before it starts / ms until near-total darkness
const RECOVER = 1000;               // ms for the light to fully return after reviving
let penaltyOn = true, deadSince = 0, dim = 0, lastT = performance.now();

// Flicker: briefly cuts the active light (torch, or the centre beam when the torch is off).
// Each step is [ms since start, how far the light drops: 0 normal .. 1 almost out].
// NOTE: the last 0.52s of audio/Light_buzzing.mp3 has this same pattern baked into its volume,
// so the hum stutters in step with the light. If you change this list, the audio no longer matches.
const FLICKER = [[0,.85],[70,0],[130,.6],[180,.05],[230,.9],[290,0],[400,.5],[450,0]], FLICKER_END = 520;
let flickAt = -1, buzzFlicked = false;
function startFlicker() { flickAt = performance.now(); }
function flickLevel(now) {
  if (flickAt < 0) return 0;
  const e = now - flickAt;
  if (e > FLICKER_END) { flickAt = -1; return 0; }
  let lv = 0;
  for (const [t, l] of FLICKER) if (e >= t) lv = l;
  return lv;
}
// ===== Audio =====
// Browsers block sound until the visitor interacts, so everything starts on the first click/key/tap.
const AUDIO_DIR = "audio/";   // where the MP3s live, relative to index.html
const missing = new Set(), soundBtn = document.getElementById("sound");
function renderSoundBtn() {   // shows a warning on the button if any file can't be loaded
  soundBtn.textContent = "Sound: " + (soundOn ? "on" : "off") + (missing.size ? " \u26A0 can't find " + [...missing].join(", ") : "");
}
const mk = (file, vol, loop) => {
  const a = new Audio(AUDIO_DIR + file);
  a.volume = vol; a.loop = !!loop; a.preload = "auto";
  // If the file isn't in the audio folder, try the same folder as index.html before giving up.
  a.addEventListener("error", () => {
    if (!a.dataset.retried) { a.dataset.retried = "1"; a.src = file; a.load(); syncAudio(); }
    else { console.warn("Could not load audio:", a.src); missing.add(file); soundBtn.title = "Tried: " + a.src; renderSoundBtn(); }
  });
  return a;
};
const sfx = {
  click: mk("Light_switch.mp3", .7),
  buzz:  mk("Light_buzzing.mp3", 0, true),     // loops while the torch is off (volume driven by audioLoop)
  beat:  mk("Heart_monitor.mp3", .35, true),   // loops while the pulse is beating
  flat:  mk("Flatline.mp3", .5, true)          // replaces the beat while flatlined
};
let soundOn = true, unlocked = false;
const BUZZ_VOL = .25;                       // buzz loudness at full strength (0 to 1)
let buzzWanted = false, buzzEnv = 0;        // buzzEnv fades the buzz in/out smoothly (0 to 1)

function setLoop(a, play) {
  if (play) { if (a.paused) a.play().catch(() => {}); }
  else if (!a.paused) { a.pause(); a.currentTime = 0; }
}
// One place decides what should be playing right now.
// Flatline only happens with the penalty on, so turning the penalty off (which revives the pulse) swaps back to the beat.
function syncAudio() {
  const live = soundOn && unlocked && !document.hidden;
  setLoop(sfx.beat, live && alive);
  setLoop(sfx.flat, live && !alive);
  buzzWanted = live && lampLit;
  if (buzzWanted && sfx.buzz.paused) sfx.buzz.play().catch(() => {});
}
function playSwitch() {
  if (!soundOn) return;
  sfx.click.currentTime = 0;
  sfx.click.play().catch(() => {});
}
const unlock = () => { unlocked = true; syncAudio(); };
["pointerdown", "keydown"].forEach(ev => addEventListener(ev, unlock, { once: true }));
document.addEventListener("visibilitychange", syncAudio);
soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  soundBtn.setAttribute("aria-pressed", soundOn);
  renderSoundBtn();
  syncAudio();
});

// The buzz follows the light: it fades in/out smoothly and cuts out with every flicker.
let lastA = performance.now();
(function audioLoop(now) {
  const dt = now - lastA; lastA = now;
  buzzEnv = buzzWanted ? Math.min(1, buzzEnv + dt / 200) : Math.max(0, buzzEnv - dt / 250);
  sfx.buzz.volume = BUZZ_VOL * buzzEnv * (1 - .9 * Math.min(1, flickLevel(now)));
  if (!buzzWanted && buzzEnv === 0 && !sfx.buzz.paused) { sfx.buzz.pause(); sfx.buzz.currentTime = 0; }
  requestAnimationFrame(audioLoop);
})(performance.now());

// random flicker every 10-15 seconds
if (!reduce) (function schedule() {
  setTimeout(() => {
    // with the torch off and the buzzing playing, the audio loop sets the rhythm instead
    if (!(lampLit && !sfx.buzz.paused)) startFlicker();
    schedule();
  }, 10000 + Math.random() * 5000);
})();

function applyDark(p) {             // p: 0 (normal) to 1 (nearly blind)
  dark.style.setProperty("--r", (260 - 215 * p).toFixed(0) + "px");
  dark.style.setProperty("--m", (.35 + .55 * p).toFixed(2));
  dark.style.setProperty("--o", (.88 + .12 * p).toFixed(2));
  beamEl.style.cssText = `--m:${(.22 + .68 * p).toFixed(2)};--o:${(.82 + .18 * p).toFixed(2)};--bw:${(26 - 21 * p).toFixed(1)}%;--t:${(.07 * (1 - p)).toFixed(3)}`;
  dark.classList.toggle("pen", p > 0);
  lamp.style.setProperty("--lit", (1 - .85 * p).toFixed(2));   // the bulb dims with every flicker and penalty
}
function renderPulse() {
  pulse.classList.toggle("dead", !alive);
  document.querySelector(".monitor").classList.toggle("dead", !alive);
  pulse.innerHTML = alive
    ? "Pulse: " + BPM + " bpm" + (penaltyOn ? " <span>(click the monitor when it stops)</span>" : "")
    : "Pulse: none <span>(" + (penaltyOn ? "click to revive before the dark closes in" : "click to revive") + ")</span>";
  syncAudio();
}
function setState(a) {
  alive = a; born = performance.now();
  deadSince = a ? 0 : performance.now();
  renderPulse();
  document.body.classList.toggle("flatline", !a);
  status.textContent = a ? "Alive. For now." : "Time of death: just now.";
}
penaltyBtn.addEventListener("click", () => {
  penaltyOn = !penaltyOn;
  penaltyBtn.setAttribute("aria-pressed", penaltyOn);
  penaltyBtn.textContent = "Penalty: " + (penaltyOn ? "on" : "off");
  if (!penaltyOn && !alive) setState(true);   // turning it off revives a flatlined monitor
  else if (penaltyOn) born = performance.now(); // turning it on restarts the countdown
  renderPulse();
});
cv.addEventListener("click", () => !alive && setState(true));

function tick() {
  const now = performance.now();
  if (alive && penaltyOn && now - born > BEAT_TIME) setState(false);  // no penalty, no flatline
  // darkness follows the penalty down into the dark, but eases back out gradually
  const target = (!alive && penaltyOn) ? Math.min(1, Math.max(0, (now - deadSince - GRACE) / RAMP)) : 0;
  dim = target > dim ? target : Math.max(target, dim - (now - lastT) / RECOVER);
  lastT = now;
  // Loop-synced flicker: the buzzing's final half-second is baked to stutter, so start the light flicker
  // as that part begins (offset by how far in we already are, to stay in step with the sound).
  const bz = sfx.buzz;
  if (!bz.paused && bz.duration) {
    const left = (bz.duration - bz.currentTime) * 1000;
    if (left > 0 && left <= FLICKER_END) {
      if (!buzzFlicked) { buzzFlicked = true; flickAt = now - (FLICKER_END - left); }
    } else if (left > FLICKER_END + 500) buzzFlicked = false;
  }
  applyDark(Math.max(dim, flickLevel(now)));
  sampleAcc += Math.min(now - lastDraw, 100) * SAMPLE_RATE / 1000; lastDraw = now;
  while (sampleAcc >= 1) {
    sampleAcc--;
    buf.push(alive ? wave(beatPhase(now)) : (Math.random() - .5) * .01);
    buf.shift();
  }
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.strokeStyle = alive ? "#b8c4b2" : "#c42626";
  ctx.lineWidth = 2; ctx.shadowBlur = 8; ctx.shadowColor = ctx.strokeStyle;
  ctx.beginPath();
  buf.forEach((v, x) => { const y = cv.height * .65 - v * cv.height * .5; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.stroke();
  requestAnimationFrame(tick);
}
if (reduce) {
  buf.forEach((_, i) => buf[i] = wave((i % 85) / 85));
  ctx.strokeStyle = "#b8c4b2"; ctx.lineWidth = 2; ctx.beginPath();
  buf.forEach((v, x) => { const y = cv.height * .65 - v * cv.height * .5; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.stroke();
} else tick();

document.getElementById("yr").textContent = new Date().getFullYear();
