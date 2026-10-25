--!strict
-- Verity: apariencia, cuchillo y ataque validado en el servidor.
--
-- Para un modelo propio de Verity, coloca un Model R15 llamado
-- "VerityCharacter" en ServerStorage (con Humanoid, HumanoidRootPart y su
-- script Animate). Si no existe, se aplica un aspecto oscuro al avatar.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Net = require(ReplicatedStorage.Shared.Net)

export type Context = {
	survivors: () -> { Player },
	onKill: (killer: Player, victim: Player) -> (),
}

local Killer = {}

local current: Player? = nil
local context: Context? = nil
local lastAttack = 0
local connections: { RBXScriptConnection } = {}

local function rootOf(player: Player): BasePart?
	local character = player.Character
	local root = character and character:FindFirstChild("HumanoidRootPart")
	return if root and root:IsA("BasePart") then root else nil
end

local function humanoidOf(player: Player): Humanoid?
	local character = player.Character
	return character and character:FindFirstChildOfClass("Humanoid")
end

local function applyFallbackLook(character: Model)
	for _, inst in character:GetDescendants() do
		if inst:IsA("Accessory") or inst:IsA("Shirt") or inst:IsA("Pants") or inst:IsA("ShirtGraphic") then
			inst:Destroy()
		elseif inst:IsA("BasePart") and inst.Name ~= "HumanoidRootPart" then
			inst.Color = Color3.fromRGB(22, 18, 24)
			inst.Material = Enum.Material.SmoothPlastic
		end
	end
	local head = character:FindFirstChild("Head")
	if head and head:IsA("BasePart") then
		local face = head:FindFirstChildOfClass("Decal")
		if face then
			face:Destroy()
		end
		-- Ojos rojos brillantes
		for _, side in { -0.22, 0.22 } do
			local eye = Instance.new("Part")
			eye.Name = "VerityEye"
			eye.Shape = Enum.PartType.Ball
			eye.Size = Vector3.new(0.22, 0.22, 0.22)
			eye.Material = Enum.Material.Neon
			eye.Color = Color3.fromRGB(255, 40, 60)
			eye.CanCollide = false
			eye.Massless = true
			eye.CFrame = head.CFrame * CFrame.new(side, 0.1, -head.Size.Z / 2)
			local weld = Instance.new("WeldConstraint")
			weld.Part0 = head
			weld.Part1 = eye
			weld.Parent = eye
			eye.Parent = character
		end
		-- Capucha simple
		local hood = Instance.new("Part")
		hood.Name = "VerityHood"
		hood.Size = head.Size * Vector3.new(1.25, 1.15, 1.2)
		hood.Color = Color3.fromRGB(14, 10, 16)
		hood.Material = Enum.Material.Fabric
		hood.CanCollide = false
		hood.Massless = true
		hood.CFrame = head.CFrame * CFrame.new(0, 0.12, 0.12)
		local mesh = Instance.new("SpecialMesh")
		mesh.MeshType = Enum.MeshType.Head
		mesh.Parent = hood
		local weld = Instance.new("WeldConstraint")
		weld.Part0 = head
		weld.Part1 = hood
		weld.Parent = hood
		hood.Parent = character
	end
end

local function morph(player: Player): Model?
	local character = player.Character
	if not character then
		return nil
	end
	local template = ServerStorage:FindFirstChild("VerityCharacter")
	if template and template:IsA("Model") and template:FindFirstChildOfClass("Humanoid") then
		local clone = template:Clone()
		clone.Name = player.Name
		clone:PivotTo(character:GetPivot())
		player.Character = clone
		clone.Parent = Workspace
		character:Destroy()
		return clone
	end
	applyFallbackLook(character)
	return character
end

local function makeKnife(): Tool
	local tool = Instance.new("Tool")
	tool.Name = "Cuchillo de Verity"
	tool.CanBeDropped = false
	tool.RequiresHandle = true
	-- Misma orientación que la espada clásica: la hoja va a lo largo de +Z.
	tool.GripForward = Vector3.new(-1, 0, 0)
	tool.GripRight = Vector3.new(0, 1, 0)
	tool.GripUp = Vector3.new(0, 0, 1)
	tool.GripPos = Vector3.new(0, 0, -1.2)
	tool.ToolTip = "Clic para atacar"

	local handle = Instance.new("Part")
	handle.Name = "Handle"
	handle.Size = Vector3.new(0.25, 0.5, 2.8)
	handle.Color = Color3.fromRGB(190, 196, 206)
	handle.Material = Enum.Material.Metal
	handle.CanCollide = false
	handle.Massless = true
	handle.Parent = tool

	local grip = Instance.new("Part")
	grip.Name = "Grip"
	grip.Size = Vector3.new(0.32, 0.55, 1)
	grip.Color = Color3.fromRGB(70, 14, 22)
	grip.Material = Enum.Material.Wood
	grip.CanCollide = false
	grip.Massless = true
	grip.CFrame = handle.CFrame * CFrame.new(0, 0, -1.75)
	local weld = Instance.new("WeldConstraint")
	weld.Part0 = handle
	weld.Part1 = grip
	weld.Parent = grip
	grip.Parent = tool

	local trail0 = Instance.new("Attachment")
	trail0.Position = Vector3.new(0, 0, 1.3)
	trail0.Parent = handle
	local trail1 = Instance.new("Attachment")
	trail1.Position = Vector3.new(0, 0, -0.6)
	trail1.Parent = handle
	local trail = Instance.new("Trail")
	trail.Attachment0 = trail0
	trail.Attachment1 = trail1
	trail.Lifetime = 0.15
	trail.Color = ColorSequence.new(Color3.fromRGB(255, 60, 80))
	trail.Transparency = NumberSequence.new(0.3, 1)
	trail.LightEmission = 1
	trail.Parent = handle

	local slash = Instance.new("Sound")
	slash.Name = "Slash"
	slash.SoundId = "rbxasset://sounds/swordslash.wav"
	slash.Volume = 0.7
	slash.Parent = handle

	return tool
end

local function attack(player: Player, tool: Tool)
	if player ~= current or not context then
		return
	end
	local now = os.clock()
	if now - lastAttack < Config.Killer.AttackCooldown then
		return
	end
	lastAttack = now

	-- El script Animate por defecto reproduce el tajo al ver "toolanim".
	local anim = Instance.new("StringValue")
	anim.Name = "toolanim"
	anim.Value = "Slash"
	anim.Parent = tool
	game:GetService("Debris"):AddItem(anim, 0.5)
	local handle = tool:FindFirstChild("Handle")
	local sound = handle and handle:FindFirstChild("Slash")
	if sound and sound:IsA("Sound") then
		sound:Play()
	end

	local root = rootOf(player)
	if not root then
		return
	end
	local forward = root.CFrame.LookVector * Vector3.new(1, 0, 1)
	forward = if forward.Magnitude > 0 then forward.Unit else Vector3.zAxis

	local best: Player? = nil
	local bestDistance = Config.Killer.AttackRange
	for _, survivor in context.survivors() do
		local targetRoot = rootOf(survivor)
		local humanoid = humanoidOf(survivor)
		if targetRoot and humanoid and humanoid.Health > 0 then
			local offset = targetRoot.Position - root.Position
			local distance = offset.Magnitude
			local flat = offset * Vector3.new(1, 0, 1)
			local facing = if flat.Magnitude > 0.01 then flat.Unit:Dot(forward) else 1
			if distance <= bestDistance and (facing >= Config.Killer.AttackConeDot or distance < 3) then
				best = survivor
				bestDistance = distance
			end
		end
	end

	if best then
		local humanoid = humanoidOf(best)
		local targetRoot = rootOf(best)
		if humanoid and targetRoot then
			Net.get("Effect"):FireAllClients("Slash", targetRoot.Position)
			humanoid.Health = 0
			context.onKill(player, best)
		end
	end
end

-- Convierte al jugador en Verity y lo deja inmóvil hasta release().
function Killer.setup(player: Player, spawn: CFrame, ctx: Context)
	current = player
	context = ctx
	lastAttack = 0
	local character = morph(player)
	if not character then
		return
	end
	character:PivotTo(spawn)
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if humanoid then
		humanoid.WalkSpeed = Config.Killer.WalkSpeed
		humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
	end
	local root = character:FindFirstChild("HumanoidRootPart")
	if root and root:IsA("BasePart") then
		root.Anchored = true
	end
	local highlight = Instance.new("Highlight")
	highlight.Name = "VerityAura"
	highlight.FillTransparency = 1
	highlight.OutlineColor = Color3.fromRGB(255, 40, 60)
	highlight.OutlineTransparency = 0.35
	highlight.DepthMode = Enum.HighlightDepthMode.Occluded
	highlight.Parent = character
end

function Killer.release()
	local player = current
	if not player then
		return
	end
	local root = rootOf(player)
	if root then
		root.Anchored = false
	end
	local tool = makeKnife()
	table.insert(connections, tool.Activated:Connect(function()
		attack(player, tool)
	end))
	tool.Parent = player:FindFirstChildOfClass("Backpack")
	local humanoid = humanoidOf(player)
	if humanoid then
		humanoid:EquipTool(tool)
	end
	local unsheath = Instance.new("Sound")
	unsheath.SoundId = "rbxasset://sounds/unsheath.wav"
	unsheath.Parent = tool:FindFirstChild("Handle")
	unsheath:Play()
end

function Killer.current(): Player?
	return current
end

function Killer.cleanup()
	for _, c in connections do
		c:Disconnect()
	end
	table.clear(connections)
	current = nil
	context = nil
end

function Killer.init()
	Players.PlayerRemoving:Connect(function(player)
		if player == current then
			current = nil
		end
	end)
end

return Killer
