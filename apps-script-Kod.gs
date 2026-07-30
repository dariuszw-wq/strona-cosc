/**
 * COSC — odbiór ankiet z formularza na stronie.
 *  1) dopisuje wiersz do arkusza (każde pole formularza = osobna kolumna),
 *  2) zapisuje PDF ankiety (wraz ze zgodą RODO) na Dysku Google,
 *  3) wysyła PDF mailem do kancelarii oraz do wypełniającego.
 *
 * Skrypt POWIĄZANY z arkuszem: otwórz arkusz Google → Rozszerzenia → Apps Script,
 * wklej ten kod, zapisz i wdróż jako aplikację internetową (instrukcja w osobnym pliku).
 */

var KANCELARIA_EMAIL = 'office@cosc.org.pl, dariusz.w@kancelaria-trc.pl';   // dokąd wysyłać zgłoszenia (można podać kilka adresów po przecinku)
var NAZWA_FOLDERU    = 'Ankiety COSC';         // folder na Dysku Google na PDF-y
var NAZWA_ARKUSZA    = 'Zgłoszenia';           // zakładka w arkuszu

function doPost(e){
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try{
    var data = JSON.parse(e.postData.contents);

    var pdfB64  = data.pdfBase64;   delete data.pdfBase64;
    var pdfName = data.pdfFilename || 'Ankieta_COSC.pdf'; delete data.pdfFilename;

    zapiszWiersz_(data);

    var mailOk = true;
    if(pdfB64){
      var blob = Utilities.newBlob(Utilities.base64Decode(pdfB64), 'application/pdf', pdfName);
      folder_().createFile(blob);
      try{ wyslijMaile_(blob, data); }catch(mailErr){ mailOk = false; } // dane już zapisane — błąd maila nie przerywa
    }
    return json_({ok:true, mail:mailOk});
  }catch(err){
    return json_({ok:false, error:String(err)});
  }finally{
    lock.releaseLock();
  }
}

function json_(o){
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function arkusz_(){
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(NAZWA_ARKUSZA);
  if(!sh) sh = ss.insertSheet(NAZWA_ARKUSZA);
  return sh;
}

/* Dopisuje wiersz; automatycznie tworzy nagłówki i dodaje nowe kolumny, gdy pojawią się nowe pola. */
function zapiszWiersz_(data){
  var sh = arkusz_();
  var naglowki;
  if(sh.getLastRow() === 0){
    naglowki = Object.keys(data);
    sh.appendRow(naglowki);
  } else {
    naglowki = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var nowe = Object.keys(data).filter(function(k){ return naglowki.indexOf(k) === -1; });
    if(nowe.length){
      sh.getRange(1, naglowki.length + 1, 1, nowe.length).setValues([nowe]);
      naglowki = naglowki.concat(nowe);
    }
  }
  var wiersz = naglowki.map(function(k){ var val = data[k]; return (val === undefined || val === null) ? '' : val; });
  sh.appendRow(wiersz);
}

function folder_(){
  var it = DriveApp.getFoldersByName(NAZWA_FOLDERU);
  return it.hasNext() ? it.next() : DriveApp.createFolder(NAZWA_FOLDERU);
}

function wyslijMaile_(blob, data){
  var kto = ((data.imie || '') + ' ' + (data.nazwisko || '')).trim() || 'cudzoziemiec';
  var temat = 'Nowa ankieta COSC: ' + kto + ' — ' + (data.rodzaj_wniosku || '');
  var trescK = 'Nowa wypełniona ankieta w załączniku (PDF).\n\n'
    + 'Rodzaj wniosku: ' + (data.rodzaj_wniosku || '—') + '\n'
    + (data.rodzaj_swiadczenia ? 'Świadczenie: ' + data.rodzaj_swiadczenia + '\n' : '')
    + 'Zgoda RODO: ' + (data.rodo_zgoda || '—') + '\n'
    + 'E-mail: ' + (data.email || '—') + '  ·  Tel.: ' + (data.telefon_wlasny || '—') + '\n'
    + 'Data: ' + (data._data_wyslania || '') + '\n';
  MailApp.sendEmail({ to: KANCELARIA_EMAIL, subject: temat, body: trescK, attachments: [blob], name: 'Formularz COSC' });

  // kopia do wypełniającego
  if(data.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(data.email))){
    var trescC = 'Dzień dobry,\n\nw załączniku przesyłamy kopię wypełnionej przez Panią/Pana ankiety wraz ze zgodą '
      + 'na przetwarzanie danych osobowych. Skontaktujemy się, aby wspólnie dokończyć wniosek.\n\n'
      + 'Centrum Obsługi Spraw Cudzoziemców\noffice@cosc.org.pl  ·  +48 539 999 549';
    MailApp.sendEmail({ to: data.email, subject: 'Kopia Twojej ankiety — Centrum Obsługi Spraw Cudzoziemców', body: trescC,
      attachments: [blob], name: 'Centrum Obsługi Spraw Cudzoziemców' });
  }
}
