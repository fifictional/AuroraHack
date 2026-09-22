(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hero = document.getElementById("hero");
  if (!hero || reduceMotion) return;

  const layer = document.getElementById("aurora-sparkles");

  /* ── Aurora background follows pointer / finger ── */
  let targetPanX = 0;
  let targetPanY = 0;
  let panX = 0;
  let panY = 0;
  let panRaf = 0;
  let dragging = false;

  function setPan() {
    hero.style.setProperty("--pan-x", `${panX.toFixed(1)}px`);
    hero.style.setProperty("--pan-y", `${panY.toFixed(1)}px`);
  }

  function panTick() {
    panX += (targetPanX - panX) * 0.12;
    panY += (targetPanY - panY) * 0.12;
    setPan();

    const moving =
      Math.abs(targetPanX - panX) > 0.15 || Math.abs(targetPanY - panY) > 0.15;

    if (moving || dragging) {
      panRaf = requestAnimationFrame(panTick);
    } else {
      panRaf = 0;
      setPan();
    }
  }

  function startPan() {
    if (!panRaf) panRaf = requestAnimationFrame(panTick);
  }

  function updatePanFromEvent(event) {
    const rect = hero.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    targetPanX = nx * 48;
    targetPanY = ny * 28;
    startPan();
  }

  function endPan() {
    dragging = false;
    targetPanX = 0;
    targetPanY = 0;
    startPan();
  }

  hero.addEventListener("pointerdown", (event) => {
    dragging = true;
    if (event.pointerType === "touch") {
      event.preventDefault();
      try {
        hero.setPointerCapture(event.pointerId);
      } catch (_) {
        /* ignore */
      }
    }
    updatePanFromEvent(event);
  });

  hero.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" && !dragging) return;
    if (event.pointerType === "mouse" || dragging) {
      updatePanFromEvent(event);
    }
  });

  hero.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") updatePanFromEvent(event);
  });

  hero.addEventListener("pointerup", endPan);
  hero.addEventListener("pointercancel", endPan);
  hero.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") endPan();
  });

  /* ── Optional sparkle trail (subtle) ── */
  if (layer) {
    const TRAIL_COUNT = 10;
    const trail = [];
    let mainX = 0;
    let mainY = 0;
    let targetX = 0;
    let targetY = 0;
    let raf = 0;
    let active = false;
    let lastTrailAt = 0;

    const main = document.createElement("div");
    main.className = "sparkle sparkle--main";
    const glow = document.createElement("span");
    glow.className = "sparkle__glow";
    main.appendChild(glow);
    layer.appendChild(main);

    function place(el, x, y, scale, opacity, rot) {
      el.style.setProperty("--x", `${x}px`);
      el.style.setProperty("--y", `${y}px`);
      el.style.setProperty("--scale", String(scale));
      el.style.setProperty("--opacity", String(opacity));
      el.style.setProperty("--rot", `${rot}deg`);
    }

    function pointInHero(event) {
      const rect = hero.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }

    function spawnTrail(x, y) {
      const el = document.createElement("div");
      el.className = "sparkle sparkle--trail";
      el.style.setProperty("--size", `${10 + Math.random() * 10}px`);
      layer.appendChild(el);

      const particle = {
        el,
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        life: 1,
        decay: 0.03 + Math.random() * 0.02,
        rot: Math.random() * 40 - 20,
        scale: 0.55 + Math.random() * 0.4,
      };
      trail.push(particle);
      place(el, particle.x, particle.y, particle.scale, 0.7, particle.rot);

      if (trail.length > TRAIL_COUNT) {
        const old = trail.shift();
        old.el.remove();
      }
    }

    function tick(now) {
      mainX += (targetX - mainX) * 0.22;
      mainY += (targetY - mainY) * 0.22;
      place(main, mainX, mainY, active ? 0.85 : 0, active ? 0.75 : 0, active ? 12 : 0);

      if (active && now - lastTrailAt > 22) {
        spawnTrail(mainX, mainY);
        lastTrailAt = now;
      }

      for (let i = trail.length - 1; i >= 0; i -= 1) {
        const p = trail[i];
        p.life -= p.decay;
        p.scale *= 0.97;
        p.rot += 1.5;
        if (p.life <= 0) {
          p.el.remove();
          trail.splice(i, 1);
          continue;
        }
        place(p.el, p.x, p.y, p.scale * p.life, p.life * 0.7, p.rot);
      }

      if (active || trail.length) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
        place(main, mainX, mainY, 0, 0, 0);
      }
    }

    function start() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    hero.addEventListener("pointerdown", (event) => {
      const point = pointInHero(event);
      targetX = point.x;
      targetY = point.y;
      mainX = point.x;
      mainY = point.y;
      active = true;
      hero.classList.add("is-hovering");
      start();
    });

    hero.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch" && !dragging) return;
      const point = pointInHero(event);
      targetX = point.x;
      targetY = point.y;
      if (!active && event.pointerType === "mouse") {
        mainX = point.x;
        mainY = point.y;
      }
      active = true;
      hero.classList.add("is-hovering");
      start();
    });

    hero.addEventListener("pointerup", () => {
      active = false;
      hero.classList.remove("is-hovering");
      start();
    });

    hero.addEventListener("pointercancel", () => {
      active = false;
      hero.classList.remove("is-hovering");
      start();
    });

    hero.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") {
        active = false;
        hero.classList.remove("is-hovering");
        start();
      }
    });
  }

  /* ── AURORA title: color peak follows pointer ── */
  const title = document.getElementById("aurora-title");
  if (!title) return;

  let tx = 0.5;
  let cx = 0.5;
  let titleRaf = 0;
  let titleHovering = false;

  function setTitleVars() {
    title.style.setProperty("--aurora-x", `${(cx * 100).toFixed(2)}%`);
  }

  function titleTick() {
    cx += (tx - cx) * 0.18;
    setTitleVars();

    if (Math.abs(tx - cx) > 0.0005 || titleHovering) {
      titleRaf = requestAnimationFrame(titleTick);
    } else {
      titleRaf = 0;
    }
  }

  function startTitle() {
    if (!titleRaf) titleRaf = requestAnimationFrame(titleTick);
  }

  function titlePoint(event) {
    const rect = title.getBoundingClientRect();
    if (!rect.width) return;
    tx = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    titleHovering = true;
    startTitle();
  }

  title.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") {
      try {
        title.setPointerCapture(event.pointerId);
      } catch (_) {
        /* ignore */
      }
    }
    titlePoint(event);
  });

  title.addEventListener("pointermove", titlePoint);
  title.addEventListener("pointerenter", () => {
    titleHovering = true;
    startTitle();
  });
  title.addEventListener("pointerup", () => {
    titleHovering = false;
    tx = 0.5;
    startTitle();
  });
  title.addEventListener("pointerleave", () => {
    titleHovering = false;
    tx = 0.5;
    startTitle();
  });

  setTitleVars();
})();
