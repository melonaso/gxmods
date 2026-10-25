#!/usr/bin/env python3
"""Genera el lobby y los mapas como modelos de Rojo (.model.json).

Uso:  python3 tools/generate_world.py
Salida: src/world/Lobby.model.json y src/world/Maps/*.model.json

Cada mapa sigue la estructura que espera MapService:
  SurvivorSpawns (Folder), KillerSpawn (Part), GoldSpawns (Folder),
  CraftingTables (Folder). Los marcadores son Parts invisibles cuya base
  está a ras de suelo.
"""

import json
import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "world"

IDENTITY = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]


def rgb(r, g, b):
    return [round(r / 255, 4), round(g / 255, 4), round(b / 255, 4)]


def cframe(x, y, z):
    return {"CFrame": {"position": [round(x, 3), round(y, 3), round(z, 3)], "orientation": IDENTITY}}


def part(name, pos, size, color, material="SmoothPlastic", **props):
    p = {
        "Anchored": True,
        "CFrame": cframe(*pos),
        "Size": [round(s, 3) for s in size],
        "Color": rgb(*color),
        "Material": material,
        "TopSurface": "Smooth",
        "BottomSurface": "Smooth",
    }
    attributes = props.pop("attributes", None)
    children = props.pop("children", None)
    p.update(props)
    node = {"name": name, "className": "Part", "properties": p}
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


def marker(name, x, z, size=(4, 1, 4), y0=0.0):
    """Part invisible con la base en y0."""
    return part(name, (x, y0 + size[1] / 2, z), size, (255, 0, 0), "SmoothPlastic",
                Transparency=1, CanCollide=False, CanQuery=False, CanTouch=False)


# ---------------------------------------------------------------------------
# Props: listas de piezas en coordenadas locales (x, y_base, z, sx, sy, sz, color, material)
# Se rotan en múltiplos de 90° intercambiando ejes.
# ---------------------------------------------------------------------------

def place(prop_name, pieces, cx, cz, quarter):
    out = []
    for i, (lx, ly, lz, sx, sy, sz, color, mat) in enumerate(pieces):
        for _ in range(quarter):
            lx, lz = -lz, lx
            sx, sz = sz, sx
        out.append(part(f"{prop_name}{i}", (cx + lx, ly + sy / 2, cz + lz), (sx, sy, sz), color, mat))
    return container("Model", prop_name, out)


WOOD = (101, 67, 45)
DARK_WOOD = (70, 46, 32)


def dresser():
    return [(0, 0, 0, 6, 4, 3, WOOD, "Wood"), (0, 4, 0, 6.2, 0.3, 3.2, DARK_WOOD, "Wood"),
            (-1.5, 1.5, -1.55, 2.4, 0.3, 0.1, (200, 170, 90), "Metal"), (1.5, 1.5, -1.55, 2.4, 0.3, 0.1, (200, 170, 90), "Metal")]


def bookshelf():
    pieces = [(0, 0, 0, 5, 9, 2, DARK_WOOD, "Wood")]
    colors = [(120, 30, 40), (40, 70, 110), (60, 100, 60), (150, 120, 60)]
    for row, y in enumerate((1.2, 3.6, 6.0)):
        x = -2.0
        while x < 2.0:
            w = 0.35 + (hash((row, x)) % 3) * 0.1
            pieces.append((x + w / 2, y, -0.55, w, 1.8, 0.9, colors[int(x * 10 + row) % 4], "SmoothPlastic"))
            x += w + 0.05
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
    p.append((0, 3.4, 0, 0.5, 1.4, 0.5, (240, 230, 200), "SmoothPlastic"))  # vela
    return p


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
            (1.6, 3.25, 0, 1.2, 0.9, 0.9, (200, 40, 40), "SmoothPlastic")]  # manzana


def chalk_cart():
    return [(0, 0, 0, 5, 1, 1.5, (90, 92, 98), "Metal"), (0, 1, 0, 5, 4, 0.3, (40, 60, 50), "Slate")]


THEMES = {
    "Mansión de Verity": {
        "seed": 7, "cols": 4, "rows": 4, "cell": 40, "height": 18,
        "floor": ((78, 54, 44), "WoodPlanks"), "wall": ((70, 58, 72), "Plaster"),
        "outer": ((52, 40, 50), "Brick"), "ceiling": ((30, 24, 32), "Plaster"),
        "trim": (40, 28, 26), "rug": [(110, 22, 32), (40, 34, 70), (70, 50, 30)],
        "lamp": (255, 170, 120), "lamp_brightness": 0.9,
        "props": [dresser, bookshelf, sofa, grandfather_clock, dining_table],
        "origin": (0, 0),
    },
    "Hospital Abandonado": {
        "seed": 21, "cols": 5, "rows": 3, "cell": 38, "height": 16,
        "floor": ((170, 182, 176), "Marble"), "wall": ((150, 176, 168), "Plaster"),
        "outer": ((110, 120, 118), "Concrete"), "ceiling": ((120, 130, 128), "Concrete"),
        "trim": (90, 110, 104), "rug": [],
        "lamp": (190, 235, 255), "lamp_brightness": 0.8,
        "props": [bed, bed, med_cabinet, curtain, med_cart],
        "origin": (320, 0),
    },
    "Escuela Nocturna": {
        "seed": 42, "cols": 4, "rows": 4, "cell": 36, "height": 15,
        "floor": ((120, 112, 100), "Concrete"), "wall": ((200, 190, 160), "Plaster"),
        "outer": ((150, 80, 60), "Brick"), "ceiling": ((160, 158, 150), "Concrete"),
        "trim": (60, 90, 130), "rug": [(60, 90, 130)],
        "lamp": (255, 245, 210), "lamp_brightness": 0.75,
        "props": [desk_row, desk_row, lockers, teacher_desk, chalk_cart],
        "origin": (-300, 0),
    },
}

DOOR = 10


def build_map(name, t):
    rng = random.Random(t["seed"])
    cols, rows, cell, h = t["cols"], t["rows"], t["cell"], t["height"]
    ox, oz = t["origin"]
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
        size = (1.5, h - 10, DOOR) if axis == "x" else (DOOR, h - 10, 1.5)
        pos = (fixed, 10 + (h - 10) / 2, center) if axis == "x" else (center, 10 + (h - 10) / 2, fixed)
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

    for n, (cx, cz) in enumerate(centers):
        lamp = part("Lamp", (cx, h - 0.4, cz), (2.4, 0.6, 2.4), t["lamp"], "Neon", CanCollide=False,
                    Tags=["MansionLamp"], attributes={"Flicker": rng.random() < 0.35},
                    children=[point_light(t["lamp"], 26, t["lamp_brightness"], True)])
        lights.append(lamp)
        if t["rug"] and rng.random() < 0.7:
            decor.append(part("Rug", (cx, 0.05, cz), (rng.choice([12, 14, 16]), 0.1, rng.choice([10, 12])), rng.choice(t["rug"]), "Fabric", CanCollide=False))
        for k in range(rng.randint(2, 4)):
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
    tables = []
    used = set()
    for c in far:
        if len(tables) >= 3:
            break
        if any(math.dist(c, u) < cell * 1.2 for u in used):
            continue
        sx, sz = free_spot(*c, clearance=8)
        blocked.append((sx, sz))
        used.add(c)
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
# Lobby
# ---------------------------------------------------------------------------

def build_lobby():
    y = 300
    top = y + 1
    c = []
    c.append(part("Floor", (0, y, 0), (100, 2, 100), (60, 42, 36), "WoodPlanks"))
    c.append(part("Rug", (0, top + 0.05, 0), (34, 0.1, 34), (110, 22, 32), "Fabric", CanCollide=False))
    c.append(part("RugBorder", (0, top + 0.02, 0), (38, 0.05, 38), (200, 160, 80), "Fabric", CanCollide=False))
    wall_c, wall_m = (58, 44, 56), "Plaster"
    H = 16
    # muros con ventanales
    for (px, pz, sx, sz) in [(0, -50, 100, 2), (0, 50, 100, 2), (-50, 0, 2, 100), (50, 0, 2, 100)]:
        c.append(part("WallLow", (px, top + 2.5, pz), (sx, 5, sz), wall_c, wall_m))
        c.append(part("WallHigh", (px, top + 13.5, pz), (sx, 5, sz), wall_c, wall_m))
        c.append(part("Window", (px, top + 8, pz), (sx * 0.98 if sx > 2 else 0.4, 6, sz * 0.98 if sz > 2 else 0.4),
                      (90, 70, 140), "Glass", Transparency=0.55))
    # columnas
    for x in (-49, -25, 0, 25, 49):
        for z in (-49, 49):
            c.append(part("Pillar", (x, top + H / 2, z), (3, H, 3), (40, 30, 38), "Marble"))
            c.append(part("Pillar", (z, top + H / 2, x), (3, H, 3), (40, 30, 38), "Marble"))
    c.append(part("Ceiling", (0, top + H + 0.5, 0), (100, 1, 100), (34, 26, 34), "WoodPlanks"))
    # lámpara central
    c.append(part("Chandelier", (0, top + H - 2, 0), (6, 0.6, 6), (200, 160, 80), "Metal"))
    c.append(part("ChandelierGlow", (0, top + H - 2.8, 0), (2.5, 1, 2.5), (255, 200, 140), "Neon", Shape="Ball", CanCollide=False,
                  children=[point_light((255, 200, 140), 60, 1.6, True)]))
    for x in (-32, 32):
        for z in (-32, 32):
            c.append(part("WallLamp", (x, top + 9, z), (1.6, 1.6, 1.6), (255, 190, 120), "Neon", Shape="Ball", CanCollide=False,
                          children=[point_light((255, 190, 130), 36, 1.0)]))
    # bancos
    for z in (-20, 20):
        for x in (-38, 38):
            c.append(place("Bench", [(0, 1.2, 0, 3, 0.5, 12, (90, 60, 40), "Wood"), (0, 0, -5, 2.5, 1.2, 0.6, (50, 40, 38), "Metal"),
                                     (0, 0, 5, 2.5, 1.2, 0.6, (50, 40, 38), "Metal"), (1.3 if x > 0 else -1.3, 1.7, 0, 0.4, 2.4, 12, (90, 60, 40), "Wood")],
                           x, z, 0))
    # estatua de Verity sobre un pedestal
    statue = [
        (0, 0, 0, 7, 3, 7, (30, 26, 32), "Marble"),
        (0, 3, 0, 5.5, 0.3, 5.5, (200, 160, 80), "Metal"),
        (-0.55, 3.3, 0, 1, 3, 1, (18, 14, 20), "SmoothPlastic"),
        (0.55, 3.3, 0, 1, 3, 1, (18, 14, 20), "SmoothPlastic"),
        (0, 6.3, 0, 2.3, 3, 1.2, (20, 14, 22), "Fabric"),
        (-1.7, 6.5, 0, 1, 2.8, 1, (20, 14, 22), "Fabric"),
        (1.7, 6.5, -0.6, 1, 2.8, 1, (20, 14, 22), "Fabric"),
        (0, 9.3, 0, 1.6, 1.6, 1.6, (18, 14, 20), "SmoothPlastic"),
        (0, 9.2, 0.15, 2.1, 2.1, 1.9, (14, 10, 16), "Fabric"),  # capucha
        (-0.35, 9.9, -0.82, 0.3, 0.3, 0.1, (255, 40, 60), "Neon"),
        (0.35, 9.9, -0.82, 0.3, 0.3, 0.1, (255, 40, 60), "Neon"),
        (1.7, 7.6, -1.6, 0.25, 0.4, 2.6, (200, 205, 215), "Metal"),  # cuchillo
    ]
    statue_model = place("VerityStatue", statue, 0, -30, 0)
    # place() trabaja con y relativa al suelo 0: se sube al piso del lobby
    for p in statue_model["children"]:
        p["properties"]["CFrame"]["CFrame"]["position"][1] += top
    c.append(statue_model)
    statue_model["children"].append(part("StatueLight", (0, top + 12, -26), (0.5, 0.5, 0.5), (255, 40, 60), "Neon", Transparency=1, CanCollide=False,
                                  children=[point_light((255, 50, 70), 18, 2.0)]))
    # cartel
    c.append(part("Sign", (0, top + 10.5, 48.6), (40, 8, 0.6), (20, 14, 20), "SmoothPlastic", children=[{
        "className": "SurfaceGui",
        "properties": {"Face": "Front", "SizingMode": "PixelsPerStud", "PixelsPerStud": 30},
        "children": [{
            "className": "TextLabel",
            "properties": {
                "Size": {"UDim2": [[1, 0], [1, 0]]}, "BackgroundTransparency": 1, "RichText": True, "TextScaled": True,
                "Font": "GothamBlack", "TextColor3": [1, 1, 1],
                "Text": "MURDER MYSTERY\nbut <font color=\"#ff3b4e\">VERITY</font>",
            },
        }],
    }]))
    c.append({
        "name": "LobbySpawn", "className": "SpawnLocation",
        "properties": {"Anchored": True, "Neutral": True, "Duration": 0, "Size": [10, 1, 10], "CFrame": cframe(0, top + 0.5, 12),
                       "Transparency": 1, "CanCollide": False},
    })
    return {"className": "Model", "children": c}


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1))


def main():
    write(OUT / "Lobby.model.json", build_lobby())
    for name, theme in THEMES.items():
        write(OUT / "Maps" / f"{name}.model.json", build_map(name, theme))
    print("Mundo generado en", OUT)


if __name__ == "__main__":
    main()
