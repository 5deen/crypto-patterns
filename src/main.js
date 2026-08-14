import { ALPHABET, renderGlyph, renderPattern } from './pattern.js';
import {
  DEFAULT_LIBRARY,
  GLYPH_LIMIT,
  LIBRARIES,
  isTruncated,
  loadGenerator,
  renderPattern as renderMedigeist,
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
 * Fill the step-one illustration with sample blocks.
 *
 * Decorative only. It deliberately carries no character labels: the demo is
 * driven by the Medigeist generator, whose mapping is not this one, and
 * labelling these shapes with letters would assert a correspondence that does
 * not hold.
 */
function initGlyphLegend() {
  const legend = document.querySelector('[data-glyph-legend]');
  if (!legend) return;

  legend.innerHTML = Array.from(ALPHABET.slice(0, 6))
    .map(
      (letter) => `
        <div class="flex items-center justify-center rounded-xl border border-slate-800 p-6" aria-hidden="true">
          <div class="w-12">${renderGlyph(letter)}</div>
        </div>`,
    )
    .join('');
}

/** Render every static [data-pattern] placeholder from its phrase. */
function initStaticPatterns() {
  for (const node of document.querySelectorAll('[data-pattern]')) {
    node.innerHTML = renderPattern(node.dataset.pattern, {
      title: node.dataset.patternTitle || `Pattern for ${node.dataset.pattern}`,
    });
  }
}

/**
 * The live "try it" panel, driven by the Medigeist generator.
 *
 * Three things this has to get right:
 *
 * - The generator is ~1 MB of WebAssembly. It is fetched on first interaction,
 *   not on page load, so it never delays the landing page.
 * - Each render is ~130 KB of SVG and takes tens of milliseconds, so keystrokes
 *   are debounced rather than rendering per character.
 * - Renders can finish out of order. Each one carries a token and a stale
 *   result is discarded, so the grid always matches what is in the field.
 */
function initDemo() {
  const input = document.querySelector('[data-demo-input]');
  const output = document.querySelector('[data-demo-output]');
  const notice = document.querySelector('[data-demo-notice]');
  const picker = document.querySelector('[data-demo-library]');
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

  const draw = async () => {
    const phrase = input.value.trim();
    const mine = ++token;

    if (notice) {
      notice.hidden = !isTruncated(phrase);
    }

    if (!phrase) {
      message('Type a phrase to see its pattern.');
      return;
    }

    try {
      const svg = await renderMedigeist(phrase, library());
      if (mine !== token) return; // a newer phrase or library is already rendering
      output.innerHTML = svg;
      const el = output.querySelector('svg');
      if (el) {
        el.setAttribute('role', 'img');
        el.setAttribute('aria-label', `Pattern for the phrase ${phrase}`);
        el.classList.add('h-auto', 'w-full', 'rounded-xl');
      }
    } catch (error) {
      if (mine !== token) return;
      message('The pattern generator could not be loaded. Reload the page to try again.');
      console.error(error);
    }
  };

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
initGlyphLegend();
initStaticPatterns();
initDemo();
initBetaForm();
initYear();
