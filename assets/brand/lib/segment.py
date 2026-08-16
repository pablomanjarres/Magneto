"""Segment the Magneto logo into its crescent and monogram parts.

The artwork is a gold crescent -- a lune of two fitted circles, with flared horn
tips -- carrying a navy "ML" monogram whose L-tail crosses over the lower horn.

Colour alone will not split them: the crescent is shaded, so its darker edge
reads as "navy" too. Those shading bands are told apart from the letters by how
far they sit from the fitted outer circle: the rim components hug it (median
|d1-R1| of 20/40/51 px) while every letter stroke is far inside it (228/234/288
px), which is a 4x margin.
"""
import numpy as np
import masks as lib
from PIL import Image

C1 = np.array([773.27, 488.56]); R1 = 442.63     # outer circle
C2 = np.array([862.49, 446.05]); R2 = 382.04     # inner circle
RIM_MAX = 120.0                                  # px from the outer arc
EDGE = 6                                         # gold outline width on letters


def disk(r):
    y, x = np.mgrid[-r:r + 1, -r:r + 1]
    return (x * x + y * y) <= r * r


def dilate(m, r):
    out = np.zeros_like(m)
    h, w = m.shape
    for dy, dx in np.argwhere(disk(r)) - r:
        ys0, ys1 = max(0, dy), min(h, h + dy)
        xs0, xs1 = max(0, dx), min(w, w + dx)
        out[ys0:ys1, xs0:xs1] |= m[ys0 - dy:ys1 - dy, xs0 - dx:xs1 - dx]
    return out


def erode(m, r):
    return ~dilate(~m, r)


def close(m, r):
    return erode(dilate(m, r), r)


def open_(m, r):
    return dilate(erode(m, r), r)


def cusps():
    """Where the two circles meet -- the base of each horn. Lower one first."""
    dc = C2 - C1
    d = np.linalg.norm(dc)
    a = (d * d + R1 * R1 - R2 * R2) / (2 * d)
    h = np.sqrt(R1 * R1 - a * a)
    p = C1 + a * dc / d
    perp = np.array([-dc[1], dc[0]]) / d
    return sorted([p + h * perp, p - h * perp], key=lambda q: -q[1])


def _line(length, deg):
    th = np.radians(deg)
    pts = {(int(round(t * np.sin(th))), int(round(t * np.cos(th))))
           for t in np.linspace(-length / 2, length / 2, length * 2)}
    return np.array(sorted(pts))


def _shift_or(m, offs):
    out = np.zeros_like(m)
    h, w = m.shape
    for dy, dx in offs:
        ys0, ys1 = max(0, dy), min(h, h + dy)
        xs0, xs1 = max(0, dx), min(w, w + dx)
        out[ys0:ys1, xs0:xs1] |= m[ys0 - dy:ys1 - dy, xs0 - dx:xs1 - dx]
    return out


def dclose(m, length, deg):
    """Closing with a line structuring element, so only gaps along `deg` fill."""
    off = _line(length, deg)
    return ~_shift_or(~_shift_or(m, off), -off)


def largest(m):
    lab, n = lib.label(m)
    return lab == lib.stats(lab, n)[0]["id"]


def keep_above(m, area):
    lab, n = lib.label(m)
    return np.isin(lab, [r["id"] for r in lib.stats(lab, n) if r["area"] > area])


def segment():
    a = lib.load()
    ink, navy, gold, lum = lib.masks(a)
    ink = close(ink, 2)
    H, W = ink.shape
    yy, xx = np.mgrid[0:H, 0:W]
    d1 = np.hypot(xx - C1[0], yy - C1[1])
    d2 = np.hypot(xx - C2[0], yy - C2[1])
    lune = (d1 <= R1 - 2) & (d2 >= R2 + 2)

    # --- navy: crescent shading rim vs monogram strokes ---
    lab, n = lib.label(navy)
    letters_navy = np.zeros_like(navy)
    rim_navy = np.zeros_like(navy)
    for r in lib.stats(lab, n):
        if r["area"] < 300:
            continue
        m = lab == r["id"]
        (letters_navy if np.median(np.abs(d1[m] - R1)) >= RIM_MAX else rim_navy)[m] = True
    specks = navy & ~letters_navy & ~rim_navy
    letters_navy |= specks & dilate(letters_navy, 8)
    rim_navy |= specks & ~dilate(letters_navy, 8)

    # --- monogram keeps its own gold outline ---
    letters = close(dilate(letters_navy, EDGE) & ink, 3)
    letters = keep_above(letters, 400)

    # --- crescent: the rest, with the lune restoring what the L-tail covers ---
    crescent = close((ink & ~letters) | lune, 4)
    # The L-tail's gold outline cuts a notch across the lower horn. Close it
    # along the horn's own axis -- an isotropic close of that reach fattens the
    # taper -- and only near the lower cusp, so the rest of the shape is intact.
    cusp = cusps()[0]
    near_horn = np.hypot(xx - cusp[0], yy - cusp[1]) < 150
    crescent |= dclose(crescent, 56, -30) & near_horn
    crescent = largest(open_(crescent, 3))

    return dict(a=a, ink=ink, navy=navy, gold=gold, lum=lum, lune=lune,
                crescent=crescent, letters=letters, letters_navy=letters_navy,
                rim_navy=rim_navy, d1=d1, d2=d2, H=H, W=W)
