# Skole i billeder

Visuelle, interaktive undervisningssider på dansk, udgivet med GitHub Pages.

```
index.html          forsiden med en dør til hvert fag
biologi/            "Biologi i billeder" (hub: biologi/index.html)
matematik/          "Differentialregning i billeder" (hub: matematik/index.html, fælles diff.css + diff.js)
.github/workflows/  udgiver siden ved hvert push til main
```

## Sådan tilføjes en ny side

Hver side er én selvstændig HTML-fil. Ingen build, ingen afhængigheder ud over Google Fonts.

1. **Læg filen i fagets mappe**, fx `biologi/mitokondriet.html`. Filnavn: små bogstaver, bindestreger, æ/ø/å skrevet som ae/oe/aa (fx `kvaelstof.html`).
2. **Siden skal være et fuldt dokument** (`<!doctype html>`, `<html lang="da">`, `<head>` med `<title>`) og have et tilbage-link: `<a class="back" href="index.html">← Alle emner</a>`.
3. **Tilføj et kort i fagets hub** ved at indsætte én linje i `TOPICS`-arrayet i `index.html`:
   - Biologi: `{ no, chapter, file, title, text, symbol, color }`. `no` er bogens kapitelnummer, `chapter` grupperer kortene, `color` er `--c` (grøn), `--n` (blå) eller `--p` (orange). Ekstra-sider bruger `eyebrow: 'Ekstra'` i stedet for `no`.
   - Matematik: `{ stage, no, file, title, text, icon }`. Ikonet defineres i `ICONS` samme sted.
4. **Nyt fag?** Lav en ny mappe med sin egen `index.html` (med `<a class="back" href="../">← Forside</a>`), tilføj en dør på forsiden. Workflowet udgiver automatisk alle mapper.

Links mellem sider er altid relative (`index.html`, `glykolyse.html`), så alt virker både lokalt og på GitHub Pages.
