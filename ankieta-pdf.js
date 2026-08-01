/* ankieta-pdf.js — generuje PDF wypełnionej ankiety wraz ze zgodą RODO.
   Nagłówek i stopka = OFICJALNY WZÓR COSC (pliki graficzne cosc-pasek-gora.png / cosc-pasek-dol.png),
   ten sam pasek we wszystkich generowanych dokumentach. Cały pasek jest linkiem do cosc.org.pl.
   Używa pdfmake (ładowane leniwie z CDN).
   window.CoscPdf.generate(data) -> Promise<{base64, filename}>  (efekt uboczny: pobranie PDF). */
window.CoscPdf = (function(){
  "use strict";

  var PAGE_W = 595.28; // A4 portrait (pt) — pasek na całą szerokość strony
  var ASSET_TOP = 'cosc-pasek-gora.png';
  var ASSET_BOT = 'cosc-pasek-dol.png';
  var WWW = 'https://cosc.org.pl';
  var TOP = null, BOT = null; // {dataURL,w,h}

  var RODO_TEKST = 'Wyrażam zgodę na przetwarzanie moich danych osobowych przez Dariusz Włodarczyk Kancelaria '
    + '(NIP 1250476187, ul. Kuropatwy 34S, 02-892 Warszawa) w zakresie niezbędnym do przygotowania i złożenia '
    + 'wniosku lub pisma, którego dotyczy niniejsza ankieta — w szczególności w sprawie legalizacji pobytu, pracy '
    + 'lub uzyskania świadczeń bądź zasiłków — oraz do kontaktu w tej sprawie. Zgodę można wycofać w każdej chwili, '
    + 'pisząc na office@cosc.org.pl.';

  // Sekcje i etykiety pól (kolejność = kolejność w PDF). Bez wynagrodzenia.
  var SEKCJE = [
    ['Rodzaj sprawy', [['rodzaj_wniosku','Rodzaj wniosku'],['rodzaj_swiadczenia','Świadczenie']]],
    ['Dane osobowe', [['imie','Imię'],['nazwisko','Nazwisko'],['data_urodzenia','Data urodzenia'],['plec','Płeć'],
      ['kraj_urodzenia','Kraj urodzenia'],['narodowosc','Narodowość'],['obywatelstwo','Obywatelstwo'],
      ['stan_cywilny','Stan cywilny'],['wyksztalcenie','Wykształcenie'],['kolor_oczu','Kolor oczu'],
      ['numer_paszportu','Seria i nr paszportu'],['waznosc_paszportu','Ważność paszportu'],
      ['email','E-mail'],['telefon_wlasny','Telefon własny'],['telefon_pl','Telefon polski']]],
    ['Miejsce pobytu i pracodawca', [['wojewodztwo_pobytu','Województwo pobytu'],['adres_pobytu','Adres pobytu w Polsce'],
      ['pracodawca_nazwa','Nazwa pracodawcy'],['pracodawca_nip','NIP pracodawcy'],['stanowisko','Stanowisko'],
      ['pracodawca_adres','Adres miejsca pracy'],['praca_od','Praca od'],['rodzaj_umowy','Rodzaj umowy'],
      ['wymiar_pracy','Wymiar / warunki']]],
    ['Rodzina w Polsce', [['rodzina_w_pl','Członkowie rodziny w Polsce']]],
    ['Pobyt na terytorium RP', [['data_ostatniego_wjazdu','Data ostatniego wjazdu'],
      ['dni_od_ostatniego_wjazdu','Dni od ostatniego wjazdu'],['podstawa_pobytu','Podstawa pobytu'],
      ['wniosek_zlozony','Wniosek o kartę już złożony'],['wojewodztwo_wniosku','Województwo wniosku'],
      ['data_zlozenia_wniosku','Data złożenia wniosku'],['wczesniejsze_pobyty','Wcześniejsze pobyty']]],
    ['Pytania dodatkowe', [['q_zatrzymanie','Zatrzymanie / areszt / zakaz'],['q_zatrzymanie_opis','— opis'],
      ['q_karany','Karany sądownie w RP'],['q_postepowanie','Toczące się postępowanie'],
      ['q_zobowiazania','Zobowiązania z orzeczeń / alimenty']]],
    ['Uwagi', [['uwagi','Uwagi dodatkowe']]]
  ];

  function v(data,k){ var x=data[k]; return (x===undefined||x===null||String(x).trim()==='')?'—':String(x); }

  function loadScript(src){
    return new Promise(function(res,rej){
      var s=document.createElement('script'); s.src=src; s.async=true;
      s.onload=res; s.onerror=function(){ rej(new Error('Nie można załadować '+src)); };
      document.head.appendChild(s);
    });
  }
  function ensurePdfMake(){
    if(window.pdfMake && window.pdfMake.createPdf) return Promise.resolve();
    if(window.__pdfmakeLoading) return window.__pdfmakeLoading;
    window.__pdfmakeLoading = loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/pdfmake.min.js')
      .then(function(){ return loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/vfs_fonts.js'); });
    return window.__pdfmakeLoading;
  }

  // Wczytuje pasek (obraz) z tego samego serwera i zwraca dataURL + wymiary.
  function loadImg(url){
    return new Promise(function(res,rej){
      var img=new Image();
      img.onload=function(){
        try{
          var c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight;
          c.getContext('2d').drawImage(img,0,0);
          res({dataURL:c.toDataURL('image/png'), w:img.naturalWidth, h:img.naturalHeight});
        }catch(e){ rej(e); }
      };
      img.onerror=function(){ rej(new Error('Nie można wczytać '+url)); };
      img.src=url;
    });
  }
  function ensureAssets(){
    var p=[];
    if(!TOP) p.push(loadImg(ASSET_TOP).then(function(r){TOP=r;}).catch(function(){TOP=null;}));
    if(!BOT) p.push(loadImg(ASSET_BOT).then(function(r){BOT=r;}).catch(function(){BOT=null;}));
    return Promise.all(p);
  }

  function sekcjaTabela(data, pola){
    var body = pola.map(function(p){ return [{text:p[1], bold:true, color:'#16244c'}, {text:v(data,p[0])}]; });
    return { table:{ widths:['40%','60%'], body:body }, layout:'lightHorizontalLines', margin:[0,0,0,10] };
  }

  function listaZJson(jsonStr, tytul, kolumny){
    try{
      var arr = JSON.parse(jsonStr||'[]');
      arr = arr.filter(function(o){ return o && Object.keys(o).some(function(k){ return o[k]; }); });
      if(!arr.length) return null;
      var head = kolumny.map(function(c){ return {text:c[1], bold:true, color:'#16244c', fontSize:9}; });
      var rows = arr.map(function(o){ return kolumny.map(function(c){ return {text:(o[c[0]]||'—'), fontSize:9}; }); });
      return [
        {text:tytul, bold:true, margin:[0,4,0,3]},
        { table:{ widths:kolumny.map(function(){return '*';}), body:[head].concat(rows) }, layout:'lightHorizontalLines', margin:[0,0,0,10] }
      ];
    }catch(e){ return null; }
  }

  function paskiHeaderFooter(dd){
    // Nagłówek = pasek górny (wzór), stopka = pasek dolny (wzór). Cały pasek klika w cosc.org.pl.
    var topH = TOP ? (PAGE_W * TOP.h / TOP.w) : 0;
    var botH = BOT ? (PAGE_W * BOT.h / BOT.w) : 0;
    dd.pageMargins = [40, (topH || 40) + 10, 40, (botH || 24) + 8];
    if(TOP){
      dd.header = function(){ return { image:TOP.dataURL, width:PAGE_W, link:WWW, margin:[0,0,0,0] }; };
    }
    if(BOT){
      dd.footer = function(){ return { image:BOT.dataURL, width:PAGE_W, link:WWW, margin:[0,0,0,0] }; };
    }
    return dd;
  }

  function build(data){
    var tytul = data.rodzaj_wniosku || data._formularz || 'Ankieta';
    var kiedy = data._data_wyslania ? new Date(data._data_wyslania) : new Date();
    var kiedyStr = kiedy.toLocaleString('pl-PL');
    var content = [
      {text:'Ankieta danych do wniosku', fontSize:18, bold:true, margin:[0,4,0,2]},
      {text:'Rodzaj sprawy: '+tytul, fontSize:11, color:'#5B6478'},
      {text:'Data wypełnienia: '+kiedyStr, fontSize:10, color:'#5B6478', margin:[0,0,0,12]}
    ];
    SEKCJE.forEach(function(s){
      content.push({text:s[0], fontSize:13, bold:true, color:'#4636c9', margin:[0,6,0,4]});
      content.push(sekcjaTabela(data, s[1]));
      if(s[0]==='Rodzina w Polsce'){
        var fam = listaZJson(data.rodzina_czlonkowie, 'Wykaz członków rodziny',
          [['pokrewienstwo','Pokrewieństwo'],['plec','Płeć'],['data_urodzenia','Data ur.'],['obywatelstwo','Obywatelstwo'],['ubiega_pobyt','Pobyt?'],['na_utrzymaniu','Na utrzym.?']]);
        if(fam) content = content.concat(fam);
      }
      if(s[0]==='Pobyt na terytorium RP'){
        var rp = listaZJson(data.pobyty_rp, 'Pobyty na terytorium RP', [['wjazd','Wjazd'],['wyjazd','Wyjazd'],['dni','Dni'],['podstawa','Podstawa']]);
        if(rp) content = content.concat(rp);
        var zg = listaZJson(data.pobyty_zagraniczne, 'Pobyty zagraniczne (5 lat)', [['wjazd','Wjazd'],['wyjazd','Wyjazd'],['dni','Dni'],['panstwo','Państwo']]);
        if(zg) content = content.concat(zg);
      }
    });
    // Zgoda RODO — dane osoby udzielającej zgody + administratora
    content.push({text:'Zgoda na przetwarzanie danych osobowych', fontSize:13, bold:true, color:'#4636c9', margin:[0,12,0,4]});
    content.push({text:'Dane osoby udzielającej zgody (z ankiety):', fontSize:10, bold:true, margin:[0,0,0,3]});
    content.push({ table:{ widths:['38%','62%'], body:[
      [{text:'Imię i nazwisko', bold:true, color:'#16244c'}, {text:((data.imie||'')+' '+(data.nazwisko||'')).trim()||'—'}],
      [{text:'Data urodzenia', bold:true, color:'#16244c'}, {text:v(data,'data_urodzenia')}],
      [{text:'Miejsce urodzenia', bold:true, color:'#16244c'}, {text:v(data,'kraj_urodzenia')}],
      [{text:'Seria i numer paszportu', bold:true, color:'#16244c'}, {text:v(data,'numer_paszportu')}],
      [{text:'Obywatelstwo', bold:true, color:'#16244c'}, {text:v(data,'obywatelstwo')}]
    ]}, layout:'lightHorizontalLines', margin:[0,0,0,8] });
    content.push({text:RODO_TEKST, fontSize:10, margin:[0,0,0,8]});
    content.push({text:'Zgody udzielono (administrator danych osobowych):', fontSize:10, bold:true, margin:[0,0,0,1]});
    content.push({text:'Dariusz Włodarczyk Kancelaria\nul. Kuropatwy 34S, 02-892 Warszawa\nNIP 1250476187', fontSize:10, margin:[0,0,0,8]});
    content.push({text:'Wyrażono zgodę: '+((data.rodo_zgoda||'').toLowerCase()==='tak'?'TAK':(data.rodo_zgoda||'—')),
      bold:true, color:(((data.rodo_zgoda||'').toLowerCase()==='tak')?'#1a9a52':'#d4213d')});
    content.push({text:'Zgoda i ankieta zarejestrowane: '+kiedyStr, fontSize:9, color:'#5B6478', margin:[0,2,0,0]});

    return paskiHeaderFooter({ content: content, defaultStyle:{ fontSize:11, lineHeight:1.15 } });
  }

  function nazwaPliku(data){
    var s = ('Ankieta_COSC_'+(data.nazwisko||'')+'_'+(data.imie||'')).replace(/[^A-Za-z0-9ĄĆĘŁŃÓŚŻŹąćęłńóśżź_]+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'');
    return (s||'Ankieta_COSC')+'.pdf';
  }

  function generate(data){
    return Promise.all([ensurePdfMake(), ensureAssets()]).then(function(){
      return new Promise(function(resolve,reject){
        try{
          var dd = build(data);
          var fn = nazwaPliku(data);
          var pdf = pdfMake.createPdf(dd);
          pdf.getBase64(function(b64){ resolve({ base64:b64, filename:fn }); });
        }catch(err){ reject(err); }
      });
    });
  }

  function download(data){
    return Promise.all([ensurePdfMake(), ensureAssets()]).then(function(){
      var dd = build(data); var fn = nazwaPliku(data);
      pdfMake.createPdf(dd).download(fn); return fn;
    });
  }
  return { generate: generate, download: download };
})();
