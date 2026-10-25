--!strict
-- Medidas del rig de Verity y línea de tiempo del ataque "levantar y
-- aplastar". El cliente la usa para animar y el servidor para saber dónde
-- están las manos (y mover a la víctima con ellas) sin depender de la red.
-- Las medidas deben coincidir con tools/verity_rig.py.

local Pose = {}

Pose.RootY = 8.2 -- altura del centro de HumanoidRootPart sobre los pies
Pose.HipHeight = 7
Pose.Waist = Vector3.new(0, 8.0, 0)
Pose.Shoulder = Vector3.new(1.35, 11.5, 0)
Pose.UpperArm = 3.6
Pose.ForearmToGrip = 4.2 -- antebrazo + mitad de la mano
Pose.Thigh = 3.5
Pose.Shin = 3.1
Pose.CrouchDrop = 3.5 -- cuánto baja la cadera al agacharse
Pose.CrouchAngle = math.acos((Pose.Thigh + Pose.Shin - Pose.CrouchDrop) / (Pose.Thigh + Pose.Shin))

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

-- Punto medio entre las dos manos, en espacio del modelo (pies en el origen).
function Pose.gripLocal(t: number): Vector3
	local shoulder, elbow, waist = Pose.killAngles(t)
	local upper = CFrame.Angles(shoulder, 0, 0)
	local elbowPos = Pose.Shoulder + upper:VectorToWorldSpace(Vector3.new(0, -Pose.UpperArm, 0))
	local grip = elbowPos + (upper * CFrame.Angles(elbow, 0, 0)):VectorToWorldSpace(Vector3.new(0, -Pose.ForearmToGrip, 0))
	grip = Pose.Waist + CFrame.Angles(waist, 0, 0):VectorToWorldSpace(grip - Pose.Waist)
	return Vector3.new(0, grip.Y, grip.Z)
end

return Pose
