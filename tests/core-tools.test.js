'use strict';
// Редизайн, шаг 7 — рабочие экраны: общий плотный слой (core-tools.css), страница статуса и правило
// «в public не осталось системных окон браузера». Кабинет разработчика и панель проверяют core-dev.test.js
// и core-admin.test.js.
// node --test tests/core-tools.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const noComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
// код без строк-комментариев и без хвостовых комментариев (в комментариях слова confirm и alert встречаются законно)
const code = (js) => js.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).map((l) => l.replace(/\s\/\/ .*$/, '')).join('\n');
const walk = (dir, out = []) => { for (const n of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) { const p = dir + '/' + n.name; if (n.isDirectory()) walk(p, out); else out.push(p); } return out; };

test('шаг 7: core-tools.css — только токены Core, без своего размытия и без cursor:pointer', () => {
  const css = noComments(read('public/core/core-tools.css'));
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i, 'нет литеральных цветов');
  assert.doesNotMatch(css, /backdrop-filter/, 'размытие задаёт материал (--_backdrop), а не этот файл');
  assert.doesNotMatch(css, /cursor:\s*pointer/, 'вместо cursor:pointer — var(--core-cursor-action)');
  assert.doesNotMatch(css, /\d(ms|s)\b(?![^;]*\))/, 'длительности — только токены');
  assert.doesNotMatch(css, /font(-size)?:\s*\d/, 'размеры шрифта — только токены');
  assert.doesNotMatch(css, /var\(--(?!core-|_|v\b|w\b)/, 'только токены --core-* и свои параметры компонентов');
  assert.doesNotMatch(css, /Unbounded/i);
});

test('шаг 7: плотное стекло собрано из токенов стекла и слушается запасных режимов', () => {
  const css = noComments(read('public/core/core-tools.css'));
  // без color-mix — непрозрачные цвета; с ним — смесь непрозрачного цвета и токена стекла, который в запасных режимах сам непрозрачен
  assert.match(css, /--core-glass-work:var\(--core-solid-far\)/);
  assert.match(css, /@supports \(color:color-mix\(in srgb,red,blue\)\)\{:root\{\s*--core-glass-work:color-mix\(in srgb,var\(--core-solid-far\) \d+%,var\(--core-glass-far\)\)/);
  assert.match(css, /\.core-glass--work\{--_fill:var\(--core-glass-work\);--_backdrop:var\(--core-backdrop-dense\)\}/, 'рабочее стекло: плотнее, размытие слабее (плотного стекла)');
  assert.match(css, /\.core-glass--flat\{--_fill:var\(--core-glass-flat\);--_backdrop:none\}/, 'под большими таблицами размытия нет');
  assert.match(css, /@media \(max-width:720px\)\{\.core-glass--work\{--_fill:var\(--core-glass-flat\);--_backdrop:none\}\}/, 'на телефоне рабочее стекло не размывается');
  const tokens = read('public/core/core-tokens.css');
  for (const t of ['--core-backdrop-dense', '--core-solid-far', '--core-glass-far', '--core-heat-3', '--core-heat-5', '--core-warn-soft', '--core-well']) assert.ok(tokens.includes(t + ':'), 'токен ' + t + ' есть в core-tokens.css');
});

test('шаг 7: общие части рабочих экранов описаны в core-tools.css', () => {
  const css = noComments(read('public/core/core-tools.css'));
  for (const sel of ['.core-head', '.core-pane', '.core-pane__head', '.core-toolbar', '.core-plate', '.core-table-wrap--work', '.core-table--dense', '.core-table--sticky', '.core-table--pin', '.core-table--stack', '.core-table__detail', '.core-table__sort', '.core-table__empty',
    '.core-form', '.core-form__group', '.core-form__legend', '.core-form__row', '.core-form__label', '.core-form__hint', '.core-form__ctl', '.core-form__error', '.core-form__foot', '.core-state', '.core-stats', '.core-stat', '.core-stat__value',
    '.core-chart', '.core-chart__plot', '.core-chart__bar', '.core-chart__line', '.core-chart__legend', '.core-empty', '.core-copy', '.core-secret', '.core-secret--once', '.core-nav', '.core-nav__item', '.core-kv', '.core-log', '.core-pager'])
    assert.ok(css.includes(sel + '{') || css.includes(sel + ',') || css.includes(sel + ' ') || css.includes(sel + '>') || css.includes(sel + ':') || css.includes(sel + '['), 'нет правила для ' + sel);
  // шапка таблицы остаётся на месте и не просвечивает
  assert.match(css, /\.core-table--sticky thead th\{position:sticky;top:0;[^}]*background:var\(--core-table-head\)/);
  // состояния формы: не сохранено, сохранено, ошибка — у строки и у всей формы
  for (const s of ['dirty', 'saved', 'error']) assert.match(css, new RegExp('\\.core-form__row\\[data-state=' + s + '\\]'), 'состояние строки ' + s);
  assert.match(css, /\.core-state\[data-state=saving\]::before\{animation:[^}]*var\(--core-ambient\)/, '«сохраняется» — единственное зацикленное движение, гаснет при «уменьшить движение»');
  // состояние читается не только по цвету: у предупреждения, ошибки и «нет» своя фигура метки
  assert.match(css, /\.core-state--warn::before[^{]*\{[^}]*clip-path:polygon/);
  assert.match(css, /\.core-state--bad::before[^{]*\{[^}]*transform:rotate\(45deg\)/);
  assert.match(css, /\.core-state--off::before[^{]*\{background:none;box-shadow:inset/);
  // секрет и адрес не переносятся: перенос ломает копирование
  assert.match(css, /\.core-copy__value,\.core-secret__value\{[^}]*white-space:nowrap[^}]*\}/);
  assert.match(css, /\.core-copy__value,\.core-secret__value\{[^}]*font:var\(--core-machine-2\)/);
  // графики — цветами Ядра
  assert.match(css, /--core-chart-1:var\(--core-heat-3\);--core-chart-2:var\(--core-heat-4\);--core-chart-3:var\(--core-heat-2\);--core-chart-4:var\(--core-heat-5\);--core-chart-0:var\(--core-text-3\)/);
  // телефон: таблица-список с подписями ячеек; касание — 44 px
  assert.match(css, /\.core-table--stack td\[data-label\]::before\{content:attr\(data-label\)/);
  assert.match(css, /@media \(pointer:coarse\)\{\.core-table--dense td\{height:var\(--core-hit\)\}\}/);
});

test('шаг 7: страница статуса — мини-ядро у каждой модели, состояние словом и меткой, история читается без цвета', () => {
  const html = read('public/status.html'), css = noComments(read('public/core/core-status.css'));
  for (const f of ['core-tokens.css', 'core-base.css', 'core-components.css', 'core-scene.css', 'core-tools.css', 'core-status.css']) assert.match(html, new RegExp('href="/core/' + f.replace('.', '\\.') + '\\?v=\\d+"'), 'подключён ' + f);
  assert.doesNotMatch(html, /tokens\.css\?v=\d+"[^>]*>\s*<link[^>]*href="\/(?!core\/)/, 'старых стилей нет');
  assert.doesNotMatch(html, /https?:\/\/(?!www\.w3\.org)/, 'ничего с других доменов');
  assert.doesNotMatch(html, /\stitle="/, 'системных подсказок нет');
  assert.match(html, /<header class="core-glass core-glass--far core-glass--work" data-core-at="top">/, 'шапка — стекло Core');
  assert.match(html, /<section class="core-glass core-glass--far core-glass--work core-pane board">/, 'модели — одна панель');
  // материал — классами стекла: своего размытия и своих цветов в стилях страницы нет
  assert.doesNotMatch(css, /backdrop-filter/); assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i); assert.doesNotMatch(css, /cursor:\s*pointer/);
  // три состояния света и четвёртое «нет данных»; у каждого слово и метка своей формы
  assert.match(html, /const STATE = \{ ok: \['steady', 'ok', 'работает'\], flick: \['flicker', 'warn', 'с перебоями'\], down: \['dark', 'bad', 'недоступна'\], na: \['dark', 'off', 'нет данных — первый пинг в течение 20 минут'\] \}/);
  assert.match(html, /<span class="core-mini core-mini--xl" data-core-model="' \+ esc2\(x\.name\) \+ '" data-core-cond="' \+ p\.cond \+ '"><\/span>/, 'форма мини-ядра — от имени модели, свет — от состояния');
  assert.match(html, /<span class="core-state core-state--' \+ p\.tone \+ ' m-state">/, 'состояние словом рядом с мини-ядром');
  // состояние считается по последнему пингу и двум часам до него
  const condOf = new Function(html.match(/function condOf\(x\) \{[\s\S]*?\n\}/)[0] + '; return condOf;')();
  const tl = (f) => Array.from({ length: 48 }, (_, i) => f(i));
  assert.equal(condOf({ probe: null }), 'na');
  assert.equal(condOf({ probe: { ok: true }, timeline: tl(() => 1) }), 'ok');
  assert.equal(condOf({ probe: { ok: true }, timeline: tl((i) => (i === 45 ? 2 : 1)) }), 'flick', 'отвечает, но час назад была ошибка');
  assert.equal(condOf({ probe: { ok: true }, timeline: tl((i) => (i === 20 ? 2 : 1)) }), 'ok', 'давняя ошибка видна в полоске, а не в свете');
  assert.equal(condOf({ probe: { ok: false }, timeline: tl((i) => (i === 47 ? 2 : 1)) }), 'flick', 'не ответила сейчас, но недавно отвечала');
  assert.equal(condOf({ probe: { ok: false }, timeline: tl((i) => (i > 30 ? 2 : 1)) }), 'down', 'не отвечает больше двух часов');
  // полоска: высота повторяет цвет; сегмент с ошибкой доступен с клавиатуры, причина — в подсказке и в имени
  assert.match(css, /\.tl i\.up \{ height: 100%;/); assert.match(css, /\.tl i\.down \{ position: relative; height: 45%;/); assert.match(css, /\.tl i \{ flex: 1; height: 3px;/);
  assert.match(html, /<i class="down" tabindex="0" role="img" aria-label="' \+ tip \+ '" data-core-tip="' \+ tip \+ '"><\/i>/);
  // обновление раз в минуту не пересоздаёт строки
  assert.match(html, /rows\.forEach\(\(el, i\) => patch\(el, j\[i\]\)\)/);
  // тексты страницы прежние
  for (const t of ['Статус моделей', 'моделей работают', ' — всё в порядке', ' — есть проблемы', 'аптайм 24ч: <b>', 'аптайм: накопление…', 'Не удалось загрузить статус моделей', 'пинг каждые 20 минут', 'зелёный сегмент — модель отвечала, красный — были ошибки, серый — данных пока нет'])
    assert.ok(html.includes(t), 'текст на месте: ' + t);
});

test('шаг 7: в public не осталось системных окон браузера (confirm, prompt, alert)', () => {
  const NATIVE = /(^|[^.\w$])(?:window\.)?(confirm|prompt|alert)\s*\(/;
  const left = [];
  for (const f of walk('public')) {
    if (!/\.(js|html)$/.test(f) || f === 'public/core/core-ui.js') continue;   // core-ui.js — сама капсула: её методы так и называются
    if (f.startsWith('public/vendor/')) continue;                              // сторонний код проверяется ниже отдельно
    code(read(f)).split('\n').forEach((l, i) => { const rest = l.replace(/CoreUI\.(confirm|prompt|alert)\s*\(/g, ''); if (NATIVE.test(rest)) left.push(f + ':' + (i + 1)); });
  }
  assert.deepEqual(left, [], 'системные окна: ' + left.join(', '));
  // сторонний xterm спрашивает confirm только в своём обработчике ссылок по умолчанию; терминал передаёт свой обработчик
  const vendor = walk('public/vendor').filter((f) => f.endsWith('.js') && NATIVE.test(read(f)));
  assert.deepEqual(vendor, ['public/vendor/xterm/xterm.js'], 'в стороннем коде системное окно только в xterm');
  for (const f of ['public/cloud.js', 'public/en/cloud.js']) {
    const js = read(f);
    assert.match(js, /const linkHandler = \{ activate: async \(e, uri\) => \{ if \(!\(await CoreUI\.confirm\(/, f + ': ссылки терминала спрашивает капсула Core');
    assert.match(js, /new Terminal\(\{[^}]*, linkHandler \}\)/, f + ': обработчик передан терминалу');
  }
  // старые общие скрипты, которые не подключала ни одна страница, удалены вместе со своими confirm
  for (const f of ['public/app.js', 'public/panel.js']) assert.ok(!fs.existsSync(path.join(root, f)), f + ' удалён');
});

test('шаг 7: версии изменённых общих файлов подняты на всех страницах, которые их грузят', () => {
  for (const p of ['public/chat.html', 'public/en/chat.html']) { assert.match(read(p), /\/cloud\.js\?v=8"/, p); assert.match(read(p), /\/language\.js\?v=3"/, p); }
  for (const p of ['public/index.html', 'public/login.html', 'public/en/index.html', 'public/en/login.html', 'public/en/privacy.html']) assert.match(read(p), /\/language\.js\?v=3"/, p);
  const pages = walk('public').filter((f) => f.endsWith('.html'));
  for (const p of pages) for (const m of read(p).matchAll(/\/core\/core-tools\.css\?v=(\d+)/g)) assert.equal(m[1], '1', p + ': core-tools.css одной версии на всех страницах');
});
