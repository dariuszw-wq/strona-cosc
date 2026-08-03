#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generator indeksu wyszukiwarki — zasila stronę 404 i ewentualną wyszukiwarkę w serwisie.

Przechodzi po plikach HTML i wyciąga z każdego tytuł, opis oraz język. Wynik to jeden
plik JSON, który strona 404 pobiera i przeszukuje po stronie przeglądarki — bez serwera,
bez bazy danych, bez zewnętrznej usługi.

Uruchamiaj po każdej większej zmianie w serwisie (dodanie stron, zmiana tytułów).

Użycie:
    python3 generuj_index_wyszukiwarki.py <katalog> --domena https://przyklad.pl [--wyjscie szukaj-index.json]
"""
import argparse, html, json, os, re, sys

POMIJANE_PLIKI = re.compile(r"^(404|google[0-9a-f]{10,}|BingSiteAuth|yandex_)", re.I)
POMIJANE_KATALOGI = {".git", "node_modules", "__pycache__", ".github", "og", "animacje_kolumbijka"}
# strony robocze, podglądowe i demonstracyjne nie powinny trafiać do wyszukiwarki
POMIJANE_WZORCE = re.compile(r"(podglad|demo|backup|test|WZOR)", re.I)


def tekst(wzor, tresc, grupa=1):
    m = re.search(wzor, tresc, re.S | re.I)
    return html.unescape(re.sub(r"\s+", " ", m.group(grupa))).strip() if m else ""


def zbierz(katalog, domena):
    domena = domena.rstrip("/")
    wpisy = []
    for root, dirs, files in os.walk(katalog):
        dirs[:] = [d for d in dirs if d not in POMIJANE_KATALOGI and not d.startswith("_")]
        for f in sorted(files):
            if not f.endswith(".html") or ".bak" in f:
                continue
            if POMIJANE_PLIKI.match(f) or POMIJANE_WZORCE.search(f):
                continue
            rel = os.path.relpath(os.path.join(root, f), katalog).replace("\\", "/")
            s = open(os.path.join(katalog, rel), encoding="utf-8", errors="replace").read()

            if re.search(r'<meta[^>]+name=["\']robots["\'][^>]*content=["\'][^"\']*noindex', s, re.I):
                continue                      # skoro strona nie ma być w Google, nie ma jej też w wyszukiwarce

            tytul = tekst(r"<title[^>]*>(.*?)</title>", s)
            if not tytul:
                continue
            # tytuły zwykle kończą się nazwą marki po separatorze — w wynikach to tylko szum
            tytul_krotki = re.split(r"\s+[|—–]\s+", tytul)[0].strip() or tytul

            adres = domena + "/" if rel == "index.html" else (
                domena + "/" + rel[:-len("index.html")] if rel.endswith("/index.html") else domena + "/" + rel)

            wpisy.append({
                "url": adres,
                "tytul": tytul_krotki,
                "opis": tekst(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', s)[:200],
                "lang": (tekst(r'<html[^>]+lang=["\']([^"\']+)["\']', s) or "pl").split("-")[0],
                "sekcja": rel.split("/")[0] if "/" in rel else "",
            })
    return wpisy


def main():
    ap = argparse.ArgumentParser(description="Generuje indeks wyszukiwarki (JSON) dla strony 404.")
    ap.add_argument("katalog")
    ap.add_argument("--domena", required=True)
    ap.add_argument("--wyjscie", default="szukaj-index.json")
    a = ap.parse_args()

    if not os.path.isdir(a.katalog):
        print(f"Nie ma takiego katalogu: {a.katalog}", file=sys.stderr)
        sys.exit(1)

    wpisy = zbierz(a.katalog, a.domena)
    sciezka = os.path.join(a.katalog, a.wyjscie) if not os.path.isabs(a.wyjscie) else a.wyjscie
    json.dump(wpisy, open(sciezka, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

    ile_lang = {}
    for w in wpisy:
        ile_lang[w["lang"]] = ile_lang.get(w["lang"], 0) + 1
    print(f"Zapisano {sciezka}: {len(wpisy)} stron "
          f"({', '.join(f'{k}: {v}' for k, v in sorted(ile_lang.items()))}), "
          f"{os.path.getsize(sciezka) // 1024} KB")


if __name__ == "__main__":
    main()
