# KROK 1 — Architektura serwisu nowa.kartapobytutrc.pl
## Sitemapa • Struktura URL • Klastry słów kluczowych • Plan hreflang

**Marka strony:** Centrum Obsługi Spraw Cudzoziemców Polska
**Administrator danych (RODO):** Dariusz Włodarczyk Kancelaria TRC
**Data dokumentu:** 07.07.2026 | **Status prawny treści:** wymaga weryfikacji przed publikacją każdej strony (ustawa o cudzoziemcach po nowelizacji MOS, stan na 27.04.2026)

---

## 1. KLUCZOWA ZMIANA KONTEKSTU: MOS JEST JUŻ OBOWIĄZKOWY

Od 27.04.2026 wnioski o pobyt czasowy, stały i rezydenta długoterminowego UE składa się **wyłącznie elektronicznie** przez portal MOS (mos.cudzoziemcy.gov.pl). Wnioski papierowe są pozostawiane bez rozpoznania. Od 04.05.2026 przez MOS składa się także wniosek o kartę CUKR (obywatele Ukrainy — przekształcenie statusu UKR w pobyt czasowy na 3 lata).

**Konsekwencje dla architektury:**
1. MOS przestaje być „landing page o zmianie" — staje się **stałym klastrem treści nr 1** (jak złożyć, błędy, profil zaufany, załącznik pracodawcy, UPO, zaświadczenie zamiast stempla).
2. Pakiet „Wniosek bez błędów" (800 zł) idealnie wpisuje się w nową rzeczywistość — wielu cudzoziemców nie ma profilu zaufanego i nie umie wypełnić wniosku po polsku (formularz MOS jest wyłącznie po polsku!). To silny argument sprzedażowy: **strona usługowa MOS = strona konwersyjna nr 1**.
3. Nowy klaster CUKR (UA/RU) — wysoki wolumen, pilny (60 dni na odbiór karty pod rygorem unieważnienia). Uzasadnia przyspieszenie wersji UA z Etapu 2.
4. Wyjątki od MOS (ICT, łączenie rodzin gdy cudzoziemiec za granicą, członkowie rodzin obywateli UE) nadal papierowo — osobny artykuł, mało konkurencyjny, wysoka intencja.

---

## 2. STRUKTURA URL I DOMEN

**Wariant A (budżetowy):** subkatalogi językowe na jednej domenie — `kartapobytutrc.pl/en/...`, `/es/`, `/pt/`, PL w katalogu głównym.
- Koszt: 0 zł dodatkowo (Polylang Pro ~99 €/rok już w planie)
- Zalety: cała moc domeny w jednym miejscu, jeden certyfikat, jedna instalacja WP, najprostszy hreflang
- Wady: brak geotargetowania per kraj (nieistotne — targetujemy język, nie kraj)
- Ryzyko: minimalne
- **SEO: najlepsza praktyka dla firm usługowych — rekomendowany**

**Wariant B (premium):** osobne domeny per język (np. residencecardpoland.com). Koszt: ~200–400 zł/rok/domena + rozproszenie link equity. Odradzam na tym etapie.

**Rekomendacja: Wariant A.** PL bez prefiksu, pozostałe języki w subkatalogach `/en/`, `/es/`, `/pt/` (Etap 2: `/fr/`, `/ua/`, `/ru/`).

### Konwencja slugów
- Slugi **przetłumaczone w każdym języku** (nie kopiowane z PL) — Polylang Pro to obsługuje.
- Krótkie, z frazą kluczową: `/karta-pobytu-czasowego/` → `/en/temporary-residence-card-poland/` → `/es/tarjeta-de-residencia-polonia/` → `/pt/cartao-de-residencia-polonia/`
- Bez dat w URL artykułów blogowych (treści evergreen z polem „ostatnia aktualizacja").
- Struktura płaska dla usług (`/uslugi/nazwa/`), klastrowa dla wiedzy (`/przewodnik/temat/`).

---

## 3. SITEMAPA (Etap 1 — PL/EN/ES/PT)

Poniżej struktura PL; wersje EN/ES/PT są lustrzane (z tłumaczonymi slugami). Priorytet: **P1 = przed startem, P2 = pierwsze 30 dni, P3 = 60–90 dni.**

### 3.1 Strony główne i usługowe (konwersyjne)

| # | URL (PL) | Cel / słowo kluczowe główne | P |
|---|---|---|---|
| 1 | `/` | strona główna — „legalizacja pobytu i pracy cudzoziemców Polska" | P1 |
| 2 | `/uslugi/karta-pobytu-czasowego/` | pobyt czasowy / karta pobytu (usługa flagowa) | P1 |
| 3 | `/uslugi/wniosek-mos/` | **pomoc w złożeniu wniosku przez MOS** (pakiet 800 zł) | P1 |
| 4 | `/uslugi/pobyt-staly/` | zezwolenie na pobyt stały | P1 |
| 5 | `/uslugi/rezydent-dlugoterminowy-ue/` | pobyt rezydenta długoterminowego UE | P2 |
| 6 | `/uslugi/zezwolenie-na-prace/` | zezwolenie na pracę (typ A) — dla pracodawców | P1 |
| 7 | `/uslugi/zezwolenie-jednolite/` | zezwolenie na pobyt czasowy i pracę | P1 |
| 8 | `/uslugi/niebieska-karta-ue/` | Niebieska Karta UE | P2 |
| 9 | `/uslugi/oswiadczenie-o-powierzeniu-pracy/` | oświadczenie — dla pracodawców | P2 |
| 10 | `/uslugi/zmiana-pracodawcy/` | zmiana pracodawcy a karta pobytu | P2 |
| 11 | `/uslugi/odwolanie-od-decyzji/` | odwołanie / decyzja odmowna (pakiet VIP) | P2 |
| 12 | `/cennik/` | trzy pakiety (800 / 1850 / 3500 zł) + gwarancja | P1 |
| 13 | `/dla-pracodawcow/` | landing B2B (agencje, HR) — załącznik nr 1 w MOS, podpis elektroniczny pracodawcy | P1 |
| 14 | `/kontakt/` | formularz + WhatsApp + Telegram + telefon | P1 |
| 15 | `/o-nas/` | zaufanie: prawnik (Lawyer/Jurista), doświadczenie, opinie | P1 |
| 16 | `/regulamin/` + `/polityka-prywatnosci/` | Regulamin gwarancji + RODO | P1 |
| 17 | `/ankieta/` (przebudowana, bezpieczny upload) | intake zgodny z RODO | P2 |

### 3.2 Centrum wiedzy — klastry (blog/przewodniki)

**Klaster A — MOS (nowy, najwyższy priorytet trendowy)**
- `/przewodnik/mos-jak-zlozyc-wniosek/` — instrukcja krok po kroku (P1)
- `/przewodnik/mos-profil-zaufany-cudzoziemiec/` — jak założyć profil zaufany bez PESEL / z PESEL (P1)
- `/przewodnik/mos-zalacznik-pracodawcy/` — podpis elektroniczny pracodawcy, link e-mail (P2)
- `/przewodnik/mos-bledy-i-braki-formalne/` — najczęstsze błędy, pozostawienie bez rozpoznania (P2)
- `/przewodnik/mos-wyjatki-wnioski-papierowe/` — ICT, łączenie rodzin z zagranicy (P3)
- `/przewodnik/zaswiadczenie-o-zlozeniu-wniosku-zamiast-stempla/` (P2)
- `/przewodnik/karta-cukr/` — dla obywateli Ukrainy (P2; docelowo priorytet wersji UA)

**Klaster B — pobyt czasowy / karta pobytu**
- `/przewodnik/karta-pobytu-dokumenty/`, `/przewodnik/ile-czeka-sie-na-karte-pobytu/`, `/przewodnik/status-sprawy-urzad-wojewodzki/`, `/przewodnik/przedluzenie-pobytu/`, `/przewodnik/pobyt-czasowy-a-ostatni-dzien-legalnego-pobytu/`

**Klaster C — praca**
- `/przewodnik/zezwolenie-na-prace-rodzaje/`, `/przewodnik/zmiana-pracodawcy-co-zrobic/`, `/przewodnik/test-rynku-pracy/` (uwaga: zweryfikować stan prawny po nowej ustawie o zatrudnianiu cudzoziemców), `/przewodnik/praca-w-czasie-oczekiwania-na-decyzje/`

**Klaster D — życie w Polsce (long-tail, ruch wspierający)**
- PESEL, meldunek, wymiana prawa jazdy, ubezpieczenie zdrowotne/NFZ, ZUS i podatki, najem mieszkania, otwarcie JDG przez cudzoziemca, łączenie rodzin, obywatelstwo polskie

**Klaster E — pre-arrival (zapytania z zagranicy, głównie EN/ES/PT)**
- „Poland work visa from India/Bangladesh/Nepal" — osobne strony per kraj w EN (P2)
- „trabajar en Polonia — requisitos", „visto de trabalho para a Polônia" (P2)
- proces D-visa → przyjazd → karta pobytu (ścieżka klienta od zagranicy)

---

## 4. KLASTRY SŁÓW KLUCZOWYCH PER JĘZYK

⚠️ **Zastrzeżenie o danych:** nie mam dostępu do żywych wolumenów wyszukiwań. Poniższe frazy to hipotezy o wysokim prawdopodobieństwie, oparte na strukturze zapytań i publikacjach branżowych. **Przed pisaniem treści zweryfikować w Google Keyword Planner (darmowy przy koncie Google Ads) i Google Trends; po starcie — Google Search Console.** Proces cykliczny: przegląd GSC co miesiąc, Trends co miesiąc (tryb PRZEGLĄD TRENDÓW), Keyword Planner co kwartał.

### PL (cudzoziemcy rosyjsko/ukraińskojęzyczni często szukają po polsku + pracodawcy)
- karta pobytu czasowego, wniosek o kartę pobytu online, **MOS wniosek o pobyt**, **mos.cudzoziemcy.gov.pl jak złożyć**, profil zaufany dla cudzoziemca, zezwolenie na pobyt czasowy i pracę, pobyt stały, status sprawy cudzoziemca, przedłużenie karty pobytu, zmiana pracodawcy karta pobytu, zezwolenie na pracę dla cudzoziemca (B2B), oświadczenie o powierzeniu pracy 2026

### EN (Indie, Bangladesz, Nepal, Filipiny + uniwersalny)
- temporary residence card Poland, TRC Poland, karta pobytu in English, **MOS Poland residence application**, **Poland residence permit online application 2026**, work permit Poland, Poland work visa from India / Bangladesh / Nepal (strony per kraj), single permit Poland, EU Blue Card Poland, change of employer Poland TRC, PESEL number for foreigners, trusted profile (profil zaufany) for foreigners, Poland residence card status check

### ES (Ameryka Łacińska)
- tarjeta de residencia Polonia, permiso de trabajo Polonia, **solicitud de residencia Polonia online / sistema MOS**, residencia temporal Polonia requisitos, visa de trabajo Polonia para colombianos / argentinos / venezolanos (long-tail per kraj), cómo emigrar a Polonia, número PESEL, jurista de inmigración Polonia (⚠️ terminologia: **Jurista**, nie „abogado")

### PT (Brazylia)
- cartão de residência Polônia, visto de trabalho Polônia, autorização de residência temporária Polônia, **pedido de residência online Polônia MOS**, trabalhar na Polônia sendo brasileiro, PESEL Polônia, morar na Polônia

**Zasada mapowania:** 1 fraza główna = 1 URL; frazy pokrewne jako H2/FAQ na tej samej stronie. Kanibalizacji unikamy przez arkusz mapy słów kluczowych (dostarczę w Kroku 2 jako szablon .xlsx).

---

## 5. PLAN HREFLANG

**Implementacja:** Polylang Pro + Rank Math generują tagi automatycznie — poniżej specyfikacja do weryfikacji.

### Kody (Etap 1)
```html
<link rel="alternate" hreflang="pl"    href="https://kartapobytutrc.pl/karta-pobytu-czasowego/" />
<link rel="alternate" hreflang="en"    href="https://kartapobytutrc.pl/en/temporary-residence-card-poland/" />
<link rel="alternate" hreflang="es"    href="https://kartapobytutrc.pl/es/tarjeta-de-residencia-polonia/" />
<link rel="alternate" hreflang="pt"    href="https://kartapobytutrc.pl/pt/cartao-de-residencia-polonia/" />
<link rel="alternate" hreflang="x-default" href="https://kartapobytutrc.pl/en/temporary-residence-card-poland/" />
```

**Decyzje projektowe:**
1. **`x-default` → wersja EN**, nie PL — grupa docelowa to cudzoziemcy; nieznany język = angielski.
2. Kody **językowe, nie regionalne** (`es`, nie `es-CO`/`es-AR`) — jedna wersja hiszpańska obsługuje całą Amerykę Łacińską; `pt` bez `-BR` (Brazylia i tak dominuje w wynikach pt).
3. Etap 2 dodaje: `fr`, `uk` (uwaga: kod ISO ukraińskiego to **uk**, nie „ua" — częsty błąd; URL może być `/ua/`, ale hreflang musi być `uk`), `ru`.
4. Hreflang **wzajemny i kompletny**: każda wersja linkuje wszystkie pozostałe + samą siebie. Strony bez tłumaczenia nie wchodzą do zestawu (nie linkować EN do nieistniejącej strony ES).
5. Tagi w `<head>` + dodatkowo w sitemap XML (Rank Math Pro to potrafi) — redundancja zalecana przez Google.
6. **Naprawa błędów obecnej strony:** usunąć wersję indonezyjską, usunąć TranslatePress (auto-tłumaczenie = duplikacja niskiej jakości), na nowej stronie wyłącznie tłumaczenia redakcyjne.
7. Selektor języka: widoczny w nagłówku (flagi + nazwy języków w ich własnym języku: Polski / English / Español / Português), bez automatycznego przekierowania po IP (Google tego nie lubi; ewentualnie nienachalny banner sugerujący język).

### Dane strukturalne (per język)
- `LegalService` + `LocalBusiness` (NAP: ul. Fabryczna 18, 02-892 Warszawa; tel. 539 999 549) na stronie głównej i /kontakt/
- `FAQPage` na stronach usługowych i przewodnikach
- `Service` + `Offer` (ceny pakietów) na /cennik/
- `BreadcrumbList` globalnie
- Pole `dateModified` + widoczna data „Ostatnia aktualizacja / stan prawny na: [data]" na każdej treści prawnej

---

## 6. WARIANTY REALIZACJI TREŚCI ETAPU 1

| | Wariant A — budżetowy | Wariant B — optymalny ✅ | Wariant C — premium |
|---|---|---|---|
| Zakres | 17 stron kluczowych ×4 języki, klaster MOS (3 art.) | j.w. + klastry A–C w pełni + 3 strony per-kraj EN (~35 URL ×4 jęz.) | j.w. + klastry D–E kompletne (~60 URL ×4 jęz.) |
| Koszt jednorazowy* | ~4–6 tys. zł (tłumaczenia ES/PT natywne, reszta wewnętrznie z AI + redakcja) | ~9–14 tys. zł | ~20–30 tys. zł |
| Koszt miesięczny | ~0,5 tys. zł (2 art./mies.) | ~1–1,5 tys. zł (4 art./mies. + aktualizacje) | ~3 tys. zł |
| Czas do startu | 4–5 tyg. | 6–8 tyg. | 10–12 tyg. |
| Efekt (6–9 mies.) | widoczność na frazy brandowe + MOS PL | ruch organiczny na frazy MOS + TRC we 4 językach, pierwsze leady pre-arrival | pełne pokrycie long-tail, pozycja autorytetu |
| Ryzyko | zbyt mało treści, wolne indeksowanie nowych języków | umiarkowane | przeinwestowanie przed walidacją popytu |

\* przy założeniu: teksty PL/EN tworzone z Claude + redakcja prawna Dariusza; ES/PT weryfikacja przez tłumacza natywnego (~80–120 zł/strona za korektę, nie pełne tłumaczenie).

**Rekomenduję Wariant B**, ponieważ klaster MOS ma teraz okno konkurencyjne (temat świeży, konkurencja dopiero buduje treści, a intencja komercyjna jest bardzo wysoka — ludzie realnie nie umieją złożyć wniosku po polsku), a strony per-kraj EN (Indie/Bangladesz/Nepal) to najtańszy sposób dotarcia do Priorytetu 1 przy niskiej konkurencji.

---

## 7. NASTĘPNE KROKI

1. **Akceptacja sitemapy i konwencji URL** (Ty) — ewentualne korekty listy usług.
2. **Krok 2:** szablon arkusza mapy słów kluczowych (.xlsx) + weryfikacja wolumenów w Keyword Planner (potrzebne konto Google Ads — masz?).
3. **Krok 3:** instalacja WP + GeneratePress + Polylang Pro na `nowa.kartapobytutrc.pl` (noindex + hasło), konfiguracja struktury języków wg tego dokumentu.
4. **Krok 4:** treści P1 (17 stron PL) → tłumaczenia EN → ES/PT z korektą natywną.
5. Równolegle: **Regulamin gwarancji** (wymagany przed publikacją /cennik/) i decyzja RODO dla /ankieta/.

⚠️ Wszystkie treści prawne przed publikacją: weryfikacja stanu prawnego (ustawa o cudzoziemcach z uwzgl. nowelizacji MOS z 2026 r.; nowa ustawa o zatrudnianiu cudzoziemców — m.in. status testu rynku pracy do potwierdzenia). Jako asystent nie zastępuję analizy prawnika — finalna kontrola merytoryczna po Twojej stronie.
