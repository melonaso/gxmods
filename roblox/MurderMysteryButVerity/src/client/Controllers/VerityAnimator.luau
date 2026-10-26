--!strict
-- Anima a Verity en cada cliente, con andares de monstruo:
--   - reposo: encorvada, con la cabeza muy ladeada (cuello roto), respiración
--     pesada, brazos colgando que se mecen y espasmos bruscos de cabeza,
--     hombros y dedos cada pocos segundos
--   - caminar (acechar): zancadas largas y lentas con las rodillas dobladas,
--     la cadera se balancea y gira, los brazos cuelgan y se balancean con
--     retraso, como sin vida (uno más que otro), y la cabeza ladeada cabecea
--   - correr (atributo Sprinting): se lanza hacia delante casi a cuatro patas,
--     torso muy inclinado, cabeza levantada mirando a la presa, brazos
--     abiertos estirados hacia delante agarrando el aire, zancadas enormes con
--     las rodillas muy altas y temblores nerviosos por todo el cuerpo
--   - agacharse (C): rodillas flexionadas que coinciden con la bajada de cadera
--   - transformación: se estira, abre los brazos y echa la cabeza atrás
--   - ataque (Q): sigue la misma línea de tiempo que usa el servidor
--
-- Funciona con cualquier rig (R15, R6 o personalizado): busca las uniones por
-- nombre y aplica las rotaciones en el marco del torso. Escribe C0 en local
-- (en vez de Motor6D.Transform), así ningún Animator de Roblox lo pisa, y
-- recoge las uniones aunque lleguen después del modelo.

local CollectionService = game:GetService("CollectionService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Pose = require(ReplicatedStorage.Shared.VerityPose)

local JOINTS: { [string]: { string } } = {
	Waist = { "Waist" },
	Neck = { "Neck" },
	HeadJoint = { "HeadJoint" },
	LeftShoulder = { "LeftShoulder", "Left Shoulder" },
	RightShoulder = { "RightShoulder", "Right Shoulder" },
	LeftElbow = { "LeftElbow" },
	RightElbow = { "RightElbow" },
	LeftWrist = { "LeftWrist" },
	RightWrist = { "RightWrist" },
	LeftHip = { "LeftHip", "Left Hip" },
	RightHip = { "RightHip", "Right Hip" },
	LeftKnee = { "LeftKnee" },
	RightKnee = { "RightKnee" },
	LeftAnkle = { "LeftAnkle" },
	RightAnkle = { "RightAnkle" },
}

type Joint = { motor: Motor6D, base: CFrame, frame: CFrame }
type Rig = {
	model: Model,
	root: BasePart?,
	joints: { [string]: Joint },
	crouchAngle: number,
	phase: number,
	crouch: number,
	stride: number,
	run: number,
	tilt: number, -- ladeo de la cabeza (cambia de lado de vez en cuando)
	tiltTarget: number,
	tiltAt: number,
	spasm: number, -- espasmo de todo el cuerpo (decae)
	twitchAt: number,
	twitch: CFrame,
	seed: number,
	connection: RBXScriptConnection?,
}

local VerityAnimator = {}

local rigs: { [Model]: Rig } = {}

local function addJoint(rig: Rig, inst: Instance)
	if not inst:IsA("Motor6D") then
		return
	end
	for key, names in JOINTS do
		if not rig.joints[key] and table.find(names, inst.Name) then
			rig.joints[key] = { motor = inst, base = inst.C0, frame = inst.C0.Rotation }
		end
	end
end

local function track(model: Instance)
	if not model:IsA("Model") or rigs[model] then
		return
	end
	local rig: Rig = {
		model = model,
		root = nil,
		joints = {},
		crouchAngle = Pose.read(model).crouchAngle,
		phase = 0,
		crouch = 0,
		stride = 0,
		run = 0,
		tilt = 0.45,
		tiltTarget = 0.45,
		tiltAt = os.clock() + 6,
		spasm = 0,
		twitchAt = os.clock() + 2,
		twitch = CFrame.identity,
		seed = math.random() * 100,
	}
	for _, inst in model:GetDescendants() do
		addJoint(rig, inst)
	end
	-- las piezas pueden llegar después que el modelo: se recogen al llegar
	rig.connection = model.DescendantAdded:Connect(function(inst)
		addJoint(rig, inst)
	end)
	rigs[model] = rig
end

local function untrack(model: Model)
	local rig = rigs[model]
	if rig and rig.connection then
		rig.connection:Disconnect()
	end
	rigs[model] = nil
end

-- Aplica una rotación expresada en el marco del modelo (X = derecha,
-- ángulo positivo = hacia delante) a la unión, sea cual sea su C0.
local function set(rig: Rig, name: string, rotation: CFrame)
	local joint = rig.joints[name]
	if joint and joint.motor.Parent then
		joint.motor.C0 = joint.base * (joint.frame:Inverse() * rotation * joint.frame)
	end
end

local function rx(a: number): CFrame
	return CFrame.Angles(a, 0, 0)
end

local function smooth(a: number): number
	a = math.clamp(a, 0, 1)
	return a * a * (3 - 2 * a)
end

local function animate(rig: Rig, dt: number)
	local model = rig.model
	local root = rig.root
	if not root then
		local found = model:FindFirstChild("HumanoidRootPart")
		if found and found:IsA("BasePart") then
			rig.root = found
			root = found
		else
			return
		end
	end
	local clock = os.clock()

	-- Ataque (Q)
	local killStart = model:GetAttribute("KillStart") :: number?
	if killStart then
		local t = Workspace:GetServerTimeNow() - killStart
		local shoulder, elbow, waist = Pose.killAngles(t)
		local inward = math.rad(14) * math.clamp(shoulder / math.rad(60), 0, 1)
		set(rig, "Waist", rx(waist))
		set(rig, "LeftShoulder", rx(shoulder) * CFrame.Angles(0, 0, inward))
		set(rig, "RightShoulder", rx(shoulder) * CFrame.Angles(0, 0, -inward))
		set(rig, "LeftElbow", rx(elbow))
		set(rig, "RightElbow", rx(elbow))
		set(rig, "Neck", rx(-waist * 0.4) * CFrame.Angles(0, 0, math.sin(clock * 30) * 0.05))
		for _, name in { "HeadJoint", "LeftHip", "RightHip", "LeftKnee", "RightKnee", "LeftAnkle", "RightAnkle", "LeftWrist", "RightWrist" } do
			set(rig, name, CFrame.identity)
		end
		return
	end

	-- Transformación: se estira desde encogida, abre los brazos y ruge
	local transformStart = model:GetAttribute("TransformStart") :: number?
	if transformStart then
		local t = (Workspace:GetServerTimeNow() - transformStart) / Config.Round.TransformTime
		local curl = 1 - smooth(t * 1.6) -- encogida al principio
		local open = smooth((t - 0.45) * 2.5) -- brazos abiertos al final
		local jitter = (1 - t) * 0.12
		local function j(): number
			return (math.random() - 0.5) * jitter
		end
		set(rig, "Waist", rx(math.rad(-55) * curl + math.rad(14) * open + j()))
		set(rig, "Neck", rx(math.rad(-30) * curl + math.rad(30) * open) * CFrame.Angles(j(), j(), j()))
		set(rig, "LeftShoulder", rx(math.rad(40) * curl + math.rad(60) * open) * CFrame.Angles(0, 0, -math.rad(70) * open + j()))
		set(rig, "RightShoulder", rx(math.rad(40) * curl + math.rad(60) * open) * CFrame.Angles(0, 0, math.rad(70) * open + j()))
		set(rig, "LeftElbow", rx(math.rad(90) * curl + j()))
		set(rig, "RightElbow", rx(math.rad(90) * curl + j()))
		set(rig, "LeftHip", rx(math.rad(60) * curl))
		set(rig, "RightHip", rx(math.rad(60) * curl))
		set(rig, "LeftKnee", rx(-math.rad(110) * curl))
		set(rig, "RightKnee", rx(-math.rad(110) * curl))
		set(rig, "LeftAnkle", rx(math.rad(50) * curl))
		set(rig, "RightAnkle", rx(math.rad(50) * curl))
		return
	end

	local velocity = root.AssemblyLinearVelocity * Vector3.new(1, 0, 1)
	local speed = velocity.Magnitude
	local walkSpeed = Config.Movement.VerityWalk
	rig.stride += (math.clamp(speed / walkSpeed, 0, 1.6) - rig.stride) * math.min(1, dt * 8)
	-- corre cuando esprinta (jugador con Shift o la Verity NPC persiguiendo)
	local sprinting = model:GetAttribute("Sprinting") == true and speed > 8
	rig.run += ((if sprinting then 1 else 0) - rig.run) * math.min(1, dt * 5)
	local targetCrouch = if model:GetAttribute("Crouching") then 1 else 0
	rig.crouch += (targetCrouch - rig.crouch) * math.min(1, dt * 10)

	-- cadencia: piernas larguísimas; al correr, zancadas más rápidas
	rig.phase += dt * (1.5 + speed * 0.14 + rig.run * 1.2)
	local ph = rig.phase
	local s = math.sin(ph)
	local c = math.cos(ph)
	local stride = math.min(rig.stride, 1)
	local run = rig.run * stride
	local walk = stride * (1 - rig.run)
	local crouch = rig.crouch
	local theta = rig.crouchAngle * crouch
	local hasKnees = rig.joints.LeftKnee ~= nil
	local rest = 1 - math.min(1, rig.stride * 1.5)
	local seed = rig.seed
	-- ruido suave para temblores (más fuerte corriendo)
	local function noise(k: number, freq: number): number
		return math.noise(clock * freq, seed + k, 0) * 2
	end
	local shake = 0.03 + 0.07 * run

	-- espasmos: un tirón brusco de todo el cuerpo de vez en cuando
	if clock >= rig.twitchAt then
		rig.twitchAt = clock + 1.2 + math.random() * (if run > 0.5 then 1.5 else 3.5)
		rig.twitch = CFrame.Angles((math.random() - 0.5) * 0.6, (math.random() - 0.5) * 1.0, (math.random() - 0.5) * 0.9)
		rig.spasm = 1
	end
	rig.spasm = math.max(0, rig.spasm - dt * 3.5)
	local spasm = rig.spasm * rig.spasm

	-- la cabeza ladeada cambia de lado de golpe cada cierto tiempo
	if clock >= rig.tiltAt then
		rig.tiltAt = clock + 5 + math.random() * 6
		rig.tiltTarget = (if math.random() < 0.5 then -1 else 1) * (0.35 + math.random() * 0.25)
	end
	rig.tilt += (rig.tiltTarget - rig.tilt) * math.min(1, dt * 6)

	-- PIERNAS -----------------------------------------------------------------
	-- caminar: zancada larga con las rodillas siempre algo dobladas
	-- correr: zancadas enormes, rodillas muy altas, cadera adelantada
	local hipAmp = 0.5 * walk + 0.95 * run
	local hipBase = theta + 0.12 * walk + 0.45 * run
	local liftAmp = 0.85 * walk + 1.5 * run
	local bend = 0.18 * walk + 0.35 * run + 0.08 * rest
	local swing = s * hipAmp * (1 - crouch * 0.5)
	local liftL = math.max(0, c) * liftAmp
	local liftR = math.max(0, -c) * liftAmp
	set(rig, "LeftHip", rx(hipBase + swing) * CFrame.Angles(0, 0, -0.04 * run))
	set(rig, "RightHip", rx(hipBase - swing) * CFrame.Angles(0, 0, 0.04 * run))
	if hasKnees then
		set(rig, "LeftKnee", rx(-2 * theta - bend - liftL))
		set(rig, "RightKnee", rx(-2 * theta - bend - liftR))
		set(rig, "LeftAnkle", rx(theta + bend * 0.5 + liftL * 0.35 - math.max(0, -s) * 0.3 * stride))
		set(rig, "RightAnkle", rx(theta + bend * 0.5 + liftR * 0.35 - math.max(0, s) * 0.3 * stride))
	end

	-- TORSO -------------------------------------------------------------------
	-- reposo: encorvada y respirando hondo; caminar: cadera que se mece y
	-- gira; correr: casi a cuatro patas, el pecho sube y baja a cada zancada
	local breathe = math.sin(clock * 1.2) * 0.05 * rest
	local lean = -0.14 * rest - 0.3 * walk - 0.8 * run - 0.35 * crouch
	local heave = math.sin(ph * 2) * (0.05 * walk + 0.1 * run)
	local twist = s * (0.16 * walk + 0.22 * run)
	local sway = s * 0.09 * walk + noise(1, 1.3) * shake
	set(rig, "Waist", rx(lean + breathe + heave + noise(2, 2) * shake) * CFrame.Angles(0, twist, sway) * CFrame.identity:Lerp(rig.twitch, spasm * 0.3))

	-- BRAZOS ------------------------------------------------------------------
	-- caminar: cuelgan y se balancean con retraso (como peso muerto), el
	-- derecho más flojo que el izquierdo
	-- correr: abiertos y estirados hacia delante, alternando como si
	-- quisiera agarrar algo, con los dedos crispados
	local lag = math.sin(ph - 0.7)
	local walkArmL = -lag * 0.5 * walk
	local walkArmR = lag * 0.32 * walk
	local reach = 1.05 * run -- brazos hacia delante al correr
	local claw = s * 0.55 * run
	local dangle = math.sin(clock * 1.1) * 0.07 * rest
	local spread = 0.08 * rest + 0.1 * walk + 0.6 * run
	set(rig, "LeftShoulder",
		rx(walkArmL + reach - claw + dangle + 0.25 * crouch + noise(3, 3) * shake + 0.06 * rest)
			* CFrame.Angles(0, 0, -spread - noise(4, 2) * shake))
	set(rig, "RightShoulder",
		rx(walkArmR + reach + claw - dangle + 0.25 * crouch + noise(5, 3) * shake + 0.02 * rest)
			* CFrame.Angles(0, 0, spread + noise(6, 2) * shake))
	set(rig, "LeftElbow", rx(0.15 + math.max(0, -lag) * 0.45 * walk + (0.4 + math.max(0, -s) * 0.5) * run))
	set(rig, "RightElbow", rx(0.1 + math.max(0, lag) * 0.3 * walk + (0.4 + math.max(0, s) * 0.5) * run))
	set(rig, "LeftWrist", rx(-0.25 - 0.35 * run + math.sin(clock * 2.3) * 0.08 + noise(7, 6) * shake * 2))
	set(rig, "RightWrist", rx(-0.3 - 0.35 * run + math.sin(clock * 2.1 + 1) * 0.08 + noise(8, 6) * shake * 2))

	-- CABEZA ------------------------------------------------------------------
	-- siempre ladeada (cuello roto); al caminar cabecea con cada paso y al
	-- correr se levanta para mirar al frente pese al torso inclinado
	local look = -lean * (0.55 + 0.35 * run) + 0.05 * run
	local nod = c * 0.07 * walk + math.sin(ph * 2) * 0.06 * run
	local twitch = CFrame.identity:Lerp(rig.twitch, math.max(rest, spasm))
	set(rig, "Neck", rx(look + nod + noise(9, 4) * shake) * CFrame.Angles(0, noise(10, 0.7) * 0.15 * rest, rig.tilt * 0.45) * twitch)
	set(rig, "HeadJoint", CFrame.Angles(noise(11, 5) * shake, 0, rig.tilt * 0.55 + math.sin(clock * 0.6) * 0.1 * rest))
end

function VerityAnimator.start()
	for _, model in CollectionService:GetTagged("VerityRig") do
		track(model)
	end
	CollectionService:GetInstanceAddedSignal("VerityRig"):Connect(track)
	CollectionService:GetInstanceRemovedSignal("VerityRig"):Connect(function(model)
		untrack(model :: Model)
	end)

	RunService.Stepped:Connect(function(_, dt)
		for model, rig in rigs do
			if not model.Parent then
				untrack(model)
				continue
			end
			local root = rig.root
			local busy = model:GetAttribute("KillStart") ~= nil or model:GetAttribute("TransformStart") ~= nil
			if busy or not root or not root.Anchored then
				animate(rig, dt)
			end
		end
	end)
end

return VerityAnimator
