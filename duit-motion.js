/* DuitDulu - animasi (Web Animations API, tanpa library). Dipanggil dari duit.js lewat window.DuitMotion. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const SPEED = window.DUITDULU_SPEED || 1;      // diatur di shared/config.js (MOTION_SPEED)
  const FORCE = !!window.DUITDULU_FORCE_MOTION;  // diatur di shared/config.js (FORCE_MOTION)
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches && !FORCE;
  const small = () => matchMedia('(max-width: 760px)').matches;
  const SPRING = 'cubic-bezier(.34,1.56,.64,1)', OUT = 'cubic-bezier(.22,.8,.3,1)';
  const ORDER = ['dashboard', 'input', 'analysis', 'results', 'allocation', 'history'];
  let current = 'dashboard';

  function anim(el, frames, opts) {
    if (!el || reduce() || !el.animate) return null;
    return el.animate(frames, { fill: 'backwards', easing: OUT, ...opts });
  }
  function stagger(els, { x = 0, y = 16, step = 55, dur = 520, delay = 0, scale = 1 } = {}) {
    els.forEach((el, i) => anim(el,
      [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(${scale})` }, { opacity: 1, transform: 'none' }],
      { duration: dur, delay: delay + Math.min(i, 10) * step }));
  }

  /* ---------- Penanda menu yang meluncur (squash & stretch) ---------- */
  let pillY = null;
  function setupPill() {
    const list = $('.nav-list');
    if (!list || $('.nav-pill')) return;
    const p = document.createElement('span');
    p.className = 'nav-pill'; p.setAttribute('aria-hidden', 'true');
    list.prepend(p); list.classList.add('has-pill');
  }
  function movePill(animate) {
    const p = $('.nav-pill'), a = $('.nav-item.active');
    if (!p || !a) return;
    const y = a.offsetTop;
    p.style.height = a.offsetHeight + 'px';
    if (animate && pillY !== null && pillY !== y && !reduce()) {
      const stretch = 1 + Math.min(.5, Math.abs(y - pillY) / 160);
      p.animate([
        { transform: `translateY(${pillY}px) scale(1,1)` },
        { transform: `translateY(${(pillY + y) / 2}px) scale(.96,${stretch})`, offset: .45 },
        { transform: `translateY(${y}px) scale(1,1)` },
      ], { duration: 560, easing: 'cubic-bezier(.3,1.25,.5,1)' });
    }
    p.style.transform = `translateY(${y}px)`;
    pillY = y;
  }

  /* ---------- Pindah halaman: geser sesuai arah + isi muncul bertahap ---------- */
  function pageEnter(name, dir) {
    const page = $('#page-' + name);
    if (!page) return;
    anim(page, [{ transform: small() ? 'translateY(14px)' : `translateX(${dir * 30}px)` }, { transform: 'none' }], { duration: 480 });
    stagger($$(':scope > *', page).slice(0, 9), { y: 18, step: 60, delay: 70, dur: 540 });
    anim($('#pageTitle'), [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 420 });
    anim($('#topEyebrow'), [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 60 });
    anim($('.nav-item.active .ico'), [
      { transform: 'scale(1)' }, { transform: 'scale(1.35) rotate(-8deg)', offset: .4 }, { transform: 'scale(.95)', offset: .7 }, { transform: 'none' },
    ], { duration: 520, fill: 'none' });
  }
  if (typeof window.showPage === 'function') {
    const orig = window.showPage;
    window.showPage = function (name) {
      const prev = current;
      orig.apply(this, arguments);
      if (!$('#page-' + name)) return;
      current = name;
      movePill(true);
      if (name !== prev) pageEnter(name, ORDER.indexOf(name) >= ORDER.indexOf(prev) ? 1 : -1);
    };
  }

  /* ---------- Muncul pertama kali ---------- */
  function intro() {
    setupPill(); movePill(false);
    if (reduce()) return;
    if (!small()) anim($('.sidebar'), [{ opacity: 0, transform: 'translateX(-28px)' }, { opacity: 1, transform: 'none' }], { duration: 650 });
    stagger($$('.nav-item[data-page]'), { x: -14, y: 0, step: 55, delay: 220, dur: 500 });
    anim($('.topbar'), [{ opacity: 0, transform: 'translateY(-16px)' }, { opacity: 1, transform: 'none' }], { duration: 550, delay: 100 });
    anim($('#userAvatar'), [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1.15)', offset: .6 }, { opacity: 1, transform: 'none' }], { duration: 650, delay: 350, easing: SPRING });
    stagger($$(':scope > *', $('.page.active')).slice(0, 9), { y: 22, step: 70, delay: 260, dur: 600 });
  }

  /* ---------- Menu geser di HP: item muncul bertahap ---------- */
  new MutationObserver(() => {
    if (document.body.classList.contains('drawer-open'))
      stagger($$('.sidebar .nav-item'), { x: -16, y: 0, step: 45, delay: 120, dur: 420 });
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  addEventListener('resize', () => movePill(false));
  document.addEventListener('click', (e) => { if (e.target.closest('#collapseToggle')) setTimeout(() => movePill(false), 320 * SPEED); });

  /* ---------- Angka berhitung naik ---------- */
  const COUNT = ['dashTotal', 'dashReserve', 'dashOperating', 'dashboardDonutPercent', 'allocationDonutTotal'];
  const last = new Map();
  const parse = (t) => {
    const m = t.replace(/\u00a0/g, ' ').trim().match(/^(Rp)?\s?(-?[\d.]+)(%?)$/);
    return m ? { rp: !!m[1], v: Number(m[2].replace(/\./g, '')) } : null;
  };
  const fmt = (info, v) => (info.rp ? (typeof money === 'function' ? money(v) : 'Rp' + v.toLocaleString('id-ID')) : Math.round(v) + '%');
  function countTo(el, from, info) {
    cancelAnimationFrame(el._raf);
    const t0 = performance.now(), dur = 700 * SPEED;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el._mine = fmt(info, from + (info.v - from) * e);
      el.textContent = el._mine;
      if (k < 1) el._raf = requestAnimationFrame(tick);
    };
    el._raf = requestAnimationFrame(tick);
  }
  new MutationObserver((muts) => {
    for (const m of muts) {
      const el = m.target.nodeType === 3 ? m.target.parentElement : m.target;
      if (!el || !COUNT.includes(el.id) || el.textContent === el._mine) continue;
      const info = parse(el.textContent);
      if (!info) continue;
      cancelAnimationFrame(el._raf);
      const from = last.get(el.id) || 0;
      last.set(el.id, info.v);
      if (from !== info.v && !reduce()) countTo(el, from, info);
    }
  }).observe(document.body, { childList: true, characterData: true, subtree: true });

  /* ---------- Getar saat belum memenuhi syarat ---------- */
  function shake(el) {
    if (!el) return;
    const t = el.matches('input,select,textarea') ? (el.closest('.rd-field') || el.parentElement) : el;
    t.classList.add('is-invalid');
    clearTimeout(t._inv); t._inv = setTimeout(() => t.classList.remove('is-invalid'), 1800 * SPEED);
    anim(t, [
      { transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(9px)' },
      { transform: 'translateX(-6px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' },
    ], { duration: 480, easing: 'ease-in-out', fill: 'none' });
  }

  /* ---------- Kartu kebutuhan: pop saat dipilih ---------- */
  document.addEventListener('change', (e) => {
    const card = e.target.closest && e.target.closest('#alternativeGrid .alternative-card');
    if (!card || !e.target.checked) return;
    anim(card, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)', offset: .4 }, { transform: 'scale(.98)', offset: .7 }, { transform: 'none' }], { duration: 420, fill: 'none', easing: OUT });
  });

  /* ---------- Konfeti kecil ---------- */
  function celebrate(origin) {
    if (reduce() || !origin) return;
    const r = origin.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const colors = ['#087346', '#15965e', '#9fd9b5', '#e9f5ec'];
    for (let i = 0; i < 16; i++) {
      const d = document.createElement('i');
      d.className = 'confetti'; d.style.left = cx + 'px'; d.style.top = cy + 'px';
      d.style.background = colors[i % colors.length];
      document.body.appendChild(d);
      const a = (Math.PI * 2 * i) / 16 + Math.random() * .4, dist = 60 + Math.random() * 70;
      d.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * dist}px,${Math.sin(a) * dist - 30}px) scale(1)`, opacity: 1, offset: .55 },
        { transform: `translate(${Math.cos(a) * dist}px,${Math.sin(a) * dist + 30}px) scale(.3)`, opacity: 0 },
      ], { duration: 900 + Math.random() * 300, easing: OUT }).finished.then(() => d.remove()).catch(() => d.remove());
    }
  }

  window.DuitMotion = { intro, shake, celebrate };
})();
