#!/usr/bin/env python3
"""Genera el lobby y los mapas como modelos de Rojo (.model.json).

Uso:  python3 tools/generate_world.py
Salida: src/world/Lobby.model.json, src/world/Maps/*.model.json y
        src/world/VerityFallback.model.json

Los mapas están inspirados en los clásicos de Murder Mystery 2 (Mansión,
Hospital, Oficina, Banco, Hotel, Fábrica); son construcciones propias, no
copias. Cada mapa sigue la estructura que espera MapService:
  SurvivorSpawns (Folder), KillerSpawn (Part), GoldSpawns (Folder),
  CraftingTables (Folder). Los marcadores son Parts invisibles cuya base
  está a ras de suelo.
"""

import json
import math
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import verity_rig  # noqa: E402

OUT = ROOT / "src" / "world"

IDENTITY = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
YAW180 = [[-1, 0, 0], [0, 1, 0], [0, 0, -1]]
ROT_Z90 = [[0, -1, 0], [1, 0, 0], [0, 0, 1]]  # cilindro vertical
ROT_Y90 = [[0, 0, 1], [0, 1, 0], [-1, 0, 0]]  # cilindro a lo largo de Z


def rgb(r, g, b):
    return [round(r / 255, 4), round(g / 255, 4), round(b / 255, 4)]


def cframe(x, y, z, orientation=None):
    return {"CFrame": {"position": [round(x, 3), round(y, 3), round(z, 3)], "orientation": orientation or IDENTITY}}


def part(name, pos, size, color, material="SmoothPlastic", **props):
    orientation = props.pop("orientation", None)
    class_name = props.pop("class_name", "Part")
    p = {
        "Anchored": True,
        "CFrame": cframe(*pos, orientation=orientation),
        "Size": [round(s, 3) for s in size],
        "Color": rgb(*color),
        "Material": material,
        "TopSurface": "Smooth",
        "BottomSurface": "Smooth",
    }
    attributes = props.pop("attributes", None)
    children = props.pop("children", None)
    p.update(props)
    node = {"name": name, "className": class_name, "properties": p}
    if attributes:
        node["attributes"] = attributes
    if children:
        node["children"] = children
    return node


def container(class_name, name, children):
    return {"name": name, "className": class_name, "children": children}


def point_light(color, rng, brightness, shadows=False):
    return {
        "className": "PointLight",
        "properties": {"Color": rgb(*color), "Range": rng, "Brightness": brightness, "Shadows": shadows},
    }


def surface_text(face, text, ppstud=30, color=(1, 1, 1), font="GothamBlack"):
    return {
        "className": "SurfaceGui",
        "properties": {"Face": face, "SizingMode": "PixelsPerStud", "PixelsPerStud": ppstud},
        "children": [{
            "className": "TextLabel",
            "properties": {
                "Size": {"UDim2": [[1, 0], [1, 0]]}, "BackgroundTransparency": 1, "RichText": True,
                "TextScaled": True, "Font": font, "TextColor3": list(color), "Text": text,
            },
        }],
    }


def marker(name, x, z, size=(4, 1, 4), y0=0.0):
    """Part invisible con la base en y0."""
    return part(name, (x, y0 + size[1] / 2, z), size, (255, 0, 0), "SmoothPlastic",
                Transparency=1, CanCollide=False, CanQuery=False, CanTouch=False)


# ---------------------------------------------------------------------------
# Props: piezas en coordenadas locales
#   (x, y_base, z, sx, sy, sz, color, material[, forma])
# forma: "Ball", "CylV" (cilindro vertical: sx = diámetro, sy = alto),
#        "CylX" (a lo largo de X: sx = largo), "CylZ" (a lo largo de Z: sz = largo)
# Se rotan en múltiplos de 90° intercambiando ejes.
# ---------------------------------------------------------------------------

def place(prop_name, pieces, cx, cz, quarter, base_y=0.0):
    out = []
    for i, piece in enumerate(pieces):
        lx, ly, lz, sx, sy, sz, color, mat = piece[:8]
        shape = piece[8] if len(piece) > 8 else None
        for _ in range(quarter):
            lx, lz = -lz, lx
            sx, sz = sz, sx
            if shape == "CylX":
                shape = "CylZ"
            elif shape == "CylZ":
                shape = "CylX"
        pos = (cx + lx, base_y + ly + sy / 2, cz + lz)
        name = f"{prop_name}{i}"
        if shape == "Ball":
            out.append(part(name, pos, (sx, sy, sz), color, mat, Shape="Ball"))
        elif shape == "CylV":
            out.append(part(name, pos, (sy, sx, sz), color, mat, Shape="Cylinder", orientation=ROT_Z90))
        elif shape == "CylX":
            out.append(part(name, pos, (sx, sy, sz), color, mat, Shape="Cylinder"))
        elif shape == "CylZ":
            out.append(part(name, pos, (sz, sy, sx), color, mat, Shape="Cylinder", orientation=ROT_Y90))
        else:
            out.append(part(name, pos, (sx, sy, sz), color, mat))
    return container("Model", prop_name, out)


WOOD = (101, 67, 45)
DARK_WOOD = (70, 46, 32)
METAL = (150, 155, 165)
GOLD = (255, 200, 60)


# --- Mansión ---
def dresser():
    return [(0, 0, 0, 6, 4, 3, WOOD, "Wood"), (0, 4, 0, 6.2, 0.3, 3.2, DARK_WOOD, "Wood"),
            (-1.5, 1.5, -1.55, 2.4, 0.3, 0.1, (200, 170, 90), "Metal"), (1.5, 1.5, -1.55, 2.4, 0.3, 0.1, (200, 170, 90), "Metal")]


def bookshelf():
    pieces = [(0, 0, 0, 5, 9, 2, DARK_WOOD, "Wood")]
    colors = [(120, 30, 40), (40, 70, 110), (60, 100, 60), (150, 120, 60)]
    for row, y in enumerate((1.2, 3.6, 6.0)):
        x, k = -2.0, 0
        while x < 2.0:
            w = 0.35 + (k % 3) * 0.1
            pieces.append((x + w / 2, y, -0.55, w, 1.8, 0.9, colors[(k + row) % 4], "SmoothPlastic"))
            x += w + 0.05
            k += 1
    return pieces


def sofa():
    c = (96, 30, 40)
    return [(0, 0, 0, 8, 1.6, 3.5, c, "Fabric"), (0, 1.6, 1.3, 8, 2.2, 0.9, c, "Fabric"),
            (-3.6, 1.6, 0, 0.8, 1.2, 3.5, c, "Fabric"), (3.6, 1.6, 0, 0.8, 1.2, 3.5, c, "Fabric")]


def grandfather_clock():
    return [(0, 0, 0, 2.2, 8, 1.6, DARK_WOOD, "Wood"), (0, 5.6, -0.85, 1.4, 1.4, 0.1, (230, 220, 190), "SmoothPlastic"),
            (0, 1.5, -0.85, 0.2, 2.5, 0.1, (200, 170, 90), "Metal")]


def dining_table():
    p = [(0, 3, 0, 8, 0.4, 4, WOOD, "WoodPlanks")]
    for x in (-3.5, 3.5):
        for z in (-1.6, 1.6):
            p.append((x, 0, z, 0.5, 3, 0.5, DARK_WOOD, "Wood"))
    for x in (-2.2, 0, 2.2):
        for z in (-3, 3):
            p.append((x, 0, z, 1.5, 1.8, 1.5, (110, 30, 40), "Fabric"))
    p.append((0, 3.4, 0, 0.5, 1.4, 0.5, (240, 230, 200), "SmoothPlastic", "CylV"))
    return p


def piano():
    return [(0, 0, 0, 6, 4, 2.4, (15, 12, 14), "SmoothPlastic"), (0, 2.6, -1.3, 5.6, 0.25, 0.6, (240, 240, 235), "SmoothPlastic"),
            (0, 0, -2.2, 3, 1.6, 1.2, (60, 20, 30), "Fabric")]


# --- Hospital ---
def bed():
    return [(0, 0, 0, 4, 1.6, 7.5, (180, 186, 190), "Metal"), (0, 1.6, 0, 3.8, 0.8, 7.3, (235, 240, 240), "Fabric"),
            (0, 2.4, 2.8, 2.6, 0.5, 1.2, (250, 250, 250), "Fabric"), (0, 1.6, -3.6, 4, 2.4, 0.3, (170, 176, 180), "Metal")]


def med_cabinet():
    return [(0, 0, 0, 4, 7, 2, (200, 210, 205), "Metal"), (0, 4, -1.05, 3.4, 2.4, 0.1, (150, 200, 210), "Glass"),
            (0, 4.6, -1.1, 0.9, 0.9, 0.05, (220, 40, 40), "SmoothPlastic")]


def curtain():
    return [(0, 0, 0, 7, 8, 0.3, (130, 180, 170), "Fabric"), (0, 8, 0, 7.4, 0.2, 0.4, (180, 186, 190), "Metal")]


def med_cart():
    return [(0, 0.4, 0, 3, 0.2, 2, (190, 196, 200), "Metal"), (0, 2.4, 0, 3, 0.2, 2, (190, 196, 200), "Metal"),
            (-1.4, 0, -0.9, 0.2, 2.6, 0.2, (150, 156, 160), "Metal"), (1.4, 0, 0.9, 0.2, 2.6, 0.2, (150, 156, 160), "Metal"),
            (0.5, 2.6, 0, 0.6, 0.8, 0.6, (240, 240, 240), "SmoothPlastic")]


def wheelchair():
    return [(0, 1.2, 0, 2.2, 0.3, 2.2, (40, 40, 45), "Fabric"), (0, 1.5, 1, 2.2, 2.4, 0.3, (40, 40, 45), "Fabric"),
            (-1.25, 0, 0, 0.2, 2.6, 2.6, METAL, "Metal", "CylX"), (1.25, 0, 0, 0.2, 2.6, 2.6, METAL, "Metal", "CylX")]


# --- Escuela ---
def desk_row():
    p = []
    for x in (-3.2, 0, 3.2):
        p += [(x, 2.6, 0, 2.6, 0.25, 1.8, (150, 110, 70), "Wood"), (x, 0, 0, 0.3, 2.6, 0.3, (90, 92, 98), "Metal"),
              (x, 1.4, 1.6, 1.6, 0.2, 1.4, (60, 90, 140), "SmoothPlastic"), (x, 1.6, 2.25, 1.6, 1.6, 0.2, (60, 90, 140), "SmoothPlastic")]
    return p


def lockers():
    p = []
    colors = [(50, 90, 140), (45, 82, 128)]
    for i, x in enumerate((-3, -1.5, 0, 1.5, 3)):
        p.append((x, 0, 0, 1.45, 7.5, 2, colors[i % 2], "Metal"))
        p.append((x, 5.8, -1.02, 0.8, 0.12, 0.05, (25, 30, 40), "SmoothPlastic"))
    return p


def teacher_desk():
    return [(0, 0, 0, 6, 3, 3, (120, 84, 54), "Wood"), (0, 3, 0, 6.3, 0.25, 3.3, (90, 62, 40), "Wood"),
            (1.6, 3.25, 0, 0.9, 0.9, 0.9, (200, 40, 40), "SmoothPlastic", "Ball")]


def chalk_cart():
    return [(0, 0, 0, 5, 1, 1.5, (90, 92, 98), "Metal"), (0, 1, 0, 5, 4, 0.3, (40, 60, 50), "Slate")]


# --- Oficina ---
def cubicle():
    return [(0, 2.6, 0, 5, 0.25, 2.6, (205, 195, 175), "Wood"),
            (-2.2, 0, 0, 0.3, 2.6, 2.2, (90, 92, 98), "Metal"), (2.2, 0, 0, 0.3, 2.6, 2.2, (90, 92, 98), "Metal"),
            (0, 0, 1.5, 5.4, 4.6, 0.3, (110, 120, 135), "Fabric"), (-2.85, 0, 0, 0.3, 4.6, 3.2, (110, 120, 135), "Fabric"),
            (0, 2.85, 0.6, 1.8, 1.2, 0.15, (25, 25, 30), "SmoothPlastic"), (0, 2.95, 0.5, 1.6, 1.0, 0.05, (90, 160, 255), "Neon"),
            (0, 0, -1.6, 1.4, 1.6, 1.4, (30, 30, 35), "Fabric"), (0, 1.6, -2.2, 1.4, 1.8, 0.3, (30, 30, 35), "Fabric")]


def water_cooler():
    return [(0, 0, 0, 1.4, 3, 1.4, (220, 220, 225), "SmoothPlastic"), (0, 3, 0, 1.2, 1.7, 1.2, (120, 190, 255), "Glass", "CylV")]


def printer():
    return [(0, 0, 0, 3, 2.5, 2, (60, 62, 70), "Metal"), (0, 2.5, 0, 2.4, 0.8, 1.6, (200, 200, 205), "SmoothPlastic"),
            (0, 2.6, -0.9, 1.6, 0.05, 0.6, (250, 250, 250), "SmoothPlastic")]


def filing():
    p = [(0, 0, 0, 1.8, 5.2, 2.2, (140, 145, 150), "Metal")]
    for y in (0.8, 2.4, 4.0):
        p.append((0, y, -1.12, 0.8, 0.15, 0.05, (60, 60, 65), "Metal"))
    return p


def plant():
    return [(0, 0, 0, 1.6, 1.4, 1.6, (120, 70, 40), "SmoothPlastic", "CylV"), (0, 1.2, 0, 2.6, 2.6, 2.6, (50, 130, 60), "Grass", "Ball")]


# --- Banco ---
def teller():
    return [(0, 0, 0, 8, 3.6, 2.2, (130, 90, 60), "Wood"), (0, 3.6, 0, 8.4, 0.3, 2.6, (230, 225, 215), "Marble"),
            (0, 3.9, 0.2, 8, 3, 0.15, (170, 210, 230), "Glass"), (-2, 3.9, -0.6, 1.4, 0.8, 0.2, (40, 40, 45), "SmoothPlastic")]


def vault_door():
    return [(0, 0, 0, 9, 9, 1.2, (80, 82, 90), "DiamondPlate"), (0, 0.8, -0.8, 7.2, 7.2, 0.8, (160, 165, 175), "Metal", "CylZ"),
            (0, 4.2, -1.4, 3.6, 0.35, 0.35, (200, 170, 80), "Metal"), (0, 2.6, -1.4, 0.35, 3.6, 0.35, (200, 170, 80), "Metal")]


def gold_stack():
    p = []
    for i, (x, z) in enumerate([(-0.9, -0.5), (0.9, -0.5), (-0.9, 0.5), (0.9, 0.5)]):
        p.append((x, 0, z, 1.6, 0.6, 0.8, GOLD, "Foil"))
    p += [(0, 0.6, -0.5, 1.6, 0.6, 0.8, GOLD, "Foil"), (0, 0.6, 0.5, 1.6, 0.6, 0.8, GOLD, "Foil"), (0, 1.2, 0, 1.6, 0.6, 0.8, GOLD, "Foil")]
    return p


def money_bags():
    return [(-0.8, 0, 0, 1.8, 1.8, 1.8, (90, 140, 70), "Fabric", "Ball"), (0.9, 0, 0.3, 1.5, 1.5, 1.5, (90, 140, 70), "Fabric", "Ball"),
            (0, 0, -1, 1.2, 1.2, 1.2, (80, 125, 60), "Fabric", "Ball")]


def rope_posts():
    return [(-3, 0, 0, 0.5, 3, 0.5, GOLD, "Metal", "CylV"), (3, 0, 0, 0.5, 3, 0.5, GOLD, "Metal", "CylV"),
            (0, 2.4, 0, 6, 0.3, 0.3, (140, 15, 30), "Fabric", "CylX")]


def column():
    return [(0, 0, 0, 2.6, 0.6, 2.6, (210, 205, 195), "Marble"), (0, 0.6, 0, 2.2, 13, 2.2, (230, 225, 215), "Marble", "CylV")]


# --- Hotel ---
def double_bed():
    return [(0, 0, 0, 6, 1.6, 7.5, (90, 60, 45), "Wood"), (0, 1.6, 0.2, 5.8, 0.9, 7, (240, 240, 245), "Fabric"),
            (0, 2.5, -0.8, 5.9, 0.2, 4.8, (150, 30, 45), "Fabric"),
            (-1.4, 2.5, 3, 2.2, 0.6, 1, (255, 255, 255), "Fabric"), (1.4, 2.5, 3, 2.2, 0.6, 1, (255, 255, 255), "Fabric"),
            (0, 0, 3.75, 6.2, 4.5, 0.4, (70, 45, 35), "Wood")]


def nightstand():
    return [(0, 0, 0, 2, 2.2, 2, (90, 60, 45), "Wood"), (0, 2.2, 0, 0.5, 1.2, 0.5, (200, 170, 90), "Metal", "CylV"),
            (0, 3.4, 0, 1.4, 1, 1.4, (250, 230, 190), "Fabric", "CylV")]


def luggage_cart():
    return [(0, 0.6, 0, 4, 0.3, 2.2, GOLD, "Metal"), (-1.8, 0.9, 0, 0.25, 5, 0.25, GOLD, "Metal", "CylV"),
            (1.8, 0.9, 0, 0.25, 5, 0.25, GOLD, "Metal", "CylV"), (0, 5.8, 0, 3.8, 0.25, 0.25, GOLD, "Metal", "CylX"),
            (-0.8, 0.9, 0, 1.8, 2.6, 1.6, (120, 40, 40), "Fabric"), (0.9, 0.9, 0, 1.6, 2, 1.4, (40, 60, 110), "Fabric")]


def reception():
    return [(0, 0, 0, 10, 3.6, 2.5, (110, 30, 40), "Wood"), (0, 3.6, 0, 10.4, 0.3, 2.9, (230, 210, 160), "Marble"),
            (3, 3.9, 0, 0.7, 0.4, 0.7, GOLD, "Metal", "Ball")]


def armchair():
    c = (120, 30, 45)
    return [(0, 0, 0, 3, 1.6, 3, c, "Fabric"), (0, 1.6, 1.2, 3, 2.2, 0.6, c, "Fabric"),
            (-1.35, 1.6, 0, 0.3, 1, 3, c, "Fabric"), (1.35, 1.6, 0, 0.3, 1, 3, c, "Fabric")]


# --- Fábrica ---
def crate_stack():
    c = (150, 110, 70)
    return [(0, 0, 0, 4, 4, 4, c, "WoodPlanks"), (0.2, 4, 0.2, 3.6, 3.6, 3.6, c, "WoodPlanks"), (4.2, 0, 0.4, 4, 4, 4, c, "WoodPlanks")]


def barrels():
    return [(0, 0, 0, 2.2, 3.2, 2.2, (60, 90, 140), "Metal", "CylV"), (2.4, 0, 0.3, 2.2, 3.2, 2.2, (180, 60, 40), "Metal", "CylV"),
            (1.2, 0, 2.2, 2.2, 3.2, 2.2, (70, 140, 70), "Metal", "CylV")]


def conveyor():
    p = [(0, 0, 0, 12, 2.6, 3, (60, 62, 66), "Metal"), (0, 2.6, 0, 12, 0.25, 2.6, (25, 25, 28), "SmoothPlastic")]
    for x in (-4, 0, 3.5):
        p.append((x, 2.85, 0, 1.6, 1.6, 1.6, (170, 130, 80), "Cardboard"))
    for x in (-5.5, 5.5):
        p.append((x, 0, -1.6, 0.4, 3.6, 0.4, (200, 170, 40), "Metal"))
    return p


def pipes():
    return [(0, 7, 0, 12, 1.2, 1.2, (120, 125, 130), "Metal", "CylX"), (0, 8.6, 0, 12, 0.8, 0.8, (170, 70, 50), "Metal", "CylX"),
            (-5.5, 0, 0, 0.5, 7, 0.5, (90, 92, 98), "Metal"), (5.5, 0, 0, 0.5, 7, 0.5, (90, 92, 98), "Metal")]


def machine():
    return [(0, 0, 0, 5, 6, 4, (80, 90, 80), "DiamondPlate"), (0, 3, -2.05, 3, 1.6, 0.1, (20, 20, 20), "SmoothPlastic"),
            (-0.8, 3.4, -2.1, 0.4, 0.4, 0.05, (255, 60, 40), "Neon"), (0.8, 3.4, -2.1, 0.4, 0.4, 0.05, (60, 255, 80), "Neon"),
            (0, 6, 0, 1.2, 2, 1.2, (100, 105, 110), "Metal", "CylV")]


def shelf_rack():
    p = [(-2.8, 0, 0, 0.3, 9, 2.2, (200, 120, 40), "Metal"), (2.8, 0, 0, 0.3, 9, 2.2, (200, 120, 40), "Metal")]
    for y in (0.4, 3.2, 6.0):
        p.append((0, y, 0, 5.6, 0.25, 2.2, (60, 90, 140), "Metal"))
        p.append((-1.2, y + 0.25, 0, 2, 1.8, 1.8, (170, 130, 80), "Cardboard"))
        p.append((1.3, y + 0.25, 0, 1.8, 1.4, 1.6, (150, 115, 70), "Cardboard"))
    return p


THEMES = {
    "Mansión": {
        "seed": 7, "cols": 4, "rows": 4, "cell": 40, "height": 24,
        "floor": ((78, 54, 44), "WoodPlanks"), "wall": ((70, 58, 72), "Plaster"),
        "outer": ((52, 40, 50), "Brick"), "ceiling": ((30, 24, 32), "Plaster"),
        "trim": (40, 28, 26), "rug": [(110, 22, 32), (40, 34, 70), (70, 50, 30)],
        "lamp": (255, 170, 120), "lamp_brightness": 0.9,
        "props": [dresser, bookshelf, sofa, grandfather_clock, dining_table, piano],
    },
    "Hospital": {
        "seed": 21, "cols": 5, "rows": 3, "cell": 40, "height": 22,
        "floor": ((170, 182, 176), "Marble"), "wall": ((150, 176, 168), "Plaster"),
        "outer": ((110, 120, 118), "Concrete"), "ceiling": ((120, 130, 128), "Concrete"),
        "trim": (90, 110, 104), "rug": [],
        "lamp": (190, 235, 255), "lamp_brightness": 0.8,
        "props": [bed, bed, med_cabinet, curtain, med_cart, wheelchair],
    },
    "Oficina": {
        "seed": 33, "cols": 4, "rows": 4, "cell": 40, "height": 22,
        "floor": ((95, 104, 118), "Fabric"), "wall": ((215, 212, 200), "Plaster"),
        "outer": ((90, 95, 105), "Concrete"), "ceiling": ((200, 200, 195), "Plaster"),
        "trim": (80, 85, 95), "rug": [],
        "lamp": (230, 240, 255), "lamp_brightness": 0.9,
        "props": [cubicle, cubicle, cubicle, water_cooler, printer, filing, plant],
    },
    "Banco": {
        "seed": 55, "cols": 4, "rows": 3, "cell": 42, "height": 24,
        "floor": ((225, 220, 210), "Marble"), "wall": ((180, 160, 120), "Plaster"),
        "outer": ((150, 130, 100), "Sandstone"), "ceiling": ((200, 190, 170), "Plaster"),
        "trim": (120, 90, 50), "rug": [(130, 20, 30)],
        "lamp": (255, 220, 160), "lamp_brightness": 0.9,
        "props": [teller, vault_door, gold_stack, money_bags, rope_posts, column, plant],
    },
    "Hotel": {
        "seed": 77, "cols": 5, "rows": 3, "cell": 38, "height": 22,
        "floor": ((110, 25, 35), "Fabric"), "wall": ((210, 190, 150), "Plaster"),
        "outer": ((120, 80, 60), "Brick"), "ceiling": ((230, 220, 200), "Plaster"),
        "trim": (70, 45, 30), "rug": [(200, 160, 80)],
        "lamp": (255, 210, 150), "lamp_brightness": 0.85,
        "props": [double_bed, double_bed, nightstand, luggage_cart, reception, armchair, plant],
    },
    "Fábrica": {
        "seed": 91, "cols": 4, "rows": 4, "cell": 42, "height": 24,
        "floor": ((110, 110, 105), "Concrete"), "wall": ((120, 110, 100), "CorrodedMetal"),
        "outer": ((100, 95, 90), "DiamondPlate"), "ceiling": ((70, 70, 72), "Metal"),
        "trim": (200, 170, 40), "rug": [],
        "lamp": (255, 230, 180), "lamp_brightness": 0.85,
        "props": [crate_stack, barrels, conveyor, pipes, machine, shelf_rack],
    },
    "Escuela Nocturna": {
        "seed": 42, "cols": 4, "rows": 4, "cell": 38, "height": 22,
        "floor": ((120, 112, 100), "Concrete"), "wall": ((200, 190, 160), "Plaster"),
        "outer": ((150, 80, 60), "Brick"), "ceiling": ((160, 158, 150), "Concrete"),
        "trim": (60, 90, 130), "rug": [(60, 90, 130)],
        "lamp": (255, 245, 210), "lamp_brightness": 0.75,
        "props": [desk_row, desk_row, lockers, teacher_desk, chalk_cart],
    },
}

DOOR = 12
DOOR_TOP = 18  # Verity mide ~16 studs


def build_map(name, t, origin):
    rng = random.Random(t["seed"])
    cols, rows, cell, h = t["cols"], t["rows"], t["cell"], t["height"]
    ox, oz = origin
    w, d = cols * cell, rows * cell
    x0, z0 = ox - w / 2, oz - d / 2
    structure, decor, lights = [], [], []

    structure.append(part("Floor", (ox, -1, oz), (w, 2, d), *t["floor"]))
    structure.append(part("Ceiling", (ox, h + 0.5, oz), (w, 1, d), *t["ceiling"]))
    for (px, pz, sx, sz) in [(ox, z0 - 1, w + 4, 2), (ox, z0 + d + 1, w + 4, 2), (x0 - 1, oz, 2, d), (x0 + w + 1, oz, 2, d)]:
        structure.append(part("OuterWall", (px, h / 2, pz), (sx, h, sz), *t["outer"]))

    def wall_segment(axis, fixed, a, b):
        if b - a < 0.5:
            return
        mid, length = (a + b) / 2, b - a
        if axis == "x":  # pared que corre a lo largo de Z en x = fixed
            structure.append(part("Wall", (fixed, h / 2, mid), (1.5, h, length), *t["wall"]))
            structure.append(part("Baseboard", (fixed, 0.4, mid), (1.9, 0.8, length), t["trim"], "Wood"))
        else:
            structure.append(part("Wall", (mid, h / 2, fixed), (length, h, 1.5), *t["wall"]))
            structure.append(part("Baseboard", (mid, 0.4, fixed), (length, 0.8, 1.9), t["trim"], "Wood"))

    def lintel(axis, fixed, center):
        size = (1.5, h - DOOR_TOP, DOOR) if axis == "x" else (DOOR, h - DOOR_TOP, 1.5)
        pos = (fixed, DOOR_TOP + (h - DOOR_TOP) / 2, center) if axis == "x" else (center, DOOR_TOP + (h - DOOR_TOP) / 2, fixed)
        structure.append(part("Lintel", pos, size, *t["wall"]))

    def wall_line(axis, fixed, start, length):
        if rng.random() < 0.15:  # habitación abierta
            return
        if rng.random() < 0.3:
            gaps = [rng.uniform(DOOR * 0.75, length / 2 - DOOR * 0.75), rng.uniform(length / 2 + DOOR * 0.75, length - DOOR * 0.75)]
        else:
            gaps = [rng.uniform(DOOR, length - DOOR)]
        cursor = 0
        for g in gaps:
            wall_segment(axis, fixed, start + cursor, start + g - DOOR / 2)
            lintel(axis, fixed, start + g)
            cursor = g + DOOR / 2
        wall_segment(axis, fixed, start + cursor, start + length)

    for i in range(1, cols):
        for j in range(rows):
            wall_line("x", x0 + i * cell, z0 + j * cell, cell)
    for j in range(1, rows):
        for i in range(cols):
            wall_line("z", z0 + j * cell, x0 + i * cell, cell)

    centers = [(x0 + (i + 0.5) * cell, z0 + (j + 0.5) * cell) for i in range(cols) for j in range(rows)]
    blocked = []
    half = cell / 2 - 5

    def free_spot(cx, cz, clearance=6.0):
        for _ in range(30):
            p = (cx + rng.uniform(-half, half), cz + rng.uniform(-half, half))
            if all(math.dist(p, b) >= clearance for b in blocked):
                return p
        return (cx, cz)

    for cx, cz in centers:
        lamp = part("Lamp", (cx, h - 0.4, cz), (2.4, 0.6, 2.4), t["lamp"], "Neon", CanCollide=False,
                    Tags=["MansionLamp"], attributes={"Flicker": rng.random() < 0.35},
                    children=[point_light(t["lamp"], 26, t["lamp_brightness"], True)])
        lights.append(lamp)
        if t["rug"] and rng.random() < 0.7:
            decor.append(part("Rug", (cx, 0.05, cz), (rng.choice([12, 14, 16]), 0.1, rng.choice([10, 12])), rng.choice(t["rug"]), "Fabric", CanCollide=False))
        for _ in range(rng.randint(2, 4)):
            spot = (cx + rng.uniform(-half + 2, half - 2), cz + rng.uniform(-half + 2, half - 2))
            if math.dist(spot, (cx, cz)) < 7 or any(math.dist(spot, b) < 9 for b in blocked):
                continue
            builder = rng.choice(t["props"])
            decor.append(place(builder.__name__, builder(), spot[0], spot[1], rng.randint(0, 3)))
            blocked.append(spot)

    # Verity aparece en la habitación más céntrica
    killer_center = min(centers, key=lambda c: math.dist(c, (ox, oz)))
    kx, kz = free_spot(*killer_center)
    blocked.append((kx, kz))

    others = [c for c in centers if c != killer_center]
    rng.shuffle(others)
    far = sorted(others, key=lambda c: -math.dist(c, killer_center))
    tables, used = [], []
    for c in far:
        if len(tables) >= 3:
            break
        if any(math.dist(c, u) < cell * 1.2 for u in used):
            continue
        sx, sz = free_spot(*c, clearance=8)
        blocked.append((sx, sz))
        used.append(c)
        tables.append(marker(f"Table{len(tables) + 1}", sx, sz, (6, 1, 4)))

    survivor_spawns = []
    for i, c in enumerate(others):
        sx, sz = free_spot(*c)
        survivor_spawns.append(marker(f"Spawn{i + 1}", sx, sz))

    gold = []
    for c in centers:
        for _ in range(2):
            gx, gz = free_spot(*c, clearance=5)
            gold.append(marker(f"Gold{len(gold) + 1}", gx, gz, (1, 1, 1)))

    return {
        "className": "Model",
        "children": [
            container("Folder", "Structure", structure),
            container("Folder", "Decor", decor),
            container("Folder", "Lights", lights),
            container("Folder", "SurvivorSpawns", survivor_spawns),
            marker("KillerSpawn", kx, kz),
            container("Folder", "GoldSpawns", gold),
            container("Folder", "CraftingTables", tables),
        ],
    }


# ---------------------------------------------------------------------------
# Lobby al estilo MM2: plaza central con la estatua de Verity mirando al
# spawn, puesto de tienda a la izquierda y un obby a la derecha.
# ---------------------------------------------------------------------------

LOBBY_Y = 300


def build_obby(top):
    """Recorrido de saltos sobre lava. Devuelve (piezas, plataformas)."""
    parts = []
    # suelo de lava (te devuelve al inicio)
    parts.append(part("Lava", (61, top + 0.15, -4), (26, 0.3, 92), (255, 70, 30), "Neon",
                      attributes={"ObbyLava": True}))
    parts.append(part("LavaGlow", (61, top + 3, -4), (0.5, 0.5, 0.5), (255, 90, 40), "Neon", Transparency=1, CanCollide=False,
                      children=[point_light((255, 90, 40), 40, 1.2)]))
    # borde bajo que separa la lava de la plaza
    parts.append(part("Curb", (47.5, top + 0.75, -4), (1, 1.5, 92), (60, 50, 55), "Brick"))
    # inicio
    parts.append(part("ObbyStart", (44, top + 0.5, 40), (6, 1, 6), (80, 220, 120), "Neon",
                      attributes={"ObbyStart": True}))
    parts.append(part("ObbySign", (40.6, top + 6, 40), (0.6, 4, 8), (20, 14, 20), "SmoothPlastic",
                      children=[surface_text("Right", "OBBY\n<font size=\"30\">premio al final</font>", 40)]))
    # plataformas: (x, z, altura, tamaño)
    steps = [
        (52, 40, 1.5, 4), (57, 34, 3, 4), (63, 29, 4.5, 3.5), (68, 23, 6, 3.5), (63, 17, 7.5, 3),
        (57, 12, 9, 3), (57, 5, 10, 2.5), (63, 0, 11.5, 3), (69, -6, 12.5, 2.5), (69, -13, 13.5, 2.5),
        (63, -18, 14.5, 2.5), (56, -23, 15.5, 3), (56, -30, 16.5, 2.5), (62, -35, 17.5, 3),
    ]
    colors = [(255, 80, 120), (255, 180, 60), (90, 200, 255), (160, 110, 255)]
    for i, (x, z, y, s) in enumerate(steps):
        parts.append(part(f"Step{i + 1}", (x, top + y, z), (s, 1, s), colors[i % 4], "Neon" if i % 4 == 0 else "SmoothPlastic"))
    # escalera de mano final
    parts.append(part("Truss", (66, top + 20, -40), (2, 8, 2), (90, 90, 95), "Metal", class_name="TrussPart"))
    # meta con cofre
    parts.append(part("GoalPad", (66, top + 23.5, -45), (8, 1, 8), (255, 200, 60), "Neon"))
    chest = [
        part("Chest", (66, top + 25, -47), (4, 2, 2.6), (120, 80, 45), "WoodPlanks", attributes={"ObbyGoal": True}),
        part("ChestLid", (66, top + 26.3, -47), (4.1, 0.6, 2.7), (255, 200, 60), "Foil", attributes={"ObbyGoal": True}),
    ]
    parts += chest
    return parts


def build_lobby():
    y = LOBBY_Y
    top = y + 1
    H = 30
    c = []
    c.append(part("Floor", (0, y, 0), (150, 2, 110), (60, 42, 36), "WoodPlanks"))
    c.append(part("Plaza", (0, top + 0.03, 0), (44, 0.06, 56), (150, 140, 130), "Marble", CanCollide=False))
    c.append(part("Rug", (0, top + 0.08, 8), (14, 0.06, 30), (110, 22, 32), "Fabric", CanCollide=False))
    wall_c, wall_m = (58, 44, 56), "Plaster"
    for (px, pz, sx, sz) in [(0, -55, 150, 2), (0, 55, 150, 2), (-75, 0, 2, 110), (75, 0, 2, 110)]:
        c.append(part("WallLow", (px, top + 3, pz), (sx, 6, sz), wall_c, wall_m))
        c.append(part("WallHigh", (px, top + 22, pz), (sx, 16, sz), wall_c, wall_m))
        c.append(part("Window", (px, top + 10, pz), (sx * 0.98 if sx > 2 else 0.4, 8, sz * 0.98 if sz > 2 else 0.4),
                      (90, 70, 140), "Glass", Transparency=0.55))
    for x in (-74, -37, 37, 74):
        for z in (-54, 54):
            c.append(part("Pillar", (x, top + H / 2, z), (3, H, 3), (40, 30, 38), "Marble"))
    c.append(part("Ceiling", (0, top + H + 0.5, 0), (150, 1, 110), (34, 26, 34), "WoodPlanks"))
    c.append(part("Chandelier", (0, top + H - 3, 8), (6, 0.6, 6), (200, 160, 80), "Metal"))
    c.append(part("ChandelierGlow", (0, top + H - 3.8, 8), (2.5, 1, 2.5), (255, 200, 140), "Neon", Shape="Ball", CanCollide=False,
                  children=[point_light((255, 200, 140), 60, 1.6, True)]))
    for x in (-40, 0, 40):
        for z in (-38, 38):
            c.append(part("WallLamp", (x, top + 14, z), (1.6, 1.6, 1.6), (255, 190, 120), "Neon", Shape="Ball", CanCollide=False,
                          children=[point_light((255, 190, 130), 40, 1.0)]))
    # bancos alrededor de la plaza
    for x in (-18, 18):
        for z in (-4, 18):
            c.append(place("Bench", [(0, 1.2, 0, 3, 0.5, 10, (90, 60, 40), "Wood"), (0, 0, -4, 2.5, 1.2, 0.6, (50, 40, 38), "Metal"),
                                     (0, 0, 4, 2.5, 1.2, 0.6, (50, 40, 38), "Metal"), (1.3 if x > 0 else -1.3, 1.7, 0, 0.4, 2.4, 10, (90, 60, 40), "Wood")],
                           x, z, 0, base_y=top))

    # estatua de Verity mirando al spawn (+Z). En el juego se reemplaza por el
    # modelo real de Verity (ver VerityModel / Lobby.luau).
    sx, sz = 0, -18
    statue = [
        part("Pedestal", (sx, top + 1.5, sz), (9, 3, 9), (30, 26, 32), "Marble"),
        part("PedestalTrim", (sx, top + 3.1, sz), (7.5, 0.2, 7.5), (200, 160, 80), "Metal"),
        part("StatueSpot", (sx, top + 3.2, sz), (1, 0.1, 1), (255, 0, 0), Transparency=1, CanCollide=False, CanQuery=False,
             orientation=YAW180),
        part("StatueLight", (sx, top + 4, sz + 7), (0.5, 0.5, 0.5), (255, 230, 150), "Neon", Transparency=1, CanCollide=False,
             children=[point_light((255, 220, 140), 24, 1.6)]),
        part("StatuePlaque", (sx, top + 1.5, sz + 4.55), (5, 1.4, 0.1), (200, 160, 80), "Metal",
             children=[surface_text("Back", "VERITY", 40, (0.1, 0.06, 0.04))]),
    ]
    statue += verity_rig.build(part, offset=(sx, top + 3.2, sz), statue=True, yaw180=True)
    c.append(container("Model", "VerityStatue", statue))

    # cartel en la pared del fondo, detrás de la estatua, visible desde el spawn
    c.append(part("Sign", (0, top + 20, -53.6), (46, 9, 0.6), (20, 14, 20), "SmoothPlastic",
                  children=[surface_text("Back", "MURDER MYSTERY\nbut <font color=\"#ff3b4e\">VERITY</font>")]))

    # puesto de tienda (izquierda)
    shop = [
        part("Counter", (-50, top + 2, 0), (3, 4, 16), (110, 70, 45), "WoodPlanks", children=[{
            "className": "ProximityPrompt",
            "properties": {"ActionText": "Abrir tienda", "ObjectText": "Tienda", "HoldDuration": 0,
                           "MaxActivationDistance": 12, "RequiresLineOfSight": False},
            "attributes": {"OpensShop": True},
        }]),
        part("CounterTop", (-50, top + 4.15, 0), (3.6, 0.3, 16.6), (230, 210, 160), "Marble"),
        part("BackWall", (-58, top + 7, 0), (1, 14, 20), (80, 50, 40), "WoodPlanks"),
    ]
    for i, z in enumerate((-6, -2, 2, 6)):
        for j, sh in enumerate((4, 8)):
            colors = [(70, 160, 255), (170, 90, 255), (255, 120, 200), (230, 60, 70), (120, 230, 80), (255, 220, 120), (150, 220, 255), (255, 200, 60)]
            shop.append(part(f"ShelfItem{i}{j}", (-57, top + sh, z), (1.2, 1.6, 1.2), colors[(i * 2 + j) % len(colors)], "Neon"))
        shop.append(part(f"Shelf{i}", (-57, top + 3.1, z), (1.6, 0.2, 3.6), DARK_WOOD, "Wood"))
        shop.append(part(f"ShelfHigh{i}", (-57, top + 7.1, z), (1.6, 0.2, 3.6), DARK_WOOD, "Wood"))
    for i in range(8):  # toldo a rayas
        color = (200, 30, 45) if i % 2 == 0 else (240, 235, 225)
        shop.append(part(f"Awning{i}", (-52, top + 12, -8 + i * 2 + 1), (8, 0.4, 2), color, "Fabric"))
    for z in (-8.5, 8.5):
        shop.append(part("AwningPost", (-48.5, top + 6, z), (0.5, 12, 0.5), DARK_WOOD, "Wood"))
    shop.append(part("ShopSign", (-48.2, top + 14.5, 0), (0.6, 4, 14), (20, 14, 20), "SmoothPlastic",
                     children=[surface_text("Right", "<font color=\"#ffc83c\">TIENDA</font>", 40)]))
    shop.append(part("ShopLight", (-50, top + 10, 0), (0.5, 0.5, 0.5), (255, 220, 150), "Neon", Transparency=1, CanCollide=False,
                     children=[point_light((255, 220, 150), 22, 1.4)]))
    c.append(container("Model", "Shop", shop))

    # obby (derecha)
    c.append(container("Model", "Obby", build_obby(top)))

    c.append({
        "name": "LobbySpawn", "className": "SpawnLocation",
        "properties": {"Anchored": True, "Neutral": True, "Duration": 0, "Size": [10, 1, 10], "CFrame": cframe(0, top + 0.5, 22),
                       "Transparency": 1, "CanCollide": False},
    })
    return {"className": "Model", "children": c}


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1))


def main():
    write(OUT / "Lobby.model.json", build_lobby())
    write(OUT / "VerityFallback.model.json", verity_rig.character(part))
    maps_dir = OUT / "Maps"
    for old in maps_dir.glob("*.model.json"):
        old.unlink()
    for i, (name, theme) in enumerate(THEMES.items()):
        origin = ((i - (len(THEMES) - 1) / 2) * 320, 0)
        write(maps_dir / f"{name}.model.json", build_map(name, theme, origin))
    old_character = OUT / "VerityCharacter.model.json"
    if old_character.exists():
        old_character.unlink()
    print("Mundo generado en", OUT)


if __name__ == "__main__":
    main()
