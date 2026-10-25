--!strict
-- Anima a Verity en cada cliente modificando Motor6D.Transform:
--   - caminar / correr: zancadas largas, brazos colgando que se balancean
--   - agacharse (C): rodillas flexionadas que coinciden con la bajada de cadera
--   - ataque (Q): sigue la misma línea de tiempo que usa el servidor
-- Funciona con cualquier rig (R15, R6 o personalizado): busca las uniones por
-- nombre y aplica las rotaciones en el marco del torso, así que no importa
-- cómo estén orientadas las uniones del modelo. No hay AnimationTracks.

local CollectionService = game:GetService("CollectionService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

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

type Joint = { motor: Motor6D, frame: CFrame } -- frame = rotación de C0
type Rig = {
	model: Model,
	root: BasePart,
	joints: { [string]: Joint },
	crouchAngle: number,
	phase: number,
	crouch: number, -- 0..1 suavizado
	stride: number, -- 0..1 suavizado según la velocidad
}

local VerityAnimator = {}

local rigs: { [Model]: Rig } = {}

local function track(model: Instance)
	if not model:IsA("Model") then
		return
	end
	local root = model:WaitForChild("HumanoidRootPart", 5)
	if not (root and root:IsA("BasePart")) then
		return
	end
	local joints: { [string]: Joint } = {}
	for _, inst in model:GetDescendants() do
		if inst:IsA("Motor6D") then
			for key, names in JOINTS do
				if not joints[key] and table.find(names, inst.Name) then
					joints[key] = { motor = inst, frame = inst.C0.Rotation }
				end
			end
		end
	end
	local data = Pose.read(model)
	rigs[model] = { model = model, root = root, joints = joints, crouchAngle = data.crouchAngle, phase = 0, crouch = 0, stride = 0 }
end

-- Aplica una rotación expresada en el marco del modelo (X = derecha,
-- ángulo positivo = hacia delante) a la unión, sea cual sea su C0.
local function set(rig: Rig, name: string, rotation: CFrame)
	local joint = rig.joints[name]
	if joint then
		joint.motor.Transform = joint.frame:Inverse() * rotation * joint.frame
	end
end

local function rx(a: number): CFrame
	return CFrame.Angles(a, 0, 0)
end

local function animate(rig: Rig, dt: number)
	local model = rig.model
	local clock = os.clock()

	local killStart = model:GetAttribute("KillStart") :: number?
	if killStart then
		local t = Workspace:GetServerTimeNow() - killStart
		local shoulder, elbow, waist = Pose.killAngles(t)
		-- los brazos se cierran un poco hacia el centro para "sujetar"
		local inward = math.rad(14) * math.clamp(shoulder / math.rad(60), 0, 1)
		set(rig, "Waist", rx(waist))
		set(rig, "LeftShoulder", rx(shoulder) * CFrame.Angles(0, 0, inward))
		set(rig, "RightShoulder", rx(shoulder) * CFrame.Angles(0, 0, -inward))
		set(rig, "LeftElbow", rx(elbow))
		set(rig, "RightElbow", rx(elbow))
		set(rig, "Neck", rx(-waist * 0.4))
		set(rig, "HeadJoint", CFrame.Angles(math.rad(-10), 0, math.sin(clock * 30) * 0.05))
		for _, name in { "LeftHip", "RightHip", "LeftKnee", "RightKnee", "LeftAnkle", "RightAnkle", "LeftWrist", "RightWrist" } do
			set(rig, name, CFrame.identity)
		end
		return
	end

	local velocity = rig.root.AssemblyLinearVelocity * Vector3.new(1, 0, 1)
	local speed = velocity.Magnitude
	local targetStride = math.clamp(speed / 20, 0, 1.3)
	rig.stride += (targetStride - rig.stride) * math.min(1, dt * 8)
	local targetCrouch = if model:GetAttribute("Crouching") then 1 else 0
	rig.crouch += (targetCrouch - rig.crouch) * math.min(1, dt * 10)

	-- cadencia lenta: piernas muy largas
	rig.phase += dt * (2.2 + speed * 0.16)
	local s = math.sin(rig.phase)
	local c = math.cos(rig.phase)
	local stride = rig.stride
	local crouch = rig.crouch
	local hasKnees = rig.joints.LeftKnee ~= nil
	local theta = rig.crouchAngle * crouch

	-- piernas
	local swing = s * 0.55 * stride * (1 - crouch * 0.5)
	local liftL = math.max(0, c) * 0.9 * stride
	local liftR = math.max(0, -c) * 0.9 * stride
	set(rig, "LeftHip", rx(theta + swing))
	set(rig, "RightHip", rx(theta - swing))
	if hasKnees then
		set(rig, "LeftKnee", rx(-2 * theta - liftL))
		set(rig, "RightKnee", rx(-2 * theta - liftR))
		set(rig, "LeftAnkle", rx(theta + liftL * 0.4))
		set(rig, "RightAnkle", rx(theta + liftR * 0.4))
	end

	-- torso: se inclina al correr y al agacharse; respiración en reposo
	local breathe = math.sin(clock * 1.6) * 0.02 * (1 - stride)
	local lean = -0.12 * stride - 0.35 * crouch
	set(rig, "Waist", rx(lean + breathe) * CFrame.Angles(0, s * 0.08 * stride, 0))

	-- brazos colgantes, desfasados de las piernas
	local armSwing = -s * 0.5 * stride
	local dangle = math.sin(clock * 1.3) * 0.05
	set(rig, "LeftShoulder", rx(-armSwing + dangle + 0.25 * crouch) * CFrame.Angles(0, 0, -0.06))
	set(rig, "RightShoulder", rx(armSwing - dangle + 0.25 * crouch) * CFrame.Angles(0, 0, 0.06))
	set(rig, "LeftElbow", rx(math.max(0, -armSwing) * 0.5 + 0.1))
	set(rig, "RightElbow", rx(math.max(0, armSwing) * 0.5 + 0.1))
	set(rig, "LeftWrist", rx(-0.1))
	set(rig, "RightWrist", rx(-0.1))

	-- cabeza: compensa la inclinación y hace un ladeo inquietante en reposo
	local tilt = math.sin(clock * 0.7) * 0.18 * (1 - stride)
	set(rig, "Neck", rx(-lean * 0.7 + c * 0.04 * stride) * CFrame.Angles(0, math.sin(clock * 0.45) * 0.15, tilt))
	set(rig, "HeadJoint", CFrame.identity)
end

function VerityAnimator.start()
	for _, model in CollectionService:GetTagged("VerityRig") do
		task.spawn(track, model)
	end
	CollectionService:GetInstanceAddedSignal("VerityRig"):Connect(track)
	CollectionService:GetInstanceRemovedSignal("VerityRig"):Connect(function(model)
		rigs[model :: Model] = nil
	end)

	RunService.Stepped:Connect(function(_, dt)
		for model, rig in rigs do
			if model.Parent and rig.root.Parent then
				if not rig.root.Anchored or model:GetAttribute("KillStart") then
					animate(rig, dt)
				end
			else
				rigs[model] = nil
			end
		end
	end)
end

return VerityAnimator
