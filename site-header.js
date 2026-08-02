/*!
 * COSC — SILNIK WSPÓLNEGO NAGŁÓWKA (jedno źródło prawdy dla całej strony)
 * ---------------------------------------------------------------------------
 * Zamiast utrzymywać ten sam nagłówek/menu w ~80 plikach HTML, każdy plik
 * zawiera tylko: <header id="site-header"></header>, a TEN plik renderuje menu.
 * Zmiana menu lub jego tłumaczeń = edycja WYŁĄCZNIE tego pliku.
 *
 * Włączenie na stronie (robi skrypt migracyjny zastosuj-silnik-naglowka.py):
 *   1) w <body> (na górze):  <header id="site-header"></header>
 *   2) przed i18n.js:        <script src="{PREFIX}site-header.js"></script>
 *
 * TŁUMACZENIA: nagłówek ma atrybut data-i18n-skip, więc globalny silnik i18n go
 * pomija (unika kolizji z dynamiczną, zależną od ścieżki treścią). Nagłówek sam
 * tłumaczy swoje etykiety, nasłuchując zdarzenia 'cosc:langchange' emitowanego
 * przez i18n.js. Języki: pl (źródło) + en, es, uk, ru, fr. Przełącznik języka
 * (<div class="lang">) nadal buduje i18n.js + i18n.css.
 *
 * CSS jest samodzielny (namespace .csh-), kolory to literały — nie zależy od
 * stylów danej strony i z nimi nie koliduje.
 */
(function () {
  'use strict';

  /* ---- prefiks ścieżek: root vs podkatalog (cudzoziemcy/, pracodawcy/) ---- */
  var P = /\/(cudzoziemcy|pracodawcy)\//.test(location.pathname) ? '../' : '';
  function url(href) {
    if (!href) return P || './';
    if (/^(https?:|mailto:|tel:|#)/.test(href)) return href;
    return P + href;
  }

  /* ---- słownik etykiet (JEDNO miejsce edycji tłumaczeń menu) ---- */
  var L = {
    'Jestem cudzoziemcem': { en: "I'm a foreigner", es: 'Soy extranjero', uk: 'Я іноземець', ru: 'Я иностранец', fr: 'Je suis étranger' },
    'Cudzoziemiec': { en: 'Foreigner', es: 'Extranjero', uk: 'Іноземець', ru: 'Иностранец', fr: 'Étranger' },
    'Pracodawca': { en: 'Employer', es: 'Empleador', uk: 'Роботодавець', ru: 'Работодатель', fr: 'Employeur' },
    'Jestem pracodawcą': { en: "I'm an employer", es: 'Soy empleador', uk: 'Я роботодавець', ru: 'Я работодатель', fr: 'Je suis employeur' },
    'Strona sekcji': { en: 'Section page', es: 'Página de la sección', uk: 'Сторінка розділу', ru: 'Страница раздела', fr: 'Page de la section' },
    'Problemy z legalnym pobytem': { en: 'Problems with legal residence', es: 'Problemas con la residencia legal', uk: 'Проблеми з легальним перебуванням', ru: 'Проблемы с легальным пребыванием', fr: 'Problèmes de séjour légal' },
    'Wniosek karta pobytu tymczasowego': { en: 'Temporary residence card application', es: 'Solicitud de tarjeta de residencia temporal', uk: 'Заява на карту тимчасового перебування', ru: 'Заявление на карту временного пребывания', fr: 'Demande de carte de séjour temporaire' },
    'Wniosek karta pobytu stałego': { en: 'Permanent residence card application', es: 'Solicitud de tarjeta de residencia permanente', uk: 'Заява на карту постійного перебування', ru: 'Заявление на карту постоянного пребывания', fr: 'Demande de carte de séjour permanent' },
    'Wniosek karta pobytu dla członków rodzin': { en: 'Residence card application for family members', es: 'Solicitud de tarjeta de residencia para familiares', uk: 'Заява на карту перебування для членів родини', ru: 'Заявление на карту пребывания для членов семьи', fr: 'Demande de carte de séjour pour les membres de la famille' },
    'Zasiłek dla cudzoziemca': { en: 'Benefits for foreigners', es: 'Subsidio para extranjeros', uk: 'Допомога для іноземця', ru: 'Пособие для иностранца', fr: 'Allocation pour étrangers' },
    'Cennik dla cudzoziemców': { en: 'Pricing for foreigners', es: 'Precios para extranjeros', uk: 'Ціни для іноземців', ru: 'Цены для иностранцев', fr: 'Tarifs pour étrangers' },
    'Gry i quizy': { en: 'Games and quizzes', es: 'Juegos y cuestionarios', uk: 'Ігри та вікторини', ru: 'Игры и викторины', fr: 'Jeux et quiz' },
    'FAQ': { en: 'FAQ', es: 'FAQ', uk: 'FAQ', ru: 'FAQ', fr: 'FAQ' },
    'Baza noclegowa': { en: 'Accommodation', es: 'Alojamiento', uk: 'База житла', ru: 'База жилья', fr: 'Hébergement' },
    'Przewodnik po Polsce': { en: 'Guide to Poland', es: 'Guía de Polonia', uk: 'Путівник по Польщі', ru: 'Путеводитель по Польше', fr: 'Guide de la Pologne' },
    'Aktualności': { en: 'News', es: 'Noticias', uk: 'Новини', ru: 'Новости', fr: 'Actualités' },
    'Legalne zatrudnienie': { en: 'Legal employment', es: 'Empleo legal', uk: 'Легальне працевлаштування', ru: 'Легальное трудоустройство', fr: 'Emploi légal' },
    'ZUS i rozliczenia': { en: 'Social security (ZUS) and settlements', es: 'Seguridad social (ZUS) y liquidaciones', uk: 'ZUS та розрахунки', ru: 'ZUS и расчёты', fr: 'Sécurité sociale (ZUS) et déclarations' },
    'Obsługa firm': { en: 'Business services', es: 'Servicios para empresas', uk: 'Обслуговування компаній', ru: 'Обслуживание компаний', fr: 'Services aux entreprises' },
    'Kontrola i sankcje': { en: 'Inspections and sanctions', es: 'Inspecciones y sanciones', uk: 'Контроль та санкції', ru: 'Контроль и санкции', fr: 'Contrôles et sanctions' },
    'Kalkulator 90/180': { en: '90/180 calculator', es: 'Calculadora 90/180', uk: 'Калькулятор 90/180', ru: 'Калькулятор 90/180', fr: 'Calculateur 90/180' },
    'Kto powinien robić Twoją kartę?': { en: 'Who should handle your card?', es: '¿Quién debe tramitar tu tarjeta?', uk: 'Хто має робити твою карту?', ru: 'Кто должен делать твою карту?', fr: 'Qui doit gérer votre carte ?' },
    'Darmowa konsultacja': { en: 'Free consultation', es: 'Consulta gratuita', uk: 'Безкоштовна консультація', ru: 'Бесплатная консультация', fr: 'Consultation gratuite' }
  };

  /* ---- struktura menu ---- */
  var MENU = {
    hubs: [
      { id: 'cudzoziemiec', label: 'Jestem cudzoziemcem', short: 'Cudzoziemiec', items: [
        { t: 'Strona sekcji', href: 'cudzoziemcy/' },
        { t: 'Problemy z legalnym pobytem', href: 'uslugi.html' },
        { t: 'Kto powinien robić Twoją kartę?', href: 'karta-pobytu-prawnik-czy-pracodawca.html' },
        { t: 'Wniosek karta pobytu tymczasowego', href: 'formularz-pobyt-czasowy-praca-NOWA.html' },
        { t: 'Wniosek karta pobytu stałego', href: 'wniosek-karta-pobytu-stalego.html' },
        { t: 'Wniosek karta pobytu dla członków rodzin', href: 'wniosek-karta-pobytu-dla-czlonkow-rodziny.html' },
        { t: 'Zasiłek dla cudzoziemca', href: 'zasilek-dla-cudzoziemca.html' },
        { t: 'Cennik dla cudzoziemców', href: 'cennik.html' },
        { t: 'Gry i quizy', href: 'narzedzia.html' },
        { t: 'FAQ', href: 'faq.html' },
        { t: 'Baza noclegowa', href: 'baza-noclegowa.html' },
        { t: 'Przewodnik po Polsce', href: 'przewodnik-po-polsce.html' },
        { t: 'Aktualności', href: 'aktualnosci.html' }
      ] },
      { id: 'pracodawca', label: 'Jestem pracodawcą', short: 'Pracodawca', items: [
        { t: 'Strona sekcji', href: 'pracodawcy/' },
        { t: 'Legalne zatrudnienie', href: 'pracodawcy/#legalne-zatrudnienie' },
        { t: 'ZUS i rozliczenia', href: 'pracodawcy/#zus-rozliczenia' },
        { t: 'Obsługa firm', href: 'pracodawcy/#obsluga-firm' },
        { t: 'Kontrola i sankcje', href: 'pracodawcy/#kontrola-sankcje' },
        { t: 'Aktualności', href: 'aktualnosci.html' }
      ] }
    ],
    links: [ { t: 'Kalkulator 90/180', href: 'kalkulator-90-180.html' } ],
    cta: { t: 'Darmowa konsultacja', href: 'kontakt.html' }
  };

  /* ---- CSS (samodzielny, namespace .csh-) ---- */
  var CSS = ''
    + '.csh-header{background:linear-gradient(100deg,#6d28d9 0%,#4636c9 55%,#3b2fbf 100%);position:sticky;top:0;z-index:50;box-shadow:0 2px 12px rgba(19,32,58,.25);display:block}'
    + '.csh-wrap{max-width:1120px;margin:0 auto;padding:0 16px;display:flex;align-items:center;gap:12px;min-height:66px;flex-wrap:nowrap}'
    + '.csh-logo{display:flex;align-items:center;gap:9px;text-decoration:none;flex:none}'
    + '.csh-flag{flex-shrink:0;width:32px;height:32px;border-radius:6px;box-shadow:0 0 0 1px rgba(255,255,255,.4);overflow:hidden;display:flex;flex-direction:column}'
    + '.csh-flag .csh-fw{flex:1;width:100%;background:#f5f5f5}.csh-flag .csh-fr{flex:1;width:100%;background:#d4213d}'
    + '.csh-name{color:#fff;font-family:"IBM Plex Serif",Georgia,serif;font-weight:700;font-size:13.5px;line-height:1.15;white-space:nowrap}'
    + '.csh-menu{display:flex;flex-wrap:nowrap;gap:4px;align-items:center;justify-content:flex-end;flex:1 1 auto;min-width:0;white-space:nowrap}'
    + '.csh-menu>a{color:#E9ECF3;text-decoration:none;font-size:13.5px;font-weight:600;padding:8px 10px;border-radius:8px;transition:background .18s,color .18s}'
    + '.csh-menu>a:hover{background:rgba(255,255,255,.12);color:#ffd34d}'
    + '.csh-cta{background:#d4213d !important;color:#fff !important;font-weight:700;padding:8px 14px;border-radius:8px;box-shadow:0 2px 8px rgba(212,33,61,.35);margin-left:4px}.csh-cta:hover{background:#b81a32 !important;color:#fff !important}'
    + '.csh-more{position:relative;display:flex;align-items:center}'
    + '.csh-more-btn{display:inline-flex;align-items:center;gap:5px;font-family:inherit;font-size:13.5px;font-weight:600;color:#E9ECF3;background:none;border:none;border-radius:8px;padding:8px 10px;cursor:pointer;line-height:1;white-space:nowrap;transition:background .18s,color .18s}'
    + '.csh-more-btn:hover{background:rgba(255,255,255,.12);color:#ffd34d}'
    + '.csh-more-btn .chev{font-size:10px;opacity:.75;transition:transform .2s}'
    + '.csh-more.open .csh-more-btn{background:rgba(255,255,255,.16);color:#ffd34d}.csh-more.open .csh-more-btn .chev{transform:rotate(180deg)}'
    + '.csh-more-menu{position:absolute;top:calc(100% + 12px);left:0;min-width:264px;background:#241C86;border:1px solid rgba(201,169,97,.35);border-radius:14px;padding:8px;box-shadow:0 18px 40px rgba(10,16,40,.45);display:flex;flex-direction:column;gap:2px;opacity:0;visibility:hidden;transform:translateY(-6px);transition:opacity .18s,transform .18s,visibility .18s;z-index:60}'
    + '.csh-more.open .csh-more-menu{opacity:1;visibility:visible;transform:translateY(0)}'
    + '.csh-more-menu a{color:#E9ECF3;text-decoration:none;font-size:14px;font-weight:500;padding:11px 14px;border-radius:9px;white-space:nowrap;transition:background .15s,color .15s}'
    + '.csh-more-menu a:hover{background:rgba(201,169,97,.16);color:#6d6ae0}'
    + '.csh-header .lang{flex:none;position:relative !important;top:auto !important;right:auto !important;transform:none !important;margin-left:auto}'
    + '.csh-burger{display:none;background:none;border:none;color:#fff;font-size:26px;cursor:pointer;flex:none}'
    + '.csh-l-short{display:none}.csh-mob-x{display:none}'
    /* pasek "Esta página en español" — dyskretny, pod paskiem flagowym */
    + '.csh-es-bar{background:#fff;border-bottom:1px solid #e6e9f0;font-family:"IBM Plex Sans",system-ui,sans-serif;font-size:13.5px}'
    + '.csh-es-bar .csh-es-in{max-width:1120px;margin:0 auto;padding:8px 16px;display:flex;align-items:center;gap:8px;justify-content:flex-end}'
    + '.csh-es-bar a{color:#4636c9;text-decoration:none;font-weight:600}'
    + '.csh-es-bar a:hover{text-decoration:underline}'
    + '.csh-es-fl{width:20px;height:14px;border-radius:3px;flex:none;box-shadow:0 0 0 1px rgba(22,36,76,.15)}'
    + '@media(max-width:600px){.csh-es-bar .csh-es-in{justify-content:center;padding:7px 12px;font-size:13px}}'
    + '@media(max-width:900px){'
    /* JEDEN wiersz: małe logo + przyciski Cudzoziemiec/Pracodawca + języki; bez burgera */
    + '.csh-wrap{flex-wrap:nowrap;gap:8px;padding:0 10px;min-height:54px}'
    + '.csh-logo{gap:4px}'
    + '.csh-flag{width:17px;height:17px;border-radius:4px}'
    + '.csh-name{font-size:8.5px;line-height:1.2}'
    + '.csh-logo svg{width:14px;height:14px}'
    + '.csh-burger{display:none}'
    + '.csh-menu{display:flex;flex:1 1 auto;flex-wrap:nowrap;gap:6px;white-space:nowrap;min-width:0;margin:0 2px}'
    + '.csh-more{min-width:0;position:relative}'
    /* Cudzoziemiec = główny (większy), Pracodawca = mniejszy */
    /* PRIORYTET: Cudzoziemiec ZAWSZE w całości (nigdy nie ucinany); skracać wolno tylko Pracodawcę */
    + '.csh-more:first-child{flex:0 0 auto}'
    + '.csh-more:last-child{flex:1 1 0;min-width:0}'
    + '.csh-l-full{display:none}.csh-l-short{display:inline}'
    /* display:block + text-align:center — Safari nie obcina początku napisu (flex center + overflow ucina "CU") */
    + '.csh-more-btn{display:block;width:100%;text-align:center;font-weight:700;font-size:12px;padding:9px 8px;border:1px solid rgba(255,255,255,.45);border-radius:10px;background:rgba(255,255,255,.08)}'
    /* tylko Pracodawca może być skracany wielokropkiem */
    + '.csh-more:last-child .csh-more-btn{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    + '.csh-more-btn .chev{display:none}'
    + '.csh-more:last-child .csh-more-btn{font-size:10px;font-weight:600;padding:8px 3px}'
    + '.csh-more.open .csh-more-btn{background:rgba(255,255,255,.18)}'
    + '.csh-more-menu{display:none;position:absolute;top:calc(100% + 8px);left:0;min-width:250px;max-width:92vw;opacity:1;visibility:visible;transform:none}'
    + '.csh-more.open .csh-more-menu{display:flex}'
    + '.csh-more:last-of-type .csh-more-menu{left:auto;right:0}'
    /* Kalkulator + CTA z paska chowamy; są na dole każdej rozwijanej listy */
    + '.csh-menu>a{display:none}'
    + '.csh-mob-x{display:block;border-top:1px solid rgba(255,255,255,.14);margin-top:4px;padding-top:11px}'
    + '.csh-mob-x~.csh-mob-x{border-top:none;margin-top:0;padding-top:11px}'
    + '.csh-mob-cta{background:#d4213d;color:#fff !important;text-align:center;font-weight:700;border-radius:9px;margin-top:6px}'
    /* kompaktowy przełącznik języka */
    + '.csh-header .lang{margin-left:2px}'
    + '.csh-header .lang .lang-btn{padding:5px 7px;font-size:11px;gap:4px;border-radius:9px}'
    + '.csh-header .lang .lang-btn .lang-fl svg{width:17px;height:12px}'
    + '.csh-header .lang .lang-caret{font-size:9px}'
    + '}'
    /* bardzo wąskie ekrany: chowamy godło UE, jeszcze ciaśniej */
    + '@media(max-width:390px){'
    + '.csh-logo svg{display:none}'
    + '.csh-name{font-size:8px}'
    + '.csh-more-btn{font-size:11px;padding:8px 3px}'
    + '.csh-more:last-child .csh-more-btn{font-size:9px;padding:7px 2px}'
    + '.csh-header .lang .lang-btn .lang-cur{display:none}'
    + '}';

  /* ---- render ---- */
  function span(pl) { return '<span data-csh-k="' + pl.replace(/"/g, '&quot;') + '">' + pl + '</span>'; }
  function moreHtml(hub) {
    var lis = hub.items.map(function (it) {
      return '<a href="' + url(it.href) + '">' + span(it.t) + '</a>';
    }).join('');
    /* na telefonie: tylko CTA na dole listy (bez kalkulatora) */
    var mob = '<a class="csh-mob-x csh-mob-cta" href="' + url(MENU.cta.href) + '">' + span(MENU.cta.t) + '</a>';
    return '<div class="csh-more" data-csh-hub="' + (hub.id || '') + '"><button class="csh-more-btn" type="button" aria-haspopup="true" aria-expanded="false">'
      + '<span class="csh-l-full">' + span(hub.label) + '</span>'
      + '<span class="csh-l-short">' + span(hub.short || hub.label) + '</span>'
      + '<span class="chev">▾</span></button>'
      + '<div class="csh-more-menu">' + lis + mob + '</div></div>';
  }
  var euSvg = '<span aria-label="Godło Unii Europejskiej" style="display:inline-flex;align-items:center">'
    + '<svg width="30" height="30" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" role="img"><rect width="36" height="36" rx="7" fill="#0A2A8C"/>'
    + '<g fill="#F5C518"><path id="cshEuStar" d="M18,4.6 l0.85,1.75 l1.95,0.2 l-1.45,1.32 l0.42,1.9 l-1.77,-1.0 l-1.77,1.0 l0.42,-1.9 l-1.45,-1.32 l1.95,-0.2 Z"/>'
    + '<use href="#cshEuStar" transform="rotate(30 18 18)"/><use href="#cshEuStar" transform="rotate(60 18 18)"/><use href="#cshEuStar" transform="rotate(90 18 18)"/>'
    + '<use href="#cshEuStar" transform="rotate(120 18 18)"/><use href="#cshEuStar" transform="rotate(150 18 18)"/><use href="#cshEuStar" transform="rotate(180 18 18)"/>'
    + '<use href="#cshEuStar" transform="rotate(210 18 18)"/><use href="#cshEuStar" transform="rotate(240 18 18)"/><use href="#cshEuStar" transform="rotate(270 18 18)"/>'
    + '<use href="#cshEuStar" transform="rotate(300 18 18)"/><use href="#cshEuStar" transform="rotate(330 18 18)"/></g></svg></span>';

  function render() {
    var hubs = MENU.hubs.map(moreHtml).join('');
    var links = MENU.links.map(function (l) { return '<a href="' + url(l.href) + '">' + span(l.t) + '</a>'; }).join('');
    var cta = '<a href="' + url(MENU.cta.href) + '" class="csh-cta">' + span(MENU.cta.t) + '</a>';
    return '<div class="csh-wrap"><a class="csh-logo" href="' + url('') + '" aria-label="Strona główna">'
      + '<span class="csh-flag" aria-label="Polska"><span class="csh-fw"></span><span class="csh-fr"></span></span>'
      + '<span class="csh-name">Centrum Obsługi<br>Spraw Cudzoziemców</span>' + euSvg + '</a>'
      + '<nav class="csh-menu">' + hubs + links + cta + '</nav>'
      + '<div class="lang"><!-- przełącznik generuje i18n.js --></div>'
      + '<button class="csh-burger" type="button" aria-label="Menu">☰</button></div>';
  }

  /* ---- pary stron PL <-> hiszpańska wersja /es/ (JEDNO źródło prawdy) ----
   * Klucz = ścieżka strony polskiej, wartość = plik w katalogu /es/.
   * Używane w dwóch miejscach: (a) pasek "Esta página en español" pod nagłówkiem,
   * (b) i18n.js — kliknięcie ES prowadzi na pełną stronę hiszpańską zamiast
   * tłumaczyć polską w locie. Dodając nową stronę ES, dopisz ją TUTAJ. */
  var ES_PAIRS = {
    '/': 'es/',
    '/index.html': 'es/',
    '/artykul-karta-pobytu-czasowego.html': 'es/tarjeta-de-residencia-polonia.html',
    '/artykul-praca-na-wizie-ruch-bezwizowy.html': 'es/trabajo-legal-polonia-colombianos.html',
    '/artykul-mos-jak-zlozyc-wniosek.html': 'es/mos-solicitud-en-linea.html',
    '/kalkulator-90-180.html': 'es/calculadora-90-180.html',
    '/kontakt.html': 'es/contacto.html'
  };
  function esAlt() {
    var path = location.pathname.replace(/\/+$/, '/') || '/';
    var hit = ES_PAIRS[path];
    if (!hit && /\/$/.test(path) === false && ES_PAIRS[path + '/']) hit = ES_PAIRS[path + '/'];
    return hit ? (location.origin + '/' + hit) : null;
  }
  window.COSC_ES_ALT = esAlt;   // odczytywane przez i18n/i18n.js

  /* ---- sekcja PRACODAWCY: wyłącznie wersja polska ----
   * Powód (decyzja Dariusza, 08.2026): pracodawcy powierzający pracę w Polsce to
   * podmioty polskie; cudzoziemca nie interesują obowiązki pracodawcy. Dlatego hub
   * "Jestem pracodawcą" pokazujemy tylko przy języku polskim, a same strony
   * pracodawców nie są tłumaczone (patrz i18n/i18n.js — blokada onlyPL). */
  var IS_PRACODAWCA_PAGE = /\/pracodawcy(\/|$)/.test(location.pathname);

  /* ---- tłumaczenie etykiet nagłówka ---- */
  function applyLang(lang) {
    var host = document.getElementById('site-header');
    if (!host) return;
    host.querySelectorAll('[data-csh-k]').forEach(function (el) {
      var pl = el.getAttribute('data-csh-k');
      el.textContent = (lang && lang !== 'pl' && L[pl] && L[pl][lang]) ? L[pl][lang] : pl;
    });
    /* hub "Jestem pracodawcą" — tylko w wersji polskiej */
    var emp = host.querySelector('.csh-more[data-csh-hub="pracodawca"]');
    if (emp) {
      var onlyPl = (!lang || lang === 'pl');
      emp.style.display = onlyPl ? '' : 'none';
      if (!onlyPl) {
        emp.classList.remove('open');
        var eb = emp.querySelector('.csh-more-btn');
        if (eb) eb.setAttribute('aria-expanded', 'false');
      }
    }
  }

  /* ---- dźwięk kliknięcia (Web Audio, bez pliku) ----
   * Odtwarzany WYŁĄCZNIE dla: głównych przycisków menu (Jestem cudzoziemcem /
   * Jestem pracodawcą, Kalkulator, Darmowa konsultacja) oraz pozycji wybieranych
   * z rozwijanych list obu hubów. Nigdzie indziej (logo, języki — bez dźwięku). */
  var audioCtx = null;
  function playClick() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var t = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1320, t + 0.04);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(t); osc.stop(t + 0.1);
    } catch (e) { /* dźwięk jest ozdobą — nigdy nie blokuje nawigacji */ }
  }
  /* linki nawigacyjne: krótka pauza, by dźwięk wybrzmiał przed przejściem */
  function navigateWithSound(a, e) {
    playClick();
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;                       // kotwica na tej samej stronie
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return; // nowa karta — nie przechwytuj
    if (a.target && a.target !== '_self') return;
    e.preventDefault();
    setTimeout(function () { location.href = a.href; }, 120);
  }

  /* ---- montaż + interakcje ---- */
  function mount() {
    var host = document.getElementById('site-header');
    if (!host) return;
    if (!document.getElementById('csh-style')) {
      var st = document.createElement('style'); st.id = 'csh-style'; st.textContent = CSS; document.head.appendChild(st);
    }
    host.className = 'csh-header';
    host.setAttribute('data-i18n-skip', ''); // globalny i18n pomija nagłówek — tłumaczymy sami
    host.innerHTML = render();

    /* pasek zapraszający na pełną wersję hiszpańską (tylko strony mające parę w /es/) */
    var esUrl = esAlt();
    if (esUrl && !document.getElementById('csh-es-bar')) {
      var bar = document.createElement('div');
      bar.id = 'csh-es-bar';
      bar.className = 'csh-es-bar';
      bar.setAttribute('data-i18n-skip', '');   // to zdanie ma zostać po hiszpańsku
      bar.innerHTML = '<div class="csh-es-in">'
        + '<svg class="csh-es-fl" viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="16" fill="#c60b1e"/><rect y="4" width="24" height="8" fill="#ffc400"/></svg>'
        + '<a href="' + esUrl + '" hreflang="es" lang="es">Esta p&aacute;gina en espa&ntilde;ol &rarr;</a></div>';
      var after = host.nextElementSibling;
      if (after && after.classList && after.classList.contains('flagbar')) after.insertAdjacentElement('afterend', bar);
      else host.insertAdjacentElement('afterend', bar);
    }

    host.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.csh-more-btn') : null;
      if (btn) {
        e.preventDefault();
        playClick(); // główny przycisk hubu (Jestem cudzoziemcem / Jestem pracodawcą)
        var more = btn.parentNode, open = more.classList.contains('open');
        host.querySelectorAll('.csh-more.open').forEach(function (m) {
          m.classList.remove('open'); var b = m.querySelector('.csh-more-btn'); if (b) b.setAttribute('aria-expanded', 'false');
        });
        if (!open) { more.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
        return;
      }
      if (e.target.closest && e.target.closest('.csh-burger')) { host.classList.toggle('csh-open'); return; }
      /* dźwięk: pozycje z rozwijanych list hubów + linki paska (Kalkulator, CTA) */
      var a = e.target.closest ? e.target.closest('.csh-more-menu a, .csh-menu > a') : null;
      if (a) navigateWithSound(a, e);
    });
    document.addEventListener('click', function (e) {
      if (host.contains(e.target)) return;
      host.querySelectorAll('.csh-more.open').forEach(function (m) {
        m.classList.remove('open'); var b = m.querySelector('.csh-more-btn'); if (b) b.setAttribute('aria-expanded', 'false');
      });
    });

    // język: reaguj na przełącznik i18n; ustaw stan początkowy z localStorage/URL
    document.addEventListener('cosc:langchange', function (e) { applyLang(e && e.detail && e.detail.lang); });
    var init = 'pl';
    if (!IS_PRACODAWCA_PAGE) {
      try {
        var q = new URLSearchParams(location.search).get('lang');
        init = q || localStorage.getItem('cosc_lang') || 'pl';
      } catch (e2) {}
    } else {
      /* strona pracodawców = zawsze polski: chowamy przełącznik języków */
      var ls = document.createElement('style');
      ls.textContent = '.csh-header .lang{display:none !important}';
      document.head.appendChild(ls);
    }
    applyLang(init);
  }

  if (document.getElementById('site-header')) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
