/* Public directory: local filtering; no visitor data sent to COSC. */
(() => {
'use strict';
const labels = {"pl": {"allprov": "Wszystkie województwa", "allcity": "Wszystkie miejscowości", "results": "Liczba wyników:", "map": "Otwórz adres na mapie", "book": "Rezerwacja według wykazu PZ"}, "en": {"allprov": "All provinces", "allcity": "All cities", "results": "Results:", "map": "Open address on map", "book": "Booking link from the PZ directory"}, "es": {"allprov": "Todos los voivodatos", "allcity": "Todas las localidades", "results": "Resultados:", "map": "Abrir dirección en el mapa", "book": "Reserva según el registro PZ"}, "uk": {"allprov": "Усі воєводства", "allcity": "Усі міста", "results": "Кількість результатів:", "map": "Відкрити адресу на карті", "book": "Запис за посиланням із переліку PZ"}, "ru": {"allprov": "Все воеводства", "allcity": "Все города", "results": "Количество результатов:", "map": "Открыть адрес на карте", "book": "Запись по ссылке из перечня PZ"}, "fr": {"allprov": "Toutes les voïvodies", "allcity": "Toutes les villes", "results": "Résultats :", "map": "Ouvrir l’adresse sur la carte", "book": "Réservation selon le répertoire PZ"}};
const form = document.getElementById('directory-form');
if (!form) return;
const search = document.getElementById('point-search');
const province = document.getElementById('point-province');
const city = document.getElementById('point-city');
const cards = Array.from(document.querySelectorAll('.point'));
const groups = Array.from(document.querySelectorAll('.province'));
const fold = s => s.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
const entries = cards.map(el => ({el, text: fold(el.dataset.search), province:el.dataset.province, city:el.dataset.city.toLocaleLowerCase('pl')}));
const currentLabels = () => labels[document.documentElement.lang.split('-')[0]] || labels.pl;
function cities() {
 const before = city.value;
 const names = [...new Set(entries.filter(x => !province.value || x.province === province.value).map(x => x.city))].sort((a,b)=>a.localeCompare(b,'pl'));
 city.replaceChildren(new Option(currentLabels().allcity,''), ...names.map(name => new Option(name.charAt(0).toLocaleUpperCase('pl')+name.slice(1),name)));
 if(names.includes(before)) city.value=before;
}
function filter() {
 const tokens=fold(search.value.trim()).split(/\s+/).filter(Boolean);
 const active=Boolean(tokens.length || province.value || city.value);
 let count=0;
 entries.forEach(x => {
  const match=(!province.value || x.province===province.value) && (!city.value || x.city===city.value) && tokens.every(t => x.text.includes(t));
  x.el.hidden=!match;
  if(match) count++;
 });
 groups.forEach(group => {
  const n=Array.from(group.querySelectorAll('.point')).filter(x=>!x.hidden).length;
  group.hidden=!n;
  group.querySelector('.province-count').textContent='('+n+')';
  group.open=active && n>0;
 });
 document.getElementById('directory-results').value=String(count);
 document.getElementById('empty-results').hidden=count!==0;
}
function translate() {
 const l=currentLabels();
 province.options[0].textContent=l.allprov;
 city.options[0].textContent=l.allcity;
 document.getElementById('results-label').textContent=l.results;
 document.querySelectorAll('[data-action]').forEach(el => {el.textContent=l[el.dataset.action];});
}
form.addEventListener('submit',e=>e.preventDefault());
search.addEventListener('input',filter);
province.addEventListener('change',()=>{cities();filter();});
city.addEventListener('change',filter);
form.addEventListener('reset',()=>setTimeout(()=>{search.value='';province.value='';city.value='';cities();filter();},0));
document.addEventListener('cosc:langchange',translate);
cities();
translate();
})();
