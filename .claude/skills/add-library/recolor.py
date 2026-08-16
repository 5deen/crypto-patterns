#!/usr/bin/env python3
"""Give every block in a Medigeist library its own canvas fill.

A library whose blocks all share one `rect.canvas` fill renders as a near
uniform field: it stays perfectly deterministic, but a reader cannot see one
character change, which is the property the whole site rests on. This walks a
`medigeist-src/<binding>.ts` file, decodes each block's data URI, rewrites the
fill in its `rect.canvas` rule, and re-encodes.

The palette is taken as a *rhythm* from a reference library rather than
invented: block i keeps the reference's position within its hue, lightness and
saturation ranges, remapped into the target's own bands. Two libraries treated
this way have the same visual cadence and differ only in colour family.

Nothing but the canvas fill is touched — geometry, line colours and the
`<desc>` are left exactly as generated, so the blocks still mean what they did.

Usage:
    recolor.py TARGET.ts --reference REF.ts --hue 196 224 --light 38 77 --sat 24 52
"""

import argparse
import base64
import colorsys
import pathlib
import re

BLOCK = re.compile(r'(\.set\("[^"]+", "data:image/svg\+xml;base64,)([^"]+)(")')
CANVAS = re.compile(r'(rect\.canvas\s*\{[^}]*fill:)(#[0-9a-fA-F]{6})')


def payloads(text):
    return [m.group(2) for m in BLOCK.finditer(text)]


def canvas_hls(payload):
    svg = base64.b64decode(payload).decode('utf-8')
    found = CANVAS.search(svg)
    if not found:
        raise SystemExit('a block carries no rect.canvas fill; aborting rather than guessing')
    hexstr = found.group(2)
    r, g, b = (int(hexstr[i:i + 2], 16) / 255 for i in (1, 3, 5))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return h * 360, l * 100, s * 100


def rescale(value, source, target):
    low, high = source
    if high - low < 1e-9:
        return sum(target) / 2
    position = (value - low) / (high - low)
    return target[0] + position * (target[1] - target[0])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('target')
    ap.add_argument('--reference', required=True)
    ap.add_argument('--hue', nargs=2, type=float, required=True)
    ap.add_argument('--light', nargs=2, type=float, required=True)
    ap.add_argument('--sat', nargs=2, type=float, required=True)
    args = ap.parse_args()

    target = pathlib.Path(args.target)
    text = target.read_text(encoding='utf-8')
    reference = [canvas_hls(p) for p in payloads(pathlib.Path(args.reference).read_text(encoding='utf-8'))]
    count = len(payloads(text))
    if len(reference) != count:
        raise SystemExit(f'block counts differ: reference {len(reference)}, target {count}')

    spans = [(min(c), max(c)) for c in zip(*reference)]
    index = iter(range(count))

    def recolor(match):
        i = next(index)
        h, l, s = reference[i]
        hue = rescale(h, spans[0], tuple(args.hue))
        light = rescale(l, spans[1], tuple(args.light))
        sat = rescale(s, spans[2], tuple(args.sat))
        r, g, b = colorsys.hls_to_rgb(hue / 360, light / 100, sat / 100)
        fill = '#%02x%02x%02x' % tuple(round(v * 255) for v in (r, g, b))

        svg = base64.b64decode(match.group(2)).decode('utf-8')
        svg, hits = CANVAS.subn(lambda m: m.group(1) + fill, svg, count=1)
        if hits != 1:
            raise SystemExit(f'block {i} has no canvas fill to rewrite')
        return match.group(1) + base64.b64encode(svg.encode('utf-8')).decode('ascii') + match.group(3)

    target.write_text(BLOCK.sub(recolor, text), encoding='utf-8')

    fills = {canvas_hls(p) for p in payloads(target.read_text(encoding='utf-8'))}
    print(f'{target.name}: {count} blocks, {len(fills)} distinct canvas fills')


if __name__ == '__main__':
    main()
