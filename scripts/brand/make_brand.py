#!/usr/bin/env python3
"""Generate the TraceType brand SVGs (logo with outlined letters, favicon, mascot).

Dev tool, not part of the build. Needs fonttools and the IBM Plex Mono font files
(SIL Open Font License, so outlining the glyphs into a logo is allowed):

    pip install fonttools
    python3 scripts/brand/make_brand.py <IBMPlexMono-SemiBold.ttf> <IBMPlexMono-Medium.ttf>

Then render the PNG icons with: npx tsx scripts/brand/render_icons.ts
"""

import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public"

CHALK = "#ede6d6"
GHOST = "#6e6554"
PHOSPHOR = "#ffb547"
PEN_BLUE = "#86b6ff"
EYE = "#1a1207"


def word_path(font_file, text, x0, baseline, size):
    font = TTFont(font_file)
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font["head"].unitsPerEm
    scale = size / upm
    d = []
    x = x0
    for ch in text:
        name = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        # Flip y: font units go up, SVG goes down.
        gs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x, baseline)))
        d.append(pen.getCommands())
        x += gs[name].width * scale
    cap = font["OS/2"].sCapHeight * scale
    return " ".join(d), x, cap


def logo_svg(semibold, medium):
    size = 100
    base = 110
    trace_d, x_after, cap = word_path(semibold, "Trace", 20, base, size)
    gap = 10
    cur_x = x_after + gap
    cur_w = 44
    cur_top = base - cap - 4
    cur_h = cap + 4 + 16
    type_d, x_end, _ = word_path(medium, "Type", cur_x + cur_w + gap + 2, base, size)
    width = x_end + 20
    height = 170
    # The tutor's underline under "Trace": one quick pen stroke, slightly bowed.
    ul = f"M{24} {base + 32} C {90} {base + 28}, {200} {base + 30}, {x_after - 4} {base + 27}"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.0f} {height}" role="img" aria-label="TraceType">
  <defs>
    <filter id="glow" x="-80%" y="-40%" width="260%" height="180%">
      <feGaussianBlur stdDeviation="9"/>
    </filter>
  </defs>
  <path d="{trace_d}" fill="{CHALK}"/>
  <g class="tt-cursor">
    <rect x="{cur_x:.1f}" y="{cur_top:.1f}" width="{cur_w}" height="{cur_h:.1f}" fill="{PHOSPHOR}" opacity="0.55" filter="url(#glow)"/>
    <rect x="{cur_x:.1f}" y="{cur_top:.1f}" width="{cur_w}" height="{cur_h:.1f}" fill="{PHOSPHOR}"/>
  </g>
  <path d="{type_d}" fill="{GHOST}"/>
  <path class="tt-underline" pathLength="1" d="{ul}" fill="none" stroke="{PEN_BLUE}" stroke-width="5" stroke-linecap="round"/>
</svg>
"""


def favicon_svg():
    # Square-tab version of the mascot: wider and shorter body, bigger eyes,
    # transparent background, no underline (it turns to mush at 16px).
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect x="6.5" y="3.5" width="19" height="25" rx="5" fill="{PHOSPHOR}"/>
  <circle cx="12.4" cy="11" r="2.6" fill="{EYE}"/>
  <circle cx="19.6" cy="11" r="2.6" fill="{EYE}"/>
</svg>
"""


def touch_icon_svg():
    # 180px home screen icon. iOS fills transparency with black, so use the page color.
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="#0c0b09"/>
  <defs><filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter></defs>
  <rect x="58" y="26" width="64" height="104" rx="16" fill="{PHOSPHOR}" opacity="0.45" filter="url(#g)"/>
  <rect x="58" y="26" width="64" height="104" rx="16" fill="{PHOSPHOR}"/>
  <circle cx="78" cy="56" r="8" fill="{EYE}"/>
  <circle cx="102" cy="56" r="8" fill="{EYE}"/>
  <path d="M44 150 C 70 143, 110 147, 136 141" fill="none" stroke="{PEN_BLUE}" stroke-width="7" stroke-linecap="round"/>
</svg>
"""


def main(argv):
    if len(argv) != 2:
        print(__doc__)
        return 1
    semibold, medium = argv
    (OUT / "brand").mkdir(parents=True, exist_ok=True)
    logo = logo_svg(semibold, medium)
    (OUT / "brand" / "logo.svg").write_text(logo)
    # The app imports its own copy so it can animate the cursor and underline.
    (ROOT / "src" / "brand" / "logo.svg").write_text(logo)
    (OUT / "favicon.svg").write_text(favicon_svg())
    (OUT / "brand" / "apple-touch-icon.svg").write_text(touch_icon_svg())
    print("wrote public/brand/logo.svg, public/favicon.svg, public/brand/apple-touch-icon.svg")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
