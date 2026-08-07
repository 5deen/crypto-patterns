# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

`crypto-patterns` is a text encryption method built on geometric patterns. A
crypto pattern is a two- or three-dimensional grid of coloured shapes, where each
shape corresponds to a glyph in the Latin alphabet.

The core flow:

1. A user enters a text password.
2. Each character is mapped to a geometric shape via the glyph mapping.
3. The system renders a **public** grid of those shapes — the pattern is safe to
   display, since it reveals nothing without the mapping rules.
4. Re-entering the password re-derives the pattern. If the character sequence
   matches the original, the regenerated pattern is identical to the one created
   when the password was defined. That identity check is the verification.

Key invariant: pattern generation must be **deterministic** — the same password
and the same mapping rules always produce a byte-identical pattern. Any
randomness has to be seeded from the password, never from `Math.random()`, the
clock, or iteration order of an unordered collection.

## Commands

```bash
npm install      # install dependencies
npm run dev      # Vite dev server with HMR
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

There is no test runner wired up yet. If you add one, add the script here.

## Stack

- **Vite 8** — dev server and bundler, ESM (`"type": "module"`).
- **Tailwind CSS 4** — via the `@tailwindcss/vite` plugin. Tailwind v4 is
  configured **in CSS**, not in a `tailwind.config.js`: `src/styles/main.css`
  does `@import 'tailwindcss'`, and theme customisation belongs in an
  `@theme { ... }` block in that file.
- Vanilla JavaScript — no framework. Keep it that way unless asked.

## Layout

```
index.html          Vite entry HTML; the landing page markup lives here
privacy.html        GDPR privacy policy
contact.html        contact details / controller identification
signup.html         beta list — links out to an Airtable form
signin.html         states plainly that accounts are not open yet
src/config.js       AIRTABLE_BETA_FORM_URL, the one value to fill in
src/main.js         entry point — wires the page up to the generators
src/medigeist.js    loader for the WASM generator that drives the demo
src/pattern.js      the original glyph mapping; now decorative only
src/styles/main.css Tailwind entry + @theme tokens
public/medigeist/   vendored release.js + release.wasm (see its README)
public/             copied to the build root as-is (favicon, fonts)
vite.config.js      Tailwind plugin + the GitHub Pages `base` path
.github/workflows/  GitHub Actions; deploy.yml publishes to Pages
prompts.md          the task prompts driving this repo's development
```

`index.html` at the repo root is the Vite entry — Vite resolves `/src/...` paths
in it against the project root, so keep those absolute-from-root. Anything in
`public/` is referenced from the root instead (`/favicon.svg`, `/fonts/*.woff2`).

The **layout** comes from CloudCannon's MIT-licensed
[SendIt](https://github.com/CloudCannon/sendit-astro-template) template —
`max-w-7xl` containers, `py-16 sm:py-20` sections, alternating feature rows, a
darker band for the closing content section, and the `title` + accented-suffix
heading pattern.

The **colours** are the project's own: a dark slate surface with indigo and pink
accents, plus a brand orange.

| Token | Value | Used for |
| --- | --- | --- |
| `primary` | `#818cf8` indigo-400 | accent text, borders, tinted backgrounds |
| `secondary` | `#ffffff` | contrast colour on top of `primary` |
| `link` | `#ec4899` pink-500 | the far end of the gradient |
| `brand` | `#f54905` | the orange in the logo |

Neutrals use Tailwind's own slate scale: `slate-950` page, `slate-900` panels,
`slate-800` hairlines, `slate-200`/`slate-300`/`slate-400` text, white headings
(set in `@layer base`, so a utility on the element still wins).

Reach for the token names rather than hex values. Two contrast constraints are
load-bearing and easy to undo by accident:

- `primary` is indigo-**400**, not indigo-500. As text on a `slate-900` panel
  indigo-500 measures 3.99:1, under the 4.5:1 WCAG AA floor.
- Button *fills* therefore use `bg-indigo-600` in the markup, not `bg-primary`,
  so their white labels pass. White on indigo-500 is 4.47:1 — also just short.
- Do not drop below `slate-400` for body or caption text on a panel;
  `slate-500` measures 3.69:1 at the sizes used here.

`.gradient-text` (in `main.css`) is the indigo→pink clip used on the accented
word in section headings.

Both fonts are self-hosted from `public/fonts` — the page makes no external
requests at all, so it works offline and behind a strict network policy. Only
weights 400–700 exist as files, so do **not** use `font-extrabold` or heavier:
the browser would synthesise the weight instead. See `public/fonts/README.md`
for provenance and licensing.

## Deployment

The site is published to GitHub Pages at
<https://5deen.github.io/crypto-patterns/> by `.github/workflows/deploy.yml`,
which builds on every push to `main` and uploads `dist/` as a Pages artifact.
The Pages source in repository settings must be set to **GitHub Actions**, not
"Deploy from a branch".

Because a project repo is served from a subpath rather than the domain root,
`vite.config.js` sets `base: '/crypto-patterns/'`. Vite rewrites the absolute
URLs it owns — script and stylesheet tags, `<link rel="preload">`, and `url()`
in CSS — but **not** plain `href` attributes on anchors. So an in-site link must
be written relative (`href="./"`, `href="#demo"`); `href="/"` would silently
leave the project site and land on the user's root Pages domain. The `base`
value applies to `npm run dev` and `npm run preview` as well, so both serve from
`/crypto-patterns/` and match production. Renaming the repo means changing that
one line.

## Legal pages

`privacy.html` and `contact.html` are plain static pages in the same SendIt
style. Two things about them are load-bearing:

- **Each page is a separate Vite entry.** Vite only discovers `index.html` by
  itself, so any new page has to be added to `build.rollupOptions.input` in
  `vite.config.js` or it is silently missing from `dist/`.
- **The privacy policy makes factual claims about the site**: no cookies, no
  analytics, no external requests, nothing in `localStorage`/`sessionStorage`,
  and the demo phrase never leaving the browser. Adding an embed, a CDN asset,
  a font service, an analytics snippet or a form would falsify one of them.
  If you add anything of that kind, update `privacy.html` in the same change.

There is no shared layout — the header and footer markup is duplicated across
all five pages. Editing navigation means editing all five. Sub-page links back
into the landing page's sections are written `./#demo`, since those anchors do
not exist on the sub-page itself.

## The beta list

There is no login and no backend. `signup.html` **links** to an Airtable form;
`signin.html` says accounts are not open. Three constraints hold this together:

- **Never use the Airtable API from this site.** It needs a token, and on a
  static site the token ships inside the JS bundle — published to a public repo
  and a public site, handing anyone read/write on the base. The shared form URL
  in `src/config.js` is not a credential: it accepts submissions and exposes
  nothing else.
- **Link the form, never embed it.** An `<iframe>` would make every visitor's
  browser call `airtable.com` on page load, disclosing their IP to a third
  party whether or not they sign up, and falsifying the "no external requests"
  claim in `privacy.html`. A verification script asserts that loading
  `signup.html` produces zero requests to Airtable.
- **Do not gate the demo.** Pattern generation runs client-side, so a login in
  front of it hides a button rather than protecting anything. Making the gate
  real would mean sending the phrase to a server, which section 3 of the
  privacy policy says never happens.

With `AIRTABLE_BETA_FORM_URL` empty, the button is disabled and a visible
notice explains what is missing — an unconfigured deploy says so rather than
offering a link to nowhere.

## The pattern generator

The demo under **Try it** runs [Medigeist](https://github.com/5deen/asc-set-generator),
an AssemblyScript program compiled to WebAssembly. `src/medigeist.js` wraps it;
`createSVGDocument(ratio, set, text)` returns a complete, self-contained SVG.

Four things about it constrain the page:

- **It reads only the first 16 characters.** Longer phrases are truncated
  silently by the generator, so the demo shows a notice past that length.
- **It is deterministic** — the same phrase gives a byte-identical document, and
  one changed character changes the picture. That is what the page claims, and
  it is the reason this generator fits at all.
- **The module is ~1 MB and each render is ~130 KB of SVG.** It is therefore
  fetched lazily, when the demo scrolls near or the field is focused — never on
  page load — and keystrokes are debounced. Do not move the first render back to
  load time; the demo sits well below the fold.
- **It runs entirely in the browser**, with both files served from this origin,
  so `privacy.html` stays true: no external request, and the phrase never leaves
  the machine.

`release.js` and `release.wasm` live in `public/medigeist/` rather than `src/`
because `release.js` locates its binary with `new URL("release.wasm",
import.meta.url)`. Bundling it would rewrite that URL and break the fetch. The
import in `medigeist.js` is dynamic and `@vite-ignore`d for the same reason.

`src/pattern.js` is still used, but only for decoration — the hero image, the
step illustrations and the "one character off" comparison. Its mapping is *not*
what the demo does, so nothing on the page may present it as the mapping. The
step-one illustration deliberately carries no character labels for that reason.

The four figures in the stats band — 102 characters, 12 image sets, 16
characters per pattern, 240 sequences — are properties of the generator, read
from `glyphs()`, `setNames()` and `glyphLimit()`. If the vendored build changes,
re-read them rather than assuming.

## Conventions

- Two-space indent, single quotes, semicolons in JS.
- Prefer Tailwind utility classes in markup over hand-written CSS. Reach for
  `src/styles/main.css` only for `@theme` tokens and genuine one-offs.
- Keep the glyph mapping and pattern-generation logic free of DOM access so it
  stays testable and reusable outside the browser.
- `COLORS` in `src/pattern.js` must stay light enough to read against the dark
  cell. A near-black entry renders an invisible glyph. The page no longer quotes
  its length as a statistic, so the count itself is free.

## Notes

- `prompts.md` holds the numbered prompts this project is built from. Work is
  requested as "run prompt N" — read that file for the actual task.
- Despite the name, this is a pattern/visual-encoding scheme, not a vetted
  cryptographic primitive. Do not describe it as secure encryption, and do not
  substitute it for a real cipher.
