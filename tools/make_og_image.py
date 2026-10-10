#!/usr/bin/env python
"""Genere l'image Open Graph 1200x630 du site -> assets/og-image.png

Objectif : visuel de partage social au bon format (regle S15 de site-hunt).
Identite reprise de style.css : fond #0D0D10, accent #FF7A00, vert #00B050.
Relancer apres tout changement de marque. Necessite Pillow.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "og-image.png"
PHONE_SRC = ROOT / "assets" / "app-formulaire.jpg"

W, H = 1200, 630
BG_TOP = (13, 13, 16)
BG_BOT = (22, 22, 30)
ACCENT = (255, 122, 0)
GREEN = (0, 176, 80)
TEXT = (245, 245, 247)
DIM = (161, 161, 170)

FONT_BOLD = [
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/arial.ttf",
]
FONT_REG = [
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arial.ttf",
]


def load_font(paths, size):
    for p in paths:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                pass
    return ImageFont.load_default()


def vgradient(w, h, top, bot):
    strip = Image.new("RGB", (1, h))
    px = strip.load()
    for y in range(h):
        t = y / max(1, h - 1)
        strip.putpixel((0, y), tuple(round(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    return strip.resize((w, h))


def main():
    base = vgradient(W, H, BG_TOP, BG_BOT)

    # Halo accent derriere le telephone (cote droit)
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    ImageDraw.Draw(glow).ellipse((640, -80, 1360, 640), fill=ACCENT)
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    base = Image.blend(base, glow, 0.16)

    draw = ImageDraw.Draw(base)

    # Barre accent verticale (gauche)
    draw.rounded_rectangle((88, 198, 96, 300), radius=4, fill=ACCENT)

    f_title = load_font(FONT_BOLD, 88)
    f_sub = load_font(FONT_REG, 34)
    f_meta = load_font(FONT_BOLD, 26)
    f_badge = load_font(FONT_BOLD, 23)

    draw.text((124, 196), "ComPutIn", font=f_title, fill=TEXT)
    draw.text((124, 312), "La comptabilité qui", font=f_sub, fill=DIM)
    draw.text((124, 356), "se calcule toute seule", font=f_sub, fill=DIM)
    draw.text((124, 424), "Ventes · Stock · Rapports · MonCash", font=f_meta, fill=GREEN)

    draw.rounded_rectangle((124, 484, 546, 536), radius=26, fill=(29, 29, 42), outline=(70, 70, 84))
    draw.text((150, 498), "Gratuit sur Android", font=f_badge, fill=ACCENT)

    # Telephone (coin droit)
    if PHONE_SRC.exists():
        src = Image.open(PHONE_SRC).convert("RGB")
        nh = 520
        nw = round(src.width * (nh / src.height))
        phone = src.resize((nw, nh))

        mask = Image.new("L", (nw, nh), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, nw - 1, nh - 1), radius=28, fill=255)
        phone = Image.composite(phone, Image.new("RGB", (nw, nh), BG_TOP), mask)

        cx, cy = 950, H // 2
        left, top = cx - nw // 2, cy - nh // 2

        shadow = Image.new("RGB", (W, H), (0, 0, 0))
        ImageDraw.Draw(shadow).rounded_rectangle(
            (left + 6, top + 18, left + nw + 6, top + nh + 18), radius=32, fill=(0, 0, 0)
        )
        shadow = shadow.filter(ImageFilter.GaussianBlur(24))
        base = Image.blend(base, shadow, 0.35)

        base.paste(phone, (left, top))
        ImageDraw.Draw(base).rounded_rectangle(
            (left, top, left + nw - 1, top + nh - 1), radius=28,
            outline=(90, 90, 104), width=1,
        )

    base.save(OUT)
    print(f"OK -> {OUT} ({base.width}x{base.height})")


if __name__ == "__main__":
    main()
