'use strict';
// Редизайн, шаг 3: экран чата в системе Core. Проверки без браузера: подключение файлов на RU и EN, сохранность
// id и классов, на которые завязаны скрипты, правила системы в core-chat.css, файл-мост со старым оформлением,
// связь страницы с Ядром, область сцены (Core.stage) и свет в области (CoreUI.light.scope).
// node --test tests/core-chat.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { makeScene } = require('./core-scene-util');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const PAGES = ['public/chat.html', 'public/en/chat.html'];
const noComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const ver = (html, re) => (re.exec(html) || [])[1];

test('чат: страница подключает только файлы Core, в нужном порядке; старых стилей на ней больше нет (шаг 5)', () => {
  for (const p of PAGES) {
    const html = read(p), head = html.slice(0, html.indexOf('</head>'));
    assert.match(html, /<html lang="(ru|en)" class="core" data-core-place="center" data-core-is="rest">/, p + ': класс core и первое положение Ядра на <html>');
    assert.match(html, /<body>\s*<div class="core-scene" aria-hidden="true"><\/div>/, p + ': слой сцены — первый в <body>');
    const order = ['/core/core-tokens.css', '/core/core-base.css', '/core/core-components.css', '/core/core-scene.css', '/core/core-chat.css', '/core/core-work.css', '/core/core-dialogs.css'].map((f) => head.indexOf('href="' + f + '?v='));
    assert.ok(order.every((i) => i > 0), p + ': все стили подключены с ?v=');
    assert.deepEqual(order, [...order].sort((a, b) => a - b), p + ': порядок — токены Core, основа, компоненты, сцена, чат, работа ИИ, окна');
    // шаг 5: окна переведены на Core — странице не нужны ни старые токены (tokens.css), ни мост chat-legacy.css
    for (const old of ['href="/tokens.css', 'chat-legacy', 'chat-main', 'language.css', '/theme/', 'growth.css', 'limits.css', 'chat-ui.css', 'ultra.css', 'anim.css', 'chat-visual.css']) assert.ok(!head.includes(old), p + ': старый файл больше не подключается: ' + old);
    assert.doesNotMatch(head, /<style/, p + ': встроенных стилей нет');
    assert.match(head, /<script defer src="\/core\/core-ui\.js\?v=\d+"><\/script><script defer src="\/core\/core-scene\.js\?v=\d+"><\/script>/, p + ': core-ui.js, затем core-scene.js, оба с defer');
    assert.match(html, /<script src="\/js\/22-anim\.js\?v=\d+"><\/script>\n<script defer src="\/js\/23-core-chat\.js\?v=\d+"><\/script>/, p + ': 23-core-chat.js — последним и с defer (после скриптов Core)');
    assert.match(head, /interactive-widget=resizes-content/, p + ': поле ввода остаётся над экранной клавиатурой');
  }
  const [ru, en] = PAGES.map(read);
  for (const re of [/\/core\/core-dialogs\.css\?v=(\d+)/, /\/js\/25-core-dialogs\.js\?v=(\d+)/, /\/core\/core-chat\.css\?v=(\d+)/, /\/core\/core-scene\.js\?v=(\d+)/, /\/core\/core-ui\.js\?v=(\d+)/, /\/js\/23-core-chat\.js\?v=(\d+)/, /\/js\/15-growth\.js\?v=(\d+)/, /\/js\/19-limits\.js\?v=(\d+)/]) {
    assert.ok(ver(ru, re), 'есть ' + re); assert.equal(ver(ru, re), ver(en, re), 'версии RU и EN совпадают: ' + re);
  }
  assert.match(read('public/sw.js'), /const STATIC = \/\^\\\/\(js\|en\\\/js\|theme\|fonts\|vendor\|icons\|core\|css\)\\\//, 'установленное приложение кеширует /core/ и /css/');
});

test('чат: id и классы, на которые завязаны скрипты, на месте; разметка перегруппирована без потерь', () => {
  const IDS = ['side', 'closeSide', 'newChat', 'find', 'newProj', 'projects', 'chatsHead', 'hl', 'chats', 'planCard', 'pcName', 'pcRst', 'pcUp', 'pcBarW', 'pcBar', 'pcText', 'tgCard', 'tgClose', 'meBtn', 'meAv', 'meName', 'logoutBtn', 'overlay',
    'openSide', 'crumb', 'shareBtn', 'chat', 'col', 'gwBar', 'form', 'pickChip', 'atts', 'q', 'attachBtn', 'fileIn', 'webBtn', 'imgBtn', 'fsBtn', 'fsName', 'agBtn', 'mbtn', 'mname', 'menu', 'micBtn', 'ptag', 'send', 'mirror', 'sugg',
    'pane', 'ptitle', 'pPick', 'pReload', 'pOpen', 'pPub', 'pDl', 'pCopy', 'pClose', 'pubbar', 'animbar', 'pFrame', 'pCode', 'pVersions', 'pWait', 'modal', 'dtitle', 'dclose', 'dbody'];
  for (const p of PAGES) {
    const html = read(p);
    for (const id of IDS) assert.equal((html.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, p + ': id="' + id + '" ровно один');
    assert.match(html, /<!--ME-->/, p + ': место для данных пользователя, которые вставляет сервер');
    // шаг 5: отдельного элемента уведомления больше нет — toast() рисует капсулу Core (проверка самой функции — tests/core-dialogs.test.js)
    assert.ok(!html.includes('id="toast"'), p + ': старого элемента #toast на странице нет');
    // меню моделей остаётся внутри .model: по этому признаку обработчик нажатий решает, закрывать ли его
    assert.match(html, /<div class="model">\s*<button type="button" class="mbtn" id="mbtn"[^>]*>.*?<\/button>\s*<div class="menu core-glass core-glass--near" id="menu" role="menu"><\/div>\s*<\/div>/s, p);
    // окна «Папка» и «Компьютер» добавляются в родителя своей кнопки — кнопки режимов остаются прямо в ряду .brow
    const brow = html.slice(html.indexOf('<div class="brow">'), html.indexOf('</form>'));
    for (const id of ['toolsBtn', 'attachBtn', 'webBtn', 'imgBtn', 'fsBtn', 'agBtn', 'mbtn', 'micBtn', 'send']) assert.ok(brow.includes('id="' + id + '"'), p + ': в нижнем ряду поля есть #' + id);
    assert.ok(brow.indexOf('id="toolsBtn"') < brow.indexOf('id="agBtn"') && brow.indexOf('id="agBtn"') < brow.indexOf('id="mbtn"') && brow.indexOf('id="mbtn"') < brow.indexOf('id="micBtn"') && brow.indexOf('id="micBtn"') < brow.indexOf('id="send"'), p + ': порядок — «+», режимы, модель, голос, отправка');
    assert.match(html, /id="toolsBtn" data-core-menu="#toolsMenu" data-core-side="top" aria-haspopup="menu" aria-expanded="false" aria-label="[^"]+"/, p + ': у «+» есть подпись и меню Core');
    assert.match(html, /<div class="core-menu chat-tools" id="toolsMenu" role="menu" hidden><\/div>/, p);
    // стекло поля — отдельный слой: у самой формы нет backdrop-filter, иначе шторка выбора модели (position:fixed) считалась бы от неё
    assert.match(html, /<form class="box" id="form">\s*<div class="box-glass core-glass" aria-hidden="true"><\/div>/, p);
    assert.match(html, /<aside class="side core-glass core-glass--far" id="side" data-core-at="left">/, p + ': боковая панель — дальнее стекло');
    assert.match(html, /<div id="sugg" class="core-glass core-glass--far"><\/div>/, p + ': подсказки — одна полка дальнего стекла');
    // переключатель языка переехал из рабочей области к аккаунту
    const me = html.slice(html.indexOf('<div class="me">'), html.indexOf('</aside>')), top = html.slice(html.indexOf('<header class="top">'), html.indexOf('</header>'));
    assert.match(me, /<nav class="language-switch"[^>]*>.*data-language="ru".*data-language="en".*<\/nav>/s, p + ': язык рядом с аккаунтом');
    assert.ok(!top.includes('language-switch'), p + ': в верхней строке языка нет');
    assert.ok(top.indexOf('id="openSide"') < top.indexOf('id="crumb"') && top.indexOf('id="crumb"') < top.indexOf('id="shareBtn"'), p + ': верхняя строка — панель, название, «Поделиться»');
    // подпись про ошибки и строка лимита — над полем, внутри .dock-meta
    assert.match(html, /<div class="dock-meta"><div class="gw-bar" id="gwBar" hidden><\/div><div class="note">[^<]+<\/div><\/div>/, p);
    assert.doesNotMatch(html, /Unbounded/, p + ': шрифт Unbounded не используется');
  }
  // тексты интерфейса те же: в RU-странице ни одна прежняя подпись не пропала
  const ru = read('public/chat.html');
  for (const s of ['Новый чат', 'Поиск по чатам', 'Проекты', 'Недавние', 'Сбросить лимит', 'Тарифы', 'Наш Telegram', 'Подписаться', 'Настройки аккаунта', 'Выйти', 'Поделиться чатом', 'Язык интерфейса', 'Спросите что угодно', 'Прикрепить файл или картинку', 'Интернет', 'Картинка', 'Папка', 'Компьютер', 'Голосовой ввод', 'Отправить', 'Premier может ошибаться. Проверяйте важное.']) assert.ok(ru.includes(s), 'текст на месте: ' + s);
});

test('чат: core-chat.css — только токены Core, без своего размытия, янтарь — у одного действия и у работы ИИ', () => {
  const css = noComments(read('public/core/core-chat.css'));
  // значения без масок: в масках кромок #000 — это «непрозрачно», а не цвет оформления (так же в core-base.css)
  const values = css.replace(/(-webkit-)?mask(-composite)?:[^;}]+/g, '').replace(/[^{}]*\{/g, '{');
  assert.doesNotMatch(values, /#[0-9a-f]{3,8}\b/i, 'нет литеральных цветов');
  assert.doesNotMatch(values, /rgba?\(/i, 'нет литеральных цветов rgb()');
  assert.doesNotMatch(css, /var\(--p-|var\(--(?!core-|chat-|dock-|_)/, 'только токены --core-* (и свои --chat-*, --dock-*)');
  assert.doesNotMatch(css, /cursor:\s*pointer/, 'курсор — через токены');
  assert.doesNotMatch(css.replace(/\b0s\b/g, ''), /\d(ms|s)\b(?![^;{}]*\))/, 'длительности — только из токенов');
  assert.doesNotMatch(css, /font(-size)?:\s*[\d.]+(px|rem)/, 'размеры шрифта — только из шкалы');
  assert.doesNotMatch(css, /font-family/, 'шрифты — только через токены голосов');
  // размытие задают только классы стекла из core-base.css; страница может его лишь отключить
  for (const m of css.matchAll(/backdrop-filter:([^;}]+)/g)) assert.equal(m[1].trim(), 'none', 'в стилях страницы backdrop-filter только выключается');
  assert.match(css, /@media \(min-width:861px\)\{\.core \.side\{-webkit-backdrop-filter:none;backdrop-filter:none\}\}/, 'на компьютере боковая панель не размывает ровную сцену');
  // янтарь (шкала накала) — только у отправки, у «Продолжить», когда лимит исчерпан, у кромки поля, пока Ядро работает, и у кольца на исходе
  const rules = css.split('}').map((r) => r.split('{')).filter((r) => r.length >= 2).map((r) => [r[r.length - 2].trim(), r[r.length - 1]]);
  for (const [sel, body] of rules) {
    if (/--core-heat-/.test(body)) assert.match(sel, /\.send|\.gw-out \.btn|\.box-glass::before|\.gw-left\.low \.core-ring/, 'накал вне разрешённых мест: ' + sel);
    if (/--core-point\b/.test(body)) assert.match(sel, /\.busydot|\.mark\.breathe|\.cursor|#micBtn\.on::after/, 'частица Ядра — только там, где ИИ работает: ' + sel);
  }
  assert.match(css, /\.core \.send:disabled\{[^}]*--core-fill-1/, 'нечего отправлять — кнопка остывает');
  assert.match(css, /\.core \.send\.stop \.s-stop\{display:block\}/, 'во время ответа отправка становится остановкой');
  // анимации-циклы выключаются при «уменьшить движение»
  for (const m of css.matchAll(/([^{}]*)\{[^{}]*animation:(?!none)[^{}]*\}/g)) assert.match(m[1], /:not\(\[data-core-motion=reduce\]\)/, 'цикл без оговорки про движение: ' + m[1].trim());
  assert.match(css, /@media \(prefers-reduced-motion:no-preference\)/);
  // телефон: шторка, безопасные области, размеры под палец
  for (const s of ['@media (max-width:860px)', 'env(safe-area-inset-bottom)', 'env(safe-area-inset-top', 'var(--core-hit)', '.core .side.mopen', '.core .overlay.on']) assert.ok(css.includes(s), 'есть ' + s);
  // текст на сцене защищён: в разговоре область чтения закрыта цветом сцены, в пустом чате под приветствием пятно
  assert.match(css, /\.core \.chat\{[^}]*background-color:var\(--core-scene\)/);
  assert.match(css, /\.core \.main\.empty \.top,\.core \.main\.empty \.chat\{background-color:transparent\}/);
  assert.match(css, /\.core \.hello::before\{[^}]*var\(--core-scene\)/);
  // без видеокарты свечение стоит
  assert.match(css, /\.core\[data-core-scene=glow\] \.core-scene::before,\.core\[data-core-scene=glow\] \.core-scene::after\{animation:none\}/);
});

test('чат: мост chat-legacy.css собран из старых файлов и не содержит уже переделанного', (t) => {
  const css = read('public/css/chat-legacy.css'), script = read('scripts/build-chat-legacy.py');
  for (const f of ['css/chat-main.css', 'theme/chat.gen.css', 'theme/app.css', 'growth.css', 'limits.css', 'chat-ui.css', 'ultra.css', 'anim.css', 'chat-visual.css']) {
    assert.ok(script.includes("'" + f + "'"), 'источник моста: ' + f);
    assert.ok(fs.existsSync(path.join(root, 'public', f)), 'старый файл не удалён до шага 8: ' + f);
  }
  // то, что теперь рисует core-chat.css, в мост не попало
  for (const sel of ['.side', '.box', '.send', '.msg', '.md p', '.hello', '.gw-bar', '.webbtn', '.item', '.plancard', '.tgcard', '.dock', '.top', '.col']) assert.ok(!new RegExp('(^|[},])' + sel.replace(/[.#]/g, '\\$&') + '(?![\\w-])', 'm').test(css), 'в мосте не должно быть правил для ' + sel);
  assert.doesNotMatch(css, /(^|[},])(html|body)[{,]/m, 'холст страницы принадлежит Core');
  // ещё не переделанные части (шаг 5) оформлены по-прежнему; части шага 4 из моста ушли в core-work.css (tests/core-work.test.js)
  for (const sel of ['.modal{', '.dlg{', '.menu{', '.menu.open{', '.opt{', '.toast{', '.tag{', '.pc-badge{', '.ulw{', '.lm-sec', '.btn{']) assert.ok(css.includes(sel), 'в мосте есть ' + sel);
  for (const sel of ['.pane{', '.pane.on{', '.fsmenu{', '.pre{', '.pre code{', '.art{', '.think{', '.steps{', '.runs{', '.animbar{', '.cv-code .hljs-keyword']) assert.ok(!css.includes(sel), 'в мосте больше нет ' + sel);
  assert.match(css, /^\.modal,\.menu,\.toast,\.ulw\{font:15\.5px\/1\.65 var\(--p-font\);color:var\(--p-text\)/m, 'корни старых частей получают шрифт и цвет, которые раньше наследовали от body');
  assert.doesNotMatch(css, /cursor:\s*pointer/, 'курсор-искра на всей странице: в мосте вместо системной руки форма «действие»');
  assert.match(css, /cursor:var\(--core-cursor-action\)/);
  // файл соответствует своим источникам (нужен python3 — как и тесту терминала)
  const r = spawnSync('python3', ['scripts/build-chat-legacy.py', '--check'], { cwd: root, encoding: 'utf8' });
  if (r.error) return t.diagnostic('python3 не найден — актуальность моста не проверена');
  assert.equal(r.status, 0, 'chat-legacy.css устарел: запустите python3 scripts/build-chat-legacy.py и поднимите ?v= в chat.html и en/chat.html\n' + r.stdout + r.stderr);
});

test('чат: 23-core-chat.js ведёт Ядро по событиям чата и не содержит ни логики чата, ни текстов', () => {
  const src = read('public/js/23-core-chat.js');
  assert.doesNotThrow(() => new vm.Script(src, { filename: '23-core-chat.js' }));
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
  assert.doesNotMatch(code.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, (s) => (/[А-Яа-яЁё]/.test(s) ? 'ТЕКСТ' : '')), /ТЕКСТ/, 'в скрипте нет текстов интерфейса — он один на RU и EN');
  assert.doesNotMatch(code, /[А-Яа-яЁё]/, 'кириллица — только в комментариях');
  for (const s of ["core.place(want)", "state: 'answering'", "core.state('thinking')", "core.pulse('error')", "core.pulse('key')", 'core.model(name)', 'core.stage(', "'listening'", 'CoreUI.light.scope(']) assert.ok(code.includes(s), 'есть ' + s);
  assert.match(code, /want = main\.classList\.contains\('empty'\) \? centre\(\) : 'horizon'/, 'пустой чат — Ядро в центре, разговор — у горизонта');
  assert.match(code, /if \(!r\.width \|\| wide < named \* 1\.15\) return 'center';/, 'в центре Ядро шире колонки с полем; где штатное место не меньше — берётся оно');
  assert.match(code, /if \(phase === 'rest'\) core\.target\(q\); core\.pulse\('key'\)/, 'набор текста не уводит поток точек от идущего ответа');
  // логику чата скрипт не трогает: не переопределяет её функции, не шлёт запросов, не пишет в состояние
  assert.doesNotMatch(code, /\b(function|const|let|var)\s+(send|stream|stop|render|renderChat|renderSend|renderSide|renderTop|grow|toast)\b/);
  assert.doesNotMatch(code, /\bfetch\(|XMLHttpRequest|\bS\.\w+\s*=[^=]|\.msgs\.(push|splice)|\bsave\(\)/);
  assert.doesNotMatch(code, /https?:\/\//, 'ничего не загружается с других адресов');
  // меню «+» строится из самих кнопок ряда: подписи берутся из разметки, нажатие передаётся кнопке
  assert.match(code, /const TOOLS = \['attachBtn', 'webBtn', 'imgBtn', 'fsBtn', 'agBtn'\]/);
  assert.match(code, /menu\.addEventListener\('core:select'/);
  // без видеокарты страница переходит на плотное стекло штатным признаком системы
  assert.match(code, /setAttribute\('data-core-transparency', 'reduce'\)/);
});

test('чат: лимит — кольцо Core вместо полосы, тихое при полном остатке', () => {
  const growth = read('public/js/15-growth.js'), limits = read('public/js/19-limits.js'), css = noComments(read('public/core/core-chat.css'));
  assert.match(growth, /function gwRing\(left, L, label, size\)/);   // шаг 5: размер кольца — четвёртым параметром (окна лимитов)
  assert.match(growth, /class="core-ring\$\{size === 'md' \? '' : ' core-ring--' \+ \(size \|\| 'sm'\)\}" role="meter" aria-label="\$\{esc\(label\)\}" aria-valuemin="0" aria-valuemax="\$\{esc\(L\)\}" aria-valuenow=/);
  assert.match(growth, /const meter = gwRing\(left, L, GWS\.left\(Math\.min\(left, L\), L\)\);/);
  assert.match(limits, /gwRing\(left, L, LM\.barLeft\(left, L\)\)/);
  for (const s of [growth, limits]) assert.doesNotMatch(s, /gw-meter/, 'полосы больше нет');
  // кольцо по умолчанию нейтральное; накал — только когда лимит на исходе; исчерпан — цвет статуса
  assert.match(css, /\.core \.gw-left \.core-ring\{--_c:var\(--core-text-3\)\}/);
  assert.match(css, /\.core \.gw-left\.low \.core-ring\{--_c:var\(--core-heat-3\)\}/);
  assert.match(css, /\.core \.gw-left\.out \.core-ring\{--_c:var\(--core-bad\)\}/);
  // кольцо считает остаток: полный лимит — 1, пусто — 0
  const ctx = { esc: (s) => String(s) }; vm.createContext(ctx);
  vm.runInContext(growth.slice(growth.indexOf('function gwRing'), growth.indexOf('function growthLimit')), ctx);
  assert.match(vm.runInContext("gwRing(20, 20, 'x')", ctx), /aria-valuenow="20" style="--core-ring-v:1"/);
  assert.match(vm.runInContext("gwRing(5, 20, 'x')", ctx), /aria-valuenow="5" style="--core-ring-v:0\.25"/);
  assert.match(vm.runInContext("gwRing(0, 20, 'x')", ctx), /aria-valuenow="0" style="--core-ring-v:0"/);
  assert.match(vm.runInContext("gwRing(-3, 20, 'x')", ctx), /aria-valuenow="0" style="--core-ring-v:0"/);
});

test('Ядро: область страницы (Core.stage) — «в центре» и «горизонт» встают по чату, а не по окну', () => {
  const s = makeScene(), C = s.Core;
  s.advance(1);
  assert.deepEqual({ ...C.stage() }, { left: 0, right: 0, top: 0, bottom: 0 }, 'по умолчанию область — всё окно');
  assert.equal(s.state.light[s.state.light.length - 1].x, 50);
  const n = s.state.light.length;
  assert.equal(C.stage({ left: 272 }), C, 'команда возвращает Core');
  s.advance(1);
  const l = s.state.light[s.state.light.length - 1];
  assert.ok(s.state.light.length > n && Math.abs(l.x - (272 + (1440 - 272) / 2) / 14.4) < 0.11, 'свет (и Ядро) встают по центру области: ' + JSON.stringify(l));
  assert.equal(l.y, 46, 'высота центра не изменилась');
  C.place('horizon'); s.advance(1);
  const h = s.state.light[s.state.light.length - 1];
  assert.ok(Math.abs(h.x - l.x) < 0.11 && h.y > 100, 'у горизонта — та же ось области: ' + JSON.stringify(h));
  const m = s.state.light.length; C.stage({ left: 272 }); s.advance(1);
  assert.equal(s.state.light.length, m, 'та же область — ничего не меняется');
  C.place('full'); s.advance(1);
  assert.equal(s.state.light[s.state.light.length - 1].x, 50, '«на весь экран» остаётся по окну');
  C.place('center').stage({ left: 0, right: 420 }); s.advance(1);
  assert.ok(Math.abs(s.state.light[s.state.light.length - 1].x - (1440 - 420) / 2 / 14.4) < 0.11, 'открыто окно результата справа — Ядро уходит влево');
  C.stage({}); s.advance(1);
  assert.equal(s.state.light[s.state.light.length - 1].x, 50, 'пустая область — снова всё окно');
  assert.equal(C.version, 3);
});

test('CoreUI.light.scope: свет пишется названным поверхностям, а не на <html>', () => {
  const src = read('public/core/core-ui.js');
  // маленькая страница: <html>, две поверхности из области, слой сцены и посторонний элемент
  const mk = (name) => { const st = {}; return { name, style: { setProperty: (k, v) => { st[k] = v; }, removeProperty: (k) => { delete st[k]; }, getPropertyValue: (k) => st[k] || '' }, _st: st, classList: { add() {}, remove() {}, contains: () => false, toggle() {} }, setAttribute() {}, getAttribute: () => null, hasAttribute: () => false, addEventListener() {}, removeEventListener() {}, dataset: {}, isConnected: true }; };
  const html = mk('html'), side = mk('side'), glass = mk('glass'), scene = mk('scene'), other = mk('other');
  const tokens = { '--core-x': '50', '--core-y': '46', '--core-light': '1', '--core-dur-3': '.01ms', '--core-dur-4': '.01ms' };
  const doc = { documentElement: html, body: mk('body'), addEventListener() {}, removeEventListener() {}, createElement: () => mk('new'), querySelector: () => null, getElementById: () => null,
    querySelectorAll: (sel) => { assert.equal(sel, '.side, .box-glass,.core-scene,.core-layers'); return [side, glass, scene]; } };
  const win = { document: doc, addEventListener() {}, removeEventListener() {}, getComputedStyle: (el) => ({ getPropertyValue: (k) => (el._st && el._st[k]) || tokens[k] || '' }), matchMedia: () => ({ matches: false, addEventListener() {} }),
    requestAnimationFrame: () => 0, cancelAnimationFrame() {}, setTimeout, clearTimeout, innerWidth: 1440, innerHeight: 900, navigator: { userAgent: '' }, location: { href: 'http://x/' }, console };
  win.window = win; win.self = win; win.globalThis = win;
  vm.createContext(win); vm.runInContext(src, win, { filename: 'core-ui.js' });
  const L = win.CoreUI.light;
  L.set({ x: 50, y: 46, light: 1 });
  assert.equal(html._st['--core-x'], '50', 'без области свет пишется на <html>, как на шагах 1–2');
  assert.equal(L.scope(), null);
  assert.equal(L.scope('.side, .box-glass'), L, 'scope возвращает CoreUI.light');
  assert.equal(html._st['--core-x'], undefined, 'записанное на <html> убрано: там остаются только значения места из стилей');
  assert.deepEqual([side._st['--core-x'], glass._st['--core-y'], scene._st['--core-light']], ['50', '46', '1'], 'поверхности сразу получили текущий свет');
  L.set({ x: 59.4, y: 112, light: 1.2 }, true);
  assert.deepEqual([side._st['--core-x'], glass._st['--core-y'], scene._st['--core-light']], ['59.4', '112', '1.2']);
  assert.equal(html._st['--core-light'], undefined, 'на <html> ничего не пишется — страница не пересчитывается целиком');
  assert.equal(other._st['--core-x'], undefined);
  assert.deepEqual({ ...L.get() }, { x: 59.4, y: 112, light: 1.2 }, 'get отдаёт текущий свет (от него летят уведомления)');
  L.scope(null); L.set({ light: 1 });
  assert.equal(html._st['--core-light'], '1', 'scope(null) возвращает запись на <html>');
});
