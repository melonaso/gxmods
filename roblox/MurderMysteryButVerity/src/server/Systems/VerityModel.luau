--!strict
-- Prepara el modelo de Verity a partir de cualquier fuente:
--   1. ServerStorage.VerityCharacter  (importado del Toolbox por el usuario)
--   2. InsertService:LoadAsset(Config.Verity.AssetId)
--   3. ServerStorage.VerityFallback   (modelo de respaldo hecho con piezas)
--
-- "Preparar" significa: quitar scripts (los modelos gratis pueden traer
-- virus), asegurar Humanoid y HumanoidRootPart, soldar piezas sueltas,
-- escalar a Config.Verity.Height, medir hombros/codos/manos para la
-- animación del ataque y añadir el punto de agarre para los objetos.

local CollectionService = game:GetService("CollectionService")
local InsertService = game:GetService("InsertService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")
local Workspace = game:GetService("Workspace")

local Assets = require(ReplicatedStorage.Shared.Assets)
local Config = require(ReplicatedStorage.Shared.Config)
local Pose = require(ReplicatedStorage.Shared.VerityPose)
local VerityRig = require(script.Parent.Parent.Lib.VerityRig)

local VerityModel = {}

local template: Model? = nil
local sourceName = "ninguna"

local NAMES = {
	waist = { "Waist" },
	rightShoulder = { "RightShoulder", "Right Shoulder" },
	leftShoulder = { "LeftShoulder", "Left Shoulder" },
	rightElbow = { "RightElbow" },
	leftElbow = { "LeftElbow" },
	rightHip = { "RightHip", "Right Hip" },
	rightKnee = { "RightKnee" },
	rightAnkle = { "RightAnkle" },
}
local HAND_PARTS = { "RightHand", "Right Arm", "RightLowerArm" }
local REMOVE_CLASSES = { "BaseScript", "ModuleScript", "HumanoidDescription", "Tool", "ForceField", "ProximityPrompt", "ClickDetector", "Sound" }
local SCALE_VALUES = { "BodyHeightScale", "BodyWidthScale", "BodyDepthScale", "HeadScale", "BodyProportionScale", "BodyTypeScale" }

local function findMotor(model: Model, names: { string }): Motor6D?
	for _, inst in model:GetDescendants() do
		if inst:IsA("Motor6D") and table.find(names, inst.Name) then
			return inst
		end
	end
	return nil
end

local function verticalExtent(part: BasePart): number
	local cf, half = part.CFrame, part.Size / 2
	return math.abs(cf.RightVector.Y) * half.X + math.abs(cf.UpVector.Y) * half.Y + math.abs(cf.LookVector.Y) * half.Z
end

-- Altura más baja y más alta de las piezas (sin contar la raíz).
local function verticalBounds(model: Model, root: BasePart): (number, number)
	local low, high = math.huge, -math.huge
	for _, inst in model:GetDescendants() do
		if inst:IsA("BasePart") and inst ~= root then
			local e = verticalExtent(inst)
			low = math.min(low, inst.Position.Y - e)
			high = math.max(high, inst.Position.Y + e)
		end
	end
	if low == math.huge then
		low, high = root.Position.Y - root.Size.Y / 2, root.Position.Y + root.Size.Y / 2
	end
	return low, high
end

-- Suelda a la raíz toda pieza que no esté conectada a ella por uniones.
local function weldLoose(model: Model, root: BasePart)
	local links: { [BasePart]: { BasePart } } = {}
	local function link(a: Instance?, b: Instance?)
		if a and b and a:IsA("BasePart") and b:IsA("BasePart") then
			links[a] = links[a] or {}
			links[b] = links[b] or {}
			table.insert(links[a], b)
			table.insert(links[b], a)
		end
	end
	for _, inst in model:GetDescendants() do
		if inst:IsA("JointInstance") then
			link(inst.Part0, inst.Part1)
		elseif inst:IsA("WeldConstraint") then
			link(inst.Part0, inst.Part1)
		end
	end
	local seen: { [BasePart]: boolean } = { [root] = true }
	local queue = { root }
	while #queue > 0 do
		local current = table.remove(queue) :: BasePart
		for _, other in links[current] or {} do
			if not seen[other] then
				seen[other] = true
				table.insert(queue, other)
			end
		end
	end
	for _, inst in model:GetDescendants() do
		if inst:IsA("BasePart") and not seen[inst] then
			local weld = Instance.new("WeldConstraint")
			weld.Part0 = root
			weld.Part1 = inst
			weld.Parent = inst
		end
	end
end

local function prepare(source: Instance): Model?
	local model: Model
	if source:IsA("Model") then
		model = source:Clone()
	else
		local wrapper = Instance.new("Model")
		source:Clone().Parent = wrapper
		model = wrapper
	end
	-- Si el Humanoid está en un submodelo, ese submodelo es el personaje.
	local humanoid = model:FindFirstChildWhichIsA("Humanoid", true)
	if humanoid and humanoid.Parent ~= model and humanoid.Parent and humanoid.Parent:IsA("Model") then
		local inner = humanoid.Parent :: Model
		inner.Parent = nil
		model:Destroy()
		model = inner
	end

	-- Seguridad: fuera scripts y cosas que no deben venir con el modelo.
	for _, inst in model:GetDescendants() do
		for _, class in REMOVE_CLASSES do
			if inst:IsA(class) then
				inst:Destroy()
				break
			end
		end
	end

	if model:GetAttribute("VerityRig") and not model:FindFirstChildWhichIsA("Motor6D", true) then
		VerityRig.assemble(model)
	end

	local hasParts = false
	for _, inst in model:GetDescendants() do
		if inst:IsA("BasePart") then
			hasParts = true
			inst.Anchored = false
		end
	end
	if not hasParts then
		model:Destroy()
		return nil
	end

	humanoid = model:FindFirstChildOfClass("Humanoid")
	if not humanoid then
		humanoid = Instance.new("Humanoid")
		humanoid.Parent = model
	end
	local hum = humanoid :: Humanoid
	for _, name in SCALE_VALUES do
		local value = hum:FindFirstChild(name)
		if value then
			value:Destroy()
		end
	end

	local rootInstance = model:FindFirstChild("HumanoidRootPart")
	local root: BasePart
	if rootInstance and rootInstance:IsA("BasePart") then
		root = rootInstance
	else
		local cf, size = model:GetBoundingBox()
		local newRoot = Instance.new("Part")
		newRoot.Name = "HumanoidRootPart"
		newRoot.Size = Vector3.new(math.max(2, size.X * 0.35), math.max(2, size.Y * 0.15), math.max(1, size.Z * 0.35))
		newRoot.CFrame = CFrame.new(cf.Position)
		newRoot.Parent = model
		root = newRoot
	end
	model.PrimaryPart = root
	weldLoose(model, root)

	-- Escala a la altura deseada.
	local low, high = verticalBounds(model, root)
	if high - low > 0.1 then
		model:ScaleTo(model:GetScale() * Config.Verity.Height / (high - low))
	end
	low, high = verticalBounds(model, root)
	local height = high - low

	-- Física: solo la raíz colisiona y tiene masa.
	for _, inst in model:GetDescendants() do
		if inst:IsA("BasePart") then
			local isRoot = inst == root
			inst.CanCollide = isRoot
			inst.Massless = not isRoot
			inst.CanTouch = true
			if isRoot then
				inst.Transparency = 1
			end
		end
	end

	-- Medidas del rig en espacio del modelo (pies en el origen, mirando a -Z).
	local origin = CFrame.new(root.Position.X, low, root.Position.Z) * root.CFrame.Rotation
	local function local_(p: Vector3): Vector3
		return origin:PointToObjectSpace(p)
	end
	local function pivot(motor: Motor6D): Vector3
		return local_(((motor.Part0 :: BasePart).CFrame * motor.C0).Position)
	end
	local function centered(a: Vector3?, b: Vector3?): Vector3?
		if a and b then
			local m = (a + b) / 2
			return Vector3.new(0, m.Y, m.Z)
		end
		local only = a or b
		return if only then Vector3.new(0, only.Y, only.Z) else nil
	end

	local rootY = root.Position.Y - low
	local hipHeight = math.max(0, root.Position.Y - root.Size.Y / 2 - low)
	model:SetAttribute("RigHeight", height)
	model:SetAttribute("RootY", rootY)
	model:SetAttribute("HipHeightStand", hipHeight)

	local rs, ls = findMotor(model, NAMES.rightShoulder), findMotor(model, NAMES.leftShoulder)
	local re, le = findMotor(model, NAMES.rightElbow), findMotor(model, NAMES.leftElbow)
	local handPart: BasePart? = nil
	for _, name in HAND_PARTS do
		local found = model:FindFirstChild(name, true)
		if found and found:IsA("BasePart") then
			handPart = found
			break
		end
	end
	local shoulder = centered(rs and pivot(rs), ls and pivot(ls))
	if shoulder and handPart then
		local grip = local_(handPart.Position - Vector3.new(0, verticalExtent(handPart) * 0.6, 0))
		grip = Vector3.new(0, grip.Y, grip.Z)
		local elbow = centered(re and pivot(re), le and pivot(le)) or grip
		model:SetAttribute("HasArms", true)
		model:SetAttribute("PivotShoulder", shoulder)
		model:SetAttribute("PivotElbow", elbow)
		model:SetAttribute("PivotGrip", grip)
	else
		model:SetAttribute("HasArms", false)
		model:SetAttribute("PivotShoulder", Vector3.new(0, height * 0.72, 0))
	end
	local waist = findMotor(model, NAMES.waist)
	model:SetAttribute("HasWaist", waist ~= nil)
	model:SetAttribute("PivotWaist", if waist then centered(pivot(waist), nil) else Vector3.new(0, rootY, 0))

	-- Agacharse: cuánto baja la cadera y cuánto se doblan las rodillas.
	local hip, knee, ankle = findMotor(model, NAMES.rightHip), findMotor(model, NAMES.rightKnee), findMotor(model, NAMES.rightAnkle)
	if hip and knee then
		local thigh = (pivot(hip) - pivot(knee)).Magnitude
		local shin = if ankle then (pivot(knee) - pivot(ankle)).Magnitude else pivot(knee).Y
		local legs = thigh + shin
		local drop = math.min(legs * 0.45, hipHeight * 0.8)
		model:SetAttribute("CrouchDrop", drop)
		model:SetAttribute("CrouchAngle", math.acos(math.clamp((legs - drop) / legs, -1, 1)))
	else
		model:SetAttribute("CrouchDrop", math.min(height * 0.12, hipHeight * 0.8))
		model:SetAttribute("CrouchAngle", math.rad(30))
	end

	-- Punto de agarre para los objetos de la tienda (Tools).
	local rightHand = model:FindFirstChild("RightHand")
	if not (rightHand and rightHand:IsA("BasePart")) then
		local anchorPart = handPart or root
		local hand = Instance.new("Part")
		hand.Name = "RightHand"
		hand.Size = Vector3.new(0.6, 0.6, 0.6)
		hand.Transparency = 1
		hand.CanCollide = false
		hand.Massless = true
		hand.CFrame = CFrame.new(anchorPart.Position - Vector3.new(0, verticalExtent(anchorPart) * 0.8, 0)) * root.CFrame.Rotation
		local weld = Instance.new("WeldConstraint")
		weld.Part0 = anchorPart
		weld.Part1 = hand
		weld.Parent = hand
		hand.Parent = model
		rightHand = hand
	end
	if not (rightHand :: Instance):FindFirstChild("RightGripAttachment") then
		local attachment = Instance.new("Attachment")
		attachment.Name = "RightGripAttachment"
		attachment.Position = Vector3.new(0, -(rightHand :: BasePart).Size.Y / 2, 0)
		attachment.Parent = rightHand
	end

	hum.RigType = Enum.HumanoidRigType.R15
	hum.AutomaticScalingEnabled = false
	hum.RequiresNeck = false
	hum.BreakJointsOnDeath = false
	hum.HipHeight = hipHeight
	hum.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
	hum.HealthDisplayType = Enum.HumanoidHealthDisplayType.AlwaysOff
	hum.MaxHealth = 100
	hum.Health = 100

	model.Name = "Verity"
	model:SetAttribute("VerityRig", true)
	CollectionService:AddTag(model, "VerityRig")
	return model
end

local function tryLoadAsset(id: number): Instance?
	if id == 0 then
		return nil
	end
	local ok, container = pcall(InsertService.LoadAsset, InsertService, id)
	if not ok or not container then
		return nil
	end
	local first = (container :: Instance):FindFirstChildWhichIsA("Model") or (container :: Instance):GetChildren()[1]
	return first
end

local function resolve()
	local candidates: { { name: string, get: () -> Instance? } } = {
		{ name = "ServerStorage.VerityCharacter", get = function()
			return ServerStorage:FindFirstChild("VerityCharacter")
		end },
		{ name = `Toolbox {Config.Verity.AssetId}`, get = function()
			return tryLoadAsset(Config.Verity.AssetId)
		end },
		{ name = "ServerStorage.VerityFallback", get = function()
			return ServerStorage:FindFirstChild("VerityFallback")
		end },
	}
	for _, candidate in candidates do
		local source = candidate.get()
		if source then
			local ok, result = pcall(prepare, source)
			if ok and result then
				template = result
				sourceName = candidate.name
				print(`[VerityModel] usando el modelo de {candidate.name} ({string.format("%.1f", result:GetAttribute("RigHeight") :: number)} studs)`)
				Workspace:SetAttribute("VeritySource", sourceName)
				return
			end
			warn(`[VerityModel] no se pudo preparar {candidate.name}: {result}`)
		end
	end
	warn("[VerityModel] no hay ningún modelo de Verity disponible")
end

local function skinDef(key: string)
	for _, skin in Config.Skins do
		if skin.Key == key then
			return skin
		end
	end
	return Config.Skins[1]
end

function VerityModel.applySkin(model: Model, key: string)
	local skin: any = skinDef(key)
	if skin.Amount <= 0 and not skin.Outline and not skin.Aura and not skin.Ghost then
		return
	end
	local highlight = Instance.new("Highlight")
	highlight.Name = "VeritySkin"
	highlight.FillColor = skin.Tint
	highlight.FillTransparency = 1 - skin.Amount
	highlight.OutlineColor = skin.Outline or skin.Tint
	highlight.OutlineTransparency = if skin.Outline then 0.15 else 1
	highlight.DepthMode = Enum.HighlightDepthMode.Occluded
	highlight.Parent = model
	if skin.Ghost then
		for _, inst in model:GetDescendants() do
			if inst:IsA("BasePart") and inst.Name ~= "HumanoidRootPart" then
				inst.Transparency = math.max(inst.Transparency, 0.45)
			end
		end
	end
	if skin.Aura then
		local root = model.PrimaryPart
		if root then
			local aura = Instance.new("ParticleEmitter")
			aura.Name = "SkinAura"
			aura.Texture = if key == "Bloody" and Assets.Streak ~= "" then Assets.Streak else Assets.GlowOrb
			aura.Color = ColorSequence.new(skin.Aura)
			aura.LightEmission = if key == "Bloody" then 0 else 0.8
			aura.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.6), NumberSequenceKeypoint.new(1, 0) })
			aura.Transparency = NumberSequence.new(0.2, 1)
			aura.Lifetime = NumberRange.new(0.8, 1.4)
			aura.Rate = if key == "Bloody" then 18 else 10
			aura.Speed = NumberRange.new(1, 3)
			aura.SpreadAngle = Vector2.new(180, 180)
			aura.Acceleration = if key == "Bloody" then Vector3.new(0, -30, 0) else Vector3.new(0, 2, 0)
			aura.Parent = root
		end
	end
end

-- Devuelve un Verity nuevo (sin parent) con la skin aplicada.
function VerityModel.create(skin: string?): (Model?, Pose.RigData?)
	if not template then
		return nil, nil
	end
	local model = template:Clone()
	VerityModel.applySkin(model, skin or "Classic")
	return model, Pose.read(model)
end

function VerityModel.source(): string
	return sourceName
end

function VerityModel.init()
	resolve()
end

return VerityModel
