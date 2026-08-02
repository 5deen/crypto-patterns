# Fonts

Self-hosted webfonts for the landing page. Declared via `@font-face` in
`src/styles/main.css` and served from the site root as `/fonts/*.woff2`.

| Family | Weights | Designer | Licence |
| --- | --- | --- | --- |
| Sora | 400, 500, 600, 700 | Jonathan Barnbrook | SIL Open Font License 1.1 |
| Space Grotesk | 400, 500, 600, 700 | Florian Karsten | SIL Open Font License 1.1 |

The `.woff2` files were taken from CloudCannon's
[SendIt template](https://github.com/CloudCannon/sendit-astro-template), which is
itself MIT licensed; the fonts inside it carry the OFL, which permits
redistribution as part of a larger work.

Only the latin subset is included, and only these four weights exist as real
files — nothing in the markup should ask for 800 or heavier, or the browser will
synthesise the weight and the result looks smeared.
