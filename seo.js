'use strict';
// SEO главной: заголовок и описание (можно переопределить SEO_TITLE / SEO_DESCRIPTION и *_EN), canonical и hreflang,
// Open Graph / Twitter-карточка с картинкой /og.png (/og-en.png), разметка schema.org, robots.txt и sitemap.xml.
// Всё собирается на сервере — превью в мессенджерах и поисковики видят теги без JavaScript.
const growth = require('./growth');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ldJson = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

// теги для <head>; plans — публичные тарифы (цены попадают в разметку schema.org)
function headTags(lang, origin, plans = []) {
  const en = lang === 'en', t = growth.texts(lang), url = origin + (en ? '/?lang=en' : '/'), img = origin + (en ? '/og-en.png' : '/og.png');
  const offers = (plans || []).filter((p) => p && Number.isFinite(Number(p.price))).map((p) => ({ '@type': 'Offer', name: String(p.name || p.id), price: String(Number(p.price)), priceCurrency: 'RUB' }));
  const ld = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Premier', url, description: t.seoDescription, applicationCategory: 'ProductivityApplication', operatingSystem: 'Web', inLanguage: en ? 'en' : 'ru', ...(offers.length ? { offers } : {}) };
  return [
    `<link rel="canonical" href="${esc(url)}">`,
    `<link rel="alternate" hreflang="ru" href="${esc(origin + '/')}"><link rel="alternate" hreflang="en" href="${esc(origin + '/?lang=en')}"><link rel="alternate" hreflang="x-default" href="${esc(origin + '/')}">`,
    `<meta property="og:type" content="website"><meta property="og:site_name" content="Premier"><meta property="og:locale" content="${en ? 'en_US' : 'ru_RU'}"><meta property="og:locale:alternate" content="${en ? 'ru_RU' : 'en_US'}">`,
    `<meta property="og:title" content="${esc(t.seoTitle)}"><meta property="og:description" content="${esc(t.seoDescription)}"><meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(img)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(t.seoTitle)}">`,
    `<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(t.seoTitle)}"><meta name="twitter:description" content="${esc(t.seoDescription)}"><meta name="twitter:image" content="${esc(img)}">`,
    `<script type="application/ld+json">${ldJson(ld)}</script>`,
  ].join('\n');
}
// FAQPage для поисковиков: вопросы и ответы берутся из блока «Частые вопросы» самой страницы
const plain = (h) => String(h).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
function faqItems(html) {
  return [...String(html).matchAll(/<details class="faq-item"[^>]*>\s*<summary>([\s\S]*?)<\/summary>\s*<div class="faq-a">([\s\S]*?)<\/div>\s*<\/details>/g)]
    .map((m) => ({ q: plain(m[1]), a: plain(m[2]) })).filter((x) => x.q && x.a);
}
function faqTag(html) {
  const items = faqItems(html); if (!items.length) return '';
  return `\n<script type="application/ld+json">${ldJson({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) })}</script>`;
}
// тарифы без скриптов: плиты строит скрипт страницы из /api/plans, поэтому в <noscript> кладётся их короткая
// серверная копия (название, цена за один срок, три лимита, кнопка). Со скриптами она не разбирается и не видна.
const ruWord = (n, a, b, c) => n % 10 === 1 && n % 100 !== 11 ? a : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? b : c;
function plansTag(lang, plans = []) {
  const en = lang === 'en', list = (plans || []).filter((p) => p && p.name), num = (n) => Number(n).toLocaleString(en ? 'en-US' : 'ru-RU');
  const lim = (n, ru, enWord, ruNone, enNone, ruTail) => en ? (n == null ? enNone : `${num(n)} ${enWord[n === 1 ? 0 : 1]} per day`) : (n == null ? ruNone : `${num(n)} ${ruWord(n, ...ru)}${ruTail}`);
  const tier = (p) => {
    const hot = p.tier === 1, paid = Number(p.price) > 0;
    const rows = [lim(p.msgs, ['сообщение', 'сообщения', 'сообщений'], ['message', 'messages'], 'Сообщения без ограничений', 'Unlimited messages', ' в день'),
      lim(p.code, ['запуск', 'запуска', 'запусков'], ['Python run', 'Python runs'], 'Python без ограничений', 'Unlimited Python', ' Python в день'),
      lim(p.sites, ['сайт', 'сайта', 'сайтов'], ['website', 'websites'], 'Сайты без ограничений', 'Unlimited websites', ' в день')];
    return `<div class="tier${hot ? ' hot' : ''}">${hot ? `<span class="tag">${en ? 'Popular' : 'Популярный'}</span>` : ''}<div><h3>${esc(p.name)}</h3><p class="d">${esc(p.desc || '')}</p></div>`
      + `<div class="pr2">${paid ? num(p.price) : '0'} ₽ <small>${paid ? `/ ${num(p.days)} ${en ? 'days' : 'дней'}` : en ? 'forever' : 'навсегда'}</small></div>`
      + `<ul>${rows.map((x) => `<li><svg><use href="#i-check"/></svg><span>${esc(x)}</span></li>`).join('')}</ul>`
      + `<a href="/chat" class="btn ${hot ? 'pri' : 'ghost'}">${paid ? (en ? 'Choose ' : 'Выбрать ') + esc(p.name) : en ? 'Start for free' : 'Начать бесплатно'}</a></div>`;
  };
  return `<div class="tiers rv${list.length >= 4 ? ' n4' : ''}" id="tiers">${list.length ? `<noscript>${list.map(tier).join('')}</noscript>` : ''}</div>`;
}
// подставить в index.html: <title>, <meta name="description">, теги вместо <!--SEO--> и тарифы для страницы без скриптов
function landing(html, lang, origin, plans) {
  const t = growth.texts(lang);
  return String(html)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(t.seoTitle)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(t.seoDescription)}">`)
    .replace('<!--SEO-->', headTags(lang, origin, plans) + faqTag(html))
    .replace(/<div class="tiers rv" id="tiers">\s*<\/div>/, () => plansTag(lang, plans));
}
// адрес панели управления сюда не пишем, чтобы не раскрывать его: она и так отдаётся с X-Robots-Tag: noindex
function robots(origin) {
  return ['User-agent: *', 'Allow: /', 'Disallow: /api/', 'Disallow: /chat', 'Disallow: /login', 'Disallow: /developers', 'Disallow: /r/', '', 'Sitemap: ' + origin + '/sitemap.xml', ''].join('\n');
}
function sitemap(origin, lastmod, extra = []) {
  const day = new Date(lastmod || Date.now()).toISOString().slice(0, 10);
  const alt = `<xhtml:link rel="alternate" hreflang="ru" href="${esc(origin + '/')}"/><xhtml:link rel="alternate" hreflang="en" href="${esc(origin + '/?lang=en')}"/><xhtml:link rel="alternate" hreflang="x-default" href="${esc(origin + '/')}"/>`;
  const url = (loc, prio, links = '') => `  <url><loc>${esc(loc)}</loc><lastmod>${day}</lastmod>${links}<priority>${prio}</priority></url>`;
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    url(origin + '/', '1.0', alt), url(origin + '/?lang=en', '0.8', alt), url(origin + '/privacy.html', '0.2'), url(origin + '/terms.html', '0.2'),
    ...extra.map((e) => `  <url><loc>${esc(e.loc)}</loc><lastmod>${new Date(e.lastmod || lastmod || Date.now()).toISOString().slice(0, 10)}</lastmod>${(e.alt || []).map(([hl, href]) => `<xhtml:link rel="alternate" hreflang="${hl}" href="${esc(href)}"/>`).join('')}<priority>${e.prio || '0.5'}</priority></url>`),
    '</urlset>', ''].join('\n');
}
module.exports = { headTags, landing, plansTag, robots, sitemap, faqItems };
