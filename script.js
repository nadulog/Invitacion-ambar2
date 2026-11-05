(() => {
  const root = document.documentElement;
  const toast = document.getElementById("toast");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Aviso ---------- */
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
  };

  /* ---------- Nombres de invitados ----------
     Los completa assets/invitation-personalization.js a partir de ?invite=<token>.
     Acá solo se achica la letra cuando los nombres son largos. */
  const guestEl = document.getElementById("nombres-invitados");
  const fitGuestNames = () => {
    const len = guestEl.textContent.trim().length;
    guestEl.classList.toggle("is-long", len > 12 && len <= 20);
    guestEl.classList.toggle("is-very-long", len > 20);
  };
  new MutationObserver(fitGuestNames).observe(guestEl, { childList: true, characterData: true, subtree: true });

  /* ---------- Cuenta regresiva ---------- */
  const target = new Date("2027-01-09T21:00:00-03:00").getTime();
  const cd = ["cdDays", "cdHours", "cdMinutes", "cdSeconds"].map((id) => document.getElementById(id));
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    const s = Math.floor(Math.max(0, target - Date.now()) / 1000);
    [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60].forEach((v, i) => {
      const text = pad(v);
      if (cd[i].textContent !== text) cd[i].textContent = text;
    });
  };
  tick();
  setInterval(tick, 1000);

  /* ---------- Aparición al hacer scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.18 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Raspadita de la fecha ---------- */
  const datePanel = document.getElementById("datePanel");
  const gate = document.getElementById("dateGate");
  const canvas = document.getElementById("revealCanvas");
  const ctx = canvas.getContext("2d");
  const trail = document.getElementById("magicTrail");
  const storageKey = "ambar-fecha-revelada-v1";

  let revealed = false;
  try { revealed = sessionStorage.getItem(storageKey) === "1"; } catch {}
  let gateOpen = false;
  let drawing = false;
  let lastPoint = null;
  let strokes = 0;

  const paintFoil = () => {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // Lámina champagne con reflejos, como la seda de las piezas
    const g = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    g.addColorStop(0, "#efdcc4");
    g.addColorStop(0.3, "#e2c49f");
    g.addColorStop(0.55, "#f3e3cc");
    g.addColorStop(0.8, "#d8b68c");
    g.addColorStop(1, "#ecd6ba");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, rect.width, rect.height);

    for (let i = 0; i < 9; i++) {
      ctx.save();
      ctx.translate(Math.random() * rect.width, Math.random() * rect.height);
      ctx.rotate(-0.45 + Math.random() * 0.2);
      ctx.fillStyle = `rgba(255, 248, 236, ${0.14 + Math.random() * 0.2})`;
      ctx.fillRect(-rect.width * 0.7, -12, rect.width * 1.4, 18 + Math.random() * 34);
      ctx.restore();
    }
    for (let i = 0; i < 420; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * rect.width, Math.random() * rect.height, Math.random() * 1.5 + 0.3, 0, Math.PI * 2);
      ctx.fillStyle = Math.random() < 0.55 ? "rgba(255, 252, 244, 0.85)" : "rgba(184, 138, 62, 0.45)";
      ctx.fill();
    }
  };

  const openGate = () => {
    if (gateOpen || revealed) return;
    gateOpen = true;
    // Encaja la sección de la fecha en pantalla para que la raspadita coincida con la pieza
    window.scrollTo({ top: datePanel.offsetTop, behavior: "instant" });
    root.classList.add("is-locked");
    gate.hidden = false;
    paintFoil();
    requestAnimationFrame(() => requestAnimationFrame(() => gate.classList.add("is-visible")));
  };

  const finishReveal = () => {
    if (revealed) return;
    revealed = true;
    drawing = false;
    try { sessionStorage.setItem(storageKey, "1"); } catch {}
    gate.classList.add("is-revealed");
    if (navigator.vibrate) navigator.vibrate(18);
    setTimeout(() => {
      root.classList.remove("is-locked");
      gate.classList.add("is-leaving");
      setTimeout(() => gate.remove(), reducedMotion ? 0 : 750);
    }, reducedMotion ? 0 : 1300);
  };

  const pointFrom = (event) => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const clearedRatio = () => {
    // Muestra en una grilla gruesa cuánto se raspó
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    const step = 24;
    let total = 0;
    let clear = 0;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        total++;
        if (data[(y * width + x) * 4 + 3] < 40) clear++;
      }
    }
    return clear / total;
  };

  const sparkle = (p) => {
    if (reducedMotion) return;
    const star = document.createElement("span");
    star.style.left = `${p.x}px`;
    star.style.top = `${p.y}px`;
    star.style.setProperty("--dx", `${(Math.random() - 0.5) * 60}px`);
    star.style.setProperty("--dy", `${-10 - Math.random() * 40}px`);
    trail.append(star);
    setTimeout(() => star.remove(), 950);
  };

  canvas.addEventListener("pointerdown", (event) => {
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    lastPoint = pointFrom(event);
    gate.classList.add("is-scratching");
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!drawing || revealed) return;
    const next = pointFrom(event);
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = Math.max(60, canvas.clientWidth * 0.17);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    if (Math.random() < 0.5) sparkle(next);
    lastPoint = next;
    if (++strokes % 12 === 0 && clearedRatio() > 0.5) finishReveal();
  });

  const stopDrawing = () => {
    drawing = false;
    if (!revealed && clearedRatio() > 0.5) finishReveal();
  };
  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointercancel", stopDrawing);
  document.getElementById("revealSkip").addEventListener("click", finishReveal);

  if (revealed) {
    gate.remove();
  } else if ("IntersectionObserver" in window) {
    const gateObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          gateObserver.disconnect();
          openGate();
        }
      },
      { threshold: 0.55 }
    );
    gateObserver.observe(datePanel);
  }

  /* ---------- Música de fondo ---------- */
  // Los celulares no dejan reproducir sonido sin un toque, así que arranca
  // con el primer toque en cualquier parte (salvo que la hayan pausado a propósito).
  const audio = document.getElementById("invitationAudio");
  const audioBtn = document.getElementById("audioToggle");
  let userPaused = false;
  audio.volume = 0.85;

  const syncAudioBtn = () => {
    const playing = !audio.paused;
    audioBtn.classList.toggle("is-playing", playing);
    audioBtn.setAttribute("aria-pressed", String(playing));
    audioBtn.setAttribute("aria-label", playing ? "Pausar música" : "Reproducir música");
  };

  const playAudio = () => audio.play().catch(() => {});
  audio.addEventListener("play", syncAudioBtn);
  audio.addEventListener("pause", syncAudioBtn);

  audioBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    if (audio.paused) {
      userPaused = false;
      playAudio();
    } else {
      userPaused = true;
      audio.pause();
    }
  });

  const startOnGesture = () => {
    if (userPaused || !audio.paused) return;
    playAudio();
  };
  ["pointerup", "touchend", "click", "keydown"].forEach((type) =>
    document.addEventListener(type, startOnGesture, { passive: true })
  );
  playAudio();

  // Se pausa si salen de la pestaña y vuelve al regresar
  let pausedByHide = false;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !audio.paused) {
      pausedByHide = true;
      audio.pause();
    } else if (!document.hidden && pausedByHide) {
      pausedByHide = false;
      playAudio();
    }
  });

  /* ---------- Regalos: tocar la perla abre el sobre ---------- */
  const giftsPanel = document.getElementById("giftsPanel");
  const openGiftsBtn = document.getElementById("openGifts");
  document.getElementById("openEnvelope").addEventListener("click", () => {
    giftsPanel.classList.add("is-open");
    openGiftsBtn.removeAttribute("tabindex");
    if (navigator.vibrate) navigator.vibrate(12);
  });

  /* ---------- Enlaces que todavía no tienen destino ---------- */
  document.querySelectorAll("[data-pending]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (link.getAttribute("href") !== "#") return;
      event.preventDefault();
      showToast(link.dataset.pending);
    });
  });

  /* ---------- Modal de regalos ---------- */
  const modal = document.getElementById("giftModal");
  openGiftsBtn.addEventListener("click", () => {
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
  });
  const closeModal = () => (typeof modal.close === "function" ? modal.close() : modal.removeAttribute("open"));
  modal.querySelector("[data-close]").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      modal.appendChild(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch {}
      area.remove();
      return ok;
    }
  };

  modal.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = await copyText(btn.dataset.copy);
      showToast(ok ? btn.dataset.msg : "No se pudo copiar, mantené presionado el dato");
      if (!ok) return;
      const original = btn.textContent;
      btn.textContent = "¡Listo!";
      setTimeout(() => (btn.textContent = original), 1600);
    });
  });
})();
