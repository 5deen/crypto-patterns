---
name: add-library
description: Add a Medigeist block library to the Geistgrid demo from an AssemblyScript .ts lib file (a `export const libN = new Map<string,string>()` of base64 block images). Use when the user supplies or points at such a file and wants it available in the Try it yourself image set picker. Covers deriving the library name, building the WASM, vendoring it, and registering it.
---

# Add a block library

Turns one uploaded `lib*.ts` file into a library the demo can select. Every step
below is load-bearing; skipping the build and hand-editing `LIBRARIES` produces
a picker entry that 404s at runtime.

## 1. Read the file and derive the name

The file looks like:

```ts
export const lib0 = new Map<string, string>();
lib0.set("cascading_orientation_pattern_v3.12_001", "data:image/svg+xml;base64,…");
```

The **library id** is the prefix every key shares, minus the trailing `_NNN`:
`cascading_orientation_pattern_v3.12` above. Derive it, and assert that *every*
key starts with it — a file whose keys disagree is not one library and must be
rejected rather than guessed at:

```bash
grep -o 'lib[0-9]*\.set("[^"]*"' FILE | sed 's/.*set("//; s/"$//' | sed 's/_[0-9]*$//' | sort -u
```

One line out means one library. More than one means stop and ask.

The **binding** is the id with `.` replaced by `_`
(`cascading_orientation_pattern_v3_12`). AssemblyScript identifiers and module
filenames cannot carry a dot, so the id and the binding differ whenever the name
carries a version number. The id — with the dot — is what the directory, the
`LIBRARIES` entry and the saved filename use.

`base64/config.json` in asc-set-generator holds the `name` the export takes when
these files are generated (`lib8` today). Do not rely on it being `lib0`: match
whatever the file declares.

## 2. Rename the map binding

Rewrite `libN` to the binding, **anchored to the statement forms only**:

```python
out = re.sub(r'^export const libN\b', f'export const {binding}', text, flags=re.M)
out = re.sub(r'^libN\.set\(', f'{binding}.set(', out, flags=re.M)
```

Never a bare string replace: `lib0` occurs inside the base64 payloads, and
replacing those corrupts block images silently — the build still succeeds and
the pictures come out wrong.

## 3. Build

Clone `https://github.com/5deen/asc-set-generator` (shallow is fine) and
`npm install`. Then, with the renamed source copied to
`assembly/lib/<binding>.ts`:

```bash
cat > assembly/imagesets.ts <<INNER
// image selection
import { $BINDING } from './lib/$BINDING';
import { SetParams, setImageSets } from './utils';

export const SETS = new Map<string, SetParams>();

SETS.set("set0", new SetParams(setImageSets([$BINDING])));
INNER
npx asc assembly/index.ts --target release \
  --outFile "build/$ID/release.wasm" \
  --textFile "build/$ID/release.wat" --sourceMap false
git checkout assembly/imagesets.ts
```

Import the lib file **directly**, never through the `assembly/lib` barrel: the
barrel re-exports all ten libraries, defeats dead-code elimination, and leaves
the build at 1 MB whatever was asked for.

`SETS.set("set0", …)` is not a free choice. `setMapsArray()` names sets
positionally, so the single set in a single-library build is always `set0`,
which is the name `src/medigeist.js` passes to `createSVGDocument`.

`--sourceMap false` writes a stray file literally named `false` next to the
output. Delete it, along with `release.wat`; neither is vendored.

## 4. Vendor into the app

```
public/medigeist/<id>/release.js
public/medigeist/<id>/release.wasm
medigeist-src/<binding>.ts        # the renamed source, for rebuilding later
```

One directory per library, and the two build files must sit side by side:
`release.js` finds its binary with `new URL("release.wasm", import.meta.url)`.
They live under `public/` because Vite copies it verbatim; bundling `release.js`
would rewrite that URL and break the fetch.

`medigeist-src/` is outside `public/` on purpose — it is the rebuild source, not
something to serve to visitors.

## 5. Register it

Add one entry to `LIBRARIES` in `src/medigeist.js`:

```js
{ id: 'cascading_orientation_pattern_v3.12', label: 'Cascading orientation v3.12' },
```

That is the only code change. The picker is generated from this list and reveals
itself once there is more than one entry; the first entry is the default.

## 6. Verify before reporting done

Do not skip this — a wrong build fails silently and looks fine in the markup.

1. `npm run build`, then `npx vite preview`.
2. In a browser: the picker offers the new label, selecting it fetches
   `/<id>/release.wasm` **and nothing else**, a pattern draws, and a download is
   named after the library.
3. The generator agrees about itself: `setNames()` returns `['set0']`, and
   `createSVGDocument(800, 'set0', 'x')` called twice returns identical strings.
4. **Check the pictures actually differ.** Render one phrase and the same phrase
   with one character changed, rasterize both to a canvas and compare pixels. A
   library whose blocks share a single canvas fill can be fully deterministic and
   still look like a uniform field — around 0.6% of pixels changing rather than
   ~9%. That breaks the "one wrong character is visible" claim the whole page
   rests on, so report the number rather than shipping it silently.

## 7. Update the docs in the same change

- `public/medigeist/README.md` — the list of shipped libraries.
- `CLAUDE.md` — the library list, and the build size if it moved.
- `privacy.html` only if something about requests changed. Adding a vendored
  library does not change it: everything is still served from this origin.
