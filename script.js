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
  document.querySelectorAll('nav a[href^="#"]').forEach(a => a.classList.toggle("active", document.querySelector(a.getAttribute("href"))?.dataset.scene === name));   // highlight where you are
  room.classList.remove("flick"); void room.offsetWidth;
  if (!reduce) room.classList.add("flick");   // the light stutters as the room changes
}
const navLinks = [...document.querySelectorAll("nav a")];
const sceneIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  setScene(e.target.dataset.scene);
  navLinks.forEach(a => a.toggleAttribute("aria-current", !!a.hash && a.hash === "#" + e.target.id));   // highlight where you are
}),
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

// Room light. Light ON: the lamp hangs lit and the room is visible. Light OFF: the lamp goes out and the room is nearly black.
//   off -> the lamp switches off, then is hauled up.   on -> the lamp drops in, THEN switches on (stutter + buzz).
const dark = document.getElementById("dark"), lights = document.getElementById("lights"), lamp = document.getElementById("lamp");
const LAMP_DROP_MS = 1150;   // time for the lamp to drop before it lights
const LAMP_HAUL_MS = 550;    // pause after it switches off before it is hauled up
const DARK_MAX = .97;        // how black the room gets with the light off (0 to 1)
let lampLit = true, lightsOn = true, lampTimers = [], darkSince = 0;   // darkSince: when the lamp last went out
function lampLight(on) { lampLit = on; lamp.classList.toggle("on", on); darkSince = on ? 0 : performance.now(); syncAudio(); }
lights.addEventListener("click", () => {
  lampTimers.forEach(clearTimeout); lampTimers = [];
  lightsOn = !lightsOn;
  lights.setAttribute("aria-pressed", lightsOn);
  lights.textContent = "Light: " + (lightsOn ? "on" : "off");
  playSwitch();
  if (lightsOn) {
    const wasDown = lamp.classList.contains("down");
    lamp.classList.add("down");
    lampTimers.push(setTimeout(() => { lampLight(true); playSwitch(); if (!reduce) startFlicker(); }, wasDown ? 350 : LAMP_DROP_MS));
  } else {
    lampLight(false);
    lampTimers.push(setTimeout(() => lamp.classList.remove("down"), LAMP_HAUL_MS));
  }
  applyDark(dim, performance.now());
});
// on load the lamp lowers itself into place, already lit
lamp.classList.add("on");
setTimeout(() => lamp.classList.add("down"), 300);

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
  flat:  mk("Flatline.mp3", .5, true),         // replaces the beat while flatlined
  whisper: mk("Whispers.mp3", 0, true),       // hallucinations: loops, swelling louder the longer you sit in the dark
  heart: mk("Heartbeat.mp3", 1)               // one shot on reviving the monitor: starts at full volume and fades out
};
let soundOn = true, unlocked = false;
const BUZZ_VOL = .25;                       // buzz loudness at full strength (0 to 1)
let buzzWanted = false, buzzEnv = 0, whVol = 0, hbStart = 0;        // buzzEnv fades the buzz in/out smoothly (0 to 1)

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
  if (!soundOn && !sfx.heart.paused) { sfx.heart.pause(); hbStart = 0; }
  buzzWanted = live && lampLit;
  if (buzzWanted && sfx.buzz.paused) sfx.buzz.play().catch(() => {});
}
function playHeartbeat() {
  if (!soundOn) return;
  sfx.heart.currentTime = 0; sfx.heart.volume = 1; sfx.heart.play().catch(() => {}); hbStart = performance.now();
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
  // whispers: silent until the hallucinations start, then louder and louder; gone the moment the light is back
  const wT = (soundOn && unlocked && !document.hidden && hallucActive(now)) ? WHISPER_MAX * (.12 + .88 * intensity(now)) : 0;
  whVol += (wT - whVol) * Math.min(1, dt / (wT > whVol ? 900 : 250));
  sfx.whisper.volume = Math.min(1, Math.max(0, whVol));
  if (wT > 0 && sfx.whisper.paused) sfx.whisper.play().catch(() => {});
  if (wT === 0 && whVol < .01 && !sfx.whisper.paused) { sfx.whisper.pause(); sfx.whisper.currentTime = 0; whVol = 0; }
  // heartbeat after a revive: starts at full volume, fades out over its length
  if (hbStart) {
    const k = (now - hbStart) / ((sfx.heart.duration || 7.3) * 1000);
    if (k >= 1) { sfx.heart.pause(); hbStart = 0; } else sfx.heart.volume = Math.max(0, 1 - k);
  }
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

// ===== Darkness =====  pen: penalty dimming while the pulse is flat (0 to 1)
let dk = 0, lastD = performance.now();
function applyDark(pen, now) {
  const f = flickLevel(now);
  const target = lampLit ? .9 * pen : DARK_MAX;
  const step = now - lastD; lastD = now;
  dk = reduce ? target : (target > dk ? Math.min(target, dk + step / 120) : Math.max(target, dk - step / 250));   // blacks out fast, brightens a little slower
  const v = Math.max(dk, .9 * f);                                // every flicker cuts the light
  dark.style.setProperty("--dk", v.toFixed(3));
  lamp.style.setProperty("--lit", (1 - .85 * Math.max(pen, f)).toFixed(2));   // the bulb dims with every flicker and penalty
  updateGlows(v);
}

// ===== Dim glowing lights: something to find in the dark =====
const GLOWS = [
  { s: "wall",   x: .93, y: .22, c: "88,214,141", w: 40, h: 16, cls: "exit", text: "EXIT" },                       // exit sign over a door
  { s: "wall",   x: .09, y: .2,  c: "255,60,60",  w: 5,  h: 5,  cls: "blink" },                                  // smoke detector
  { s: "report", el: ".paper",  x: .93, y: .93, c: "255,60,60",  w: 6, h: 6, cls: "blink" },                    // a recorder's REC light
  { s: "report", el: ".folder", x: .04, y: .1,  c: "255,179,71", w: 5, h: 5 },                                   // a standby light
  { s: "chart",  el: ".trace",  x: .5,  y: .56, c: "124,199,160", w: 440, h: 16, cls: "blob" },                  // the monitor's screen
  { s: "satin",  x: .5, y: .64, c: "255,157,77", w: 10, h: 17, cls: "flame" }                                    // a candle
];
[3, 9, 14, 20, 26, 33, 38, 44, 51, 57].forEach((n, k) =>                                                          // status LEDs on the fridge doors
  GLOWS.push({ s: "steel", door: n, x: .9, y: .5, c: k % 4 ? "88,214,141" : "255,60,60", w: 5, h: 5, cls: k % 3 ? "" : "blink" }));
const glowLayer = document.getElementById("glow");
GLOWS.forEach(g => {
  g.t = g.door != null ? steel.children[g.door] && steel.children[g.door].querySelector(".handle") : g.el ? document.querySelector(g.el) : null;
  g.node = document.createElement("i");
  g.node.className = "led " + (g.cls || "");
  g.node.style.cssText = `width:${g.w}px;height:${g.h}px;--c:${g.c}`;
  if (g.text) g.node.textContent = g.text;
  glowLayer.appendChild(g.node);
});
function updateGlows(v) {                                       // v: how dark it is right now (0 to 1)
  const show = Math.max(0, Math.min(1, (v - .6) / .3));         // they only appear once it is properly dark
  const scene = room.dataset.scene;
  GLOWS.forEach(g => {
    const on = show > 0 && g.s === scene;
    g.node.style.opacity = on ? (show * .55).toFixed(2) : 0;    // very dim
    if (!on) return;
    const r = g.t ? g.t.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
    g.node.style.transform = `translate(${(r.left + r.width * g.x - g.w / 2).toFixed(1)}px,${(r.top + r.height * g.y - g.h / 2).toFixed(1)}px)`;
  });
}

// ===== Hallucinations: after 5 s without light the room starts showing you things, and the whispers swell =====
const HALLUC_AFTER = 5000;    // ms of darkness before it starts
const HALLUC_RAMP = 40000;    // ms after that until it is at its worst
const WHISPER_MAX = 1;        // whisper volume at its worst (0 to 1)
const hallucActive = now => !lampLit && darkSince > 0 && now - darkSince > HALLUC_AFTER;
const intensity = now => hallucActive(now) ? Math.min(1, (now - darkSince - HALLUC_AFTER) / HALLUC_RAMP) : 0;
const halluc = document.getElementById("halluc");
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
  halluc.classList.toggle("on", active);
  halluc.style.setProperty("--hi", i.toFixed(3));
  if (active) {
    if (i > .2 && !figure) { figure = document.createElement("i"); figure.className = "figure"; halluc.appendChild(figure); }
    if (figure) figure.style.setProperty("--s", (.6 + .9 * i).toFixed(2));        // it creeps closer
    if (now > nextSpawn) {
      spawn(i);
      if (figure && Math.random() < .3) figure.style.left = (Math.random() < .5 ? 5 : 84) + "%";   // and it is never where you left it
      nextSpawn = now + (3200 - 2400 * i) * rnd(.6, 1.4);
    }
  } else if (halluc.firstChild) { halluc.replaceChildren(); figure = null; nextSpawn = 0; }   // the light kills them instantly
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
cv.addEventListener("click", () => { if (!alive) { setState(true); playHeartbeat(); } });

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
  applyDark(dim, now);
  hallucTick(now);
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
if (reduce) { lamp.classList.add("down"); applyDark(0, performance.now()); }