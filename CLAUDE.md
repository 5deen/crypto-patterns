# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Geistgrid** is text-based design built on geometric patterns. A Geistgrid
pattern is a two- or three-dimensional grid of colored shapes, where each shape
corresponds to a glyph in the Latin alphabet.

Geistgrid is the product name, the repository name and the Pages path. They
agree today, but they are not the same thing: the Vite `base` path tracks the
**repository**, not the brand. Renaming the repo means changing `base` in the
same breath, and changing one without the other breaks every asset URL on the
deployed site.

The core flow:

1. A user enters a text phrase.
2. Each character is mapped to a geometric shape via the glyph mapping.
3. The system renders a **public** grid of those shapes — the pattern is safe to
   display, since it reveals nothing without the mapping rules.
4. Re-entering the phrase re-derives the pattern. If the character sequence
   matches the original, the regenerated pattern is identical to the one created
   when the phrase was defined. That identity check is the verification.

The site says **phrase**, never "password". The word promises storage, reset and
recovery, none of which exist here — there is no account, no server and nothing
held anywhere. Keep it out of copy and out of these notes.

Key invariant: pattern generation must be **deterministic** — the same phrase
and the same mapping rules always produce a byte-identical pattern. Any
randomness has to be seeded from the phrase, never from `Math.random()`, the
clock, or iteration order of an unordered collection.

Site copy is **US English** (`colored`, `recognizable`, `August 2, 2026`), and
every page carries `lang="en-US"`. The German address and legal terms in
`contact.html` and `privacy.html` are not translated.

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
  does `@import 'tailwindcss'`, and theme customization belongs in an
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
src/pattern.js      the original glyph mapping; no longer used by the page
src/styles/main.css Tailwind entry + @theme tokens
public/medigeist/   one vendored WASM build per block library (see its README)
medigeist-src/      AssemblyScript source for those builds; not served
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
`max-w-7xl` containers, `py-16 sm:py-20` sections, a darker band for the closing
content section, the `title` + accented-suffix heading pattern, and its
**centered** section headings and intros. Its alternating image rows are not
used, since the feature rows here carry no illustrations any more.

Section headings, section intros and the legal-page headers are centered blocks
(`mx-auto ... text-center`); body copy inside a step or a legal section is
left-aligned within its own column. A previous change flattened all of it to a
single left edge and was reverted, so leave the centering alone unless asked —
but note what that change surfaced: the hero container is `max-w-[1500px]`
rather than `max-w-7xl`, and the legal-page bodies set `mx-auto max-w-3xl` on
the body element itself. Neither shares the `max-w-7xl` grid the nav and the
sections use, which is invisible while those blocks are centered and obvious the
moment anything is left-aligned.

The **colors** are the project's own: a dark slate surface with indigo and pink
accents, plus a brand orange.

| Token | Value | Used for |
| --- | --- | --- |
| `primary` | `#818cf8` indigo-400 | accent text, borders, tinted backgrounds |
| `secondary` | `#ffffff` | contrast color on top of `primary` |
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
the browser would synthesize the weight instead. See `public/fonts/README.md`
for provenance and licensing.

## Deployment

The site is published to GitHub Pages at
<https://5deen.github.io/geistgrid/> by `.github/workflows/deploy.yml`,
which builds on every push to `main` and uploads `dist/` as a Pages artifact.
The Pages source in repository settings must be set to **GitHub Actions**, not
"Deploy from a branch".

Because a project repo is served from a subpath rather than the domain root,
`vite.config.js` sets `base: '/geistgrid/'`. Vite rewrites the absolute
URLs it owns — script and stylesheet tags, `<link rel="preload">`, and `url()`
in CSS — but **not** plain `href` attributes on anchors. So an in-site link must
be written relative (`href="./"`, `href="#demo"`); `href="/"` would silently
leave the project site and land on the user's root Pages domain. The `base`
value applies to `npm run dev` and `npm run preview` as well, so both serve from
`/geistgrid/` and match production. Renaming the repo means changing that
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

**There is one build per block library.** The demo ships three, each named
after the prefix its keys share, whose keys run `<id>_001` upwards:
`cascading_orientation_pattern_v3.12` (193 blocks),
`cascading_orientation_pattern_v3.13` (102) and
`cascading_orientation_pattern_v2.11` (193). `LIBRARIES` in `medigeist.js` is
the single list everything is built from: adding a build means adding an entry
there and nothing else. The **Image set** picker is generated from it, and hides
itself while there is only one library, since a select with one option is a
control that cannot do anything.

A library id can carry a **dot**, as all three of these do. AssemblyScript
identifiers and module filenames cannot, so the map binding and the file under
`medigeist-src/` use `_` where the id uses `.`
(`cascading_orientation_pattern_v3_12`). The id with the dot is what the
vendored directory, the `LIBRARIES` entry and the saved filename use; the
filename slug turns it into `v3-12`.

Adding and removing a library are written up as the `add-library` and
`remove-library` skills in `.claude/skills/`. They exist because the work spans
four places — the build, `public/medigeist/<id>/`, `medigeist-src/` and
`LIBRARIES` — and missing one leaves either a picker entry that 404s or a
megabyte of dead weight.

Their AssemblyScript sources live in `medigeist-src/`, outside `public/` so they
are not served. Keep them: without them a library cannot be rebuilt, and the
generator repository is a separate one this repo cannot push to.

**A library is only useful if its blocks look different from each other**, and
that is a property of the blocks rather than of the generator. `rect.canvas` is
the only fill that varies per block; the geometry is thin lines over it. As
supplied, every block in `v2.11` shared one fill (`#a7bdce`), so the library
rendered as a near-uniform field: fully deterministic, but a reader could not
see a changed character. Measured by rasterizing a phrase against the same
phrase one character off, it moved **0.6%** of pixels where `v3.12` moved 9.5%.

`v2.11` now carries 193 distinct fills and measures **9.47%**, the same as
`v3.12`, because the palette was not invented — `.claude/skills/add-library/recolor.py`
takes each block's position within the reference library's hue, lightness and
saturation ranges and remaps it into the target's own bands. The two libraries
therefore share a cadence and differ only in color family, blue against orange.
Nothing but the canvas fill is rewritten; every block's geometry, line color and
`<desc>` are byte-identical to what was supplied.

Check any new library the same way before it ships. The page's central claim is
that a wrong character is *visible*, and a library can satisfy every other
invariant while failing that one silently.

**The number is evidence, not a verdict.** `v3.13` also carries a single canvas
fill — white — and measures **2.18%**, but it ships unrecolored on purpose: it
is black line art on white, so its blocks differ by drawing rather than by
color, and the picture is legibly structured where `v2.11`'s uniform dot field
was not. Recoloring it into greys was tried and measured 6.31%, a better number
and a worse picture: mid-grey canvases sap the contrast the black lines depend
on. Read the measurement alongside the rendering, and treat a low number as a
reason to look rather than a reason to recolor.

Every single-library build exposes exactly one image set, always called `set0`,
because `setMapsArray()` in the generator names sets positionally. That name is
hard-coded in `medigeist.js`; it is not a free choice.

Six things about the generator constrain the page:

- **It reads only the first 16 characters.** Longer phrases are truncated
  silently by the generator, so the demo shows a notice past that length.
- **It is deterministic** — the same phrase and the same library give a
  byte-identical document, and one changed character changes the picture. That
  is what the page claims, and it is the reason this generator fits at all.
  Patterns are only comparable within one library.
- **A build is 1.3–1.7 MB and each render is ~150 KB of SVG.** Builds are
  fetched lazily, when the demo scrolls near or the field is focused — never on
  page load — cached per library, and keystrokes are debounced. Do not move the
  first render back to load time; the demo sits well below the fold. The size
  tracks the block count: 102 blocks land at ~1.3 MB, 193 at ~1.7 MB.
- **It runs entirely in the browser**, with every file served from this origin,
  so `privacy.html` stays true: no external request, and the phrase never leaves
  the machine.
- **Only the selected library is downloaded.** Should more libraries be added,
  do not preload them or offer a "compare all" view without rethinking this.
- **Its output carries the phrase in plain text.** Every document opens with a
  `<desc id="sequences">` listing the phrase and all its rotations. On the page
  that is inert; in a file it is not, because a file is what people send each
  other, and a document that spells out the phrase in its own metadata is not
  the safe-to-publish object the rest of the page describes. Anything that hands
  a document to the user has to take that block out first.

Both download buttons in the demo go through `toFileDocument()` in
`medigeist.js`, which does exactly two things and neither of them touches the
drawing:

- **Drops every `<desc>`**, for the reason above. Verify this after changing the
  vendored build: the point is that the phrase does not appear anywhere in the
  saved bytes, not that one particular element is gone.
- **Restates `width`/`height` as `1024`**, because the generator writes `100%`
  for both — right for a responsive panel, unusable in a standalone file, which
  has no containing box to resolve a percentage against. The `viewBox` is left
  alone, so only the intrinsic size changes.

It is string surgery rather than `DOMParser` so the module keeps working outside
a browser. It saves the document the generator returned rather than the copy in
the panel, which has picked up a `role`, an `aria-label` and layout classes that
do not belong in a file.

**Download PNG** rasterizes that same document with `toPNG()` in `main.js`: blob
URL → `Image` → `drawImage` onto a 1024² canvas → `toBlob()`. It lives in
`main.js` rather than `medigeist.js` because it needs the DOM, and that module
stays usable outside a browser. Three things hold it up:

- **The stated `width`/`height` are what make it work.** An SVG carrying the
  generator's `100%` has no intrinsic size and browsers rasterize it at a default
  box or not at all. Always hand `toPNG()` the output of `toFileDocument()`,
  never the raw generator string.
- **The canvas must stay origin-clean.** Blob URLs are same-origin and the
  document is self-contained, so `toBlob()` is allowed to return pixels. An SVG
  that referenced anything external — a font URL, an image, a `foreignObject`
  pulling in the page — would taint the canvas and break the PNG while leaving
  the SVG download working, which is a quiet way to break it.
- **PNG is a picture of the document, not the document.** Rasterizers differ
  across browsers and versions in antialiasing and color management, so the same
  phrase gives byte-different PNGs on different machines while giving
  byte-identical SVGs everywhere. Comparing by eye still works and is what the
  page asks for; comparing by hash does not. Do not present PNG as the format to
  verify with, and keep SVG the primary button.

Rasterizing costs a few hundred milliseconds and about 900 KB, so it happens on
click rather than per render. Both buttons disable while it runs, and a failure
shows `[data-demo-download-notice]` rather than leaving a button that looks like
it did nothing.

Saved files are called `geistgrid-<library>-YYYYMMDD-HHMMSS.svg`, in local time,
and are **not** named after the phrase. A filename is the most visible part of a
file — a directory listing, a share sheet and an attachment header all show it
without anyone opening anything — so naming it after the phrase would undo the
stripping above. The stamp is what keeps one save from overwriting the next.

The library segment comes from the library **id**, not the picker label: the id
is the generator's own name for the set and the directory it is vendored in,
while the label is display text somebody may reword. It is in the name because
patterns are only comparable within one library, so a saved file cannot be read
against anything without it — which is why the segment is worth carrying now,
while there is only one library to name.

Reading the clock there does not break the determinism invariant: it names the
file and never reaches the document. Save the same phrase twice and the two
files differ by their name and not by a byte inside. Keep it that way — a
timestamp *in* an SVG would make the same phrase produce two different
documents and destroy the comparison the whole scheme rests on.

Each library gets its **own directory** under `public/medigeist/`, rather than
one directory of suffixed files, because `release.js` locates its binary with
`new URL("release.wasm", import.meta.url)` — the pairing is by directory.
They live in `public/` rather than `src/` because bundling `release.js` would
rewrite that URL and break the fetch; the import in `medigeist.js` is dynamic
and `@vite-ignore`d for the same reason.

Rebuilding these is not `npm run asbuild:release`. The per-library recipe, and
the reason the lib file must be imported directly rather than through the
`assembly/lib` barrel — the barrel keeps all ten blobs and leaves the build at
1 MB — are in `public/medigeist/README.md`.

`src/pattern.js` is **no longer used by the page**. It is the original glyph
mapping and it drew the step illustrations; the last of those, the "one
character off" comparison in step three, has been removed, so nothing imports
the module and nothing bundles it. It is kept as the record of that mapping, not
as live code — `main.js` no longer touches it, and re-wiring it means deciding
what it is for.

Two things to preserve if it ever comes back. Its mapping is *not* what the demo
does, so nothing on the page may present it as the mapping: anything drawn from
it stays unlabeled rather than pairing a shape with the character it supposedly
encodes. And do not hand-write its output into the markup — the hero used to
carry a copy of `renderPattern('geometric')` transcribed cell for cell, nothing
enforced the duplication, and changing how shapes are drawn left it showing the
old style until someone noticed. Render from the module through `[data-pattern]`
instead.

Its glyphs are **outlines**: the color lives on the stroke and no shape is
filled. `ring` keeps a heavier stroke than the shared `STROKE_WIDTH` on purpose
— as a plain outline it is just a smaller `circle`, and two glyphs that look
alike weaken the "one wrong character is visible" property.

The stats band under **Built on mapping rules** used to quote four figures — 102
characters, 100 blocks, 16 characters per pattern, 240 sequences — and no longer
does. Any figure put back there is a property of the generator and of the
shipped library: read it from `glyphs()`, `glyphLimit()` or the library's entry
count rather than transcribing a number that the next vendored build silently
falsifies.

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
