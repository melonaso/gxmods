"""Geometría de Verity (criatura amarilla de ~16 studs, 3x un jugador R15).

Modelo orgánico hecho con elipsoides (SpecialMesh "Sphere"): cuerpo esbelto
en V, extremidades largas que se afinan, costillas marcadas, clavículas,
tendones del cuello y una cabeza de calavera sonriente: sin ojos, con cuencas
hundidas, pómulos, cavidad nasal y una sonrisa enorme de dientes separados.

Espacio del modelo: pies en y = 0, mirando hacia -Z. Las uniones (Motor6D)
se crean en tiempo de ejecución por VerityRig.luau a partir de atributos:
  JointParent / JointPivot (Vector3, espacio del modelo) / Motor
  WeldTo  (piezas decorativas soldadas a otra pieza)
Los pivotes deben coincidir con src/shared/VerityPose.luau (valores por
defecto) y VerityModel los vuelve a medir al cargar.
"""

import math

SKIN = (206, 188, 92)
SKIN_LIGHT = (220, 204, 112)
SKIN_SHADE = (178, 160, 74)
SKIN_DEEP = (150, 132, 60)
MOUTH = (48, 12, 12)
TEETH = (240, 234, 212)
SOCKET = (96, 78, 40)
SOCKET_DEEP = (26, 18, 10)

HIP_HEIGHT = 7.0
ROOT_CENTER_Y = 8.2

IDENTITY = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]


def ry(a):
    c, s = math.cos(a), math.sin(a)
    return [[c, 0, s], [0, 1, 0], [-s, 0, c]]


def rz(a):
    c, s = math.cos(a), math.sin(a)
    return [[c, -s, 0], [s, c, 0], [0, 0, 1]]


def rx(a):
    c, s = math.cos(a), math.sin(a)
    return [[1, 0, 0], [0, c, -s], [0, s, c]]


def matmul(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(3)) for j in range(3)] for i in range(3)]


BODY = []


def add(name, center, size, color, ellipsoid=True, **extra):
    """extra: joint=(padre, pivote, motor) | weld=padre | orient=matriz | shape | material"""
    if ellipsoid and "shape" not in extra:
        extra["mesh"] = "Sphere"
    BODY.append((name, center, size, color, extra))


# --- raíz, pelvis y torso ---------------------------------------------------
# Proporciones de la imagen de referencia: cabeza pequeña, cuello largo,
# hombros estrechos y caídos, costillas marcadas, cintura muy fina y
# extremidades larguísimas y continuas (sin "bolas" en las articulaciones).


def normalize(v):
    n = math.sqrt(sum(c * c for c in v)) or 1
    return [c / n for c in v]


def cross(a, b):
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]


def surface(center, radii, x, y, inset=0.0):
    """Punto de la cara frontal (-Z) de un elipsoide en (x, y) y la orientación
    que deja la pieza apoyada en él: su frente (-Z local) sigue la normal."""
    dx, dy = (x - center[0]) / radii[0], (y - center[1]) / radii[1]
    dz = -math.sqrt(max(0.02, 1 - dx * dx - dy * dy))
    z = center[2] + radii[2] * dz
    normal = normalize([dx / radii[0], dy / radii[1], dz / radii[2]])
    back = [-c for c in normal]
    up = normalize([-back[1] * back[0], 1 - back[1] * back[1], -back[1] * back[2]])
    right = cross(up, back)
    orient = [[right[i], up[i], back[i]] for i in range(3)]
    return (x, y, z + inset), orient


BODY.append(("HumanoidRootPart", (0, ROOT_CENTER_Y, 0), (2, 2.4, 1), SKIN, {"root": True}))
add("LowerTorso", (0, 7.72, 0.05), (1.2, 0.86, 0.7), SKIN, joint=("HumanoidRootPart", (0, 7.6, 0), "Root"))
for sx in (-1, 1):
    # cresta ilíaca: hueso de la cadera marcado bajo la piel
    add("HipCrest", (0.47 * sx, 7.98, -0.1), (0.2, 0.5, 0.3), SKIN, weld="LowerTorso", orient=rz(sx * math.radians(28)))

CHEST_C, CHEST_R = (0, 10.8, 0.06), (0.81, 1.22, 0.49)
add("UpperTorso", CHEST_C, (CHEST_R[0] * 2, CHEST_R[1] * 2, CHEST_R[2] * 2), SKIN,
    joint=("LowerTorso", (0, 8.3, 0), "Waist"))
add("Chest", (0, 11.42, 0.06), (1.98, 1.22, 0.96), SKIN, weld="UpperTorso")  # pecho ancho arriba: forma de V
add("Abdomen", (0, 8.95, 0.14), (0.82, 2.0, 0.6), SKIN, weld="UpperTorso")
sternum, _ = surface(CHEST_C, CHEST_R, 0, 10.95, 0.03)
add("Sternum", sternum, (0.16, 1.5, 0.12), SKIN_LIGHT, weld="UpperTorso")
for i in range(5):
    y = 9.95 + i * 0.34
    for sx in (-1, 1):
        pos, orient = surface(CHEST_C, CHEST_R, 0.42 * sx, y, 0.03)
        add("Rib", pos, (0.66 - i * 0.03, 0.1, 0.14), SKIN_SHADE, weld="UpperTorso",
            orient=matmul(orient, rz(-sx * math.radians(18))))
for sx in (-1, 1):
    # trapecio caído desde el cuello hasta el hombro
    add("Trapezius", (0.55 * sx, 11.9, 0.08), (1.15, 0.42, 0.62), SKIN, weld="UpperTorso", orient=rz(-sx * math.radians(17)))
    add("Clavicle", (0.55 * sx, 11.82, -0.36), (1.0, 0.13, 0.16), SKIN_LIGHT, weld="UpperTorso", orient=rz(-sx * math.radians(10)))
    add("Deltoid", (1.12 * sx, 11.45, 0.04), (0.44, 0.95, 0.5), SKIN, weld="UpperTorso")

# --- cuello y cabeza -----------------------------------------------------------
add("NeckPart", (0, 13.0, 0.0), (0.4, 2.4, 0.42), SKIN, joint=("UpperTorso", (0, 11.95, 0), "Neck"))
for sx in (-1, 1):
    add("Tendon", (0.15 * sx, 12.95, -0.1), (0.11, 2.1, 0.12), SKIN_LIGHT, weld="NeckPart", orient=rz(sx * math.radians(8)))

# Cabeza de calavera: bóveda craneal ancha arriba y cara que se estrecha hacia
# una mandíbula fina; sin ojos, solo cuencas hundidas y una sonrisa enorme.
HEAD_C = (0, 14.9, -0.02)
HEAD_R = (0.74, 1.05, 0.88)  # semiejes del elipsoide de la cara
add("Head", HEAD_C, (HEAD_R[0] * 2, HEAD_R[1] * 2, HEAD_R[2] * 2), SKIN, joint=("NeckPart", (0, 14.0, 0), "HeadJoint"))
# bóveda craneal hacia atrás: sobresale en la nuca y las sienes sin dejar costura en la frente
add("Cranium", (0, 15.35, 0.3), (1.6, 1.56, 1.64), SKIN, weld="Head")


def on_face(name, x, y, size, color, inset=0.0, tilt=None, **extra):
    pos, orient = surface(HEAD_C, HEAD_R, x, y, inset)
    add(name, pos, size, color, weld="Head", orient=matmul(orient, tilt) if tilt else orient, **extra)


for sx in (-1, 1):
    # cuencas vacías: un fondo negro con un borde pardo que da profundidad
    on_face("EyeSocket", 0.3 * sx, 15.18, (0.56, 0.5, 0.2), SOCKET, inset=0.07, tilt=rz(sx * math.radians(8)))
    on_face("EyeHollow", 0.3 * sx, 15.17, (0.44, 0.4, 0.2), SOCKET_DEEP, inset=0.035, tilt=rz(sx * math.radians(8)))
    # pómulos marcados a los lados, bajo las cuencas
    on_face("Cheekbone", 0.56 * sx, 14.9, (0.34, 0.18, 0.2), SKIN, inset=0.09, tilt=rz(-sx * math.radians(15)))
    # cavidad nasal en forma de V invertida
    on_face("Nostril", 0.045 * sx, 14.8, (0.07, 0.26, 0.06), SOCKET_DEEP, inset=0.01, tilt=rz(sx * math.radians(22)))

# Sonrisa enorme en forma de media luna que llega hasta los lados de la cara:
# por cada columna, el borde, el fondo oscuro y un diente arriba y otro abajo
# (con huecos entre dientes, como una calavera).
COLUMNS = 15
for k in range(COLUMNS):
    x = (k - (COLUMNS - 1) / 2) * 0.09
    t = abs(x) / 0.63
    upper_y = 14.42 + 0.26 * t * t
    lower_y = 14.15 + 0.36 * t * t
    mid = (upper_y + lower_y) / 2
    gap = upper_y - lower_y
    tall = gap + 0.27 * (1 - 0.4 * t)
    on_face("Lip", x, mid, (0.11, tall + 0.07, 0.16), SKIN_DEEP, inset=0.075)
    on_face("MouthDark", x, mid, (0.1, tall, 0.12), MOUTH, inset=0.05)
    h = 0.19 * (1 - 0.35 * t)
    for row, y in (("Upper", upper_y - h * 0.15), ("Lower", lower_y + h * 0.15)):
        on_face(f"Tooth{row}", x, y, (0.07, h, 0.05), TEETH, inset=-0.015, ellipsoid=False)
on_face("Chin", 0, 13.98, (0.5, 0.3, 0.32), SKIN, inset=0.14)

# --- brazos, manos, piernas y pies --------------------------------------------
for side, sx in (("Left", -1), ("Right", 1)):
    ax, lx = 1.25 * sx, 0.44 * sx
    add(f"{side}UpperArm", (ax, 9.8, 0.02), (0.34, 3.95, 0.36), SKIN, joint=("UpperTorso", (ax, 11.55, 0), f"{side}Shoulder"))
    add(f"{side}LowerArm", (ax, 6.38, 0.02), (0.29, 3.75, 0.3), SKIN, joint=(f"{side}UpperArm", (ax, 8.1, 0), f"{side}Elbow"))
    add(f"{side}Hand", (ax, 4.22, 0), (0.17, 0.95, 0.4), SKIN_SHADE, joint=(f"{side}LowerArm", (ax, 4.65, 0), f"{side}Wrist"))
    # dedos largos y puntiagudos, un poco curvados hacia el cuerpo
    for fz in (-0.15, -0.05, 0.05, 0.15):
        length = 0.6 - abs(fz) * 0.5
        add("Finger", (ax, 3.5, fz), (0.07, length, 0.07), SKIN_SHADE, weld=f"{side}Hand")
        add("FingerTip", (ax - sx * 0.035, 3.5 - length / 2 - 0.25, fz), (0.06, 0.55, 0.06), SKIN_DEEP,
            weld=f"{side}Hand", orient=rz(-sx * math.radians(9)))
    add("Thumb", (ax - sx * 0.03, 3.85, -0.24), (0.07, 0.5, 0.07), SKIN_SHADE, weld=f"{side}Hand", orient=rx(math.radians(-22)))

    add(f"{side}UpperLeg", (lx, 5.5, 0.02), (0.44, 4.1, 0.46), SKIN, joint=("LowerTorso", (lx, 7.3, 0), f"{side}Hip"))
    add("Kneecap", (lx, 3.72, -0.13), (0.3, 0.38, 0.22), SKIN_LIGHT, weld=f"{side}UpperLeg")
    add(f"{side}LowerLeg", (lx, 2.05, 0.02), (0.33, 3.7, 0.35), SKIN, joint=(f"{side}UpperLeg", (lx, 3.7, 0), f"{side}Knee"))
    add("Calf", (lx, 2.7, 0.08), (0.3, 1.3, 0.3), SKIN, weld=f"{side}LowerLeg")
    add(f"{side}Foot", (lx, 0.15, -0.36), (0.36, 0.3, 1.25), SKIN_SHADE, joint=(f"{side}LowerLeg", (lx, 0.42, 0), f"{side}Ankle"))
    for tx in (-0.1, 0, 0.1):
        add("Toe", (lx + tx, 0.08, -0.98), (0.09, 0.11, 0.24), SKIN_DEEP, weld=f"{side}Foot")


def _matmul(a, b):
    return matmul(a, b)


def build(part_fn, offset=(0, 0, 0), statue=False, yaw180=False):
    """Devuelve la lista de nodos de Rojo.

    statue=True: piezas ancladas, sin raíz, marcadas con StatueBody.
    yaw180=True: girada 180° (mirando a +Z).
    """
    ox, oy, oz = offset
    flip = -1 if yaw180 else 1
    yaw = [[-1, 0, 0], [0, 1, 0], [0, 0, -1]]
    nodes = []
    for name, (x, y, z), size, color, extra in BODY:
        if statue and extra.get("root"):
            continue
        is_root = extra.get("root", False)
        props = dict(
            Anchored=statue,
            CanCollide=is_root,
            CanQuery=is_root,
            Massless=not is_root,
            Transparency=1 if is_root else 0,
        )
        orient = extra.get("orient")
        if yaw180:
            orient = _matmul(yaw, orient or IDENTITY)
        if orient:
            props["orientation"] = orient
        if extra.get("shape"):
            props["Shape"] = extra["shape"]
        children = []
        if extra.get("mesh"):
            children.append({"className": "SpecialMesh", "properties": {"MeshType": extra["mesh"]}})
        if name == "RightHand" and not statue:
            # punto de agarre para los objetos de la tienda (Tools)
            children.append({"name": "RightGripAttachment", "className": "Attachment",
                             "properties": {"CFrame": {"CFrame": {"position": [0, -0.55, 0], "orientation": IDENTITY}}}})
        attributes = {}
        if statue:
            attributes = {"StatueBody": True}
        elif "joint" in extra:
            parent, pivot, motor = extra["joint"]
            attributes = {"JointParent": parent, "JointPivot": {"Vector3": list(pivot)}, "Motor": motor}
        elif "weld" in extra:
            attributes = {"WeldTo": extra["weld"]}
        node = part_fn(name, (x * flip + ox, y + oy, z * flip + oz), size, color, extra.get("material", "SmoothPlastic"), **props,
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
