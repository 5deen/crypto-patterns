# Medigeist generator

Prebuilt WebAssembly build of [asc-set-generator](https://github.com/5deen/asc-set-generator),
vendored so the demo has no external dependency. MIT licensed.

One directory per block library. The demo currently ships one,
`cascading_maze_pattern`, named after its block keys — they run
`cascading_maze_pattern_000` through `_099`. Each directory contains:

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
`assembly/lib/<name>.ts`:

```bash
NAME=cascading_maze_pattern
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
The uploaded source declared its map as `lib0`; it was renamed to
`cascading_maze_pattern` throughout so the file, the binding, the build
directory and the id in `LIBRARIES` all agree.
