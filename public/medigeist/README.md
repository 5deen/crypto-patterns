# Medigeist generators

Prebuilt WebAssembly builds of [asc-set-generator](https://github.com/5deen/asc-set-generator),
vendored so the demo has no external dependency. MIT licensed.

One directory per block library, `lib0` … `lib9`, matching the files in that
repository's `assembly/lib`. Each contains:

- `release.wasm` — the compiled AssemblyScript module
- `release.js` — the ESM binding. It resolves `release.wasm` relative to its own
  URL (`new URL("release.wasm", import.meta.url)`), so the two files must stay
  side by side. That is also why each library gets its own directory rather
  than one shared directory with suffixed filenames.

Both live under `public/` rather than `src/` on purpose: Vite copies `public/`
verbatim, which leaves that `import.meta.url` lookup intact. Bundling
`release.js` would rewrite the URL and break the fetch.

## Why one build per library

The single combined build these replace contained all ten libraries and weighed
1 MB whichever image set you asked for. Built against one library it is 78–342 KB,
and the demo only fetches the one being shown.

The saving depends entirely on importing the library file directly. The barrel
at `assembly/lib/index.ts` re-exports all ten, so `import { lib0 } from './lib'`
keeps every blob in the binary and the build stays at 1 MB — dead-code
elimination only drops the others when the import names the file.

## Rebuilding

In a checkout of asc-set-generator, for each library, replace
`assembly/imagesets.ts` with a single-library version and build to its own
output path:

```bash
for i in $(seq 0 9); do
  cat > assembly/imagesets.ts <<INNER
import { lib$i } from './lib/lib$i';
import { SetParams, setImageSets } from './utils';

export const SETS = new Map<string, SetParams>();

SETS.set("set0", new SetParams(setImageSets([lib$i])));
INNER
  npx asc assembly/index.ts --target release \
    --outFile "build/lib$i/release.wasm" \
    --textFile "build/lib$i/release.wat" --sourceMap false
done
git checkout assembly/imagesets.ts
```

Then copy each `build/lib<i>/release.js` and `release.wasm` into the matching
directory here.

`SETS.set("set0", …)` is not arbitrary. `setMapsArray()` in `assembly/maps.ts`
builds its map names positionally — `set0`, `set1`, and so on — so the single
set in a single-library build has to be `set0`, which is the name
`src/medigeist.js` passes to `createSVGDocument`.
