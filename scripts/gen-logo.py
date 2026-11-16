"""Sinh path SVG cho logo «TMST» và favicon từ font Be Vietnam Pro SemiBold (woff2 do next/font tải về).

    python3 scripts/gen-logo.py .next/static/media/<file SemiBold có chữ T, M, S>.woff2

In ra JSON {t, m, vb} (path chữ T, path chữ MST, viewBox) để dán vào components/Logo.jsx.
Cần: pip install fonttools brotli
"""
import json
import sys

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

font = TTFont(sys.argv[1])
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
hmtx = font["hmtx"]
cap = font["OS/2"].sCapHeight
track = -0.01 * font["head"].unitsPerEm  # chữ hơi khít


def run(text, x):
    pen, bounds = SVGPathPen(glyphs), BoundsPen(glyphs)
    for ch in text:
        g = cmap[ord(ch)]
        glyphs[g].draw(TransformPen(pen, (1, 0, 0, -1, x, cap)))
        glyphs[g].draw(TransformPen(bounds, (1, 0, 0, -1, x, cap)))
        x += hmtx[g][0] + track
    return pen.getCommands(), bounds.bounds, x


t_path, tb, x = run("T", 0)
m_path, mb, _ = run("MST", x)
x0, y0 = min(tb[0], mb[0]), min(tb[1], mb[1])
x1, y1 = max(tb[2], mb[2]), max(tb[3], mb[3])
print(json.dumps({"t": t_path, "m": m_path, "vb": [round(x0), round(y0), round(x1 - x0), round(y1 - y0)]}))
