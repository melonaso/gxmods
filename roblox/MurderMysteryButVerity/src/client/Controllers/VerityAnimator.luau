--!strict
-- Anima a Verity en cada cliente:
--   - reposo: respiración, brazos colgando y tics de cabeza inquietantes
--   - caminar / correr: zancadas largas; al correr se encorva y los brazos
--     quedan atrás
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
	twitchAt: number,
	twitch: CFrame,
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
		twitchAt = os.clock() + 2,
		twitch = CFrame.identity,
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
	local targetStride = math.clamp(speed / walkSpeed, 0, 1.6)
	rig.stride += (targetStride - rig.stride) * math.min(1, dt * 8)
	local targetCrouch = if model:GetAttribute("Crouching") then 1 else 0
	rig.crouch += (targetCrouch - rig.crouch) * math.min(1, dt * 10)

	-- cadencia: piernas muy largas, más rápida al correr
	rig.phase += dt * (1.8 + speed * 0.17)
	local s = math.sin(rig.phase)
	local c = math.cos(rig.phase)
	local stride = math.min(rig.stride, 1)
	local run = math.clamp(rig.stride - 1, 0, 0.6) / 0.6 -- 0 caminando, 1 corriendo
	local crouch = rig.crouch
	local theta = rig.crouchAngle * crouch
	local hasKnees = rig.joints.LeftKnee ~= nil

	-- piernas
	local swing = s * (0.5 + 0.25 * run) * stride * (1 - crouch * 0.5)
	local liftL = math.max(0, c) * (0.8 + 0.5 * run) * stride
	local liftR = math.max(0, -c) * (0.8 + 0.5 * run) * stride
	set(rig, "LeftHip", rx(theta + swing + 0.15 * run))
	set(rig, "RightHip", rx(theta - swing + 0.15 * run))
	if hasKnees then
		set(rig, "LeftKnee", rx(-2 * theta - liftL))
		set(rig, "RightKnee", rx(-2 * theta - liftR))
		set(rig, "LeftAnkle", rx(theta + liftL * 0.4))
		set(rig, "RightAnkle", rx(theta + liftR * 0.4))
	end

	-- torso: respira en reposo, se encorva al correr y al agacharse
	local breathe = math.sin(clock * 1.4) * 0.03 * (1 - stride)
	local lean = -0.1 * stride - 0.45 * run - 0.35 * crouch
	local bob = math.abs(s) * 0.05 * stride
	set(rig, "Waist", rx(lean + breathe - bob) * CFrame.Angles(0, s * 0.1 * stride, s * 0.04 * stride))

	-- brazos: cuelgan y se balancean; al correr quedan atrás, como arrastrados
	local armSwing = -s * (0.55 - 0.25 * run) * stride
	local dangle = math.sin(clock * 1.1) * 0.06 * (1 - stride)
	local back = -0.7 * run
	set(rig, "LeftShoulder", rx(-armSwing + dangle + back + 0.25 * crouch) * CFrame.Angles(0, 0, -0.07 - 0.1 * run))
	set(rig, "RightShoulder", rx(armSwing - dangle + back + 0.25 * crouch) * CFrame.Angles(0, 0, 0.07 + 0.1 * run))
	set(rig, "LeftElbow", rx(math.max(0, -armSwing) * 0.5 + 0.12))
	set(rig, "RightElbow", rx(math.max(0, armSwing) * 0.5 + 0.12))
	set(rig, "LeftWrist", rx(-0.15 + math.sin(clock * 2.3) * 0.08))
	set(rig, "RightWrist", rx(-0.15 + math.sin(clock * 2.1 + 1) * 0.08))

	-- cabeza: compensa la inclinación; en reposo, tics bruscos cada pocos segundos
	if clock >= rig.twitchAt then
		rig.twitchAt = clock + 1.5 + math.random() * 3
		rig.twitch = CFrame.Angles((math.random() - 0.5) * 0.5, (math.random() - 0.5) * 0.9, (math.random() - 0.5) * 0.8)
	end
	local rest = 1 - math.min(1, rig.stride * 1.5)
	local twitch = CFrame.identity:Lerp(rig.twitch, rest)
	set(rig, "Neck", rx(-lean * 0.7 + c * 0.05 * stride + 0.25 * run) * twitch)
	set(rig, "HeadJoint", CFrame.Angles(0, 0, math.sin(clock * 0.6) * 0.12 * rest))
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
