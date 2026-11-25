// Premier · вход: Ядро в центре экрана; при успешном входе камера коротко влетает в Ядро, затем открывается чат
// (редизайн, шаг 6). Полёт ~420 мс, запасной таймер 900 мс. При «уменьшить движение» или без сцены — сразу переход.
(() => {
  'use strict';
  const root = document.documentElement, mq = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => mq.matches || root.dataset.coreMotion === 'reduce';
  let fired = false;

  function place() {
    if (!window.Core || typeof Core.pose !== 'function') return;
    const W = innerWidth, H = innerHeight;
    Core.pose({ x: W * 0.5, y: H * 0.5, r: Math.min(W, H) * 0.42, gain: 0.95 });
    // кромки стекла светятся со стороны Ядра: оно за центром экрана
    document.querySelectorAll('.core-glass, .core-scene').forEach((el) => { el.style.setProperty('--core-x', '50'); el.style.setProperty('--core-y', '50'); });
  }

  // done() вызывается один раз: после полёта или сразу
  window.premierFly = function (done) {
    const finish = () => { if (fired) return; fired = true; done(); };
    if (still() || !window.Core || typeof Core.pose !== 'function') return finish();
    document.body.classList.add('flying');
    const W = innerWidth, H = innerHeight, r0 = Math.min(W, H) * 0.42, t0 = performance.now(), D = 420;
    setTimeout(finish, 900);
    const step = (now) => {
      const t = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - t, 3);
      Core.pose({ x: W * 0.5, y: H * 0.5, r: r0 * (1 + 1.8 * e), gain: 0.95 + 0.6 * e, turn: 0.5 * e });
      if (t < 1) requestAnimationFrame(step); else finish();
    };
    requestAnimationFrame(step);
  };

  const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));
  addEventListener('load', () => idle(() => {
    const s = document.createElement('script');
    s.src = '/core/core-scene.js?v=4';
    s.onload = () => { place(); addEventListener('resize', place); };
    document.body.appendChild(s);
  }));
})();
