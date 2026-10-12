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

function applyDark(p) {             // p: 0 (normal) to 1 (nearly blind)
  dark.style.setProperty("--r", (260 - 215 * p).toFixed(0) + "px");
  dark.style.setProperty("--m", (.35 + .55 * p).toFixed(2));
  dark.style.setProperty("--o", (.88 + .12 * p).toFixed(2));
  dark.classList.toggle("pen", p > 0);
}
function renderPulse() {
  pulse.classList.toggle("dead", !alive);
  document.querySelector(".monitor").classList.toggle("dead", !alive);
  pulse.innerHTML = alive
    ? "Pulse: 72 bpm" + (penaltyOn ? " <span>(click the monitor when it stops)</span>" : "")
    : "Pulse: none <span>(" + (penaltyOn ? "click to revive before the dark closes in" : "click to revive") + ")</span>";
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
  applyDark(dim);
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