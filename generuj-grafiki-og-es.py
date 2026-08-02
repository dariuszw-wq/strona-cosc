#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""COSC — generator grafik OG (1200x630 PNG) dla stron HISZPAŃSKICH /es/.

Bliźniak generuj-grafiki-og.py, ale: napis marki i plakietki po hiszpańsku,
tytuł brany z <h1> strony ES, wynik trafia do og/es/<nazwa>.png, a w pliku HTML
podmieniane są meta og:image / twitter:image (strony ES miały grafikę zastępczą).

Użycie:  python3 generuj-grafiki-og-es.py <katalog-repo> [plik.html ...]
Bez listy plików: wszystkie es/*.html.
"""
import re, os, sys, glob, html as H
import cairosvg

ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
os.chdir(ROOT)

KARTA = open('karta-pobytu-ilustracja.svg', encoding='utf-8').read()
INNER = re.sub(r'^<svg[^>]*>', '', KARTA, count=1).rsplit('</svg>', 1)[0]
for i in ['cardbg', 'cardclip', 'fotoclip', 'soft', 'glow']:
    INNER = INNER.replace(f'id="{i}"', f'id="k-{i}"').replace(f'url(#{i})', f'url(#k-{i})')
INNER = re.sub(r'filter="url\(#k-(soft|glow)\)"', '', INNER)   # cairosvg nie wspiera filtrów

# Napisy NA SAMEJ KARCIE zostają po polsku — bo polska karta pobytu naprawdę tak wygląda
# i cudzoziemiec ma ją rozpoznać. Tłumaczymy tylko NASZE komunikaty dookoła ilustracji.
for _pl, _es in [
    ('Wniosek złożony w MOS',                     'Solicitud enviada en MOS'),
    ('bez błędów formalnych',                     'sin defectos formales'),
    ('DECYZJA',                                   'DECISIÓN'),
    ('POZYTYWNA',                                 'POSITIVA'),
    ('ilustracja poglądowa — nie jest dokumentem','ilustración de referencia — no es un documento'),
]:
    INNER = INNER.replace('>' + _pl + '<', '>' + _es + '<')


def badge_for(fn):
    """Plakietka po hiszpańsku — dobierana po nazwie pliku."""
    f = os.path.basename(fn).lower()
    if '90-dias' in f or 'calculadora' in f:      return 'REGLA 90/180'
    if 'mos-' in f:                                return 'SISTEMA MOS'
    if 'trabajo' in f:                             return 'TRABAJO LEGAL'
    if 'tarjeta' in f:                             return 'TARJETA DE RESIDENCIA'
    if 'contacto' in f:                            return 'CONSULTA GRATUITA'
    return 'RESIDENCIA EN POLONIA'


def wrap(t, maxc=21, maxl=4):
    words = t.split(); lines = []; cur = ''
    for w in words:
        if len(cur) + len(w) + 1 <= maxc or not cur:
            cur = (cur + ' ' + w).strip()
        else:
            lines.append(cur); cur = w
    if cur: lines.append(cur)
    if len(lines) > maxl:
        lines = lines[:maxl - 1] + [' '.join(lines[maxl - 1:])]
    return lines


def esc(s): return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def build_svg(title, badge, akcent=''):
    lines = wrap(title)
    fs = 47 if len(lines) <= 3 and max(len(l) for l in lines) <= 22 else 40
    lh = int(fs * 1.28)
    y0 = max(int(345 - len(lines) * lh / 2 + fs * 0.8 - 40), 205)
    tx = ''
    acc_start = len(title) - len(akcent) if akcent else 10 ** 9
    pos = 0
    for i, ln in enumerate(lines):
        s, e_ = pos, pos + len(ln); pos = e_ + 1
        if akcent and e_ > acc_start:
            cut = max(acc_start - s, 0)
            e = esc(ln[:cut]) + f'<tspan fill="#ffd34d">{esc(ln[cut:])}</tspan>'
        else:
            e = esc(ln)
        tx += (f'<text x="64" y="{y0 + i * lh}" font-size="{fs}" font-weight="700" fill="#ffffff" '
               f'font-family="IBM Plex Serif">{e}</text>')
    bw = 40 + len(badge) * 10
    return f'''<svg viewBox="0 0 1200 630" width="1200" height="630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" font-family="IBM Plex Sans">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#101c3a"/><stop offset="1" stop-color="#0b1226"/></linearGradient>
<radialGradient id="pglow" cx="0.85" cy="0.4" r="0.6"><stop offset="0" stop-color="#4636c9" stop-opacity="0.35"/><stop offset="1" stop-color="#4636c9" stop-opacity="0"/></radialGradient></defs>
<rect width="1200" height="630" fill="url(#bg)"/><rect width="1200" height="630" fill="url(#pglow)"/>
<g fill="none" stroke="#2a3860" stroke-width="1" opacity="0.5"><circle cx="1090" cy="90" r="70"/><circle cx="1090" cy="90" r="120"/><circle cx="1090" cy="90" r="170"/><circle cx="1090" cy="90" r="220"/><circle cx="1090" cy="90" r="270"/></g>
<g transform="translate(64 56)"><rect width="40" height="40" rx="8" fill="#ffffff"/><rect y="20" width="40" height="20" fill="#d4213d"/><rect width="40" height="40" rx="8" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<text x="54" y="17" font-size="17" font-weight="700" fill="#ffffff" font-family="IBM Plex Serif">Centro de Atención</text>
<text x="54" y="37" font-size="17" font-weight="700" fill="#ffffff" font-family="IBM Plex Serif">de Asuntos de Extranjeros</text></g>
<g transform="translate(64 150)"><rect width="{bw}" height="34" rx="17" fill="#ffd34d" fill-opacity="0.14" stroke="#ffd34d" stroke-opacity="0.55"/>
<text x="{bw // 2}" y="23" font-size="14" font-weight="700" letter-spacing="2" fill="#ffd34d" text-anchor="middle" font-family="IBM Plex Sans">{esc(badge)}</text></g>
{tx}
<g transform="translate(64 470)"><rect width="196" height="46" rx="10" fill="#d4213d"/>
<text x="98" y="30" font-size="17" font-weight="700" fill="#ffffff" text-anchor="middle">Guía 2026</text>
<text x="220" y="30" font-size="17" fill="#9fb0d6">cosc.org.pl/es · en español</text></g>
<rect x="668" y="175" width="510" height="360" rx="18" fill="#000000" opacity="0.35" transform="rotate(4 920 355)"/>
<g transform="translate(648 140) rotate(4 280 205) scale(0.875)">{INNER}</g>
<rect y="620" width="1200" height="10" fill="#f5f5f5"/><rect y="625" width="1200" height="5" fill="#d4213d"/>
</svg>'''


# tytuły na grafikę — krótsze niż H1 strony, żeby były czytelne w podglądzie linku
TYTULY = {
 'index.html':                              ('Tarjeta de residencia y trabajo legal en Polonia', 'en español'),
 'tarjeta-de-residencia-polonia.html':      ('Cómo sacar la tarjeta de residencia en Polonia', ''),
 'trabajo-legal-polonia-colombianos.html':  ('Trabajar legalmente en Polonia siendo colombiano', ''),
 '90-dias-schengen-polonia.html':           ('Se me acaban los 90 días en Polonia: ¿qué hago?', '¿qué hago?'),
 'mos-solicitud-en-linea.html':             ('Solicitud de residencia por internet: sistema MOS', 'sistema MOS'),
 'contacto.html':                           ('Hablemos de su caso, en español', 'en español'),
 'calculadora-90-180.html':                 ('Calculadora 90/180 días Schengen', ''),
}


def process(fn):
    base = os.path.basename(fn)
    if base in TYTULY:
        title, akcent = TYTULY[base]
    else:
        h = open(fn, encoding='utf-8').read()
        m = re.search(r'<h1[^>]*>(.*?)</h1>', h, re.S)
        if not m:
            print('POMIŃ (brak h1):', fn); return False
        title = H.unescape(re.sub(r'<[^>]+>', '', m.group(1))).strip(); akcent = ''
    badge = badge_for(base)
    out_png = 'og/es/' + base.replace('.html', '.png')
    os.makedirs('og/es', exist_ok=True)
    cairosvg.svg2png(bytestring=build_svg(title, badge, akcent).encode(),
                     write_to=out_png, output_width=1200, output_height=630)
    # podmiana meta w pliku ES (miały grafikę zastępczą og/strona-glowna.png)
    h = open(fn, encoding='utf-8').read()
    url = 'https://cosc.org.pl/' + out_png
    h2 = re.sub(r'(<meta property="og:image" content=")[^"]*(">)', r'\g<1>' + url + r'\g<2>', h)
    h2 = re.sub(r'(<meta name="twitter:image" content=")[^"]*(">)', r'\g<1>' + url + r'\g<2>', h2)
    if h2 != h:
        open(fn, 'w', encoding='utf-8').write(h2)
    print('OK', base, '->', out_png, f'({os.path.getsize(out_png)//1024} KB)  badge: {badge}')
    return True


if __name__ == '__main__':
    pliki = sys.argv[2:] or sorted(glob.glob('es/*.html'))
    n = sum(1 for p in pliki if process(p))
    print(f'Wygenerowano {n}/{len(pliki)}')
