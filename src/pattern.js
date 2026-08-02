/*
 * Glyph mapping and pattern rendering.
 *
 * Everything here is deterministic: the same input always produces the same
 * shape sequence and the same SVG. No Math.random(), no clock, no reliance on
 * the iteration order of an unordered collection.
 *
 * Kept free of DOM access so it can be reused and tested outside the browser —
 * the renderer returns an SVG string rather than nodes.
 */

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/** The eight shape families a glyph can map to. */
export const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'hexagon', 'cross', 'ring', 'chevron'];

/**
 * The six colours a glyph can map to, drawn from the 5deen palette.
 *
 * All six are light enough to read against the dark cell background — a
 * near-black in this list would render as an invisible glyph, which would
 * silently break the "one wrong character is visible" property the whole
 * scheme rests on. Keep that in mind before changing one.
 */
export const COLORS = [
  '#6366f1', // indigo-500
  '#ec4899', // pink-500
  '#f54905', // 5deen orange
  '#fbbf24', // amber-400
  '#34d399', // emerald-400
  '#38bdf8', // sky-400
];

/**
 * Map a single character to a { shape, color } pair.
 *
 * The letter's alphabet index picks the shape; the number of full passes
 * through the shape list picks the colour. 8 shapes x 6 colours = 48 distinct
 * cells, comfortably more than the 26 letters of the Latin alphabet, so no two
 * letters collide. Characters outside the alphabet return null and are drawn as
 * a blank cell.
 */
export function mapCharacter(character) {
  const index = ALPHABET.indexOf(character.toLowerCase());
  if (index === -1) return null;

  return {
    shape: SHAPES[index % SHAPES.length],
    color: COLORS[Math.floor(index / SHAPES.length) % COLORS.length],
  };
}

/** Map a whole string to a sequence of cells, one per character. */
export function mapText(text) {
  return Array.from(text).map(mapCharacter);
}

/**
 * Grid dimensions for a sequence of `count` cells: the squarest grid that
 * holds them all, widest side first.
 */
export function gridSize(count) {
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
  return { columns, rows: Math.max(1, Math.ceil(count / columns)) };
}

/** SVG path/element body for one shape, drawn inside a 100x100 cell. */
function shapeMarkup(shape, color) {
  switch (shape) {
    case 'circle':
      return `<circle cx="50" cy="50" r="32" fill="${color}" />`;
    case 'square':
      return `<rect x="20" y="20" width="60" height="60" rx="6" fill="${color}" />`;
    case 'triangle':
      return `<path d="M50 16 L84 80 H16 Z" fill="${color}" />`;
    case 'diamond':
      return `<path d="M50 14 L86 50 L50 86 L14 50 Z" fill="${color}" />`;
    case 'hexagon':
      return `<path d="M50 14 L81 32 V68 L50 86 L19 68 V32 Z" fill="${color}" />`;
    case 'cross':
      return `<path d="M39 16h22v23h23v22H61v23H39V61H16V39h23Z" fill="${color}" />`;
    case 'ring':
      return `<circle cx="50" cy="50" r="26" fill="none" stroke="${color}" stroke-width="14" />`;
    case 'chevron':
      return `<path d="M22 22 L50 50 L22 78 L34 86 L72 50 L34 14 Z" fill="${color}" />`;
    default:
      return '';
  }
}

/**
 * Render a sequence of cells as a standalone SVG string.
 *
 * @param {string} text          the phrase to encode
 * @param {object} [options]
 * @param {number} [options.cell]      cell size in user units (default 100)
 * @param {number} [options.gap]       gap between cells (default 10)
 * @param {string} [options.title]     accessible title for the SVG
 * @param {boolean} [options.dark]     dark cell background (default true, to
 *                                     match the site; pass false for a light
 *                                     background when rendering elsewhere)
 */
export function renderPattern(text, options = {}) {
  const { cell = 100, gap = 10, title = 'Crypto pattern', dark = true } = options;

  const cells = mapText(text);
  const { columns, rows } = gridSize(cells.length);
  const step = cell + gap;
  const width = columns * step - gap;
  const height = rows * step - gap;
  // Dark cells are slate-950 on a slate-800 hairline, so a grid sitting on a
  // slate-900 panel still reads as a grid of distinct cells.
  const cellFill = dark ? '#020617' : '#ffffff';
  const cellStroke = dark ? '#1e293b' : '#e5e7eb';

  const body = cells
    .map((mapped, i) => {
      const x = (i % columns) * step;
      const y = Math.floor(i / columns) * step;
      const backdrop = `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="12" fill="${cellFill}" stroke="${cellStroke}" />`;
      if (!mapped) return backdrop;
      return `${backdrop}<g transform="translate(${x} ${y})">${shapeMarkup(mapped.shape, mapped.color)}</g>`;
    })
    .join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"`,
    ` role="img" aria-label="${title}" class="w-full h-auto">`,
    `<title>${title}</title>`,
    body,
    '</svg>',
  ].join('');
}

/** Render a single glyph on its own — used for the legend and illustrations. */
export function renderGlyph(character, options = {}) {
  const { size = 100 } = options;
  const mapped = mapCharacter(character);
  if (!mapped) return '';

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}"`,
    ` role="img" aria-label="Glyph for the letter ${character.toUpperCase()}">`,
    shapeMarkup(mapped.shape, mapped.color),
    '</svg>',
  ].join('');
}
