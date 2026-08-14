/*
 * Loader for the Medigeist pattern generators.
 *
 * Each library in asc-set-generator's assembly/lib is compiled to its own
 * WebAssembly build, vendored under public/medigeist/<library>/. A build is
 * fetched lazily — on first use rather than on page load — and cached, so
 * switching library downloads a build once and never again.
 *
 * A build carries one library and nothing else. The lib file is imported
 * directly rather than through the `assembly/lib` barrel, so dead-code
 * elimination can drop every other library the generator ships; through the
 * barrel every build keeps all of them and lands at 1 MB regardless.
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
 * the generator — taken from the block keys, which run `<id>_000` upwards.
 * `label` is what the picker shows.
 *
 * The demo ships one library today. Everything downstream is written for a
 * list, so adding a build means adding an entry here and nothing else: the
 * picker is generated from this, and appears only once there is a choice to
 * make.
 */
export const LIBRARIES = [
  { id: 'cascading_maze_pattern', label: 'Cascading maze' },
];

/** The library the demo opens with. */
export const DEFAULT_LIBRARY = LIBRARIES[0].id;

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

/** Edge length, in pixels, stated on a document saved to a file. */
export const DOWNLOAD_SIZE = 1024;

/**
 * The document prepared for saving to a file.
 *
 * Two changes, and the drawing is not one of them — every element that paints
 * anything is left exactly as the generator emitted it.
 *
 * **The description is dropped.** Each document opens with a
 * `<desc id="sequences">` holding the phrase in plain text and every rotation
 * of it. On the page that is inert; in a file it is not, because the file is
 * the thing people send to each other, and the whole premise is that a pattern
 * can be shown without giving up what produced it. A saved document that spells
 * out the phrase in its own metadata breaks that promise for anyone who opens
 * it in a text editor.
 *
 * **The size is stated.** The generator writes `width="100%" height="100%"` on
 * the root, which is what the responsive panel wants and what a standalone file
 * cannot use: a viewer opening the file has no containing box to resolve a
 * percentage against, and different tools guess differently. The `viewBox` is
 * left alone, so only the intrinsic size changes.
 *
 * String surgery rather than DOMParser on purpose: this module stays free of
 * DOM access so it can be used outside a browser.
 */
export function toFileDocument(svg, size = DOWNLOAD_SIZE) {
  return svg
    .replace(/<desc\b[^>]*>[\s\S]*?<\/desc>/g, '')
    .replace(
      /<svg\b[^>]*>/,
      (tag) => `<svg width="${size}" height="${size}"${tag.slice(4).replace(/\s(?:width|height)="[^"]*"/g, '')}`,
    );
}

/** True when the phrase is longer than the generator will read. */
export function isTruncated(text) {
  return Array.from(text).length > GLYPH_LIMIT;
}
