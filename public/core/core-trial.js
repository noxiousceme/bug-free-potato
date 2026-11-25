// Premier · страница пробного периода: крупный план — Ядро стоит прямо за плитой предложения (редизайн, шаг 6).
// Сцена грузится в свободное время после load. Место задаётся один раз и при изменении размера окна;
// за прокруткой Ядро не движется: панели разделов проходят над ним.
(() => {
  'use strict';
  function place() {
    if (!window.Core || typeof Core.pose !== 'function') return;
    const W = innerWidth, H = innerHeight, wide = W >= 960;
    const x = wide ? 0.63 : 0.5, y = wide ? 0.36 : 0.3, r = wide ? 0.5 : 0.62;
    Core.pose({ x: W * x, y: H * y, r: Math.min(W, H) * r, gain: 0.9, turn: 0.6, tilt: 0.18 });
    // кромки стекла светятся со стороны Ядра
    document.querySelectorAll('.core-glass, .core-scene').forEach((el) => { el.style.setProperty('--core-x', String(Math.round(x * 100))); el.style.setProperty('--core-y', String(Math.round(y * 100))); });
  }
  const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));
  addEventListener('load', () => idle(() => {
    const s = document.createElement('script');
    s.src = '/core/core-scene.js?v=4';
    s.onload = () => { place(); addEventListener('resize', place); };
    document.body.appendChild(s);
  }));
})();
