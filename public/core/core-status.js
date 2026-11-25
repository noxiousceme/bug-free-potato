// Premier · статус моделей: Ядро в правом верхнем углу, без движения (редизайн, шаг 7).
// Сцена грузится в свободное время после load; данные и подсказки не ждут её.
(() => {
  'use strict';
  function place() {
    if (!window.Core || typeof Core.pose !== 'function') return;
    const W = innerWidth, H = innerHeight;
    if (W >= 960) Core.pose({ x: W * 0.86, y: H * 0.14, r: Math.min(W, H) * 0.24, gain: 0.8 });
    else Core.pose({ x: W * 0.92, y: H * 0.04, r: Math.min(W, H) * 0.22, gain: 0.7 });
  }
  const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));
  addEventListener('load', () => idle(() => {
    const s = document.createElement('script');
    s.src = '/core/core-scene.js?v=3';
    s.onload = () => { place(); addEventListener('resize', place); };
    document.body.appendChild(s);
  }));
})();
