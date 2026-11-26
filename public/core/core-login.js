// Premier · вход: Ядро в центре экрана; при успешном входе камера коротко влетает в Ядро, затем открывается чат
// (редизайн, шаг 6). Полёт ~420 мс, запасной таймер 900 мс. При «уменьшить движение» или без сцены — сразу переход.
(() => {
  'use strict';
  const root = document.documentElement, mq = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => mq.matches || root.dataset.coreMotion === 'reduce';
  let fired = false;

  // Ядро заполняет экран. Две колонки: оно между плитами. Одна колонка (телефон): плита закрывает середину,
  // поэтому Ядро больше экрана — его видно вокруг плиты, а не только сквозь неё.
  const rest = () => {
    const W = innerWidth, H = innerHeight;
    return { x: W * 0.5, y: H * 0.5, r: W <= 860 ? Math.max(W, H) * 0.55 : Math.min(W, H) * 0.42 };
  };
  function place() {
    if (!window.Core || typeof Core.pose !== 'function') return;
    const k = rest();
    Core.pose({ x: k.x, y: k.y, r: k.r, gain: 0.95 });
    // кромки стекла светятся со стороны Ядра: оно за центром экрана
    document.querySelectorAll('.core-glass, .core-scene').forEach((el) => { el.style.setProperty('--core-x', '50'); el.style.setProperty('--core-y', '50'); });
  }

  // done() вызывается один раз: после полёта или сразу
  window.premierFly = function (done) {
    const finish = () => { if (fired) return; fired = true; done(); };
    if (still() || !window.Core || typeof Core.pose !== 'function') return finish();
    document.body.classList.add('flying');
    const k = rest(), t0 = performance.now(), D = 420;
    setTimeout(finish, 900);
    const step = (now) => {
      const t = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - t, 3);
      Core.pose({ x: k.x, y: k.y, r: k.r * (1 + 1.8 * e), gain: 0.95 + 0.6 * e, turn: 0.5 * e });
      if (t < 1) requestAnimationFrame(step); else finish();
    };
    requestAnimationFrame(step);
  };

  const scene = () => {
    const s = document.createElement('script');
    s.src = '/core/core-scene.js?v=4';
    s.onload = () => { root.classList.add('core-live'); place(); addEventListener('resize', place); };
    document.body.appendChild(s);
  };
  const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));
  // Вход через Google или GitHub уже выполнен (сервер вернул на /login?in=1, страница задала premierIn): ждать нечего,
  // сцена грузится сразу. Полёт начинается, когда Ядро нарисовано (событие core:scene, ready) и его успели увидеть.
  // Чат открывается без полёта, если движение уменьшено, устройство запомнено как слабое, 3D нет или Ядро
  // не появилось за 700 мс от начала загрузки: посетитель уже ждал, задерживать его дальше незачем.
  const arrive = window.premierIn, LIMIT = 700;
  if (typeof arrive === 'function') {
    let gone = false, weak = false;
    const go = () => { if (!gone) { gone = true; arrive(); } };
    try { weak = /^still:/.test(localStorage.getItem('core-q') || ''); } catch (e) {}
    if (still() || weak) go();
    else {
      const late = setTimeout(go, LIMIT);
      root.addEventListener('core:scene', (e) => {
        const d = e.detail || {};
        if (gone || d.mode === 'boot') return;
        if (d.mode !== 'live' || performance.now() > LIMIT) return go();   // таймер мог не успеть, пока сцена запускалась
        if (d.type === 'ready') { clearTimeout(late); setTimeout(() => window.premierFly(go), 120); }
      });
      scene();
    }
  } else addEventListener('load', () => idle(() => scene()));
})();
