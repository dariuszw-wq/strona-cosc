# System wielojęzyczny COSC — instrukcja

Strona jest po polsku. System tłumaczeń jest już **podłączony i działa** — brakuje tylko
treści tłumaczeń (wpisuje się je do plików JSON). Dopóki tłumaczenie nie jest wpisane,
strona pokazuje polski oryginał (nic się nie psuje).

## Języki
PL (źródłowy) · EN · ES · UK (ukraiński) · RU (rosyjski) · FR

## Pliki
- `i18n.js` — silnik (wykrywa język, podmienia teksty, buduje przełącznik, hreflang).
- `i18n.css` — wygląd przełącznika języków (dropdown z flagami).
- `pl.json` — **referencja**: lista wszystkich tekstów strony (klucz = wartość).
- `en.json`, `es.json`, `uk.json`, `ru.json`, `fr.json` — **tu wpisuje się tłumaczenia**.
- `extract.js` — generator słowników (do użycia po zmianie treści strony).

## Jak dodać tłumaczenie (np. angielskie)
Otwórz `en.json`. W sekcji `strings` każdy klucz to polski tekst, a wartość to tłumaczenie:

```json
"strings": {
  "Legalizacja pobytu i pracy w Polsce": "Legalising residence and work in Poland",
  "Zobacz, jak to działa": "See how it works"
}
```
Uzupełnij też `title` i `description` (na górze pliku) — tytuł karty i opis SEO.

Zasady:
- Klucz może zawierać HTML (`<strong>`, `<em>`, `<br>`, `<a href=...>`). W tłumaczeniu
  **zachowaj te same znaczniki i adresy** `href`, przetłumacz tylko tekst.
- Pusta wartość `""` = pokazuje polski oryginał (bezpieczny fallback).
- Nie zmieniaj kluczy — muszą dokładnie odpowiadać tekstom na stronie.

## Jak działa przełączanie
- Przełącznik (flaga + kod) jest w prawym górnym rogu, widoczny też na telefonie.
- Wybór zapisuje się w przeglądarce i w adresie (`?lang=en`), więc link można udostępniać.
- Zmiana języka jest natychmiastowa, bez przeładowania strony.

## Po zmianie treści strony (nowe teksty w index.html)
Trzeba odświeżyć listę kluczy:
```
npm install jsdom      # jednorazowo
node i18n/extract.js   # nadpisze pl.json i doda nowe puste klucze do pozostałych
```
> Uwaga: `extract.js` domyślnie **nadpisuje** pliki tłumaczeń pustymi kluczami dla nowych
> tekstów, ale kasuje istniejące wartości. Przed masowym tłumaczeniem zrób kopię, albo
> poproś o wersję generatora, która dopisuje tylko brakujące klucze (scalanie).

## Do zrobienia później (poza tym etapem)
- Wpisanie właściwych tłumaczeń dla 6 języków.
- Podłączenie tego samego `i18n.js` do podstron (artykuły, formularz, gry, regulamin).
- Opcjonalnie: eksport kluczy do arkusza .xlsx do wygodnego tłumaczenia.
