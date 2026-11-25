// Баннер объявления и техработ в чате (настраивается в панели: Объявления). Не влияет на раскладку страницы.
(function () {
  'use strict';
  var KEY = 'premier:announce:closed';
  var COLORS = { info: ['#EAF1FF', '#1A3E8C', '#2F6FE4'], warn: ['#FFF4D6', '#5C4300', '#C98A00'], success: ['#E3F6EC', '#13492F', '#2F9E6B'], promo: ['#E8590C', '#1A1714', '#1A1714'], maint: ['#FFE9E6', '#6B1A12', '#D64545'] };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function show(kind, text, link, linkText, closable, id) {
    var c = COLORS[kind] || COLORS.info, el = document.createElement('div'), core = document.documentElement.classList.contains('core'), en = document.documentElement.lang === 'en';
    el.setAttribute('role', 'status');
    var safeLink = link && (/^\/(?!\/)/.test(link) || /^https?:\/\//i.test(link)) ? link : '';
    if (core) {   // система Core: ближнее стекло, род сообщения — знаком слева (стили — core/core-dialogs.css)
      el.className = 'ann core-glass core-glass--near'; el.dataset.kind = COLORS[kind] ? kind : 'info'; el.dataset.coreAt = 'top';
      el.innerHTML = '<i class="ann-mark" aria-hidden="true"></i><span class="ann-tx">' + esc(text) + (safeLink ? ' <a href="' + esc(safeLink) + '"' + (/^https?:/i.test(safeLink) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(linkText || (en ? 'Learn more' : 'Подробнее')) + ' →</a>' : '') + '</span>' +
        (closable ? '<button type="button" class="core-btn core-btn--icon core-btn--quiet core-btn--sm ann-x" aria-label="' + (en ? 'Close' : 'Закрыть') + '"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' : '');
      if (closable) el.querySelector('button').onclick = function () { try { if (id) localStorage.setItem(KEY, id); } catch (e) {} el.remove(); };
      document.body.appendChild(el); return;
    }
    el.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483000;max-width:min(720px,calc(100vw - 24px));display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:14px;font:500 14px/1.45 Onest,-apple-system,"Segoe UI",Roboto,sans-serif;box-shadow:0 12px 40px -12px rgba(0,0,0,.35);background:' + c[0] + ';color:' + c[1] + ';border:1px solid ' + c[2] + '33;animation:pAnn .3s ease both';
    el.innerHTML = '<span style="flex:1;min-width:0">' + esc(text) + (safeLink ? ' <a href="' + esc(safeLink) + '" style="color:inherit;font-weight:700;white-space:nowrap"' + (/^https?:/i.test(safeLink) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(linkText || (document.documentElement.lang === 'en' ? 'Learn more' : 'Подробнее')) + ' →</a>' : '') + '</span>' +
      (closable ? '<button type="button" aria-label="Close" style="all:unset;cursor:pointer;width:24px;height:24px;display:grid;place-items:center;border-radius:6px;opacity:.7;font-size:18px;line-height:1">×</button>' : '');
    if (closable) el.querySelector('button').onclick = function () { try { if (id) localStorage.setItem(KEY, id); } catch (e) {} el.remove(); };
    document.body.appendChild(el);
  }
  function run() {
    if (!document.documentElement.classList.contains('core')) { var st = document.createElement('style'); st.textContent = '@keyframes pAnn{from{opacity:0;transform:translate(-50%,-8px)}}'; document.head.appendChild(st); }
    fetch('/api/config', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (c) {
      if (c.maintenance) return show('maint', c.maintenance.text, '', '', true, '');
      var a = c.announce; if (!a || !a.text) return;
      var closed = ''; try { closed = localStorage.getItem(KEY) || ''; } catch (e) {}
      if (a.dismissible && closed === a.id) return;
      show(a.level, a.text, a.link, a.linkText, a.dismissible, a.id);
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
