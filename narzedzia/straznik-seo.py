#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Strażnik SEO — kontrola strony przed publikacją (kanon Google + standard TRC).

Użycie:
    python3 straznik-seo.py plik.html --url-base=https://cosc.org.pl
    python3 straznik-seo.py /sciezka/do/repo --url-base=https://cosc.org.pl

Kod wyjścia: 0 = brak błędów krytycznych, 1 = BLOKADA PUBLIKACJI.
Bez zależności zewnętrznych (html.parser ze standardowej biblioteki).
"""
import sys, os, re, json, glob, datetime
from html.parser import HTMLParser

TITLE_MAX, TITLE_MIN, TITLE_PX_MAX = 60, 25, 580
DESC_MAX, DESC_MIN = 155, 70
H1_MAX, ALT_MAX = 90, 125
MIN_WORDS_ARTICLE, MIN_INTERNAL_LINKS = 300, 3

GENERIC_TITLES = {"strona główna", "home", "dokument", "profil", "index", "bez tytułu"}
GENERIC_ANCHORS = {"kliknij tutaj", "czytaj więcej", "tutaj", "zobacz", "link", "więcej", "kliknij"}
GENERIC_ALTS = {"obraz", "zdjęcie", "grafika", "image", "photo", "foto", "ilustracja"}
WIDE = set("mwMW—…@%")


def px_width(s):
    """Przybliżona szerokość tytułu w SERP desktop (px)."""
    w = 0.0
    for ch in s:
        if ch in WIDE:
            w += 12.5
        elif ch.isupper():
            w += 10.0
        elif ch in "iljtfIr.,:;'|! ":
            w += 4.5
        else:
            w += 8.0
    return round(w)


class Doc(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self._in_title = False
        self.metas = []
        self.links = []          # (rel, href, hreflang)
        self.headings = []       # (level, text)
        self._h = None
        self._htext = ""
        self.imgs = []           # dict
        self.anchors = []        # (href, text, has_img_alt)
        self._a = None
        self._atext = ""
        self.jsonld = []
        self._in_ld = False
        self._ld = ""
        self.html_lang = ""
        self.text_parts = []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html":
            self.html_lang = a.get("lang", "")
        elif tag == "title":
            self._in_title = True
        elif tag == "meta":
            self.metas.append(a)
        elif tag == "link":
            self.links.append((a.get("rel", ""), a.get("href", ""), a.get("hreflang", "")))
        elif tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self._h = int(tag[1]); self._htext = ""
        elif tag == "img":
            self.imgs.append(a)
            if self._a is not None:
                self._atext += " " + a.get("alt", "")
        elif tag == "a":
            self._a = a.get("href"); self._atext = ""
        elif tag == "script":
            if a.get("type") == "application/ld+json":
                self._in_ld = True; self._ld = ""
            else:
                self._skip += 1
        elif tag == "style":
            self._skip += 1

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        elif tag in ("h1", "h2", "h3", "h4", "h5", "h6") and self._h:
            self.headings.append((self._h, self._htext.strip())); self._h = None
        elif tag == "a" and self._a is not None:
            self.anchors.append((self._a, " ".join(self._atext.split()))); self._a = None
        elif tag == "script":
            if self._in_ld:
                self.jsonld.append(self._ld); self._in_ld = False
            elif self._skip:
                self._skip -= 1
        elif tag == "style" and self._skip:
            self._skip -= 1

    def handle_data(self, d):
        if self._in_title:
            self.title += d
        elif self._in_ld:
            self._ld += d
        elif self._skip == 0:
            if self._h:
                self._htext += d
            if self._a is not None:
                self._atext += d
            self.text_parts.append(d)


def meta(doc, name=None, prop=None):
    for m in doc.metas:
        if name and m.get("name", "").lower() == name:
            return m.get("content", "")
        if prop and m.get("property", "").lower() == prop:
            return m.get("content", "")
    return ""


def check(path, url_base=""):
    raw = open(path, encoding="utf-8", errors="replace").read()
    d = Doc(); d.feed(raw)
    err, warn = [], []
    E = lambda c, m: err.append((c, m))
    W = lambda c, m: warn.append((c, m))

    # --- title ---
    t = " ".join(d.title.split())
    if not t:
        E("TITLE-BRAK", "strona nie ma znacznika <title>")
    else:
        if len(t) > TITLE_MAX:
            E("TITLE-DL", f"tytuł ma {len(t)} znaków, dozwolone {TITLE_MAX} — skróć o {len(t)-TITLE_MAX}")
        if len(t) < TITLE_MIN:
            E("TITLE-KROTKI", f"tytuł ma {len(t)} znaków, minimum {TITLE_MIN}")
        if px_width(t) > TITLE_PX_MAX:
            W("TITLE-PX", f"tytuł ~{px_width(t)} px, próg {TITLE_PX_MAX} px — może zostać ucięty w wynikach")
        if t.strip().lower() in GENERIC_TITLES:
            E("TITLE-GEN", "tytuł generyczny")
        if re.search(r"\[materiał własny|materiał własny COSC\]", t, re.I):
            E("TITLE-AUTOR", "dopisek autorstwa nie należy do <title> — przenieś do stopki artykułu")
        yrs = [int(y) for y in re.findall(r"\b(20\d\d)\b", t)]
        cur = datetime.date.today().year
        if yrs and max(yrs) < cur:
            W("TITLE-ROK", f"tytuł zawiera nieaktualny rok {max(yrs)}")
        words = [w.lower() for w in re.findall(r"\w+", t) if len(w) > 3]
        if words and max(words.count(w) for w in set(words)) >= 3:
            E("TITLE-STUFF", "upychanie słów kluczowych w tytule")

    # --- description ---
    desc = " ".join(meta(d, name="description").split())
    if not desc:
        E("DESC-BRAK", "brak meta description")
    else:
        if len(desc) > DESC_MAX:
            E("DESC-DL", f"opis ma {len(desc)} znaków, dozwolone {DESC_MAX} — skróć o {len(desc)-DESC_MAX}")
        if len(desc) < DESC_MIN:
            E("DESC-KROTKI", f"opis ma {len(desc)} znaków, minimum {DESC_MIN}")
        if desc.strip().lower() == t.strip().lower():
            E("DESC-KOPIA", "opis jest kopią tytułu")
        if desc.count(",") >= 6 and "." not in desc:
            W("DESC-LISTA", "opis wygląda na listę fraz, nie na zdanie")

    # --- nagłówki ---
    h1 = [h for lvl, h in d.headings if lvl == 1]
    if len(h1) == 0:
        E("H1-BRAK", "brak nagłówka H1")
    elif len(h1) > 1:
        E("H1-WIELE", f"na stronie jest {len(h1)} nagłówków H1, dozwolony jeden")
    for h in h1:
        if len(h) > H1_MAX:
            E("H1-DL", f"H1 ma {len(h)} znaków, dozwolone {H1_MAX}")
        if not h.strip():
            E("H1-PUSTY", "H1 jest pusty")
    lv = [l for l, _ in d.headings]
    prev = 0
    for l in lv:
        if prev and l > prev + 1:
            W("NAGL-SKOK", f"przeskok w hierarchii nagłówków: H{prev} → H{l}")
        prev = l
    if lv.count(2) < 2:
        W("H2-MALO", "artykuł ma mniej niż 2 nagłówki H2")

    # --- canonical / noindex / lang / viewport ---
    canon = [h for rel, h, _ in d.links if "canonical" in (rel or "").lower()]
    if len(canon) == 0:
        E("CANON-BRAK", "brak rel=canonical")
    elif len(canon) > 1:
        E("CANON-WIELE", f"{len(canon)} znaczników canonical, dozwolony jeden")
    else:
        c = canon[0]
        if not c.startswith("http"):
            E("CANON-WZGL", "canonical musi być adresem bezwzględnym")
        elif not c.startswith("https://"):
            E("CANON-HTTP", "canonical musi używać HTTPS")
        if "#" in c:
            E("CANON-FRAG", "canonical zawiera fragment #")

    robots = meta(d, name="robots").lower()
    if "noindex" in robots or "noindex" in raw.lower():
        E("NOINDEX", "na stronie jest noindex — blokada indeksacji")
    if not d.html_lang:
        E("LANG-BRAK", "brak atrybutu lang w <html>")
    if not meta(d, name="viewport"):
        E("VIEWPORT", "brak <meta name=viewport>")

    # --- hreflang ---
    hl = [(hlang, href) for rel, href, hlang in d.links if hlang]
    seen = {}
    for code, href in hl:
        c = code.lower()
        if c != "x-default":
            parts = c.split("-")
            if len(parts[0]) != 2 or not parts[0].isalpha():
                E("HREFLANG-KOD", f"niepoprawny kod hreflang: {code}")
            if parts[0] in ("eu", "un", "uk") and len(parts) == 1 and parts[0] != "uk":
                W("HREFLANG-REZ", f"kod zarezerwowany/ignorowany: {code}")
        if not href.startswith("http"):
            E("HREFLANG-WZGL", f"hreflang {code}: adres musi być bezwzględny")
        if c in seen:
            E("HREFLANG-DUP", f"zduplikowany hreflang: {code}")
        seen[c] = href

    # --- obrazy ---
    for im in d.imgs:
        src = im.get("src", "")
        if "alt" not in im:
            E("IMG-ALT", f"brak atrybutu alt: {src}")
        else:
            alt = im["alt"].strip()
            if not alt:
                W("IMG-ALT-PUSTY", f"pusty alt: {src}")
            elif alt.lower() in GENERIC_ALTS:
                W("IMG-ALT-OGOLNY", f"ogólny alt „{alt}”: {src}")
            elif len(alt) > ALT_MAX:
                W("IMG-ALT-DL", f"alt ma {len(alt)} znaków (max {ALT_MAX}): {src}")
        base = os.path.basename(src)
        if re.match(r"^(img|dsc|image)[-_]?\d+\.", base, re.I):
            W("IMG-NAZWA", f"nieopisowa nazwa pliku: {base}")

    # --- linki ---
    internal = 0
    for href, text in d.anchors:
        if href is None:
            continue
        if href.strip().lower().startswith("javascript:"):
            E("LINK-JS", "link javascript: nie jest skanowalny")
        low = text.strip().lower().rstrip(" .:→")
        if low in GENERIC_ANCHORS:
            W("LINK-ANCHOR", f"nieopisowy anchor: „{text}”")
        if href and not href.startswith(("http", "mailto:", "tel:", "#")):
            internal += 1
        elif url_base and href.startswith(url_base):
            internal += 1
    if internal < MIN_INTERNAL_LINKS:
        W("LINK-WEW", f"tylko {internal} linków wewnętrznych, minimum {MIN_INTERNAL_LINKS}")

    # --- JSON-LD ---
    if not d.jsonld:
        W("LD-BRAK", "brak danych strukturalnych JSON-LD")
    for blob in d.jsonld:
        try:
            data = json.loads(blob)
        except Exception as e:
            E("LD-JSON", f"niepoprawny JSON-LD: {e}")
            continue
        for node in (data if isinstance(data, list) else [data]):
            if not isinstance(node, dict):
                continue
            if "@context" not in node:
                E("LD-CONTEXT", "brak @context w JSON-LD")
            if node.get("@type") in ("Article", "NewsArticle", "BlogPosting"):
                for f in ("headline", "datePublished", "author", "image"):
                    if f not in node:
                        E("LD-POLE", f"brak wymaganego pola {f} w {node.get('@type')}")
                hd = node.get("headline", "")
                if isinstance(hd, str) and len(hd) > 110:
                    E("LD-HEADLINE", f"headline ma {len(hd)} znaków, dozwolone 110")

    # --- Open Graph ---
    for p in ("og:title", "og:description", "og:image", "og:url"):
        if not meta(d, prop=p):
            W("OG-BRAK", f"brak {p}")

    # --- objętość i E-E-A-T ---
    body_text = " ".join(" ".join(d.text_parts).split())
    nwords = len(body_text.split())
    if nwords < MIN_WORDS_ARTICLE:
        W("TRESC-CIENKA", f"{nwords} słów, minimum {MIN_WORDS_ARTICLE}")
    if not re.search(r"Dz\.\s?U\.", body_text):
        W("EEAT-PUBLIKATOR", "brak publikatora (Dz.U.) w treści")
    if not re.search(r"[Ss]tan prawny", body_text):
        W("EEAT-STAN", "brak daty stanu prawnego")
    if not re.search(r"(Materiał własny|Autor:)", body_text):
        W("EEAT-AUTOR", "brak podpisu autorskiego")

    # --- zakazy kanonu redakcyjnego TRC ---
    for phrase in ("warto zweryfikować", "do weryfikacji", "sprawdź w urzędzie", "wymaga weryfikacji"):
        if phrase in body_text.lower():
            E("KANON-PLAKIETKA", f"zakazany zwrot weryfikacyjny: „{phrase}”")
    for title_pl in ("radca prawny", "adwokat", "abogado", "attorney", "solicitor", "barrister"):
        if re.search(r"\b" + title_pl + r"\b", body_text, re.I):
            W("KANON-TYTUL", f"w treści występuje „{title_pl}” — sprawdź kontekst (zakaz tytułów zawodowych wydawcy)")

    # --- ukryty tekst ---
    if re.search(r"font-size\s*:\s*0|opacity\s*:\s*0(?!\.)|text-indent\s*:\s*-\d{4}", raw):
        W("UKRYTY-TEKST", "styl sugerujący ukryty tekst")
    if len(raw) > 400_000:
        W("HTML-WAGA", f"plik HTML ma {len(raw)//1024} KB")

    return err, warn


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    url_base = ""
    out_json = ""
    for a in sys.argv[1:]:
        if a.startswith("--url-base="):
            url_base = a.split("=", 1)[1]
        if a.startswith("--json="):
            out_json = a.split("=", 1)[1]
    if not args:
        print(__doc__); return 2
    target = args[0]
    files = ([target] if os.path.isfile(target)
             else sorted(glob.glob(os.path.join(target, "**", "*.html"), recursive=True)))
    total_err = 0
    report = {}
    for f in files:
        err, warn = check(f, url_base)
        report[f] = {"errors": err, "warnings": warn}
        total_err += len(err)
        print(f"\nSTRAŻNIK SEO — {f} — {datetime.date.today().isoformat()}")
        if err:
            print("\nBŁĘDY KRYTYCZNE (blokują publikację)")
            for c, m in err:
                print(f"  ✖ [{c}] {m}")
        if warn:
            print("\nOSTRZEŻENIA (poprawić, nie blokują)")
            for c, m in warn:
                print(f"  ▲ [{c}] {m}")
        if not err and not warn:
            print("  brak uwag")
    if out_json:
        json.dump(report, open(out_json, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("\nWERDYKT: " + ("wszystko OK — można publikować."
                           if total_err == 0 else
                           f"NIE PUBLIKOWAĆ — {total_err} błędów krytycznych do poprawy."))
    return 1 if total_err else 0


if __name__ == "__main__":
    sys.exit(main())
