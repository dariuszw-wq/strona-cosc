#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""COSC — generator grafik tytułowych OG (1200x630 PNG) dla artykułów.
Użycie: python3 generuj-grafiki-og.py [plik.html ...]  (bez argumentów: wszystkie artykul-*.html)
Tworzy og/<nazwa>.png i dopisuje meta og:/twitter: do artykułu (jeśli brak)."""
import re, os, sys, glob, html as H
import cairosvg

KARTA=open('karta-pobytu-ilustracja.svg',encoding='utf-8').read()
INNER=re.sub(r'^<svg[^>]*>','',KARTA,count=1).rsplit('</svg>',1)[0]
for i in ['cardbg','cardclip','fotoclip','soft','glow']:
    INNER=INNER.replace(f'id="{i}"',f'id="k-{i}"').replace(f'url(#{i})',f'url(#k-{i})')
INNER=re.sub(r'filter="url\(#k-(soft|glow)\)"','',INNER)  # cairosvg nie wspiera filtrów

BADGES=[ (r'karta|pobyt|wezwan|rozpoznania|dokument|mos-|mos\.',None), ]
def badge_for(fn,eyebrow):
    if eyebrow and 'Twoja karta' in eyebrow: return 'TWOJA KARTA, TWOJE DOKUMENTY'
    f=fn.lower()
    if re.search(r'pit|podatk|ulg|rezydencja|upo|opodatkowania',f): return 'PODATKI CUDZOZIEMCA'
    if re.search(r'zus|skladk|nfz|a1|zabezpieczenie|zasilek|zasilki|swiadczen|800',f): return 'SKŁADKI I ŚWIADCZENIA'
    if re.search(r'mos-|mos\.|profil-zaufany|elektronizacja',f): return 'SYSTEM MOS'
    if re.search(r'nielegaln|kontrol|kary|kara|sankcje|odpowiedzialnosc|pip',f): return 'KONTROLA I SANKCJE'
    if re.search(r'sn-|wsa|wyrok|orzec|iii-pk|dyskryminacja',f): return 'ORZECZNICTWO'
    if re.search(r'zezwolen|oswiadczen|prac|zatrudnien|delegowan|rynku',f): return 'PRACA I ZEZWOLENIA'
    if re.search(r'karta|pobyt|wezwan|rozpoznania|dokument|rodzin',f): return 'KARTA POBYTU'
    return 'PORADNIK COSC'

def wrap(t, maxc=21, maxl=4):
    words=t.split(); lines=[]; cur=''
    for w in words:
        if len(cur)+len(w)+1<=maxc or not cur: cur=(cur+' '+w).strip()
        else: lines.append(cur); cur=w
    if cur: lines.append(cur)
    if len(lines)>maxl:  # scal nadmiar
        lines=lines[:maxl-1]+[' '.join(lines[maxl-1:])]
    return lines

def esc(s): return s.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')

def build_svg(title, badge):
    lines=wrap(title)
    fs=47 if len(lines)<=3 and max(len(l) for l in lines)<=22 else 40
    lh=int(fs*1.28)
    total=len(lines)*lh
    y0=int(345-total/2+fs*0.8-40)
    y0=max(y0,205)
    # akcent: fragment po '?' lub po '—'
    akcent=''
    m=re.search(r'\?\s*(.+)$',title) or re.search(r'—\s*(.+)$',title)
    if m and 6<=len(m.group(1))<=30: akcent=m.group(1).strip()
    tx=''
    acc_start=len(title)-len(akcent) if akcent else 10**9
    pos=0
    for i,ln in enumerate(lines):
        s,e_=pos,pos+len(ln); pos=e_+1
        if akcent and e_>acc_start:
            cut=max(acc_start-s,0)
            biala,zolta=ln[:cut],ln[cut:]
            e=esc(biala)+f'<tspan fill="#ffd34d">{esc(zolta)}</tspan>'
        else:
            e=esc(ln)
        tx+=f'<text x="64" y="{y0+i*lh}" font-size="{fs}" font-weight="700" fill="#ffffff" font-family="IBM Plex Serif">{e}</text>'
    bw=40+len(badge)*10
    return f'''<svg viewBox="0 0 1200 630" width="1200" height="630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" font-family="IBM Plex Sans">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#101c3a"/><stop offset="1" stop-color="#0b1226"/></linearGradient>
<radialGradient id="pglow" cx="0.85" cy="0.4" r="0.6"><stop offset="0" stop-color="#4636c9" stop-opacity="0.35"/><stop offset="1" stop-color="#4636c9" stop-opacity="0"/></radialGradient></defs>
<rect width="1200" height="630" fill="url(#bg)"/><rect width="1200" height="630" fill="url(#pglow)"/>
<g fill="none" stroke="#2a3860" stroke-width="1" opacity="0.5"><circle cx="1090" cy="90" r="70"/><circle cx="1090" cy="90" r="120"/><circle cx="1090" cy="90" r="170"/><circle cx="1090" cy="90" r="220"/><circle cx="1090" cy="90" r="270"/></g>
<g transform="translate(64 56)"><rect width="40" height="40" rx="8" fill="#ffffff"/><rect y="20" width="40" height="20" fill="#d4213d"/><rect width="40" height="40" rx="8" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<text x="54" y="17" font-size="17" font-weight="700" fill="#ffffff" font-family="IBM Plex Serif">Centrum Obsługi</text>
<text x="54" y="37" font-size="17" font-weight="700" fill="#ffffff" font-family="IBM Plex Serif">Spraw Cudzoziemców</text></g>
<g transform="translate(64 150)"><rect width="{bw}" height="34" rx="17" fill="#ffd34d" fill-opacity="0.14" stroke="#ffd34d" stroke-opacity="0.55"/>
<text x="{bw//2}" y="23" font-size="14" font-weight="700" letter-spacing="2" fill="#ffd34d" text-anchor="middle" font-family="IBM Plex Sans">{esc(badge)}</text></g>
{tx}
<g transform="translate(64 470)"><rect width="196" height="46" rx="10" fill="#d4213d"/>
<text x="98" y="30" font-size="17" font-weight="700" fill="#ffffff" text-anchor="middle">Poradnik 2026</text>
<text x="220" y="30" font-size="17" fill="#9fb0d6">cosc.org.pl · aktualności dla cudzoziemców</text></g>
<rect x="668" y="175" width="510" height="360" rx="18" fill="#000000" opacity="0.35" transform="rotate(4 920 355)"/>
<g transform="translate(648 140) rotate(4 280 205) scale(0.875)">{INNER}</g>
<rect y="620" width="1200" height="10" fill="#f5f5f5"/><rect y="625" width="1200" height="5" fill="#d4213d"/>
</svg>'''

def process(fn, write_meta=True):
    h=open(fn,encoding='utf-8').read()
    m=re.search(r'<h1>(.*?)</h1>',h,re.S)
    if not m: print('POMIŃ (brak h1):',fn); return False
    title=H.unescape(re.sub(r'<[^>]+>','',m.group(1))).strip()
    eb=re.search(r'class="eyebrow">([^<]*)<',h)
    badge=badge_for(fn, eb.group(1) if eb else '')
    mt=re.search(r'<title>(.*?)</title>',h,re.S)
    md=re.search(r'name="description" content="([^"]*)"',h)
    og_png='og/'+fn.replace('.html','.png')
    os.makedirs('og',exist_ok=True)
    cairosvg.svg2png(bytestring=build_svg(title,badge).encode(),write_to=og_png,output_width=1200,output_height=630)
    if write_meta and 'og:image' not in h:
        metas=(f'\n<meta property="og:type" content="article">'
         f'\n<meta property="og:title" content="{H.escape((mt.group(1) if mt else title).strip())}">'
         f'\n<meta property="og:description" content="{md.group(1) if md else ""}">'
         f'\n<meta property="og:url" content="https://cosc.org.pl/{fn}">'
         f'\n<meta property="og:image" content="https://cosc.org.pl/{og_png}">'
         f'\n<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
         f'\n<meta name="twitter:card" content="summary_large_image">'
         f'\n<meta name="twitter:image" content="https://cosc.org.pl/{og_png}">\n')
        h=h.replace('</head>',metas+'</head>',1)
        open(fn,'w',encoding='utf-8').write(h)
    print('OK',fn,'->',og_png,f'({os.path.getsize(og_png)//1024} KB) badge:',badge)
    return True

if __name__=='__main__':
    pliki=sys.argv[1:] or sorted(p for p in glob.glob('artykul-*.html') if '.bak' not in p)
    n=sum(1 for p in pliki if process(p))
    print(f'Wygenerowano {n}/{len(pliki)}')
