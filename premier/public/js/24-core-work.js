// Premier — клиент: всё, что делает и отдаёт ИИ, в системе Core (редизайн, шаг 4). Один файл для RU и EN.
// Здесь нет ни логики чата, ни текстов интерфейса: скрипт только оформляет то, что уже есть на странице.
//   • делитель между чатом и окном результата (мышь, палец, клавиатура; ширина запоминается);
//   • рождение окна результата из точки, где стоит Ядро, и искра при закрытии;
//   • стрелки на вкладках окна; состояние «скопировано»; клавиатура в окнах «Папка» и «Компьютер»;
//   • переключатель «чат / результат» на телефоне (подписи — название чата и название результата);
//   • палитра терминала при смене темы.
// Подключается последним, с defer: к этому моменту готовы CoreUI, Core и все скрипты чата.
(function coreWork() {
  'use strict';
  var doc = document, root = doc.documentElement;
  var byId = function (id) { return doc.getElementById(id); };
  var pane = byId('pane'), grip = byId('paneGrip'), inner = pane && pane.querySelector('.pane-in');
  if (!pane || !inner) return;
  var KEY = 'premier:pane-w', MIN = 320, CHAT_MIN = 360;
  var still = function () { return root.getAttribute('data-core-motion') === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };

  /* ---------- делитель ---------- */
  function limits() {
    var side = byId('side'), left = side && !side.classList.contains('closed') ? side.getBoundingClientRect().right : 0;
    return { min: MIN, max: Math.max(MIN, Math.round(innerWidth - left - CHAT_MIN)) };
  }
  function width() { return Math.round(pane.getBoundingClientRect().width); }
  function aria() {
    if (!grip) return; var l = limits();
    grip.setAttribute('aria-valuemin', l.min); grip.setAttribute('aria-valuemax', l.max); grip.setAttribute('aria-valuenow', Math.min(l.max, Math.max(l.min, width() || l.min)));
  }
  function setWidth(w, keep) {
    var l = limits(); w = Math.min(l.max, Math.max(l.min, Math.round(w)));
    pane.style.setProperty('--work-pane', w + 'px');
    if (keep) { try { localStorage.setItem(KEY, String(w)); } catch (e) {} }
    aria(); return w;
  }
  function resetWidth() { pane.style.removeProperty('--work-pane'); try { localStorage.removeItem(KEY); } catch (e) {} aria(); }
  try { var saved = +localStorage.getItem(KEY); if (saved >= MIN) pane.style.setProperty('--work-pane', saved + 'px'); } catch (e) {}
  if (grip) {
    var drag = null, queued = false;
    var sizing = function (on) { pane.classList.toggle('is-sizing', on); root.classList.toggle('is-sizing', on); };
    grip.addEventListener('pointerdown', function (e) {
      if (e.button) return; e.preventDefault();
      drag = { x: e.clientX, w: width(), now: 0 }; sizing(true);
      try { grip.setPointerCapture(e.pointerId); } catch (er) {}
    });
    grip.addEventListener('pointermove', function (e) {
      if (!drag) return; drag.now = drag.w + (drag.x - e.clientX);
      if (queued) return; queued = true;
      raf(function () { queued = false; if (drag) setWidth(drag.now); }); // не чаще раза за кадр: внутри живёт страница результата
    });
    var drop = function (e) { if (!drag) return; var w = drag.now || drag.w; drag = null; sizing(false); setWidth(w, true); try { grip.releasePointerCapture(e.pointerId); } catch (er) {} };
    grip.addEventListener('pointerup', drop); grip.addEventListener('pointercancel', drop); grip.addEventListener('lostpointercapture', drop);
    grip.addEventListener('dblclick', resetWidth);
    grip.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 96 : 24, l = limits(), k = e.key;
      if (k === 'ArrowLeft') setWidth(width() + step, true); else if (k === 'ArrowRight') setWidth(width() - step, true);
      else if (k === 'Home') setWidth(l.max, true); else if (k === 'End') setWidth(l.min, true); else if (k === 'Enter') resetWidth(); else return;
      e.preventDefault();
    });
    addEventListener('resize', aria);
  }

  /* ---------- рождение из Ядра и искра при закрытии ---------- */
  function corePoint() {
    var l = window.CoreUI && CoreUI.light && CoreUI.light.get ? CoreUI.light.get() : null;
    var x = l && isFinite(l.x) ? +l.x : 50, y = l && isFinite(l.y) ? +l.y : 100;
    return { x: Math.min(100, Math.max(0, x)) / 100 * innerWidth, y: Math.min(100, Math.max(0, y)) / 100 * innerHeight };
  }
  function aim() {
    var r = pane.getBoundingClientRect(), p = corePoint(), gap = grip ? grip.offsetWidth : 0;
    inner.style.setProperty('--work-ox', Math.round(p.x - r.left - gap) + 'px'); inner.style.setProperty('--work-oy', Math.round(p.y - r.top) + 'px');
    return p;
  }
  function spark(p) {
    if (still()) return;
    var g = doc.createElement('i'); g.className = 'core-glint'; g.setAttribute('aria-hidden', 'true');
    g.style.left = Math.min(innerWidth - 14, Math.max(14, p.x)) + 'px'; g.style.top = Math.min(innerHeight - 14, Math.max(14, p.y)) + 'px';
    doc.body.appendChild(g); setTimeout(function () { g.remove(); }, 400);
  }
  var wasOpen = pane.classList.contains('on');
  new MutationObserver(function () {
    var open = pane.classList.contains('on'); if (open === wasOpen) return; wasOpen = open;
    var p = aim(); if (!open) spark(p); else aria();
    syncSoon();
  }).observe(pane, { attributes: true, attributeFilter: ['class'] });

  /* ---------- вкладки окна: стрелки, Home, End ---------- */
  var tabs = pane.querySelector('.tabs');
  if (tabs) tabs.addEventListener('keydown', function (e) {
    var list = [].slice.call(tabs.querySelectorAll('button[data-tab]')), i = list.indexOf(doc.activeElement), k = e.key; if (i < 0) return;
    var j = k === 'ArrowRight' ? (i + 1) % list.length : k === 'ArrowLeft' ? (i + list.length - 1) % list.length : k === 'Home' ? 0 : k === 'End' ? list.length - 1 : -1;
    if (j < 0) return; e.preventDefault(); list[j].focus(); list[j].click();
  });

  /* ---------- «скопировано»: кнопка на миг получает отметку (текст меняет сам чат) ---------- */
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copycode],[data-pubcopy]'); if (!b) return;
    b.setAttribute('data-done', ''); setTimeout(function () { b.removeAttribute('data-done'); }, 1400);
  });

  /* ---------- окна «Папка» и «Компьютер»: фокус внутрь при открытии, Esc закрывает и возвращает фокус ---------- */
  var brow = doc.querySelector('.brow');
  var opener = function (m) { var b = byId(m.id === 'fsMenu' ? 'fsBtn' : 'agBtn'); return b && b.offsetParent ? b : byId('toolsBtn') || b; }; // выключенный режим живёт в меню «+»
  if (brow) {
    new MutationObserver(function (list) {
      list.forEach(function (rec) { [].forEach.call(rec.addedNodes, function (n) {
        if (n.nodeType !== 1 || !n.classList.contains('fsmenu')) return;
        var b = byId(n.id === 'fsMenu' ? 'fsBtn' : 'agBtn'), name = b && (b.getAttribute('aria-label') || b.textContent.trim());
        n.setAttribute('role', 'group'); if (name) n.setAttribute('aria-label', name);
        // открыли с клавиатуры (кнопкой режима или пунктом меню «+») — фокус переходит в окно; мышью — остаётся где был
        setTimeout(function () {
          var a = doc.activeElement, first = n.querySelector('button,input');
          if (first && n.isConnected && a && a.matches && a.matches(':focus-visible') && brow.contains(a) && !n.contains(a)) first.focus();
        }, 60);
      }); });
    }).observe(brow, { childList: true });
    doc.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return; var m = brow.querySelector('.fsmenu'); if (!m) return;
      // Esc уже забрал слой выше (капсула подтверждения, открытая из этого меню) — меню остаётся, как при системном confirm
      if (e.defaultPrevented || doc.querySelector('.core-capsule:not([data-core-state=closing])')) return;
      var inside = m.contains(doc.activeElement), b = opener(m); m.remove(); if (inside && b) b.focus();
    });
  }

  /* ---------- телефон: переключатель «чат / результат» ---------- */
  var top = doc.querySelector('.top'), crumb = byId('crumb'), col = byId('col'), head = pane.querySelector('.phead'), ptitle = byId('ptitle');
  var CHAT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/></svg>';
  function makeSwitch() {
    var d = doc.createElement('div'); d.className = 'view-sw'; d.setAttribute('role', 'group'); d.hidden = true;
    d.innerHTML = '<button type="button" data-view="chat" aria-pressed="false">' + CHAT + '<span></span></button><button type="button" data-view="result" aria-pressed="false"><svg aria-hidden="true"><use href="#i-globe"/></svg><span></span></button>';
    return d;
  }
  var swTop = top && crumb ? makeSwitch() : null, swPane = head ? makeSwitch() : null;
  if (swTop) crumb.after(swTop);
  if (swPane) head.prepend(swPane);
  var lastCard = function () { var a = col ? col.querySelectorAll('[data-art]') : []; return a.length ? a[a.length - 1] : null; };
  function sync() {
    var open = pane.classList.contains('on'), card = lastCard(), b = crumb && crumb.querySelector('b');
    var chat = ((b || crumb || {}).textContent || '').trim() || doc.title;
    var box = card && card.closest('.art,.pack'), t = box && box.querySelector('.art-t b');
    var result = open && ptitle ? ptitle.textContent.trim() : t ? t.textContent.trim() : ptitle ? ptitle.textContent.trim() : '';
    [swTop, swPane].forEach(function (sw) {
      if (!sw) return; var show = sw === swPane ? open : !!card && !open;
      if (sw.hidden === show) sw.hidden = !show;
      var bs = sw.querySelectorAll('button'), set = function (el, text, on) { var s = el.querySelector('span'); if (s.textContent !== text) s.textContent = text; if (el.getAttribute('aria-pressed') !== String(on)) el.setAttribute('aria-pressed', String(on)); };
      set(bs[0], chat, !open); set(bs[1], result, open);
    });
    if (top) top.classList.toggle('has-sw', !!swTop && !swTop.hidden);
    pane.classList.toggle('has-sw', !!swPane);
  }
  var syncT = 0;
  function syncSoon() { if (syncT) return; syncT = setTimeout(function () { syncT = 0; sync(); }, 120); }
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.view-sw button'); if (!b) return;
    var open = pane.classList.contains('on');
    if (b.dataset.view === 'chat' && open) { var x = byId('pClose'); if (x) x.click(); }
    else if (b.dataset.view === 'result' && !open) { var c = lastCard(); if (c) c.click(); }
  });
  if (col) new MutationObserver(syncSoon).observe(col, { childList: true });
  if (crumb) new MutationObserver(syncSoon).observe(crumb, { childList: true, characterData: true, subtree: true });
  if (ptitle) new MutationObserver(syncSoon).observe(ptitle, { childList: true, characterData: true });
  sync(); aria();

  /* ---------- терминал: палитра из токенов следует за темой ---------- */
  function retheme() {
    try { if (typeof CLX !== 'undefined' && CLX.term && typeof clTheme === 'function') CLX.term.options.theme = clTheme(); } catch (e) {}
  }
  new MutationObserver(retheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  try { matchMedia('(prefers-color-scheme: light)').addEventListener('change', retheme); } catch (e) {}
})();
