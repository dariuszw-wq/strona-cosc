"""Refresh the visible, crawlable Polish directory from canonical sitemap URLs.

Run from any directory after adding pages to sitemap.xml. Does not change news
entries, publication dates, translations or sitemap lastmod values.
"""
from pathlib import Path
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlsplit
import datetime
import re
import shutil
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
START = '<!-- COSC-STATIC-DIRECTORY -->'
END = '<!-- /COSC-STATIC-DIRECTORY -->'


class Heading(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.active = False
        self.parts = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        if tag == 'h1':
            self.active = True

    def handle_endtag(self, tag):
        if tag == 'h1':
            self.active = False

    def handle_data(self, data):
        if self.active:
            self.parts.append(data)


def main():
    groups = {'Poradniki i pomoc dla cudzoziemców': [], 'Artykuły i omówienia': []}
    for node in ET.parse(ROOT / 'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
        url = urlsplit(node.text)
        path = url.path.lstrip('/')
        if url.netloc != 'cosc.org.pl' or path in ('', 'aktualnosci.html', 'polityka-prywatnosci.html', 'regulamin.html'):
            continue
        target = ROOT / (path + 'index.html' if path.endswith('/') else path)
        source = target.read_text(encoding='utf-8-sig')
        title = ' '.join(''.join(Heading(source).parts).split())
        if not title:
            raise ValueError(f'Missing H1: {path}')
        group = 'Artykuły i omówienia' if path.startswith('artykul-') else 'Poradniki i pomoc dla cudzoziemców'
        groups[group].append((title, path))
    sections = []
    for label, entries in groups.items():
        links = '\n'.join(f'<li><a href="{escape(path, quote=True)}">{escape(title)}</a></li>' for title, path in sorted(entries))
        sections.append(f'<details><summary>{label} ({len(entries)})</summary>\n<ul>\n{links}\n</ul></details>')
    block = START + '''
<section class="static-directory" aria-labelledby="directory-heading">
  <div class="wrap">
    <h2 id="directory-heading">Spis artykułów i poradników COSC</h2>
    <p>Wybierz temat: pobyt, praca, świadczenia lub codzienne życie w Polsce. W spisie znajdziesz również omówienia kontroli PIP i obowiązków pracodawcy.</p>
''' + '\n'.join(sections) + '\n  </div>\n</section>\n' + END
    page = ROOT / 'aktualnosci.html'
    before = page.read_text(encoding='utf-8')
    if START in before:
        after = re.sub(re.escape(START) + r'.*?' + re.escape(END), lambda _: block, before, flags=re.S)
    else:
        after = before.replace('<!-- INDEKS-ARTYKULOW-JEZYKI -->', block + '\n\n<!-- INDEKS-ARTYKULOW-JEZYKI -->', 1)
    if '.static-directory summary' not in after:
        css = '''
.static-directory h2{font-family:'IBM Plex Serif',Georgia,serif;color:#16244c;margin-bottom:12px}
.static-directory p{color:#5a6478;line-height:1.6;margin-bottom:18px}
.static-directory details{background:#fff;border:1px solid #e6e9f0;border-radius:12px;margin:12px 0;padding:16px 20px}
.static-directory summary{cursor:pointer;font-weight:700;color:#4636c9;padding:4px 0}
.static-directory summary:focus-visible,.static-directory a:focus-visible{outline:3px solid #4636c9;outline-offset:3px}
.static-directory ul{columns:2;column-gap:36px;margin:18px 0 0;padding-left:22px}
.static-directory li{break-inside:avoid;margin:0 0 12px;line-height:1.5}
.static-directory a{color:#16244c;text-decoration:underline;text-underline-offset:3px}
@media(max-width:760px){.static-directory ul{columns:1}}
'''
        after = after.replace('</style>', css + '</style>', 1)
    if before != after:
        stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
        shutil.copy2(page, str(page) + '.bak-indeksowanie-' + stamp)
        page.write_text(after, encoding='utf-8', newline='\n')
    print('Directory links:', sum(map(len, groups.values())))


if __name__ == '__main__':
    main()
