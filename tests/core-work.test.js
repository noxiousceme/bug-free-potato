'use strict';
// Редизайн, шаг 4: всё, что делает и отдаёт ИИ, в системе Core. Проверки без браузера: подключение файлов на RU и EN,
// сохранность id и классов, правила системы в core-work.css, палитры подсветки и терминала, журнал работы,
// окно результата (шапка, публикация, делитель, телефон), мост без переделанных частей.
// node --test tests/core-work.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const PAGES = ['public/chat.html', 'public/en/chat.html'];
const noComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const ver = (html, re) => (re.exec(html) || [])[1];
const CSS = () => noComments(read('public/core/core-work.css'));

// WCAG: относительная яркость и контраст
const lum = (hex) => { const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function themes() {
  const css = read('public/core/core-tokens.css');
  const dark = css.slice(css.indexOf(':root{'), css.indexOf('@supports (cursor'));
  const light = css.slice(css.indexOf(':root[data-theme=light]{'), css.indexOf('@media (prefers-reduced-motion'));
  const val = (block, name) => { const m = new RegExp('--core-' + name + ':([^;]+);').exec(block); return m ? m[1].trim() : null; };
  const get = (block, name) => { let v = val(block, name) ?? val(dark, name); for (let i = 0; i < 4 && v && v.startsWith('var('); i++) { const n = v.slice(11, -1); v = val(block, n) ?? val(dark, n); } return v; };
  return { dark: (n) => get(dark, n), light: (n) => get(light, n), css };
}

test('шаг 4: страница подключает core-work.css после core-chat.css, 24-core-work.js — после 23-го (за ним только связка окон шага 5); версии RU и EN совпадают', () => {
  for (const p of PAGES) {
    const html = read(p), head = html.slice(0, html.indexOf('</head>'));
    const a = head.indexOf('href="/core/core-chat.css?v='), b = head.indexOf('href="/core/core-work.css?v=');
    assert.ok(a > 0 && b > a, p + ': core-work.css подключён после core-chat.css, с ?v=');
    assert.match(html, /<script defer src="\/js\/23-core-chat\.js\?v=\d+"><\/script>\n<script defer src="\/js\/24-core-work\.js\?v=\d+"><\/script>\n<script defer src="\/js\/25-core-dialogs\.js\?v=\d+"><\/script>\n<script>window\.addEventListener/, p + ': 24-core-work.js и за ним 25-core-dialogs.js — последними из скриптов чата, с defer');
  }
  const [ru, en] = PAGES.map(read);
  for (const re of [/\/core\/core-work\.css\?v=(\d+)/, /\/core\/core-tokens\.css\?v=(\d+)/, /\/core\/core-dialogs\.css\?v=(\d+)/, /\/js\/24-core-work\.js\?v=(\d+)/, /\/js\/23-core-chat\.js\?v=(\d+)/,
    /js\/04-render\.js\?v=(\d+)/, /js\/06-pane\.js\?v=(\d+)/, /js\/08-projects\.js\?v=(\d+)/, /js\/12-picker\.js\?v=(\d+)/, /\/cloud\.js\?v=(\d+)/, /\/agent\.js\?v=(\d+)/, /\/folder\.js\?v=(\d+)/]) {
    assert.ok(ver(ru, re), 'есть ' + re); assert.equal(ver(ru, re), ver(en, re), 'версии RU и EN совпадают: ' + re);
  }
  // изменённые на шаге 4 файлы получили новый номер — иначе вернувшиеся пользователи год видели бы старые
  for (const [re, min] of [[/\/core\/core-tokens\.css\?v=(\d+)/, 2], [/\/core\/core-dialogs\.css\?v=(\d+)/, 1], [/\/js\/23-core-chat\.js\?v=(\d+)/, 2], [/\/js\/04-render\.js\?v=(\d+)/, 52], [/\/js\/06-pane\.js\?v=(\d+)/, 31], [/\/js\/08-projects\.js\?v=(\d+)/, 28], [/\/js\/12-picker\.js\?v=(\d+)/, 26], [/"\/cloud\.js\?v=(\d+)/, 6], [/"\/agent\.js\?v=(\d+)/, 11], [/"\/folder\.js\?v=(\d+)/, 4]]) assert.ok(+ver(ru, re) >= min, re + ' не ниже ' + min);
  assert.ok(fs.existsSync(path.join(root, 'public/js/24-core-work.js')) && !fs.existsSync(path.join(root, 'public/en/js/24-core-work.js')), 'скрипт один на RU и EN');
});

test('шаг 4: окно результата — стеклянная рама, шапка с иерархией, ничего не потеряно', () => {
  for (const p of PAGES) {
    const html = read(p), pane = html.slice(html.indexOf('<aside class="pane"'), html.indexOf('</aside>', html.indexOf('<aside class="pane"')));
    assert.match(pane, /<div class="pane-in core-glass" data-core-at="right">/, p + ': рама — стекло средней глубины');
    // делитель — настоящий разделитель с именем и клавиатурой
    assert.match(pane, /<div class="pane-grip" id="paneGrip" role="separator" aria-orientation="vertical" aria-controls="pane" aria-labelledby="ptitle" tabindex="0"><\/div>/, p);
    // порядок шапки: название, виды, тихая группа из пяти инструментов, публикация, закрыть
    const order = ['id="ptitle"', 'role="tablist"', 'class="ph-tools"', 'id="pPick"', 'id="pReload"', 'id="pOpen"', 'id="pDl"', 'id="pCopy"', 'id="pPub"', 'id="pClose"'].map((s) => pane.indexOf(s));
    assert.ok(order.every((i) => i > 0), p + ': все части шапки на месте');
    assert.deepEqual(order, [...order].sort((a, b) => a - b), p + ': название → виды → инструменты → публикация → закрыть');
    const tools = pane.slice(pane.indexOf('class="ph-tools"'), pane.indexOf('id="pPub"'));
    for (const id of ['pPick', 'pReload', 'pOpen', 'pDl', 'pCopy']) assert.match(tools, new RegExp('<button class="ib" id="' + id + '" data-core-tip="[^"]+" aria-label="[^"]+">'), p + ': тихая кнопка-значок с именем и подсказкой Core (шаг 5: вместо title): ' + id);
    // публикация — единственная кнопка шапки с подписью; подпись — первое слово её же имени
    const pub = /<button class="core-btn core-btn--sm ph-pub" id="pPub" data-core-tip="([^"]+)" aria-label="([^"]+)"><svg>.*?<\/svg><span>([^<]+)<\/span><\/button>/.exec(pane);
    assert.ok(pub, p + ': «Опубликовать» — кнопка с подписью');
    assert.ok(pub[2].startsWith(pub[3]) && pub[1] === pub[2], p + ': видимая подпись входит в имя кнопки, новых текстов нет');
    assert.equal((pane.match(/<span>[^<]+<\/span><\/button>/g) || []).length, 1, p + ': подпись в шапке только у публикации');
    for (const t of ['preview', 'code', 'versions']) assert.match(pane, new RegExp('<button data-tab="' + t + '"'), p + ': вид ' + t);
    // ожидание: точки собираются в очертания страницы; текст прежний
    assert.match(pane, /<div class="pwait hide" id="pWait"><div class="core-gather" aria-hidden="true">(<span class="core-gather__(block|line)"><\/span>){6}<\/div><p>[^<]+<\/p><\/div>/, p);
    assert.match(pane, /<iframe id="pFrame" title="[^"]+" sandbox="allow-scripts allow-forms allow-modals allow-popups allow-pointer-lock"><\/iframe>/, p + ': права страницы результата не менялись');
  }
  const ru = read('public/chat.html');
  for (const s of ['Превью сайта', 'Превью', 'Код', 'Версии', 'Выбрать элемент и попросить его изменить', 'Перезапустить', 'Открыть в новой вкладке', 'Опубликовать по ссылке', 'Скачать HTML', 'Копировать код', 'Закрыть', 'Сайт ещё пишется — превью появится, когда код будет готов']) assert.ok(ru.includes(s), 'текст на месте: ' + s);
});

test('шаг 4: core-work.css — только токены Core, без своего размытия; результат не тонируется и не размывается', () => {
  const css = CSS();
  const values = css.replace(/(-webkit-)?mask(-image|-composite)?:[^;}]+/g, '').replace(/[^{}]*\{/g, '{');
  assert.doesNotMatch(values, /#[0-9a-f]{3,8}\b/i, 'нет литеральных цветов');
  assert.doesNotMatch(values, /rgba?\(|hsla?\(/i, 'нет литеральных цветов rgb()/hsl()');
  assert.doesNotMatch(css, /var\(--p-|var\(--(?!core-|chat-|work-|_|w\b|h\b)/, 'только токены --core-* (и свои --work-*, --chat-*)');
  assert.doesNotMatch(css, /cursor:\s*pointer/, 'курсор — через токены');
  assert.doesNotMatch(css.replace(/\b0s\b/g, ''), /\d(ms|s)\b(?![^;{}]*\))/, 'длительности — только из токенов');
  assert.doesNotMatch(css, /font(-size)?:\s*[\d.]+(px|rem)/, 'размеры шрифта — только из шкалы');
  assert.doesNotMatch(css, /font-family/, 'шрифты — только через токены голосов');
  for (const m of css.matchAll(/backdrop-filter:([^;}]+)/g)) assert.equal(m[1].trim(), 'none', 'в стилях страницы backdrop-filter только выключается');
  assert.match(css, /@media \(min-width:861px\)\{\.core \.pane-in\{-webkit-backdrop-filter:none;backdrop-filter:none\}\}/, 'на компьютере рама окна не размывает ровную сцену');
  // страница результата: непрозрачный холст, никаких фильтров, прозрачности и слоёв поверх
  const frame = /\.core #pFrame\{([^}]*)\}/.exec(css)[1];
  assert.match(frame, /background:Canvas/); assert.match(frame, /color-scheme:light/);
  for (const m of css.matchAll(/([^{}]*#pFrame[^{}]*)\{([^}]*)\}/g)) assert.doesNotMatch(m[2], /filter|opacity|mix-blend|mask/, 'результат не трогают фильтры: ' + m[1]);
  assert.doesNotMatch(css, /\.pbody::(before|after)/, 'поверх сцены ничего не рисуется');
  assert.match(css, /\.core \.pbody\{[^}]*box-shadow:0 0 0 1px var\(--core-line\)/, 'рамка сцены — снаружи');
  assert.match(css, /\.core \.pane\.is-sizing #pFrame\{pointer-events:none\}/, 'пока тянут делитель, страница результата не перехватывает указатель');
  assert.match(css, /\.core \.pbody>\.hide\{display:none!important\}/, 'скрытый вид окна действительно скрыт');
  // анимации-циклы — только под «движение разрешено»
  for (const m of css.matchAll(/([^{}]*)\{[^{}]*animation:(?!none)[^{}]*\}/g)) assert.match(m[1], /:not\(\[data-core-motion=reduce\]\)/, 'цикл без оговорки про движение: ' + m[1].trim());
  assert.match(css, /@media \(prefers-reduced-motion:no-preference\)/);
  assert.match(css, /\.core\[data-core-motion=reduce\] \.pane-in\{transform:none\}/);
  // блок кода в ленте — без слоя с маской на всю высоту (вывод длинного кода идёт покадрово)
  assert.doesNotMatch(css, /\.core :is\([^)]*\.pre[^)]*\)::after/, 'у блока кода нет кромки-слоя');
  assert.doesNotMatch(css, /content-visibility/, 'content-visibility на сообщениях запрещён (раздел 13.8 описания)');
});

test('шаг 4: янтарь — только там, где работает машина; главное действие окна — светом', () => {
  const css = CSS();
  const rules = css.split('}').map((r) => r.split('{')).filter((r) => r.length >= 2).map((r) => [r[r.length - 2].trim(), r[r.length - 1]]);
  for (const [sel, body] of rules) {
    assert.doesNotMatch(body, /--core-heat-/, 'шкала накала напрямую не используется: ' + sel);
    if (/--core-point\b/.test(body)) assert.match(sel, /\.wl\.on|\.step\.on|\.think\.on|\.fsop\.run|\.building|\.gen\.draw|\.anim-prog|\.agspin/, 'частица Ядра — только у идущей работы: ' + sel);
  }
  assert.doesNotMatch(css, /core-btn--main/, 'второй янтарной кнопки на экране нет');
  assert.match(css, /\.core \.ph-pub\{[^}]*background:var\(--core-on\)[^}]*color:var\(--core-on-ink\)/, 'публикация — светлая заливка («включено — свет»)');
  assert.match(css, /\.core \.ph-pub\.on\{[^}]*background:transparent/, 'опубликовано — кнопка гаснет');
  assert.match(css, /\.core \.ph-pub\.on::after\{[^}]*background:var\(--core-ok\)/, 'и получает отметку статуса');
  assert.match(css, /\.btn\.pri\{background:var\(--core-on\)/, 'главное действие карточки — тоже светом');
  // статусы — только цветами статуса
  assert.match(css, /\.core \.fsop\.ask\{background:var\(--core-warn-soft\)/, 'ждёт разрешения — «внимание»');
  assert.match(css, /\.core \.fsop\.ask\.agdanger\{background:var\(--core-bad-soft\)/, 'удаление — «опасно»');
  assert.match(css, /\.core \.step\.bad,\.core \.step\.bad>svg\{color:var\(--core-bad\)\}/, 'сбой шага — цвет ошибки');
  assert.match(css, /\.core \.cldot\.on\{background:var\(--core-ok\)/, 'машина работает — «в порядке»');
  assert.match(css, /\.core \.clst\.bad\{color:var\(--core-bad\)\}/, 'машина недоступна — ошибка');
});

test('шаг 4: палитра подсветки — шкала накала и нейтральные, контраст не ниже 4.5:1 в обеих темах', () => {
  const t = themes();
  const NAMES = ['comment', 'punct', 'meta', 'string', 'number', 'keyword', 'tag', 'func', 'type', 'attr'];
  for (const theme of ['dark', 'light']) {
    const bg = t[theme]('solid-dense'), scene = t[theme]('scene');
    for (const n of NAMES) {
      const c = t[theme]('syn-' + n); assert.match(c || '', /^#[0-9A-F]{6}$/i, theme + ': --core-syn-' + n + ' задан');
      for (const b of [bg, scene]) assert.ok(ratio(c, b) >= 4.5, theme + ': ' + n + ' ' + c + ' на ' + b + ' = ' + ratio(c, b).toFixed(2));
    }
  }
  // «горячие» слова взяты из шкалы накала, нейтральные — из уровней текста
  assert.equal(t.dark('syn-keyword'), t.dark('heat-4')); assert.equal(t.dark('syn-number'), t.dark('heat-3')); assert.equal(t.dark('syn-func'), t.dark('heat-5'));
  assert.equal(t.dark('syn-comment'), t.dark('text-3')); assert.equal(t.dark('syn-punct'), t.dark('text-2'));
  assert.equal(t.light('syn-comment'), t.light('text-3')); assert.equal(t.light('syn-punct'), t.light('text-2')); assert.equal(t.light('syn-func'), t.light('text'));
  // в палитре нет холодных тонов: красный канал не меньше синего
  for (const theme of ['dark', 'light']) for (const n of NAMES) { const c = t[theme]('syn-' + n); assert.ok(parseInt(c.slice(1, 3), 16) >= parseInt(c.slice(5, 7), 16), theme + ': ' + n + ' — тёплый или нейтральный тон'); }
  // блоки кода чата раскрашены этими токенами
  const css = CSS();
  for (const [cls, tok] of [['hljs-comment', 'comment'], ['hljs-keyword', 'keyword'], ['hljs-string', 'string'], ['hljs-number', 'number'], ['hljs-title', 'func'], ['hljs-type', 'type'], ['hljs-attr', 'attr'], ['hljs-name', 'tag'], ['hljs-punctuation', 'punct'], ['hljs-meta', 'meta']])
    assert.match(css, new RegExp('\\.core \\.cv-code :is\\([^)]*\\.' + cls + '[^)]*\\)\\{color:var\\(--core-syn-' + tok + '\\)'), cls + ' → --core-syn-' + tok);
  assert.match(read('public/core/core-components.css'), /\.core-code \.hljs-keyword[^{]*\{color:var\(--core-syn-keyword\)\}/, 'компонент core-code использует те же токены');
});

test('шаг 4: палитра терминала — из токенов, обе темы, читается на плотном стекле', () => {
  const t = themes();
  const COLORS = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
  for (const theme of ['dark', 'light']) {
    const bg = t[theme]('term-bg'); assert.equal(bg, t[theme]('solid-dense'), theme + ': фон терминала — плотное стекло');
    assert.equal(t[theme]('term-fg'), t[theme]('text'));
    for (const n of [...COLORS.filter((c) => c !== 'black'), 'bright-black', 'bright-yellow', 'bright-white']) { const c = t[theme]('term-' + n); assert.match(c || '', /^#[0-9A-F]{6}$/i, theme + ': --core-term-' + n); assert.ok(ratio(c, bg) >= 4.5, theme + ': ' + n + ' ' + ratio(c, bg).toFixed(2)); }
    assert.match(t[theme]('term-select'), /^#[0-9A-F]{8}$/i, theme + ': выделение — цвет с прозрачностью в записи, которую понимает xterm');
  }
  assert.equal(t.dark('term-cursor'), t.dark('heat-3'), 'курсор терминала — частица Ядра');
  assert.equal(t.dark('term-red'), t.dark('bad')); assert.equal(t.dark('term-green'), t.dark('ok')); assert.equal(t.dark('term-yellow'), t.dark('warn'));
  assert.equal(t.light('term-red'), t.light('bad')); assert.equal(t.light('term-yellow'), t.light('warn'));
  // светлый блок токенов записан дважды и совпадает (системная настройка и data-theme=light)
  const a = /@media \(prefers-color-scheme:light\)\{:root:not\(\[data-theme=dark\]\)\{([\s\S]*?)\n\}\}/.exec(t.css)[1], b = /\n:root\[data-theme=light\]\{([\s\S]*?)\n\}/.exec(t.css)[1];
  assert.equal(a.trim(), b.trim());
  for (const f of ['public/cloud.js', 'public/en/cloud.js']) {
    const src = read(f);
    assert.doesNotThrow(() => new vm.Script(src, { filename: f }));
    assert.match(src, /function clTheme\(\) \{/, f); assert.match(src, /getPropertyValue\('--core-term-' \+ n\)/, f + ': цвета читаются из токенов');
    assert.match(src, /new Terminal\(\{ cursorBlink: true, fontSize: 13, lineHeight: 1\.3, fontFamily: clFont\(\), scrollback: 5000, theme: clTheme\(\) \}\)/, f);
    assert.match(src, /getPropertyValue\('--core-font-machine'\)/, f + ': шрифт терминала — машинный голос');
    assert.match(src, /document\.fonts\.load\('13px "JetBrains Mono"'\)/, f + ': шрифт загружен до замера ячейки');
    assert.doesNotMatch(src, /selectionBackground: 'rgba/, f + ': литеральных цветов темы не осталось');
    assert.match(src, /el\.classList\.toggle\('bad', !s \|\| !s\.ok\)/, f + ': сбой машины помечен для оформления');
  }
  const css = CSS();
  assert.match(css, /\.core \.clxt,\.core \.agpre\.clout\{[^}]*background:var\(--core-term-bg\)[^}]*color:var\(--core-term-fg\)/);
  assert.match(read('public/js/24-core-work.js'), /CLX\.term\.options\.theme = clTheme\(\)/, 'при смене темы палитра применяется заново');
});

test('шаг 4: журнал работы — одна строка с итогом и временем, шаги с состояниями, размышления оттуда же', () => {
  // код журнала (без комментариев) — от строки шага до таймера времени
  const logCode = (src) => src.slice(src.indexOf('const stepHtml ='), src.indexOf("document.querySelectorAll('[data-wl-from]')")).replace(/\/\/[^\n]*/g, '');
  assert.equal(logCode(read('public/js/04-render.js')), logCode(read('public/en/js/04-render.js')), 'код журнала в RU и EN совпадает буква в букву: своих текстов в нём нет, подписи берутся из существующих строк');
  for (const [f, running, done] of [['public/js/04-render.js', 'Размышляю…', 'Размышления'], ['public/en/js/04-render.js', 'Thinking…', 'Reasoning']]) {
    const src = read(f);
    assert.doesNotThrow(() => new vm.Script(src, { filename: f }));
    assert.match(src, /function stepRows\(m\) \{/, f); assert.match(src, /function logHtml\(m\) \{/, f);
    assert.ok(src.includes('${logHtml(m)}${fsHtml(m)}${agHtml(m)}${runsHtml(m)}'), f + ': журнал стоит первым в ответе, перед действиями и запусками');
    assert.ok(!src.includes('${thinkHtml(m)}${stepsHtml(m)}'), f + ': отдельной строки «думает» и списка шагов больше нет');
    // состояния шага: идёт / готов / не удался
    assert.ok(src.includes("bad: !on && ic === 'i-warn' && st.s !== 'fix' && st.s !== 'limit'"), f + ': сбой — только настоящая неудача, не «исправил» и не «шаги закончились»');
    assert.ok(src.includes("`<div class=\"step${r.on ? ' on' : ''}${r.bad ? ' bad' : ''}\">"), f);
    // строка-итог: состояние, след из значков, подпись, время; раскрытие запоминается; размышления — внутри
    assert.match(src, /<details class="wl\$\{on \? ' on' : ''\}\$\{rows\.some\(\(r\) => r\.bad\) \? ' bad' : ''\}" data-log="\$\{m\.id\}"\$\{open \? ' open' : ''\}><summary><span class="wl-st" aria-hidden="true"><\/span><span class="wl-ic" aria-hidden="true">\$\{strip\}<\/span>\$\{text\}\$\{time\}<\/summary><div class="wl-b">\$\{thinkHtml\(m\)\}/, f);
    assert.ok(src.includes('const open = LOG_OPEN.has(m.id) ? LOG_OPEN.get(m.id) : thinking;'), f + ': сам раскрыт только пока идут размышления; выбор пользователя важнее');
    assert.ok(src.includes('data-wl-from="${from}"') && src.includes("document.querySelectorAll('[data-wl-from]')"), f + ': время работы тикает без перерисовки чата');
    assert.ok(src.includes('<div class="think-b">'), f + ': текст размышлений по-прежнему обновляется на месте (05-chat.js ищет .think-b)');
    // тексты не добавлялись: подпись размышлений вынесена, а не написана заново
    assert.ok(src.includes("const thinkLabel = (m, on) => on ? '" + running + "' : '" + done + "'"), f);
    assert.equal(src.split("'" + running + "'").length, 2, f + ': строка «' + running + '» в файле одна');
    assert.doesNotMatch(logCode(src), /[А-Яа-яЁё]/, f + ': в коде журнала нет текстов интерфейса');
    assert.ok(src.includes('<div class="outs-keep">'), f + ': встроенных стилей у строки хранения нет');
    assert.ok(src.includes('<details class="validation-box" data-vs="${esc(v.status)}"'), f + ': статус проверки доступен оформлению');
    assert.ok(src.includes('<div class="core-gather" aria-hidden="true"><span class="core-gather__block"></span></div>') && !src.includes('dblobs'), f + ': картинка и видео готовятся «собирающимися точками»');
  }
  const css = CSS();
  for (const s of ['.core .wl>summary{', '.core .wl-st{', '.core .wl.on .wl-st::before{', '.core .wl.bad .wl-st{', '.core .wl-t{', '.core .wl-ms{', '.core .wl-ic{', '.core .wl-b{', '.core .step{', '.core .step.on{', '.core .think-b{', '.core .fsop.run .fss::before{']) assert.ok(css.includes(s), 'есть ' + s);
  assert.match(css, /\.core \.wl\{[^}]*font:var\(--core-machine-2\);font-variant-ligatures:none/, 'журнал — машинным голосом, без лигатур');
  assert.match(css, /\.core \.think-b\{[^}]*font:var\(--core-human-2\)/, 'размышления — человеческим');
  assert.match(css, /\.core \.wl\.on~\.md>\.cursor:only-child\{display:none\}/, 'пока идёт работа и текста нет, частица на экране одна');
});

test('шаг 4: версии, публикация и выбор элемента — крючки для оформления добавлены одинаково в RU и EN', () => {
  for (const pref of ['public/js/', 'public/en/js/']) {
    const pane = read(pref + '06-pane.js'), proj = read(pref + '08-projects.js'), pick = read(pref + '12-picker.js');
    for (const [f, src] of [['06-pane.js', pane], ['08-projects.js', proj], ['12-picker.js', pick]]) assert.doesNotThrow(() => new vm.Script(src, { filename: pref + f }));
    assert.ok(pane.includes('<button class="core-btn core-btn--sm" data-version-rollback '), pref);
    assert.ok(pane.includes("<div class=\"version-row${PremierVersions.same(v,active)?' act':''}${PremierVersions.same(v,selected)?' cur':''}\">"), pref + ': активная и просматриваемая версии отмечены');
    assert.ok(pane.includes('<small data-vs="${esc(v.validation?.status||\'\')}">'), pref + ': состояние проверки версии');
    assert.ok(pane.includes('<button class="core-btn core-btn--sm core-btn--quiet" data-version-view="') && pane.includes('<button class="core-btn core-btn--sm" data-version-activate="'), pref);
    assert.ok(pane.includes('<select id="versionCompare" class="core-input">'), pref + ': выбор версии для сравнения — поле Core');
    assert.ok(proj.includes("$('pPub').classList.toggle('on', !!pub);"), pref + ': «опубликовано» видно на кнопке');
    assert.ok(proj.includes("$('pPub').setAttribute('aria-busy', 'true');") && proj.includes("finally { $('pPub').removeAttribute('aria-busy'); }"), pref + ': пока публикация идёт, кнопка занята');
    assert.match(proj, /pb\.innerHTML = `<span>[^<]+<\/span><a href="\$\{esc\(url\)\}" target="_blank" rel="noopener">\$\{esc\(url\)\}<\/a><button data-pubcopy="\$\{esc\(url\)\}">[^<]+<\/button><button data-unpub>[^<]+<\/button>\$\{upgrade\}`;/, pref + ': разметка адресной строки прежняя');
    // рамка выбора рисуется внутри страницы пользователя: токенов там нет, значения системы записаны буквально
    assert.ok(pick.includes('border:1px solid #FFF4E3;outline:1px solid rgba(11,10,8,.7)') && !pick.includes('#5e9fe8'), pref + ': рамка выбора — в цветах системы');
    assert.ok(pick.includes('ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'), pref + ': имя элемента — машинным голосом');
  }
  const css = CSS();
  for (const s of ['.core .pubbar>a{', '.core .pubbar:not(.animbar)::before{', '.core .pub-upgrade{', '.core .animbar .anim-info{', '.core .anim-prog i{', '.core .version-row.cur{', '.core .version-row.act b::before{', '.core .diff-add{', '.core .diff-remove{', '.core .pane:has(#pPick.on) .pbody{', '.core .pwait .core-gather{']) assert.ok(css.includes(s), 'есть ' + s);
  assert.match(css, /\.core \.pubbar>a\{[^}]*font:var\(--core-machine-2\)/, 'адрес опубликованного результата — машинным голосом');
  for (const f of ['public/folder.js', 'public/en/folder.js', 'public/agent.js', 'public/en/agent.js']) assert.match(read(f), /m\.className = 'fsmenu core-glass core-glass--near';/, f + ': окна режимов — ближнее стекло');
});

test('шаг 4: 24-core-work.js — делитель, рождение окна, телефон; без логики чата и без текстов', () => {
  const src = read('public/js/24-core-work.js');
  assert.doesNotThrow(() => new vm.Script(src, { filename: '24-core-work.js' }));
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
  assert.doesNotMatch(code, /[А-Яа-яЁё]/, 'кириллица — только в комментариях: скрипт один на RU и EN');
  assert.doesNotMatch(code.replace(/'[^']*'|"[^"]*"/g, (s) => (/[A-Za-z]{3,} [A-Za-z]{3,} [A-Za-z]{3,}/.test(s) && !/[<=:;(]/.test(s) ? 'ТЕКСТ' : '')), /ТЕКСТ/, 'текстов интерфейса в скрипте нет');
  assert.doesNotMatch(code, /\b(function|const|let|var)\s+(send|stream|stop|render|renderChat|renderSend|paneUI|showArt|closeArt|publishArt|toast)\b/, 'функции чата не переопределяются');
  assert.doesNotMatch(code, /\bfetch\(|XMLHttpRequest|\bS\.\w+\s*=[^=]|\.msgs\.(push|splice)|\bsave\(\)|\bshowArt\(|\bcloseArt\(/, 'ни запросов, ни записи в состояние, ни прямых вызовов логики окна');
  assert.doesNotMatch(code, /https?:\/\//, 'ничего не загружается с других адресов');
  // делитель: указатель с захватом, не чаще кадра, клавиатура, запоминание, границы
  for (const s of ["grip.addEventListener('pointerdown'", 'grip.setPointerCapture(e.pointerId)', "grip.addEventListener('keydown'", "grip.addEventListener('dblclick', resetWidth)", "pane.style.setProperty('--work-pane', w + 'px')", "localStorage.setItem(KEY, String(w))", "grip.setAttribute('aria-valuenow'", "pane.classList.toggle('is-sizing', on)"]) assert.ok(code.includes(s), 'есть ' + s);
  assert.match(code, /var KEY = 'premier:pane-w', MIN = 320, CHAT_MIN = 360;/);
  assert.match(code, /if \(queued\) return; queued = true;\s*raf\(function \(\) \{ queued = false; if \(drag\) setWidth\(drag\.now\); \}\);/, 'ширина меняется не чаще раза за кадр');
  // рождение из Ядра: точка — из света Ядра; искра — штатная, и только когда движение разрешено
  assert.ok(code.includes('CoreUI.light.get()') && code.includes("inner.style.setProperty('--work-ox'") && code.includes("g.className = 'core-glint'"));
  assert.match(code, /function spark\(p\) \{\s*if \(still\(\)\) return;/);
  // телефон: переключатель строится из названий чата и результата, нажатия передаются существующим кнопкам
  assert.ok(code.includes("d.className = 'view-sw'") && code.includes("byId('pClose')") && code.includes("col.querySelectorAll('[data-art]')"));
  assert.match(code, /if \(b\.dataset\.view === 'chat' && open\) \{ var x = byId\('pClose'\); if \(x\) x\.click\(\); \}\s*else if \(b\.dataset\.view === 'result' && !open\) \{ var c = lastCard\(\); if \(c\) c\.click\(\); \}/);
  // клавиатура: вкладки стрелками, окна режимов закрываются Esc
  assert.ok(code.includes("k === 'ArrowRight'") && code.includes("e.key !== 'Escape'"));
  assert.match(read('public/js/23-core-chat.js'), /CoreUI\.light\.scope\('\.side, \.box-glass, #sugg, \.pane-in'\)/, 'свет Ядра пишется и раме окна результата');
  const css = CSS();
  for (const s of ['@media (max-width:860px)', '.core .pane{position:fixed;inset:0;z-index:40', 'env(safe-area-inset-bottom)', 'env(safe-area-inset-top', 'var(--core-hit)', '.core .view-sw{display:grid', '.core .top.has-sw .crumb{display:none}', '.core .pane.has-sw #pClose{display:none}', '.core .phead{display:contents}', '@container pane (max-width:760px)']) assert.ok(css.includes(s), 'есть ' + s);
  assert.match(css, /\.core \.pane\{[^}]*--work-pane:clamp\(380px,calc\(100vw - var\(--work-side\) - 560px\),820px\)/, 'по умолчанию чату остаётся 560 px — поле ввода не уходит в узкий режим');
  assert.match(css, /--_w:max\(320px,min\(var\(--work-pane\),calc\(100vw - var\(--work-side\) - var\(--work-chat-min\)\)\)\)/, 'и никогда меньше 360 px');
});

test('шаг 4: мост chat-legacy.css — переделанных частей в нём нет, части шага 5 на месте', () => {
  const css = noComments(read('public/css/chat-legacy.css')), script = read('scripts/build-chat-legacy.py');
  for (const sel of ['.pane', '.pane-in', '.phead', '.tabs', '.pbody', '.pubbar', '.animbar', '.pre', '.cv-code', '.art', '.pack', '.fileb', '.think', '.steps', '.step', '.runs', '.run', '.outs', '.gens', '.gen', '.fsop', '.fsops', '.fsmenu', '.clw', '.clxt', '.clrow', '.agset', '.agpre', '.validation-box', '.version-panel', '.diff-add'])
    assert.ok(!new RegExp('\\' + sel + '(?![\\w-])').test(css), 'в мосте не должно остаться правил про ' + sel);
  for (const k of ['dblob', 'ddots', 'dpen', 'genIn', 'genShim', 'fsmIn', 'agsp']) assert.ok(!css.includes('@keyframes ' + k + '{'), 'анимация переделанной части убрана: ' + k);
  for (const sel of ['.modal{', '.dlg{', '.menu{', '.opt{', '.toast{', '.btn{', '.btn.pri{', '.field', '.ulw{', '.acc-nav', '.plan{', '.dim{', 'svg{']) assert.ok(css.includes(sel), 'в мосте осталось ' + sel);
  assert.match(script, /^CLAIM = '''/m); assert.match(script, /return bool\(CLAIMED\.search\(sel\)\) or \(bool\(LEAD\.match\(sel\)\) and not KEEP\.search\(sel\)\)/);
  // всё, что убрано из моста, оформлено заново
  const work = CSS();
  for (const s of ['.core .pre{', '.core .pre .bar{', '.core .cv-code.cv-ln .cv-l::before{', '.core .pre.cu-long:not(.cu-open) pre{', '.core .cu-more{', '.core .art{', '.core .art.cur{', '.core .pack{', '.core .fileb{', '.core .outs{', '.core .ofile{', '.core .imgw{', '.core .gens{', '.core .gen.draw{', '.core .gen-dl{', '.core .runs{', '.core .outp{', '.core .fsop{', '.core .fsdiff{', '.core .dl.add{', '.core .fsbtns{', '.core .fsmenu{', '.core .clw{', '.core .cllist{', '.core .clrow{', '.core .clin{', '.core .agset{', '.core .agcmd{', '.core .validation-box{', '.core .version-panel{'])
    assert.ok(work.includes(s), 'core-work.css оформляет ' + s);
  // общий .btn остаётся в мосте для окон шага 5, поэтому внутри частей шага 4 он задан целиком
  assert.match(work, /\.core :is\(\.msg,\.pane,\.clw,\.agset\) \.btn\{[^}]*width:auto;height:auto;min-height:var\(--core-h-sm\)[^}]*border:0;border-radius:var\(--core-r-sm\);background:var\(--core-fill-1\)[^}]*font:var\(--core-human-1\)/);
});
