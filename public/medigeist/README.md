# Medigeist generator

Prebuilt WebAssembly build of [asc-set-generator](https://github.com/5deen/asc-set-generator),
vendored so the demo has no external dependency. MIT licensed.

One directory per block library, named after the prefix its block keys share.
The demo ships four:

| Directory | Blocks | Keys | Build |
| --- | --- | --- | --- |
| `cascading_orientation_pattern_v3.12` | 193 | `…_001` … `_193` | ~1.7 MB |
| `cascading_orientation_pattern_v3.13` | 102 | `…_001` … `_102` | ~1.3 MB |
| `cascading_orientation_pattern_v3.14` | 128 | `…_001` … `_128` | ~1.5 MB |
| `cascading_orientation_pattern_v2.11` | 193 | `…_001` … `_193` | ~1.7 MB |

The build size tracks the block count, which is the only thing that varies
between them at this scale.

A library name can carry a dot, as these do. AssemblyScript identifiers and
module filenames cannot, so the map binding and the file under `medigeist-src/`
use `_` where the id uses `.` — `cascading_orientation_pattern_v3_12`. The id
with the dot is what the directory, `LIBRARIES` and the saved filename use.

Each directory contains:

- `release.wasm` — the compiled AssemblyScript module
- `release.js` — the ESM binding. It resolves `release.wasm` relative to its own
  URL (`new URL("release.wasm", import.meta.url)`), so the two files must stay
  side by side. That is also why each library gets its own directory rather
  than one shared directory with suffixed filenames.

Both live under `public/` rather than `src/` on purpose: Vite copies `public/`
verbatim, which leaves that `import.meta.url` lookup intact. Bundling
`release.js` would rewrite the URL and break the fetch.

The AssemblyScript source each build is compiled from is kept in
`medigeist-src/` at the repository root — deliberately outside `public/`, which
is served verbatim and would ship the source to every visitor for nothing.

## Rebuilding

A build carries one library. The lib file must be imported **directly**; the
barrel at `assembly/lib/index.ts` re-exports every library the generator ships,
which defeats dead-code elimination and leaves the build at 1 MB whatever set
you asked for.

In a checkout of asc-set-generator, with the library source copied into
`assembly/lib/<binding>.ts`:

```bash
NAME=cascading_orientation_pattern_v3_12
cat > assembly/imagesets.ts <<INNER
import { $NAME } from './lib/$NAME';
import { SetParams, setImageSets } from './utils';

export const SETS = new Map<string, SetParams>();

SETS.set("set0", new SetParams(setImageSets([$NAME])));
INNER
npx asc assembly/index.ts --target release \
  --outFile "build/$NAME/release.wasm" \
  --textFile "build/$NAME/release.wat" --sourceMap false
git checkout assembly/imagesets.ts
```

Then copy `release.js` and `release.wasm` into a directory of that name here,
and add the library to `LIBRARIES` in `src/medigeist.js`.

`SETS.set("set0", …)` is not arbitrary. `setMapsArray()` in `assembly/maps.ts`
builds its map names positionally — `set0`, `set1`, and so on — so the single
set in a single-library build has to be `set0`, which is the name
`src/medigeist.js` passes to `createSVGDocument`.

The map binding inside the source file must match the name used in the import.
The uploaded sources declared their map as `lib0` — `base64/config.json` in the
generator repository holds that name under its `name` key, and it changes — so
each was renamed to its own binding throughout, leaving the file, the binding
and the id in `LIBRARIES` in agreement.

Rename it **anchored to the statement forms**, `^export const lib0\b` and
`^lib0\.set\(`. A bare search-and-replace also hits `lib0` inside the base64
payloads, which corrupts block images while still building cleanly.

`--sourceMap false` writes a stray file literally named `false` beside the
output; delete it and `release.wat`, neither of which is vendored.

Adding or removing a library end to end is written up as the `add-library` and
`remove-library` skills under `.claude/skills/`.
