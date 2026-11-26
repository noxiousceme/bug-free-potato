'use strict';
// Редизайн, шаг 5: окна и малые элементы чата в системе Core. Проверки без браузера: страница чата не подключает
// старых стилей, общее окно — оболочка Core и связка 25-core-dialogs.js, в скриптах чата нет системных окон браузера
// и подсказок title, уведомления идут через капсулу Core, правила системы в core-dialogs.css, тарифы, меню моделей,
// кольца лимитов, просмотр картинки, страница «нет сети».
// node --test tests/core-dialogs.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const PAGES = ['public/chat.html', 'public/en/chat.html'];
const noComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const CSS = () => noComments(read('public/core/core-dialogs.css'));
const ver = (html, re) => (re.exec(html) || [])[1];

// все скрипты, которые подключает страница чата (RU и EN), по её же разметке
function chatScripts() {
  const set = new Set();
  for (const p of PAGES) for (const m of read(p).matchAll(/<script[^>]*\ssrc="\/([^"?]+)(?:\?v=\d+)?"/g)) set.add('public/' + m[1]);
  return [...set].sort();
}
// код без строк-комментариев и без хвостовых комментариев (в комментариях слова confirm и title встречаются законно)
const code = (js) => js.split('\n').filter((l) => !/^\s*\/\//.test(l)).map((l) => l.replace(/\s\/\/ .*$/, '')).join('\n');

test('шаг 5: страница чата не подключает ни одного старого стиля; core-dialogs.css и 25-core-dialogs.js — последними', () => {
  const OLD = ['/tokens.css', '/css/chat-legacy.css', '/css/chat-main', '/theme/', '/growth.css', '/limits.css', '/chat-ui.css', '/ultra.css', '/anim.css', '/chat-visual.css', '/language.css', '/notices.css'];
  for (const p of PAGES) {
    const html = read(p);
    const sheets = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
    for (const s of sheets) {
      assert.match(s, /^\/core\/core-[a-z]+\.css\?v=\d+$/, p + ': на странице только стили Core с версией: ' + s);
      for (const o of OLD) assert.ok(!s.includes(o), p + ': старый стиль ' + o);
    }
    assert.equal(sheets[sheets.length - 1].split('?')[0], '/core/core-dialogs.css', p + ': стили окон — после чата и результата');
    assert.doesNotMatch(html, /<style[\s>]/, p + ': встроенных стилей нет');
    assert.match(html, /<script defer src="\/js\/24-core-work\.js\?v=\d+"><\/script>\n<script defer src="\/js\/25-core-dialogs\.js\?v=\d+"><\/script>/, p + ': связка окон — последним скриптом');
    assert.doesNotMatch(html, /var\(--p-/, p + ': старых токенов в разметке нет');
  }
  const [ru, en] = PAGES.map(read);
  for (const re of [/\/core\/core-dialogs\.css\?v=(\d+)/, /\/js\/25-core-dialogs\.js\?v=(\d+)/, /\/core\/core-ui\.js\?v=(\d+)/, /\/core\/core-scene\.js\?v=(\d+)/, /\/core\/core-components\.css\?v=(\d+)/, /\/js\/21-ultra\.js\?v=(\d+)/, /\/js\/17-team\.js\?v=(\d+)/, /\/announce\.js\?v=(\d+)/])
    assert.equal(ver(ru, re), ver(en, re), 'версия одинакова в RU и EN: ' + re);
  // старые файлы остаются на диске до шага 8: ими ещё пользуются другие страницы
  for (const f of ['public/tokens.css', 'public/growth.css', 'public/limits.css', 'public/ultra.css', 'public/chat-ui.css']) assert.ok(fs.existsSync(path.join(root, f)), f + ' удаляется только на шаге 8');
});

test('шаг 5: общее окно — оболочка Core; скрипты открывают его классом on, связка превращает класс в окно', () => {
  for (const p of PAGES) {
    const html = read(p);
    const m = /<div class="core-dialog modal" id="modal" hidden>\s*<div class="core-dialog__pane dlg" role="dialog" aria-modal="true" aria-labelledby="dtitle">\s*<div class="core-dialog__head dhead"><h2 class="core-dialog__title" id="dtitle"><\/h2><button type="button" class="[^"]*core-btn--icon[^"]*" id="dclose" aria-label="[^"]+"/.exec(html);
    assert.ok(m, p + ': #modal › .dlg › .dhead (#dtitle, #dclose) › #dbody — в разметке окна Core');
    assert.match(html, /<div class="core-dialog__body dbody" id="dbody"><\/div>/, p);
    assert.doesNotMatch(html, /id="toast"/, p + ': отдельного элемента уведомления нет');
    // окно — прямой потомок body: иначе position:fixed ломается под transform/фильтром предка (раздел 10 описания)
    const before = html.slice(0, m.index), depth = (before.match(/<div\b/g) || []).length - (before.match(/<\/div>/g) || []).length;
    assert.equal(depth, 0, p + ': #modal лежит прямо в body');
  }
  const js = read('public/js/25-core-dialogs.js');
  assert.match(js, /if \(!window\.CoreUI\) return;/, 'без Core связка не мешает странице');
  assert.match(js, /new MutationObserver\(sync\)\.observe\(modal, \{ attributes: true, attributeFilter: \['class'\] \}\)/, 'класс on у #modal → окно Core');
  assert.match(js, /CoreUI\.dialog\.open\(modal, \{ origin: origin\(\) \}\)/, 'окно рождается из точки нажатия');
  assert.match(js, /modal\.addEventListener\('core:beforeclose'[\s\S]{0,160}modal\.classList\.remove\('on'\)/, 'Esc и нажатие мимо снимают класс on: скрипты чата видят окно закрытым');
  assert.match(js, /document\.addEventListener\('pointerdown'[\s\S]{0,120}clientX/, 'точка нажатия запоминается: окно может открыться после ответа сервера');
  assert.match(js, /dataset\.face = /, 'смена раздела — поворот грани');
  assert.match(js, /if \(still\(\)\) return;/, 'при уменьшенном движении грань не поворачивается');
  assert.doesNotMatch(code(js).replace(/\/\*[\s\S]*?\*\//g, ''), /[А-Яа-яЁё]/, 'в связке нет текстов интерфейса');
  assert.doesNotMatch(code(js), /fetch\(|localStorage|\bS\.chats\b|\bsend\(/, 'в связке нет логики чата');
  // скрипты чата по-прежнему управляют окном классом on — этот контракт связка и обслуживает
  assert.match(read('public/js/06-pane.js'), /\$\('modal'\)\.classList\.remove\('on'\)/);
  assert.match(read('public/js/10-account.js'), /\$\('modal'\)\.classList\.add\('on'\)/);
  // окно Ultra-кредитов — тоже окно Core, открывается через CoreUI
  const ul = read('public/js/21-ultra.js');
  assert.match(ul, /root\.className = 'core-dialog ulw'/); assert.match(ul, /CoreUI\.dialog\.open\(/); assert.match(ul, /CoreUI\.dialog\.close\(/);
});

test('шаг 5: в скриптах чата нет системных окон браузера — только капсула Core', () => {
  const NATIVE = /(^|[^.\w$])(?:window\.)?(confirm|prompt|alert)\s*\(/;
  const left = [];
  for (const f of chatScripts()) {
    if (/\/core\/core-ui\.js$/.test(f)) continue;   // сама капсула: её методы так и называются
    code(read(f)).split('\n').forEach((l) => { const rest = l.replace(/CoreUI\.(confirm|prompt|alert)\s*\(/g, ''); if (NATIVE.test(rest)) left.push(f); });
  }
  // шаг 7: системных окон не осталось и в language.js — на страницах без toast и без CoreUI (вход, лендинг) сообщение
  // выводится строкой на самой странице
  assert.deepEqual(left, [], 'системные окна: ' + left.join(', '));
  assert.match(read('public/language.js'), /typeof window\.toast === 'function'\) window\.toast\(message\); else if \(window\.CoreUI\) window\.CoreUI\.alert\(message\); else note\(message\)/);
  assert.match(read('public/language.js'), /function note\(message\) \{[\s\S]*?setAttribute\('role', 'alert'\)/, 'запасное сообщение читается экранным диктором');
  // вызовы ждут ответа: await или .then, иначе «нет» ничего бы не отменяло
  let n = 0;
  for (const f of chatScripts()) {
    if (/\/core\/core-ui\.js$/.test(f)) continue;
    for (const m of code(read(f)).matchAll(/([^\n;{}]{0,60})CoreUI\.confirm\s*\(/g)) { n++; assert.match(m[1], /await\s*\(?\s*$|await \s*$|!\(await $|\(await $|^\s*$|return \s*$|[=(]\s*$/, f + ': CoreUI.confirm без ожидания ответа: …' + m[1]); }
  }
  assert.ok(n >= 17, 'все подтверждения переведены на капсулу (найдено ' + n + ')');
  // удаления — разрушительный вариант
  for (const [f, re] of [['public/js/09-events.js', /CoreUI\.confirm\(\{[^}]*danger: true/], ['public/js/08-projects.js', /CoreUI\.confirm\(\{[^}]*danger: true/], ['public/cloud.js', /CoreUI\.confirm\(\{[^}]*danger: true/], ['public/js/17-team.js', /CoreUI\.confirm\(\{[^}]*danger: true/]])
    assert.match(read(f), re, f + ': удаление подтверждается разрушительной капсулой');
  // Esc под капсулой не закрывает то, что лежит под ней
  for (const f of ['public/js/09-events.js', 'public/en/js/09-events.js']) assert.match(read(f), /capsuleEsc = e\.key === 'Escape' && !!document\.querySelector\('\.core-capsule:not\(\[data-core-state=closing\]\)'\)/, f);
});

test('шаг 5: подсказки — стеклянные (data-core-tip); title остался только у рамки предпросмотра', () => {
  for (const p of PAGES) {
    const titles = [...read(p).matchAll(/<(\w+)[^>]*\stitle="/g)].map((m) => m[1]);
    assert.deepEqual(titles, ['iframe'], p + ': title — только доступное имя iframe');
    assert.ok((read(p).match(/data-core-tip="/g) || []).length >= 18, p + ': подсказки страницы переведены');
    // доступное имя сохранено: у каждой кнопки-иконки с подсказкой есть aria-label или текст
    for (const m of read(p).matchAll(/<button\b[^>]*data-core-tip="[^"]*"[^>]*>(?:\s*<svg[^>]*>(?:<(?:use|path|circle|rect)[^>]*>|[^<])*<\/svg>\s*)*<\/button>/g)) assert.match(m[0], /aria-label="[^"]+"/, p + ': кнопка-иконка без имени: ' + m[0].slice(0, 90));
  }
  const bad = [];
  for (const f of chatScripts()) {
    if (/\/core\/core-(ui|scene)\.js$/.test(f)) continue;   // core-ui.js сам читает title, чтобы превратить его в подсказку
    code(read(f)).split('\n').forEach((l, i) => { if (/[\s"'`]title=\\?["'$]|[\w\])]\.title\s*=[^=]|setAttribute\(\s*['"]title['"]/.test(l.replace(/document\.title/g, ''))) bad.push(f + ':' + (i + 1)); });
  }
  assert.deepEqual(bad, [], 'скрипты чата не пишут title: ' + bad.join(', '));
});

test('шаг 5: уведомления — капсула Core с тоном; запасной очереди хватает до загрузки core-ui.js', () => {
  for (const f of ['public/js/07-attachments.js', 'public/en/js/07-attachments.js']) {
    const js = read(f);
    assert.match(js, /function toast\(t, tone\) \{/, f);
    assert.match(js, /if \(window\.CoreUI\) return CoreUI\.toast\(tone \? \{ text: t, tone \} : \{ text: t \}\);/, f);
    assert.match(js, /toast\.q/, f + ': вызов до загрузки Core не теряется');
    assert.doesNotMatch(js, /\$\('toast'\)/, f + ': старого элемента нет');
  }
  const tones = new Set();
  for (const f of chatScripts()) for (const m of code(read(f)).matchAll(/\btoast\((?:[^()]|\([^()]*\))*,\s*'(ok|bad|warn)'\)/g)) tones.add(m[1]);
  assert.deepEqual([...tones].sort(), ['bad', 'ok', 'warn'], 'три тона используются');
  const ui = read('public/core/core-ui.js');
  assert.match(ui, /toast/); assert.match(ui, /role', ?o\.tone === 'bad' \? 'alert' : 'status'|role="alert"|'alert'/, 'ошибка объявляется как alert');
});

test('шаг 5: core-dialogs.css — только токены Core, без своего размытия, движение — из токенов и гаснет при reduce', () => {
  const css = CSS();
  // QR-код обязан быть чёрным по белому в обеих темах: это единственные литеральные цвета файла
  const noQr = css.replace(/[^{}]*\.tfa-qr[^{}]*\{[^}]*\}/g, '');
  const values = noQr.replace(/(-webkit-)?mask(-image|-composite)?:[^;}]+/g, '').replace(/[^{}]*\{/g, '{');
  assert.doesNotMatch(values, /#[0-9a-f]{3,8}\b/i, 'нет литеральных цветов');
  assert.doesNotMatch(values, /rgba?\(|hsla?\(/i, 'нет литеральных цветов rgb()/hsl()');
  assert.doesNotMatch(css, /var\(--p-/, 'старых токенов нет');
  assert.doesNotMatch(css, /cursor:\s*pointer/, 'курсор — через токены');
  assert.doesNotMatch(css.replace(/\b0s\b/g, ''), /\d(ms|s)\b(?![^;{}]*\))/, 'длительности — только из токенов');
  assert.doesNotMatch(css, /font-family/, 'шрифты — только через токены голосов');
  assert.doesNotMatch(css, /Unbounded/i);
  for (const m of css.matchAll(/backdrop-filter:([^;}]+)/g)) assert.match(m[1].trim(), /^(none|var\(--core-backdrop-(far|mid|near|dense)\))$/, 'размытие — только материал Core или его отключение: ' + m[1]);
  // циклы — только под «движение разрешено»; разовые анимации идут на токенах длительности (при reduce они равны .01 мс)
  for (const m of css.matchAll(/([^{}]*)\{[^{}]*animation:((?!none)[^;{}]*)[^{}]*\}/g)) {
    if (/infinite/.test(m[2])) assert.match(m[1], /:not\(\[data-core-motion=reduce\]\)/, 'цикл без оговорки про движение: ' + m[1].trim());
    else assert.match(m[2], /var\(--core-dur-[1-4]\)|var\(--core-(ambient|scene-move)\)/, 'длительность анимации — токен: ' + m[1].trim());
  }
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\*\{transition:none!important;animation:none!important\}\}/, 'при уменьшенном движении окна появляются и исчезают сразу');
  // телефон: лист уважает безопасные зоны и экранную клавиатуру
  assert.match(noComments(read('public/core/core-components.css')), /\.core-dialog__pane[^{}]*\{[^}]*max-height:92dvh[^}]*padding-bottom:env\(safe-area-inset-bottom,0px\)/, 'лист не заходит под нижнюю безопасную зону');
  assert.match(css, /\.core :is\(\.modal,\.ulw\)\{padding-bottom:var\(--dlg-kb\)\}/, 'лист встаёт над экранной клавиатурой');
  assert.match(css, /env\(safe-area-inset-bottom,0px\)/); assert.match(css, /@media \(max-width:600px\)/);
});

test('шаг 5: янтарь в окнах — у одного главного действия; опасное — цветом ошибки без заливки', () => {
  const css = CSS();
  const rules = css.split('}').map((r) => r.split('{')).filter((r) => r.length >= 2).map((r) => [r[r.length - 2].trim(), r[r.length - 1]]);
  const heat = rules.filter(([, body]) => /--core-heat-[1-5]\b/.test(body)).map(([sel]) => sel);
  for (const sel of heat) assert.match(sel, /\.btn\.pri|\.pri\b|core-ring|\.lm-ring|\.ul-|\.plan|\.mcore|core-mini|\.gw-|\.tm-|\.ann|\.pay/, 'накал вне главного действия и частей Ядра: ' + sel);
  assert.match(css, /\.dangerb/, 'опасная кнопка есть');
  for (const [sel, body] of rules) if (/\.dangerb(?![\w-])/.test(sel) && !/\.solid/.test(sel) && /background:/.test(body)) assert.doesNotMatch(body, /background:var\(--core-bad\)[;}]?$/, 'опасная кнопка без сплошной красной заливки: ' + sel);
});

test('шаг 5: тарифы — три плиты на разной глубине, выбранная впереди, одна главная цена; Ядро ярче у старшего тарифа', () => {
  const css = CSS(), js = read('public/js/25-core-dialogs.js'), scene = read('public/core/core-scene.js');
  assert.match(css, /\.plans/); assert.match(css, /\.plan\.fwd/, 'выбранная плита выходит вперёд');
  assert.match(js, /c\.classList\.toggle\('fwd', n === i\)/); assert.match(js, /box\.dataset\.sel = String\(i\)/);
  assert.match(js, /Core\.lit\(cards\.length > 1 \? i \/ \(cards\.length - 1\) : 0\)/, 'яркость Ядра — по порядку тарифа');
  assert.match(js, /if \(window\.Core && Core\.lit\) Core\.lit\(0\)/, 'после закрытия окна яркость возвращается');
  assert.match(scene, /Core\.lit\(k\)/); assert.match(scene, /var lit = 0, LIT = 0\.9;/, 'не ярче 90 % покоя: текст окна остаётся читаемым');
  // содержимое карточки тарифа сохранено: старая цена, новая, скидка, пробный доступ
  for (const f of ['public/js/13-billing.js', 'public/en/js/13-billing.js']) { const b = read(f); for (const hook of ['class="plan', 'plans']) assert.ok(b.includes(hook), f + ': ' + hook); }
  // успешная оплата — одна вспышка Ядра
  const flash = chatScripts().filter((f) => /Core\.pulse\('flash'\)/.test(read(f)));
  assert.ok(flash.length >= 1, 'вспышка после оплаты: ' + flash.join(', '));
});

test('шаг 5: меню моделей — малые ядра, имя машинным голосом, три состояния; лимиты — кольцо Core', () => {
  const css = CSS(), js = read('public/js/25-core-dialogs.js');
  for (const f of ['public/js/04-render.js', 'public/en/js/04-render.js']) assert.match(read(f), /core-mini|data-core-model/, f + ': у строки модели своё малое ядро');
  assert.match(css, /\.core #menu/); assert.match(css, /\.opt\.on/); assert.match(css, /\.opt\.lock|\.opt\[disabled\]|\.opt\.locked|\.opt\.no/);
  assert.match(css, /--core-font-machine|--core-machine-/, 'машинный голос');
  assert.match(js, /e\.key === 'ArrowDown'/); assert.match(js, /e\.key === 'Home'/); assert.match(js, /mbtn\.setAttribute\('aria-expanded'/);
  // кольца лимитов вместо полос
  for (const f of ['public/js/15-growth.js', 'public/js/19-limits.js', 'public/js/10-account.js']) assert.match(read(f), /core-ring|gwRing\(/, f + ': лимит — кольцом');
});

test('шаг 5: картинка открывается в окне Core, а не в пустой вкладке', () => {
  const js = read('public/js/25-core-dialogs.js');
  assert.match(js, /window\.premierZoom = /); assert.match(js, /CoreUI\.dialog\.open\(zoom, \{ origin: img \}\)/, 'окно рождается из самой картинки');
  assert.match(js, /role="dialog" aria-modal="true" aria-labelledby="zoomName"/);
  for (const f of ['public/js/09-events.js', 'public/en/js/09-events.js']) assert.match(read(f), /if \(zi && typeof premierZoom === 'function'\) \{ premierZoom\(zi\); return; \}/, f);
});

test('шаг 5: страница «нет сети» — в системе Core, самодостаточная, обе темы, тексты прежние', () => {
  const html = read('public/offline.html');
  assert.doesNotMatch(html, /<link rel="stylesheet"|<script src=/, 'ничего не подгружает: кеша может не быть');
  assert.match(html, /--scene:#0B0A08/); assert.match(html, /prefers-color-scheme:light\)\{:root\{[^}]*--scene:#F1ECE3/, 'обе темы, значения — из core-tokens.css');
  const tokens = read('public/core/core-tokens.css');
  for (const v of ['#0B0A08', '#F1ECE3', '#F4EEE5', '#1B1714', '#FF8B2C', '#EE6A12']) assert.ok(tokens.includes(v), 'значение ' + v + ' есть в токенах');
  assert.doesNotMatch(html, /#E8A33D|#12110F|system-ui,-apple-system/, 'старого янтаря и старого фона нет');
  for (const t of ['Нет подключения к интернету', 'Premier работает онлайн. Проверьте сеть — страница откроется сама, как только связь вернётся.', 'Обновить', 'No internet connection', 'Reload', "addEventListener('online',()=>location.reload())"]) assert.ok(html.includes(t), 'текст и поведение сохранены: ' + t);
  assert.match(html, /prefers-reduced-motion:reduce/); assert.match(html, /focus-visible/);
  assert.match(read('public/sw.js'), /const PRE = \['\/offline\.html', '\/icons\/icon-192\.png'\];/, 'страница по-прежнему кладётся в кеш при установке');
  assert.match(read('public/sw.js'), /\^\\\/\(js\|en\\\/js\|theme\|fonts\|vendor\|icons\|core\|css\)\\\//, 'папка core кешируется установленным приложением');
});
