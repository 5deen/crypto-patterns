import { ALPHABET, mapCharacter, renderGlyph, renderPattern } from './pattern.js';

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

/** Fill the "every character becomes a shape" legend with the first six glyphs. */
function initGlyphLegend() {
  const legend = document.querySelector('[data-glyph-legend]');
  if (!legend) return;

  legend.innerHTML = Array.from(ALPHABET.slice(0, 6))
    .map((letter) => {
      const { shape } = mapCharacter(letter);
      return `
        <div class="flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-4">
          <div class="w-12">${renderGlyph(letter)}</div>
          <span class="font-mono text-lg font-bold">${letter}</span>
          <span class="text-xs tracking-wider text-gray-500 uppercase">${shape}</span>
        </div>`;
    })
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

/** The live "try it" panel. */
function initDemo() {
  const input = document.querySelector('[data-demo-input]');
  const output = document.querySelector('[data-demo-output]');
  if (!input || !output) return;

  const draw = () => {
    const phrase = input.value.trim();
    if (!phrase) {
      output.innerHTML = '<p class="py-12 text-center text-gray-400">Type a phrase to see its pattern.</p>';
      return;
    }
    output.innerHTML = renderPattern(phrase, { title: `Pattern for the phrase ${phrase}` });
  };

  input.addEventListener('input', draw);
  draw();
}

/** Count the stat figures up when they first scroll into view. */
function initCounters() {
  const counters = document.querySelectorAll('[data-count-to]');
  if (!counters.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  const animate = (element) => {
    const target = Number(element.dataset.countTo);
    const duration = 900;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out cubic, so the number settles rather than stopping dead.
      element.textContent = String(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.5 },
  );

  for (const counter of counters) observer.observe(counter);
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
initCounters();
initYear();
