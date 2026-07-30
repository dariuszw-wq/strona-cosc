/*
 * i18n/extract.js — generator słowników (WIELOSTRONICOWY).
 * Uruchom:  node i18n/extract.js
 * Skanuje pliki z FILES, wybiera te same "liście" co silnik i18n.js,
 * a dodatkowo <title> i meta description KAŻDEJ strony traktuje jako klucze.
 * Zapisuje i18n/pl.json (referencja) oraz szablony en/es/uk/ru/fr.
 *
 * REGUŁA (BLOCK / SKIP / collapse / collectLeaves) MUSI być identyczna z i18n.js!
 * Kolejność plików jest STAŁA — dzięki temu klucze z index.html zachowują pozycje.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const DIR = __dirname;
const ROOT = path.join(DIR, '..');
const FILES = ['index.html', 'aktualnosci.html']; // kolejność ma znaczenie

const BLOCK = ['div','section','header','footer','nav','main','article','aside',
  'ul','ol','dl','li','dd','dt','p','h1','h2','h3','h4','h5','h6',
  'summary','details','form','table','thead','tbody','tr','td','th','figure','figcaption'];
const BLOCK_SEL = BLOCK.join(',');
const SKIP_SEL = 'script,style,svg,.rotator,.lang,.langbox,.n,.cnt,.rc-mrz,[data-i18n-skip],[translate="no"]';
const ATTRS = ['aria-label','title','placeholder','alt'];

const collapse = s => String(s).replace(/\s+/g,' ').trim();
const hasLetter = s => /\p{L}/u.test(s);

function collectLeaves(root, doc, out){
  out = out || [];
  const kids = root.children;
  for (let i=0;i<kids.length;i++){
    const el = kids[i];
    if (el.matches && el.matches(SKIP_SEL)) continue;
    const tag = el.tagName.toLowerCase();
    if (tag==='svg'||tag==='script'||tag==='style') continue;
    const hasBlock = el.querySelector ? el.querySelector(BLOCK_SEL) : null;
    const hasSvg = el.querySelector ? el.querySelector('svg') : null;
    if (!hasBlock && !hasSvg){
      if (collapse(el.textContent).length) out.push(el);
    } else {
      collectLeaves(el, doc, out);
    }
  }
  return out;
}

const keys = [];
const seen = new Set();
function add(k){ k = collapse(k); if (k && hasLetter(k) && !seen.has(k)){ seen.add(k); keys.push(k); } }

for (const file of FILES){
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)){ console.log('POMIJAM (brak):', file); continue; }
  const doc = new JSDOM(fs.readFileSync(p,'utf8')).window.document;
  // 1) teksty (liście)
  collectLeaves(doc.body, doc, []).forEach(el => add(el.innerHTML));
  // 2) <title>
  if (doc.title) add(doc.title);
  // 3) meta description
  const de = doc.querySelector('meta[name="description"]');
  if (de && de.getAttribute('content')) add(de.getAttribute('content'));
  // 4) atrybuty
  doc.querySelectorAll('['+ATTRS.join('],[')+']').forEach(el => {
    if (el.matches && el.matches(SKIP_SEL)) return;
    ATTRS.forEach(a => { const v = el.getAttribute(a); if (v) add(v); });
  });
  console.log(file, '→ kluczy łącznie:', keys.length);
}

function build(lang, name, fill){
  const strings = {};
  keys.forEach(k => { strings[k] = fill ? k : ''; });
  return { _meta: { lang, name, count: keys.length,
      note: 'Klucz = tekst źródłowy PL (może zawierać HTML). Pusta wartość = pokazuje polski oryginał.' },
    strings };
}

const LANGS = [['en','English'],['es','Español'],['uk','Українська'],['ru','Русский'],['fr','Français']];
fs.writeFileSync(path.join(DIR,'pl.json'), JSON.stringify(build('pl','Polski',true), null, 2), 'utf8');
LANGS.forEach(([code,name]) =>
  fs.writeFileSync(path.join(DIR,code+'.json'), JSON.stringify(build(code,name,false), null, 2), 'utf8'));
console.log('Zapisano pl.json +', LANGS.map(l=>l[0]+'.json').join(', '), '| kluczy:', keys.length);
