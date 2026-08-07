# Medigeist generator

Prebuilt WebAssembly build of [asc-set-generator](https://github.com/5deen/asc-set-generator),
vendored so the demo has no external dependency. MIT licensed.

- `release.wasm` — the compiled AssemblyScript module
- `release.js` — the ESM binding. It resolves `release.wasm` relative to its own
  URL (`new URL("release.wasm", import.meta.url)`), so the two files must stay
  side by side.

Both live under `public/` rather than `src/` on purpose: Vite copies `public/`
verbatim, which leaves that `import.meta.url` lookup intact. Bundling
`release.js` would rewrite the URL and break the fetch.

To update, rebuild `npm run asbuild:release` in asc-set-generator and copy
`build/release.js` and `build/release.wasm` over these.
