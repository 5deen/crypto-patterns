/*
 * Loader for the Medigeist pattern generator.
 *
 * The generator is a WebAssembly build of asc-set-generator, vendored under
 * public/medigeist. It is ~1 MB, so it is fetched lazily — on the first
 * interaction with the demo rather than on page load — and only once.
 *
 * The import is deliberately dynamic and marked @vite-ignore: release.js finds
 * its own .wasm with `new URL("release.wasm", import.meta.url)`, and letting
 * Vite bundle the file would rewrite that URL and break the fetch. Keeping both
 * files in public/ and loading by URL preserves the pairing.
 *
 * Everything the generator needs is served from this origin, so the demo still
 * makes no external request and the phrase still never leaves the browser.
 */

/** Longest phrase the generator accepts; anything past this is ignored. */
export const GLYPH_LIMIT = 16;

/** The image set the demo renders with. asc-set-generator ships set0–set11. */
export const IMAGE_SET = 'set9';

/** Edge length of the square canvas, in user units. */
const RATIO = 800;

let modulePromise = null;

/**
 * Resolve the generator module, loading it on first call.
 *
 * Repeated calls share one in-flight promise, so typing quickly cannot start
 * several downloads. A failed load is not cached — the next call retries.
 */
export function loadGenerator() {
  if (!modulePromise) {
    const url = `${import.meta.env.BASE_URL}medigeist/release.js`;
    modulePromise = import(/* @vite-ignore */ url).catch((error) => {
      modulePromise = null;
      throw error;
    });
  }
  return modulePromise;
}

/**
 * Render `text` as a self-contained SVG document.
 *
 * Deterministic: the same text always produces the same document, which is what
 * lets a pattern be re-derived and compared. Characters the generator does not
 * know are drawn with its default block rather than rejected.
 */
export async function renderPattern(text) {
  const { createSVGDocument } = await loadGenerator();
  return createSVGDocument(RATIO, IMAGE_SET, text);
}

/** True when the phrase is longer than the generator will read. */
export function isTruncated(text) {
  return Array.from(text).length > GLYPH_LIMIT;
}
