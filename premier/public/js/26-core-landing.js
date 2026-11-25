/* Premier · Core — длинные публичные страницы: полёт камеры по прокрутке, демонстрация на первом экране,
   связь системного окна со сценой (редизайн, шаг 6). Описание: /CORE-DESIGN-SYSTEM.md, раздел 16.
   Без текстов и без логики страницы — один файл для RU и EN. Подключается с defer после core-ui.js и core-scene.js.

   Полёт. У секции — «станция»: data-flight="x y size yaw pitch" (x, y — % окна, size — радиус Ядра в долях меньшей
   стороны, углы в радианах); data-flight-phone — то же для телефона; data-flight-through="k" — на пути к этой станции
   камера проходит сквозь Ядро. Поза — функция положения прокрутки и только его: нет привязки, нет ожидания анимации.
   Прокруткой управляет посетитель; скрипт лишь читает scrollY и раз в кадр передаёт позу в Core.flight(). */
(function () {
  'use strict';
  var win = window, doc = document, root = doc.documentElement, Core = win.Core, UI = win.CoreUI;
  if (!win.matchMedia) return;
  var mqReduce = win.matchMedia('(prefers-reduced-motion: reduce)'), mqPhone = win.matchMedia('(max-width: 860px), (pointer: coarse)');
  function reduced() { return mqReduce.matches || root.getAttribute('data-core-motion') === 'reduce'; }
  function on(mq, f) { if (mq.addEventListener) mq.addEventListener('change', f); else if (mq.addListener) mq.addListener(f); }
  function raf(f) { return win.requestAnimationFrame(f); }

  /* ── 1. Стекло. Размытие под движущимся Ядром пересчитывается на каждом его кадре. На телефоне, на слабой машине
        (ступень качества ниже high) и без видеокарты плиты становятся непрозрачными — механизм системы
        data-core-transparency="reduce": те же грани и тени, цвет --core-solid-*. Метка data-site-soft: поставил скрипт. ── */
  function soft(need) {
    if (need) { if (root.getAttribute('data-core-transparency') !== 'reduce') { root.setAttribute('data-core-transparency', 'reduce'); root.setAttribute('data-site-soft', ''); } }
    else if (root.hasAttribute('data-site-soft')) { root.removeAttribute('data-core-transparency'); root.removeAttribute('data-site-soft'); }
  }
  function glass() {
    var i = Core && Core.info ? Core.info() : null, weak = mqPhone.matches;
    if (i && i.mode === 'glow' && (i.reason === 'no-webgl' || i.reason === 'shader')) weak = true;
    if (i && i.mode === 'live' && i.quality !== 'high') weak = true;
    soft(weak);
  }
  glass(); on(mqPhone, function () { glass(); measure(); });
  root.addEventListener('core:scene', function (e) { var t = e.detail && e.detail.type; if (t === 'mode' || t === 'quality' || t === 'ready') glass(); });

  /* ── 2. Станции и поза ── */
  var stations = [], vh = 0, lastY = -1, ticking = false, active = -1, nav = doc.getElementById('nav');
  function nums(s) { return String(s || '').trim().split(/\s+/).map(Number).filter(function (v) { return isFinite(v); }); }
  function read() {
    var phone = mqPhone.matches, els = doc.querySelectorAll('[data-flight]'), i, el, a, list = [];
    for (i = 0; i < els.length; i++) {
      el = els[i]; if (el.hidden) continue;
      a = nums((phone && el.getAttribute('data-flight-phone')) || el.getAttribute('data-flight'));
      if (a.length < 3) continue;
      list.push({ el: el, x: a[0], y: a[1], size: a[2], yaw: a[3] || 0, pitch: a[4] || 0, through: phone ? 0 : +el.getAttribute('data-flight-through') || 0, at: 0 });
    }
    stations = list;
  }
  // где на прокрутке стоит станция: середина секции в середине окна; первая — в самом верху страницы
  function measure() {
    read(); vh = win.innerHeight;
    var max = Math.max(0, doc.documentElement.scrollHeight - vh), top = win.scrollY, i, s, r, prev = -1;
    for (i = 0; i < stations.length; i++) {
      s = stations[i]; r = s.el.getBoundingClientRect();
      s.at = i === 0 ? 0 : Math.min(max, Math.max(0, r.top + top + r.height / 2 - vh / 2));
      if (s.at <= prev) s.at = prev + 1; prev = s.at;
      // кромки стекла секции светятся с той стороны, где Ядро стоит на её станции: пишется один раз, не по кадрам
      s.el.style.setProperty('--core-x', String(s.x)); s.el.style.setProperty('--core-y', String(s.y));
    }
    lastY = -1; update();
  }
  function pose(y) {
    var n = stations.length, i = 0, a, b, t, e, k, o;
    if (!n) return null;
    while (i < n - 2 && y >= stations[i + 1].at) i++;
    a = stations[i]; b = stations[Math.min(i + 1, n - 1)];
    t = b === a ? 0 : Math.min(1, Math.max(0, (y - a.at) / (b.at - a.at)));
    e = t * t * (3 - 2 * t);
    o = { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, size: a.size + (b.size - a.size) * e, yaw: a.yaw + (b.yaw - a.yaw) * e, pitch: a.pitch + (b.pitch - a.pitch) * e, depth: 0, roll: 0, near: t < 0.5 ? i : Math.min(i + 1, n - 1) };
    if (b.through) {   // сквозь Ядро: на середине пути оно во весь экран, камера внутри облака
      k = Math.pow(Math.sin(Math.PI * t), 2) * b.through;
      o.size *= 1 + 2.1 * k; o.depth = 0.66 * k; o.roll = 0.22 * k * (b.x < a.x ? 1 : -1);
    }
    return o;
  }
  function update() {
    ticking = false;
    var y = win.scrollY, p;
    if (y === lastY) return; lastY = y;
    p = pose(y); if (!p) return;
    if (Core && Core.flight && !reduced()) Core.flight(p);
    if (p.near !== active) {   // шапка видна на всех секциях: её кромка переходит к свету ближайшей станции (раз на секцию)
      active = p.near;
      if (nav) { nav.style.setProperty('--core-x', String(stations[active].x)); nav.style.setProperty('--core-y', String(stations[active].y)); }
    }
  }
  function onScroll() { if (!ticking) { ticking = true; raf(update); } }

  read();
  if (stations.length && Core) {
    // первый кадр сцены — уже на месте первой станции; свет на кромках первого экрана идёт за местом и состоянием
    Core.place({ x: stations[0].x, y: stations[0].y, size: stations[0].size });
    if (UI && UI.light && UI.light.scope) UI.light.scope('#preview, .hero-proof');
  }
  measure();
  win.addEventListener('scroll', onScroll, { passive: true });
  win.addEventListener('resize', function () { raf(measure); });
  win.addEventListener('load', measure);
  if (win.ResizeObserver && doc.body) { var ro = 0; new ResizeObserver(function () { if (!ro) ro = raf(function () { ro = 0; measure(); }); }).observe(doc.body); }
  function motion() { if (reduced()) { if (Core && Core.flight) Core.flight(null); finish(); } else { lastY = -1; update(); } }
  on(mqReduce, motion);
  if (win.MutationObserver) new MutationObserver(motion).observe(root, { attributes: true, attributeFilter: ['data-core-motion'] });

  /* ── 3. Демонстрация: запрос → Ядро думает → ответ течёт в стекло → результат рождается в рамке.
        Шаги — атрибут data-demo у #preview (ask · think · answer · done); вид шагов — в core-landing.css.
        Без скрипта и при «уменьшить движение» демонстрация сразу в готовом виде. ── */
  var demo = doc.getElementById('preview'), tabs = doc.getElementById('demoTabs'), pane = demo && demo.querySelector('.show-prev'), timers = [], seen = false, played = false;
  function clear() { while (timers.length) clearTimeout(timers.pop()); }
  function at(ms, f) { timers.push(setTimeout(f, ms)); }
  function finish() {
    clear(); played = true; root.classList.add('lp-played');
    if (demo && demo.hasAttribute('data-demo')) { demo.removeAttribute('data-demo'); if (Core) Core.target(null).state('rest'); }
  }
  function play() {
    if (!demo) return;
    if (reduced() || !seen || doc.hidden) return finish();
    clear(); played = true;
    demo.setAttribute('data-demo', 'ask'); root.classList.add('lp-played');
    at(420, function () { demo.setAttribute('data-demo', 'think'); if (Core) Core.state('thinking'); });
    at(1650, function () { demo.setAttribute('data-demo', 'answer'); if (Core) Core.set({ state: 'answering', target: pane, ax: 0.5, ay: 0 }); });
    at(2700, function () { demo.setAttribute('data-demo', 'done'); if (Core) Core.target(null).state('rest').pulse('flash'); });
    at(3700, function () { demo.removeAttribute('data-demo'); });
  }
  if (demo) {
    if (tabs) tabs.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('button')) play(); });
    if (win.IntersectionObserver) new IntersectionObserver(function (es) {
      seen = es[es.length - 1].isIntersecting;
      if (!seen && demo.hasAttribute('data-demo')) finish();
    }, { threshold: 0.35 }).observe(demo); else seen = true;
    // первый показ: когда сцена готова (или не будет готова), но не позже 2,5 с — содержимое не ждёт графику
    var first = function () { if (!played) play(); };
    root.addEventListener('core:scene', function (e) { var t = e.detail && e.detail.type; if (t === 'ready' || (t === 'mode' && e.detail.mode === 'glow')) setTimeout(first, 500); });
    setTimeout(first, 2500);
  } else root.classList.add('lp-played');

  /* ── 4. Системное окно (<dialog>, отзыв): пока оно открыто, Ядро отступает и тускнеет, как под окнами Core ── */
  var dlgs = doc.querySelectorAll('dialog'), d;
  function focusScene() {
    var open = !!doc.querySelector('dialog[open]');
    if (open === root.hasAttribute('data-core-focus')) return;
    if (open) root.setAttribute('data-core-focus', ''); else root.removeAttribute('data-core-focus');
    try { root.dispatchEvent(new CustomEvent('core:focus', { detail: { on: open } })); } catch (e) {}
    if (!open) { lastY = -1; onScroll(); }
  }
  if (win.MutationObserver) for (d = 0; d < dlgs.length; d++) new MutationObserver(focusScene).observe(dlgs[d], { attributes: true, attributeFilter: ['open'] });
})();
