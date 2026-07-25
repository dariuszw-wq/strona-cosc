/*!
 * COSC i18n — lekki silnik tłumaczeń dla statycznej strony (GitHub Pages)
 * -----------------------------------------------------------------------
 * Zasada działania:
 *  - Polski (pl) jest językiem źródłowym — teksty w HTML są kluczami.
 *  - Dla innych języków wczytujemy plik i18n/<lang>.json ze słownikiem
 *    { "polski tekst / HTML bloku": "tłumaczenie" }.
 *  - Pusta wartość lub brak klucza = fallback do polskiego (strona zawsze działa).
 *  - Przełączanie języka jest natychmiastowe (bez przeładowania) — oryginalny
 *    polski HTML jest cache'owany, więc można przełączać w tę i z powrotem.
 *
 * Jak dodać tłumaczenia: uzupełnij wartości w plikach i18n/en.json, es.json,
 * uk.json, ru.json, fr.json. Klucze wygenerowane automatycznie z index.html
 * (patrz i18n/pl.json — lista wszystkich tekstów źródłowych).
 *
 * WAŻNE: reguła wyboru elementów (LANGS, BLOCK, SKIP, collapse, walk) musi być
 * identyczna z narzędziem ekstrakcji i18n/extract.js, aby klucze się zgadzały.
 */
(function () {
  'use strict';

  // Kolejność = kolejność w przełączniku
  var LANGS = [
    { code: 'pl', label: 'PL', name: 'Polski' },
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'es', label: 'ES', name: 'Español' },
    { code: 'uk', label: 'UK', name: 'Українська' },
    { code: 'ru', label: 'RU', name: 'Русский' },
    { code: 'fr', label: 'FR', name: 'Français' }
  ];

  // Prawdziwe flagi krajów jako SVG (emoji flag NIE renderują się na Windows).
  var _uid = 0;
  var FLAGS = {
    pl: '<svg viewBox="0 0 24 16"><rect width="24" height="16" fill="#fff"/><rect y="8" width="24" height="8" fill="#dc143c"/></svg>',
    es: '<svg viewBox="0 0 24 16"><rect width="24" height="16" fill="#c60b1e"/><rect y="4" width="24" height="8" fill="#ffc400"/></svg>',
    uk: '<svg viewBox="0 0 24 16"><rect width="24" height="8" fill="#0057b7"/><rect y="8" width="24" height="8" fill="#ffd700"/></svg>',
    ru: '<svg viewBox="0 0 24 15"><rect width="24" height="15" fill="#fff"/><rect y="5" width="24" height="5" fill="#0039a6"/><rect y="10" width="24" height="5" fill="#d52b1e"/></svg>',
    fr: '<svg viewBox="0 0 24 16"><rect width="8" height="16" fill="#0055a4"/><rect x="8" width="8" height="16" fill="#fff"/><rect x="16" width="8" height="16" fill="#ef4135"/></svg>',
    // Wielka Brytania (flaga dla English) — clipPath z unikalnym ID (%U%)
    en: '<svg viewBox="0 0 60 30">' +
        '<clipPath id="gbs%U%"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>' +
        '<rect width="60" height="30" fill="#012169"/>' +
        '<path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/>' +
        '<path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#gbs%U%)" stroke="#C8102E" stroke-width="4"/>' +
        '<path d="M30,0 V30 M0,15 H60" stroke="#fff" stroke-width="10"/>' +
        '<path d="M30,0 V30 M0,15 H60" stroke="#C8102E" stroke-width="6"/>' +
        '</svg>'
  };
  function flagMarkup(code) {
    var s = FLAGS[code] || FLAGS.pl;
    return s.replace(/%U%/g, 'f' + (_uid++));
  }
  var DEFAULT_LANG = 'pl';
  var STORAGE_KEY = 'cosc_lang';
  var BASE = getBase();          // ścieżka do folderu i18n/ względem strony
  var CODES = LANGS.map(function (l) { return l.code; });

  // Elementy strukturalne — jeśli element ma potomka z tej listy, wchodzimy głębiej;
  // w przeciwnym razie element jest "liściem" i tłumaczymy jego innerHTML w całości.
  var BLOCK = ['div','section','header','footer','nav','main','article','aside',
    'ul','ol','dl','li','dd','dt','p','h1','h2','h3','h4','h5','h6',
    'summary','details','form','table','thead','tbody','tr','td','th','figure','figcaption'];
  var BLOCK_SEL = BLOCK.join(',');

  // Pomijane gałęzie (nie tłumaczymy)
  var SKIP_SEL = 'script,style,svg,.rotator,.lang,.langbox,.n,.cnt,.rc-mrz,[data-i18n-skip],[translate="no"]';

  // Atrybuty do tłumaczenia (klucz = wartość atrybutu w PL)
  var ATTRS = ['aria-label', 'title', 'placeholder', 'alt'];

  var originals = [];   // [{el, html}] — oryginalny polski HTML liści
  var attrOrig = [];    // [{el, attr, val}]
  var dictCache = {};   // lang -> słownik
  var current = DEFAULT_LANG;
  var extracted = false;
  var origTitle = '';   // oryginalny <title> (PL) — klucz per strona
  var descEl = null;    // <meta name="description">
  var origDesc = '';    // oryginalny opis (PL)

  /* ---------- pomocnicze ---------- */

  function getBase() {
    var s = document.currentScript;
    if (s && s.src) return s.src.replace(/[^\/]*$/, ''); // folder skryptu = .../i18n/
    return 'i18n/';
  }

  function collapse(s) {
    return String(s).replace(/\s+/g, ' ').trim();
  }

  function isSkipped(el) {
    return el.matches && el.matches(SKIP_SEL);
  }

  function pickLang() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q && CODES.indexOf(q) >= 0) return q;
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      if (s && CODES.indexOf(s) >= 0) return s;
    } catch (e) {}
    var htmlLang = (document.documentElement.getAttribute('lang') || '').slice(0, 2);
    if (CODES.indexOf(htmlLang) >= 0) return htmlLang;
    return DEFAULT_LANG;
  }

  /* ---------- ekstrakcja liści ---------- */
  // Zwraca listę elementów-liści (tekst + tylko elementy inline w środku).
  function collectLeaves(root, out) {
    out = out || [];
    var kids = root.children;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (isSkipped(el)) continue;
      var tag = el.tagName.toLowerCase();
      if (tag === 'svg' || tag === 'script' || tag === 'style') continue;
      // czy w poddrzewie jest element blokowy lub grafika svg?
      var hasBlock = el.querySelector ? el.querySelector(BLOCK_SEL) : null;
      var hasSvg = el.querySelector ? el.querySelector('svg') : null;
      if (!hasBlock && !hasSvg) {
        if (collapse(el.textContent).length) out.push(el);
      } else {
        collectLeaves(el, out);
      }
    }
    return out;
  }

  function snapshot() {
    if (extracted) return;
    var leaves = collectLeaves(document.body, []);
    for (var i = 0; i < leaves.length; i++) {
      originals.push({ el: leaves[i], html: leaves[i].innerHTML });
    }
    // atrybuty
    var all = document.querySelectorAll('[' + ATTRS.join('],[') + ']');
    for (var j = 0; j < all.length; j++) {
      var el = all[j];
      if (isSkipped(el)) continue;
      for (var k = 0; k < ATTRS.length; k++) {
        var v = el.getAttribute(ATTRS[k]);
        if (v && collapse(v).length) attrOrig.push({ el: el, attr: ATTRS[k], val: v });
      }
    }
    origTitle = document.title || '';
    descEl = document.querySelector('meta[name="description"]');
    origDesc = descEl ? (descEl.getAttribute('content') || '') : '';
    extracted = true;
  }

  /* ---------- lista kluczy (dla generatora / testów) ---------- */
  window.__i18nKeys = function () {
    snapshot();
    var seen = {}, keys = [];
    originals.forEach(function (o) {
      var k = collapse(o.html);
      if (!seen[k]) { seen[k] = 1; keys.push(k); }
    });
    var meta = collapse(document.title);
    var desc = document.querySelector('meta[name="description"]');
    var out = { title: document.title, description: desc ? desc.getAttribute('content') : '', strings: keys };
    return out;
  };

  /* ---------- zastosowanie języka ---------- */
  function applyDict(dict) {
    var strings = (dict && dict.strings) || {};
    originals.forEach(function (o) {
      var key = collapse(o.html);
      var t = strings[key];
      o.el.innerHTML = (typeof t === 'string' && t.length) ? t : o.html;
    });
    attrOrig.forEach(function (a) {
      var key = collapse(a.val);
      var t = strings[key];
      a.el.setAttribute(a.attr, (typeof t === 'string' && t.length) ? t : a.val);
    });
    // <title> i meta description — tłumaczone po tekście źródłowym PL (klucz per strona),
    // z awaryjnym polem dict.title/description (zgodność wstecz).
    var tt = strings[collapse(origTitle)];
    document.title = (typeof tt === 'string' && tt.length) ? tt : ((dict && dict.title) || origTitle);
    if (descEl) {
      var td = strings[collapse(origDesc)];
      descEl.setAttribute('content', (typeof td === 'string' && td.length) ? td : ((dict && dict.description) || origDesc));
    }
  }

  function restorePL() {
    originals.forEach(function (o) { o.el.innerHTML = o.html; });
    attrOrig.forEach(function (a) { a.el.setAttribute(a.attr, a.val); });
    if (origTitle) document.title = origTitle;
    if (descEl) descEl.setAttribute('content', origDesc);
  }

  function loadDict(lang) {
    if (dictCache[lang]) return Promise.resolve(dictCache[lang]);
    return fetch(BASE + lang + '.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { dictCache[lang] = d; return d; })
      .catch(function (e) { console.warn('[i18n] brak/nieczytelny słownik ' + lang, e); return null; });
  }

  function setLang(lang, opts) {
    opts = opts || {};
    if (CODES.indexOf(lang) < 0) lang = DEFAULT_LANG;
    snapshot();
    current = lang;
    document.documentElement.setAttribute('lang', lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    updateUrl(lang);
    updateSwitcher(lang);

    function emit() {
      try { document.dispatchEvent(new CustomEvent('cosc:langchange', { detail: { lang: lang } })); } catch (e) {}
    }
    if (lang === DEFAULT_LANG) { restorePL(); emit(); return Promise.resolve(); }
    return loadDict(lang).then(function (d) {
      if (d) applyDict(d); else restorePL();
      emit();
    });
  }

  function updateUrl(lang) {
    try {
      var u = new URL(location.href);
      if (lang === DEFAULT_LANG) u.searchParams.delete('lang');
      else u.searchParams.set('lang', lang);
      history.replaceState(null, '', u);
    } catch (e) {}
  }

  /* ---------- przełącznik UI ---------- */
  function buildSwitcher() {
    var mounts = document.querySelectorAll('.lang');
    for (var m = 0; m < mounts.length; m++) {
      var host = mounts[m];
      host.innerHTML = '';
      host.classList.add('langbox');

      var cur = LANGS.filter(function (l) { return l.code === current; })[0] || LANGS[0];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-btn';
      btn.setAttribute('aria-haspopup', 'listbox');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Zmień język / Change language');
      btn.innerHTML = '<span class="lang-fl">' + flagMarkup(cur.code) + '</span><span class="lang-cur">' + cur.label +
        '</span><span class="lang-caret" aria-hidden="true">▾</span>';

      var list = document.createElement('div');
      list.className = 'lang-menu';
      list.setAttribute('role', 'listbox');
      LANGS.forEach(function (l) {
        var it = document.createElement('button');
        it.type = 'button';
        it.className = 'lang-item' + (l.code === current ? ' on' : '');
        it.setAttribute('role', 'option');
        it.setAttribute('data-lang', l.code);
        it.setAttribute('lang', l.code);
        it.innerHTML = '<span class="lang-fl">' + flagMarkup(l.code) + '</span><span class="lang-name">' + l.name +
          '</span><span class="lang-code">' + l.label + '</span>';
        it.addEventListener('click', function (e) {
          e.preventDefault();
          var code = this.getAttribute('data-lang');
          setLang(code);
          closeAll();
        });
        list.appendChild(it);
      });

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var open = this.getAttribute('aria-expanded') === 'true';
        closeAll();
        if (!open) {
          this.setAttribute('aria-expanded', 'true');
          this.parentNode.classList.add('open');
        }
      });

      host.appendChild(btn);
      host.appendChild(list);
    }
    document.addEventListener('click', closeAll);
  }

  function closeAll() {
    document.querySelectorAll('.lang.open,.langbox.open').forEach(function (h) {
      h.classList.remove('open');
      var b = h.querySelector('.lang-btn');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }

  function updateSwitcher(lang) {
    var cur = LANGS.filter(function (l) { return l.code === lang; })[0] || LANGS[0];
    document.querySelectorAll('.langbox').forEach(function (h) {
      var fl = h.querySelector('.lang-btn .lang-fl');
      var lb = h.querySelector('.lang-btn .lang-cur');
      if (fl) fl.innerHTML = flagMarkup(cur.code);
      if (lb) lb.textContent = cur.label;
      h.querySelectorAll('.lang-item').forEach(function (it) {
        it.classList.toggle('on', it.getAttribute('data-lang') === lang);
      });
    });
  }

  /* ---------- hreflang ---------- */
  function addHreflang() {
    var head = document.head;
    var base = location.origin + location.pathname;
    LANGS.forEach(function (l) {
      var link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = l.code;
      link.href = base + (l.code === DEFAULT_LANG ? '' : '?lang=' + l.code);
      head.appendChild(link);
    });
    var x = document.createElement('link');
    x.rel = 'alternate'; x.hreflang = 'x-default'; x.href = base;
    head.appendChild(x);
  }

  /* ---------- start ---------- */
  function init() {
    buildSwitcher();
    addHreflang();
    setLang(pickLang());
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // API publiczne
  window.COSCi18n = { setLang: setLang, langs: LANGS, current: function () { return current; } };
})();
