# Brand assets

The Moon Light mark: a gold crescent carrying the navy **ML** monogram.

`master.png` is the raster original. Everything under `svg/` and `png/` is
**generated** from it by `build.py` — never hand-edit those files, they are
overwritten. Change the master or the script, then rebuild:

```bash
python3 assets/brand/build.py     # needs potrace, rsvg-convert, numpy, Pillow
```

The build is deterministic: same input, byte-identical output.

## Which file to use

| File                   | Use it for                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `svg/logo.svg`         | The default. Full colour, metallic crescent.                                               |
| `svg/logo-flat.svg`    | Flat gold instead of the gradient — print, embroidery, anywhere a gradient is a liability. |
| `svg/logo-mono.svg`    | One colour, taken from CSS `color`. Any background, any ink.                               |
| `svg/logo-inverse.svg` | Dark surfaces: the monogram reads light instead of navy.                                   |
| `svg/crescent.svg`     | The crescent alone — loaders, watermarks, a frame around other content.                    |
| `svg/monogram.svg`     | The **ML** alone, where the crescent would crowd the space.                                |
| `svg/favicon.svg`      | Tighter margin so the mark survives browser-tab sizes.                                     |
| `svg/sprite.svg`       | `<symbol>`s for `<use>`, so a page defines the art once.                                   |
| `png/`                 | `favicon.ico` (16–64), `apple-touch-icon.png`, `icon-192/512.png`, `logo-1024.png`.        |

Every part shares one `0 0 1024 1024` viewBox, so `crescent.svg` and
`monogram.svg` stack back into `logo.svg` exactly — no realignment.

## Using it

```html
<!-- one definition, many uses -->
<svg><use href="/brand/sprite.svg#moonlight-logo" /></svg>

<!-- one colour, inherited -->
<span style="color: var(--brand-navy)">
  <svg><use href="/brand/sprite.svg#moonlight-logo-mono" /></svg>
</span>
```

Import `tokens.css` once at the app root and the SVGs pick the palette up: every
fill is written `var(--brand-*, <fallback>)`, so they theme without being edited
and still render standalone as `<img>`.

When `apps/web` is stood up, copy or symlink this directory into
`apps/web/public/brand/` at build time. Do not keep a second edited copy.

## Rules

- **Clear space:** at least the width of the crescent's thickest point on every side.
- **Minimum size:** 32 px for the full lockup. Below that the ML fills in — use
  `crescent.svg` instead. `favicon.ico` ships 16–64 px for browser tabs.
- Do not recolour the monogram against the crescent, restretch the geometry, add
  effects, or rebuild the lockup by hand-placing the parts. They already align.

## How the split works

Colour alone will not separate the two parts: the crescent is shaded, so its
darker edge reads as "navy" too, and the L's tail crosses over the lower horn.

The crescent's outer and inner boundaries are near-perfect circles — fitted to
a median error under 1 % of the radius — so the shape is a lune with flared horn
tips. That fit does the work: shading bands hug the outer circle (median
20/40/51 px from it) while every letter stroke sits far inside it (228/234/288
px), a 4× margin that classifies them cleanly. The same lune then fills the
crescent back in where the L-tail covers it, which is why `crescent.svg` is a
whole shape rather than one with a bite taken out of it.

See `lib/segment.py` for the segmentation and `build.py` for tracing, the
gradient sampling, and assembly.
