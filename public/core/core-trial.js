// Premier · страница пробного периода: Ядро стоит сбоку от единственного листа (редизайн, шаг 6).
// Сцена грузится после события load. Место задаётся один раз и при изменении размера окна; движения за прокруткой нет.
(() => {
  'use strict';
  function place() {
    if (!window.Core || typeof Core.pose !== 'function') return;
    const W = innerWidth, H = innerHeight;
    if (W >= 960) Core.pose({ x: W * 0.84, y: H * 0.28, r: Math.min(W, H) * 0.34, gain: 1 });
    else Core.pose({ x: W * 0.9, y: H * 0.03, r: Math.min(W, H) * 0.3, gain: 0.9 });
  }
  const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));
  addEventListener('load', () => idle(() => {
    const s = document.createElement('script');
    s.src = '/core/core-scene.js?v=3';
    s.onload = () => { place(); addEventListener('resize', place); };
    document.body.appendChild(s);
  }));
})();
