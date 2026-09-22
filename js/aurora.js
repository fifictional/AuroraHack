(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  if (reduceMotion || !finePointer) return;

  /* ── Hero: sparkle + short trail ── */
  const hero = document.getElementById("hero");
  const layer = document.getElementById("aurora-sparkles");

  if (hero && layer) {
    const TRAIL_COUNT = 16;
    const trail = [];
    let mainX = 0;
    let mainY = 0;
    let targetX = 0;
    let targetY = 0;
    let raf = 0;
    let hovering = false;
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

    function spawnTrail(x, y) {
      const el = document.createElement("div");
      el.className = "sparkle sparkle--trail";
      const size = 12 + Math.random() * 12;
      el.style.setProperty("--size", `${size}px`);
      layer.appendChild(el);

      const particle = {
        el,
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        life: 1,
        decay: 0.02 + Math.random() * 0.014,
        rot: Math.random() * 40 - 20,
        scale: 0.65 + Math.random() * 0.45,
      };
      trail.push(particle);
      place(el, particle.x, particle.y, particle.scale, 1, particle.rot);

      if (trail.length > TRAIL_COUNT) {
        const old = trail.shift();
        old.el.remove();
      }
    }

    function tick(now) {
      mainX += (targetX - mainX) * 0.22;
      mainY += (targetY - mainY) * 0.22;
      place(main, mainX, mainY, hovering ? 1 : 0, hovering ? 1 : 0, hovering ? 12 : 0);

      if (hovering && now - lastTrailAt > 18) {
        const moved =
          Math.hypot(targetX - mainX, targetY - mainY) > 1.5 ||
          Math.hypot(targetX - mainX, targetY - mainY) >= 0;
        if (moved) {
          spawnTrail(mainX, mainY);
          lastTrailAt = now;
        }
      }

      for (let i = trail.length - 1; i >= 0; i -= 1) {
        const p = trail[i];
        p.life -= p.decay;
        p.scale *= 0.975;
        p.rot += 1.5;
        if (p.life <= 0) {
          p.el.remove();
          trail.splice(i, 1);
          continue;
        }
        place(p.el, p.x, p.y, p.scale * p.life, p.life, p.rot);
      }

      if (hovering || trail.length) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
        place(main, mainX, mainY, 0, 0, 0);
      }
    }

    function start() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      targetX = event.clientX - rect.left;
      targetY = event.clientY - rect.top;
      if (!hovering) {
        mainX = targetX;
        mainY = targetY;
      }
      hovering = true;
      hero.classList.add("is-hovering");
      start();
    });

    hero.addEventListener("pointerenter", (event) => {
      const rect = hero.getBoundingClientRect();
      targetX = event.clientX - rect.left;
      targetY = event.clientY - rect.top;
      mainX = targetX;
      mainY = targetY;
      hovering = true;
      hero.classList.add("is-hovering");
      start();
    });

    hero.addEventListener("pointerleave", () => {
      hovering = false;
      hero.classList.remove("is-hovering");
      start();
    });
  }

  /* ── AURORA title: color peak sits under the cursor ── */
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

  title.addEventListener("pointermove", (event) => {
    const rect = title.getBoundingClientRect();
    if (!rect.width) return;
    tx = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    titleHovering = true;
    startTitle();
  });

  title.addEventListener("pointerenter", () => {
    titleHovering = true;
    startTitle();
  });

  title.addEventListener("pointerleave", () => {
    titleHovering = false;
    tx = 0.5;
    startTitle();
  });

  setTitleVars();
})();
