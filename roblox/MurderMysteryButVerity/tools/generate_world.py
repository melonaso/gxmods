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


def ry(angle):
    """Rotación sobre Y (radianes), matriz por filas como CFrame de Roblox."""
    c, s_ = math.cos(angle), math.sin(angle)
    return [[c, 0, s_], [0, 1, 0], [-s_, 0, c]]


def rz(angle):
    c, s_ = math.cos(angle), math.sin(angle)
    return [[c, -s_, 0], [s_, c, 0], [0, 0, 1]]


def matmul(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(3)) for j in range(3)] for i in range(3)]


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
# Escondites: armarios, taquillas y ataúdes. Hiding.luau les pone un
# ProximityPrompt "Esconderse"; Verity puede sacarte si te encuentra.
# ---------------------------------------------------------------------------

HIDE_STYLES = {
    "wardrobe": {"body": (5, 8.4, 3.2), "color": (78, 50, 34), "mat": "Wood", "door": (96, 64, 42), "knob": (200, 170, 90)},
    "locker": {"body": (4.2, 8.4, 3), "color": (58, 86, 124), "mat": "Metal", "door": (70, 100, 140), "knob": (25, 25, 30)},
    "coffin": {"body": (4.2, 8.4, 2.6), "color": (42, 28, 22), "mat": "Wood", "door": (58, 38, 28), "knob": (170, 140, 80)},
    "confessional": {"body": (5.2, 9, 3.6), "color": (70, 40, 28), "mat": "WoodPlanks", "door": (110, 25, 35), "knob": (200, 170, 90)},
}


def hide_spot(style, cx, cz, quarter, idx, base_y=0.0):
    st = HIDE_STYLES[style]
    bx, by, bz = st["body"]

    def rot(lx, lz):
        for _ in range(quarter):
            lx, lz = -lz, lx
        return lx, lz

    def rsize(sx, sz):
        return (sz, sx) if quarter % 2 else (sx, sz)

    nodes = []
    sx, sz = rsize(bx, bz)
    nodes.append(part("Body", (cx, base_y + by / 2, cz), (sx, by, sz), st["color"], st["mat"]))
    dx, dz = rot(0, -bz / 2 - 0.1)
    sx, sz = rsize(bx - 0.5, 0.2)
    nodes.append(part("Door", (cx + dx, base_y + by / 2, cz + dz), (sx, by - 0.5, sz), st["door"], st["mat"]))
    if style == "locker":
        for k in range(3):
            vx, vz = rot(0, -bz / 2 - 0.22)
            sx, sz = rsize(bx - 1.6, 0.05)
            nodes.append(part("Vent", (cx + vx, base_y + by - 1.2 - k * 0.45, cz + vz), (sx, 0.15, sz), (20, 22, 28), "SmoothPlastic"))
    if style == "coffin":
        cxx, czz = rot(0, -bz / 2 - 0.25)
        sx, sz = rsize(0.35, 0.1)
        nodes.append(part("Cross", (cx + cxx, base_y + by * 0.62, cz + czz), (sx, 2.2, sz), st["knob"], "Metal"))
        sx, sz = rsize(1.4, 0.1)
        nodes.append(part("Cross", (cx + cxx, base_y + by * 0.68, cz + czz), (sx, 0.35, sz), st["knob"], "Metal"))
    hx, hz = rot(0.4 if style != "coffin" else -1.2, -bz / 2 - 0.3)
    sx, sz = rsize(0.18, 0.2)
    nodes.append(part("Knob", (cx + hx, base_y + by * 0.48, cz + hz), (sx, 0.9, sz), st["knob"], "Metal"))
    hidden = dict(Transparency=1, CanCollide=False, CanQuery=False, CanTouch=False)
    nodes.append(part("HidePoint", (cx, base_y + 2.9, cz), (1, 1, 1), (255, 0, 0), **hidden))
    ex, ez = rot(0, -bz / 2 - 3.2)
    nodes.append(part("ExitPoint", (cx + ex, base_y + 3, cz + ez), (1, 1, 1), (0, 255, 0), **hidden))
    node = container("Model", f"HideSpot{idx}", nodes)
    node["attributes"] = {"HideSpot": True, "Style": style}
    return node


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
        "seed": 7, "cols": 5, "rows": 5, "cell": 44, "height": 24, "hide": "wardrobe",
        "floor": ((78, 54, 44), "WoodPlanks"), "wall": ((70, 58, 72), "Plaster"),
        "outer": ((52, 40, 50), "Brick"), "ceiling": ((30, 24, 32), "Plaster"),
        "trim": (40, 28, 26), "rug": [(110, 22, 32), (40, 34, 70), (70, 50, 30)],
        "lamp": (255, 170, 120), "lamp_brightness": 0.9,
        "props": [dresser, bookshelf, sofa, grandfather_clock, dining_table, piano],
    },
    "Hospital": {
        "seed": 21, "cols": 6, "rows": 4, "cell": 42, "height": 22, "hide": "locker",
        "floor": ((170, 182, 176), "Marble"), "wall": ((150, 176, 168), "Plaster"),
        "outer": ((110, 120, 118), "Concrete"), "ceiling": ((120, 130, 128), "Concrete"),
        "trim": (90, 110, 104), "rug": [],
        "lamp": (190, 235, 255), "lamp_brightness": 0.8,
        "props": [bed, bed, med_cabinet, curtain, med_cart, wheelchair],
    },
    "Oficina": {
        "seed": 33, "cols": 5, "rows": 5, "cell": 42, "height": 22, "hide": "locker",
        "floor": ((95, 104, 118), "Fabric"), "wall": ((215, 212, 200), "Plaster"),
        "outer": ((90, 95, 105), "Concrete"), "ceiling": ((200, 200, 195), "Plaster"),
        "trim": (80, 85, 95), "rug": [],
        "lamp": (230, 240, 255), "lamp_brightness": 0.9,
        "props": [cubicle, cubicle, cubicle, water_cooler, printer, filing, plant],
    },
    "Banco": {
        "seed": 55, "cols": 5, "rows": 4, "cell": 44, "height": 24, "hide": "locker",
        "floor": ((225, 220, 210), "Marble"), "wall": ((180, 160, 120), "Plaster"),
        "outer": ((150, 130, 100), "Sandstone"), "ceiling": ((200, 190, 170), "Plaster"),
        "trim": (120, 90, 50), "rug": [(130, 20, 30)],
        "lamp": (255, 220, 160), "lamp_brightness": 0.9,
        "props": [teller, vault_door, gold_stack, money_bags, rope_posts, column, plant],
    },
    "Hotel": {
        "seed": 77, "cols": 6, "rows": 4, "cell": 40, "height": 22, "hide": "wardrobe",
        "floor": ((110, 25, 35), "Fabric"), "wall": ((210, 190, 150), "Plaster"),
        "outer": ((120, 80, 60), "Brick"), "ceiling": ((230, 220, 200), "Plaster"),
        "trim": (70, 45, 30), "rug": [(200, 160, 80)],
        "lamp": (255, 210, 150), "lamp_brightness": 0.85,
        "props": [double_bed, double_bed, nightstand, luggage_cart, reception, armchair, plant],
    },
    "Fábrica": {
        "seed": 91, "cols": 5, "rows": 5, "cell": 46, "height": 24, "hide": "locker",
        "floor": ((110, 110, 105), "Concrete"), "wall": ((120, 110, 100), "CorrodedMetal"),
        "outer": ((100, 95, 90), "DiamondPlate"), "ceiling": ((70, 70, 72), "Metal"),
        "trim": (200, 170, 40), "rug": [],
        "lamp": (255, 230, 180), "lamp_brightness": 0.85,
        "props": [crate_stack, barrels, conveyor, pipes, machine, shelf_rack],
    },
    "Escuela Nocturna": {
        "seed": 42, "cols": 5, "rows": 5, "cell": 40, "height": 22, "hide": "locker",
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
    structure, decor, lights, hides = [], [], [], []
    walls = set()  # (eje, posición fija, inicio) de cada tramo de pared que existe
    doors = []  # (eje, posición fija, desde, hasta) de cada hueco de puerta

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
        walls.add((axis, round(fixed, 2), round(start, 2)))
        if rng.random() < 0.3:
            gaps = [rng.uniform(DOOR * 0.75, length / 2 - DOOR * 0.75), rng.uniform(length / 2 + DOOR * 0.75, length - DOOR * 0.75)]
        else:
            gaps = [rng.uniform(DOOR, length - DOOR)]
        cursor = 0
        for g in gaps:
            doors.append((axis, round(fixed, 2), start + g - DOOR / 2 - 1.5, start + g + DOOR / 2 + 1.5))
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

    # Escondites contra las paredes, lejos de los huecos de las puertas.
    style = t.get("hide", "wardrobe")
    body_depth = HIDE_STYLES[style]["body"][2]
    for i in range(cols):
        for j in range(rows):
            if rng.random() > 0.6:
                continue
            cx0, cz0 = x0 + i * cell, z0 + j * cell
            sides = []
            # (eje de la pared, posición fija, inicio del tramo, existe, cuarto de giro, signo hacia dentro)
            sides.append(("z", z0 + j * cell, cx0, j == 0, 2, 1))
            sides.append(("z", z0 + (j + 1) * cell, cx0, j == rows - 1, 0, -1))
            sides.append(("x", x0 + i * cell, cz0, i == 0, 1, 1))
            sides.append(("x", x0 + (i + 1) * cell, cz0, i == cols - 1, 3, -1))
            rng.shuffle(sides)
            for axis, fixed, start, outer, quarter, inward in sides:
                if not outer and (axis, round(fixed, 2), round(start, 2)) not in walls:
                    continue
                placed = False
                for along in rng.sample([4.5, cell - 4.5, cell / 2], 3):
                    a = start + along
                    if any(dx == axis and abs(df - round(fixed, 2)) < 0.01 and lo - 3 < a < hi + 3 for dx, df, lo, hi in doors):
                        continue
                    offset = fixed + inward * (1.0 + body_depth / 2)
                    hx, hz = (a, offset) if axis == "z" else (offset, a)
                    if any(math.dist((hx, hz), b) < 6 for b in blocked):
                        continue
                    hides.append(hide_spot(style, hx, hz, quarter, len(hides) + 1))
                    blocked.append((hx, hz))
                    placed = True
                    break
                if placed:
                    break

    for cx, cz in centers:
        # habitaciones más oscuras; algunas sin luz para esconderse
        if rng.random() > 0.18:
            lamp = part("Lamp", (cx, h - 0.4, cz), (2.4, 0.6, 2.4), t["lamp"], "Neon", CanCollide=False,
                        Tags=["MansionLamp"], attributes={"Flicker": rng.random() < 0.45},
                        children=[point_light(t["lamp"], 24, t["lamp_brightness"] * 0.7, True)])
            lights.append(lamp)
        if t["rug"] and rng.random() < 0.7:
            decor.append(part("Rug", (cx, 0.05, cz), (rng.choice([12, 14, 16]), 0.1, rng.choice([10, 12])), rng.choice(t["rug"]), "Fabric", CanCollide=False))
        for _ in range(rng.randint(3, 5)):
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
            container("Folder", "HideSpots", hides),
            container("Folder", "SurvivorSpawns", survivor_spawns),
            marker("KillerSpawn", kx, kz),
            container("Folder", "GoldSpawns", gold),
            container("Folder", "CraftingTables", tables),
        ],
    }


# ---------------------------------------------------------------------------
# Mapas al aire libre de noche (Bosque Nocturno y Cementerio)
# ---------------------------------------------------------------------------

OUTDOOR = {
    "Bosque Nocturno": {"seed": 101, "size": 300, "kind": "forest"},
    "Cementerio": {"seed": 202, "size": 280, "kind": "cemetery"},
}

HIDDEN = dict(Transparency=1, CanCollide=False, CanQuery=False, CanTouch=False)


def tree(rng, x, z, dead=False):
    h = rng.uniform(18, 28)
    dia = rng.uniform(1.6, 2.6)
    bark = (58, 42, 32) if not dead else (52, 46, 44)
    nodes = [part("Trunk", (x, h / 2, z), (h, dia, dia), bark, "Wood", Shape="Cylinder", orientation=ROT_Z90)]
    if dead:
        for _ in range(rng.randint(2, 4)):
            yaw = rng.uniform(0, math.tau)
            tilt = math.radians(rng.uniform(30, 60))
            length = rng.uniform(5, 9)
            y = h * rng.uniform(0.5, 0.9)
            direction = (math.cos(tilt) * math.cos(yaw), math.sin(tilt), -math.cos(tilt) * math.sin(yaw))
            center = (x + direction[0] * length / 2, y + direction[1] * length / 2, z + direction[2] * length / 2)
            nodes.append(part("Branch", center, (length, dia * 0.35, dia * 0.35), bark, "Wood", Shape="Cylinder",
                              orientation=matmul(ry(yaw), rz(tilt))))
    else:
        for k in range(rng.randint(2, 3)):
            r = rng.uniform(8, 12)
            green = (24 + rng.randint(0, 14), 44 + rng.randint(0, 18), 26 + rng.randint(0, 8))
            nodes.append(part("Leaves", (x + rng.uniform(-2, 2), h * 0.72 + k * 3.5, z + rng.uniform(-2, 2)), (r, r, r), green, "Grass",
                              Shape="Ball", CanCollide=False))
    return container("Model", "Tree", nodes)


def lamp_post(x, z, color=(255, 190, 120)):
    return container("Model", "LampPost", [
        part("Pole", (x, 5, z), (10, 0.5, 0.5), (30, 30, 34), "Metal", Shape="Cylinder", orientation=ROT_Z90),
        part("Lantern", (x, 10.6, z), (1.2, 1.4, 1.2), color, "Neon", CanCollide=False,
             Tags=["MansionLamp"], attributes={"Flicker": True},
             children=[point_light(color, 28, 0.9, True)]),
        part("Cap", (x, 11.5, z), (1.8, 0.3, 1.8), (30, 30, 34), "Metal"),
    ])


def building(cx, cz, quarter, w, d, h, wall, wall_mat, roof, door_w=12, door_h=18, extras=()):
    """Construcción rectangular con una puerta en el lado -Z local (girada `quarter`)."""
    def rot(lx, lz):
        for _ in range(quarter):
            lx, lz = -lz, lx
        return lx, lz

    def rsize(sx, sz):
        return (sz, sx) if quarter % 2 else (sx, sz)

    def add(name, lx, y, lz, sx, sy, sz, color, mat, **props):
        px, pz = rot(lx, lz)
        a, b = rsize(sx, sz)
        nodes.append(part(name, (cx + px, y, cz + pz), (a, sy, b), color, mat, **props))

    nodes = []
    add("Floor", 0, 0.1, 0, w, 0.2, d, (70, 52, 40), "WoodPlanks")
    add("WallBack", 0, h / 2, d / 2, w, h, 1.2, wall, wall_mat)
    add("WallLeft", -w / 2, h / 2, 0, 1.2, h, d, wall, wall_mat)
    add("WallRight", w / 2, h / 2, 0, 1.2, h, d, wall, wall_mat)
    side = (w - door_w) / 2
    add("WallFront", -(door_w / 2 + side / 2), h / 2, -d / 2, side, h, 1.2, wall, wall_mat)
    add("WallFront", door_w / 2 + side / 2, h / 2, -d / 2, side, h, 1.2, wall, wall_mat)
    add("Lintel", 0, door_h + (h - door_h) / 2, -d / 2, door_w, h - door_h, 1.2, wall, wall_mat)
    add("Roof", 0, h + 0.8, 0, w + 3, 1.6, d + 3, roof, "Slate")
    for e in extras:
        add(*e)
    return nodes, rot


def build_outdoor(name, t, origin):
    rng = random.Random(t["seed"])
    size = t["size"]
    ox, oz = origin
    half = size / 2
    forest = t["kind"] == "forest"
    structure, decor, lights, hides = [], [], [], []
    blocked = []  # (x, z, radio)

    def free(x, z, r):
        return all(math.dist((x, z), (bx, bz)) >= r + br for bx, bz, br in blocked)

    def random_point(r, tries=60, margin=14):
        for _ in range(tries):
            x = ox + rng.uniform(-half + margin, half - margin)
            z = oz + rng.uniform(-half + margin, half - margin)
            if free(x, z, r):
                return x, z
        return None

    ground = (30, 46, 28) if forest else (34, 40, 30)
    structure.append(part("Ground", (ox, -1, oz), (size + 80, 2, size + 80), ground, "Grass"))
    for (px, pz, sx, sz) in [(ox, oz - half, size, 2), (ox, oz + half, size, 2), (ox - half, oz, 2, size), (ox + half, oz, 2, size)]:
        structure.append(part("Boundary", (px, 30, pz), (sx, 60, sz), (0, 0, 0), **dict(HIDDEN, CanCollide=True)))

    # caminos
    path_color = (74, 60, 44) if forest else (96, 92, 86)
    path_mat = "Ground" if forest else "Pebble"
    for sx, sz in ((size - 30, 7), (7, size - 30)):
        decor.append(part("Path", (ox, 0.03, oz), (sx, 0.06, sz), path_color, path_mat, CanCollide=False))

    hide_count = 0

    def add_hide(style, x, z, quarter):
        nonlocal hide_count
        hide_count += 1
        hides.append(hide_spot(style, x, z, quarter, hide_count))

    if forest:
        # claro central con fogata, troncos para sentarse y tiendas
        blocked.append((ox, oz, 26))
        fire = [
            part("FirePit", (ox, 0.4, oz), (0.8, 6, 6), (70, 70, 72), "Slate", Shape="Cylinder", orientation=ROT_Z90),
            part("Embers", (ox, 1, oz), (2, 0.6, 2), (255, 110, 40), "Neon", CanCollide=False,
                 Tags=["MansionLamp"], attributes={"Flicker": True},
                 children=[point_light((255, 140, 60), 45, 2.2, True),
                           {"className": "Fire", "properties": {"Size": 6, "Heat": 12,
                                                                "Color": rgb(255, 120, 40), "SecondaryColor": rgb(255, 60, 20)}}]),
        ]
        for k in range(4):
            a = k * math.pi / 2 + math.pi / 4
            lx, lz = ox + math.cos(a) * 10, oz + math.sin(a) * 10
            fire.append(part("LogSeat", (lx, 0.9, lz), (8, 1.8, 1.8), (74, 52, 36), "Wood", Shape="Cylinder", orientation=ry(-a + math.pi / 2)))
        decor.append(container("Model", "Campfire", fire))
        for k in range(3):
            a = k * 2.1 + 0.6
            tx, tz = ox + math.cos(a) * 19, oz + math.sin(a) * 19
            color = [(120, 40, 40), (40, 80, 60), (60, 60, 110)][k]
            yaw = -a
            tent = []
            for side in (-1, 1):
                r = ry(yaw)
                vx = side * 2.3
                tent.append(part("TentSide", (tx + r[0][0] * vx, 1.95, tz + r[2][0] * vx), (6, 0.3, 8), color, "Fabric",
                                 orientation=matmul(ry(yaw), rz(-side * math.radians(40)))))
            decor.append(container("Model", "Tent", tent))
        # cabañas en las esquinas, con la puerta mirando al centro
        for k, (dx, dz) in enumerate(((-1, -1), (1, -1), (1, 1), (-1, 1))):
            bx, bz = ox + dx * (half - 60), oz + dz * (half - 60)
            # la puerta (lado -Z local) mira al centro
            quarter = {(-1, -1): 2, (1, -1): 2, (1, 1): 0, (-1, 1): 0}[(dx, dz)]
            nodes, rot = building(bx, bz, quarter, 28, 22, 22, (88, 60, 40), "WoodPlanks", (40, 30, 26))
            lx, lz = rot(0, 4)
            nodes.append(part("Lantern", (bx + lx, 15, bz + lz), (1, 1.2, 1), (255, 180, 100), "Neon", CanCollide=False,
                              Tags=["MansionLamp"], attributes={"Flicker": True}, children=[point_light((255, 180, 110), 22, 0.9, True)]))
            decor.append(container("Model", f"Cabin{k + 1}", nodes))
            for hx_local in (-9, 9):
                hx, hz = rot(hx_local, 8)
                add_hide("wardrobe", bx + hx, bz + hz, quarter)
            blocked.append((bx, bz, 22))
        for k in range(8):
            a = k * math.pi / 4
            lx, lz = ox + math.cos(a) * 55, oz + math.sin(a) * 55
            lights.append(lamp_post(lx + 5, lz + 5))
            blocked.append((lx + 5, lz + 5, 3))
        # arbustos (cobertura) y rocas
        for _ in range(45):
            pt = random_point(4)
            if pt:
                r = rng.uniform(4, 7)
                decor.append(part("Bush", (pt[0], r * 0.35, pt[1]), (r, r, r), (26, 50, 26), "Grass", Shape="Ball"))
                blocked.append((pt[0], pt[1], r / 2))
        for _ in range(20):
            pt = random_point(3)
            if pt:
                r = rng.uniform(2.5, 5)
                decor.append(part("Rock", (pt[0], r * 0.3, pt[1]), (r, r * 0.7, r * 1.2), (80, 80, 84), "Slate"))
                blocked.append((pt[0], pt[1], r / 2))
        tree_count, dead = 95, False
    else:
        # capilla al fondo, criptas y lápidas
        cx, cz = ox, oz - half + 50
        nodes, rot = building(cx, cz, 2, 44, 34, 26, (92, 92, 98), "Slate", (40, 40, 46), door_w=14, door_h=20)
        for row in range(5):
            for sgn in (-1, 1):
                px, pz = rot(sgn * 9, 6 - row * 5)
                nodes.append(part("Pew", (cx + px, 1.2, cz + pz), (12, 2.4, 2), (70, 46, 32), "WoodPlanks"))
        ax, az = rot(0, 13)  # al fondo, frente a la puerta
        nodes.append(part("Altar", (cx + ax, 2, cz + az), (10, 4, 3), (200, 195, 185), "Marble"))
        for k in (-4, 4):
            kx, kz = rot(k, 13)
            nodes.append(part("Candle", (cx + kx, 4.8, cz + kz), (0.5, 1.6, 0.5), (250, 240, 220), "SmoothPlastic",
                              children=[point_light((255, 190, 110), 26, 1.2, True)]))
        decor.append(container("Model", "Chapel", nodes))
        for hx_local in (-17, 17):
            hx, hz = rot(hx_local, 12)
            add_hide("confessional", cx + hx, cz + hz, 2)
        blocked.append((cx, cz, 32))
        for k, (dx, dz) in enumerate(((-1, 0.1), (1, 0.1), (-0.65, 0.85), (0.65, 0.85))):
            bx, bz = ox + dx * (half - 45), oz + dz * (half - 50)
            quarter = 1 if dx < 0 else 3
            nodes, rot = building(bx, bz, quarter, 18, 22, 22, (150, 148, 140), "Marble", (60, 60, 64))
            lx, lz = rot(0, 2)
            nodes.append(part("Candle", (bx + lx, 3, bz + lz), (0.5, 1.4, 0.5), (250, 240, 220), "SmoothPlastic",
                              Tags=["MansionLamp"], attributes={"Flicker": True}, children=[point_light((255, 170, 90), 18, 1, True)]))
            decor.append(container("Model", f"Crypt{k + 1}", nodes))
            for hx_local in (-4.5, 4.5):
                hx, hz = rot(hx_local, 8.5)
                add_hide("coffin", bx + hx, bz + hz, quarter)
            blocked.append((bx, bz, 17))
        # verja perimetral
        inset = half - 6
        for k in range(int(size / 8)):
            a = -inset + k * (2 * inset) / int(size / 8)
            for px, pz in ((ox + a, oz - inset), (ox + a, oz + inset), (ox - inset, oz + a), (ox + inset, oz + a)):
                decor.append(part("FencePost", (px, 4.5, pz), (0.5, 9, 0.5), (28, 28, 32), "Metal"))
        for px, pz, sx, sz in ((ox, oz - inset, 2 * inset, 0.3), (ox, oz + inset, 2 * inset, 0.3), (ox - inset, oz, 0.3, 2 * inset), (ox + inset, oz, 0.3, 2 * inset)):
            for y in (2.5, 7.5):
                decor.append(part("FenceRail", (px, y, pz), (sx, 0.3, sz), (28, 28, 32), "Metal"))
        # lápidas en hileras
        for gx in range(-6, 7):
            for gz in range(-5, 6):
                x, z = ox + gx * 17 + rng.uniform(-2, 2), oz + gz * 19 + rng.uniform(-2, 2)
                if not free(x, z, 3) or rng.random() < 0.25:
                    continue
                yaw = math.radians(rng.uniform(-8, 8))
                if rng.random() < 0.3:
                    grave = [part("Cross", (x, 2.4, z), (0.6, 4.8, 0.6), (150, 150, 155), "Marble", orientation=ry(yaw)),
                             part("CrossArm", (x, 3.4, z), (2.6, 0.6, 0.6), (150, 150, 155), "Marble", orientation=ry(yaw))]
                else:
                    grave = [part("Headstone", (x, 1.6, z), (2.6, 3.2, 0.7), (105, 105, 112), "Slate", orientation=ry(yaw))]
                grave.append(part("Mound", (x, 0.25, z + 3.4), (3, 0.5, 5.5), (60, 48, 36), "Ground"))
                decor.append(container("Model", "Grave", grave))
                blocked.append((x, z + 1.5, 3.5))
        for k in range(10):
            a = k * math.tau / 10
            lx, lz = ox + math.cos(a) * 70, oz + math.sin(a) * 70
            if free(lx, lz, 2):
                lights.append(lamp_post(lx, lz, (190, 210, 255)))
                blocked.append((lx, lz, 2))
        tree_count, dead = 30, True

    # árboles interiores y anillo exterior que cierra el mapa
    for _ in range(tree_count):
        pt = random_point(5)
        if pt and abs(pt[0] - ox) > 6 and abs(pt[1] - oz) > 6:
            decor.append(tree(rng, pt[0], pt[1], dead))
            blocked.append((pt[0], pt[1], 3))
    ring = []
    per_side = int(size / 12)
    for k in range(per_side * 4):
        a = -half + (k % per_side) * 12 + 6
        side = k // per_side
        px, pz = [(ox + a, oz - half - 4), (ox + a, oz + half + 4), (ox - half - 4, oz + a), (ox + half + 4, oz + a)][side]
        ring.append(tree(rng, px, pz, dead=not forest and rng.random() < 0.6))
    decor.append(container("Folder", "TreeLine", ring))

    # marcadores de juego
    kx, kz = (ox, oz + 12) if forest else (ox, oz + 8)
    blocked.append((kx, kz, 4))
    survivor_spawns = []
    for i in range(16):
        for _ in range(40):
            pt = random_point(3)
            if pt and math.dist(pt, (kx, kz)) > 70:
                survivor_spawns.append(marker(f"Spawn{i + 1}", pt[0], pt[1]))
                blocked.append((pt[0], pt[1], 3))
                break
    gold = []
    for i in range(44):
        pt = random_point(2)
        if pt:
            gold.append(marker(f"Gold{i + 1}", pt[0], pt[1], (1, 1, 1)))
    tables = []
    for i in range(3):
        for _ in range(60):
            pt = random_point(6, margin=30)
            if pt and math.dist(pt, (kx, kz)) > 60 and all(math.dist(pt, tb) > 70 for tb in [(n["properties"]["CFrame"]["CFrame"]["position"][0], n["properties"]["CFrame"]["CFrame"]["position"][2]) for n in tables]):
                tables.append(marker(f"Table{i + 1}", pt[0], pt[1], (6, 1, 4)))
                blocked.append((pt[0], pt[1], 6))
                break

    return {
        "className": "Model",
        "attributes": {"Outdoor": True},
        "children": [
            container("Folder", "Structure", structure),
            container("Folder", "Decor", decor),
            container("Folder", "Lights", lights),
            container("Folder", "HideSpots", hides),
            container("Folder", "SurvivorSpawns", survivor_spawns),
            marker("KillerSpawn", kx, kz),
            container("Folder", "GoldSpawns", gold),
            container("Folder", "CraftingTables", tables),
        ],
    }


# ---------------------------------------------------------------------------
# La bola sonriente: el diseño original de Verity antes de transformarse.
# Se guarda en ServerStorage.VerityBall; Killer.luau la coloca en la ronda.
# ---------------------------------------------------------------------------

def build_ball():
    radius = 3.5
    nodes = [part("Core", (0, 0, 0), (radius * 2, radius * 2, radius * 2), (236, 206, 66), "SmoothPlastic", Shape="Ball",
                  CanCollide=False, CanQuery=False, children=[point_light((255, 220, 120), 14, 0.7)])]
    for side in (-1, 1):
        ex, ey = side * 1.15, 1.05
        ez = -math.sqrt(radius ** 2 - ex ** 2 - ey ** 2) + 0.3
        nodes.append(part("Eye", (ex, ey, ez), (1.25, 1.25, 1.25), (8, 6, 6), Shape="Ball", CanCollide=False, CanQuery=False))
        nodes.append(part("Pupil", (ex - side * 0.14, ey + 0.16, ez - 0.52), (0.3, 0.3, 0.3), (255, 255, 255), "Neon",
                          Shape="Ball", CanCollide=False, CanQuery=False))
    lines = [{"className": "Frame", "properties": {"Size": {"UDim2": [[0, 3], [1, 0]]}, "Position": {"UDim2": [[0.5, -1], [0, 0]]},
                                                   "BackgroundColor3": [0.35, 0.3, 0.25], "BorderSizePixel": 0}},
             {"className": "Frame", "properties": {"Size": {"UDim2": [[1, 0], [0, 3]]}, "Position": {"UDim2": [[0, 0], [0.5, -1]]},
                                                   "BackgroundColor3": [0.35, 0.3, 0.25], "BorderSizePixel": 0}}]
    for k in range(9):
        x = -2.2 + k * 0.55
        y = -0.75 + 0.13 * x * x
        z = -math.sqrt(max(0.1, radius ** 2 - x * x - y * y))
        rxz = math.sqrt(x * x + z * z)
        nx, nz = x / rxz, z / rxz
        orient = ry(-math.asin(nx))
        nodes.append(part("Mouth", (x + nx * 0.02, y, z + nz * 0.02), (0.62, 1.05, 0.3), (70, 10, 16), CanCollide=False, CanQuery=False,
                          orientation=orient))
        nodes.append(part("Teeth", (x + nx * 0.14, y, z + nz * 0.14), (0.56, 0.74, 0.1), (245, 240, 225), CanCollide=False, CanQuery=False,
                          orientation=orient, children=[{"className": "SurfaceGui",
                                                         "properties": {"Face": "Front", "SizingMode": "PixelsPerStud", "PixelsPerStud": 80},
                                                         "children": lines}]))
    return {"className": "Model", "attributes": {"VerityBall": True}, "children": nodes}


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
    write(OUT / "VerityBall.model.json", build_ball())
    maps_dir = OUT / "Maps"
    for old in maps_dir.glob("*.model.json"):
        old.unlink()
    names = list(THEMES) + list(OUTDOOR)
    for i, name in enumerate(names):
        origin = ((i - (len(names) - 1) / 2) * 400, 0)
        if name in THEMES:
            data = build_map(name, THEMES[name], origin)
        else:
            data = build_outdoor(name, OUTDOOR[name], origin)
        write(maps_dir / f"{name}.model.json", data)
    old_character = OUT / "VerityCharacter.model.json"
    if old_character.exists():
        old_character.unlink()
    print("Mundo generado en", OUT)


if __name__ == "__main__":
    main()
