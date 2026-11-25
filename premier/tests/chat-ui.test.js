'use strict';
// Оформление чата: подключение файлов на RU и EN, синтаксис скрипта, наружу не уходят ключи моделей. node --test tests/chat-ui.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

// Редизайн, шаг 3: страница чата больше не подключает chat-ui.css напрямую. Его правила для ещё не переделанных частей
// (меню моделей, блоки кода) приходят в файле-мосте /css/chat-legacy.css, который собирает scripts/build-chat-legacy.py;
// остальное (подсказки, ошибки, поле ввода) теперь рисует /core/core-chat.css. Смысл проверки прежний: оформление
// из этого модуля доходит до RU и EN страницы, а 20-chat-ui.js подключён после 19-limits.js.
// Редизайн, шаг 4: блоки кода переведены на Core, их правила (.cu-n, .cu-long, .cu-more) теперь в core-work.css.
test('chat.html и en/chat.html получают оформление chat-ui (мост chat-legacy.css + core-chat.css + core-work.css) и 20-chat-ui.js после 19-limits.js', () => {
  assert.match(read('scripts/build-chat-legacy.py'), /'chat-ui\.css'/, 'chat-ui.css — среди источников моста');
  // редизайн, шаг 5: меню моделей переведено на Core — его части рисует core-dialogs.css, мост chat-legacy.css странице больше не нужен
  const dialogs = read('public/core/core-dialogs.css'), core = read('public/core/core-chat.css'), work = read('public/core/core-work.css');
  for (const s of ['.cu-dot', '.cu-badges', '.cu-scrim']) assert.ok(dialogs.includes(s), 'core-dialogs.css рисует ' + s);
  for (const s of ['.cu-n', '.cu-long', '.cu-more']) assert.ok(work.includes(s), 'core-work.css рисует ' + s);
  for (const s of ['.cu-cats', '.cu-acts', '.errbox']) assert.ok(core.includes(s), 'core-chat.css рисует ' + s);
  for (const p of ['public/chat.html', 'public/en/chat.html']) {
    const html = read(p);
    assert.match(html, /href="\/core\/core-dialogs\.css\?v=\d+"/, p);
    assert.doesNotMatch(html, /chat-legacy\.css/, p);
    assert.match(html, /href="\/core\/core-chat\.css\?v=\d+"/, p);
    assert.match(html, /href="\/core\/core-work\.css\?v=\d+"/, p);
    const a = html.indexOf('/js/19-limits.js'), b = html.indexOf('/js/20-chat-ui.js');
    assert.ok(a > 0 && b > a, p + ': 20-chat-ui.js подключается после 19-limits.js');
  }
});

test('20-chat-ui.js и 19-limits.js без синтаксических ошибок, стили — только переменные темы', () => {
  for (const p of ['public/js/20-chat-ui.js', 'public/js/19-limits.js']) assert.doesNotThrow(() => new vm.Script(read(p), { filename: p }));
  const css = read('public/chat-ui.css');
  assert.doesNotMatch(css.replace(/color:#fff/g, ''), /#[0-9a-f]{3,6}\b/i, 'цвета — через --p-*, чтобы работала тёмная тема');
});

test('список моделей для браузера не отдаёт ключи и адреса провайдеров, но отдаёт вес и «видит фото»', () => {
  const line = read('server.js').split('\n').find((l) => /const publicModel = /.test(l));
  assert.ok(line, 'publicModel найден');
  assert.doesNotMatch(line, /apiKey|baseUrl|nativeUrl/);
  assert.match(line, /weight/); assert.match(line, /vision/);
});
