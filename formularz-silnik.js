/* ============================================================
   COSC — SILNIK FORMULARZY (wspólny dla całej strony)
   Jedno miejsce z adresem Apps Script i funkcją wysyłki.
   Podpinany w <head> każdej strony z formularzem/ankietą:
   <script src="formularz-silnik.js"></script>
   Użycie w kodzie strony:
     const APPS_SCRIPT_URL = window.COSC_ANKIETY.URL;   // adres
     window.COSC_ANKIETY.wyslij(dane).then(out => ...)  // lub wysyłka
   Zmiana adresu wdrożenia = edycja TYLKO tego pliku.
   ============================================================ */
(function(){
  'use strict';
  var URL = 'https://script.google.com/macros/s/AKfycbwC7lGyiNjMGYV4ihMOXK4lfqRYeW7DSDA4673qWpANoIm26_30qNiRT0jODZpNbhWw/exec';

  /* Wysyła obiekt danych do arkusza Google.
     Wymagane pole: _formularz (nazwa zakładki w arkuszu).
     Zwraca Promise z odpowiedzią {ok:true/false, ...}. */
  function wyslij(dane){
    if(!dane || typeof dane !== 'object') return Promise.reject(new Error('COSC_ANKIETY.wyslij: brak danych'));
    if(!dane._formularz) dane._formularz = 'Zgłoszenia';
    if(!dane._data_wyslania) dane._data_wyslania = new Date().toISOString();
    return fetch(URL, {
      method: 'POST',
      mode: 'cors',
      headers: {'Content-Type': 'text/plain;charset=utf-8'},
      body: JSON.stringify(dane)
    }).then(function(r){ return r.json().catch(function(){ return {ok: r.ok}; }); });
  }

  window.COSC_ANKIETY = { URL: URL, wyslij: wyslij };
})();
