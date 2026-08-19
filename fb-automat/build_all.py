# -*- coding: utf-8 -*-
"""Buduje POJEDYNCZY wspolny feed feed-all.xml (EN+ES+UK) dla Make.com (limit 2 scenariuszy).
Uzycie: python3 build_all.py aktualnosci.html translations.json OUTDIR"""
import sys, json, os
from datetime import datetime, timezone
import fbfeed as f
html, trp, out = sys.argv[1], sys.argv[2], sys.argv[3]
items = f.load_items(html)
tr = json.load(open(trp, encoding="utf-8"))
items = sorted(items, key=lambda it: it["added"], reverse=True)
rows = []
for it in items[:25]:
    g = f.guid(it); src = it.get("source_name","")
    for lang in f.LANGS:
        t = tr.get(g, {}).get(lang)
        if not t or not t.get("title"): continue
        link = f.item_link(it, lang, os.path.dirname(os.path.abspath(html)))
        body = t["summary"].strip() + "\n\n" + (f"{f.SRC[lang]}: {src}\n" if src else "") + \
               f.CTA[lang].format(url=link) + "\n\n" + f.TAGS[lang]
        img = f.IMG.get(it.get("category"))
        encl = (f'      <enclosure url="{f.esc(img)}" type="image/png" length="0"/>\n'
                f'      <media:content url="{f.esc(img)}" medium="image" type="image/png"/>\n') if img else ""
        rows.append("    <item>\n"
            f"      <title>{f.esc(t['title'])}</title>\n"
            f"      <link>{f.esc(link)}</link>\n"
            f"      <guid isPermaLink=\"false\">{f.esc(g)}-{lang}</guid>\n"
            f"      <pubDate>{f.rfc822(it['added'])}</pubDate>\n"
            f"      <description>{f.esc(body)}</description>\n" + encl + "    </item>")
xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
       '<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel>\n'
       '    <title>COSC — Foreigners\' updates (EN/ES/UK)</title>\n'
       f'    <link>{f.esc(f.NEWS_URL)}</link>\n'
       '    <description>Changes in Polish law on foreigners, official notices and labour market — EN/ES/UK.</description>\n'
       f'    <lastBuildDate>{datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")}</lastBuildDate>\n'
       + "\n".join(rows) + "\n</channel></rss>\n")
os.makedirs(out, exist_ok=True)
open(os.path.join(out,"feed-all.xml"),"w",encoding="utf-8").write(xml)
print("napisano feed-all.xml | itemow:", len(rows))
