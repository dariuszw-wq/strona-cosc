#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
STRAZNIK SEO — kontrola maszynowa przed publikacja (kanon Google + standard TRC).
Docelowa sciezka: STRONA_COSP/narzedzia/straznik-seo.py

Uzycie:
    python3 straznik-seo.py plik.html  --url-base=https://cosc.org.pl
    python3 straznik-seo.py /sciezka   --url-base=https://cosc.org.pl
    python3 straznik-seo.py . --json=raport.json

Kod wyjscia: 0 = brak bledow krytycznych, 1 = BLOKADA PUBLIKACJI.
Bez zaleznosci zewnetrznych (html.parser ze standardowej biblioteki).
"""
import sys, os, re, json, glob
from html.parser import HTMLParser

# ---- PROGI (zmiana = decyzja Dariusza) ----
TITLE_MAX = 60
TITLE_MIN = 25
TITLE_PX_MAX = 580
DESC_MAX = 155
DESC_MIN = 70
H1_MAX = 90
ALT_MAX = 125
MIN_WORDS_ARTICLE = 300
MIN_INTERNAL_LINKS = 3

GENERYCZNE_TYTULY = {"strona glowna", "strona główna", "home", "profil", "dokument", "index", "nowa strona"}
GENERYCZNE_ANCHORY = {"kliknij tutaj", "czytaj wiecej", "czytaj więcej", "tutaj", "zobacz", "link",
                      "wiecej", "więcej", "przeczytaj", "sprawdz", "sprawdź", "click here"}
KODY_ZAREZERWOWANE = {"eu", "un", "uk"}
ISO639 = re.compile(r"^[a-z]{2,3}(-[A-Za-z]{2})?$")

# przyblizona szerokosc w px dla Arial 20px (SERP desktop)
WASKIE = set("iljtfr.,:;'!|()[]")
SZEROKIE = set("mwMW@%")


def szerokosc_px(s):
    w = 0.0
    for ch in s:
        if ch in WASKIE:
            w += 4.6
        elif ch in SZEROKIE:
            w += 15.0
        elif ch.isupper():
            w += 11.5
        elif ch == " ":
            w += 4.9
        else:
            w += 9.2
    return int(w)


class Zbieracz(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = None
        self._w_title = False
        self.metas = []          # (name/property, content)
        self.links = []          # (rel, href, hreflang)
        self.naglowki = []       # (poziom, tekst)
        self._h = None
        self._buf = []
        self.obrazy = []         # dict
        self.kotwice = []        # (href, tekst, rel, ma_href)
        self._a = None
        self.jsonld = []
        self._w_ld = False
        self._ld = []
        self.html_lang = None
        self.tekst = []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        a = dict((k.lower(), (v or "")) for k, v in attrs)
        if tag == "html":
            self.html_lang = a.get("lang")
        elif tag == "title":
            self._w_title = True
            self._buf = []
        elif tag == "meta":
            key = a.get("name") or a.get("property")
            if key:
                self.metas.append((key.lower(), a.get("content", "")))
        elif tag == "link":
            self.links.append((a.get("rel", "").lower(), a.get("href", ""), a.get("hreflang", "")))
        elif tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self._h = int(tag[1])
            self._buf = []
        elif tag == "img":
            self.obrazy.append({
                "src": a.get("src", ""), "alt": a.get("alt", None),
                "w": a.get("width"), "h": a.get("height"), "loading": a.get("loading"),
            })
        elif tag == "a":
            self._a = {"href": a.get("href"), "rel": a.get("rel", ""), "ma_href": "href" in a}
            self._buf = []
        elif tag == "script" and a.get("type", "").lower() == "application/ld+json":
            self._w_ld = True
            self._ld = []
        elif tag in ("script", "style"):
            self._skip += 1

    def handle_endtag(self, tag):
        if tag == "title" and self._w_title:
            self.title = "".join(self._buf).strip()
            self._w_title = False
        elif tag in ("h1", "h2", "h3", "h4", "h5", "h6") and self._h:
            self.naglowki.append((self._h, "".join(self._buf).strip()))
            self._h = None
        elif tag == "a" and self._a is not None:
            self._a["tekst"] = "".join(self._buf).strip()
            self.kotwice.append(self._a)
            self._a = None
        elif tag == "script" and self._w_ld:
            self.jsonld.append("".join(self._ld))
            self._w_ld = False
        elif tag in ("script", "style") and self._skip:
            self._skip -= 1

    def handle_data(self, d):
        if self._w_ld:
            self._ld.append(d)
            return
        if self._skip:
            return
        if self._w_title or self._h or self._a is not None:
            self._buf.append(d)
        self.tekst.append(d)


def sprawdz(sciezka, url_base):
    h = open(sciezka, encoding="utf-8").read()
    p = Zbieracz()
    p.feed(h)
    E, W = [], []          # krytyczne, ostrzezenia
    nazwa = os.path.basename(sciezka)

    def err(k, m): E.append((k, m))
    def ostrz(k, m): W.append((k, m))

    meta = {}
    for k, v in p.metas:
        meta.setdefault(k, v)

    # --- TITLE ---
    t = p.title
    if not t:
        err("TITLE-BRAK", "strona nie ma znacznika <title>")
    else:
        if len(t) > TITLE_MAX:
            err("TITLE-DLUGI", "tytul ma %d zn., limit TRC to %d — skroc o %d zn.: %r" % (len(t), TITLE_MAX, len(t) - TITLE_MAX, t))
        if len(t) < TITLE_MIN:
            err("TITLE-KROTKI", "tytul ma %d zn., minimum %d" % (len(t), TITLE_MIN))
        px = szerokosc_px(t)
        if px > TITLE_PX_MAX:
            ostrz("TITLE-PX", "szacowana szerokosc %d px > %d px — moze zostac uciety w SERP" % (px, TITLE_PX_MAX))
        if t.strip().strip("|-–—: ").lower() in GENERYCZNE_TYTULY or len(t.strip().strip("|-–—: ")) < 5:
            err("TITLE-GENERYCZNY", "tytul generyczny lub pusty poza marka: %r" % t)
        rdzen = re.split(r"[|–—-]", t)[0]
        slowa = [w for w in re.findall(r"\w+", rdzen.lower()) if len(w) > 3]
        if slowa and max(slowa.count(x) for x in set(slowa)) >= 3:
            err("TITLE-STUFFING", "powtorzone slowo kluczowe w tytule: %r" % t)
        for rok in re.findall(r"\b(20\d{2})\b", t):
            if int(rok) < 2026:
                ostrz("TITLE-ROK", "tytul zawiera rok %s — sprawdz aktualnosc" % rok)
        if "[materia" in t.lower() or "materiał własny" in t.lower():
            err("TITLE-AUTORSTWO", "dopisek autorstwa w tytule — autorstwo nalezy do stopki")

    # --- META DESCRIPTION ---
    d = meta.get("description")
    if d is None:
        err("DESC-BRAK", "brak meta description")
    else:
        if len(d) > DESC_MAX:
            err("DESC-DLUGI", "opis ma %d zn., limit TRC to %d" % (len(d), DESC_MAX))
        if len(d) < DESC_MIN:
            err("DESC-KROTKI", "opis ma %d zn., minimum %d" % (len(d), DESC_MIN))
        if t and d.strip().lower() == t.strip().lower():
            err("DESC-KOPIA", "opis jest kopia tytulu")
        if d.count(",") >= 6 and len(re.findall(r"[.!?]", d)) <= 1:
            err("DESC-LISTA", "opis wyglada na liste slow kluczowych, nie na zdanie")

    # --- H1 / hierarchia ---
    h1 = [x for lvl, x in p.naglowki if lvl == 1]
    if len(h1) == 0:
        err("H1-BRAK", "brak H1")
    elif len(h1) > 1:
        err("H1-WIELE", "znaleziono %d znacznikow H1, dozwolony 1" % len(h1))
    else:
        if len(h1[0]) > H1_MAX:
            err("H1-DLUGI", "H1 ma %d zn., limit %d" % (len(h1[0]), H1_MAX))
        if not h1[0].strip():
            err("H1-PUSTY", "H1 jest pusty")
    poziomy = [lvl for lvl, _ in p.naglowki]
    for a, b in zip(poziomy, poziomy[1:]):
        if b - a > 1:
            err("NAGL-PRZESKOK", "przeskok w hierarchii naglowkow: H%d -> H%d" % (a, b))
            break
    if len([1 for lvl, _ in p.naglowki if lvl == 2]) < 2:
        err("H2-MALO", "artykul ma mniej niz 2 naglowki H2")

    # --- canonical ---
    kan = [href for rel, href, _ in p.links if "canonical" in rel.split()]
    if len(kan) == 0:
        err("CANONICAL-BRAK", "brak rel=canonical")
    elif len(kan) > 1:
        err("CANONICAL-WIELE", "znaleziono %d znacznikow canonical" % len(kan))
    else:
        c = kan[0]
        if not c.startswith("http"):
            err("CANONICAL-WZGLEDNY", "canonical musi byc adresem bezwzglednym: %r" % c)
        elif not c.startswith("https://"):
            err("CANONICAL-HTTP", "canonical musi byc na HTTPS: %r" % c)
        if "#" in c:
            err("CANONICAL-FRAGMENT", "canonical zawiera fragment #")
        if url_base and c.startswith("http") and not c.startswith(url_base):
            ostrz("CANONICAL-DOMENA", "canonical spoza %s: %r" % (url_base, c))

    # --- noindex / lang / viewport ---
    rob = (meta.get("robots") or "").lower()
    if "noindex" in rob:
        err("NOINDEX", "strona ma meta robots noindex — na produkcji to blad krytyczny")
    if not p.html_lang:
        err("LANG-BRAK", "brak atrybutu lang w znaczniku <html>")
    if "viewport" not in meta:
        err("VIEWPORT-BRAK", "brak meta viewport")

    # --- hreflang ---
    hl = [(href, code) for rel, href, code in p.links if "alternate" in rel.split() and code]
    if hl:
        kody = [c for _, c in hl]
        for c in kody:
            if c.lower() != "x-default":
                if not ISO639.match(c):
                    err("HREFLANG-KOD", "niepoprawny kod hreflang: %r" % c)
                if c.lower() in KODY_ZAREZERWOWANE:
                    err("HREFLANG-ZAREZERWOWANY", "kod %r jest ignorowany przez Google" % c)
        if len(kody) != len(set(k.lower() for k in kody)):
            err("HREFLANG-DUPLIKAT", "zduplikowane kody hreflang")
        for href, _ in hl:
            if not href.startswith("http"):
                err("HREFLANG-WZGLEDNY", "hreflang wymaga adresow bezwzglednych: %r" % href)
                break
        wlasny = url_base.rstrip("/") + "/" + nazwa if url_base else None
        if wlasny and not any(href.rstrip("/") == wlasny.rstrip("/") for href, _ in hl):
            ostrz("HREFLANG-SELF", "brak self-reference w hreflang")

    # --- obrazy ---
    for o in p.obrazy:
        src = o["src"]
        if o["alt"] is None:
            err("IMG-ALT-BRAK", "obraz bez atrybutu alt: %s" % src)
        elif o["alt"].strip() == "":
            ostrz("IMG-ALT-PUSTY", "pusty alt (dozwolony tylko dla obrazow dekoracyjnych): %s" % src)
        else:
            if len(o["alt"]) > ALT_MAX:
                err("IMG-ALT-DLUGI", "alt ma %d zn., limit %d: %s" % (len(o["alt"]), ALT_MAX, src))
            if o["alt"].count(",") >= 4:
                err("IMG-ALT-STUFFING", "alt wyglada na liste fraz: %s" % src)
        if src and not (o["w"] and o["h"]):
            ostrz("IMG-WYMIARY", "brak width/height (ryzyko CLS): %s" % src)
        if re.search(r"/(IMG|DSC|P)\d+\.(jpg|png|jpeg)$", src, re.I):
            ostrz("IMG-NAZWA", "nieopisowa nazwa pliku: %s" % src)

    # --- linki ---
    wewn = 0
    for a in p.kotwice:
        if not a["ma_href"]:
            err("LINK-BEZ-HREF", "znacznik <a> bez atrybutu href: %r" % a.get("tekst", "")[:40])
            continue
        href = a["href"] or ""
        if href.lower().startswith("javascript:"):
            err("LINK-JS", "link javascript: nie jest skanowalny: %r" % a.get("tekst", "")[:40])
        txt = (a.get("tekst") or "").strip().lower().rstrip(" .!»>")
        if txt in GENERYCZNE_ANCHORY:
            err("ANCHOR-GENERYCZNY", "nieopisowy anchor: %r -> %s" % (a.get("tekst"), href))
        if href and not href.startswith(("http", "mailto:", "tel:", "#", "javascript:")):
            wewn += 1
    if wewn < MIN_INTERNAL_LINKS:
        err("LINKI-MALO", "tylko %d linkow wewnetrznych w tresci, wymagane min. %d" % (wewn, MIN_INTERNAL_LINKS))

    # --- JSON-LD ---
    if not p.jsonld:
        err("JSONLD-BRAK", "brak danych strukturalnych JSON-LD")
    for raw in p.jsonld:
        try:
            data = json.loads(raw)
        except Exception as e:
            err("JSONLD-BLAD", "niepoprawny JSON-LD: %s" % e)
            continue
        for obj in (data if isinstance(data, list) else [data]):
            if not isinstance(obj, dict):
                continue
            if "@context" not in obj:
                err("JSONLD-CONTEXT", "brak @context w JSON-LD")
            typ = obj.get("@type", "")
            if typ in ("Article", "NewsArticle", "BlogPosting"):
                for pole in ("headline", "datePublished", "author", "image"):
                    if not obj.get(pole):
                        err("JSONLD-POLE", "brak wymaganego pola %r w %s" % (pole, typ))
                hl_ = obj.get("headline", "")
                if isinstance(hl_, str) and len(hl_) > 110:
                    err("JSONLD-HEADLINE", "headline ma %d zn., limit Google to 110" % len(hl_))

    # --- Open Graph ---
    for k in ("og:title", "og:description", "og:url", "og:image"):
        if k not in meta:
            ostrz("OG-BRAK", "brak %s" % k)

    # --- E-E-A-T / TRC ---
    tekst = re.sub(r"\s+", " ", "".join(p.tekst))
    slowa = len(tekst.split())
    if slowa < MIN_WORDS_ARTICLE:
        err("TRESC-CIENKA", "artykul ma ok. %d slow, minimum TRC to %d" % (slowa, MIN_WORDS_ARTICLE))
    if not re.search(r"Dz\.\s?U\.", tekst):
        err("BRAK-PUBLIKATORA", "brak powolania publikatora (Dz.U.) — wymog TRC dla tresci prawnych")
    if not re.search(r"[Ss]tan prawny", tekst):
        err("BRAK-STANU-PRAWNEGO", "brak daty stanu prawnego")
    if not re.search(r"Autor|Kancelaria TRC|materia[lł] w[lł]asny", tekst, re.I):
        err("BRAK-PODPISU", "brak podpisu autora (E-E-A-T)")

    # --- ukryty tekst ---
    if re.search(r"font-size\s*:\s*0(px)?\b|opacity\s*:\s*0\b|text-indent\s*:\s*-\d{4}", h, re.I):
        err("UKRYTY-TEKST", "wykryto wzorzec ukrywania tekstu")

    kb = len(h.encode("utf-8")) / 1024.0
    if kb > 300:
        ostrz("HTML-WAGA", "plik HTML ma %.0f kB" % kb)

    return E, W, {"slowa": slowa, "title_len": len(t or ""), "desc_len": len(d or ""), "linki_wewn": wewn}


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    opts = dict(a.split("=", 1) for a in sys.argv[1:] if a.startswith("--") and "=" in a)
    url_base = opts.get("--url-base", "").rstrip("/")
    cel = args[0] if args else "."
    pliki = [cel] if os.path.isfile(cel) else sorted(glob.glob(os.path.join(cel, "**", "*.html"), recursive=True))
    if not pliki:
        print("Nie znaleziono plikow HTML w: %s" % cel)
        return 1

    raport, krytyczne, ostrzezenia = [], 0, 0
    from datetime import date
    print("STRAZNIK SEO — %s — %s\n" % (cel, date.today().isoformat()))
    for f in pliki:
        E, W, st = sprawdz(f, url_base)
        krytyczne += len(E)
        ostrzezenia += len(W)
        raport.append({"plik": f, "bledy": E, "ostrzezenia": W, "statystyki": st})
        if E or W:
            print("── %s" % os.path.basename(f))
            for k, m in E:
                print("   ✖ [%s] %s" % (k, m))
            for k, m in W:
                print("   ▲ [%s] %s" % (k, m))

    print("\nPlikow sprawdzonych: %d | bledy krytyczne: %d | ostrzezenia: %d" % (len(pliki), krytyczne, ostrzezenia))
    if "--json" in opts:
        json.dump(raport, open(opts["--json"], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    if krytyczne:
        print("\nWERDYKT: NIE PUBLIKOWAC — sa bledy krytyczne do poprawy.")
        return 1
    print("\nWERDYKT: wszystko OK — mozna publikowac.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
