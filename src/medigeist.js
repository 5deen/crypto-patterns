/*
 * Loader for the Medigeist pattern generators.
 *
 * Each library in asc-set-generator's assembly/lib is compiled to its own
 * WebAssembly build, vendored under public/medigeist/<library>/. A build is
 * fetched lazily — on first use rather than on page load — and cached, so
 * switching library downloads a build once and never again.
 *
 * Why one build per library rather than the single combined one it replaces:
 * the combined build carried all ten block libraries and weighed 1 MB no
 * matter which set you asked for. Compiled against one library, with the lib
 * file imported directly so dead-code elimination can drop the rest, a build
 * is 78–342 KB. The demo now downloads a fraction of what it did.
 *
 * The import is deliberately dynamic and marked @vite-ignore: release.js finds
 * its own .wasm with `new URL("release.wasm", import.meta.url)`, and letting
 * Vite bundle the file would rewrite that URL and break the fetch. Keeping the
 * files in public/ and loading by URL preserves the pairing, and is why every
 * library gets its own directory rather than a shared one with suffixed names.
 *
 * Everything is served from this origin, so the demo still makes no external
 * request and the phrase still never leaves the browser.
 */

/** Longest phrase the generator accepts; anything past this is ignored. */
export const GLYPH_LIMIT = 16;

/**
 * The block libraries offered by the demo, in order.
 *
 * `id` is the directory under public/medigeist and the name the library has in
 * asc-set-generator. `label` is what the picker shows.
 */
export const LIBRARIES = Array.from({ length: 10 }, (_, i) => ({
  id: `lib${i}`,
  label: `Library ${i}`,
}));

/**
 * The library the demo opens with.
 *
 * lib8 is the value of `name` in the generator's base64/config.json — the
 * library that repository is currently authoring against — and it is also the
 * smallest build, so it is the cheapest thing to load first.
 */
export const DEFAULT_LIBRARY = 'lib8';

/**
 * Every single-library build exposes exactly one image set.
 *
 * setMapsArray() in the generator names sets positionally, so the one set in a
 * single-library build is always called set0.
 */
const SET = 'set0';

/** Edge length of the square canvas, in user units. */
const RATIO = 800;

/** id -> in-flight or resolved module promise. */
const modules = new Map();

/** True when `id` names a library the demo ships. */
export function isLibrary(id) {
  return LIBRARIES.some((library) => library.id === id);
}

/**
 * Resolve one library's module, loading it on first call.
 *
 * Repeated calls for the same library share one in-flight promise, so typing
 * quickly cannot start several downloads. A failed load is not cached — the
 * next call retries.
 */
export function loadGenerator(id = DEFAULT_LIBRARY) {
  const library = isLibrary(id) ? id : DEFAULT_LIBRARY;

  if (!modules.has(library)) {
    const url = `${import.meta.env.BASE_URL}medigeist/${library}/release.js`;
    modules.set(
      library,
      import(/* @vite-ignore */ url).catch((error) => {
        modules.delete(library);
        throw error;
      }),
    );
  }

  return modules.get(library);
}

/**
 * Render `text` as a self-contained SVG document using `id`'s library.
 *
 * Deterministic: the same text and the same library always produce the same
 * document, which is what lets a pattern be re-derived and compared. Changing
 * library changes the blocks, so a pattern is only comparable against another
 * drawn from the same one. Characters the generator does not know are drawn
 * with its default block rather than rejected.
 */
export async function renderPattern(text, id = DEFAULT_LIBRARY) {
  const { createSVGDocument } = await loadGenerator(id);
  return createSVGDocument(RATIO, SET, text);
}

/** True when the phrase is longer than the generator will read. */
export function isTruncated(text) {
  return Array.from(text).length > GLYPH_LIMIT;
}
