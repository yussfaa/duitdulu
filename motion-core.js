/*
  Pengatur animasi bersama (dimuat sebelum skrip lain di halaman login dan halaman utama).
  - MOTION_SPEED memperlambat/mempercepat SEMUA animasi JavaScript lewat playbackRate.
  - FORCE_MOTION menjaga animasi tetap jalan walau perangkat memilih "kurangi gerakan".
*/
(() => {
  'use strict';
  const cfg = window.DUITDULU_CONFIG || {};
  const speed = Math.max(0.5, Number(cfg.MOTION_SPEED) || 1);
  const force = !!cfg.FORCE_MOTION || /[?&]motion=on/.test(location.search);
  window.DUITDULU_SPEED = speed;
  window.DUITDULU_FORCE_MOTION = force;
  if (force) document.documentElement.classList.add('force-motion');
  const native = Element.prototype.animate;
  Element.prototype.animate = function (keyframes, options) {
    const a = native.call(this, keyframes, options);
    a.playbackRate = 1 / speed;
    return a;
  };
})();
