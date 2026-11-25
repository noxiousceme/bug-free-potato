'use strict';
// Редизайн, шаг 6: лендинг, вход и страница пробного дня в системе Core. Проверки без браузера:
// страницы подключают только стили Core и не несут встроенного оформления; зацепки скриптов и сервера на месте
// (SEO, цены, отзывы, вход, второй шаг); текст лендинга есть в разметке без скриптов; правила системы в новых
// стилях (только токены, без своего размытия, движение из токенов); янтарь — у одного главного действия;
// полёт камеры — функция прокрутки (Core.flight), без перехвата прокрутки, и выключен при «уменьшить движение».
// node --test tests/core-landing.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { makeScene } = require('./core-scene-util');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const noComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const PAGES = { landing: ['public/index.html', 'public/en/index.html'], login: ['public/login.html', 'public/en/login.html'], trial: ['public/protrial.html', 'public/en/protrial.html'] };
const ALL = Object.values(PAGES).flat();
const SHEETS = ['public/core/core-site.css', 'public/core/core-landing.css', 'public/core/core-login.css', 'public/core/core-trial.css'];
const OWN = { landing: 'core-landing', login: 'core-login', trial: 'core-trial' };
const sheetsOf = (html) => [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
const ver = (html, re) => (re.exec(html) || [])[1];

test('шаг 6: три страницы (RU/EN) — на Core: только стили Core с версией, сцена первой в body, старого оформления нет', () => {
  const OLD = ['/tokens.css', '/landing.css', '/css/landing-', '/language.css', '/protrial.css', '/theme/', 'unbounded'];
  for (const [kind, pages] of Object.entries(PAGES)) for (const p of pages) {
    const html = read(p), sheets = sheetsOf(html);
    assert.match(html, new RegExp('<html lang="(ru|en)" class="core" data-page="' + kind + '"[^>]*data-core-is="rest">'), p + ': класс core и признак страницы на <html>');
    assert.deepEqual(sheets.map((s) => s.replace(/\?v=\d+$/, '')), ['/core/core-tokens.css', '/core/core-base.css', '/core/core-components.css', '/core/core-scene.css', '/core/core-site.css', '/core/' + OWN[kind] + '.css'], p + ': порядок стилей');
    for (const s of sheets) { assert.match(s, /\?v=\d+$/, p + ': стиль с версией: ' + s); assert.ok(fs.existsSync(path.join(root, 'public', s.split('?')[0])), p + ': нет файла ' + s); }
    for (const o of OLD) assert.ok(!html.includes(o), p + ': старое подключение ' + o);
    assert.doesNotMatch(html, /<style[\s>]/, p + ': встроенных стилей нет');
    assert.doesNotMatch(html, /var\(--p-/, p + ': старых токенов нет');
    assert.deepEqual((html.match(/style="[^"]*"/g) || []).filter((s) => s !== 'style="display:none"'), [], p + ': встроенного оформления в атрибутах нет (кроме скрытия спрайта и статуса)');
    assert.match(html, /<body>\n<div class="core-scene" aria-hidden="true"><\/div>/, p + ': слой сцены — первым в body');
    assert.match(html, /<script defer src="\/core\/core-ui\.js\?v=\d+"><\/script><script defer src="\/core\/core-scene\.js\?v=\d+"><\/script>\n<script defer src="\/js\/26-core-site\.js\?v=\d+"><\/script>/, p + ': скрипты Core и связка страницы — с defer, связка после них');
    assert.match(html, /content="#F1ECE3" media="\(prefers-color-scheme: light\)"><meta name="theme-color" content="#0B0A08"/, p + ': цвет панели браузера — цвет сцены');
    assert.match(html, new RegExp('rel="preload" href="/fonts/onest-' + (/\/en\//.test(p) ? 'latin' : 'cyrillic') + '-wght-normal\\.woff2"'), p + ': заранее грузится шрифт своего языка');
  }
});

test('шаг 6: общие файлы Core подключены теми же версиями, что в чате, и одинаково в RU и EN', () => {
  const chat = read('public/chat.html');
  for (const f of ['core-tokens.css', 'core-base.css', 'core-components.css', 'core-scene.css', 'core-ui.js', 'core-scene.js']) {
    const re = new RegExp('/core/' + f.replace('.', '\\.') + '\\?v=(\\d+)'), want = ver(chat, re);
    assert.ok(want, 'чат подключает ' + f);
    for (const p of ALL.concat('public/en/chat.html')) assert.equal(ver(read(p), re), want, p + ': ' + f + ' той же версии, что в чате (один файл в кеше браузера)');
  }
  for (const pages of Object.values(PAGES)) {
    const v = (p) => [...read(p).matchAll(/\/(?:core|js)\/[\w-]+\.(?:css|js)\?v=\d+/g)].map((m) => m[0]).join(' ');
    assert.equal(v(pages[0]), v(pages[1]), pages[0] + ' и английская копия подключают одно и то же');
  }
  assert.ok(Number(ver(chat, /core-scene\.js\?v=(\d+)/)) >= 3, 'core-scene.js менялся на шаге 6 (Core.flight) — версия поднята');
});

test('шаг 6: лендинг — всё для поисковиков и сервера на месте, текст читается без скриптов', () => {
  const seo = require('../seo');
  for (const p of PAGES.landing) {
    const html = read(p), lang = /\/en\//.test(p) ? 'en' : 'ru';
    assert.match(html, /<title>[^<]+<\/title>/); assert.match(html, /<meta name="description" content="[^"]+">/); assert.match(html, /<!--SEO-->/);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, p + ': один h1');
    assert.ok((html.match(/<h2[\s>]/g) || []).length >= 5, p + ': заголовки секций — h2');
    assert.ok(html.indexOf('<h1') < html.indexOf('<h2'), p + ': h1 раньше h2');
    assert.ok(seo.faqItems(html).length >= 8, p + ': вопросы и ответы разбираются сервером (seo.faqItems)');
    const out = seo.landing(html, lang, 'https://premier.example', [{ id: 'pro', name: 'Pro', price: 390 }]);
    assert.match(out, /"@type":"FAQPage"/); assert.match(out, /rel="canonical"/); assert.match(out, /"price":"390"/);
    // зацепки, на которые опираются скрипты страницы, team-offer.js и сервер
    for (const id of ['nav', 'kickerText', 'heroOffer', 'heroModels', 'demoTabs', 'preview', 'dPrompt', 'dAnswer', 'dName', 'dDesc', 'dState', 'dFollow', 'dInput', 'dSend', 'dTitle', 'dExt', 'siteBox', 'siteFrame',
      'features', 'cloud', 'pricing', 'trialLine', 'offerStrip', 'perSeg', 'tiers', 'teamStrip', 'reviews', 'reviewGrid', 'reviewEmpty', 'reviewEmptyText', 'reviewMore', 'reviewOpen', 'faq', 'reviewModal', 'reviewForm',
      'reviewRating', 'reviewNick', 'reviewText', 'reviewCount', 'reviewConsent', 'reviewError', 'reviewSubmit', 'reviewClose', 'reviewToast', 'footReview', 'yr']) assert.ok(html.includes('id="' + id + '"'), p + ': нет #' + id);
    for (const c of ['class="tier-trial"', 'class="tier${hot', 'class="pr2"', 'class="pm-month"', 'class="first-note"', 'class="os-tag"', 'class="hm-chip"', 'class="rv-card"', 'data-open="plans"', 'data-per="', 'data-demo="0"', 'class="lp-per"', 'class="links"', 'data-language="ru"', '<details class="faq-item">', 'team-offer.js']) assert.ok(html.includes(c), p + ': нет зацепки ' + c);
    assert.match(html, /<div class="hero-proof[^"]*">\s*<div class="hero-facts">[\s\S]*?<div class="hero-models" id="heroModels">/, p + ': факты и модели — на полке под демонстрацией');
    // первый экран: заголовок, одна строка, одна кнопка — и сразу демонстрация; пяти рядов между ними больше нет
    const copy = html.slice(html.indexOf('<div class="hero-copy">'), html.indexOf('id="preview"'));
    assert.ok(/<h1[\s\S]*class="lead[\s\S]*class="cta"/.test(copy) && !/hero-facts|hero-models|demo-tabs/.test(copy), p + ': между заголовком и демонстрацией — строка и кнопка');
    assert.match(html, /id="preview"[^>]*>\s*<div class="demo-tabs" id="demoTabs"/, p + ': вкладки примеров — в рамке демонстрации');
    // без скриптов: текст в разметке, а стили ничего не прячут, пока на <html> нет класса js
    for (const id of ['features', 'pricing', 'faq']) assert.match(html, new RegExp('<section id="' + id + '"[^>]*data-flight="[^"]+"'), p + ': станция полёта у #' + id);
  }
  const css = noComments(SHEETS.map(read).join('\n'));
  for (const m of css.matchAll(/([^{}]+)\{[^{}]*(?:opacity:0|visibility:hidden|display:none)[^{}]*\}/g)) {
    const sel = m[1].trim();
    assert.ok(/\[data-demo|\.js[:.\[ ]|:empty|\[hidden\]|\[data-gate|summary svg|\.ready|\.who::after|:has\(|^\.links|^\.tgnav|^\.links,\.tgnav|max-width|\.off\b/.test(sel) || /^\s*(?:\.tgnav|\.links)\s*$/.test(sel),
      'скрытие только по состоянию (шаг демонстрации под .js, пустой блок, закрытое, узкий экран): ' + sel);
  }
});

test('шаг 6: вход и пробный день — зацепки скриптов, второй шаг и автозаполнение кода не тронуты', () => {
  for (const p of PAGES.login) {
    const html = read(p);
    assert.match(html, /<!--REG-->/, p + ': сервер подставляет сюда признаки входа');
    for (const id of ['gbtn', 'gtxt', 'ghbtn', 'ghtxt', 'err', 'note']) assert.ok(html.includes('id="' + id + '"'), p + ': нет #' + id);
    assert.match(html, /<a class="gbtn" id="gbtn" href="\/api\/auth\/google">/); assert.match(html, /<a class="gbtn ghbtn" id="ghbtn" href="\/api\/auth\/github">/);
    assert.match(html, /<input id="tfaCode" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="20" spellcheck="false" placeholder="123456">/, p + ': поле кода — как было (менеджеры паролей и автоподстановка)');
    assert.match(html, /<form id="tfaF" autocomplete="off" novalidate>/); assert.match(html, /role="alert"/);
    assert.match(html, /<div class="wrap2 core-glass" data-core-at="core">\n<main class="box">[\s\S]*<\/main>\n<section class="pitch">/, p + ': одна стеклянная плита, форма первой');
    assert.match(html, /data-core-place="full"/, p + ': Ядро во весь экран');
    assert.match(html, /if \(window\.CoreGate\) CoreGate\.enter\('\/chat', true\); else location\.replace\('\/chat'\)/, p + ': после входа — полёт в Ядро, без связки — обычный переход');
    assert.doesNotMatch(html, /style\.opacity/, p + ': ожидание — состояние aria-busy, не встроенный стиль');
  }
  for (const p of PAGES.trial) {
    const html = read(p);
    for (const id of ['nav', 'ptTimer', 'ptTimerLabel', 'ptCtaWrap', 'ptBtn', 'ptStatus', 'featGrid', 'fn-msgs', 'fn-code', 'fn-sites', 'fn-images', 'cmp-free-msgs', 'cmp-free-code', 'cmp-free-sites', 'finalCard', 'yr']) assert.ok(html.includes('id="' + id + '"'), p + ': нет #' + id);
    assert.equal((html.match(/onclick="ptClaim\(\)"/g) || []).length, 2, p + ': обе кнопки зовут ptClaim()');
    assert.match(html, /<div class="wrap pt-plate core-glass" data-core-at="core">/, p + ': первый экран — одна плита перед Ядром');
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  }
  // генератор английских страниц пробный день не покрывает: обе страницы правятся одинаково
  assert.doesNotMatch(read('scripts/build-i18n.py'), /protrial/);
});

test('шаг 6: новые стили — только токены Core, без своего размытия, движение — из токенов и гаснет при reduce', () => {
  for (const f of SHEETS) {
    const css = noComments(read(f)), values = css.replace(/[^{}]*\{/g, '{');
    assert.doesNotMatch(values, /#[0-9a-f]{3,8}\b/i, f + ': нет литеральных цветов');
    assert.doesNotMatch(values, /rgba?\(|hsla?\(/i, f + ': нет литеральных цветов rgb()/hsl()');
    assert.doesNotMatch(css, /var\(--p-/, f + ': старых токенов нет');
    assert.doesNotMatch(css, /cursor:\s*pointer/, f + ': курсор — через токены');
    assert.doesNotMatch(css.replace(/\b0s\b/g, ''), /\d(ms|s)\b(?![^;{}]*\))/, f + ': длительности — только из токенов');
    assert.doesNotMatch(css, /font-family/, f + ': шрифты — только через токены голосов');
    assert.doesNotMatch(css, /Unbounded/i, f + ': Unbounded не используется');
    // размытие — только материал Core (классы core-glass в разметке); своё — лишь затемнение под системным окном
    for (const m of css.matchAll(/([^{}]*)\{[^{}]*backdrop-filter:([^;}]+)/g)) assert.ok(/::backdrop/.test(m[1]) && m[2].trim() === 'blur(var(--core-scrim-blur))', f + ': своё размытие: ' + m[1].trim());
    for (const m of css.matchAll(/font(?:-size)?:[^;}]*?\b\d+px/g)) assert.fail(f + ': размер шрифта в пикселях: ' + m[0]);
    // циклы — только под «движение разрешено»; разовые анимации — на токенах длительности или на шкале прокрутки
    const calm = css.replace(/@media \(prefers-reduced-motion:no-preference\)[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, '');
    assert.doesNotMatch(calm, /infinite/, f + ': бесконечные анимации — только под prefers-reduced-motion:no-preference');
    for (const m of css.matchAll(/animation:([^;}]+)/g)) assert.match(m[1], /var\(--core-dur-[1-4]\)|var\(--core-ambient\)|linear both$/, f + ': длительность анимации — токен: ' + m[1].trim());
    assert.doesNotMatch(css, /scroll-snap|overscroll-behavior:\s*none|overflow:\s*hidden[^}]*\}\s*html/, f + ': прокрутку у посетителя не отнимаем');
  }
  const site = noComments(read('public/core/core-site.css'));
  assert.match(site, /@supports \(animation-timeline:view\(\)\)\{\s*@media \(prefers-reduced-motion:no-preference\) and \(min-width:861px\)\{\s*\.js:not\(\[data-core-motion=reduce\]\) \.site-plate\{animation:site-arrive linear both;animation-timeline:view\(\)/, 'плита встаёт на место по шкале прокрутки, только где это умеет браузер и движение разрешено');
});

test('шаг 6: янтарь — у одного главного действия на экран; светлая тема — без жёстких цветов в вопросах и сроке оплаты', () => {
  const MAIN = /\.cta>\.btn|\.tier\.hot>\.btn|\.pt-cta>\.btn|#reviewForm>\.btn|\.final \.btn|\.final-card \.btn|\[data-page=login\] \.card \.btn/;
  for (const f of SHEETS) {
    const css = noComments(read(f));
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) if (/--core-heat-[1-5]\b|cursor-action-on-heat/.test(m[2])) assert.match(m[1], MAIN, f + ': накал вне главного действия: ' + m[1].trim());
  }
  const site = noComments(read('public/core/core-site.css'));
  // в чате плита впереди и раскалённая кнопка заданы так же (core-dialogs.css): тарифы лендинга — те же плиты
  const dialogs = noComments(read('public/core/core-dialogs.css'));
  for (const [a, b] of [['.tier{', '.core .plan{'], ['.tier.hot{', '.core .plan.fwd,.core .plans:not([data-sel]) .plan.hot{'], ['.tier .pr2{', '.core .plan .price{'], ['.tier ul{', '.core .plan ul{']]) {
    const body = (css, sel) => { const i = css.indexOf('\n' + sel); assert.ok(i >= 0, 'нет правила ' + sel); return css.slice(i + sel.length + 1, css.indexOf('}', i)).replace(/\s+/g, ' ').replace(/--site-plate/g, '--core-fill-1').replace(/var\(--(?:site|dlg)-edge\)/g, 'EDGE').replace(/text-align:left;/, '').trim(); };
    assert.equal(body(site, a), body(dialogs, b), 'плита тарифа на лендинге совпадает с окном тарифов чата: ' + a);
  }
  for (const sel of ['.faq-item{', '.faq-item summary{', '.faq-a{', '.lp-per{', '.lp-per>button{']) assert.ok(site.includes('\n' + sel), 'core-site.css задаёт ' + sel);
  // известный дефект старого landing.css — тёмные плиты с тёмным текстом в светлой теме: старый файл страницы не грузят
  for (const p of PAGES.landing) assert.ok(!sheetsOf(read(p)).some((s) => /\/landing\.css|landing-(main|visual)/.test(s)), p + ': старые стили лендинга не подключены');
});

test('шаг 6: Core.flight — поза применяется сразу; выключение возвращает место; команда цепляется', () => {
  const s = makeScene({ w: 1440, h: 900 });
  assert.equal(typeof s.Core.flight, 'function'); assert.equal(s.Core.flight(), false, 'по умолчанию полёта нет');
  assert.equal(s.Core.flight({ x: 80, y: 30, size: 0.3, yaw: 1, pitch: 0.2, depth: 0.5 }), s.Core, 'команда возвращает Core');
  assert.equal(s.Core.info().flight, true); assert.equal(s.Core.flight(), true);
  s.Core.flight({ depth: 99, gain: 5, x: 'x' });   // мусор не ломает: значения обрезаются
  assert.equal(s.Core.info().flight, true);
  s.Core.flight(null); assert.equal(s.Core.info().flight, false);
  const js = read('public/core/core-scene.js');
  assert.match(js, /if\(kk<0\.07\)\{gl_Position=vec4\(2\.0,2\.0,0\.0,1\.0\)/, 'точки за плоскостью камеры не рисуются');
  assert.match(js, /if\(uFlow\.w>0\.5\)\{a\*=smoothstep\(0\.07,0\.3,kk\)\*min\(1\.0,2\.56\/\(k\*k\)\)/, 'ближняя точка в полёте не ярче по свету: предел яркости (12.10) держится');
  assert.match(js, /var F = fly && !reduced && !focus \? flyGeo\(\) : null;/, 'при «уменьшить движение» и под окном полёта нет');
  assert.ok(Buffer.byteLength(js) < 90 * 1024, 'core-scene.js по-прежнему меньше 90 КБ');
});

// связка страницы в маленькой замене окна: две станции, прокрутка между ними
function runSite(opt) {
  opt = Object.assign({ reduced: false, phone: false, scrollY: 0 }, opt);
  const calls = [], rafs = [], listeners = {}, attrs = { 'data-page': 'landing' };
  const mk = (id, a, top, h) => ({ id, hidden: false, _a: a, style: { setProperty() {} }, matches: () => false, getAttribute: (n) => (n in a ? a[n] : null), getBoundingClientRect: () => ({ top: top - win.scrollY, height: h, left: 0, width: 1000 }) });
  const stations = [mk('hero', { 'data-flight': '80 30 .3 0 0', 'data-flight-phone': '80 15 .2 0 0' }, 0, 900), mk('b', { 'data-flight': '10 50 .5 2 .2', 'data-flight-through': '1', 'data-flight-phone': '10 40 .6 1 0' }, 1800, 900)];
  const root = { classList: { add() {}, contains: () => false }, scrollHeight: 4000, getAttribute: (n) => (n in attrs ? attrs[n] : null), setAttribute: (n, v) => { attrs[n] = String(v); }, removeAttribute: (n) => { delete attrs[n]; }, hasAttribute: (n) => n in attrs, addEventListener() {}, dispatchEvent() {} };
  const doc = { documentElement: root, body: null, hidden: false, getElementById: () => null, querySelector: () => null, querySelectorAll: (q) => (q === '[data-flight]' ? stations : []), addEventListener() {} };
  const mq = (q) => ({ matches: /reduced-motion/.test(q) ? opt.reduced : /max-width/.test(q) ? opt.phone : false, addEventListener() {} });
  const Core = { place(p) { calls.push(['place', p]); return Core; }, flight(p) { calls.push(['flight', p]); return Core; }, info: () => ({ mode: 'live', quality: 'high' }), state() { return Core; }, target() { return Core; } };
  const win = { document: doc, Core, CoreUI: { light: { scope(s) { calls.push(['scope', s]); } } }, innerWidth: 1440, innerHeight: 900, scrollY: opt.scrollY, matchMedia: mq,
    requestAnimationFrame: (f) => { rafs.push(f); return rafs.length; }, addEventListener: (n, f) => { (listeners[n] = listeners[n] || []).push(f); }, setTimeout: () => 0, clearTimeout() {}, performance: { now: () => 0 }, location: {} };
  win.window = win;
  vm.runInContext(read('public/js/26-core-site.js'), vm.createContext(win));
  const scrollTo = (y) => { win.scrollY = y; (listeners.scroll || []).forEach((f) => f()); while (rafs.length) rafs.shift()(0); };
  return { calls, scrollTo, attrs, last: () => calls.filter((c) => c[0] === 'flight').pop()[1], listeners };
}

test('шаг 6: полёт по прокрутке — поза зависит только от положения прокрутки; прокрутка не перехватывается', () => {
  const s = runSite();
  assert.deepEqual(s.calls[0], ['place', { x: 80, y: 30, size: 0.3 }], 'первый кадр сцены — на первой станции');
  assert.deepEqual(s.calls[1], ['scope', '#preview, .hero-proof'], 'свет первого экрана пишется только его стеклу');
  let p = s.last(); assert.equal(p.x, 80); assert.equal(p.size, 0.3); assert.equal(p.depth, 0);
  s.scrollTo(1800); p = s.last();
  assert.ok(Math.abs(p.x - 10) < 1e-9 && Math.abs(p.y - 50) < 1e-9 && Math.abs(p.size - 0.5) < 1e-9 && Math.abs(p.yaw - 2) < 1e-9 && p.depth < 1e-9, 'на станции — её поза');
  s.scrollTo(900); p = s.last();
  assert.ok(Math.abs(p.x - 45) < 1e-9, 'на полпути — середина'); assert.ok(p.size > 1 && p.depth > 0.6, 'на полпути камера внутри Ядра (data-flight-through)');
  const a = JSON.stringify(p); s.scrollTo(300); s.scrollTo(900);
  assert.equal(JSON.stringify(s.last()), a, 'та же прокрутка — та же поза: движение идёт за прокруткой точно, без инерции и своей анимации');
  const n = s.calls.length; s.scrollTo(900); assert.equal(s.calls.length, n, 'без сдвига прокрутки поза не пересчитывается');
  const js = read('public/js/26-core-site.js');
  assert.doesNotMatch(js, /scrollTo\(|scrollIntoView|scrollBy\(|'wheel'|'touchmove'|scrollTop\s*=/, 'скрипт не двигает страницу и не слушает колесо');
  assert.match(js, /addEventListener\('scroll', onScroll, \{ passive: true \}\)/, 'прокрутка слушается пассивно');
  assert.equal((js.match(/preventDefault/g) || []).length, 1, 'единственный preventDefault — ссылка «Продолжить» на странице входа');
  // у каждой станции лендинга есть вариант для телефона
  for (const p2 of PAGES.landing) { const st = [...read(p2).matchAll(/data-flight="([^"]+)"([^>]*)/g)]; assert.equal(st.length, 7, p2 + ': семь станций'); for (const m of st) assert.match(m[2], /data-flight-phone="[\d. -]+"/, p2 + ': вариант для телефона'); }
});

test('шаг 6: «уменьшить движение» — полёта нет; телефон — свои позы, без пролёта сквозь Ядро, стекло непрозрачно', () => {
  const r = runSite({ reduced: true, scrollY: 900 });
  assert.equal(r.calls.filter((c) => c[0] === 'flight').length, 0, 'при «уменьшить движение» Core.flight не вызывается');
  r.scrollTo(1500); assert.equal(r.calls.filter((c) => c[0] === 'flight').length, 0);
  const m = runSite({ phone: true });
  assert.equal(m.attrs['data-core-transparency'], 'reduce', 'на телефоне стекло непрозрачно: размытие под движущимся Ядром не считается');
  assert.ok('data-site-soft' in m.attrs);
  assert.deepEqual(m.calls[0], ['place', { x: 80, y: 15, size: 0.2 }]);
  m.scrollTo(900); assert.equal(m.last().depth, 0, 'на телефоне камера не входит в Ядро'); assert.ok(m.last().size < 0.61);
  const d = runSite();
  assert.ok(!('data-core-transparency' in d.attrs), 'сильный компьютер (ступень high) — настоящее стекло');
});

test('шаг 6: вход — полёт в Ядро короче секунды, при «уменьшить движение» его нет; демонстрация не прячет содержимое навсегда', () => {
  const js = read('public/js/26-core-site.js');
  const D = Number(ver(js, /D = (\d+);/)), go = Number(ver(js, /setTimeout\(go, (\d+)\);\n  \}/));
  assert.ok(D > 0 && D <= 500 && go > 0 && go <= 350, 'полёт ' + D + ' мс, переход через ' + go + ' мс — заметно меньше секунды');
  assert.match(js, /if \(reduced\(\)\) return go\(\);/, 'при «уменьшить движение» переход мгновенный');
  assert.match(js, /win\.CoreGate = \{ enter: enter \};/);
  const login = noComments(read('public/core/core-login.css'));
  assert.match(login, /html\[data-gate=in\] \.wrap2\{opacity:0;transform:scale\(\.94\);pointer-events:none\}/);
  assert.match(login, /#gbtn:not\(\.off\),#gbtn\[hidden\]\+#ghbtn:not\(\.off\)\{background:var\(--core-on\)/, 'первая из показанных кнопок входа — светлая плита, не янтарь');
  const land = noComments(read('public/core/core-landing.css'));
  // до первого показа ответ и результат скрыты только под .js и проявляются сами, если скрипт не запустился
  assert.match(land, /\.js:not\(\.lp-played,\[data-core-motion=reduce\]\) \.show:not\(\[data-demo\]\) :is\(\.a,#dFollow\)\{opacity:0;animation:lp-late var\(--core-dur-4\) calc\(var\(--core-ambient\) \* 2\.5\) both\}/);
  assert.match(js, /setTimeout\(first, 2500\);/, 'демонстрация не ждёт графику дольше 2,5 с');
  assert.match(js, /if \(reduced\(\) \|\| !seen \|\| doc\.hidden\) return finish\(\);/, 'при «уменьшить движение» демонстрация сразу в готовом виде');
});
