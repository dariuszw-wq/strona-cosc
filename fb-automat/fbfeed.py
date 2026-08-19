# -*- coding: utf-8 -*-
"""Buduje kanaly RSS (EN/ES/UK) z aktualnosci COSC dla auto-postowania na Facebooku (Publer).
Filtr: kategorie Legislacja + Urzedy ("zmiana prawa + komunikaty urzedowe").
Tlumaczenia dostarcza agent w translations.json (guid = url artykulu).
Uzycie:
  python3 fbfeed.py detect --html PATH --tr translations.json      # co wymaga tlumaczenia
  python3 fbfeed.py build  --html PATH --tr translations.json --out DIR
"""
import re, json, sys, argparse, hashlib, html
from datetime import datetime, timezone

CATS = ("Legislacja", "Urzędy", "Rynek pracy")
LANGS = ("en", "es", "uk")
SITE = "https://cosc.org.pl"
NEWS_URL = SITE + "/aktualnosci.html"
UTM = "?utm_source=facebook&utm_medium=social&utm_campaign=aktualnosci-{lang}"

CHANNEL = {
 "en": ("COSC — Foreigners' law updates (EN)", "Changes in Polish law on foreigners and official communiqués — from the Foreigners' Affairs Service Centre."),
 "es": ("COSC — Novedades legales para extranjeros (ES)", "Cambios en la ley polaca sobre extranjeros y comunicados oficiales — del Centro de Atención de Asuntos de Extranjeros."),
 "uk": ("COSC — Зміни законодавства про іноземців (UK)", "Зміни у польському законодавстві про іноземців та офіційні повідомлення — від Центру обслуговування справ іноземців."),
}
CTA = {
 "en": "More & contact: {url} • WhatsApp +48 539 999 549",
 "es": "Más información y contacto: {url} • WhatsApp +48 539 999 549",
 "uk": "Більше та контакт: {url} • WhatsApp +48 539 999 549",
}
SRC = {"en":"Source","es":"Fuente","uk":"Джерело"}
IMG = {"Legislacja": SITE+"/fb/legislacja.png", "Urzędy": SITE+"/fb/urzedy.png", "Rynek pracy": SITE+"/fb/rynek-pracy.png"}
TAGS = {
 "en": "#PolandImmigration #residencecardPoland #kartapobytu #MOS #workpermitPoland",
 "es": "#Polonia #tarjetaderesidencia #kartapobytu #MOS #permisodetrabajo #extranjerosenPolonia",
 "uk": "#Польща #картапобиту #MOS #дозвілнароботу #іноземцівПольщі #legalizacja",
}

def load_items(html_path):
    """Zrodlo prawdy = news-data.json (obok aktualnosci.html). Zywa strona pobiera
    dane fetchem z tego pliku; w HTML zostal tylko maly blok kopii zapasowej dla
    podgladu file://, wiec parsowanie HTML gubilo wiekszosc wpisow."""
    import os
    data_path = os.path.join(os.path.dirname(os.path.abspath(html_path)), "news-data.json")
    items = []
    if os.path.exists(data_path):
        try:
            d = json.load(open(data_path, encoding="utf-8"))
            items = d.get("items", d) if isinstance(d, dict) else d
        except Exception:
            items = []
    if not items:  # awaryjnie: stary tryb parsowania HTML
        txt = open(html_path, encoding="utf-8").read()
        objs = re.findall(r'\{"added":.*?\}', txt)
        items = [json.loads(o) for o in objs]
    return [it for it in items if it.get("category") in CATS]

ES_MAP_CACHE = {}

def es_map(root):
    """Mapa: polski plik artykulu -> odpowiednik w /es/ (czytana z hreflang w /es/*.html)."""
    import os, glob
    root = os.path.abspath(root)
    if root in ES_MAP_CACHE:
        return ES_MAP_CACHE[root]
    m = {}
    for fp in glob.glob(os.path.join(root, "es", "*.html")):
        try:
            txt = open(fp, encoding="utf-8").read(20000)
        except Exception:
            continue
        mm = re.search(r'<link rel="alternate" hreflang="pl" href="[^"]*?/([^/"]+\.html)"', txt)
        if mm:
            m[mm.group(1)] = "es/" + os.path.basename(fp)
    ES_MAP_CACHE[root] = m
    return m

LANG_TARGETS_CACHE = {}

def lang_targets(root):
    import os
    root = os.path.abspath(root)
    if root in LANG_TARGETS_CACHE:
        return LANG_TARGETS_CACHE[root]
    d = {}
    fp = os.path.join(root, "fb-automat", "lang-targets.json")
    if os.path.exists(fp):
        try:
            d = {k: v for k, v in json.load(open(fp, encoding="utf-8")).items() if not k.startswith("_")}
        except Exception:
            d = {}
    LANG_TARGETS_CACHE[root] = d
    return d

def item_link(it, lang, root):
    """Link dla posta: wlasny artykul (docelowo w jezyku odbiorcy), a gdy go nie ma
    - lista aktualnosci z wymuszonym jezykiem. Zawsze z UTM."""
    import os
    utm = "utm_source=facebook&utm_medium=social&utm_campaign=aktualnosci-" + lang
    url = (it.get("url") or "").strip()
    ov = lang_targets(root).get(guid(it), {})
    if isinstance(ov, dict):
        tgt = ov.get(lang)
        if tgt:
            q = "?" + utm if tgt.startswith("es/") and lang == "es" else "?lang=" + lang + "&" + utm
            return SITE + "/" + tgt + q
        tgt = ov.get("pl")
        if tgt:
            return SITE + "/" + tgt + "?lang=" + lang + "&" + utm
    if not url or url.startswith("http"):
        return NEWS_URL + "?lang=" + lang + "&" + utm
    if lang == "es":
        tgt = es_map(root).get(url)
        if tgt:
            return SITE + "/" + tgt + "?" + utm
    return SITE + "/" + url + "?lang=" + lang + "&" + utm

def guid(it):
    return it.get("url") or ("h:" + hashlib.md5(it["title"].encode("utf-8")).hexdigest())

def rfc822(dstr):
    try:
        dt = datetime.strptime(dstr, "%Y-%m-%d").replace(hour=9, tzinfo=timezone.utc)
    except Exception:
        dt = datetime.now(timezone.utc)
    return dt.strftime("%a, %d %b %Y %H:%M:%S +0000")

def esc(s): return html.escape(s, quote=True)

def cmd_detect(args):
    items = load_items(args.html)
    tr = json.load(open(args.tr, encoding="utf-8")) if _exists(args.tr) else {}
    todo = []
    for it in items:
        g = guid(it)
        have = tr.get(g, {})
        missing = [l for l in LANGS if l not in have or not have[l].get("title")]
        if missing:
            todo.append({"guid": g, "added": it["added"], "category": it["category"],
                         "title": it["title"], "summary": it["summary"],
                         "source_name": it.get("source_name",""), "missing": missing})
    print(json.dumps({"todo": todo}, ensure_ascii=False, indent=2))

def _exists(p):
    import os; return os.path.exists(p)

def cmd_build(args):
    import os
    items = load_items(args.html)
    tr = json.load(open(args.tr, encoding="utf-8")) if _exists(args.tr) else {}
    items = sorted(items, key=lambda it: it["added"], reverse=True)
    os.makedirs(args.out, exist_ok=True)
    for lang in LANGS:
        rows = []
        for it in items[:25]:
            g = guid(it); t = tr.get(g, {}).get(lang)
            if not t or not t.get("title"):
                continue
            link = item_link(it, lang, os.path.dirname(os.path.abspath(args.html)))
            desc = t["summary"].strip()
            src = it.get("source_name","")
            body = desc + "\n\n" + (f"{SRC[lang]}: {src}\n" if src else "") + \
                   CTA[lang].format(url=link) + "\n\n" + TAGS[lang]
            rows.append(
              "    <item>\n"
              f"      <title>{esc(t['title'])}</title>\n"
              f"      <link>{esc(link)}</link>\n"
              f"      <guid isPermaLink=\"false\">{esc(g)}</guid>\n"
              f"      <pubDate>{rfc822(it['added'])}</pubDate>\n"
              f"      <description>{esc(body)}</description>\n"
              + (f"      <enclosure url=\"{esc(IMG[it['category']])}\" type=\"image/png\" length=\"0\"/>\n"
                 f"      <media:content url=\"{esc(IMG[it['category']])}\" medium=\"image\" type=\"image/png\"/>\n" if it.get('category') in IMG else "")
              + "    </item>")
        title, descr = CHANNEL[lang]
        xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
               '<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel>\n'
               f'    <title>{esc(title)}</title>\n'
               f'    <link>{esc(NEWS_URL)}</link>\n'
               f'    <description>{esc(descr)}</description>\n'
               f'    <language>{lang}</language>\n'
               f'    <lastBuildDate>{datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")}</lastBuildDate>\n'
               + "\n".join(rows) + "\n</channel></rss>\n")
        out = os.path.join(args.out, f"feed-{lang}.xml")
        open(out, "w", encoding="utf-8").write(xml)
        print("napisano", out, "| itemow:", len(rows))

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    for c in ("detect","build"):
        p = sub.add_parser(c); p.add_argument("--html", required=True); p.add_argument("--tr", required=True)
        if c=="build": p.add_argument("--out", required=True)
    args = ap.parse_args()
    (cmd_detect if args.cmd=="detect" else cmd_build)(args)
