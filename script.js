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
const dark = document.getElementById("dark"), lights = document.getElementById("lights");
addEventListener("pointermove", e => {
  dark.style.setProperty("--mx", e.clientX + "px");
  dark.style.setProperty("--my", e.clientY + "px");
});
lights.addEventListener("click", () => {
  const off = dark.classList.toggle("off");
  lights.setAttribute("aria-pressed", !off);
  lights.textContent = "Torch: " + (off ? "off" : "on");
  playSwitch(); syncAudio();
  if (off && !reduce) startFlicker();   // the beam stutters on
});

// Heart monitor: beats, then flatlines. Click to revive.
const cv = document.getElementById("ecg"), ctx = cv.getContext("2d");
const pulse = document.getElementById("pulse"), status = document.getElementById("status");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const g = (t, m, s) => Math.exp(-((t - m) ** 2) / (2 * s * s));
const wave = t => .1 * g(t,.15,.03) - .15 * g(t,.28,.008) + g(t,.3,.01) - .25 * g(t,.32,.008) + .2 * g(t,.55,.05);
const buf = new Array(cv.width).fill(0);
let frame = 0, alive = true, born = performance.now();

// Penalty: while the pulse is flat, the torch shrinks and the dark closes in.
const penaltyBtn = document.getElementById("penalty");
const BEAT_TIME = 25000;            // ms the pulse beats before it flatlines
const GRACE = 3000, RAMP = 15000;   // ms before it starts / ms until near-total darkness
const RECOVER = 1000;               // ms for the light to fully return after reviving
let penaltyOn = true, deadSince = 0, dim = 0, lastT = performance.now();

// Flicker: briefly cuts the active light (torch, or the centre beam when the torch is off).
// Each step is [ms since start, how far the light drops: 0 normal .. 1 almost out].
const FLICKER = [[0,.85],[70,0],[130,.6],[180,.05],[230,.9],[290,0],[400,.5],[450,0]], FLICKER_END = 520;
let flickAt = -1;
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
const mk = (file, vol, loop) => { const a = new Audio("audio" + file); a.volume = vol; a.loop = !!loop; a.preload = "auto"; return a; };
const sfx = {
  click: mk("Light_switch.mp3", .7),
  buzz:  mk("Light_buzzing.mp3", .25, true),   // loops while the torch is off
  beat:  mk("Heart_monitor.mp3", .35, true),   // loops while the pulse is beating
  flat:  mk("Flatline.mp3", .5, true)          // replaces the beat while flatlined
};
let soundOn = true, unlocked = false;

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
  setLoop(sfx.buzz, live && dark.classList.contains("off"));
}
function playSwitch() {
  if (!soundOn) return;
  sfx.click.currentTime = 0;
  sfx.click.play().catch(() => {});
}
const unlock = () => { unlocked = true; syncAudio(); };
["pointerdown", "keydown"].forEach(ev => addEventListener(ev, unlock, { once: true }));
document.addEventListener("visibilitychange", syncAudio);
document.getElementById("sound").addEventListener("click", e => {
  soundOn = !soundOn;
  e.currentTarget.setAttribute("aria-pressed", soundOn);
  e.currentTarget.textContent = "Sound: " + (soundOn ? "on" : "off");
  syncAudio();
});

// random flicker every 10-15 seconds
if (!reduce) (function schedule() {
  setTimeout(() => { startFlicker(); schedule(); }, 10000 + Math.random() * 5000);
})();

function applyDark(p) {             // p: 0 (normal) to 1 (nearly blind)
  dark.style.setProperty("--r", (260 - 215 * p).toFixed(0) + "px");
  dark.style.setProperty("--m", (.35 + .55 * p).toFixed(2));
  dark.style.setProperty("--o", (.88 + .12 * p).toFixed(2));
  document.getElementById("beam").style.cssText = `--m:${(.22 + .68 * p).toFixed(2)};--o:${(.82 + .18 * p).toFixed(2)};--bw:${(26 - 21 * p).toFixed(1)}%;--t:${(.07 * (1 - p)).toFixed(3)}`;
  dark.classList.toggle("pen", p > 0);
}
function renderPulse() {
  pulse.classList.toggle("dead", !alive);
  document.querySelector(".monitor").classList.toggle("dead", !alive);
  pulse.innerHTML = alive
    ? "Pulse: 72 bpm" + (penaltyOn ? " <span>(click the monitor when it stops)</span>" : "")
    : "Pulse: none <span>(" + (penaltyOn ? "click to revive before the dark closes in" : "click to revive") + ")</span>";
  syncAudio();
}
function setState(a) {
  alive = a; born = performance.now();
  deadSince = a ? 0 : performance.now();
  renderPulse();
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
  applyDark(Math.max(dim, flickLevel(now)));
  frame++;
  const t = (frame % 70) / 70;
  buf.push(alive ? wave(t) : (Math.random() - .5) * .01);
  buf.shift();
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.strokeStyle = alive ? "#b8c4b2" : "#c42626";
  ctx.lineWidth = 2; ctx.shadowBlur = 8; ctx.shadowColor = ctx.strokeStyle;
  ctx.beginPath();
  buf.forEach((v, x) => { const y = cv.height * .65 - v * cv.height * .5; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.stroke();
  requestAnimationFrame(tick);
}
if (reduce) {
  buf.forEach((_, i) => buf[i] = wave((i % 70) / 70));
  ctx.strokeStyle = "#b8c4b2"; ctx.lineWidth = 2; ctx.beginPath();
  buf.forEach((v, x) => { const y = cv.height * .65 - v * cv.height * .5; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.stroke();
} else tick();

document.getElementById("yr").textContent = new Date().getFullYear();