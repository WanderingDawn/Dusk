/* ======================================================================
   atmosphere.js — what visits you.  Loaded AFTER the page's own script (it uses the page's variables).
   handprints · eyes that follow the cursor · Silhouette 1/2/3 · epilepsy mode · the "turn the light off first" pop-up
   ====================================================================== */
const Atmos = (() => {
  const $ = id => document.getElementById(id);
  const VR = !!$("slab");                         // true on the viewing-room page
  const IMG = VR ? "../images/" : "images/";
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.random() * a.length | 0];
  const now = () => performance.now();

  /* ---------- things you can tune ---------- */
  const T = {
    handprint3: .03,          // Handprint 3 is 90% transparent
    silhouette1: .02,         // Silhouette 1 is 85% transparent
    silhouette2: .05,         // Silhouette 2 is "somewhat transparent, enough to be seen"
    eyeGlow: .06,             // the eyes glow at about 5-6%
    s1Gap: [45, 60], s1Stay: [3, 5],     // seconds: Silhouette 1 (portfolio only) comes back 45-60 s after it left, and stays 3-5 s
    s2Gap: [44, 54], s2Stay: [8, 11],    // Silhouette 2 (portfolio only, only while the pulse has failed): 44-54 s between visits
    s3Gap: [75, 190], s3Stay: 3          // Silhouette 3 (viewing room only): 75-190 s after it left, stays 3 s
  };
  const S1_LINES = ["where is my body?", "why is it so cold in here", "someone moved me", "I can't find my hands", "he did this to me."];
  const S2_LINES = ["Rest.", "You did well.", "It's alright now.", "Let it go.", "I'll handle what's left."];
  const S3_LINES = ["curious who the body is?", "do you want to know his name?", "you looked, didn't you", "look closer", "I wonder what you look like."];

  const box = document.createElement("div"); box.id = "apparitions"; box.setAttribute("aria-hidden", "true"); document.body.appendChild(box);
  ["Handprint1", "Handprint2", "Handprint3", "Silhouette1", "Silhouette2"].forEach(n => { new Image().src = IMG + n + ".png"; });   // warm the cache

  /* ---------- sound ---------- */
  sfx.thud = mk("Thud.mp3", .85);
  sfx.glitch = mk("Static_glitch.mp3", .8);
  const play = (a, v) => { if (!soundOn) return; try { a.currentTime = 0; a.volume = v; a.play().catch(() => {}); } catch (e) {} };

  /* ---------- epilepsy mode (on by default; remembered between pages) ---------- */
  const sb = $("safe");
  const paintSafe = () => {
    document.body.classList.toggle("safe", safeMode);
    if (sb) { sb.textContent = "Epilepsy mode: " + (safeMode ? "on" : "off"); sb.setAttribute("aria-pressed", safeMode); }
  };
  if (sb) sb.addEventListener("click", () => { safeMode = !safeMode; try { localStorage.setItem("morgue.safe", safeMode ? "1" : "0"); } catch (e) {} paintSafe(); });
  paintSafe();

  /* ---------- the mouse (for the eyes) ---------- */
  let mx = innerWidth / 2, my = innerHeight / 2;
  addEventListener("pointermove", e => { mx = e.clientX; my = e.clientY; }, { passive: true });

  /* ---------- helpers ---------- */
  function ghost(name, cls, side, opacity, line) {                // a figure plus its words, as one thing that fades in and out
    const g = document.createElement("div");
    g.className = `gw ${cls} ${side}`;
    g.innerHTML = `<img class="gimg" alt="" src="${IMG}${name}.png" style="--o:${opacity}"><div class="say"></div>`;
    g.querySelector(".say").textContent = line;
    box.appendChild(g);
    requestAnimationFrame(() => requestAnimationFrame(() => g.classList.add("on")));
    return g;
  }
  const drop = (el, ms = 1100) => { el.classList.remove("on"); setTimeout(() => el.remove(), ms); };

  /* ---------- Silhouette 1: the suit. Every 15-30 s, 3-5 s, left or right. Doesn't care about the light or the hallucinations. ---------- */
  let s1 = null, s1End = 0, s1Next = 0, s1Idx = 0;
  function fireS1() {
    if (VR) return;                                  // Silhouette 1 never appears in the viewing room
    const line = s1Idx < S1_LINES.length ? S1_LINES[s1Idx] : pick(S1_LINES.slice(-2));
    s1Idx++;
    s1 = ghost("Silhouette1", "g1", Math.random() < .5 ? "left" : "right", T.silhouette1, line);
    s1End = now() + rnd(...T.s1Stay) * 1000;
  }

  /* ---------- Silhouette 2: the veiled one. Only while the heart monitor has failed and the dark has fully closed in. ---------- */
  const pulseDark = t => typeof alive !== "undefined" && penaltyOn && !alive && t >= deadSince + GRACE + RAMP;
  let s2 = null, s2End = 0, s2Next = 0, s2Idx = 0, s2Side = 0;
  function fireS2() {
    s2Side ^= 1;
    s2 = ghost("Silhouette2", "g2", s2Side ? "left" : "right", T.silhouette2, S2_LINES[Math.min(s2Idx, S2_LINES.length - 1)]);
    s2Idx++; s2End = now() + rnd(...T.s2Stay) * 1000;
  }

  /* ---------- eyes: only with the light off AND the hallucinations on. The irises follow the cursor. ---------- */
  const EYE = `<svg viewBox="0 0 46 22"><path d="M2 11Q23 -3 44 11Q23 25 2 11Z" fill="#dff0e8"/><g class="iris"><circle cx="23" cy="11" r="6.4" fill="#04080a"/><circle cx="23" cy="11" r="2.5" fill="#000"/></g></svg>`;
  let eyeNext = 0;
  function fireEyes(i) {
    if (box.querySelectorAll(".eyes").length >= 2) return;
    const e = document.createElement("div"), life = rnd(4, 7);
    e.className = "eyes"; e.innerHTML = EYE + EYE;
    e.style.cssText = `left:${rnd(5, 82)}%;top:${rnd(10, 82)}%;--sz:${rnd(.8, 1.9).toFixed(2)};--g:${T.eyeGlow};--life:${life.toFixed(1)}s`;
    e.addEventListener("animationend", () => e.remove());
    box.appendChild(e);
  }
  function trackEyes(t) {
    box.querySelectorAll(".eyes").forEach(e => e.querySelectorAll("svg").forEach(s => {
      const r = s.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = mx - cx, dy = my - cy; const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260);
      dx = dx / d * k * 12; dy = dy / d * k * 3.4;
      s.querySelector(".iris").style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px)`;
    }));
  }

  /* ---------- handprints ---------- */
  let hpNext = 0, hp3Next = 0;
  function fireHand(n) {
    if (box.querySelectorAll(".hp").length >= 3) return;
    const im = document.createElement("img"), big = n === 3;
    im.className = "hp"; im.alt = ""; im.src = `${IMG}Handprint${n}.png`;
    const h = big ? rnd(30, 44) : rnd(15, 28), op = big ? T.handprint3 : (.14 + .22 * (typeof intensity === "function" ? intensity(now()) : 0));
    const flip = !big && Math.random() < .5 ? -1 : 1, rot = big ? rnd(-5, 5) : rnd(-24, 24);
    im.style.cssText = `height:${h}vh;left:${rnd(2, 86)}%;top:${rnd(2, big ? 30 : 62)}%;--o:${op.toFixed(2)};rotate:${rot.toFixed(1)}deg;transform:scaleX(${flip})`;
    box.appendChild(im);
    if (big) { im.classList.add("slam", "on"); play(sfx.thud, safeMode ? .6 : .9); }              // Handprint 3 arrives with a thud, all at once
    else requestAnimationFrame(() => requestAnimationFrame(() => im.classList.add("on")));
    setTimeout(() => { im.classList.remove("on"); setTimeout(() => im.remove(), 2200); }, rnd(3000, 6500));
  }

  /* ---------- Silhouette 3: the black box (viewing room only) ---------- */
  const st = document.createElement("canvas"); st.id = "static"; st.width = 192; st.height = 108; document.body.appendChild(st);
  const sx = st.getContext("2d"), sd = sx.createImageData(192, 108);
  const scan = document.createElement("div"); scan.id = "scan"; document.body.appendChild(scan);
  let s3 = null, s3End = 0, s3Next = 0, s3On = false, chaosT = 0, frameN = 0;
  function fireS3() {
    if (s3On) return;
    s3On = true; window.__s3 = true;
    if (typeof file !== "undefined" && !file.hidden && typeof closeFile === "function") closeFile();      // it makes you close the case file
    const side = Math.random() < .5 ? "left" : "right";
    s3 = document.createElement("div"); s3.className = `s3 ${side}`;
    s3.innerHTML = `<div class="say"></div>`; s3.querySelector(".say").textContent = pick(S3_LINES);
    document.body.appendChild(s3); requestAnimationFrame(() => s3.classList.add("on"));
    document.documentElement.classList.add("glitch"); document.documentElement.classList.toggle("calm", safeMode);
    st.style.opacity = safeMode ? .1 : .42; scan.style.opacity = safeMode ? .12 : .55;
    play(sfx.glitch, safeMode ? .5 : .85);
    s3End = now() + T.s3Stay * 1000;
  }
  function endS3() {
    s3On = false; window.__s3 = false; chaos = 0;
    document.documentElement.classList.remove("glitch", "calm"); st.style.opacity = 0; scan.style.opacity = 0;
    if (s3) { const e = s3; s3 = null; e.classList.remove("on"); setTimeout(() => e.remove(), 200); }
    s3Next = now() + rnd(...T.s3Gap) * 1000;
  }
  function driveS3(t) {
    frameN++;
    if (!safeMode || frameN % 6 === 0) {                                           // the static (slowly in epilepsy mode)
      const d = sd.data; for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255 | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
      sx.putImageData(sd, 0, 0);
    }
    if (safeMode) { chaos = .16 * Math.sin((t - (s3End - T.s3Stay * 1000)) / 1000 * Math.PI * 1.6); }   // a slow, gentle swell instead of a strobe
    else if (t >= chaosT) { chaos = Math.random() < .5 ? -rnd(.3, .9) : rnd(.15, .6); chaosT = t + rnd(30, 95); }   // the lights lose their minds
  }

  /* ---------- the "turn the light off before you leave" pop-up ---------- */
  const fade = document.createElement("div"); fade.id = "fade"; document.body.appendChild(fade);
  const leave = document.createElement("div"); leave.id = "leave"; leave.hidden = true;
  leave.innerHTML = `<div class="leave-box" role="dialog" aria-modal="true" aria-labelledby="leave-h"><h3 id="leave-h">The light is still on.</h3>
    <p id="leave-p">Something in here doesn't like being watched while you leave. Switch the light off first, then go.</p>
    <div class="row"><button class="btn" id="leave-off">Turn off the light</button><button class="btn" id="leave-stay">Stay</button></div></div>`;
  document.body.appendChild(leave);
  let pending = null, goAt = 0;
  const showLeave = on => { if (on) { leave.hidden = false; requestAnimationFrame(() => leave.classList.add("on")); } else { leave.classList.remove("on"); setTimeout(() => { if (!leave.classList.contains("on")) leave.hidden = true; }, 350); } };
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a[data-leave]");
    if (!a || e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (!lightsOn) { e.preventDefault(); pending = a.href; goAt = now() + 250; return; }          // the light is already off: go, softly
    e.preventDefault(); pending = a.href; goAt = 0;
    $("leave-h").textContent = "The light is still on."; $("leave-p").textContent = "Something in here doesn't like being watched while you leave. Switch the light off first, then go.";
    showLeave(true); $("leave-off").focus();
  }, true);
  $("leave-off").addEventListener("click", () => lights.click());
  $("leave-stay").addEventListener("click", () => { pending = null; goAt = 0; showLeave(false); });
  addEventListener("keydown", e => { if (e.key === "Escape" && leave.classList.contains("on")) $("leave-stay").click(); });
  function leaveTick(t) {
    if (!pending) return;
    if (!lightsOn && !goAt) { goAt = t + 900; $("leave-h").textContent = "Good."; $("leave-p").textContent = "Go quietly."; }
    if (lightsOn && goAt) { goAt = 0; }                                                            // they switched it back on: wait again
    if (goAt && t >= goAt) { const href = pending; pending = null; fade.classList.add("on"); setTimeout(() => { location.href = href; }, 850); }
  }

  /* ---------- one tick per frame (called from the page's own frame loop) ---------- */
  function tick() {
    const t = now(), i = typeof intensity === "function" ? intensity(t) : 0;
    const active = typeof hallucActive === "function" && hallucActive(t);
    leaveTick(t);

    // Silhouette 1: portfolio only; independent of everything except the door
    if (!VR && !introPending) {
      if (!s1Next) s1Next = t + rnd(...T.s1Gap) * 1000;
      if (s1 && t >= s1End) { drop(s1); s1 = null; s1Next = t + rnd(...T.s1Gap) * 1000; }
      else if (!s1 && t >= s1Next) fireS1();
    }
    // Silhouette 2: portfolio only, only while the monitor has failed
    if (!VR) {
      const pd = pulseDark(t);
      if (s2 && (!pd || t >= s2End)) { drop(s2, pd ? 1100 : 400); s2 = null; s2Next = t + rnd(...T.s2Gap) * 1000; }
      if (!pd) { if (typeof alive !== "undefined" && alive) s2Idx = 0; s2Next = 0; }
      else if (!s2) { if (!s2Next) s2Next = t + 1500; if (t >= s2Next) fireS2(); }
    }
    // Silhouette 3: viewing room only
    if (VR) {
      if (!introPending && !s3On) { if (!s3Next) s3Next = t + rnd(...T.s3Gap) * 1000; else if (t >= s3Next) fireS3(); }
      if (s3On) { if (t >= s3End) endS3(); else driveS3(t); }
    }
    // handprints and eyes: the hallucinations (eyes only in the dark)
    if (active) {
      if (!hpNext) hpNext = t + 5000;
      if (t >= hpNext) { fireHand(Math.random() < .5 ? 1 : 2); hpNext = t + (16000 - 9000 * i) * rnd(.6, 1.4); }
      if (!hp3Next) hp3Next = t + rnd(18000, 34000);
      if (t >= hp3Next && (i > .1 || pulseDark(t))) { fireHand(3); hp3Next = t + rnd(26000, 50000); }
    } else { hpNext = 0; hp3Next = 0; box.querySelectorAll(".hp").forEach(h => h.remove()); }
    if (active && !lampLit) {
      if (!eyeNext) eyeNext = t + rnd(5000, 9000);
      if (t >= eyeNext) { fireEyes(i); eyeNext = t + rnd(9000, 20000) * (1.15 - .5 * i); }
    } else { eyeNext = 0; box.querySelectorAll(".eyes").forEach(e => e.remove()); }
    trackEyes(t);
  }

  return { tick, fire: { s1: fireS1, s2: fireS2, s3: fireS3, hand: fireHand, eyes: fireEyes }, T };
})();
