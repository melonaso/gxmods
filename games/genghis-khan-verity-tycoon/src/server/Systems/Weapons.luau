--!strict
-- Armas: se crean por codigo, se guardan en StarterGear (se conservan al morir)
-- y el dano se valida en el servidor (alcance + cooldown). Solo danan a Verity.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)

local Build = require(script.Parent.Parent.Lib.Build)
local Sfx = require(script.Parent.Parent.Lib.Sfx)
local Verity = require(script.Parent.Verity)

type Visual = { Size: Vector3, Color: Color3, Material: Enum.Material, Tip: Color3? }

local VISUALS: { [string]: Visual } = {
	Sable = { Size = Vector3.new(0.3, 0.3, 4.5), Color = Color3.fromRGB(205, 205, 215), Material = Enum.Material.Metal },
	Arco = { Size = Vector3.new(0.4, 0.4, 4.5), Color = Color3.fromRGB(120, 75, 40), Material = Enum.Material.Wood, Tip = Color3.fromRGB(240, 220, 160) },
	Lanza = { Size = Vector3.new(0.4, 0.4, 7.5), Color = Color3.fromRGB(110, 70, 35), Material = Enum.Material.Wood, Tip = Color3.fromRGB(220, 220, 230) },
	Trueno = { Size = Vector3.new(0.5, 0.5, 6), Color = Color3.fromRGB(40, 60, 120), Material = Enum.Material.Metal, Tip = Color3.fromRGB(120, 200, 255) },
}

local Weapons = {}

local bound: { [Tool]: boolean } = setmetatable({}, { __mode = "k" }) :: any
local lastUse: { [Player]: { [string]: number } } = {}

local function playAnim(tool: Tool, name: string)
	-- el script Animate por defecto reacciona a este StringValue
	local anim = Instance.new("StringValue")
	anim.Name = "toolanim"
	anim.Value = name
	anim.Parent = tool
end

local function projectile(from: Vector3, to: Vector3, color: Color3)
	local dist = (to - from).Magnitude
	local bolt = Build.part({
		Name = "Projectile",
		Size = Vector3.new(0.3, 0.3, 2),
		CFrame = CFrame.lookAt(from, to),
		Color = color,
		Material = Enum.Material.Neon,
		CanCollide = false,
		Parent = workspace,
	})
	bolt.CanQuery = false
	bolt.CanTouch = false
	local time = math.clamp(dist / 220, 0.05, 0.5)
	TweenService:Create(bolt, TweenInfo.new(time, Enum.EasingStyle.Linear), { CFrame = CFrame.lookAt(to, to + (to - from)) }):Play()
	task.delay(time + 0.05, function()
		bolt:Destroy()
	end)
end

local function onActivated(tool: Tool)
	local character = tool.Parent
	if not character then
		return
	end
	local player = Players:GetPlayerFromCharacter(character)
	local id = tool:GetAttribute("WeaponId")
	if not player or typeof(id) ~= "string" then
		return
	end
	local def = Config.Weapons[id]
	if not def then
		return
	end

	local t = os.clock()
	local uses = lastUse[player]
	if not uses then
		uses = {}
		lastUse[player] = uses
	end
	if t - (uses[id] or 0) < def.Cooldown then
		return
	end
	uses[id] = t

	local handlePart = tool:FindFirstChild("Handle")
	local soundAt: Instance = if handlePart then handlePart else tool
	if not def.Ranged then
		playAnim(tool, if id == "Lanza" then "Lunge" else "Slash")
		Sfx.play(if id == "Lanza" then Config.Sounds.Lunge else Config.Sounds.Slash, soundAt, { Volume = 0.8 })
	elseif id == "Trueno" then
		Sfx.play(Config.Sounds.Bass, soundAt, { Volume = 1.5, Speed = 0.6 })
	else
		Sfx.play(Config.Sounds.Lunge, soundAt, { Volume = 0.6, Speed = 1.8 })
	end

	local bossPos = Verity.getPosition()
	local root = (character :: Model):FindFirstChild("HumanoidRootPart")
	local humanoid = (character :: Model):FindFirstChildOfClass("Humanoid")
	if not bossPos or not root or not root:IsA("BasePart") or not humanoid or humanoid.Health <= 0 then
		return
	end

	local flat = Vector3.new(bossPos.X - root.Position.X, 0, bossPos.Z - root.Position.Z)
	if flat.Magnitude - Config.Verity.HitRadius > def.Range then
		return
	end

	if def.Ranged then
		local handle = tool:FindFirstChild("Handle")
		local from = if handle and handle:IsA("BasePart") then handle.Position else root.Position
		local visual = VISUALS[id]
		projectile(from, bossPos, if visual and visual.Tip then visual.Tip else Color3.new(1, 1, 1))
	end
	Verity.damage(player, def.Damage)
end

local function bind(tool: Instance)
	if not tool:IsA("Tool") or bound[tool] or tool:GetAttribute("WeaponId") == nil then
		return
	end
	bound[tool] = true
	tool.Activated:Connect(function()
		onActivated(tool)
	end)
end

local function buildTool(id: string): Tool?
	local def = Config.Weapons[id]
	local visual = VISUALS[id]
	if not def or not visual then
		return nil
	end
	local tool = Instance.new("Tool")
	tool.Name = def.DisplayName
	tool.CanBeDropped = false
	tool.RequiresHandle = true
	tool.ToolTip = string.format("Dano %d | Alcance %d", def.Damage, def.Range)
	tool:SetAttribute("WeaponId", id)
	-- empunadura vertical, como la espada clasica
	tool.GripPos = Vector3.new(0, 0, -visual.Size.Z / 2 + 0.6)
	tool.GripForward = Vector3.new(-1, 0, 0)
	tool.GripRight = Vector3.new(0, 1, 0)
	tool.GripUp = Vector3.new(0, 0, 1)

	local handle = Build.part({ Name = "Handle", Size = visual.Size, CFrame = CFrame.new(), Color = visual.Color, Material = visual.Material, Anchored = false, CanCollide = false })
	handle.Massless = true
	handle.Parent = tool

	if visual.Tip then
		local tip = Build.part({
			Name = "Tip",
			Size = Vector3.new(0.7, 0.7, 1.2),
			CFrame = handle.CFrame * CFrame.new(0, 0, -visual.Size.Z / 2 - 0.4),
			Color = visual.Tip,
			Material = if def.Ranged then Enum.Material.Neon else Enum.Material.Metal,
			Anchored = false,
			CanCollide = false,
		})
		tip.Massless = true
		local weld = Instance.new("WeldConstraint")
		weld.Part0 = handle
		weld.Part1 = tip
		weld.Parent = tip
		tip.Parent = tool
	end
	return tool
end

function Weapons.grant(player: Player, id: string)
	local gear = player:FindFirstChild("StarterGear")
	if not gear then
		return
	end
	for _, existing in gear:GetChildren() do
		if existing:GetAttribute("WeaponId") == id then
			return
		end
	end
	local tool = buildTool(id)
	if not tool then
		return
	end
	tool.Parent = gear
	local backpack = player:FindFirstChildOfClass("Backpack")
	if backpack then
		local copy = tool:Clone()
		copy.Parent = backpack
		bind(copy)
	end
end

function Weapons.init()
	local function watchBackpack(player: Player)
		local backpack = player:WaitForChild("Backpack")
		for _, child in backpack:GetChildren() do
			bind(child)
		end
		backpack.ChildAdded:Connect(bind)
	end
	local function hook(player: Player)
		player.CharacterAdded:Connect(function()
			watchBackpack(player)
		end)
		if player.Character then
			task.spawn(watchBackpack, player)
		end
	end
	Players.PlayerAdded:Connect(hook)
	for _, player in Players:GetPlayers() do
		hook(player)
	end
	Players.PlayerRemoving:Connect(function(player)
		lastUse[player] = nil
	end)
end

return Weapons
