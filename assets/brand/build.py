#!/usr/bin/env python3
"""Build the Moon Light brand assets from the raster master.

    python3 assets/brand/build.py

Reads `master.png`, splits it into the crescent and the "ML" monogram (see
lib/segment.py), traces each part to Bezier curves with potrace, and writes the
SVG family plus the raster app icons. Every file under svg/ and png/ is
generated -- edit this script, never the output.

Requires: potrace, rsvg-convert, python3 with numpy + Pillow.
"""
import pathlib
import re
import subprocess
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent / "lib"))
import segment as seg  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent
SVG, PNG = ROOT / "svg", ROOT / "png"
TMP = ROOT / ".build"

VIEW = 1024          # square viewBox for every asset
MARGIN = 44          # padding around the full lockup, in viewBox units

NAVY = "#070F18"
NAVY_SOFT = "#16223A"
GOLD = "#C89341"     # flat brand gold, the mid of the metallic ramp
GOLD_EDGE = "#E8C88B"  # the hairline outline carried by the monogram
EDGE_PX = 5.5        # its half-width, measured off the master
PAPER = "#F7F7F7"


# --------------------------------------------------------------------------
# potrace
# --------------------------------------------------------------------------
NUM = re.compile(r"[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?")


def trace(mask, turd=40):
    """Trace a boolean mask; return subpaths as lists of absolute segments."""
    TMP.mkdir(exist_ok=True)
    pbm, out = TMP / "in.pbm", TMP / "out.svg"
    Image.fromarray(np.where(mask, 0, 255).astype(np.uint8)).convert("1").save(pbm)
    subprocess.run(
        ["potrace", "-b", "svg", "-t", str(turd), "-a", "1.2", "-O", "0.35",
         str(pbm), "-o", str(out)],
        check=True,
    )
    svg = out.read_text()
    tx, ty, sx, sy = (float(v) for v in NUM.findall(
        re.search(r'transform="translate\(([^)]*)\) scale\(([^)]*)\)"', svg).group(0)))
    subpaths = []
    for d in re.findall(r'<path d="([^"]+)"', svg):
        subpaths += _parse(d)
    return [[_apply(s, tx, ty, sx, sy) for s in sp] for sp in subpaths]


def _parse(d):
    """potrace emits M / c / l / z. Return subpaths of absolute segments."""
    toks = re.findall(r"[MmCcLlZzHhVv]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?", d)
    subpaths, cur, i, x, y, start = [], [], 0, 0.0, 0.0, (0.0, 0.0)
    cmd = None
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t
            i += 1
            continue
        rel = cmd.islower()
        c = cmd.upper()
        if c == "M":
            x, y = (float(toks[i]) + (x if rel else 0), float(toks[i + 1]) + (y if rel else 0))
            i += 2
            if cur:
                subpaths.append(cur)
            cur, start = [("M", x, y)], (x, y)
            cmd = "l" if rel else "L"
        elif c == "L":
            nx, ny = (float(toks[i]) + (x if rel else 0), float(toks[i + 1]) + (y if rel else 0))
            i += 2
            cur.append(("L", nx, ny))
            x, y = nx, ny
        elif c == "C":
            v = [float(k) for k in toks[i:i + 6]]
            i += 6
            if rel:
                v = [v[0] + x, v[1] + y, v[2] + x, v[3] + y, v[4] + x, v[5] + y]
            cur.append(("C", *v))
            x, y = v[4], v[5]
        elif c == "Z":
            i += 1
            cur.append(("Z",))
            x, y = start
        else:
            i += 1
    if cur:
        subpaths.append(cur)
    return subpaths


def _apply(s, tx, ty, sx, sy):
    f = lambda x, y: (tx + sx * x, ty + sy * y)  # noqa: E731
    if s[0] == "Z":
        return s
    if s[0] in ("M", "L"):
        return (s[0], *f(s[1], s[2]))
    return ("C", *f(s[1], s[2]), *f(s[3], s[4]), *f(s[5], s[6]))


def bbox(paths):
    pts = [(s[i], s[i + 1]) for sp in paths for s in sp if s[0] != "Z"
           for i in range(1, len(s), 2)]
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def fit(all_paths, view=VIEW, margin=MARGIN):
    """Uniform transform putting `all_paths` centred inside a square viewBox."""
    x0, y0, x1, y1 = bbox(all_paths)
    k = (view - 2 * margin) / max(x1 - x0, y1 - y0)
    ox = (view - (x1 - x0) * k) / 2 - x0 * k
    oy = (view - (y1 - y0) * k) / 2 - y0 * k
    return lambda x, y: (x * k + ox, y * k + oy), k, (ox, oy)


def emit(paths, xf, nd=2):
    out = []
    for sp in paths:
        for s in sp:
            if s[0] == "Z":
                out.append("Z")
            elif s[0] in ("M", "L"):
                out.append(f"{s[0]}{_p(xf(s[1], s[2]), nd)}")
            else:
                a, b, c = xf(s[1], s[2]), xf(s[3], s[4]), xf(s[5], s[6])
                out.append(f"C{_p(a, nd)} {_p(b, nd)} {_p(c, nd)}")
    return "".join(out)


def _p(pt, nd):
    return f"{round(pt[0], nd):g},{round(pt[1], nd):g}"


# --------------------------------------------------------------------------
# metallic gradient, sampled from the master
# --------------------------------------------------------------------------
# Bin edges in px under the outer arc: tight where the metal turns fast (the
# dark rim line and the highlight just inside it), loose across the body.
BINS = [0, 3, 6, 9, 12, 16, 20, 25, 30, 38, 48, 60, 74, 88, 100, 110, 120, 132, 145, 162]


INNER_BINS = [0, 3, 6, 10, 15, 21, 28, 36]
INNER_REACH = 36     # px the inner-edge highlight carries before it dies out
INNER_ALPHA = 0.35   # how strongly it sits over the body ramp


def _profile(s):
    """Left-arc crescent pixels: colour, depth under R1, height above R2.

    Only the left arc -- averaging all the way round mixes the thin horns in and
    washes the gold out -- and eroded, so antialiased pixels do not bleach it.
    """
    m = seg.erode(s["crescent"], 4) & ~s["letters"]
    ys, xs = np.nonzero(m)
    ang = (np.degrees(np.arctan2(ys - seg.C1[1], xs - seg.C1[0])) + 360) % 360
    sel = (ang > 110) & (ang < 250)
    return s["a"][m][sel], (seg.R1 - s["d1"][m])[sel], (s["d2"][m] - seg.R2)[sel]


PUNCH_SAT = 1.28     # the master's sheen also varies with angle, which averaging
PUNCH_CON = 1.34     # flattens out; these restore the chroma and contrast lost


def _punch(c, mean):
    g = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
    c = g + (np.asarray(c) - g) * PUNCH_SAT          # chroma about its own grey
    c = mean + (c - mean) * PUNCH_CON                # contrast about the ramp
    return np.clip(c, 0, 255)


def _hex(c):
    return "#%02X%02X%02X" % tuple(int(round(v)) for v in c)


def _rgb(h):
    return [int(h[i:i + 2], 16) for i in (1, 3, 5)]


def _lum(h):
    r, g, b = _rgb(h)
    return 0.299 * r + 0.587 * g + 0.114 * b


def _chroma(h):
    c = _rgb(h)
    return max(c) - min(c)


def gold_stops(s):
    """The body ramp: a radial gradient about the OUTER circle.

    Depth under that circle only parameterises the band cleanly because the band
    is bounded by it; where the crescent is thin the deep stops are simply never
    reached, so the whole measured ramp can be used.
    """
    px, depth, _ = _profile(s)
    raw = []
    for lo, hi in zip(BINS, BINS[1:]):
        k = (depth >= lo) & (depth < hi)
        if k.sum() >= 150:
            raw.append(((seg.R1 - (lo + hi) / 2) / seg.R1, px[k].mean(0)))
    mean = np.mean([c for _, c in raw], axis=0)
    stops = sorted((o, _hex(_punch(c, mean))) for o, c in raw)
    return [(0.4, stops[0][1])] + stops + [(1.0, stops[-1][1])]


def inner_stops(s):
    """The highlight along the INNER edge: a radial gradient about circle 2.

    Its width is constant along that edge, which only holds when the gradient is
    concentric with it; opacity carries it out over `INNER_REACH` px.
    """
    px, _, height = _profile(s)
    rb = seg.R2 + INNER_REACH
    raw = [(lo, hi, px[(height >= lo) & (height < hi)])
           for lo, hi in zip(INNER_BINS, INNER_BINS[1:])]
    raw = [(lo, hi, p) for lo, hi, p in raw if len(p) >= 150]
    mean = np.mean([p.mean(0) for _, _, p in raw], axis=0)
    stops = []
    for lo, hi, p in raw:
        mid = (lo + hi) / 2
        a = max(0.0, INNER_ALPHA * (1.0 - (mid / INNER_REACH) ** 1.1))
        stops.append(((seg.R2 + mid) / rb, _hex(_punch(p.mean(0), mean)), a))
    stops.sort()
    return [(seg.R2 / rb, stops[0][1], INNER_ALPHA)] + stops + [(1.0, stops[-1][1], 0.0)], rb


# --------------------------------------------------------------------------
# SVG assembly
# --------------------------------------------------------------------------
HEAD = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {v} {v}" '
        'width="{v}" height="{v}" role="img" aria-label="{label}">')


def svg(body, label, defs=""):
    d = f"<defs>{defs}</defs>" if defs else ""
    return HEAD.format(v=VIEW, label=label) + d + body + "</svg>\n"


def write(name, text):
    (SVG / name).write_text(text)
    return SVG / name


def main():
    for d in (SVG, PNG, TMP):
        d.mkdir(parents=True, exist_ok=True)
    print("segmenting master.png ...")
    s = seg.segment()

    print("tracing ...")
    cres = trace(s["crescent"])
    core = trace(seg.close(seg.keep_above(s["letters_navy"], 400), 2))
    xf, k, _ = fit(cres + core)

    d_cres = emit(cres, xf)
    d_core = emit(core, xf)
    # The monogram's gold hairline is a uniform 5.5px offset of the glyph, so it
    # is a stroke, not a second traced shape: paint-order puts it behind the
    # fill, leaving exactly that much gold showing outside each stroke.
    sw = f"{2 * EDGE_PX * k:.1f}"

    # Two radial gradients in the paths' own user space: the body about the
    # outer circle, the edge highlight about the inner one.
    cx1, cy1 = xf(*seg.C1)
    cx2, cy2 = xf(*seg.C2)
    body = "".join(f'<stop offset="{o:.4f}" stop-color="{c}"/>' for o, c in gold_stops(s))
    ist, rb = inner_stops(s)
    edge = "".join(f'<stop offset="{o:.4f}" stop-color="{c}" stop-opacity="{a:.2f}"/>'
                   for o, c, a in ist)
    grad = (f'<radialGradient id="mgBody" gradientUnits="userSpaceOnUse" '
            f'cx="{cx1:.1f}" cy="{cy1:.1f}" r="{seg.R1 * k:.1f}">{body}</radialGradient>'
            f'<radialGradient id="mgEdge" gradientUnits="userSpaceOnUse" '
            f'cx="{cx2:.1f}" cy="{cy2:.1f}" r="{rb * k:.1f}">{edge}</radialGradient>')

    def cres_p(fill, d=None):
        return f'<path d="{d or d_cres}" fill="{fill}" fill-rule="evenodd"/>'

    def mono_p(edge, ink, d=None):
        return (f'<path d="{d or d_core}" fill="{ink}" fill-rule="evenodd" '
                f'stroke="{edge}" stroke-width="{sw}" stroke-linejoin="round" '
                f'paint-order="stroke"/>')

    var = lambda n, fb: f"var(--brand-{n}, {fb})"  # noqa: E731
    GE, NV = var("gold-edge", GOLD_EDGE), var("navy", NAVY)

    # --- the family -------------------------------------------------------
    metal = cres_p("url(#mgBody)") + cres_p("url(#mgEdge)")
    write("logo.svg", svg(metal + mono_p(GE, NV), "Moon Light", grad))
    write("logo-flat.svg", svg(cres_p(var("gold", GOLD)) + mono_p(GE, NV), "Moon Light"))

    # one colour, inherited from CSS: works on any background
    write("logo-mono.svg", svg(
        cres_p("currentColor") + mono_p("currentColor", "currentColor"), "Moon Light"))

    write("crescent.svg", svg(cres_p(var("gold", GOLD)), "Moon Light crescent"))
    write("monogram.svg", svg(mono_p(GE, NV), "Moon Light monogram ML"))

    # for dark surfaces: the glyph reads light instead of navy
    write("logo-inverse.svg", svg(
        cres_p(var("gold", GOLD)) + mono_p(GE, var("paper", PAPER)), "Moon Light"))

    # favicon: same art, less margin so it survives 16px
    xf2, k2, _ = fit(cres + core, margin=8)
    sw2 = f"{2 * EDGE_PX * k2:.1f}"
    write("favicon.svg", svg(
        cres_p(GOLD, emit(cres, xf2))
        + f'<path d="{emit(core, xf2)}" fill="{NAVY}" fill-rule="evenodd" '
          f'stroke="{GOLD_EDGE}" stroke-width="{sw2}" stroke-linejoin="round" '
          f'paint-order="stroke"/>', "Moon Light"))

    # sprite: one definition, referenced by <use href="sprite.svg#moonlight-*">
    write("sprite.svg",
          '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">'
          f'<defs>{grad}</defs>'
          f'<symbol id="moonlight-logo" viewBox="0 0 {VIEW} {VIEW}">'
          f'{metal}{mono_p(GOLD_EDGE, NAVY)}</symbol>'
          f'<symbol id="moonlight-logo-mono" viewBox="0 0 {VIEW} {VIEW}">'
          f'{cres_p("currentColor")}{mono_p("currentColor", "currentColor")}</symbol>'
          f'<symbol id="moonlight-crescent" viewBox="0 0 {VIEW} {VIEW}">'
          f'{cres_p("currentColor")}</symbol>'
          f'<symbol id="moonlight-monogram" viewBox="0 0 {VIEW} {VIEW}">'
          f'{mono_p("currentColor", "currentColor")}</symbol>'
          "</svg>\n")

    # --- design tokens, from the very same ramp ---------------------------
    ramp = gold_stops(s)
    # Body tones only: drop the held end stops and the near-black rim line, then
    # require some chroma so the light token is gold rather than off-white.
    body = [t for t in ramp if 0.60 < t[0] < 0.98]
    lit = [t for t in body if _chroma(t[1]) >= 60] or body
    (ROOT / "tokens.css").write_text(
        "/* GENERATED by assets/brand/build.py -- do not edit.\n"
        "   Sampled from master.png; the SVGs in ./svg read these back through\n"
        "   var(--brand-*, <fallback>), so importing this file themes them. */\n\n"
        ":root {\n"
        "  /* ink */\n"
        f"  --brand-navy: {NAVY.lower()};\n"
        f"  --brand-navy-soft: {NAVY_SOFT.lower()};\n\n"
        "  /* metal: the crescent's ramp, outer edge inward */\n"
        f"  --brand-gold-rim: {ramp[-1][1].lower()};\n"
        f"  --brand-gold-deep: {min(body, key=lambda t: _lum(t[1]))[1].lower()};\n"
        f"  --brand-gold: {GOLD.lower()};\n"
        f"  --brand-gold-edge: {GOLD_EDGE.lower()};\n"
        f"  --brand-gold-light: {max(lit, key=lambda t: _lum(t[1]))[1].lower()};\n\n"
        "  /* surface */\n"
        f"  --brand-paper: {PAPER.lower()};\n"
        "}\n")

    # --- rasters ----------------------------------------------------------
    print("rendering png ...")
    for name, size, src in (
        ("icon-192.png", 192, "favicon.svg"),
        ("icon-512.png", 512, "favicon.svg"),
        ("apple-touch-icon.png", 180, "favicon.svg"),
        ("logo-1024.png", 1024, "logo.svg"),
    ):
        subprocess.run(["rsvg-convert", "-w", str(size), "-h", str(size),
                        str(SVG / src), "-o", str(PNG / name)], check=True)

    ico = [Image.open(PNG / "icon-512.png").convert("RGBA").resize((n, n), Image.LANCZOS)
           for n in (16, 32, 48, 64)]
    ico[0].save(PNG / "favicon.ico", sizes=[(i.width, i.height) for i in ico],
                append_images=ico[1:])

    for f in sorted(SVG.iterdir()):
        print(f"  {f.name:22} {f.stat().st_size / 1024:6.1f} KB")
    for f in sorted(PNG.iterdir()):
        print(f"  {f.name:22} {f.stat().st_size / 1024:6.1f} KB")


if __name__ == "__main__":
    main()
