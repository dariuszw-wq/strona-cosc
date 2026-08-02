#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""COSC — generator grafiki OG strony głównej (1200x630) z flagami UE+PL.
Użycie: python3 generuj-og-glowna.py [wyjscie.png]  (domyślnie og/strona-glowna-v2.png)"""
import re, os, sys, math
import cairosvg

KARTA = open('karta-pobytu-ilustracja.svg', encoding='utf-8').read()
INNER = re.sub(r'^<svg[^>]*>', '', KARTA, count=1).rsplit('</svg>', 1)[0]
for i in ['cardbg', 'cardclip', 'fotoclip', 'soft', 'glow']:
    INNER = INNER.replace(f'id="{i}"', f'id="k-{i}"').replace(f'url(#{i})', f'url(#k-{i})')
INNER = re.sub(r'filter="url\(#k-(soft|glow)\)"', '', INNER)

def gwiazdy_ue(cx, cy, r_kola, r_gw):
    """12 gwiazd flagi UE rozmieszczonych na okręgu."""
    out = ''
    for k in range(12):
        a = math.radians(k * 30 - 90)
        x, y = cx + r_kola * math.cos(a), cy + r_kola * math.sin(a)
        pts = []
        for j in range(10):
            rr = r_gw if j % 2 == 0 else r_gw * 0.382
            aa = math.radians(j * 36 - 90)
            pts.append(f'{x + rr * math.sin(aa):.2f},{y - rr * math.cos(aa):.2f}')
        out += f'<polygon points="{" ".join(pts)}" fill="#ffd34d"/>'
    return out

SVG = f'''<svg viewBox="0 0 1200 630" width="1200" height="630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" font-family="IBM Plex Sans">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#101c3a"/><stop offset="1" stop-color="#0b1226"/></linearGradient>
<radialGradient id="pglow" cx="0.85" cy="0.4" r="0.6"><stop offset="0" stop-color="#4636c9" stop-opacity="0.35"/><stop offset="1" stop-color="#4636c9" stop-opacity="0"/></radialGradient></defs>
<rect width="1200" height="630" fill="url(#bg)"/><rect width="1200" height="630" fill="url(#pglow)"/>
<g fill="none" stroke="#2a3860" stroke-width="1" opacity="0.5"><circle cx="1090" cy="90" r="70"/><circle cx="1090" cy="90" r="120"/><circle cx="1090" cy="90" r="170"/><circle cx="1090" cy="90" r="220"/><circle cx="1090" cy="90" r="270"/></g>
<g transform="translate(64 56)">
<rect width="40" height="40" rx="8" fill="#ffffff"/><rect y="20" width="40" height="20" fill="#d4213d"/><rect width="40" height="40" rx="8" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<rect x="48" width="40" height="40" rx="8" fill="#003399"/>{gwiazdy_ue(68, 20, 12.5, 3.4)}<rect x="48" width="40" height="40" rx="8" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<text x="102" y="17" font-size="17" font-weight="700" fill="#ffffff" font-family="IBM Plex Serif">Centrum Obsługi</text>
<text x="102" y="37" font-size="17" font-weight="700" fill="#ffffff" font-family="IBM Plex Serif">Spraw Cudzoziemców</text></g>
<g transform="translate(64 150)"><rect width="278" height="34" rx="17" fill="#ffd34d" fill-opacity="0.14" stroke="#ffd34d" stroke-opacity="0.55"/>
<text x="139" y="23" font-size="14" font-weight="700" letter-spacing="2" fill="#ffd34d" text-anchor="middle">TWÓJ OPIEKUN W URZĘDACH</text></g>
<text x="64" y="256" font-size="47" font-weight="700" fill="#ffffff" font-family="IBM Plex Serif">Karta pobytu i</text>
<text x="64" y="316" font-size="47" font-weight="700" fill="#ffffff" font-family="IBM Plex Serif">legalna praca w</text>
<text x="64" y="376" font-size="47" font-weight="700" fill="#ffffff" font-family="IBM Plex Serif">Polsce — <tspan fill="#ffd34d">bez ryzyka</tspan></text>
<g transform="translate(64 470)"><rect width="330" height="46" rx="10" fill="#d4213d"/>
<text x="165" y="30" font-size="16" font-weight="700" fill="#ffffff" text-anchor="middle">Skuteczna pomoc albo zwrot kosztów*</text>
<text x="354" y="30" font-size="17" fill="#9fb0d6">cosc.org.pl</text></g>
<rect x="668" y="175" width="510" height="360" rx="18" fill="#000000" opacity="0.35" transform="rotate(4 920 355)"/>
<g transform="translate(648 140) rotate(4 280 205) scale(0.875)">{INNER}</g>
<rect y="620" width="1200" height="10" fill="#f5f5f5"/><rect y="625" width="1200" height="5" fill="#d4213d"/><rect x="0" y="620" width="240" height="10" fill="#003399"/>
</svg>'''

out = sys.argv[1] if len(sys.argv) > 1 else 'og/strona-glowna-v2.png'
os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
cairosvg.svg2png(bytestring=SVG.encode(), write_to=out, output_width=1200, output_height=630)
print('OK ->', out, f'({os.path.getsize(out)//1024} KB)')
