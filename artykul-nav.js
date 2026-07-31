/*!
 * COSC — nawigacja Poprzedni/Następny artykuł (silnik wspólny)
 * ------------------------------------------------------------
 * Jeden plik dla wszystkich artykułów własnych. Pobiera news-data.json,
 * ustala pozycję bieżącego artykułu wśród materiałów własnych (sortowanie
 * jak w Aktualnościach: od najnowszego) i wstawia przed stopką pasek:
 * [← Poprzedni artykuł] [Wszystkie aktualności] [Następny artykuł →].
 * Działa tylko na opublikowanych artykułach (obecnych w news-data.json);
 * na pozostałych stronach nie robi nic. Etykiety w 6 językach (cosc_lang).
 */
(function () {
  'use strict';
  var L = {
    pl: { prev: '← Poprzedni artykuł', next: 'Następny artykuł →', all: 'Wszystkie aktualności' },
    en: { prev: '← Previous article', next: 'Next article →', all: 'All news' },
    es: { prev: '← Artículo anterior', next: 'Artículo siguiente →', all: 'Todas las noticias' },
    uk: { prev: '← Попередня стаття', next: 'Наступна стаття →', all: 'Усі новини' },
    ru: { prev: '← Предыдущая статья', next: 'Следующая статья →', all: 'Все новости' },
    fr: { prev: '← Article précédent', next: 'Article suivant →', all: 'Toutes les actualités' }
  };
  function lang() {
    try { var q = new URLSearchParams(location.search).get('lang'); if (q && L[q]) return q; } catch (e) {}
    try { var s = localStorage.getItem('cosc_lang'); if (s && L[s]) return s; } catch (e) {}
    return 'pl';
  }
  function pickT(it, lg) {
    if (lg !== 'pl' && it.t && it.t[lg] && it.t[lg].title) return it.t[lg].title;
    return it.title || '';
  }
  var file = (location.pathname.split('/').pop() || '').split('?')[0];
  if (!/^artykul-.*\.html$/.test(file)) return;

  fetch('news-data.json?_=' + Date.now())
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (data) {
      var own = (data.items || []).filter(function (it) {
        return it.url && !/^https?:/i.test(it.url);
      }).sort(function (a, b) { return String(b.added || '').localeCompare(String(a.added || '')); });
      var idx = -1;
      for (var i = 0; i < own.length; i++) { if (own[i].url === file) { idx = i; break; } }
      if (idx < 0) return;
      var newer = idx > 0 ? own[idx - 1] : null;      // nowszy artykuł
      var older = idx < own.length - 1 ? own[idx + 1] : null; // starszy artykuł

      var host = document.createElement('section');
      host.id = 'artykul-nav';
      document.body.insertBefore(host, document.querySelector('footer'));

      function card(item, dir, U) {
        if (!item) return '<span></span>';
        var lg = lang();
        var t = pickT(item, lg);
        if (t.length > 74) t = t.slice(0, 71) + '…';
        return '<a href="' + item.url + '" style="flex:1 1 240px;min-width:0;background:#fff;border:1px solid #e6e9f0;border-radius:12px;padding:14px 16px;text-decoration:none;display:block;transition:border-color .2s,box-shadow .2s" onmouseover="this.style.borderColor=\'#4636c9\'" onmouseout="this.style.borderColor=\'#e6e9f0\'">'
          + '<span style="display:block;font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#4636c9;margin-bottom:5px;text-align:' + (dir === 'next' ? 'right' : 'left') + '">' + (dir === 'next' ? U.next : U.prev) + '</span>'
          + '<span style="display:block;font-size:14px;font-weight:600;color:#16244c;line-height:1.4;text-align:' + (dir === 'next' ? 'right' : 'left') + '">' + t.replace(/</g, '&lt;') + '</span></a>';
      }
      function render() {
        var U = L[lang()] || L.pl;
        host.innerHTML = '<div style="max-width:820px;margin:0 auto;padding:6px 20px 34px">'
          + '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:stretch">'
          + card(older, 'prev', U) + card(newer, 'next', U) + '</div>'
          + '<div style="text-align:center;margin-top:12px"><a href="aktualnosci.html" style="font-size:13.5px;font-weight:700;color:#4636c9;text-decoration:none">' + U.all + '</a></div>'
          + '</div>';
      }
      render();
      document.addEventListener('cosc:langchange', render);
    })
    .catch(function () { /* brak danych = brak nawigacji, strona działa normalnie */ });
})();
