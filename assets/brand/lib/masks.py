"""Ink/colour masks and run-based connected components (numpy only, no scipy)."""
import pathlib
import numpy as np
from PIL import Image

SRC = str(pathlib.Path(__file__).resolve().parent.parent / "master.png")


def load(path=SRC):
    return np.asarray(Image.open(path).convert("RGB")).astype(np.int16)


def masks(a):
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    lum = 0.299 * R + 0.587 * G + 0.114 * B
    sat = a.max(2) - a.min(2)
    bg = (sat < 14) & (lum > 228)
    ink = ~bg
    navy = ink & (lum < 105)
    gold = ink & ~navy
    return ink, navy, gold, lum


class UF:
    def __init__(self):
        self.p = []

    def new(self):
        self.p.append(len(self.p))
        return len(self.p) - 1

    def find(self, x):
        p = self.p
        while p[x] != x:
            p[x] = p[p[x]]
            x = p[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.p[max(ra, rb)] = min(ra, rb)


def label(mask):
    """8-connected labelling via row runs + union-find. Returns int32 label image (0=bg)."""
    h, w = mask.shape
    uf = UF()
    runs_prev = []
    out = np.zeros((h, w), np.int32)
    row_runs = []
    for y in range(h):
        row = mask[y]
        d = np.diff(np.concatenate(([0], row.view(np.int8), [0])))
        starts = np.nonzero(d == 1)[0]
        ends = np.nonzero(d == -1)[0]  # exclusive
        runs = []
        for s, e in zip(starts, ends):
            lbl = None
            for ps, pe, pl in runs_prev:
                if ps <= e and s <= pe:  # 8-connectivity overlap (inclusive corners)
                    if lbl is None:
                        lbl = uf.find(pl)
                    else:
                        uf.union(lbl, pl)
                        lbl = uf.find(lbl)
                elif ps > e:
                    break
            if lbl is None:
                lbl = uf.new()
            runs.append((s, e - 1, lbl))
        row_runs.append(runs)
        runs_prev = runs
    # resolve
    remap, nxt = {}, 1
    for y, runs in enumerate(row_runs):
        for s, e, l in runs:
            r = uf.find(l)
            if r not in remap:
                remap[r] = nxt
                nxt += 1
            out[y, s : e + 1] = remap[r]
    return out, nxt - 1


def stats(lab, n):
    res = []
    for i in range(1, n + 1):
        m = lab == i
        area = int(m.sum())
        if area == 0:
            continue
        ys, xs = np.nonzero(m)
        res.append(
            dict(id=i, area=area, x0=int(xs.min()), x1=int(xs.max()), y0=int(ys.min()), y1=int(ys.max()))
        )
    res.sort(key=lambda r: -r["area"])
    return res
