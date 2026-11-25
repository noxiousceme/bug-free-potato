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
  // Путь камеры: Ядро видно целиком → камера входит в облако и идёт сквозь него, каждый раздел под своим углом
  // и на своём расстоянии → выходит и снова видит Ядро целиком над последней плитой. За страницу — полный оборот.
  const WIDE = [
    ['.hero', 0.77, 0.36, 0.3, 1, 0, 0],
    ['#features', 0.5, 0.5, 1.45, 0.85, 1.2, 0.3],
    ['#pricing', 0.5, 0.56, 0.95, 0.8, 2.5, -0.24],
    ['#reviews', 0.5, 0.5, 1.2, 0.8, 3.6, 0.4],
    ['#faq', 0.5, 0.5, 0.72, 0.85, 4.7, -0.16],
    ['.final', 0.5, 0.3, 0.21, 1, 6.2832, 0],
  ];
  // телефон: панели непрозрачные и во всю ширину, Ядро видно над первым экраном, в просветах между разделами
  // и над последней плитой — путь тот же, без смещений в стороны
  const NARROW = [
    ['.hero', 0.5, 0.17, 0.36, 1, 0, 0],
    ['#features', 0.5, 0.5, 1.6, 0.8, 1.2, 0.3],
    ['#pricing', 0.5, 0.5, 1.2, 0.75, 2.5, -0.24],
    ['#reviews', 0.5, 0.5, 1.4, 0.75, 3.6, 0.4],
    ['#faq', 0.5, 0.5, 1, 0.75, 4.7, -0.16],
    ['.final', 0.5, 0.3, 0.27, 1, 6.2832, 0],
  ];
  let marks = [], queued = 0, glass = [], lx = -99, ly = -99, lt = 0;
  const smooth = (t) => t * t * (3 - 2 * t);
  const mixv = (a, b, t) => a + (b - a) * t;

  function measure() {
    const W = innerWidth, H = innerHeight, wide = W >= 960, top = (el) => el.getBoundingClientRect().top + scrollY;
    marks = (wide ? WIDE : NARROW).filter(([sel]) => document.querySelector(sel)).map(([sel, x, y, r, g, turn, tilt]) => {
      const el = document.querySelector(sel);
      return { sel, mid: top(el) + el.offsetHeight / 2, x, y, r, g, turn, tilt };
    });
    if (!marks.length) return;
    // первый экран считается от верха страницы: пока посетитель не прокрутил, Ядро стоит на своём месте
    const first = marks[0], last = marks[marks.length - 1], copy = document.querySelector('.hero-copy'), card = document.querySelector('.final .card');
    first.mid = H / 2;
    if (!wide && copy) first.y = top(copy) / H;   // телефон: Ядро встаёт из-за верхней кромки плиты с заголовком
    if (last.sel === '.final' && card && marks.length > 1) {
      // конец страницы: Ядро целиком в просвете над последней плитой; просвет задан в CSS и здесь только измеряется
      const fin = document.querySelector('.final'), end = Math.max(0, root.scrollHeight - H), band = top(card) - top(fin);
      last.mid = Math.max(marks[marks.length - 2].mid + 1, end + H / 2);   // поза достигается ровно в конце прокрутки
      if (band > 160) { last.y = (top(fin) + band / 2 - end) / H; last.r = Math.min(last.r, band * 0.42 / Math.min(W, H)); }
    }
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
    let last = fr.src, pending = false, timer = 0, asked = 0;
    // результат показывается сразу, как загрузился; Ядро «думает» не меньше 350 мс, чтобы шаг был виден
    const done = () => {
      clearTimeout(timer); pending = false; box.classList.add('ready');
      timer = setTimeout(() => { state('answering'); timer = setTimeout(() => state('rest'), 900); }, Math.max(0, 350 - (performance.now() - asked)));
    };
    document.querySelectorAll('#demoTabs button').forEach((b) => b.addEventListener('click', () => {
      if (fr.src === last) return;   // та же вкладка: пример не менялся
      last = fr.src; pending = true; asked = performance.now(); clearTimeout(timer);
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
