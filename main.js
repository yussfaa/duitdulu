(() => {
  "use strict";

  /* ============ Konfigurasi ============ */
  const CONFIG = {
    REDIRECT_URL: "duit.html", // halaman utama setelah masuk
    REGISTER_REDIRECT_URL: "index.html", // tujuan setelah daftar berhasil (halaman masuk)
    MIN_LOADING_MS: 1100, // lama minimum status loading pada tombol
  };
  const force = !!window.DUITDULU_FORCE_MOTION; // diatur di shared/config.js (FORCE_MOTION)
  const SPEED = window.DUITDULU_SPEED || 1; // diatur di shared/config.js (MOTION_SPEED)

  /*
   * Autentikasi.
   * Hubungkan ke sistem login yang sudah ada dengan salah satu cara:
   *  1) Definisikan window.DuitDuluAuth.login(email, password) yang mengembalikan
   *     Promise<{ ok: boolean, message?: string, redirect?: string }>
   *  2) Beri atribut data-native + action/method pada <form>, maka form dikirim
   *     secara bawaan (server tetap yang memproses) setelah animasi sukses.
   */
  async function authenticate(email, password) {
    if (
      window.DuitDuluAuth &&
      typeof window.DuitDuluAuth.login === "function"
    ) {
      return window.DuitDuluAuth.login(email, password);
    }
    await sleep(400); // DEMO: sandi minimal 6 karakter dianggap benar
    return password.length >= 6
      ? { ok: true }
      : { ok: false, message: "Email atau kata sandi tidak sesuai." };
  }

  async function register(name, email, password) {
    if (
      window.DuitDuluAuth &&
      typeof window.DuitDuluAuth.register === "function"
    ) {
      return window.DuitDuluAuth.register(name, email, password);
    }
    await sleep(500); // DEMO: pendaftaran selalu berhasil
    return { ok: true };
  }

  /* ============ Util ============ */
  const mq = matchMedia("(max-width: 900px)");
  const reduce =
    matchMedia("(prefers-reduced-motion: reduce)").matches && !force;
  const $ = (s) => document.querySelector(s);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms * SPEED)); // menunggu mengikuti kecepatan animasi
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const stage = $("#stage"),
    act = $("#logoAct"),
    logo = $("#logo"),
    card = $("#card");
  const form = $("form"),
    mode = form.dataset.mode || "login";
  const inputs = [...form.querySelectorAll("input")],
    pws = inputs.filter((i) => "pw" in i.dataset);
  const email = $("#email"),
    pass = pws[0];
  const toggle = $("#toggle"),
    btn = $("#submit"),
    err = $("#formError");
  const leave = $("#leave"),
    leaveNote = $("#leaveNote"),
    back = $("#back");
  const glyphs = [...document.querySelectorAll(".g")];

  let busy = false,
    pose = "",
    last = Date.now(),
    actAnim = null;
  const touch = () => {
    last = Date.now();
  };

  /* ============ Pustaka gerakan ============ */
  const E_OUT = "cubic-bezier(.2,.7,.3,1)";
  const E_IN = "cubic-bezier(.6,0,.9,.4)";
  const E_IO = "ease-in-out";
  const T = (y = 0, x = 0, r = 0, sx = 1, sy = 1) =>
    `translate(${x}px,${y}px) rotate(${r}deg) scale(${sx},${sy})`;

  // lompat: antisipasi (squash) -> regang -> mendarat (squash) -> follow through
  const hop = (h = 24, r = 0) => [
    { transform: T(), easing: E_OUT, offset: 0 },
    { transform: T(0, 0, 0, 1.07, 0.88), easing: E_OUT, offset: 0.2 },
    { transform: T(-h, 0, r, 0.94, 1.1), easing: E_IN, offset: 0.5 },
    { transform: T(0, 0, 0, 1.1, 0.86), easing: E_OUT, offset: 0.72 },
    { transform: T(-h * 0.12, 0, 0, 0.98, 1.03), easing: E_OUT, offset: 0.86 },
    { transform: T(), offset: 1 },
  ];
  const sway = [
    { transform: T(), easing: E_IO },
    { transform: T(0, -4, -3), easing: E_IO },
    { transform: T(0, 4, 3), easing: E_IO },
    { transform: T(0, -2, -1.5), easing: E_IO },
    { transform: T() },
  ];
  const welcome = [
    { transform: T(), easing: E_OUT, offset: 0 },
    { transform: T(0, -6, -5, 1.04, 0.93), easing: E_OUT, offset: 0.22 },
    { transform: T(-20, 12, 6, 0.96, 1.08), easing: E_IN, offset: 0.55 },
    { transform: T(0, 8, 2, 1.06, 0.92), easing: E_OUT, offset: 0.78 },
    { transform: T(), offset: 1 },
  ];
  const duck = [
    { transform: T(), easing: E_OUT, offset: 0 },
    { transform: T(0, 0, 0, 1.07, 0.82), easing: E_OUT, offset: 0.4 },
    { transform: T(1, 0, -2, 1.01, 0.93), offset: 1 },
  ];
  const startle = [
    { transform: T(), easing: E_OUT, offset: 0 },
    { transform: T(0, 0, 0, 1.06, 0.9), easing: E_OUT, offset: 0.15 },
    { transform: T(-34, 0, -6, 0.92, 1.14), easing: E_IN, offset: 0.45 },
    { transform: T(0, 0, 5, 1.1, 0.86), easing: E_OUT, offset: 0.66 },
    { transform: T(-8, 0, -3, 0.98, 1.04), easing: E_OUT, offset: 0.82 },
    { transform: T(), offset: 1 },
  ];
  const nope = [
    { transform: T(), easing: E_IO },
    { transform: T(0, -8, -3), easing: E_IO },
    { transform: T(0, 8, 3), easing: E_IO },
    { transform: T(0, -5, -2), easing: E_IO },
    { transform: T(0, 4, 1.5), easing: E_IO },
    { transform: T() },
  ];
  const squat = [{ transform: T() }, { transform: T(2, 0, 0, 1.1, 0.78) }];

  // satu kanal untuk lapisan "act": gerakan baru menggantikan yang lama
  function playAct(frames, duration, fill = "none") {
    touch();
    if (reduce) return Promise.resolve();
    if (actAnim) actAnim.cancel();
    const a = (actAnim = act.animate(frames, { duration, fill }));
    return a.finished.catch(() => {});
  }

  // ombak per huruf (stagger)
  function wave(h = 12, step = 55, delay = 0) {
    touch();
    if (reduce) return;
    glyphs.forEach((g, i) =>
      g.animate(
        [
          { transform: "none", easing: E_OUT },
          {
            transform: `translateY(${-h}px) scale(.95,1.1)`,
            easing: E_IN,
            offset: 0.4,
          },
          {
            transform: "translateY(0) scale(1.07,.9)",
            easing: E_OUT,
            offset: 0.7,
          },
          { transform: "none" },
        ],
        { duration: 520, delay: delay + i * step },
      ),
    );
  }

  const symbolBounce = () =>
    reduce ||
    glyphs[0].animate(
      [
        { transform: "none", easing: E_OUT },
        {
          transform: "translateY(0) scale(1.1,.86)",
          easing: E_OUT,
          offset: 0.2,
        },
        {
          transform: "translateY(-16px) scale(.94,1.1)",
          easing: E_IN,
          offset: 0.5,
        },
        {
          transform: "translateY(0) scale(1.08,.9)",
          easing: E_OUT,
          offset: 0.75,
        },
        { transform: "none" },
      ],
      { duration: 700 },
    );

  /* ============ A. Masuk awal ============ */
  const pop = (from) => [
    { opacity: 0, transform: from, easing: E_OUT, offset: 0 },
    {
      opacity: 1,
      transform: "translateY(-14px) scale(.96,1.08)",
      easing: E_IN,
      offset: 0.5,
    },
    {
      opacity: 1,
      transform: "translateY(0) scale(1.08,.92)",
      easing: E_OUT,
      offset: 0.75,
    },
    {
      opacity: 1,
      transform: "translateY(0) scale(.99,1.02)",
      easing: E_OUT,
      offset: 0.9,
    },
    { opacity: 1, transform: "none", offset: 1 },
  ];
  function enter(g, from, duration, delay) {
    const a = g.animate(pop(from), { duration, delay, fill: "both" });
    a.finished
      .then(() => {
        g.style.opacity = 1;
        a.cancel();
      })
      .catch(() => {});
  }

  async function entrance() {
    if (reduce) {
      glyphs.forEach((g) => (g.style.opacity = 1));
      document.body.classList.add("ready");
      return;
    }
    const [sym, ...rest] = glyphs;
    enter(sym, "translateY(40px) scale(.2)", 950, 150); // simbol lebih dulu
    rest.forEach((g, i) =>
      enter(g, "translateY(70px) scale(.7,1.25)", 760, 650 + i * 70),
    ); // huruf menyusul
    await sleep(600);
    document.body.classList.add("ready");
    await sleep(650 + rest.length * 70 + 760 - 600);
    touch();
  }

  /* ============ B. Idle ============ */
  const idles = [
    () => playAct(sway, 1800),
    () => playAct(hop(14), 650),
    () => wave(9, 60),
    () => symbolBounce(),
  ];
  let lastIdle = -1;
  setInterval(() => {
    if (busy || pose || document.hidden || Date.now() - last < 5000) return;
    let i;
    do {
      i = Math.floor(Math.random() * idles.length);
    } while (i === lastIdle);
    lastIdle = i;
    idles[i]();
    touch();
  }, 1000);

  /* ============ C. Hover ============ */
  let near = false,
    cool = 0,
    raf = 0,
    px = 0,
    py = 0;
  const resetTilt = () => {
    stage.style.removeProperty("--hr");
    stage.style.removeProperty("--hx");
  };

  function hoverFrame() {
    raf = 0;
    const r = logo.getBoundingClientRect();
    const dx = px - (r.left + r.width / 2),
      dy = py - (r.top + r.height / 2);
    const isNear =
      Math.abs(dx) < r.width / 2 + 70 && Math.abs(dy) < r.height / 2 + 70;
    if (isNear) {
      stage.style.setProperty(
        "--hr",
        clamp((dx / r.width) * 10, -5, 5) + "deg",
      );
      stage.style.setProperty("--hx", clamp(dx * 0.04, -10, 10) + "px");
      if (!near && Date.now() - cool > 1400) {
        cool = Date.now();
        playAct(hop(12), 650);
      }
    } else resetTilt();
    near = isNear;
  }
  if (!reduce) {
    stage.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch" || busy) return;
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(hoverFrame);
    });
    stage.addEventListener("pointerleave", () => {
      resetTilt();
      near = false;
    });

    glyphs.forEach((g) => {
      let c = 0;
      g.addEventListener("pointerenter", (e) => {
        if (busy || e.pointerType === "touch" || Date.now() - c < 700) return;
        c = Date.now();
        touch();
        g.animate(
          [
            { transform: "none", easing: E_OUT },
            {
              transform: "translateY(-12px) scale(.96,1.08)",
              easing: E_IN,
              offset: 0.45,
            },
            {
              transform: "translateY(0) scale(1.06,.92)",
              easing: E_OUT,
              offset: 0.75,
            },
            { transform: "none" },
          ],
          { duration: 460 },
        );
      });
    });
  }
  // ketuk / klik logo
  logo.addEventListener("pointerdown", () => {
    if (busy) return;
    playAct(hop(22), 700);
    wave(8, 45, 420);
  });

  /* ============ D. Interaksi input ============ */
  function setPose(p) {
    if (p === pose) return;
    stage.classList.remove("pose-email", "pose-pass", "pose-peek");
    if (p) stage.classList.add("pose-" + p);
    pose = p;
  }
  const shown = () => pass.type === "text";
  inputs.forEach((f) =>
    f.addEventListener("focus", () => {
      if (mq.matches)
        setTimeout(
          () => f.scrollIntoView({ block: "center", behavior: "smooth" }),
          350,
        );
      if (busy) return;
      if (pws.includes(f)) {
        if (shown()) setPose("peek");
        else {
          setPose("pass");
          playAct(duck, 700);
        }
      } else {
        setPose("email");
        playAct(welcome, 900);
        wave(6, 40, 450);
      }
    }),
  );
  form.addEventListener("focusout", (e) => {
    if (busy) return;
    const n = e.relatedTarget;
    if (inputs.includes(n) || n === toggle) return;
    setPose(shown() ? "peek" : "");
  });
  toggle.addEventListener("mousedown", (e) => e.preventDefault()); // fokus tetap di kolom sandi
  toggle.addEventListener("click", () => {
    const show = !shown();
    pws.forEach((p) => {
      p.type = show ? "text" : "password";
    });
    toggle.textContent = show ? "Sembunyikan" : "Tampilkan";
    toggle.setAttribute("aria-pressed", String(show));
    toggle.setAttribute(
      "aria-label",
      show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi",
    );
    if (busy) return;
    if (show) {
      setPose("peek");
      playAct(startle, 800);
    } else {
      const inField =
        pws.includes(document.activeElement) ||
        document.activeElement === toggle;
      setPose(inField ? "pass" : "");
      playAct(duck, 700);
    }
  });

  /* ============ E. Login ============ */
  function setError(msg, fields) {
    err.textContent = msg;
    err.classList.add("show");
    fields.forEach((f) => f.setAttribute("aria-invalid", "true"));
  }
  function clearError() {
    err.classList.remove("show");
    inputs.forEach((f) => f.removeAttribute("aria-invalid"));
  }
  inputs.forEach((f) => f.addEventListener("input", clearError));

  function shakeCard() {
    if (reduce) return;
    card.animate(
      [
        { transform: "none" },
        { transform: "translateX(-7px)" },
        { transform: "translateX(7px)" },
        { transform: "translateX(-4px)" },
        { transform: "translateX(3px)" },
        { transform: "none" },
      ],
      { duration: 460, easing: E_IO },
    );
  }

  function endLoading() {
    busy = false;
    btn.classList.remove("is-loading");
    btn.removeAttribute("aria-busy");
  }

  async function fail(msg) {
    endLoading();
    const reg = mode === "register";
    setError(
      msg ||
        (reg
          ? "Pendaftaran belum berhasil. Coba lagi."
          : "Email atau kata sandi tidak sesuai. Periksa lagi, lalu coba masuk."),
      reg ? [email] : pws,
    );
    shakeCard();
    await playAct(nope, 600);
    (reg ? email : pass).focus();
  }

  async function success(res) {
    await playAct(hop(60), 900); // lompat perayaan
    wave(14, 50); // huruf menyusul sebagai follow through
    await sleep(450);
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2,
      y = r.top + r.height / 2;
    leave.hidden = false;
    if (!reduce) {
      await leave
        .animate(
          [
            { clipPath: `circle(0px at ${x}px ${y}px)` },
            { clipPath: `circle(150vmax at ${x}px ${y}px)` },
          ],
          { duration: 700, easing: "cubic-bezier(.7,0,.2,1)" },
        )
        .finished.catch(() => {});
    }
    const url =
      (res && res.redirect) ||
      (mode === "register"
        ? CONFIG.REGISTER_REDIRECT_URL
        : CONFIG.REDIRECT_URL);
    if (res && res.native) {
      leaveNote.textContent = "Mengalihkan…";
      back.hidden = true;
      form.submit();
      return;
    }
    if (url) {
      leaveNote.textContent = "Mengalihkan…";
      back.hidden = true;
      await sleep(1000);
      location.href = url;
      return;
    }
    leaveNote.textContent =
      "Mode demo: atur REDIRECT_URL di js/main.js atau sambungkan ke sistem login Anda.";
    back.hidden = false;
  }

  back.addEventListener("click", () => {
    leave.hidden = true;
    endLoading();
    pws.forEach((p) => {
      p.value = "";
    });
    (mode === "register" ? inputs[0] : pass).focus();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    clearError();
    const v = {};
    inputs.forEach((f) => {
      v[f.name] = pws.includes(f) ? f.value : f.value.trim();
    });
    const bad = (msg, f) => {
      setError(msg, [f]);
      f.focus();
      shakeCard();
      playAct(nope, 600);
    };
    if (mode === "register" && !v.name)
      return bad("Masukkan nama lengkap.", $("#name"));
    if (!/^\S+@\S+\.\S+$/.test(v.email))
      return bad("Masukkan email yang valid.", email);
    if (!v.password) return bad("Masukkan kata sandi.", pass);
    if (mode === "register") {
      if (v.password.length < 6)
        return bad("Kata sandi minimal 6 karakter.", pass);
      if (v.password !== v.confirm)
        return bad(
          "Kata sandi belum sama. Ketik ulang dengan teliti.",
          $("#confirm"),
        );
    }

    busy = true;
    setPose("");
    resetTilt();
    btn.classList.add("is-loading");
    btn.setAttribute("aria-busy", "true");
    const t0 = Date.now();

    await playAct(squat, 200, "forwards"); // antisipasi
    let done = false;
    const bob = (async () => {
      while (!done) {
        await playAct(hop(16), 700);
        await sleep(150);
      }
    })();

    let res;
    if (form.hasAttribute("data-native")) res = { ok: true, native: true };
    else {
      try {
        res =
          mode === "register"
            ? await register(v.name, v.email, v.password)
            : await authenticate(v.email, v.password);
      } catch (_) {
        res = { ok: false, message: "Tidak dapat terhubung. Coba lagi." };
      }
    }

    const wait = CONFIG.MIN_LOADING_MS - (Date.now() - t0);
    if (wait > 0) await sleep(wait);
    done = true;
    await bob;

    if (res && res.ok) success(res);
    else fail(res && res.message);
  });

  /* ============ Mobile: kotak pop-up masuk / daftar ============ */
  const grab = $("#grab"),
    mOpen = $("#mOpen"),
    panel = document.querySelector(".panel");
  let sheet = false;
  function openSheet() {
    if (sheet || !mq.matches) return;
    sheet = true;
    document.body.classList.add("sheet-open");
    setPose("");
    playAct(hop(20), 800);
    try {
      history.pushState({ sheet: 1 }, "");
    } catch (_) {
      /* abaikan */
    } // tombol Back HP menutup pop-up
  }
  function doClose() {
    if (!sheet) return;
    sheet = false;
    document.body.classList.remove("sheet-open");
    if (form.contains(document.activeElement)) document.activeElement.blur();
    setPose("");
    playAct(hop(26), 800);
  }
  function closeSheet() {
    if (!sheet) return;
    if (history.state && history.state.sheet)
      history.back(); // popstate di bawah yang menutup
    else doClose();
  }
  window.addEventListener("popstate", doClose);
  if (mOpen) mOpen.addEventListener("click", openSheet);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSheet();
  });
  if (grab) grab.addEventListener("click", closeSheet); // tombol silang (X)
  if (panel)
    panel.addEventListener("click", (e) => {
      if (e.target === panel) closeSheet();
    }); // tap area gelap
  if (/[?&]sheet=1/.test(location.search)) setTimeout(openSheet, 1700);

  /* ============ Mulai ============ */
  entrance();
})();
