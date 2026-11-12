# Kombi-Planer

3D-Konfigurator für Schweizer Schalter- und Steckdosen-Kombinationen: Unterputz, Aufputz, NUP und NAP, Steckdosen T13 bis T25, im Browser als fotorealistisches Bild mit Stückliste.

Unabhängiges Planungswerkzeug, nicht von Feller, Hager oder ABB. Marken- und Produktnamen gehören den jeweiligen Herstellern.

## Aufbau

- `src/` – Quelltext (Geometrie, Katalog, Bauteile, Bildberechnung, Oberfläche)
- `build.js` – setzt alles zu einer einzigen Seite zusammen
- `docs/` – die fertige Website; diesen Ordner liefert GitHub Pages aus

## Bauen und testen

```bash
node build.js
```

```bash
node dev/serve.js
```

Danach läuft die Seite unter `http://localhost:4173/site/`.
