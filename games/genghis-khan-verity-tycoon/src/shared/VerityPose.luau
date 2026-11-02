--!strict
-- Línea de tiempo del ataque "levantar y aplastar" y medidas del rig de
-- Verity. Funciona con cualquier modelo: VerityModel (servidor) mide el rig
-- al prepararlo y guarda las medidas como atributos del modelo; el cliente
-- anima con ellas y el servidor calcula dónde están las manos para mover a
-- la víctima, sin depender de la red.

local Pose = {}

export type RigData = {
	rootY: number, -- altura del centro de HumanoidRootPart sobre los pies
	hipHeight: number,
	crouchDrop: number,
	crouchAngle: number,
	waist: Vector3, -- pivotes en espacio del modelo (pies en el origen, mirando a -Z)
	shoulder: Vector3,
	elbow: Vector3,
	grip: Vector3,
	hasWaist: boolean,
	hasArms: boolean,
}

Pose.KillGrab = 0.45 -- la víctima termina de llegar a las manos
Pose.KillImpact = 1.75 -- golpe contra el suelo
Pose.KillDuration = 2.4

local rad = math.rad
-- tiempo, hombro (adelante +), codo, cintura (adelante -)
local KEYS = {
	{ 0.00, 0, 0, 0 },
	{ 0.35, rad(60), rad(25), rad(-32) }, -- se inclina y alcanza
	{ 0.45, rad(60), rad(25), rad(-32) },
	{ 1.30, rad(168), rad(12), rad(8) }, -- levanta sobre la cabeza
	{ 1.55, rad(176), rad(18), rad(12) }, -- tensa antes del golpe
	{ 1.75, rad(48), rad(0), rad(-38) }, -- aplasta
	{ 2.40, 0, 0, 0 },
}

local function smooth(a: number): number
	return a * a * (3 - 2 * a)
end

-- Devuelve (hombro, codo, cintura) en radianes para el instante t.
function Pose.killAngles(t: number): (number, number, number)
	if t <= 0 then
		return 0, 0, 0
	end
	for i = 1, #KEYS - 1 do
		local a, b = KEYS[i], KEYS[i + 1]
		if t <= b[1] then
			local alpha = smooth((t - a[1]) / (b[1] - a[1]))
			return a[2] + (b[2] - a[2]) * alpha, a[3] + (b[3] - a[3]) * alpha, a[4] + (b[4] - a[4]) * alpha
		end
	end
	return 0, 0, 0
end

-- Lee las medidas que VerityModel guardó en el modelo.
function Pose.read(model: Instance): RigData
	local function v(name: string, default: Vector3): Vector3
		local value = model:GetAttribute(name)
		return if typeof(value) == "Vector3" then value else default
	end
	local function n(name: string, default: number): number
		local value = model:GetAttribute(name)
		return if typeof(value) == "number" then value else default
	end
	local height = n("RigHeight", 16)
	return {
		rootY = n("RootY", height * 0.5),
		hipHeight = n("HipHeightStand", height * 0.42),
		crouchDrop = n("CrouchDrop", height * 0.2),
		crouchAngle = n("CrouchAngle", math.rad(60)),
		waist = v("PivotWaist", Vector3.new(0, height * 0.5, 0)),
		shoulder = v("PivotShoulder", Vector3.new(0, height * 0.72, 0)),
		elbow = v("PivotElbow", Vector3.new(0, height * 0.5, 0)),
		grip = v("PivotGrip", Vector3.new(0, height * 0.25, 0)),
		hasWaist = model:GetAttribute("HasWaist") == true,
		hasArms = model:GetAttribute("HasArms") == true,
	}
end

-- Punto medio entre las dos manos, en espacio del modelo, en el instante t.
function Pose.gripLocal(t: number, rig: RigData): Vector3
	local shoulder, elbow, waist = Pose.killAngles(t)
	if not rig.hasArms then
		-- modelo sin brazos articulados: la víctima "flota" siguiendo la curva
		local lift = math.sin(math.clamp(shoulder / rad(176), 0, 1) * math.pi * 0.5)
		return Vector3.new(0, rig.shoulder.Y * (0.55 + 0.6 * lift), -rig.shoulder.Y * 0.35 * (1 - lift * 0.6))
	end
	if not rig.hasWaist then
		waist = 0
	end
	local upper = CFrame.Angles(shoulder, 0, 0)
	local elbowPos = rig.shoulder + upper:VectorToWorldSpace(rig.elbow - rig.shoulder)
	local grip = elbowPos + (upper * CFrame.Angles(elbow, 0, 0)):VectorToWorldSpace(rig.grip - rig.elbow)
	grip = rig.waist + CFrame.Angles(waist, 0, 0):VectorToWorldSpace(grip - rig.waist)
	return Vector3.new(0, grip.Y, grip.Z)
end

return Pose
