import {
  DEFAULT_LIBRARY,
  DOWNLOAD_SIZE,
  LIBRARIES,
  isTruncated,
  loadGenerator,
  renderPattern as renderMedigeist,
  toFileDocument,
} from './medigeist.js';
import { AIRTABLE_BETA_FORM_URL } from './config.js';

/** Mobile navigation toggle. */
function initNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.querySelector('[data-nav-menu]');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    menu.classList.toggle('hidden', open);
  });

  menu.addEventListener('click', (event) => {
    if (!event.target.closest('a')) return;
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.add('hidden');
  });
}

/**
 * The name a saved pattern is offered under:
 * `geistgrid-<library>-<YYYYMMDD>-<HHMMSS>.<extension>`.
 *
 * The name deliberately says nothing about the phrase. Naming the file after
 * what was typed would put the phrase back on the outside of a document we just
 * took it out of — and in the more visible place of the two, since a filename
 * shows up in a directory listing, a share sheet and an attachment header
 * without anyone opening anything.
 *
 * The **library** is in the name because patterns are only comparable within
 * one: the same phrase drawn from another block set is a different picture, so
 * a saved file cannot be read against anything without knowing which set drew
 * it. It comes from the library id — the generator's own name for it, and the
 * directory it is vendored in — rather than the picker label, which is display
 * text somebody may reword.
 *
 * The local-time stamp separates one save from the next: it sorts
 * chronologically, survives every filesystem, and tells the reader when they
 * saved rather than what they typed. Two saves inside the same second still
 * collide, and the browser resolves that by suffixing a number.
 *
 * The clock is read for the *name* only. It never reaches the document, which
 * stays a pure function of the phrase and the library — save the same phrase
 * twice and the two files differ by their name and not by a byte inside.
 */
function filename(library, extension, now = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  const slug = String(library).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  return `geistgrid-${slug || 'pattern'}-${date}-${time}.${extension}`;
}

/**
 * Rasterize a document to a PNG blob of `size` square, in the browser.
 *
 * The document is loaded as an image from a blob URL and painted onto a canvas.
 * Both are same-origin and the document is self-contained — no external
 * reference, no `foreignObject` — so the canvas stays origin-clean and
 * `toBlob()` is allowed to return pixels.
 *
 * This depends on `toFileDocument()` having stated real dimensions: an SVG
 * carrying the generator's `width="100%" height="100%"` has no intrinsic size,
 * and browsers rasterize it at a default box or not at all. Pass it the same
 * document the SVG button saves, never the raw generator output.
 *
 * PNG is a picture of the document, not the document. Rasterizers differ across
 * browsers and versions in antialiasing and color management, so the same phrase
 * gives byte-different PNGs on different machines while giving byte-identical
 * SVGs everywhere. Comparing by eye still works, which is what the page asks
 * for; comparing by hash does not.
 */
async function toPNG(svg, size = DOWNLOAD_SIZE) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));

  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('The pattern could not be loaded for rasterizing.'));
      image.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas.getContext('2d').drawImage(image, 0, 0, size, size);

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('The canvas produced no PNG.'))),
        'image/png',
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * The live "try it" panel, driven by the Medigeist generator.
 *
 * Four things this has to get right:
 *
 * - The generator is ~1 MB of WebAssembly. It is fetched on first interaction,
 *   not on page load, so it never delays the landing page.
 * - Each render is ~130 KB of SVG and takes tens of milliseconds, so keystrokes
 *   are debounced rather than rendering per character.
 * - Renders can finish out of order. Each one carries a token and a stale
 *   result is discarded, so the grid always matches what is in the field.
 * - The downloads offer the document the generator returned, not the one in the
 *   panel: the displayed copy has been given a role, a label and layout classes
 *   for the page, none of which belong in a saved file.
 */
function initDemo() {
  const input = document.querySelector('[data-demo-input]');
  const output = document.querySelector('[data-demo-output]');
  const notice = document.querySelector('[data-demo-notice]');
  const picker = document.querySelector('[data-demo-library]');
  const download = document.querySelector('[data-demo-download]');
  const downloadPNG = document.querySelector('[data-demo-download-png]');
  const downloadNotice = document.querySelector('[data-demo-download-notice]');
  if (!input || !output) return;

  /*
   * Fill the picker from the library list rather than duplicating it in the
   * markup, so adding a build in medigeist.js is the only edit needed.
   *
   * The field ships hidden and is revealed only when there is more than one
   * library. A select offering a single option is a control that cannot do
   * anything, and it invites the reader to look for a choice that is not there.
   */
  if (picker) {
    picker.innerHTML = LIBRARIES.map(
      (library) => `<option value="${library.id}">${library.label}</option>`,
    ).join('');
    picker.value = DEFAULT_LIBRARY;

    const field = picker.closest('[data-demo-library-field]');
    if (field) field.hidden = LIBRARIES.length < 2;
  }

  const library = () => (picker ? picker.value : DEFAULT_LIBRARY);

  const message = (text) => {
    output.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'py-12 text-center text-slate-400';
    p.textContent = text;
    output.append(p);
  };

  let token = 0;
  let timer = null;

  /* The document last drawn, as the generator returned it, with the library
   * that drew it, or null while there is nothing to save. The button follows
   * it, so it can never hand over a pattern for a phrase that is no longer in
   * the field. The library is carried rather than read from the picker at click
   * time, so the name can only ever say what actually drew the document. */
  let saved = null;
  const offer = (svg, id) => {
    saved = svg ? { svg, library: id } : null;
    for (const button of [download, downloadPNG]) {
      if (button) button.disabled = !saved;
    }
  };

  const draw = async () => {
    const phrase = input.value.trim();
    const mine = ++token;

    if (notice) {
      notice.hidden = !isTruncated(phrase);
    }

    if (!phrase) {
      offer(null);
      message('Type a phrase to see its pattern.');
      return;
    }

    try {
      const id = library();
      const svg = await renderMedigeist(phrase, id);
      if (mine !== token) return; // a newer phrase or library is already rendering
      output.innerHTML = svg;
      offer(svg, id);
      const el = output.querySelector('svg');
      if (el) {
        el.setAttribute('role', 'img');
        el.setAttribute('aria-label', `Pattern for the phrase ${phrase}`);
        el.classList.add('h-auto', 'w-full', 'rounded-xl');
      }
    } catch (error) {
      if (mine !== token) return;
      offer(null);
      message('The pattern generator could not be loaded. Reload the page to try again.');
      console.error(error);
    }
  };

  /*
   * Save the pattern as a file, without leaving the machine.
   *
   * The blob is built here and handed straight to the browser, so saving makes
   * no request and the phrase stays local — the same promise the rest of the
   * demo makes. toFileDocument() takes the phrase back out of the document, so
   * the file carries the picture and not what drew it. The object URL outlives
   * the click deliberately: revoking it in the same tick can cancel the save
   * before the browser has read the blob.
   */
  const save = (blob, extension) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename(saved.library, extension);
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (download) {
    download.addEventListener('click', () => {
      if (!saved) return;
      save(new Blob([toFileDocument(saved.svg)], { type: 'image/svg+xml' }), 'svg');
    });
  }

  /*
   * The PNG is rasterized on demand rather than kept alongside every render.
   * It costs a few hundred milliseconds and about 900 KB, and most visitors
   * never ask for one, so producing it per keystroke would be waste.
   *
   * Both buttons go down while it runs — the click is not instant, and a second
   * click mid-rasterize would start a parallel one. A failure re-enables them
   * and says so rather than leaving a button that looks like it did nothing;
   * the SVG path is unaffected by it.
   */
  if (downloadPNG) {
    downloadPNG.addEventListener('click', async () => {
      if (!saved || downloadPNG.disabled) return;

      const { svg } = saved;
      downloadPNG.disabled = true;
      if (download) download.disabled = true;
      if (downloadNotice) downloadNotice.hidden = true;

      try {
        save(await toPNG(toFileDocument(svg)), 'png');
      } catch (error) {
        if (downloadNotice) downloadNotice.hidden = false;
        console.error(error);
      } finally {
        // Re-enable against what is on screen now, not what was there on click.
        offer(saved && saved.svg, saved && saved.library);
      }
    });
  }

  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(draw, 200);
  });

  /*
   * Switching library redraws at once — there are no keystrokes to debounce.
   * A library not fetched yet has to download first, so say so rather than
   * leaving the previous pattern up looking like nothing happened.
   */
  if (picker) {
    picker.addEventListener('change', () => {
      clearTimeout(timer);
      offer(null); // the drawn pattern belongs to the library being left
      message('Drawing the pattern…');
      draw();
    });
  }

  /*
   * Hold the first render until the panel is actually approached.
   *
   * The field ships with a phrase in it, so rendering on load would pull the
   * ~1 MB module into the critical path — the demo sits well below the fold and
   * most visitors never reach it. Whichever comes first, scrolling near the
   * panel or focusing the field, starts the fetch; by the time the section is
   * on screen the pattern is usually already drawn.
   */
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    message('Drawing the pattern…');
    draw();
  };

  input.addEventListener('focus', start, { once: true });
  if (picker) picker.addEventListener('focus', start, { once: true });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.disconnect();
          start();
        }
      },
      // Begin a little before the panel arrives, so the download overlaps the scroll.
      { rootMargin: '400px' },
    );
    observer.observe(output.closest('section') || output);
  } else {
    start();
  }

  message('The pattern appears here.');
}

/**
 * Point the beta button at the Airtable form, once one is configured.
 *
 * The button ships disabled with a visible "not connected" notice beside it, so
 * an unconfigured deploy shows an honest message rather than a link to nowhere.
 * `noopener noreferrer` keeps the new tab from reaching back into this one and
 * stops the referrer — which would name this site — going to Airtable.
 */
function initBetaForm() {
  const link = document.querySelector('[data-beta-form]');
  const notice = document.querySelector('[data-beta-unconfigured]');
  if (!link) return;

  if (!AIRTABLE_BETA_FORM_URL) return;

  link.href = AIRTABLE_BETA_FORM_URL;
  link.removeAttribute('aria-disabled');
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  if (notice) notice.hidden = true;
}

/** Keep the footer copyright year current. */
function initYear() {
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
}

initNav();
initDemo();
initBetaForm();
initYear();
