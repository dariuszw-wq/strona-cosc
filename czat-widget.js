/* =============================================================
   Czat — wstępne rozpoznanie sprawy
   Samodzielny widget do osadzenia na dowolnej stronie.

   Dwie rzeczy odróżniają go od kodu na polandresidencecard.pl:

   1. Cały interfejs żyje w Shadow DOM. Style strony gospodarza nie
      wpływają na widget, a style widgetu nie psują strony. To warunek
      działania na serwisie, którego CSS-a nie kontrolujemy.
   2. Nie zakłada niczego o stronie. Nie szuka nagłówka, sekcji ani
      przycisków — tworzy własną zaczepkę i sam się otwiera.

   OSADZENIE — jeden znacznik przed </body>:

     <script src="/czat-widget.js"
             data-endpoint="https://script.google.com/macros/s/…/exec"
             data-whatsapp="48539999549"
             defer></script>

   Pełna konfiguracja z własnymi tekstami — obiekt PRZED znacznikiem:

     <script>window.PRC_CZAT = { endpoint: "…", whatsapp: "48…",
       akcent: "#E9B872", teksty: { … } };</script>

   ============================================================= */
(function () {
  'use strict';

  /* ---------- Konfiguracja ---------- */
  var skrypt = document.currentScript;
  var dane = (skrypt && skrypt.dataset) || {};
  var U = window.PRC_CZAT || {};

  var CFG = {
    endpoint: U.endpoint || dane.endpoint || '',
    whatsapp: U.whatsapp || dane.whatsapp || '',
    akcent:   U.akcent   || dane.akcent   || '#E9B872',
    tlo:      U.tlo      || dane.tlo      || '#131B25',
    /* Krój strony gospodarza. Podaj pełny stos CSS, np.
       '"IBM Plex Sans", sans-serif' — widget posłuży się nim zamiast systemowego.
       Sam kroju nie wczytuje: jeśli strona już go ładuje, po prostu zadziała. */
    kroj:     U.kroj     || dane.kroj     || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    /* Po ilu sekundach ukrycia strony uznajemy rozmowę za porzuconą.
       Krótciej = fałszywe alarmy przy zwykłej zmianie zakładki. */
    powrotMs: Number(U.powrotMs || dane.powrotMs || 30000)
  };

  /* ---------- Języki ----------
     Teksty mieszkają w czat-jezyki.js. Tutaj tylko wybór właściwego zestawu.

     Serwisy wielojęzyczne przełączają język bez przeładowania strony, więc
     nie wystarczy odczytać go raz przy starcie. Sprawdzamy go za każdym
     otwarciem czatu i nasłuchujemy zmiany atrybutu lang na <html>. */
  var JEZYKI = window.PRC_CZAT_JEZYKI || {};
  var DOMYSLNY = U.domyslnyJezyk || dane.domyslnyJezyk || 'pl';
  var WYMUSZONY = null;

  var ZAPAS = {
    zaczepka: 'Masz pytanie o swoją sprawę?', naglowek: 'Wstępne rozpoznanie sprawy',
    podtytul: '4 pytania', zamknij: 'Zamknij',
    intro: 'Dzień dobry. Kilka krótkich pytań i skierujemy sprawę do właściwej osoby.',
    q1: 'Czego dotyczy Twoja sprawa?', q1opcje: ['Pobyt i praca', 'Studia', 'Rodzina', 'Inne'],
    q2: 'Na jakim etapie jest sprawa?', q2opcje: ['Przed złożeniem', 'Wniosek złożony', 'Mam wezwanie', 'Odmowa'],
    q3: 'Opisz sprawę w kilku słowach.', q3pole: '',
    q4: 'Zostaw numer telefonu lub e-mail.', q4pole: '',
    kontaktZly: 'Zostaw proszę numer telefonu albo adres e-mail.',
    pomin: 'Pomiń', wyslij: 'Wyślij',
    koniec: 'Dziękujemy. Odezwiemy się wkrótce.', koniecWa: 'Kontynuuj na WhatsAppie', koniecNota: '',
    waPrefiks: 'Dzień dobry, wypełniłem/-am czat na Waszej stronie.',
    etSprawa: 'Sprawa', etEtap: 'Etap', etOpis: 'Opis', etKontakt: 'Kontakt',
    mikStart: 'Dyktuj', mikStop: 'Zakończ dyktowanie',
    mikBrakZgody: 'Brak dostępu do mikrofonu — wpisz tekst.',
    mikCisza: 'Nic nie usłyszeliśmy.', mikBlad: 'Dyktowanie nie zadziałało.'
  };

  function kodJezyka() {
    if (WYMUSZONY) return WYMUSZONY;
    var l = (U.jezyk || dane.jezyk || document.documentElement.lang || DOMYSLNY).toLowerCase();
    return l.split('-')[0];
  }

  /* Kolejność: dokładny język → angielski → domyślny → zapas wbudowany.
     Nakładki użytkownika (teksty / jezyki) mają pierwszeństwo nad wszystkim. */
  function tekstyDla(kod) {
    var nakladki = (U.jezyki && U.jezyki[kod]) || {};
    var wybrany = JEZYKI[kod] || JEZYKI.en || JEZYKI[DOMYSLNY] || {};
    return Object.assign({}, ZAPAS, wybrany, U.teksty || {}, nakladki);
  }

  var T = tekstyDla(kodJezyka());

  if (!CFG.endpoint) {
    try { console.warn('[czat] brak data-endpoint — zgłoszenia nie będą wysyłane'); } catch (e) {}
  }

  /* ---------- Analityka: to samo API co na stronie głównej ---------- */
  window.dataLayer = window.dataLayer || [];
  function slad(zdarzenie, params) {
    var p = Object.assign({ event: zdarzenie, page_path: location.pathname }, params || {});
    window.dataLayer.push(p);
    if (typeof window.gtag === 'function') window.gtag('event', zdarzenie, p);
  }

  /* ---------- Źródło wejścia ---------- */
  function zrodlo() {
    try {
      var z = sessionStorage.getItem('prc_attr');
      if (z) return JSON.parse(z);
      var q = new URLSearchParams(location.search);
      var a = {
        source: q.get('utm_source') || (document.referrer ? new URL(document.referrer).hostname : 'wejscie bezposrednie'),
        medium: q.get('utm_medium') || '',
        campaign: q.get('utm_campaign') || '',
        /* Pełny adres z domeną — dzięki temu w arkuszu widać, z KTÓREJ strony
           przyszedł lead, gdy widget stoi na kilku serwisach naraz. */
        landing: location.hostname + location.pathname
      };
      sessionStorage.setItem('prc_attr', JSON.stringify(a));
      return a;
    } catch (e) { return { source: 'nieznane', landing: location.hostname }; }
  }

  var idRozmowy = (function () {
    try {
      var i = sessionStorage.getItem('prc_sid');
      if (!i) { i = Math.random().toString(36).slice(2, 8).toUpperCase(); sessionStorage.setItem('prc_sid', i); }
      return i;
    } catch (e) { return '------'; }
  })();

  function wyslij(ladunek, beacon) {
    if (!CFG.endpoint) { try { console.info('[czat] lead:', ladunek); } catch (e) {} return; }
    var body = JSON.stringify(ladunek);
    if (beacon && navigator.sendBeacon) {
      try { navigator.sendBeacon(CFG.endpoint, new Blob([body], { type: 'text/plain;charset=utf-8' })); return; } catch (e) {}
    }
    fetch(CFG.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body, keepalive: !!beacon }).catch(function () {});
  }

  /* ---------- Style widgetu (wewnątrz Shadow DOM) ---------- */
  var CSS = `
/* UWAGA: reguły strony gospodarza (np. gwiazdkowa reguła font-family) mają
   pierwszeństwo przed :host, więc krój ustawiamy na korzeniach WEWNĄTRZ
   cienia. Tam żadna reguła z zewnątrz nie sięga. */
:host { all: initial; }
.zaczepka, .panel {
  font-family: var(--kroj);
  font-size: 14px; font-weight: 400; font-style: normal; line-height: 1.5;
  letter-spacing: normal; word-spacing: normal; text-transform: none;
  text-align: left; color: #111; direction: ltr;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
button { font: inherit; color: inherit; cursor: pointer; border: 0; background: none; }

.zaczepka {
  position: fixed; right: 24px; bottom: 24px; z-index: 2147483000;
  display: inline-flex; align-items: center; gap: 10px;
  min-height: 48px; padding: 0 20px;
  background: #fff; color: #111; border-radius: 6px;
  font-size: 14px; font-weight: 600;
  box-shadow: 0 6px 16px rgba(0,0,0,.16), 0 24px 48px -20px rgba(0,0,0,.4);
  opacity: 0; transform: translateY(20px); pointer-events: none;
  transition: opacity .3s ease, transform .3s ease;
}
.zaczepka.widoczna { opacity: 1; transform: none; pointer-events: auto; }
.kropka { width: 7px; height: 7px; border-radius: 50%; background: #1DA851; }
@media (max-width: 599px) { .zaczepka { right: 16px; bottom: 16px; } }

.panel {
  position: fixed; right: 24px; bottom: 24px; z-index: 2147483001;
  width: min(390px, calc(100vw - 32px)); max-height: min(640px, calc(100dvh - 48px));
  display: none; flex-direction: column;
  background: #fff; border-radius: 12px; overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,.2), 0 32px 64px -24px rgba(0,0,0,.5);
}
.panel[data-otwarty="true"] { display: flex; }
@media (max-width: 599px) { .panel { inset: auto 0 0 0; width: 100%; max-height: 88dvh; border-radius: 12px 12px 0 0; } }

.glowa { display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: var(--tlo); color: #fff; }
.znak { width: 30px; height: 30px; border-radius: 6px; background: rgba(255,255,255,.16); display: grid; place-items: center; font-size: 14px; font-weight: 700; }
.tytul { display: block; font-size: 14px; font-weight: 600; }
.podtytul { display: block; font-size: 11px; opacity: .68; margin-top: 2px; }
.zamknij { margin-left: auto; background: transparent; color: rgba(255,255,255,.8); padding: 6px; border-radius: 5px; line-height: 0; }
.zamknij:hover { background: rgba(255,255,255,.14); color: #fff; }

.postep { height: 2px; background: #e9e9ee; }
.postep i { display: block; height: 100%; width: 0; background: var(--akcent); transition: width .35s ease; }

.log { flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 10px; }
.wiad { max-width: 88%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; }
.bot { background: #f2f3f5; color: #111; border-bottom-left-radius: 3px; align-self: flex-start; }
.user { background: var(--tlo); color: #fff; border-bottom-right-radius: 3px; align-self: flex-end; }
.pisze { display: flex; gap: 4px; padding: 14px; }
.pisze i { width: 5px; height: 5px; border-radius: 50%; background: #9aa0a6; animation: mig 1.2s infinite; }
.pisze i:nth-child(2) { animation-delay: .18s; } .pisze i:nth-child(3) { animation-delay: .36s; }
@keyframes mig { 0%,60%,100% { opacity: .25; } 30% { opacity: 1; } }

.stopa { border-top: 1px solid #e9e9ee; padding: 14px; background: #fafafb; }
.opcje { display: flex; flex-wrap: wrap; gap: 7px; }
.opcja { padding: 9px 13px; background: #fff; border: 1px solid #d7d9de; border-radius: 20px; font-size: 13px; color: #111; }
.opcja:hover { border-color: var(--tlo); }
.pole { display: flex; gap: 8px; align-items: flex-end; }
.otoczka { position: relative; flex: 1; }
.otoczka textarea, .otoczka input {
  width: 100%; padding: 12px 46px 12px 14px; border: 1px solid #d7d9de; border-radius: 8px;
  font: inherit; font-size: 15px; resize: none; min-height: 46px; max-height: 120px; color: #111; background: #fff;
}
.otoczka textarea:focus, .otoczka input:focus { outline: 2px solid var(--akcent); outline-offset: -1px; border-color: transparent; }
.slij { width: 46px; height: 46px; flex: none; border-radius: 8px; background: var(--tlo); color: #fff; display: grid; place-items: center; }

.mik { position: absolute; right: 6px; bottom: 6px; width: 34px; height: 34px; border-radius: 6px; background: #eef0f2; color: #4a4f57; display: grid; place-items: center; }
.mik:hover { color: #111; }
.mik.gra { background: #C2410C; color: #fff; }
.mik.gra svg { display: none; }
.fala { display: none; align-items: flex-end; gap: 2px; height: 13px; }
.mik.gra .fala { display: flex; }
.fala i { width: 2px; background: currentColor; border-radius: 1px; animation: fala .9s ease-in-out infinite; }
.fala i:nth-child(1) { height: 6px; } .fala i:nth-child(2) { height: 12px; animation-delay: .15s; } .fala i:nth-child(3) { height: 8px; animation-delay: .3s; }
@keyframes fala { 0%,100% { transform: scaleY(.4); } 50% { transform: scaleY(1); } }
@media (prefers-reduced-motion: reduce) { .fala i, .pisze i { animation: none; } }

.nota { margin-top: 10px; font-size: 11px; color: #6b7280; text-align: center; }
.podpowiedz { margin-top: 8px; font-size: 11px; color: #C2410C; line-height: 1.5; }
.koniecBox { display: grid; gap: 10px; }
.przyciskWa { display: block; text-align: center; padding: 13px; border-radius: 8px; background: #1DA851; color: #fff; font-size: 14px; font-weight: 700; text-decoration: none; }
`;

  /* ---------- Budowa ---------- */
  var host = document.createElement('div');
  host.setAttribute('data-prc-czat', '');
  /* Odcinamy sam element-gospodarz od stylów strony (np. `div { border: 1px }`).
     Zmiennych CSS to nie dotyczy — `all` ich nie resetuje. */
  host.style.setProperty('all', 'initial', 'important');
  var cien = host.attachShadow({ mode: 'open' });
  var style = document.createElement('style');
  style.textContent = ':host{--akcent:' + CFG.akcent + ';--tlo:' + CFG.tlo + ';--kroj:' + CFG.kroj + ';}' + CSS;
  cien.appendChild(style);

  var korzen = document.createElement('div');
  korzen.innerHTML =
    '<button class="zaczepka" type="button"><span class="kropka"></span>' + T.zaczepka + '</button>' +
    '<div class="panel" data-otwarty="false" role="dialog" aria-label="' + T.naglowek + '">' +
      '<div class="glowa"><span class="znak">P</span><span><span class="tytul">' + T.naglowek + '</span>' +
      '<span class="podtytul">' + T.podtytul + '</span></span>' +
      '<button class="zamknij" type="button" aria-label="' + T.zamknij + '">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>' +
      '<div class="postep"><i></i></div>' +
      '<div class="log" role="log" aria-live="polite"></div>' +
      '<div class="stopa"></div>' +
    '</div>';
  cien.appendChild(korzen);

  function gotowe() { document.body.appendChild(host); start(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', gotowe); else gotowe();

  /* ---------- Logika rozmowy ---------- */
  function start() {
    var $ = function (s) { return cien.querySelector(s); };
    var zaczepka = $('.zaczepka'), panel = $('.panel'), log = $('.log'), stopa = $('.stopa'), postep = $('.postep i');

    var odp = {}, krok = -1, otwarty = false, porzuconeWyslane = false, ukonczone = false;
    function KROKI() {
      return [
        { klucz: 'topic',   pyt: T.q1, tryb: 'opcje', opcje: T.q1opcje },
        { klucz: 'stage',   pyt: T.q2, tryb: 'opcje', opcje: T.q2opcje },
        { klucz: 'details', pyt: T.q3, tryb: 'tekst', pole: T.q3pole, pomijalny: true },
        { klucz: 'contact', pyt: T.q4, tryb: 'kontakt', pole: T.q4pole }
      ];
    }
    var ILE_KROKOW = 4;

    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var aktywnyMik = null;

    function bąbel(tekst, kto) {
      var d = document.createElement('div');
      d.className = 'wiad ' + kto;
      d.textContent = tekst;
      log.appendChild(d); log.scrollTop = log.scrollHeight;
    }
    function pisze(potem, ms) {
      var d = document.createElement('div');
      d.className = 'wiad bot pisze';
      d.innerHTML = '<i></i><i></i><i></i>';
      log.appendChild(d); log.scrollTop = log.scrollHeight;
      setTimeout(function () { d.remove(); potem(); }, ms || 650);
    }

    function mikrofon(input) {
      if (!SR) return null;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'mik'; b.title = T.mikStart; b.setAttribute('aria-label', T.mikStart);
      b.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
        '<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/></svg>' +
        '<span class="fala"><i></i><i></i><i></i></span>';
      var rec = null, baza = '', gra = false;

      function stop() { if (rec) { try { rec.stop(); } catch (e) {} } gra = false; b.classList.remove('gra'); if (aktywnyMik === stop) aktywnyMik = null; }
      function podpowiedz(t) {
        var stara = stopa.querySelector('.podpowiedz'); if (stara) stara.remove();
        var p = document.createElement('p'); p.className = 'podpowiedz'; p.textContent = t;
        stopa.appendChild(p); setTimeout(function () { p.remove(); }, 6000);
      }
      b.addEventListener('click', function () {
        if (gra) return stop();
        if (aktywnyMik) aktywnyMik();
        rec = new SR();
        rec.lang = { pl: 'pl-PL', en: 'en-GB', es: 'es-ES', uk: 'uk-UA', ru: 'ru-RU', fr: 'fr-FR' }[kodJezyka()] || 'pl-PL';
        rec.continuous = true; rec.interimResults = true;
        baza = input.value ? input.value.replace(/\s+$/, '') + ' ' : '';
        rec.onstart = function () { gra = true; b.classList.add('gra'); aktywnyMik = stop; slad('dictation_start', { field: 'czat' }); };
        rec.onresult = function (e) {
          var fin = '', tmp = '';
          for (var i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) fin += e.results[i][0].transcript; else tmp += e.results[i][0].transcript;
          }
          if (fin) baza += fin.replace(/^\s+/, '') + ' ';
          input.value = (baza + tmp).replace(/\s+/g, ' ').replace(/^\s/, '');
        };
        rec.onerror = function (e) {
          stop();
          podpowiedz(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? T.mikBrakZgody : e.error === 'no-speech' ? T.mikCisza : T.mikBlad);
        };
        rec.onend = function () { stop(); };
        try { rec.start(); } catch (e) { stop(); }
      });
      return b;
    }

    function pokazPole(k) {
      stopa.innerHTML = '';
      if (k.tryb === 'opcje') {
        var box = document.createElement('div'); box.className = 'opcje';
        k.opcje.forEach(function (o) {
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'opcja'; b.textContent = o;
          b.addEventListener('click', function () { odpowiedz(o); });
          box.appendChild(b);
        });
        stopa.appendChild(box);
        return;
      }
      var form = document.createElement('form'); form.className = 'pole';
      var ot = document.createElement('div'); ot.className = 'otoczka';
      var input = document.createElement(k.tryb === 'tekst' ? 'textarea' : 'input');
      input.placeholder = k.pole || '';
      if (k.tryb === 'kontakt') { input.type = 'text'; input.autocomplete = 'email'; }
      ot.appendChild(input);
      var m = mikrofon(input); if (m) ot.appendChild(m);
      var s = document.createElement('button');
      s.type = 'submit'; s.className = 'slij'; s.setAttribute('aria-label', T.wyslij);
      s.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
      form.appendChild(ot); form.appendChild(s);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (aktywnyMik) aktywnyMik();
        var v = input.value.trim(); if (!v) return;
        if (k.tryb === 'kontakt' && !/(@|\d{6,})/.test(v.replace(/[\s()-]/g, ''))) { bąbel(T.kontaktZly, 'bot'); return; }
        odpowiedz(v);
      });
      if (k.tryb === 'tekst') {
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.dispatchEvent(new Event('submit')); }
        });
      }
      stopa.appendChild(form);
      if (k.pomijalny) {
        var p = document.createElement('div'); p.className = 'nota';
        var bp = document.createElement('button');
        bp.type = 'button'; bp.textContent = T.pomin;
        bp.style.cssText = 'background:none;color:inherit;text-decoration:underline;font-size:11px;padding:0';
        bp.addEventListener('click', function () { odpowiedz('—'); });
        p.appendChild(bp); stopa.appendChild(p);
      }
      if (window.innerWidth > 599) setTimeout(function () { input.focus(); }, 80);
    }

    function dalej() {
      krok++;
      postep.style.width = Math.round(((krok + 1) / (ILE_KROKOW + 1)) * 100) + '%';
      if (krok >= ILE_KROKOW) return koniec();
      var k = KROKI()[krok];
      pisze(function () { bąbel(k.pyt, 'bot'); pokazPole(k); }, krok === 0 ? 500 : 700);
      slad('chat_step_shown', { step: krok + 1 });
    }
    function odpowiedz(v) {
      odp[KROKI()[krok].klucz] = v;
      bąbel(v, 'user'); stopa.innerHTML = '';
      slad('chat_step_answered', { step: krok + 1 });
      dalej();
    }
    function ladunek(status) {
      return Object.assign({}, odp, {
        attribution: zrodlo(), lang: kodJezyka(),
        channel: 'czat', status: status, sessionId: idRozmowy,
        supersedes: status === 'kompletny' && porzuconeWyslane ? idRozmowy : '',
        stoppedAt: status === 'porzucony' ? (krok + 1) + '/' + ILE_KROKOW : ''
      });
    }
    function koniec() {
      ukonczone = true;
      try { sessionStorage.setItem('prc_chat_done', '1'); } catch (e) {}
      wyslij(ladunek('kompletny'));
      slad('chat_completed', { case_type: odp.topic });
      pisze(function () {
        bąbel(T.koniec, 'bot');
        var box = document.createElement('div'); box.className = 'koniecBox';
        var tresc = [T.waPrefiks, '', T.etSprawa + ': ' + (odp.topic || '—'), T.etEtap + ': ' + (odp.stage || '—'),
                     T.etOpis + ': ' + (odp.details || '—'), T.etKontakt + ': ' + (odp.contact || '—')].join('\n');
        if (CFG.whatsapp) {
          var a = document.createElement('a');
          a.className = 'przyciskWa'; a.target = '_blank'; a.rel = 'noopener';
          a.href = 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(tresc);
          a.textContent = T.koniecWa;
          a.addEventListener('click', function () { slad('whatsapp_click', { cta_location: 'czat_koniec' }); });
          box.appendChild(a);
        }
        var n = document.createElement('p'); n.className = 'nota'; n.textContent = T.koniecNota;
        box.appendChild(n); stopa.appendChild(box);
        postep.style.width = '100%';
      }, 800);
    }

    /* Ratowanie porzuconych rozmów — patrz komentarz na górze pliku. */
    var timer = null;
    function porzucone(natychmiast) {
      if (ukonczone || porzuconeWyslane || !Object.keys(odp).length) return;
      porzuconeWyslane = true;
      wyslij(ladunek('porzucony'), true);
      slad('chat_abandoned', { step: krok + 1, trigger: natychmiast ? 'zamkniecie' : 'brak_powrotu' });
    }
    window.addEventListener('pagehide', function () { porzucone(true); });
    document.addEventListener('visibilitychange', function () {
      clearTimeout(timer);
      if (document.visibilityState === 'hidden') timer = setTimeout(function () { porzucone(false); }, CFG.powrotMs);
    });

    function otworz(powod) {
      panel.setAttribute('data-otwarty', 'true');
      zaczepka.classList.remove('widoczna');
      if (otwarty) return;
      otwarty = true;
      T = tekstyDla(kodJezyka());   // rozmowa poleci w języku wybranym przez użytkownika
      slad('chat_opened', { trigger: powod });
      pisze(function () { bąbel(T.intro, 'bot'); dalej(); }, 420);
    }
    function zamknij() {
      if (aktywnyMik) aktywnyMik();
      panel.setAttribute('data-otwarty', 'false');
      zaczepka.classList.add('widoczna');
      slad('chat_closed', { step: krok + 1 });
    }

    /* Serwis może przełączyć język bez przeładowania. Aktualizujemy wtedy
       etykiety, których użytkownik nie widzi w toku rozmowy. Rozpoczętej
       rozmowy nie tłumaczymy w locie — zmiana języka w połowie byłaby myląca. */
    function odswiezEtykiety() {
      T = tekstyDla(kodJezyka());
      zaczepka.lastChild.textContent = T.zaczepka;
      cien.querySelector('.tytul').textContent = T.naglowek;
      cien.querySelector('.podtytul').textContent = T.podtytul;
      cien.querySelector('.zamknij').setAttribute('aria-label', T.zamknij);
      panel.setAttribute('aria-label', T.naglowek);
    }
    new MutationObserver(function () { if (!otwarty) odswiezEtykiety(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    /* Furtka dla aplikacji, które nie zmieniają atrybutu lang na <html>:
       window.PRC_CZAT_jezyk('en') przełącza widget ręcznie. */
    window.PRC_CZAT_jezyk = function (kod) {
      WYMUSZONY = kod ? String(kod).toLowerCase().split('-')[0] : null;
      if (!otwarty) odswiezEtykiety();
    };

    zaczepka.addEventListener('click', function () { otworz('zaczepka'); });
    cien.querySelector('.zamknij').addEventListener('click', zamknij);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.getAttribute('data-otwarty') === 'true') zamknij(); });

    /* Dowolny element strony gospodarza z atrybutem data-prc-otworz-czat
       otwiera widget — dzięki temu można podpiąć własny przycisk. */
    document.querySelectorAll('[data-prc-otworz-czat]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); otworz(el.getAttribute('data-prc-otworz-czat') || 'przycisk'); });
    });

    /* Zaczepka pojawia się po zachowaniu, nie po zegarze. */
    var juz = false;
    try { if (sessionStorage.getItem('prc_chat_done') === '1') juz = true; } catch (e) {}
    if (!juz) {
      var pokazana = false;
      var pokaz = function (why) {
        if (pokazana || panel.getAttribute('data-otwarty') === 'true') return;
        pokazana = true; zaczepka.classList.add('widoczna');
        slad('chat_prompt_shown', { trigger: why });
      };
      var naScroll = function () {
        var h = document.body.scrollHeight - window.innerHeight;
        if (h > 0 && window.scrollY / h > 0.45) { pokaz('gleboko_przewiniete'); window.removeEventListener('scroll', naScroll); }
      };
      window.addEventListener('scroll', naScroll, { passive: true });
      setTimeout(function () { pokaz('czas'); }, 45000);   // ostatnia deska ratunku na krótkich stronach
      var nudge = false;
      document.addEventListener('mouseout', function (e) {
        if (nudge || e.relatedTarget || e.clientY > 24 || window.innerWidth < 940) return;
        nudge = true; pokaz('zamiar_wyjscia');
        setTimeout(function () { if (!otwarty) otworz('zamiar_wyjscia'); }, 250);
      });
    }
  }
})();
