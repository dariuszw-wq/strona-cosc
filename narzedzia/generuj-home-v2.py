"""Generuje pięć statycznych wersji nowej strony głównej. Wymaga beautifulsoup4."""
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Comment, Doctype
import json, re, shutil, importlib.util
from urllib.parse import urlsplit
REPO=Path(__file__).resolve().parent.parent
ROOT=REPO/'narzedzia/cosc-v2'
STAMP='redesign-2026-11-06'
changed=[]
def save(name,text):
 p=REPO/name
 if p.exists() and not Path(str(p)+'.bak-'+STAMP).exists(): shutil.copy2(p,str(p)+'.bak-'+STAMP)
 p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(text,encoding='utf-8'); changed.append(name)
def soup(s): return BeautifulSoup(s,'html.parser')
def serialize(d):
 return str(d).replace('viewbox=', 'viewBox=').replace('preserveaspectratio=', 'preserveAspectRatio=')
def meta(d,key,value,prop=False):
 a='property' if prop else 'name'; tag=d.find('meta',attrs={a:key})
 if tag is None: tag=d.new_tag('meta',attrs={a:key}); d.head.append(tag)
 tag['content']=value
def links(d):
 for tag in d.find_all(True):
  for a in ('href','src','poster'):
   if tag.get(a,'').startswith('https://cosc.org.pl/') and tag.name not in ('meta','link'):
    tag[a]=tag[a].replace('https://cosc.org.pl/','/',1)
def modern(d):
 d.body['class']=list(d.body.get('class',[]))+['cosc-modern']
 for node in d.select('meta[name="robots"]'): node.decompose()
 for tag in d.select('[href],[src]'):
  for a in ('href','src'):
   if a not in tag.attrs: continue
   v=tag.get(a,'')
   tag[a]= {'styles.css':'/cosc-v2.css','article.css':'/cosc-article-v2.css','app.js':'/cosc-home-v2.js','site-header.js':'/site-header.js'}.get(v,v) if a in tag.attrs else tag.get(a)
   if tag.get(a,'').startswith('assets/'): tag[a]='/assets/cosc-v2/'+tag[a][7:]
   if tag.get(a) is None: tag.attrs.pop(a,None)
 for n in d.select('.mobile-contact'): n.decompose()
 links(d)
 return d
spec=importlib.util.spec_from_file_location('gen',REPO/'narzedzia/generuj-wersje-jezykowe.py')
gen=importlib.util.module_from_spec(spec); spec.loader.exec_module(gen)
def lang_map(lang):
 m={p.name:lang+'/'+p.name for p in (REPO/lang).glob('*.html')}
 m.update(gen.MANUAL[lang]); m['index.html']=lang+'/index.html'
 return m

home=soup((REPO/'index.html').read_text(encoding='utf-8'))
schema=json.loads(home.select_one('script[type="application/ld+json"]').string)
# Pełne tłumaczenie tekstu nowej strony głównej; bez tłumaczenia w przeglądarce.
texts=json.loads((ROOT/'homepage-texts.json').read_text(encoding='utf-8'))
maps={lang:{} for lang in gen.LANGS}
for row in (ROOT/'home-translations.txt').read_text(encoding='utf-8').splitlines():
 fields=row.split('^'); assert len(fields)==6,row
 for i,lang in enumerate(gen.LANGS): maps[lang][texts[int(fields[0])]]=fields[i+1]
desc={
 'en':'Residence cards and work legalisation in Poland. Trusted Profile, MOS instructions and a Schengen stay calculator. Discover how COSC can help.',
 'es':'Tarjeta de residencia y trabajo legal en Polonia. Perfil de Confianza, instrucciones MOS y calculadora Schengen. Descubre la ayuda de COSC.',
 'uk':'Карта побиту та легалізація роботи в Польщі. Довірений профіль, інструкція MOS і калькулятор днів Шенгену. Дізнайтеся про допомогу COSC.',
 'ru':'Карта побыта и легализация работы в Польше. Доверенный профиль, инструкция MOS и калькулятор дней Шенгена. Узнайте о помощи COSC.',
 'fr':'Carte de séjour et travail légal en Pologne. Profil de confiance, guide MOS et calculateur Schengen. Découvrez l’accompagnement de COSC.'}
keep={texts[i] for i in [0,50,52,53,54,96,123,134,154,155,159,165]}
for lang in gen.LANGS:
 d=soup(serialize(home)); d.html['lang']=lang
 for a in d.select('a[href="/pracodawcy/"]'): a.decompose()
 missing=[]
 for n in list(d.find_all(string=True)):
  if isinstance(n,(Comment,Doctype)) or n.parent.name in ('script','style','svg') or n.find_parent('svg'): continue
  k=str(n).strip()
  if k in maps[lang]: n.replace_with(str(n).replace(k,maps[lang][k]))
  elif k and k not in keep and re.search('[A-Za-zÀ-ž]',k) and not k.startswith(('+48','COSC','DW','01','02','03')): missing.append(k)
 for tag in d.find_all(True):
  for a in ('alt','aria-label','title'):
   k=tag.get(a,''); tag[a]=maps[lang].get(k,k) if a in tag.attrs else tag.get(a)
   if tag.get(a) is None: tag.attrs.pop(a,None)
  for a in ('href','src','poster'):
   v=tag.get(a,'')
   if not v or tag.name=='link' and tag.get('rel') in (['canonical'],['alternate']):continue
   if v.startswith(('https:','http:','mailto:','tel:','#','data:')):continue
   path,sep,frag=v.partition('#'); key=path.lstrip('/')
   target=lang_map(lang).get(key)
   if target: tag[a]='/'+target.replace('index.html','')+(sep+frag if sep else '')
   elif not v.startswith('/'):tag[a]='/'+v
 assert not missing,(lang,missing)
 url='https://cosc.org.pl/'+lang+'/'
 d.find('link',rel='canonical')['href']=url
 meta(d,'description',desc[lang]);meta(d,'og:description',desc[lang],True);meta(d,'og:title',d.title.get_text(),True);meta(d,'og:url',url,True)
 sd=dict(schema,url=url,inLanguage=lang);sd['@id']=url+'#website'
 d.select_one('script[type="application/ld+json"]').string=json.dumps(sd,ensure_ascii=False)
 output=serialize(d)
 for tag in d.select('link[rel="canonical"],link[hreflang]'):
  replacement='<link rel="'+tag['rel'][0]+'"'+(' hreflang="'+tag['hreflang']+'"' if tag.get('hreflang') else '')+' href="'+tag['href']+'">'
  output=output.replace(str(tag),replacement)
 if lang=='es': output=output.replace('/kontakt.html?temat=studia','/es/contacto.html?temat=studia').replace('CALCULADORA SCHENGEN EN POLACO','CALCULADORA SCHENGEN EN ESPAÑOL')
 if lang=='en': output=output.replace('/kontakt.html?temat=studia','/en/contact.html?temat=studia')
 save(lang+'/index.html',output)
