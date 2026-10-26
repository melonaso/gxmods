"""Geometría de Verity (criatura amarilla de ~16 studs, 3x un jugador R15).

Modelo orgánico hecho con elipsoides (SpecialMesh "Sphere"), según la imagen
de referencia: cuerpo esquelético, caja torácica con costillas, cintura de
avispa con un pequeño vientre, cadera con crestas marcadas, cuello largo con
tendones, clavículas, omóplatos, brazos larguísimos (muñecas a la altura de
las rodillas) con bíceps, codos y antebrazos, manos de dedos largos, piernas
con muslo, rodilla y gemelo, y una cabeza de huevo calva con cuencas
hundidas, mejillas levantadas y una sonrisa enorme de dientes grandes.

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
LIPS = (168, 120, 66)

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


# --- utilidades de forma --------------------------------------------------------
# Proporciones tomadas de la imagen de referencia (16 studs de alto): cabeza
# pequeña de huevo, cuello largo con tendones, hombros estrechos y caídos,
# caja torácica marcada, cintura de avispa con un pequeño vientre, cadera
# estrecha, piernas largas y brazos larguísimos (las muñecas a la altura de
# las rodillas). Cada tramo lleva músculos/huesos soldados encima para que el
# contorno sea orgánico en vez de "salchichas".


def normalize(v):
    n = math.sqrt(sum(c * c for c in v)) or 1
    return [c / n for c in v]


def cross(a, b):
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]


def lerp3(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def along(top, bottom):
    """Orientación cuyo eje Y local va de `bottom` a `top` (para tramos de brazos y piernas)."""
    y = normalize([top[i] - bottom[i] for i in range(3)])
    ref = [0, 0, 1] if abs(y[2]) < 0.9 else [1, 0, 0]
    x = normalize(cross(y, ref))
    z = cross(x, y)
    return [[x[i], y[i], z[i]] for i in range(3)]


def segment(name, top, bottom, width, depth, color, extend=0.12, **extra):
    """Elipsoide que une dos puntos (sobresale `extend` por cada lado para no dejar huecos)."""
    length = math.dist(top, bottom) * (1 + extend)
    add(name, lerp3(top, bottom, 0.5), (width, length, depth), color, orient=along(top, bottom), **extra)


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


# --- raíz, pelvis y torso ---------------------------------------------------
BODY.append(("HumanoidRootPart", (0, ROOT_CENTER_Y, 0), (2, 2.4, 1), SKIN, {"root": True}))

# pelvis estrecha con las crestas de la cadera marcadas
add("LowerTorso", (0, 7.9, 0.04), (1.34, 0.82, 0.66), SKIN, joint=("HumanoidRootPart", (0, 7.9, 0), "Root"))
# transición suave del vientre a la cadera (sin "cuentas" entre tramos)
for sx in (-1, 1):
    add("HipCrest", (0.52 * sx, 8.25, -0.18), (0.12, 0.46, 0.2), SKIN_LIGHT, weld="LowerTorso", orient=rz(sx * math.radians(24)))
    add("Glute", (0.32 * sx, 7.85, 0.26), (0.6, 0.72, 0.38), SKIN, weld="LowerTorso")

# caja torácica: barril que se estrecha hacia la cintura, con el pecho ancho arriba
CHEST_C, CHEST_R = (0, 10.95, 0.05), (0.98, 1.3, 0.52)
add("UpperTorso", CHEST_C, (CHEST_R[0] * 2, CHEST_R[1] * 2, CHEST_R[2] * 2), SKIN, joint=("LowerTorso", (0, 8.6, 0), "Waist"))
# Contorno del tronco con rodajas superpuestas cuyo ancho sigue el perfil de
# la referencia: pecho ancho, costillas que se cierran, cintura fina, un
# pequeño vientre y la pelvis. Así no quedan "barriles" apilados.
TORSO_PROFILE = [  # (altura, ancho, fondo, desplazamiento hacia delante)
    (7.55, 1.18, 0.62, 0.0), (8.0, 1.44, 0.7, 0.0), (8.45, 1.36, 0.68, -0.03), (8.85, 1.3, 0.68, -0.05),
    (9.2, 1.24, 0.62, -0.02), (9.6, 1.42, 0.68, 0.0), (10.1, 1.78, 0.86, 0.0), (10.7, 1.98, 0.96, 0.0),
    (11.3, 2.0, 0.98, 0.0), (11.85, 1.9, 0.92, 0.02), (12.3, 1.4, 0.74, 0.05),
]


def torso_at(y):
    for (y0, w0, d0, z0), (y1, w1, d1, z1) in zip(TORSO_PROFILE, TORSO_PROFILE[1:]):
        if y0 <= y <= y1:
            t = (y - y0) / (y1 - y0)
            t = t * t * (3 - 2 * t)
            return w0 + (w1 - w0) * t, d0 + (d1 - d0) * t, z0 + (z1 - z0) * t
    return TORSO_PROFILE[-1][1:]


# rodajas altas y muy solapadas: el contorno ondula menos de un 3 %
y = 7.75
while y <= 12.0:
    w, d, z = torso_at(y)
    add("TorsoSlice", (0, y, 0.05 + z), (w, 1.4, d), SKIN, weld="UpperTorso" if y >= 8.6 else "LowerTorso")
    y += 0.35
add("Navel", (0, 8.85, -0.33), (0.08, 0.12, 0.06), SKIN_DEEP, weld="UpperTorso")
sternum, _ = surface(CHEST_C, CHEST_R, 0, 11.1, 0.02)
add("Sternum", sternum, (0.15, 1.7, 0.11), SKIN_LIGHT, weld="UpperTorso")
# costillas: seis pares que bajan hacia los lados, más largas en el centro
for i in range(6):
    y = 9.95 + i * 0.32
    for sx in (-1, 1):
        pos, orient = surface(CHEST_C, CHEST_R, 0.5 * sx, y, 0.025)
        add("Rib", pos, (0.78 - abs(i - 2.5) * 0.05, 0.1, 0.13), SKIN_SHADE, weld="UpperTorso",
            orient=matmul(orient, rz(-sx * math.radians(20 - i))))
        # sombra entre costillas: da relieve con poca luz
        pos, orient = surface(CHEST_C, CHEST_R, 0.52 * sx, y + 0.16, 0.035)
        add("RibShadow", pos, (0.62, 0.07, 0.1), SKIN_DEEP, weld="UpperTorso", orient=matmul(orient, rz(-sx * math.radians(20 - i))))
for sx in (-1, 1):
    # borde inferior de la caja torácica (arco costal)
    pos, orient = surface(CHEST_C, CHEST_R, 0.38 * sx, 9.78, 0.03)
    add("CostalArch", pos, (0.74, 0.12, 0.14), SKIN_LIGHT, weld="UpperTorso", orient=matmul(orient, rz(sx * math.radians(32))))
    # trapecio caído desde el cuello hasta el hombro
    add("Trapezius", (0.5 * sx, 12.42, 0.1), (1.05, 0.38, 0.56), SKIN, weld="UpperTorso", orient=rz(-sx * math.radians(22)))
    # clavícula marcada, del esternón al hombro
    segment("Clavicle", (0.06 * sx, 12.28, -0.4), (1.08 * sx, 12.45, -0.22), 0.11, 0.12, SKIN, extend=0.05,
            weld="UpperTorso")
    # hombro caído que se funde con el brazo
    add("Deltoid", (1.16 * sx, 11.95, 0.04), (0.38, 1.15, 0.44), SKIN, weld="UpperTorso", orient=rz(sx * math.radians(6)))
    # omóplatos y columna (de espaldas)
    add("Scapula", (0.56 * sx, 11.55, 0.48), (0.66, 0.9, 0.16), SKIN, weld="UpperTorso", orient=rz(sx * math.radians(12)))
for k in range(6):
    add("Spine", (0, 9.4 + k * 0.48, 0.5 - 0.08 * abs(k - 3) / 3), (0.12, 0.2, 0.1), SKIN_LIGHT, weld="UpperTorso")

# --- cuello y cabeza -----------------------------------------------------------
add("NeckPart", (0, 13.3, 0.02), (0.36, 2.0, 0.38), SKIN, joint=("UpperTorso", (0, 12.55, 0), "Neck"))
add("AdamsApple", (0, 13.25, -0.17), (0.13, 0.22, 0.12), SKIN_LIGHT, weld="NeckPart")
for sx in (-1, 1):
    # esternocleidomastoideo: de detrás de la oreja al esternón
    segment("NeckTendon", (0.26 * sx, 14.15, 0.08), (0.06 * sx, 12.45, -0.26), 0.11, 0.12, SKIN_LIGHT, extend=0.04,
            weld="NeckPart")

# Cabeza de huevo, lisa y calva; sin ojos: cuencas pequeñas y hundidas
HEAD_C = (0, 15.0, -0.02)
HEAD_R = (0.58, 1.04, 0.78)
add("Head", HEAD_C, (HEAD_R[0] * 2, HEAD_R[1] * 2, HEAD_R[2] * 2), SKIN, joint=("NeckPart", (0, 14.05, 0), "HeadJoint"))
add("Cranium", (0, 15.45, 0.22), (1.24, 1.34, 1.46), SKIN, weld="Head")


def on_face(name, x, y, size, color, inset=0.0, tilt=None, **extra):
    pos, orient = surface(HEAD_C, HEAD_R, x, y, inset)
    add(name, pos, size, color, weld="Head", orient=matmul(orient, tilt) if tilt else orient, **extra)


for sx in (-1, 1):
    # cuencas almendradas, oscuras y hundidas (como en la imagen)
    on_face("EyeSocket", 0.22 * sx, 15.22, (0.36, 0.26, 0.2), SOCKET, inset=0.075, tilt=rz(-sx * math.radians(10)))
    on_face("EyeHollow", 0.22 * sx, 15.21, (0.26, 0.16, 0.2), SOCKET_DEEP, inset=0.04, tilt=rz(-sx * math.radians(10)))
    # pómulos levantados por la sonrisa
    on_face("Cheekbone", 0.38 * sx, 14.9, (0.3, 0.2, 0.18), SKIN, inset=0.09, tilt=rz(-sx * math.radians(18)))
    # surcos de la sonrisa, de la nariz a las comisuras
    on_face("SmileFold", 0.28 * sx, 14.6, (0.06, 0.42, 0.1), SKIN_DEEP, inset=0.04, tilt=rz(sx * math.radians(28)))
    on_face("Nostril", 0.05 * sx, 14.76, (0.06, 0.08, 0.06), SOCKET_DEEP, inset=0.0)
on_face("Nose", 0, 14.84, (0.17, 0.26, 0.16), SKIN, inset=0.04)

# Sonrisa enorme de oreja a oreja: labios, interior oscuro y dientes
# grandes muy juntos (arriba más altos que abajo), como en la referencia.
COLUMNS = 15
for k in range(COLUMNS):
    x = (k - (COLUMNS - 1) / 2) * 0.064
    t = abs(x) / 0.46
    upper_y = 14.43 + 0.26 * t * t
    lower_y = 14.16 + 0.34 * t * t
    mid = (upper_y + lower_y) / 2
    gap = upper_y - lower_y
    tall = gap + 0.27 * (1 - 0.4 * t)
    on_face("Lip", x, mid, (0.085, tall + 0.08, 0.16), LIPS, inset=0.075)
    on_face("MouthDark", x, mid, (0.076, tall, 0.12), MOUTH, inset=0.05)
    for row, y, h in (("Upper", upper_y, 0.22 * (1 - 0.3 * t)), ("Lower", lower_y, 0.14 * (1 - 0.35 * t))):
        y = y - h * 0.22 if row == "Upper" else y + h * 0.22
        on_face(f"Tooth{row}", x, y, (0.06, h, 0.05), TEETH, inset=-0.012, ellipsoid=False)
on_face("Chin", 0, 13.98, (0.38, 0.26, 0.28), SKIN, inset=0.13)

# --- brazos, manos, piernas y pies --------------------------------------------
for side, sx in (("Left", -1), ("Right", 1)):
    shoulder = (1.2 * sx, 12.25, 0.02)
    elbow = (1.34 * sx, 8.3, 0.08)
    wrist = (1.44 * sx, 3.95, 0.02)
    # brazo: delgadísimo, con algo de bíceps y el codo huesudo
    segment(f"{side}UpperArm", shoulder, elbow, 0.3, 0.32, SKIN, joint=("UpperTorso", shoulder, f"{side}Shoulder"))
    segment("Bicep", lerp3(shoulder, elbow, 0.12), lerp3(shoulder, elbow, 0.55), 0.36, 0.36, SKIN, extend=0, weld=f"{side}UpperArm")
    add("ElbowBone", (elbow[0], elbow[1], elbow[2] + 0.1), (0.2, 0.3, 0.16), SKIN, weld=f"{side}UpperArm")
    # antebrazo: más grueso junto al codo y fino en la muñeca
    segment(f"{side}LowerArm", elbow, wrist, 0.26, 0.27, SKIN, joint=(f"{side}UpperArm", elbow, f"{side}Elbow"))
    segment("Forearm", lerp3(elbow, wrist, 0.05), lerp3(elbow, wrist, 0.45), 0.34, 0.33, SKIN, extend=0, weld=f"{side}LowerArm")
    # mano larga con los dedos colgando y algo curvados hacia el muslo
    hx, hy, hz = wrist[0] + 0.02 * sx, wrist[1] - 0.5, wrist[2]
    add(f"{side}Hand", (hx, hy, hz), (0.17, 0.9, 0.42), SKIN_SHADE, joint=(f"{side}LowerArm", wrist, f"{side}Wrist"))
    for fz in (-0.16, -0.055, 0.055, 0.16):
        length = 0.72 - abs(fz) * 0.9
        top = (hx, hy - 0.4, hz + fz)
        knuckle = (hx - 0.03 * sx, hy - 0.4 - length * 0.55, hz + fz * 1.05)
        tip = (hx - 0.12 * sx, hy - 0.4 - length, hz + fz * 1.1)
        segment("Finger", top, knuckle, 0.075, 0.075, SKIN_SHADE, extend=0.2, weld=f"{side}Hand")
        segment("FingerTip", knuckle, tip, 0.065, 0.065, SKIN_DEEP, extend=0.2, weld=f"{side}Hand")
    segment("Thumb", (hx - 0.02 * sx, hy - 0.05, hz - 0.2), (hx - 0.08 * sx, hy - 0.6, hz - 0.27), 0.08, 0.08, SKIN_SHADE,
            extend=0.1, weld=f"{side}Hand")

    hip = (0.46 * sx, 7.55, 0.02)
    knee = (0.44 * sx, 4.3, -0.02)
    ankle = (0.45 * sx, 0.55, 0.04)
    # muslo fino que se estrecha hacia la rodilla
    segment(f"{side}UpperLeg", hip, knee, 0.48, 0.5, SKIN, joint=("LowerTorso", hip, f"{side}Hip"))
    segment("Thigh", lerp3(hip, knee, 0.02), lerp3(hip, knee, 0.6), 0.55, 0.57, SKIN, extend=0, weld=f"{side}UpperLeg")
    add("Kneecap", (knee[0], knee[1] + 0.05, knee[2] - 0.13), (0.24, 0.32, 0.1), SKIN_LIGHT, weld=f"{side}UpperLeg")
    # pierna: espinilla recta y gemelo marcado detrás
    segment(f"{side}LowerLeg", knee, ankle, 0.33, 0.35, SKIN, joint=(f"{side}UpperLeg", knee, f"{side}Knee"))
    segment("Calf", lerp3(knee, ankle, 0.12), lerp3(knee, ankle, 0.5), 0.36, 0.34, SKIN,
            extend=0, weld=f"{side}LowerLeg")
    add("Shin", (knee[0], 2.6, knee[2] - 0.15), (0.14, 2.6, 0.1), SKIN_LIGHT, weld=f"{side}LowerLeg")
    add("AnkleBone", (ankle[0] + 0.12 * sx, ankle[1] + 0.1, ankle[2]), (0.1, 0.16, 0.14), SKIN, weld=f"{side}LowerLeg")
    # pie largo y plano con dedos
    add(f"{side}Foot", (ankle[0], 0.17, -0.34), (0.38, 0.32, 1.3), SKIN_SHADE, joint=(f"{side}LowerLeg", ankle, f"{side}Ankle"))
    add("Heel", (ankle[0], 0.2, 0.18), (0.3, 0.36, 0.36), SKIN_SHADE, weld=f"{side}Foot")
    for tx in (-0.11, 0, 0.11):
        add("Toe", (ankle[0] + tx * sx, 0.08, -1.0), (0.09, 0.11, 0.26), SKIN_DEEP, weld=f"{side}Foot")


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
