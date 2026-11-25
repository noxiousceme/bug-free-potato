// Premier — клиент: окна и малые элементы чата на системе Core (редизайн, шаг 5).
// Логики чата и текстов здесь нет. Скрипты чата открывают общее окно как раньше — классом on у #modal, —
// а этот файл превращает класс в окно Core: рождение из точки нажатия, отступившее Ядро, фокус внутри окна,
// Esc, возврат фокуса, закрытая прокрутка страницы. Здесь же: смена разделов поворотом грани, выбор плиты
// тарифа и яркость Ядра за окном тарифов, меню моделей с клавиатуры, свет на стекле у меню и карточек,
// высота экранной клавиатуры для листов на телефоне.
(function () {
  'use strict';
  if (!window.CoreUI) return;
  const $ = (id) => document.getElementById(id), root = document.documentElement;
  const still = () => root.dataset.coreMotion === 'reduce' || matchMedia('(prefers-reduced-motion:reduce)').matches;
  const token = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const ms = (name) => { const v = token(name), n = parseFloat(v); return isNaN(n) ? 0 : /ms$/.test(v) ? n : n * 1000; };

  /* ---------- точка рождения: окно может открыться после запроса к серверу, поэтому помним нажатие дольше, чем core-ui.js ---------- */
  let last = null;
  document.addEventListener('pointerdown', (e) => { last = { x: e.clientX, y: e.clientY, t: performance.now() }; }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const a = document.activeElement; if (!a || a === document.body) return;
    const r = a.getBoundingClientRect(); last = { x: r.left + r.width / 2, y: r.top + r.height / 2, t: performance.now() };
  }, true);
  const origin = () => (last && performance.now() - last.t < 6000 ? { x: last.x, y: last.y } : undefined);

  /* ---------- общее окно: класс on у #modal ⇄ CoreUI.dialog ---------- */
  const modal = $('modal'), dlg = modal && modal.querySelector('.dlg'), dbody = $('dbody'), dtitle = $('dtitle');
  if (modal && dlg && dbody) {
    let open = false, closing = null, face = '', paneH = 0;
    const isOn = () => modal.classList.contains('on');
    const faceKey = () => (dtitle ? dtitle.textContent : '') + '|' + dlg.className.replace(/\s*core-dialog__pane\s*/, ' ').trim();
    const show = () => {
      if (open || closing) return;
      open = true; face = faceKey(); delete dlg.dataset.face;
      CoreUI.dialog.open(modal, { origin: origin() });
      paneH = dlg.offsetHeight; plans();
    };
    // Esc, нажатие мимо окна и closePanel() сходятся здесь: класс on — единственный источник правды для скриптов чата
    modal.addEventListener('core:beforeclose', (e) => {
      if (e.target !== modal) return;
      open = false; modal.classList.remove('on');
      closing = new Promise((done) => modal.addEventListener('core:close', done, { once: true }));
      closing.then(() => { closing = null; if (window.Core && Core.lit) Core.lit(0); if (isOn()) show(); });
    });
    const sync = () => { if (isOn()) show(); else if (open) CoreUI.dialog.close(modal); };
    new MutationObserver(sync).observe(modal, { attributes: true, attributeFilter: ['class'] });

    // другое окно в той же плите (тарифы → оплата сброса, лимит → тарифы): грань поворачивается, плита плавно меняет высоту
    const turn = () => {
      if (!open) return;
      const key = faceKey(), h0 = paneH, h1 = dlg.offsetHeight; paneH = h1;
      if (key === face) return;
      face = key;
      if (still()) return;
      dlg.removeAttribute('data-face'); void dlg.offsetWidth; dlg.dataset.face = 'next';
      if (h0 && h1 && Math.abs(h1 - h0) > 2 && dlg.animate) dlg.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: ms('--core-dur-3'), easing: token('--core-ease-move') || 'ease' });
    };
    new MutationObserver(() => { turn(); plans(); }).observe(dbody, { childList: true });
    if (dtitle) new MutationObserver(turn).observe(dtitle, { childList: true, characterData: true, subtree: true });
    if (window.ResizeObserver) new ResizeObserver(() => { if (open && !dlg.getAnimations().some((a) => a.playState === 'running')) paneH = dlg.offsetHeight; }).observe(dlg);

    // разделы настроек аккаунта: следующий раздел приходит снизу, предыдущий — сверху (на телефоне лента разделов горизонтальна — тот же поворот)
    let accAt = -1;
    document.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('.acc-nav [data-acc]'); if (!b) return;
      const list = [...b.parentNode.children], i = list.indexOf(b), body = $('accBody');
      if (body && accAt >= 0 && i !== accAt && !still()) { body.removeAttribute('data-face'); void body.offsetWidth; body.dataset.face = i > accAt ? 'next' : 'prev'; body.scrollTop = 0; }
      accAt = i; b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
    new MutationObserver(() => { const on = dbody.querySelector('.acc-nav .on'); accAt = on ? [...on.parentNode.children].indexOf(on) : -1; }).observe(dbody, { childList: true });

    /* ---------- тарифы: выбранная плита выходит вперёд; чем выше её тариф, тем ярче Ядро за окном ---------- */
    let picked = null;   // индекс выбранной плиты; null — выбор по умолчанию (рекомендованный или текущий тариф)
    function plans() {
      const box = dbody.querySelector('.plans');
      if (!box || !open) { if (!box) picked = null; if (window.Core && Core.lit && !box) Core.lit(0); return; }
      const cards = [...box.children].filter((c) => c.classList.contains('plan'));
      let i = picked;
      if (i == null || !cards[i]) i = cards.findIndex((c) => c.classList.contains('hot'));
      if (i < 0) i = cards.findIndex((c) => c.classList.contains('cur'));
      if (i < 0) i = 0;
      cards.forEach((c, n) => c.classList.toggle('fwd', n === i));
      box.dataset.sel = String(i);
      if (window.Core && Core.lit) Core.lit(cards.length > 1 ? i / (cards.length - 1) : 0);
    }
    const pick = (e) => {
      const card = e.target.closest && e.target.closest('.plans .plan'); if (!card || !dbody.contains(card)) return;
      const i = [...card.parentNode.children].filter((c) => c.classList.contains('plan')).indexOf(card);
      if (i === picked || (picked == null && card.classList.contains('fwd'))) { picked = i; return; }
      picked = i; plans();
    };
    dbody.addEventListener('pointerover', (e) => { if (e.pointerType !== 'touch') pick(e); });
    dbody.addEventListener('focusin', pick);
    dbody.addEventListener('click', pick, true);

    if (isOn()) show();
  }

  /* ---------- меню моделей: клавиатура, место света на стекле ---------- */
  const menu = $('menu'), mbtn = $('mbtn');
  if (menu && mbtn) {
    const opts = () => [...menu.querySelectorAll('button.opt')];
    const place = () => {
      const r = menu.getBoundingClientRect(), w = innerWidth || 1, h = innerHeight || 1;
      menu.style.setProperty('--core-at-x', ((r.left + r.width / 2) / w * 100).toFixed(1));
      menu.style.setProperty('--core-at-y', ((r.top + r.height / 2) / h * 100).toFixed(1));
    };
    let byKey = false;
    mbtn.addEventListener('keydown', (e) => {
      byKey = e.key === 'Enter' || e.key === ' ';
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !menu.classList.contains('open')) { e.preventDefault(); byKey = true; mbtn.click(); }
    });
    mbtn.addEventListener('pointerdown', () => { byKey = false; });
    new MutationObserver(() => {
      const on = menu.classList.contains('open');
      mbtn.setAttribute('aria-expanded', String(on));
      if (!on) return;
      place();
      if (byKey) { const cur = menu.querySelector('button.opt.on') || opts()[0]; if (cur) cur.focus({ preventScroll: true }); }
    }).observe(menu, { attributes: true, attributeFilter: ['class'] });
    menu.addEventListener('keydown', (e) => {
      const list = opts(), i = list.indexOf(document.activeElement); let go = null;
      if (e.key === 'ArrowDown') go = list[(i + 1) % list.length];
      else if (e.key === 'ArrowUp') go = list[(i - 1 + list.length) % list.length];
      else if (e.key === 'Home') go = list[0];
      else if (e.key === 'End') go = list[list.length - 1];
      else if (e.key === 'Escape' || e.key === 'Tab') { if (e.key === 'Escape') e.preventDefault(); menu.classList.remove('open'); mbtn.focus({ preventScroll: true }); return; }
      if (go) { e.preventDefault(); go.focus({ preventScroll: true }); go.scrollIntoView({ block: 'nearest' }); }
    });
    // выбор модели с клавиатуры возвращает фокус на кнопку меню
    menu.addEventListener('click', (e) => { if (e.detail === 0 && e.target.closest('button.opt')) setTimeout(() => mbtn.focus({ preventScroll: true }), 0); });
  }

  /* ---------- картинка в полный размер: окно Core вместо пустой вкладки (вызывает js/09-events.js) ---------- */
  let zoom = null, zoomSrc = '';
  window.premierZoom = (img) => {
    if (!img || !img.src) return;
    if (!zoom) {
      const label = (id) => { const el = $(id); return (el && el.getAttribute('aria-label')) || ''; };   // подписи — те же, что уже есть на странице
      zoom = document.createElement('div'); zoom.className = 'core-dialog zoom'; zoom.id = 'zoomWin'; zoom.hidden = true;
      zoom.innerHTML = '<div class="core-dialog__pane zoom-pane" role="dialog" aria-modal="true" aria-labelledby="zoomName">' +
        '<div class="core-dialog__head zoom-head"><span class="zoom-name" id="zoomName"></span>' +
        '<button type="button" class="core-btn core-btn--icon core-btn--quiet" id="zoomOpen"><svg><use href="#i-ext"/></svg></button>' +
        '<button type="button" class="core-btn core-btn--icon core-btn--quiet" id="zoomClose" data-core-close data-core-tip-key="Esc"><svg><use href="#i-x"/></svg></button></div>' +
        '<div class="zoom-stage"><img id="zoomImg" alt=""></div></div>';
      document.body.appendChild(zoom);
      for (const [id, from] of [['zoomOpen', 'pOpen'], ['zoomClose', 'dclose']]) { const t = label(from); if (t) { $(id).setAttribute('aria-label', t); $(id).dataset.coreTip = t; } }
      // «открыть в новой вкладке» — прежний способ: пустая вкладка с картинкой (адреса data: браузер напрямую не открывает)
      $('zoomOpen').addEventListener('click', () => { const w = window.open(); if (w) w.document.write('<body style="margin:0;background:#111;display:grid;place-items:center;min-height:100vh"><img src="' + zoomSrc + '" style="max-width:100%;max-height:100vh">'); });
      $('zoomImg').addEventListener('click', () => CoreUI.dialog.close(zoom));
    }
    zoomSrc = img.src;
    $('zoomImg').src = img.src; $('zoomImg').alt = img.alt || '';
    $('zoomName').textContent = img.alt || '';
    CoreUI.dialog.open(zoom, { origin: img });
  };

  /* ---------- свет Ядра на новых стеклянных поверхностях вне слоя core-layers (см. раздел 5 описания: light.scope) ---------- */
  if (CoreUI.light && CoreUI.light.scope) {
    const cur = CoreUI.light.scope();
    if (cur && !/#menu/.test(cur)) CoreUI.light.scope(cur + ', #menu, .pwa-card, .ann');
  }

  /* ---------- лист над экранной клавиатурой: там, где браузер не сжимает страницу сам (iOS), поднимаем лист на высоту клавиатуры ---------- */
  const vv = window.visualViewport;
  if (vv) {
    let kb = -1;
    const fit = () => {
      const h = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)), v = h > 80 ? h : 0;
      if (v === kb) return; kb = v;
      document.querySelectorAll('.core-dialog').forEach((d) => d.style.setProperty('--dlg-kb', v + 'px'));
    };
    vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit);
    document.addEventListener('core:open', () => { kb = -1; fit(); });
  }
})();
