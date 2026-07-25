/*
 * i18n/extract.js — generator słowników.
 * Uruchom:  node i18n/extract.js
 * Wczytuje index.html, wybiera te same "liście" co silnik i18n.js
 * i zapisuje i18n/pl.json (referencja) oraz szablony en/es/uk/ru/fr.
 *
 * REGUŁA (BLOCK / SKIP / collapse / collectLeaves) MUSI być identyczna z i18n.js!
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const DIR = __dirname;
const HTML = fs.readFileSync(path.join(DIR, '..', 'index.html'), 'utf8');
const dom = new JSDOM(HTML);
const doc = dom.window.document;

const BLOCK = ['div','section','header','footer','nav','main','article','aside',
  'ul','ol','dl','li','dd','dt','p','h1','h2','h3','h4','h5','h6',
  'summary','details','form','table','thead','tbody','tr','td','th','figure','figcaption'];
const BLOCK_SEL = BLOCK.join(',');
const SKIP_SEL = 'script,style,svg,.rotator,.lang,.langbox,.n,.cnt,.rc-mrz,[data-i18n-skip],[translate="no"]';
const ATTRS = ['aria-label','title','placeholder','alt'];

const collapse = s => String(s).replace(/\s+/g,' ').trim();
const isSkipped = el => el.matches && el.matches(SKIP_SEL);
// klucz wart tłumaczenia = zawiera co najmniej jedną literę
const hasLetter = s => /\p{L}/u.test(s);

function collectLeaves(root, out){
  out = out || [];
  const kids = root.children;
  for (let i=0;i<kids.length;i++){
    const el = kids[i];
    if (isSkipped(el)) continue;
    const tag = el.tagName.toLowerCase();
    if (tag==='svg'||tag==='script'||tag==='style') continue;
    const hasBlock = el.querySelector ? el.querySelector(BLOCK_SEL) : null;
    const hasSvg = el.querySelector ? el.querySelector('svg') : null;
    if (!hasBlock && !hasSvg){
      if (collapse(el.textContent).length) out.push(el);
    } else {
      collectLeaves(el, out);
    }
  }
  return out;
}

// teksty (liście)
const leaves = collectLeaves(doc.body, []);
const seen = new Set();
const keys = [];
leaves.forEach(el => {
  const k = collapse(el.innerHTML);
  if (k && hasLetter(el.textContent) && !seen.has(k)) { seen.add(k); keys.push(k); }
});

// atrybuty
const attrKeys = [];
const attrSeen = new Set();
doc.querySelectorAll('['+ATTRS.join('],[')+']').forEach(el => {
  if (isSkipped(el)) return;
  ATTRS.forEach(a => {
    const v = el.getAttribute(a);
    if (v && collapse(v).length && !attrSeen.has(collapse(v))){
      attrSeen.add(collapse(v)); attrKeys.push(collapse(v));
    }
  });
});

const title = doc.title || '';
const descEl = doc.querySelector('meta[name="description"]');
const description = descEl ? descEl.getAttribute('content') : '';

console.log('Tekstów (liści):', keys.length, '| atrybutów:', attrKeys.length);

// scal atrybuty do wspólnej mapy strings (klucz = wartość PL)
const allKeys = keys.concat(attrKeys.filter(k => !seen.has(k)));

function build(lang, name, fill){
  const strings = {};
  allKeys.forEach(k => { strings[k] = fill ? k : ''; });
  return {
    _meta: {
      lang, name,
      note: 'Klucz = tekst źródłowy PL (może zawierać HTML: <strong>, <em>, <br>, <a>...). '
          + 'Wpisz tłumaczenie jako wartość. Pusta wartość = pokazuje polski oryginał.',
      count: allKeys.length
    },
    title: fill ? title : '',
    description: fill ? description : '',
    strings
  };
}

const LANGS = [['en','English'],['es','Español'],['uk','Українська'],['ru','Русский'],['fr','Français']];
fs.writeFileSync(path.join(DIR,'pl.json'), JSON.stringify(build('pl','Polski',true), null, 2), 'utf8');
LANGS.forEach(([code,name]) =>
  fs.writeFileSync(path.join(DIR,code+'.json'), JSON.stringify(build(code,name,false), null, 2), 'utf8'));

console.log('Zapisano: pl.json (referencja) +', LANGS.map(l=>l[0]+'.json').join(', '));
