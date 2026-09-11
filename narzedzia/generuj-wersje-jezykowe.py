# -*- coding: utf-8 -*-
"""
COSC — generator STATYCZNYCH wersji jezykowych (/en/ /es/ /uk/ /ru/ /fr/).

Po co: silnik i18n.js tlumaczy strone w przegladarce, wiec Google widzi wylacznie
wersje polska. Ten skrypt wytwarza OSOBNE pliki HTML na kazdy jezyk, juz
przetlumaczone, z wlasnym adresem, canonical i pelnym zestawem hreflang.

Zasada dzialania (musi byc zgodna z i18n/i18n.js — collectLeaves + applyDict):
  1. kluczem slownika jest ZWINIETY innerHTML "liscia" (elementu bez potomkow
     blokowych i bez svg) w polskiej stronie,
  2. dodatkowo tlumaczymy atrybuty aria-label/title/placeholder/alt, <title>
     i meta description,
  3. czego nie ma w slowniku — zostaje po polsku (strona zawsze dziala).

Czego NIE generujemy:
  - stron recznie napisanych w /en/ i /es/ (maja wlasne slugi, sa nadrzedne),
  - sekcji pracodawcy/ (decyzja: wylacznie polski),
  - stron o pokryciu slownikowym < PROG (np. cykl PIP — swiadomie bez tlumaczen),
  - stron generowanych JS-em, gier, formularzy i plikow technicznych.

Uruchomienie z katalogu repozytorium:  python3 narzedzia/generuj-wersje-jezykowe.py
"""
import os, re, sys, json, html, shutil, datetime
import lxml.html as LH
from lxml import etree

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://cosc.org.pl'
LANGS = ['en', 'es', 'uk', 'ru', 'fr']
PROG = 0.80          # minimalne pokrycie slownikowe strony, zeby ja wydac
DATA_ATTR = 'data-cosc-gen'   # znacznik "plik wygenerowany automatycznie"

# --- reguly zgodne z i18n.js ---------------------------------------------
BLOCK = {'div','section','header','footer','nav','main','article','aside',
    'ul','ol','dl','li','dd','dt','p','h1','h2','h3','h4','h5','h6',
    'summary','details','form','table','thead','tbody','tr','td','th','figure','figcaption'}
SKIP_CLASSES = {'rotator','lang','langbox','n','cnt','rc-mrz'}
ATTRS = ['aria-label','title','placeholder','alt']

# --- czego nie wydajemy ---------------------------------------------------
EXCLUDE = {
    '404.html', 'WZOR-artykul-wlasny.html', 'cennik-podglad-tabele.html',
    'pakiet-animacji-mobilnych-demo.html', 'aktualnosci.html',
    'kalkulator-90-180.html', 'narzedzia.html',
}
EXCLUDE_RE = [r'^google[0-9a-f]+\.html$', r'^gra-', r'^formularz-']

# --- strony recznie przetlumaczone (JEDNO zrodlo prawdy: site-header.js) ---
MANUAL = {
 'en': {'index.html':'en/index.html',
        'artykul-karta-pobytu-czasowego.html':'en/temporary-residence-permit-poland.html',
        'wniosek-karta-pobytu-stalego.html':'en/permanent-residence-permit-poland.html',
        'wniosek-karta-pobytu-dla-czlonkow-rodziny.html':'en/family-reunification-poland.html',
        'artykul-mos-jak-zlozyc-wniosek.html':'en/mos-online-application.html',
        'artykul-rodzaje-zezwolen-na-prace-2026.html':'en/work-permit-poland.html',
        'cennik.html':'en/prices-and-services.html',
        'kontakt.html':'en/contact.html'},
 'es': {'index.html':'es/index.html',
        'artykul-karta-pobytu-czasowego.html':'es/tarjeta-de-residencia-polonia.html',
        'artykul-praca-na-wizie-ruch-bezwizowy.html':'es/trabajo-legal-polonia-colombianos.html',
        'artykul-mos-jak-zlozyc-wniosek.html':'es/mos-solicitud-en-linea.html',
        'kalkulator-90-180.html':'es/calculadora-90-180.html',
        'kontakt.html':'es/contacto.html',
        'wniosek-karta-pobytu-stalego.html':'es/residencia-permanente-polonia.html',
        'wniosek-karta-pobytu-dla-czlonkow-rodziny.html':'es/reagrupacion-familiar-polonia.html',
        'cennik.html':'es/precios-y-servicios.html',
        'pierwsze-kroki-po-przyjezdzie.html':'es/primeros-pasos-en-polonia.html',
        'artykul-zmiana-pracodawcy-a-karta-pobytu-terminy.html':'es/cambiar-de-empleador-polonia.html',
        'faq.html':'es/preguntas-frecuentes.html'},
 'uk': {}, 'ru': {}, 'fr': {},
}

HTML_LANG = {'en':'en','es':'es','uk':'uk','ru':'ru','fr':'fr'}

# =========================================================================
def collapse(s):
    return re.sub(r'\s+', ' ', s or '').strip()

def is_skipped(el):
    if not isinstance(el.tag, str): return True
    if el.tag in ('script','style','svg'): return True
    if SKIP_CLASSES & set((el.get('class') or '').split()): return True
    if el.get('data-i18n-skip') is not None: return True
    if el.get('translate') == 'no': return True
    return False

def has_block_or_svg(el):
    for d in el.iterdescendants():
        if isinstance(d.tag, str) and (d.tag in BLOCK or d.tag == 'svg'):
            return True
    return False

def inner_html(el):
    parts = []
    if el.text: parts.append(html.escape(el.text, quote=False))
    for c in el:
        parts.append(etree.tostring(c, encoding='unicode', method='html'))
    return ''.join(parts)

def set_inner_html(el, s):
    frag = LH.fragment_fromstring('<x>' + s + '</x>')
    for c in list(el): el.remove(c)
    el.text = frag.text
    for c in list(frag): el.append(c)

def collect_leaves(root, out=None):
    if out is None: out = []
    for el in root:
        if not isinstance(el.tag, str) or is_skipped(el): continue
        if not has_block_or_svg(el):
            if collapse(''.join(el.itertext())): out.append(el)
        else:
            collect_leaves(el, out)
    return out

SVG_RE = re.compile(r'<svg\b.*?</svg>', re.S | re.I)

def svg_freeze(src):
    """lxml serializuje HTML i zamienia nazwy atrybutow na male litery, co PSUJE
    SVG (viewBox, attributeName, keyTimes sa wrazliwe na wielkosc liter).
    Dlatego przed parsowaniem wycinamy bloki <svg> i wstawiamy puste znaczniki
    zastepcze — rowniez <svg>, zeby regula wykrywania "lisci" z i18n.js dzialala
    identycznie — a po serializacji wklejamy oryginaly bajt w bajt."""
    keep = []
    def sub(m):
        keep.append(m.group(0))
        return '<svg data-cosc-ph="%d"></svg>' % (len(keep) - 1)
    return SVG_RE.sub(sub, src), keep

def svg_thaw(out, keep):
    return re.sub(r'<svg data-cosc-ph="(\d+)"></svg>',
                  lambda m: keep[int(m.group(1))], out)


def has_letters(s):
    return bool(re.search(r'[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]', s))

# =========================================================================
def coverage(page, dicts):
    """Pokrycie slownikowe strony (min ze wszystkich jezykow)."""
    src, _ = svg_freeze(open(os.path.join(ROOT, page), 'rb').read().decode('utf-8'))
    body = LH.document_fromstring(src).find('body')
    keys = [collapse(inner_html(l)) for l in collect_leaves(body)]
    keys = [k for k in keys if has_letters(k)]
    if not keys: return 0.0, 0
    out = 1.0
    for lg in LANGS:
        d = dicts[lg]
        hit = sum(1 for k in keys if d.get(k))
        out = min(out, hit / len(keys))
    return out, len(keys)

def rewrite_href(v, page, lang, local_map):
    """Przelicza odnosnik ze strony polskiej `page` na wersje w katalogu `lang`.

    Odnosnik rozwiazujemy wzgledem katalogu strony zrodlowej, dostajac sciezke od
    korzenia serwisu. Jesli dla tego celu istnieje odpowiednik jezykowy — linkujemy
    do niego wewnatrz katalogu jezykowego; jesli nie — na wersje polska."""
    if not v: return v
    if re.match(r'^(https?:|//|/|mailto:|tel:|data:|javascript:|#)', v): return v
    frag = ''
    m = re.match(r'^([^#?]*)([#?].*)$', v)
    if m: v, frag = m.group(1), m.group(2)
    if v == '': return frag or v
    target = os.path.normpath(os.path.join(os.path.dirname(page), v)).replace(os.sep, '/')
    dir_link = v.endswith('/')
    if dir_link:
        target = (target.rstrip('/') + '/index.html').lstrip('/')
    dest = (lang + '/' + local_map[target]) if target in local_map else target
    out = os.path.relpath(dest, os.path.dirname(lang + '/' + page)).replace(os.sep, '/')
    if dir_link and out.endswith('index.html'):
        out = out[:-len('index.html')] or './'
    return out + frag


def translate_page(page, lang, dicts, local_map, alternates):
    d = dicts[lang]
    src, svgs = svg_freeze(open(os.path.join(ROOT, page), 'rb').read().decode('utf-8'))
    doc = LH.document_fromstring(src)
    body, head = doc.find('body'), doc.find('head')

    # 1) tresc
    for leaf in collect_leaves(body):
        k = collapse(inner_html(leaf))
        t = d.get(k)
        if t:
            try: set_inner_html(leaf, t)
            except Exception: pass
    # 2) atrybuty
    for el in doc.iter():
        if not isinstance(el.tag, str) or is_skipped(el): continue
        for a in ATTRS:
            v = el.get(a)
            if v and collapse(v):
                t = d.get(collapse(v))
                if t: el.set(a, t)
    # 3) title + description
    t_el = head.find('title') if head is not None else None
    if t_el is not None and t_el.text:
        t = d.get(collapse(t_el.text))
        if t: t_el.text = t
    for m in doc.xpath('//meta[@name="description"]'):
        t = d.get(collapse(m.get('content') or ''))
        if t: m.set('content', t)
    # 4) jezyk dokumentu
    doc.set('lang', HTML_LANG[lang])
    doc.set(DATA_ATTR, datetime.date.today().isoformat())

    # 5) sciezki wzgledne
    for el in doc.iter():
        if not isinstance(el.tag, str): continue
        for a in ('href', 'src', 'poster', 'data-src'):
            v = el.get(a)
            if v and not (el.tag == 'link' and el.get('rel') in ('canonical', 'alternate')):
                el.set(a, rewrite_href(v, page, lang, local_map))
    for m in doc.xpath('//meta[@property="og:image" or @property="og:url"]'):
        v = m.get('content') or ''
        if m.get('property') == 'og:image' and not re.match(r'^(https?:|/)', v):
            m.set('content', SITE + '/' + v)

    # 6) i18n.js/i18n.css niepotrzebne — strona jest juz przetlumaczona
    for s in doc.xpath('//script[contains(@src,"i18n/i18n.js")]'): s.getparent().remove(s)
    for s in doc.xpath('//link[contains(@href,"i18n/i18n.css")]'): s.getparent().remove(s)

    # 7) canonical + hreflang (pelny, wzajemny zestaw)
    for el in doc.xpath('//link[@rel="canonical"] | //link[@rel="alternate"][@hreflang]'):
        el.getparent().remove(el)
    self_url = SITE + '/' + lang + '/' + ('' if page == 'index.html' else page)
    can = etree.SubElement(head, 'link'); can.set('rel', 'canonical'); can.set('href', self_url)
    for code, url_ in alternates:
        a = etree.SubElement(head, 'link')
        a.set('rel', 'alternate'); a.set('hreflang', code); a.set('href', url_)
    xd = etree.SubElement(head, 'link')
    xd.set('rel', 'alternate'); xd.set('hreflang', 'x-default')
    xd.set('href', dict(alternates)['pl'])
    for m in doc.xpath('//meta[@property="og:url"]'): m.set('content', self_url)
    for m in doc.xpath('//meta[@property="og:locale"]'): m.set('content', HTML_LANG[lang])

    return svg_thaw('<!DOCTYPE html>\n' + etree.tostring(doc, encoding='unicode', method='html') + '\n', svgs)

def patch_alt_links(page, alternates, self_url=None):
    """Wpisuje do ISTNIEJACEGO pliku ten sam, wzajemny zestaw hreflang.

    Operacja jest czysto tekstowa — plik NIE przechodzi przez parser HTML, wiec
    reszta strony (w tym inline SVG i formatowanie) zostaje nietknieta, a diff
    obejmuje wylacznie znaczniki jezykowe.
    self_url != None => podmienia takze canonical (strony reczne /en/, /es/)."""
    path = os.path.join(ROOT, page)
    src = open(path, encoding='utf-8').read()
    src = re.sub(r'[ \t]*<link[^>]*\brel="alternate"[^>]*\bhreflang="[^"]*"[^>]*>\n?', '', src)
    src = re.sub(r'[ \t]*<link[^>]*\bhreflang="[^"]*"[^>]*\brel="alternate"[^>]*>\n?', '', src)
    block = '\n'.join('<link rel="alternate" hreflang="%s" href="%s">' % (c, u)
                      for c, u in alternates)
    block += '\n<link rel="alternate" hreflang="x-default" href="%s">' % dict(alternates)['pl']
    if self_url:
        if re.search(r'<link[^>]*\brel="canonical"[^>]*>', src):
            src = re.sub(r'<link[^>]*\brel="canonical"[^>]*>',
                         '<link rel="canonical" href="%s">' % self_url, src, count=1)
        else:
            src = src.replace('</title>', '</title>\n<link rel="canonical" href="%s">' % self_url, 1)
    m = re.search(r'<link[^>]*\brel="canonical"[^>]*>', src)
    if m:
        src = src[:m.end()] + '\n' + block + src[m.end():]
    elif '</title>' in src:
        src = src.replace('</title>', '</title>\n' + block, 1)
    else:
        src = src.replace('<head>', '<head>\n' + block, 1)
    open(path, 'w', encoding='utf-8').write(src)


# =========================================================================
def main():
    os.chdir(ROOT)
    dicts = {lg: json.load(open('i18n/%s.json' % lg, encoding='utf-8'))['strings'] for lg in LANGS}

    pages = sorted(p for p in os.listdir('.') if p.endswith('.html'))
    pages = [p for p in pages if p not in EXCLUDE and not any(re.search(r, p) for r in EXCLUDE_RE)]
    if os.path.exists('cudzoziemcy/index.html'): pages.append('cudzoziemcy/index.html')

    # --- kwalifikacja stron ---
    qualified, rejected = [], []
    for p in pages:
        cov, n = coverage(p, dicts)
        (qualified if cov >= PROG else rejected).append((p, cov, n))
    print('Stron zakwalifikowanych: %d, odrzuconych (pokrycie < %d%%): %d'
          % (len(qualified), PROG*100, len(rejected)))

    # --- zbior slugow generowanych per jezyk ---
    gen = {lg: set() for lg in LANGS}
    for lg in LANGS:
        for p, cov, n in qualified:
            if p in MANUAL[lg]: continue          # istnieje wersja reczna
            if os.path.exists(os.path.join(lg, p)) and DATA_ATTR not in \
               open(os.path.join(lg, p), encoding='utf-8').read()[:400]:
                continue                          # plik reczny o tej samej nazwie — nie ruszamy
            gen[lg].add(p)

    # --- mapa "plik PL -> odpowiednik w katalogu jezykowym" ---
    local = {}
    for lg in LANGS:
        m = {p: p for p in gen[lg]}
        for pl_, tgt in MANUAL[lg].items():
            m[pl_] = tgt[len(lg) + 1:] if tgt.startswith(lg + '/') else tgt
        local[lg] = m

    # --- mapa alternatyw (pelna wzajemnosc) ---
    def alts_for(p):
        out = [('pl', SITE + '/' + ('' if p == 'index.html' else p))]
        for lg in LANGS:
            if p in MANUAL[lg]:
                tgt = MANUAL[lg][p]
                if tgt.endswith('/index.html'): tgt = tgt[:-len('index.html')]
                out.append((lg, SITE + '/' + tgt))
            elif p in gen[lg]:
                out.append((lg, SITE + '/' + lg + '/' + ('' if p == 'index.html' else p)))
        return out

    written = {lg: [] for lg in LANGS}
    for p, cov, n in qualified:
        alternates = alts_for(p)
        for lg in LANGS:
            if p not in gen[lg]: continue
            dst = os.path.join(lg, p)
            os.makedirs(os.path.dirname(dst) or '.', exist_ok=True)
            open(dst, 'w', encoding='utf-8').write(
                translate_page(p, lg, dicts, local[lg], alternates))
            written[lg].append(p)
        patch_alt_links(p, alternates)

    # --- strony recznie napisane: ten sam, wzajemny zestaw hreflang ---
    fixed = 0
    for lg in LANGS:
        for pl_, tgt in MANUAL[lg].items():
            if not os.path.exists(tgt): continue
            self_url = SITE + '/' + (tgt[:-len('index.html')] if tgt.endswith('/index.html') else tgt)
            patch_alt_links(tgt, alts_for(pl_), self_url)
            fixed += 1
    print('  stron recznych z odswiezonym hreflang: %d' % fixed)

    for lg in LANGS:
        print('  /%s/ — wygenerowano %d stron' % (lg, len(written[lg])))

    # UWAGA: przelacznik jezyka w site-header.js i i18n.js czyta znaczniki
    # <link rel="alternate" hreflang> z samej strony — zadnej osobnej mapy nie ma.

    # --- sitemapy ---
    today = datetime.date.today().isoformat()
    for lg in LANGS:
        urls = []
        for tgt in sorted(set(list(MANUAL[lg].values()) + [lg + '/' + p for p in written[lg]])):
            if tgt.endswith('/index.html'): tgt = tgt[:-len('index.html')]
            if tgt.endswith('/index.html'): tgt = tgt[:-len('index.html')]
            urls.append('  <url><loc>%s/%s</loc><lastmod>%s</lastmod><priority>0.7</priority></url>'
                        % (SITE, tgt, today))
        open('sitemap-%s.xml' % lg, 'w', encoding='utf-8').write(
            '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + '\n'.join(urls) + '\n</urlset>\n')
        print('  sitemap-%s.xml — %d adresow' % (lg, len(urls)))

    # --- robots.txt: wszystkie sitemapy ---
    rb = open('robots.txt', encoding='utf-8').read()
    rb = re.sub(r'\nSitemap: [^\n]*', '', rb).rstrip() + '\n\n'
    rb += 'Sitemap: %s/sitemap.xml\n' % SITE
    for lg in LANGS:
        rb += 'Sitemap: %s/sitemap-%s.xml\n' % (SITE, lg)
    open('robots.txt', 'w', encoding='utf-8').write(rb)
    print('  robots.txt — zgloszone sitemapy: %d' % (len(LANGS) + 1))

    if rejected:
        print('\nPominiete (pokrycie ponizej progu):')
        for p, cov, n in sorted(rejected, key=lambda x: x[1]):
            print('   %5.1f%%  %s' % (cov*100, p))

if __name__ == '__main__':
    main()
