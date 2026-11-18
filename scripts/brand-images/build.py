"""Build the favicon set and the social share (OpenGraph) image from one source.

Text is converted to outlines (Pretendard from node_modules), so every renderer — browser tabs, iOS, Naver, Kakao,
Slack, Google results — draws the same shapes instead of falling back to whatever system font it has.

    python3 scripts/brand-images/build.py      # needs `npm ci` first (Pretendard fonts + sharp)

Writes: src/app/icon.svg, src/app/favicon.ico, src/app/apple-icon.png, src/app/opengraph-image.jpg (site card),
public/og/*.jpg (section cards), src/assets/og/program-bg-*.jpg (program card backdrops), public/icon-192.png,
public/icon-512.png.
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


# Share cards. Real CRI class photos (professor + students) under a navy wash, with all text inside the centre
# 630x630 square: KakaoTalk, iMessage and WhatsApp show a square crop on phones, Facebook/X/Slack the full 1.91:1.
W, H = 1200, 630
SAFE = 560  # widest a text line may be, so it survives the square crop
EDITORIAL = ROOT / "public/editorial"
PHOTOS = {
    "classroom": "224154651312-01.jpg",  # professor teaching at a desk, students at laptops
    "lecture": "224064517758-04.jpg",  # professor at the board
    "seminar": "223956173133-10.jpg",  # 2025 Seoul Research Program evening seminar
    "mentoring": "224155866504-05.jpg",  # professor and student at one laptop
    "conversation": "224021442427-03.jpg",  # professor talking with students
    "group": "224052005886-06.jpg",  # professor and students, group photo
    "lineup": "224159932106-04.jpg",  # professor with a student team
    "cohort": "224064517758-02.jpg",  # professor with a finished student cohort
    "thumbs": "224164063133-02.jpg",  # professor and students, thumbs up
    "pointing": "224154651312-02.jpg",  # professor explaining at the board
    "team": "224079964888-04.jpg",  # faculty and students, Seoul program
}
# Section pages: (output name, photo, label lines). "home" becomes src/app/opengraph-image.jpg.
SECTIONS = [
    ("home", "classroom", ["World-Class", "Research Mentorship"]),
    ("research", "lecture", ["Research Programs"]),
    ("seoul", "seminar", ["Seoul Research", "Program"]),
    ("winter", "conversation", ["Winter Online", "Research Program"]),
    ("one-on-one", "mentoring", ["1-on-1 Research", "Mentorship"]),
    ("about", "group", ["About CRI"]),
    ("admissions", "lineup", ["Admissions"]),
    ("contact", "thumbs", ["Contact Us"]),
    ("webinar", "team", ["Free Webinar"]),
    ("blog", "pointing", ["Research Ideas", "& Guides"]),
    ("success", "cohort", ["Student Success", "Stories"]),
]
# Program cards draw on one of these (picked per program), already washed, with no text.
PROGRAM_BACKGROUNDS = ["lecture", "classroom", "conversation", "seminar", "pointing", "team"]


def photo_backdrop(name: str) -> Image.Image:
    """The photo cropped to 1200x630 under the navy wash (darker in the middle, where the text goes)."""
    from PIL import ImageOps
    src = Image.open(EDITORIAL / PHOTOS[name]).convert("RGB")
    photo = ImageOps.fit(src, (W, H), method=Image.LANCZOS, centering=(0.5, 0.45)).convert("RGBA")
    wash = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><defs>'
        '<radialGradient id="c" cx="0.5" cy="0.5" r="0.55"><stop offset="0" stop-color="#0B1638" stop-opacity="0.62"/>'
        '<stop offset="1" stop-color="#0B1638" stop-opacity="0"/></radialGradient></defs>'
        f'<rect width="{W}" height="{H}" fill="{NAVY}" fill-opacity="0.55"/><rect width="{W}" height="{H}" fill="url(#c)"/></svg>'
    )
    return Image.alpha_composite(photo, render(wash, W, H))


def fit_size(font_file: str, lines, size: float) -> float:
    """Shrink `size` until the widest line fits the square-safe width."""
    while size > 20:
        widest = max(text_path(font_file, line, size)[1][2] - text_path(font_file, line, size)[1][0] for line in lines)
        if widest <= SAFE:
            return size
        size -= 2
    return size


def card_text_svg(lines) -> str:
    """Centred "CRI." + label lines + domain, transparent elsewhere."""
    label_size = fit_size("Pretendard-Bold.otf", lines, 52)
    gap = label_size * 1.25
    block = 150 + 40 + gap * len(lines)  # logo cap height + spacing + label lines
    top = (H - block) / 2 - 10
    logo, (_, _, _, logo_bottom) = placed("Pretendard-Black.otf", "CRI.", 190, cx=W / 2, cy=top + 75, spacing=-0.03)
    parts = [logo]
    for i, line in enumerate(lines):
        path, _ = placed("Pretendard-Bold.otf", line, label_size, cx=W / 2, baseline=logo_bottom + 40 + label_size + i * gap)
        parts.append(path)
    domain, _ = placed("Pretendard-SemiBold.otf", "criglobal.org", 28, cx=W / 2, baseline=H - 44, fill="#E0E7FF")
    parts.append(domain)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">{"".join(parts)}</svg>'


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

    (PUBLIC / "og").mkdir(exist_ok=True)
    for name, photo, lines in SECTIONS:
        card = Image.alpha_composite(photo_backdrop(photo), render(card_text_svg(lines), W, H)).convert("RGB")
        out = APP / "opengraph-image.jpg" if name == "home" else PUBLIC / "og" / f"{name}.jpg"
        card.save(out, quality=84, optimize=True, progressive=True)

    for i, photo in enumerate(PROGRAM_BACKGROUNDS):
        photo_backdrop(photo).convert("RGB").save(ROOT / f"src/assets/og/program-bg-{i}.jpg", quality=80, optimize=True)
    print("done")


if __name__ == "__main__":
    main()
