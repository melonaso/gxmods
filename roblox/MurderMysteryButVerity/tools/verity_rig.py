"""Geometría de Verity (criatura amarilla de ~16 studs, 3x un jugador R15).

Espacio del modelo: pies en y = 0, mirando hacia -Z. Las uniones (Motor6D)
se crean en tiempo de ejecución por VerityRig.luau a partir de atributos:
  JointParent / JointPivot (Vector3, espacio del modelo) / Motor
  WeldTo  (piezas decorativas soldadas a otra pieza)
Las medidas deben coincidir con src/shared/VerityPose.luau.
"""

SKIN = (214, 194, 92)
SKIN_DARK = (168, 150, 62)
SKIN_SHADOW = (140, 124, 52)

HIP_HEIGHT = 7.0
ROOT_CENTER_Y = 8.2

# (nombre, centro, tamaño, color, extra) ; extra: joint=(padre, pivote, motor) | weld=padre | mesh/shape
BODY = [
    ("HumanoidRootPart", (0, ROOT_CENTER_Y, 0), (2, 2.4, 1), SKIN, {"root": True}),
    ("LowerTorso", (0, 7.45, 0), (1.5, 1.1, 0.8), SKIN, {"joint": ("HumanoidRootPart", (0, 7.45, 0), "Root")}),
    ("UpperTorso", (0, 10.6, 0), (2.0, 2.4, 1.1), SKIN, {"joint": ("LowerTorso", (0, 8.0, 0), "Waist")}),
    ("Abdomen", (0, 8.75, 0), (1.1, 1.7, 0.72), SKIN, {"weld": "UpperTorso"}),
    ("Clavicle", (0, 11.6, 0), (2.9, 0.45, 0.8), SKIN, {"weld": "UpperTorso"}),
    ("NeckPart", (0, 12.7, 0), (0.5, 1.9, 0.5), SKIN, {"joint": ("UpperTorso", (0, 11.75, 0), "Neck")}),
    ("Head", (0, 14.8, 0), (2.0, 2.7, 2.1), SKIN, {"joint": ("NeckPart", (0, 13.6, 0), "HeadJoint"), "mesh": "Sphere"}),
    ("Mouth", (0, 14.25, -0.95), (1.6, 0.62, 0.16), (80, 18, 22), {"weld": "Head"}),
    ("Teeth", (0, 14.25, -1.0), (1.42, 0.42, 0.12), (245, 240, 225), {"weld": "Head", "teeth": True}),
    ("LeftEye", (-0.42, 15.25, -0.86), (0.3, 0.3, 0.3), (12, 8, 6), {"weld": "Head", "shape": "Ball"}),
    ("RightEye", (0.42, 15.25, -0.86), (0.3, 0.3, 0.3), (12, 8, 6), {"weld": "Head", "shape": "Ball"}),
]

for i in range(4):
    BODY.append((f"Rib{i + 1}", (0, 9.75 + i * 0.45, -0.57), (1.75 - i * 0.05, 0.13, 0.08), SKIN_SHADOW, {"weld": "UpperTorso"}))

for side, sx in (("Left", -1), ("Right", 1)):
    ax, lx = 1.35 * sx, 0.55 * sx
    BODY += [
        (f"{side}UpperArm", (ax, 9.7, 0), (0.42, 3.6, 0.42), SKIN, {"joint": ("UpperTorso", (ax, 11.5, 0), f"{side}Shoulder")}),
        (f"{side}LowerArm", (ax, 6.2, 0), (0.36, 3.4, 0.36), SKIN, {"joint": (f"{side}UpperArm", (ax, 7.9, 0), f"{side}Elbow")}),
        (f"{side}Hand", (ax, 3.95, 0), (0.5, 1.1, 0.3), SKIN_DARK, {"joint": (f"{side}LowerArm", (ax, 4.5, 0), f"{side}Wrist")}),
        (f"{side}UpperLeg", (lx, 5.25, 0), (0.5, 3.5, 0.5), SKIN, {"joint": ("LowerTorso", (lx, 7.0, 0), f"{side}Hip")}),
        (f"{side}LowerLeg", (lx, 1.95, 0), (0.42, 3.1, 0.42), SKIN, {"joint": (f"{side}UpperLeg", (lx, 3.5, 0), f"{side}Knee")}),
        (f"{side}Foot", (lx, 0.2, -0.35), (0.55, 0.4, 1.4), SKIN_DARK, {"joint": (f"{side}LowerLeg", (lx, 0.4, 0), f"{side}Ankle")}),
        (f"{side}Knee", (lx, 3.5, 0), (0.55, 0.55, 0.55), SKIN_DARK, {"weld": f"{side}UpperLeg", "shape": "Ball"}),
    ]
    for f, fx in enumerate((-0.16, 0, 0.16)):
        BODY.append((f"{side}Finger{f + 1}", (ax + fx, 2.95, 0), (0.1, 0.95 - abs(fx), 0.1), SKIN_DARK, {"weld": f"{side}Hand"}))


def _teeth_gui():
    lines = [{
        "className": "Frame",
        "properties": {
            "Size": {"UDim2": [[0, 3], [1, 0]]},
            "Position": {"UDim2": [[i / 12, 0], [0, 0]]},
            "BackgroundColor3": [0.35, 0.3, 0.25], "BorderSizePixel": 0,
        },
    } for i in range(1, 12)]
    lines.append({
        "className": "Frame",
        "properties": {
            "Size": {"UDim2": [[1, 0], [0, 3]]}, "Position": {"UDim2": [[0, 0], [0.5, -1]]},
            "BackgroundColor3": [0.35, 0.3, 0.25], "BorderSizePixel": 0,
        },
    })
    return {"className": "SurfaceGui", "properties": {"Face": "Front", "SizingMode": "PixelsPerStud", "PixelsPerStud": 60}, "children": lines}


def build(part_fn, offset=(0, 0, 0), statue=False, yaw180=False):
    """Devuelve la lista de nodos de Rojo.

    statue=True: piezas ancladas, sin raíz, marcadas con StatueBody.
    yaw180=True: girada 180° (mirando a +Z).
    """
    ox, oy, oz = offset
    flip = -1 if yaw180 else 1
    nodes = []
    for name, (x, y, z), size, color, extra in BODY:
        if statue and extra.get("root"):
            continue
        is_root = extra.get("root", False)
        props = dict(
            Anchored=statue,
            CanCollide=is_root,
            Massless=not is_root,
            Transparency=1 if is_root else 0,
        )
        if yaw180:
            props["orientation"] = [[-1, 0, 0], [0, 1, 0], [0, 0, -1]]
        if extra.get("shape"):
            props["Shape"] = extra["shape"]
        children = []
        if extra.get("mesh"):
            children.append({"className": "SpecialMesh", "properties": {"MeshType": extra["mesh"]}})
        if extra.get("teeth"):
            children.append(_teeth_gui())
        if name == "RightHand" and not statue:
            # punto de agarre para los objetos de la tienda (Tools)
            children.append({"name": "RightGripAttachment", "className": "Attachment",
                             "properties": {"CFrame": {"CFrame": {"position": [0, -0.55, 0], "orientation": [[1, 0, 0], [0, 1, 0], [0, 0, 1]]}}}})
        attributes = {}
        if statue:
            attributes = {"StatueBody": True}
        elif "joint" in extra:
            parent, pivot, motor = extra["joint"]
            attributes = {"JointParent": parent, "JointPivot": {"Vector3": list(pivot)}, "Motor": motor}
        elif "weld" in extra:
            attributes = {"WeldTo": extra["weld"]}
        node = part_fn(name, (x * flip + ox, y + oy, z * flip + oz), size, color, "SmoothPlastic", **props,
                       **({"attributes": attributes} if attributes else {}),
                       **({"children": children} if children else {}))
        nodes.append(node)
    return nodes


def character(part_fn):
    nodes = build(part_fn)
    nodes.append({
        "name": "Humanoid", "className": "Humanoid",
        "properties": {"RigType": "R15", "HipHeight": HIP_HEIGHT, "DisplayDistanceType": "None", "WalkSpeed": 18,
                       "HealthDisplayType": "AlwaysOff", "BreakJointsOnDeath": False, "RequiresNeck": False},
    })
    return {"className": "Model", "attributes": {"VerityRig": True}, "children": nodes}
