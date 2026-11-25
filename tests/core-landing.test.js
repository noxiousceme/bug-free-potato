'use strict';
// Редизайн, шаг 6 — страницы до продукта. Проверяет то, что отдаёт сервер: тарифы на главной видны без скриптов,
// а после входа через Google/GitHub страница входа получает признак «вход выполнен» и запасной переход в чат.
// node --test tests/core-landing.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { copyApp, seed, startServer, rm } = require('../test/helpers');
const seo = require('../seo');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('тарифы без скриптов: плиты приходят с сервера внутри <noscript>, на обоих языках', async (t) => {
  const dir = copyApp(); seed(dir);
  const s = await startServer(dir);
  t.after(async () => { await s.stop(); rm(dir); });
  const plans = (await s.req('GET', '/api/plans')).json.plans;
  assert.ok(plans.length >= 2);
  for (const [url, pick, free] of [['/', 'Выбрать ', 'Начать бесплатно'], ['/?lang=en', 'Choose ', 'Start for free']]) {
    const html = (await s.req('GET', url)).text;
    const m = html.match(/<div class="tiers rv( n4)?" id="tiers"><noscript>([\s\S]*?)<\/noscript><\/div>/);
    assert.ok(m, url + ': блок тарифов для страницы без скриптов');
    assert.equal(!!m[1], plans.length >= 4, url + ': четыре столбца только при четырёх тарифах');
    assert.equal(m[2].split('<div class="tier').length - 1, plans.length, url + ': плита на каждый открытый тариф');
    for (const p of plans) {
      assert.ok(m[2].includes(`<h3>${p.name}</h3>`), url + ': название ' + p.name);
      assert.ok(m[2].includes(p.price ? pick + p.name : free), url + ': кнопка ' + p.name);
    }
    assert.equal(m[2].split('class="btn pri"').length - 1, plans.filter((p) => p.tier === 1).length, url + ': раскалённая кнопка только у рекомендованного');
  }
  const en = (await s.req('GET', '/?lang=en')).text.match(/<noscript><div class="tier[\s\S]*?<\/noscript>/)[0];
  assert.ok(!/[А-Яа-яЁё]/.test(en), 'в английских плитах нет русского текста');
  assert.match(read('public/core/core-landing.css'), /\.tiers > noscript \{ display: contents; \}/);
});

test('тарифы без скриптов: текст экранируется, числа склоняются, пустой список не даёт <noscript>', () => {
  const tag = seo.plansTag('ru', [{ id: 'x', name: 'A<b>', price: 1290, days: 30, tier: 1, msgs: 21, code: 2, sites: null, desc: '"д"' }]);
  assert.ok(tag.includes('<h3>A&lt;b&gt;</h3>') && tag.includes('&quot;д&quot;'));
  assert.ok(tag.includes('21 сообщение в день') && tag.includes('2 запуска Python в день') && tag.includes('Сайты без ограничений'));
  assert.match(tag, /1\s290 ₽ <small>\/ 30 дней<\/small>/);
  assert.ok(seo.plansTag('en', [{ id: 'f', name: 'Free', price: 0, tier: 0, msgs: 1, code: null, sites: 3 }]).includes('1 message per day'));
  assert.equal(seo.plansTag('ru', []), '<div class="tiers rv" id="tiers"></div>');
  for (const page of ['public/index.html', 'public/en/index.html']) assert.match(read(page), /<div class="tiers rv" id="tiers">\s*<\/div>/, page + ': место под тарифы');
});

test('LOGIN_FLIGHT=on: /login?in=1 отдаётся вошедшему с признаком и запасным переходом; по умолчанию — сразу чат', async (t) => {
  const dir = copyApp(), dir2 = copyApp(); seed(dir); seed(dir2);
  const s = await startServer(dir, { LOGIN_FLIGHT: 'on' }), off = await startServer(dir2);
  t.after(async () => { await s.stop(); await off.stop(); rm(dir); rm(dir2); });
  const arrived = await s.req('GET', '/login?in=1', { token: 'tok1' });
  assert.equal(arrived.status, 200);
  assert.match(arrived.text, /window\.IN=true<\/script>/);
  assert.equal(arrived.headers.get('refresh'), '2; url=/chat');
  // без сессии это обычная страница входа: признака и перехода нет
  const guest = await s.req('GET', '/login?in=1');
  assert.equal(guest.status, 200);
  assert.ok(!guest.text.includes('window.IN=true') && guest.headers.get('refresh') == null);
  // вошедший без признака по-прежнему уходит в чат сразу; без настройки — и с признаком тоже
  for (const [srv, url] of [[s, '/login'], [off, '/login?in=1'], [off, '/login']]) {
    const plain = await srv.req('GET', url, { token: 'tok1' });
    assert.equal(plain.status, 302); assert.equal(plain.headers.get('location'), '/chat');
  }
  assert.match(read('server.js'), /Location: LOGIN_FLIGHT \? '\/login\?in=1' : '\/chat'/);
  for (const page of ['public/login.html', 'public/en/login.html']) {
    const html = read(page);
    assert.match(html, /if \(window\.IN\) \{[\s\S]*?window\.premierIn = \(\) => location\.replace\('\/chat'\);/, page);
  }
  const js = read('public/core/core-login.js');
  assert.match(js, /LIMIT = 700/); assert.match(js, /const late = setTimeout\(go, LIMIT\)/, 'чат не ждёт Ядро дольше 700 мс');
  assert.match(js, /performance\.now\(\) > LIMIT\) return go\(\)/, 'Ядро появилось поздно — чат без полёта');
  assert.match(js, /d\.type === 'ready'/, 'полёт начинается, когда Ядро нарисовано');
  assert.match(js, /if \(still\(\) \|\| weak\) go\(\);/, 'при уменьшении движения и на слабом устройстве — сразу в чат');
});
