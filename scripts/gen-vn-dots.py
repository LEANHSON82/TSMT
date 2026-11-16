#!/usr/bin/env python3
"""Tạo public/vn-dots-plain.svg (bản đồ Việt Nam dạng chấm) và lib/vn-map-points.js (vị trí 34 tỉnh/thành)
cho components/VnDotMap.jsx.

Nguồn đường viền: Natural Earth 1:50m (public domain) qua gói world-atlas:
  curl -L -o countries-50m.json https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json
  python3 scripts/gen-vn-dots.py countries-50m.json

Natural Earth KHÔNG gán quần đảo Hoàng Sa, Trường Sa cho Việt Nam — script tự thêm chấm theo toạ độ
các đảo chính. Bản đồ Việt Nam đăng công khai phải thể hiện hai quần đảo này.
"""
import json, math, sys, pathlib

STEP = 0.21          # khoảng cách lưới (độ vĩ)
R = 1.7              # bán kính chấm (đơn vị SVG)
PX = 20              # đơn vị SVG trên 1 độ
LAT0 = 16            # vĩ độ chuẩn cho phép chiếu (co kinh độ theo cos)

data = json.load(open(sys.argv[1]))
sx, sy = data['transform']['scale']; tx, ty = data['transform']['translate']

def arc(i):
    rev = i < 0; a = data['arcs'][~i if rev else i]
    x = y = 0; pts = []
    for dx, dy in a:
        x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
    return pts[::-1] if rev else pts

def ring(ids):
    pts = []
    for i in ids:
        p = arc(i); pts.extend(p[1:] if pts else p)
    return pts

geom = next(g for g in data['objects']['countries']['geometries'] if g['properties']['name'] == 'Vietnam')
polys = [[ring(r) for r in poly] for poly in geom['arcs']]

def inside(lon, lat, poly):
    c = False
    for rg in poly:
        for (x1, y1), (x2, y2) in zip(rg, rg[1:] + rg[:1]):
            if (y1 > lat) != (y2 > lat) and lon < (x2 - x1) * (lat - y1) / (y2 - y1) + x1:
                c = not c
    return c

k = math.cos(math.radians(LAT0))
step_lon = STEP / k
dots = []
lat = 23.5
while lat > 8.3:
    row = round((23.5 - lat) / STEP)
    lon = 102.0 + (step_lon / 2 if row % 2 else 0)   # so le hàng
    while lon < 110:
        if any(inside(lon, lat, p) for p in polys):
            dots.append((lon, lat))
        lon += step_lon
    lat -= STEP

# Hoàng Sa, Trường Sa: các đảo chính (kinh độ, vĩ độ)
ISLANDS = [
    (111.62, 16.83), (112.33, 16.83), (112.73, 16.67), (111.20, 16.53), (112.00, 16.45),
    (111.75, 16.07), (112.62, 16.20), (111.50, 15.80),                         # Hoàng Sa
    (114.28, 11.05), (114.36, 10.38), (114.48, 10.18), (113.85, 10.95), (114.95, 10.10),
    (115.20, 9.90), (114.10, 9.65), (113.20, 9.20), (114.60, 9.10), (112.88, 8.65),
    (114.92, 8.85), (113.80, 8.20), (114.50, 11.45), (115.45, 10.60),           # Trường Sa
]
dots += ISLANDS

def proj(lon, lat):
    return ((lon - 102.0) * k * PX, (23.6 - lat) * PX)

xs = [proj(*d)[0] for d in dots]; ys = [proj(*d)[1] for d in dots]
W = math.ceil(max(xs) + R + 2); H = math.ceil(max(ys) + R + 2)
d_main = ''.join(f'M{x:.1f} {y:.1f}h0' for x, y in (proj(*p) for p in dots))
root = pathlib.Path(__file__).resolve().parent.parent
# Nền cho bản đồ đánh dấu tỉnh (components/VnDotMap.jsx).
plain = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
    + f'<path d="{d_main}" stroke="#1446a0" stroke-width="{R*2}" stroke-linecap="round" opacity=".3"/>'
    + '</svg>\n'
)
(root / 'public' / 'vn-dots-plain.svg').write_text(plain)
print(f'{len(dots)} chấm, {W}x{H}, {len(plain)} byte → public/vn-dots-plain.svg')

# Trung tâm hành chính 34 tỉnh/thành (đơn vị hành chính từ 7/2025) — (kinh độ, vĩ độ), mã theo danh mục.
PROVINCES = {
    '01': (105.85, 21.03), '04': (106.26, 22.67), '08': (105.21, 21.82), '10': (104.87, 21.72),
    '11': (103.02, 21.39), '12': (103.46, 22.40), '14': (103.91, 21.33), '19': (105.84, 21.59),
    '20': (106.76, 21.85), '22': (107.08, 20.95), '24': (106.20, 21.27), '25': (105.40, 21.32),
    '31': (106.68, 20.86), '33': (106.05, 20.65), '37': (105.97, 20.25), '38': (105.78, 19.81),
    '40': (105.68, 18.67), '42': (105.90, 18.34), '45': (106.60, 17.47), '46': (107.59, 16.46),
    '48': (108.22, 16.07), '51': (108.80, 15.12), '52': (109.22, 13.78), '56': (109.19, 12.24),
    '66': (108.04, 12.67), '68': (108.44, 11.94), '75': (106.82, 10.95), '79': (106.70, 10.78),
    '80': (106.41, 10.54), '86': (105.97, 10.25), '87': (106.36, 10.36), '89': (105.08, 10.01),
    '92': (105.78, 10.03), '96': (105.15, 9.18),
}
pts = {code: proj(*ll) for code, ll in PROVINCES.items()}
# Mảng [mã, x%, y%] — viết đúng định dạng Prettier (số không có 0 thừa) để sinh lại không làm lệch format.
num = lambda v: repr(round(v, 2))
lines = ',\n'.join(
    f"    ['{c}', {num(x / W * 100)}, {num(y / H * 100)}]" for c, (x, y) in sorted(pts.items())
)
(root / 'lib' / 'vn-map-points.js').write_text(
    '// SINH TỰ ĐỘNG bằng scripts/gen-vn-dots.py — không sửa tay.\n'
    '// Vị trí trung tâm hành chính từng tỉnh/thành trên bản đồ chấm, theo % chiều rộng / chiều cao ảnh.\n'
    f'export const MAP_WIDTH = {W};\nexport const MAP_HEIGHT = {H};\n'
    f'export const PROVINCE_POINTS = Object.fromEntries(\n  [\n{lines},\n  ].map(([code, x, y]) => [code, [x, y]]),\n);\n'
)
print('vn-dots-plain.svg + lib/vn-map-points.js')
