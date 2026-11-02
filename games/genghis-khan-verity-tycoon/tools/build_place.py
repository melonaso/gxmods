#!/usr/bin/env python3
"""Genera GenghisKhanVerityTycoon.rbxlx (lugar de Roblox Studio) sin Rojo.

Lee default.project.json y sigue las mismas reglas que Rojo:
  carpeta con init.server.luau -> Script, init.client.luau -> LocalScript
  x.server.luau -> Script, x.client.luau -> LocalScript, x.luau -> ModuleScript
  x.model.json  -> el modelo descrito (formato JSON de Rojo)
  otras carpetas -> Folder

Uso:  python3 tools/build_place.py   (desde la carpeta del juego)
"""

import base64
import json
import os
import struct
import sys
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "GenghisKhanVerityTycoon.rbxlx")

# Enums que aparecen en el modelo de Verity (valor numerico en el XML)
ENUMS = {
    "Material": {"SmoothPlastic": 272, "Plastic": 256, "Neon": 288, "Fabric": 1312, "Metal": 1088, "Wood": 512, "Slate": 800},
    "Technology": {"Legacy": 0, "Voxel": 1, "Compatibility": 2, "ShadowMap": 3, "Future": 4},
    "TopSurface": {"Smooth": 0},
    "Shape": {"Ball": 0, "Block": 1, "Cylinder": 2},
    "ChatVersion": {"LegacyChatService": 0, "TextChatService": 1},
    "BottomSurface": {"Smooth": 0},
    "MeshType": {"Head": 0, "Torso": 1, "Wedge": 2, "Sphere": 3, "Cylinder": 4, "Brick": 6},
    "RigType": {"R6": 0, "R15": 1},
    "DisplayDistanceType": {"Viewer": 0, "Subject": 1, "None": 2},
    "HealthDisplayType": {"DisplayWhenDamaged": 0, "AlwaysOn": 1, "AlwaysOff": 2},
}
BOOLS = {"Decoration", "Shadows", "GlobalShadows", "Anchored", "CanCollide", "CanQuery", "CanTouch", "Massless", "BreakJointsOnDeath", "RequiresNeck", "AutomaticScalingEnabled"}
FLOATS = {"GrassLength", "Range", "ShadowSoftness", "EnvironmentDiffuseScale", "EnvironmentSpecularScale", "Brightness", "Transparency", "HipHeight", "WalkSpeed", "Reflectance", "RespawnTime"}

_ref = 0


def next_ref():
    global _ref
    _ref += 1
    return f"RBX{_ref:08X}"


def xml_cframe(name, cf):
    pos = cf["position"]
    rot = cf.get("orientation", [[1, 0, 0], [0, 1, 0], [0, 0, 1]])
    parts = [f"<X>{pos[0]}</X><Y>{pos[1]}</Y><Z>{pos[2]}</Z>"]
    for i in range(3):
        for j in range(3):
            parts.append(f"<R{i}{j}>{rot[i][j]}</R{i}{j}>")
    return f'<CoordinateFrame name="{name}">{"".join(parts)}</CoordinateFrame>'


def xml_color3uint8(rgb):
    r, g, b = (max(0, min(255, round(c * 255))) for c in rgb)
    return f'<Color3uint8 name="Color3uint8">{(r << 16) | (g << 8) | b}</Color3uint8>'


def encode_attributes(attrs):
    """Formato binario de AttributesSerialize."""
    out = bytearray(struct.pack("<I", len(attrs)))

    def string(s):
        data = s.encode("utf-8")
        return struct.pack("<I", len(data)) + data

    for key, value in attrs.items():
        out += string(key)
        if isinstance(value, bool):
            out += b"\x03" + struct.pack("<B", 1 if value else 0)
        elif isinstance(value, (int, float)):
            out += b"\x06" + struct.pack("<d", float(value))
        elif isinstance(value, str):
            out += b"\x02" + string(value)
        elif isinstance(value, dict) and "Vector3" in value:
            out += b"\x11" + struct.pack("<fff", *value["Vector3"])
        elif isinstance(value, dict) and "String" in value:
            out += b"\x02" + string(value["String"])
        elif isinstance(value, dict) and "Bool" in value:
            out += b"\x03" + struct.pack("<B", 1 if value["Bool"] else 0)
        elif isinstance(value, dict) and ("Float64" in value or "Float32" in value):
            out += b"\x06" + struct.pack("<d", float(value.get("Float64", value.get("Float32"))))
        else:
            raise ValueError(f"atributo no soportado: {key}={value!r}")
    return base64.b64encode(bytes(out)).decode("ascii")


def xml_property(name, value, cls="Part"):
    if isinstance(value, dict) and "CFrame" in value:
        return xml_cframe(name, value["CFrame"])
    if name == "CFrame" and isinstance(value, dict):
        return xml_cframe(name, value)
    if name == "Size":
        return f'<Vector3 name="size"><X>{value[0]}</X><Y>{value[1]}</Y><Z>{value[2]}</Z></Vector3>'
    if name == "Color" and cls in ("Part", "MeshPart", "WedgePart", "TrussPart"):
        return xml_color3uint8(value)
    if name == "Color":
        return f'<Color3 name="Color"><R>{value[0]}</R><G>{value[1]}</G><B>{value[2]}</B></Color3>'
    if name == "Shape":
        return f'<token name="shape">{ENUMS["Shape"][value]}</token>'
    if name in ENUMS:
        return f'<token name="{name}">{ENUMS[name][value]}</token>'
    if name in BOOLS:
        return f'<bool name="{name}">{"true" if value else "false"}</bool>'
    if name in FLOATS:
        return f'<float name="{name}">{float(value)}</float>'
    if isinstance(value, bool):
        return f'<bool name="{name}">{"true" if value else "false"}</bool>'
    if isinstance(value, int):
        return f'<int name="{name}">{value}</int>'
    if isinstance(value, float):
        return f'<float name="{name}">{value}</float>'
    if isinstance(value, str):
        return f'<string name="{name}">{escape(value)}</string>'
    raise ValueError(f"propiedad no soportada: {name}={value!r}")


def item(cls, name, props_xml=(), children=(), source=None, attributes=None):
    lines = [f'<Item class="{cls}" referent="{next_ref()}"><Properties>', f'<string name="Name">{escape(name)}</string>']
    lines.extend(props_xml)
    if source is not None:
        safe = source.replace("]]>", "]]]]><![CDATA[>")
        lines.append(f'<string name="Source"><![CDATA[{safe}]]></string>')
    if attributes:
        lines.append(f'<BinaryString name="AttributesSerialize">{encode_attributes(attributes)}</BinaryString>')
    lines.append("</Properties>")
    lines.extend(children)
    lines.append("</Item>")
    return "\n".join(lines)


def model_json(node, name=None):
    props = [xml_property(k, v, node["className"]) for k, v in (node.get("properties") or {}).items()]
    if node["className"] == "Model":
        props.append('<bool name="NeedsPivotMigration">false</bool>')
    children = [model_json(c) for c in node.get("children", [])]
    return item(node["className"], name or node.get("name", node["className"]), props, children, attributes=node.get("attributes"))


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def script_class(filename):
    if filename.endswith(".server.luau") or filename.endswith(".server.lua"):
        return "Script"
    if filename.endswith(".client.luau") or filename.endswith(".client.lua"):
        return "LocalScript"
    return "ModuleScript"


def strip_ext(filename):
    for ext in (".server.luau", ".client.luau", ".server.lua", ".client.lua", ".luau", ".lua", ".model.json"):
        if filename.endswith(ext):
            return filename[: -len(ext)]
    return filename


def from_path(path, name):
    if os.path.isfile(path):
        if path.endswith(".model.json"):
            return model_json(json.loads(read(path)), name)
        return item(script_class(os.path.basename(path)), name, source=read(path))
    entries = sorted(os.listdir(path))
    init = next((e for e in entries if strip_ext(e) == "init" and (e.endswith(".luau") or e.endswith(".lua"))), None)
    children = [from_path(os.path.join(path, e), strip_ext(e)) for e in entries if e != init]
    if init:
        return item(script_class(init), name, children=children, source=read(os.path.join(path, init)))
    return item("Folder", name, children=children)


def from_tree(name, node):
    if "$path" in node:
        result = from_path(os.path.join(ROOT, node["$path"]), name)
        return result
    cls = node.get("$className", name)  # los servicios se llaman igual que su clase
    props = [xml_property(k, v) for k, v in (node.get("$properties") or {}).items() if k != "MaxPlayers"]
    children = [from_tree(k, v) for k, v in node.items() if not k.startswith("$")]
    return item(cls, name, props, children)


def main():
    project = json.loads(read(os.path.join(ROOT, "default.project.json")))
    tree = project["tree"]
    services = [from_tree(k, v) for k, v in tree.items() if not k.startswith("$")]
    names = [k for k in tree if not k.startswith("$")]
    for extra in ("Workspace", "Lighting"):
        if extra not in names:
            services.insert(0, item(extra, extra))
    xml = (
        '<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
        'xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">\n'
        + "\n".join(services)
        + "\n</roblox>\n"
    )
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(xml)
    print(f"OK {OUT} ({len(xml) // 1024} KB, {_ref} instancias)")


if __name__ == "__main__":
    sys.exit(main())
