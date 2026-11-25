// Premier · лендинг: полёт Ядра за прокруткой, демонстрация, свет на стекле (редизайн, шаг 6).
// Сцена грузится в свободное время после load: текст и кнопки видны раньше неё, раскладка от неё не зависит.
// Core.pose() задаёт место, размер и угол поворота прямо, без пружин, поэтому Ядро точно повторяет положение
// прокрутки; между разделами — сглаживание smoothstep. Прокрутка остаётся у посетителя: скрипт её только читает.
// При «уменьшить движение» полёта нет: Ядро стоит на месте первого экрана.
(() => {
  'use strict';
  const root = document.documentElement, mq = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => mq.matches || root.dataset.coreMotion === 'reduce';
  const $ = (id) => document.getElementById(id);
  // раздел: x, y (доли окна), радиус (доля меньшей стороны), яркость, поворот и наклон (радианы).
  // Каждый раздел встречает Ядро со своей стороны, на своём расстоянии и под своим углом.
  const WIDE = [
    ['.hero', 0.77, 0.36, 0.3, 1, 0, 0],
    ['#features', 0.04, 0.52, 0.36, 0.8, 1.1, 0.3],
    ['#pricing', 0.97, 0.44, 0.4, 0.75, 2.3, -0.24],
    ['#reviews', 0.5, 1.04, 0.56, 0.7, 3.3, 0.5],
    ['#faq', 0.03, 0.34, 0.32, 0.7, 4.3, -0.16],
    ['.final', 0.5, 0.5, 0.46, 1, 5.4, 0],
  ];
  // телефон: панели непрозрачные, Ядро видно над первым экраном и в просветах — путь проще и тише
  const NARROW = [
    ['.hero', 0.8, 0.09, 0.26, 1, 0, 0],
    ['#features', 0.08, 0.5, 0.5, 0.7, 1.1, 0.3],
    ['#pricing', 0.92, 0.5, 0.5, 0.65, 2.3, -0.24],
    ['#reviews', 0.5, 0.96, 0.6, 0.6, 3.3, 0.5],
    ['#faq', 0.08, 0.4, 0.5, 0.6, 4.3, -0.16],
    ['.final', 0.5, 0.5, 0.6, 0.9, 5.4, 0],
  ];
  let marks = [], queued = 0, glass = [], lx = -99, ly = -99, lt = 0;
  const smooth = (t) => t * t * (3 - 2 * t);
  const mixv = (a, b, t) => a + (b - a) * t;

  function measure() {
    const keys = innerWidth >= 960 ? WIDE : NARROW;
    marks = keys.filter(([sel]) => document.querySelector(sel)).map(([sel, x, y, r, g, turn, tilt]) => {
      const el = document.querySelector(sel);
      return { mid: el.getBoundingClientRect().top + scrollY + el.offsetHeight / 2, x, y, r, g, turn, tilt };
    });
    // первый экран считается от верха страницы: пока посетитель не прокрутил, Ядро стоит на своём месте
    if (marks.length) marks[0].mid = innerHeight / 2;
  }

  function at(s) {
    const K = marks;
    if (!K.length) return null;
    if (s <= K[0].mid) return K[0];
    if (s >= K[K.length - 1].mid) return K[K.length - 1];
    let i = 0;
    while (i < K.length - 2 && s > K[i + 1].mid) i++;
    const a = K[i], b = K[i + 1], t = smooth((s - a.mid) / Math.max(1, b.mid - a.mid));
    return { x: mixv(a.x, b.x, t), y: mixv(a.y, b.y, t), r: mixv(a.r, b.r, t), g: mixv(a.g, b.g, t), turn: mixv(a.turn, b.turn, t), tilt: mixv(a.tilt, b.tilt, t) };
  }

  // кромки стекла светятся со стороны Ядра: значения пишутся только на сами поверхности и не чаще 8 раз в секунду
  function light(xp, yp, now) {
    if (now - lt < 120 || (Math.abs(xp - lx) < 2 && Math.abs(yp - ly) < 2)) return;
    lt = now; lx = xp; ly = yp;
    for (const el of glass) { el.style.setProperty('--core-x', xp.toFixed(0)); el.style.setProperty('--core-y', yp.toFixed(0)); }
  }

  // телефон и сенсорные экраны: место обновляется вдвое реже (30 раз в секунду), чтобы сцена не перерисовывалась
  // на каждом кадре прокрутки; Ядро по-прежнему привязано к положению прокрутки
  const calm = () => innerWidth < 960 || matchMedia('(pointer: coarse)').matches;
  let lastPose = 0;
  function apply(now) {
    queued = 0;
    if (now && calm() && now - lastPose < 30) return schedule();
    lastPose = now || 0;
    const p = at(scrollY + innerHeight / 2);
    if (!p || !window.Core || typeof Core.pose !== 'function') return;
    const W = innerWidth, H = innerHeight;
    Core.pose({ x: W * p.x, y: H * p.y, r: Math.min(W, H) * p.r, gain: p.g, turn: p.turn, tilt: p.tilt });
    light(p.x * 100, p.y * 100, performance.now());
  }
  function schedule() { if (!queued) queued = requestAnimationFrame(apply); }

  // демонстрация: запрос → Ядро думает → результат появляется в раме
  function demo() {
    const box = $('siteBox'), fr = $('siteFrame'), inp = $('dInput');
    if (!box || !fr) return;
    const state = (name) => { if (window.Core && Core.state && !still()) Core.state(name); };
    let last = fr.src, pending = false, timer = 0;
    const done = () => { clearTimeout(timer); pending = false; box.classList.add('ready'); state('answering'); timer = setTimeout(() => state('rest'), 900); };
    document.querySelectorAll('#demoTabs button').forEach((b) => b.addEventListener('click', () => {
      if (fr.src === last) return;   // та же вкладка: пример не менялся
      last = fr.src; pending = true; clearTimeout(timer);
      box.classList.remove('ready'); state('thinking');
      timer = setTimeout(done, 6000);   // пример не ответил — рама не остаётся в ожидании
    }));
    fr.addEventListener('load', () => { if (pending) done(); });
    if (inp) {
      inp.addEventListener('focus', () => { if (!pending) state('listening'); });
      inp.addEventListener('blur', () => { if (!pending) state('rest'); });
    }
  }

  function start() {
    if (!window.Core || typeof Core.pose !== 'function') return;
    glass = [...document.querySelectorAll('.core-glass, .core-scene')];
    measure();
    demo();
    if (still()) {   // неподвижная, собранная страница: Ядро на месте первого экрана
      const k = marks[0];
      if (k) { Core.pose({ x: innerWidth * k.x, y: innerHeight * k.y, r: Math.min(innerWidth, innerHeight) * k.r, gain: k.g }); light(k.x * 100, k.y * 100, performance.now()); }
      return;
    }
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', () => { measure(); lt = 0; schedule(); });
    if (window.ResizeObserver) new ResizeObserver(() => { measure(); schedule(); }).observe(document.body);
    apply();
  }

  const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));
  addEventListener('load', () => idle(() => {
    const s = document.createElement('script');
    s.src = '/core/core-scene.js?v=4';
    s.onload = () => { root.classList.add('core-live'); start(); };
    document.body.appendChild(s);
  }));
})();
