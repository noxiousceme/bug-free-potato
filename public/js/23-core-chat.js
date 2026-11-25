// Premier — клиент: экран чата в системе Core (редизайн, шаг 3). Один файл для русской и английской версии, своих текстов нет.
// Логику чата не трогает и ничего не перерисовывает. Смотрит на уже отрисованную страницу и на общее состояние
// (S, liveMap, MODELS из 01-core.js) и делает четыре вещи:
//   1) переводит происходящее в команды Ядру: печатает → слушает, отправлено → думает, пошёл текст → отвечает,
//      конец/стоп → покой, ошибка → разлёт, другая модель → другая форма, пустой чат ↔ разговор → центр ↔ горизонт;
//   2) сообщает Ядру, где на экране область чата (без боковой панели и окна результата);
//   3) собирает меню «+» из кнопок нижнего ряда поля ввода и показывает включённые режимы;
//   4) следит за шириной поля ввода и за файлами, которые тянут над окном.
// Подключается с defer после /core/core-ui.js и /core/core-scene.js. Без них (или без WebGL) чат работает как обычно.
(function coreChat() {
  'use strict';
  const root = document.documentElement, byId = (id) => document.getElementById(id);
  const main = document.querySelector('.main'), dock = document.querySelector('.dock');
  const col = byId('col'), q = byId('q'), box = byId('form'), send = byId('send');
  if (!main || !dock || !col || !q || !box) return;
  const core = window.Core && typeof window.Core.state === 'function' ? window.Core : null;
  // Свет Ядра нужен только стеклу. Если писать его на <html>, каждая смена состояния Ядра (первая нажатая клавиша,
  // начало ответа) пересчитывала бы стили всей ленты — на сотнях сообщений это заметная задержка.
  if (window.CoreUI && CoreUI.light && CoreUI.light.scope) CoreUI.light.scope('.side, .box-glass, #sugg, .pane-in');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduced = () => root.dataset.coreMotion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const watch = (el, fn, opts) => { if (el) new MutationObserver(fn).observe(el, opts); };
  const CLASS = { attributes: true, attributeFilter: ['class'] };

  /* ---------- Ядро: место, состояние, цель ---------- */
  let phase = 'rest', place = '', lastLive = null, lastModel = '';
  // Пустой чат: Ядро стоит по центру области чата и заметно шире колонки с приветствием и полем ввода —
  // иначе оно целиком пряталось бы за ними. Там, где штатное место «в центре» и так не меньше, берётся оно.
  function centre() {
    const r = main.getBoundingClientRect(), w = innerWidth, h = innerHeight, m = Math.min(w, h);
    const named = Math.max(110, Math.min(330, m * 0.3)), wide = Math.min(box.offsetWidth / 2 + 120, r.width / 2 - 16, h * 0.56);
    if (!r.width || wide < named * 1.15) return 'center';
    return { x: Math.round((r.left + r.width / 2) / w * 1000) / 10, y: 46, size: Math.round(wide / m * 1000) / 1000 };
  }
  function liveMsg() {
    try { const c = cur(), m = c && liveMap.get(c.id); return m && m.live ? m : null; } catch { return null; }
  }
  function sync() {
    if (!core) return;
    const want = main.classList.contains('empty') ? centre() : 'horizon', key = JSON.stringify(want);
    if (key !== place) { place = key; core.place(want); }
    const m = liveMsg();
    if (m) {
      lastLive = m;
      // Поток точек идёт коротким путём: к нижнему краю ответа, который растёт прямо над полем ввода.
      const el = m.t ? col.querySelector('[data-id="' + m.id + '"] .md') : null;
      if (el) { core.set({ state: 'answering', target: el, ax: 0.06, ay: 1 }); phase = 'answering'; }
      else if (phase !== 'thinking') { core.state('thinking'); phase = 'thinking'; }
    } else if (phase !== 'rest') {
      const failed = lastLive && lastLive.err && !lastLive.cancelled;
      phase = 'rest'; lastLive = null;
      core.target(q).state(mic() ? 'listening' : 'rest');
      if (failed) core.pulse('error');
    }
  }
  const mic = () => { const b = byId('micBtn'); return !!b && b.classList.contains('on'); };
  function syncModel() {
    let name = '';
    try { const m = curModel(); name = m ? String(m.name || '') : ''; } catch {}
    if (!name || name === lastModel) return;
    lastModel = name;
    const mini = byId('mcore'); if (mini) mini.dataset.coreModel = name;
    if (core) core.model(name);
    try { localStorage.setItem('premier:core-model', name); } catch {}
  }
  // Форма последней выбранной модели известна до ответа сервера — Ядро появляется сразу в ней, без перетекания из сферы.
  try {
    const saved = localStorage.getItem('premier:core-model');
    if (saved) { lastModel = saved; const mini = byId('mcore'); if (mini) mini.dataset.coreModel = saved; if (core) core.model(saved); }
  } catch {}

  // Область чата на экране: Ядро встаёт по её центру, а не по центру окна.
  let stageT = 0, dockTop = 0;
  function stage() {
    const r = main.getBoundingClientRect();
    dockTop = dock.getBoundingClientRect().top;
    if (core && core.stage) core.stage({ left: Math.max(0, Math.round(r.left)), right: Math.max(0, Math.round(innerWidth - r.right)) });
    sync();
  }
  const stageSoon = () => { clearTimeout(stageT); stageT = setTimeout(stage, 90); };

  // Пустой чат → разговор: поле ввода не прыгает вниз, а съезжает туда же, куда уходит Ядро.
  function glide() {
    const top = dock.getBoundingClientRect().top, dy = dockTop - top;
    dockTop = top;
    if (!dock.animate || reduced() || Math.abs(dy) < 8) return;
    const css = getComputedStyle(root), ms = parseFloat(css.getPropertyValue('--core-dur-4')) || 320;
    dock.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: ms, easing: css.getPropertyValue('--core-ease-out').trim() || 'ease-out' });
  }

  if (core) {
    q.addEventListener('input', () => { if (phase === 'rest') core.target(q); core.pulse('key'); });
    watch(byId('micBtn'), () => { if (phase === 'rest') core.target(q).state(mic() ? 'listening' : 'rest'); }, CLASS);
  }
  watch(col, sync, { childList: true });
  watch(send, sync, CLASS);
  watch(main, () => { sync(); glide(); }, CLASS);
  watch(byId('mname'), syncModel, { childList: true, characterData: true, subtree: true });
  if (window.ResizeObserver) new ResizeObserver(stageSoon).observe(main);
  addEventListener('resize', stageSoon);
  stage(); sync(); syncModel();

  /* ---------- без видеокарты ---------- */
  // Сцена ушла в свечение, потому что 3D недоступно: значит, и размытое стекло считал бы процессор — на каждое
  // изменение под ним. Страница переходит на плотное стекло (штатный режим data-core-transparency="reduce":
  // те же кромки и тени, без размытия), чтобы набор текста и вывод ответа оставались мгновенными.
  if (core) {
    const soft = () => {
      const i = core.info(), hard = i.mode === 'glow' && (i.reason === 'no-webgl' || i.reason === 'shader');
      if (hard && !root.hasAttribute('data-core-transparency')) { root.setAttribute('data-core-transparency', 'reduce'); root.setAttribute('data-chat-soft', ''); }
      else if (i.mode === 'live' && root.hasAttribute('data-chat-soft')) { root.removeAttribute('data-core-transparency'); root.removeAttribute('data-chat-soft'); }
    };
    root.addEventListener('core:scene', (e) => { if (e.detail && (e.detail.type === 'mode' || e.detail.type === 'ready')) soft(); });
    soft();
  }

  /* ---------- поле ввода: ширина и подписи над ним ---------- */
  const meta = dock.querySelector('.dock-meta');
  if (window.ResizeObserver) {
    // узкое поле (телефон, открыто окно результата): включённые режимы показывает сама кнопка «+», имя модели не обрезается
    new ResizeObserver(() => box.classList.toggle('is-narrow', box.clientWidth < 520)).observe(box);
    // высота подписей над полем: до этой линии область чтения закрыта цветом сцены, ниже начинается свет Ядра
    if (meta) new ResizeObserver(() => dock.style.setProperty('--dock-meta', meta.offsetHeight + 'px')).observe(meta);
  }

  /* ---------- меню «+»: всё, что можно приложить и включить ---------- */
  const TOOLS = ['attachBtn', 'webBtn', 'imgBtn', 'fsBtn', 'agBtn'];
  const menu = byId('toolsMenu'), tools = byId('toolsBtn'), lit = byId('toolsOn');
  let sig = '';
  function buildTools() {
    if (!menu || !tools) return;
    let html = '', on = '', sep = false;
    for (const id of TOOLS) {
      const b = byId(id); if (!b || b.hidden) continue;
      const use = b.querySelector('use'), icon = use ? use.getAttribute('href') : '', span = b.querySelector('span');
      const label = (span && span.textContent.trim()) || b.getAttribute('aria-label') || '';
      const toggle = id !== 'attachBtn', pressed = b.getAttribute('aria-pressed') === 'true';
      if (toggle && !sep && html) html += '<hr class="core-menu__sep">';
      if (toggle) sep = true;
      html += '<button type="button" class="core-menu__item" role="' + (toggle ? 'menuitemcheckbox" aria-checked="' + pressed : 'menuitem') + '" data-value="' + id + '"><svg aria-hidden="true"><use href="' + esc(icon) + '"/></svg><span>' + esc(label) + '</span></button>';
      if (toggle && pressed) on += '<svg><use href="' + esc(icon) + '"/></svg>';
    }
    if (html !== sig) { sig = html; menu.innerHTML = html; }
    if (lit && lit.innerHTML !== on) lit.innerHTML = on;
    tools.classList.toggle('has-on', !!on);
  }
  if (menu && tools) {
    menu.addEventListener('core:select', (e) => {
      const b = byId(e.detail && e.detail.value); if (!b) return;
      // выбор файла должен начаться в том же нажатии; остальные кнопки открывают свои окна после того, как закроется меню
      if (b.id === 'attachBtn') b.click(); else setTimeout(() => b.click(), 0);
      setTimeout(() => { sig = ''; buildTools(); }, 60);
    });
    for (const id of TOOLS) watch(byId(id), buildTools, { attributes: true, attributeFilter: ['class', 'hidden', 'aria-pressed'], childList: true, characterData: true, subtree: true });
    buildTools();
  }

  /* ---------- файлы тянут над окном ---------- */
  let drags = 0;
  const files = (e) => !!(e.dataTransfer && e.dataTransfer.types && Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') >= 0);
  const dragOff = () => { drags = 0; root.classList.remove('is-dragging'); };
  addEventListener('dragenter', (e) => { if (files(e)) { drags++; root.classList.add('is-dragging'); } });
  addEventListener('dragleave', () => { if (--drags <= 0) dragOff(); });
  addEventListener('drop', dragOff); addEventListener('dragend', dragOff); addEventListener('blur', dragOff);
})();
