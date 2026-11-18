"""Build the favicon set and the social share (OpenGraph) image from one source.

Text is converted to outlines (Pretendard from node_modules), so every renderer — browser tabs, iOS, Naver, Kakao,
Slack, Google results — draws the same shapes instead of falling back to whatever system font it has.

    python3 scripts/brand-images/build.py      # needs `npm ci` first (Pretendard fonts + sharp)

Writes: src/app/icon.svg, src/app/favicon.ico, src/app/apple-icon.png, src/app/opengraph-image.png,
public/icon-192.png, public/icon-512.png.
"""

import io
import json
import subprocess
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
FONTS = ROOT / "node_modules/pretendard/dist/public/static"
APP = ROOT / "src/app"
PUBLIC = ROOT / "public"

BLUE, INDIGO, NAVY = "#2563EB", "#4F46E5", "#0F1E4A"


def text_path(font_file: str, text: str, size: float, letter_spacing: float = 0.0):
    """SVG path data for `text` at `size` px, baseline at y=0, plus its ink box (x0, y0, x1, y1)."""
    font = TTFont(FONTS / font_file)
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()
    scale = size / font["head"].unitsPerEm
    pen = SVGPathPen(glyph_set)
    bounds = BoundsPen(glyph_set)
    x = 0.0
    for ch in text:
        name = cmap[ord(ch)]
        # Font units are y-up; SVG is y-down.
        transform = (scale, 0, 0, -scale, x, 0)
        glyph_set[name].draw(TransformPen(pen, transform))
        glyph_set[name].draw(TransformPen(bounds, transform))
        x += glyph_set[name].width * scale + letter_spacing * size
    return pen.getCommands(), bounds.bounds


def placed(font_file, text, size, *, cx=None, x=None, cy=None, baseline=None, spacing=0.0, fill="#fff"):
    """A <path> for `text`, centred on cx (or left at x) and centred on cy (or sitting on baseline)."""
    d, (x0, y0, x1, y1) = text_path(font_file, text, size, spacing)
    dx = cx - (x0 + x1) / 2 if cx is not None else x - x0
    dy = cy - (y0 + y1) / 2 if cy is not None else baseline
    return f'<path transform="translate({dx:.2f} {dy:.2f})" fill="{fill}" d="{d}"/>', (x0 + dx, y0 + dy, x1 + dx, y1 + dy)


def icon_svg(rounded: bool) -> str:
    """Square mark: white "CRI" on the brand gradient. iOS rounds apple-icon itself, so that one stays square."""
    radius = 112 if rounded else 0
    mark, _ = placed("Pretendard-Black.otf", "CRI", 250, cx=256, cy=262, spacing=-0.02)
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
        f'<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{BLUE}"/>'
        f'<stop offset="1" stop-color="{INDIGO}"/></linearGradient></defs>'
        f'<rect width="512" height="512" rx="{radius}" fill="url(#g)"/>{mark}</svg>'
    )


def og_svg() -> str:
    """1200x630 share card. Everything sits in the centre so square and 2:1 crops (Kakao, WhatsApp, iMessage) keep it."""
    w, h = 1200, 630
    logo, (_, _, _, logo_bottom) = placed("Pretendard-Black.otf", "CRI.", 200, cx=w / 2, cy=232, spacing=-0.03)
    line1, _ = placed("Pretendard-Bold.otf", "Limitless Potential.", 50, cx=w / 2, baseline=logo_bottom + 92)
    line2, _ = placed("Pretendard-Bold.otf", "World-Class Research Mentorship.", 50, cx=w / 2, baseline=logo_bottom + 160)
    domain, _ = placed("Pretendard-SemiBold.otf", "criglobal.org", 30, cx=w / 2, baseline=h - 52, fill="#C7D2FE")
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">'
        '<defs>'
        f'<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{NAVY}"/>'
        f'<stop offset="0.55" stop-color="#1E3A8A"/><stop offset="1" stop-color="{INDIGO}"/></linearGradient>'
        f'<radialGradient id="glow" cx="0.5" cy="0.38" r="0.55"><stop offset="0" stop-color="{BLUE}" stop-opacity="0.55"/>'
        f'<stop offset="1" stop-color="{BLUE}" stop-opacity="0"/></radialGradient>'
        '</defs>'
        f'<rect width="{w}" height="{h}" fill="url(#bg)"/><rect width="{w}" height="{h}" fill="url(#glow)"/>'
        f'{logo}{line1}{line2}{domain}</svg>'
    )


def render(svg: str, width: int, height: int) -> Image.Image:
    """Rasterise with sharp (librsvg) and return an opaque-capable RGBA image."""
    js = (
        "const sharp=require('sharp');let s='';process.stdin.on('data',c=>s+=c).on('end',async()=>{"
        "const {w,h,svg}=JSON.parse(s);const b=await sharp(Buffer.from(svg),{density:288})"
        ".resize(w,h).png().toBuffer();process.stdout.write(b);});"
    )
    out = subprocess.run(
        ["node", "-e", js], input=json.dumps({"w": width, "h": height, "svg": svg}).encode(),
        capture_output=True, check=True, cwd=ROOT,
    ).stdout
    return Image.open(io.BytesIO(out)).convert("RGBA")


def main():
    rounded, square = icon_svg(True), icon_svg(False)
    (APP / "icon.svg").write_text(rounded + "\n")

    # favicon.ico: what Naver, Google results, RSS readers and old browsers ask for at /favicon.ico.
    big = render(rounded, 256, 256)
    big.save(APP / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

    # Opaque PNGs: transparent corners turn black in some launchers and chat apps.
    render(square, 180, 180).convert("RGB").save(APP / "apple-icon.png", optimize=True)
    render(square, 192, 192).convert("RGB").save(PUBLIC / "icon-192.png", optimize=True)
    render(square, 512, 512).convert("RGB").save(PUBLIC / "icon-512.png", optimize=True)

    og = render(og_svg(), 1200, 630).convert("RGB")
    og.save(APP / "opengraph-image.png", optimize=True)
    print("done")


if __name__ == "__main__":
    main()
