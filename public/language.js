'use strict';
(() => {
  const current = document.documentElement.lang === 'en' ? 'en' : 'ru';
  const api = window.PremierLanguage = { current, beforeSwitch: null };
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = 'premier_lang=' + current + '; Path=/; Max-Age=31536000; SameSite=Lax' + secure;
  try { localStorage.setItem('premier:language', current); } catch {}
  let switching = false, noteTimer = 0;
  // Сообщение для страниц без toast и без CoreUI (лендинг, вход): плашка внизу окна, читается экранным диктором,
  // сама исчезает и закрывается по Escape. Цвета — токены Core, запасные значения — для старых страниц.
  function note(message) {
    let el = document.getElementById('language-note');
    if (!el) {
      el = document.createElement('div'); el.id = 'language-note'; el.setAttribute('role', 'alert');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;z-index:3000;transform:translateX(-50%);box-sizing:border-box;max-width:min(92vw,420px);padding:12px 16px;border-radius:14px;background:var(--core-solid-near,#282420);color:var(--core-text,#F4EEE5);box-shadow:inset 0 0 0 1px var(--core-line-2,rgb(255 240 222 / .17)),0 12px 32px rgb(0 0 0 / .35);font:400 14px/1.4 Onest,system-ui,sans-serif';
      document.body.appendChild(el);
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && el.isConnected) el.remove(); });
    }
    if (!el.isConnected) document.body.appendChild(el);
    el.textContent = message;
    clearTimeout(noteTimer); noteTimer = setTimeout(() => el.remove(), 7000);
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-language]').forEach(link => {
      const lang = link.dataset.language;
      link.setAttribute('aria-current', lang === current ? 'true' : 'false');
      link.lang = lang; link.hreflang = lang;
      const url = new URL(location.href); url.searchParams.set('lang', lang); link.href = url.pathname + url.search + url.hash;
      link.addEventListener('click', async e => {
        e.preventDefault(); if (lang === current || switching) return;
        // Never navigate away while a secret or unsaved form is open.
        if (document.querySelector('dialog[open],#modal.on')) {
          const message = current === 'en' ? 'Close the dialog before switching languages. Save any key or edits first.' : 'Перед сменой языка закройте окно. Сначала сохраните ключ или изменения.';
          if (typeof window.toast === 'function') window.toast(message); else if (window.CoreUI) window.CoreUI.alert(message); else note(message); // системных окон нет: на странице без toast и без CoreUI — строка на самой странице
          return;
        }
        switching = true;
        try {
          if (api.beforeSwitch && await api.beforeSwitch() === false) return;
          document.cookie = 'premier_lang=' + lang + '; Path=/; Max-Age=31536000; SameSite=Lax' + secure;
          try { localStorage.setItem('premier:language', lang); } catch {}
          location.assign(link.href);
        } finally { switching = false; }
      });
    });
  });
})();
