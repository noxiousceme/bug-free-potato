// Premier · лендинг: Ядро летит за прокруткой (редизайн, шаг 6).
// Сцена грузится после события load, поэтому текст и кнопки видны раньше неё. Место Ядра задаёт
// Core.pose(): прямо, без пружин, поэтому оно повторяет положение прокрутки. Между разделами — сглаживание
// smoothstep по позиции прокрутки. При «уменьшить движение» Ядро остаётся на месте.
(() => {
  'use strict';
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  // раздел, x и y (доли окна), радиус (доля меньшей стороны), яркость
  const KEYS = [
    ['.hero', (W) => (W >= 960 ? 0.74 : 0.5), 0.36, 0.3, 1],
    ['#features', 0.14, 0.42, 0.16, 0.85],
    ['#pricing', 0.86, 0.34, 0.2, 0.7],
    ['#reviews', 0.5, 0.98, 0.4, 0.5],
    ['#faq', 0.12, 0.3, 0.14, 0.45],
    ['.final', 0.5, 0.45, 0.26, 0.9],
  ];
  let marks = [], queued = 0;
  const smooth = (t) => t * t * (3 - 2 * t);

  function measure() {
    marks = KEYS.filter(([sel]) => document.querySelector(sel)).map(([sel, x, y, r, g]) => {
      const el = document.querySelector(sel);
      return { mid: el.getBoundingClientRect().top + scrollY + el.offsetHeight / 2, x: typeof x === 'function' ? x(innerWidth) : x, y, r, g };
    });
  }

  function at(s) {
    const K = marks;
    if (!K.length) return null;
    if (s <= K[0].mid) return K[0];
    if (s >= K[K.length - 1].mid) return K[K.length - 1];
    let i = 0;
    while (i < K.length - 2 && s > K[i + 1].mid) i++;
    const a = K[i], b = K[i + 1], t = smooth((s - a.mid) / Math.max(1, b.mid - a.mid));
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t };
  }

  function apply() {
    queued = 0;
    const p = at(scrollY + innerHeight / 2);
    if (!p || !window.Core || typeof Core.pose !== 'function') return;
    const W = innerWidth, H = innerHeight, small = W < 600;
    Core.pose({ x: W * p.x, y: H * p.y, r: Math.min(W, H) * p.r * (small ? 1.5 : 1), gain: p.g });
  }

  function schedule() { if (!queued) queued = requestAnimationFrame(apply); }

  function start() {
    if (!window.Core || typeof Core.pose !== 'function') return;
    measure();
    if (mq.matches) { Core.pose(null); return; }
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', () => { measure(); schedule(); });
    if (window.ResizeObserver) new ResizeObserver(() => { measure(); schedule(); }).observe(document.body);
    apply();
  }

  addEventListener('load', () => {
    const s = document.createElement('script');
    s.src = '/core/core-scene.js?v=2';
    s.onload = start;
    document.body.appendChild(s);
  });
})();
