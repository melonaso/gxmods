--!strict
-- Armas: se crean por codigo, se guardan en StarterGear (se conservan al morir)
-- y el dano se valida en el servidor (alcance + cooldown). Solo danan a Verity.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local Types = require(Shared.Types)

local Build = require(script.Parent.Parent.Lib.Build)
local Sfx = require(script.Parent.Parent.Lib.Sfx)
local Verity = require(script.Parent.Verity)

type Visual = { Size: Vector3, Color: Color3, Material: Enum.Material, Tip: Color3? }

local VISUALS: { [string]: Visual } = {
	Sable = { Size = Vector3.new(0.3, 0.3, 4.5), Color = Color3.fromRGB(205, 205, 215), Material = Enum.Material.Metal },
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

-- ===== Arco compuesto: disparo =====

local B = Config.Bow

local function arrowProjectile(from: Vector3, to: Vector3)
	local dist = (to - from).Magnitude
	local arrow = Build.part({
		Name = "Arrow",
		Size = Vector3.new(0.14, 0.14, 3),
		CFrame = CFrame.lookAt(from, to),
		Color = Color3.fromRGB(110, 75, 40),
		Material = Enum.Material.Wood,
		CanCollide = false,
		Parent = workspace,
	})
	arrow.CanQuery = false
	arrow.CanTouch = false
	local a0 = Instance.new("Attachment")
	a0.Position = Vector3.new(0, 0.08, 1.4)
	a0.Parent = arrow
	local a1 = Instance.new("Attachment")
	a1.Position = Vector3.new(0, -0.08, 1.4)
	a1.Parent = arrow
	local trail = Instance.new("Trail")
	trail.Attachment0 = a0
	trail.Attachment1 = a1
	trail.Lifetime = 0.2
	trail.Color = ColorSequence.new(Color3.fromRGB(240, 230, 200))
	trail.Transparency = NumberSequence.new(0.4, 1)
	trail.Parent = arrow
	local time = math.clamp(dist / 180, 0.05, 0.6)
	TweenService:Create(arrow, TweenInfo.new(time, Enum.EasingStyle.Linear), { CFrame = CFrame.lookAt(to, to + (to - from)) }):Play()
	task.delay(time + 0.3, function()
		arrow:Destroy()
	end)
end

-- Tensa (los clientes lo animan a partir de ShotAt) y dispara al terminar.
-- Sin Verity a tiro, la flecha sale igual hacia delante.
local function shootBow(tool: Tool, player: Player, character: Model, def: Types.WeaponDef)
	tool:SetAttribute("ShotAt", workspace:GetServerTimeNow())
	local handle = tool:FindFirstChild("Handle")
	if handle then
		Sfx.play(Config.Sounds.BowDraw, handle, { Volume = 0.6, Speed = 0.5 })
	end
	task.delay(B.DrawTime, function()
		if tool.Parent ~= character then
			return -- lo guardo antes de soltar
		end
		local root = character:FindFirstChild("HumanoidRootPart")
		local humanoid = character:FindFirstChildOfClass("Humanoid")
		if not (root and root:IsA("BasePart") and humanoid and humanoid.Health > 0) then
			return
		end
		local from = if handle and handle:IsA("BasePart") then handle.Position else root.Position
		local bossPos = Verity.getPosition()
		local to: Vector3
		local hit = false
		if bossPos and Vector3.new(bossPos.X - root.Position.X, 0, bossPos.Z - root.Position.Z).Magnitude - Verity.getHitRadius() <= def.Range then
			to = bossPos
			hit = true
		else
			to = from + root.CFrame.LookVector * def.Range
		end
		arrowProjectile(from, to)
		Sfx.play(Config.Sounds.Lunge, if handle then handle else root, { Volume = 0.7, Speed = 1.8 })
		if hit then
			Verity.damage(player, def.Damage)
		end
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

	if id == "Arco" then
		shootBow(tool, player, character :: Model, def)
		return
	end

	local handlePart = tool:FindFirstChild("Handle")
	local soundAt: Instance = if handlePart then handlePart else tool
	if not def.Ranged then
		playAnim(tool, if id == "Lanza" then "Lunge" else "Slash")
		Sfx.play(if id == "Lanza" then Config.Sounds.Lunge else Config.Sounds.Slash, soundAt, { Volume = 0.8 })
	else
		Sfx.play(Config.Sounds.Bass, soundAt, { Volume = 1.5, Speed = 0.6 })
	end

	local bossPos = Verity.getPosition()
	local root = (character :: Model):FindFirstChild("HumanoidRootPart")
	local humanoid = (character :: Model):FindFirstChildOfClass("Humanoid")
	if not bossPos or not root or not root:IsA("BasePart") or not humanoid or humanoid.Health <= 0 then
		return
	end

	local flat = Vector3.new(bossPos.X - root.Position.X, 0, bossPos.Z - root.Position.Z)
	if flat.Magnitude - Verity.getHitRadius() > def.Range then
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

-- Arco recurvo mongol: mango forrado, palas curvas con las puntas (siyah)
-- hacia delante, cuerda en dos mitades y flecha encordada. La cuerda y la
-- flecha van con Weld (no WeldConstraint) para que el cliente las mueva al
-- tensar cambiando Weld.C0 (Controllers/BowAnimator).
local function buildBow(def: Types.WeaponDef): Tool
	local tool = Instance.new("Tool")
	tool.Name = def.DisplayName
	tool.CanBeDropped = false
	tool.RequiresHandle = true
	tool.ToolTip = string.format("Dano %d | Alcance %d", def.Damage, def.Range)
	tool:SetAttribute("WeaponId", "Arco")
	tool.GripPos = Vector3.zero
	tool.GripForward = Vector3.new(-1, 0, 0)
	tool.GripRight = Vector3.new(0, 1, 0)
	tool.GripUp = Vector3.new(0, 0, 1)

	local wood = Color3.fromRGB(95, 60, 30)
	local handle = Build.part({ Name = "Handle", Size = Vector3.new(0.3, 0.45, 1.2), CFrame = CFrame.new(), Color = wood, Material = Enum.Material.Wood, Anchored = false, CanCollide = false })
	handle.Massless = true
	handle.Parent = tool

	local function fixed(name: string, size: Vector3, cf: CFrame, color: Color3, material: Enum.Material, weldTo: BasePart?): Part
		local p = Build.part({ Name = name, Size = size, CFrame = cf, Color = color, Material = material, Anchored = false, CanCollide = false })
		p.Massless = true
		p.CanQuery = false
		p.CanTouch = false
		local weld = Instance.new("WeldConstraint")
		weld.Part0 = weldTo or handle
		weld.Part1 = p
		weld.Parent = p
		p.Parent = tool
		return p
	end

	local function movable(name: string, size: Vector3, cf: CFrame, color: Color3, material: Enum.Material): Part
		local p = Build.part({ Name = name, Size = size, CFrame = cf, Color = color, Material = material, Anchored = false, CanCollide = false })
		p.Massless = true
		p.CanQuery = false
		p.CanTouch = false
		local weld = Instance.new("Weld")
		weld.Name = "BowWeld"
		weld.Part0 = handle
		weld.Part1 = p
		weld.C0 = cf -- el mango esta en el origen al construir
		weld.Parent = p
		p.Parent = tool
		return p
	end

	-- forro rojo del agarre
	fixed("Wrap", Vector3.new(0.36, 0.5, 0.7), CFrame.new(), Color3.fromRGB(150, 30, 30), Enum.Material.Fabric)

	-- palas: de la empunadura hacia atras (hacia el arquero) y la punta hacia delante
	local limb = {
		Vector3.new(0, 0, 0.55),
		Vector3.new(-0.15, 0, 1.5),
		Vector3.new(-0.55, 0, 2.5),
		Vector3.new(-0.95, 0, 3.1),
		B.StringTop,
	}
	for _, side in { 1, -1 } do
		for i = 1, #limb - 1 do
			local a = limb[i] * Vector3.new(1, 1, side)
			local b = limb[i + 1] * Vector3.new(1, 1, side)
			local len = (b - a).Magnitude
			fixed("Limb", Vector3.new(0.2, 0.32, len + 0.12), CFrame.lookAt((a + b) / 2, b), wood, Enum.Material.Wood)
		end
		-- refuerzo de hueso en la punta
		local tip = B.StringTop * Vector3.new(1, 1, side)
		fixed("Nock", Vector3.new(0.26, 0.36, 0.26), CFrame.new(tip), Color3.fromRGB(235, 225, 200), Enum.Material.SmoothPlastic)
	end

	-- cuerda en reposo (el cliente la redibuja al tensar)
	local nock = Vector3.new(B.StringTop.X, 0, 0)
	local function stringCf(tipPoint: Vector3): (Vector3, CFrame)
		local len = (tipPoint - nock).Magnitude
		return Vector3.new(0.06, 0.06, len), CFrame.lookAt((tipPoint + nock) / 2, tipPoint)
	end
	local topSize, topCf = stringCf(B.StringTop)
	movable("StringTop", topSize, topCf, Color3.fromRGB(240, 235, 220), Enum.Material.SmoothPlastic)
	local bottomSize, bottomCf = stringCf(B.StringBottom)
	movable("StringBottom", bottomSize, bottomCf, Color3.fromRGB(240, 235, 220), Enum.Material.SmoothPlastic)

	-- flecha encordada: astil, punta de hierro y plumas rojas
	local center = nock + Vector3.new(B.ArrowLength / 2, 0, 0)
	local arrowCf = CFrame.lookAt(center, center + Vector3.xAxis)
	local arrow = movable("NockedArrow", Vector3.new(0.1, 0.1, B.ArrowLength), arrowCf, Color3.fromRGB(150, 110, 60), Enum.Material.Wood)
	fixed("ArrowHead", Vector3.new(0.22, 0.22, 0.5), arrowCf * CFrame.new(0, 0, -B.ArrowLength / 2 - 0.2), Color3.fromRGB(90, 90, 95), Enum.Material.Metal, arrow)
	fixed("Fletching", Vector3.new(0.04, 0.3, 0.6), arrowCf * CFrame.new(0, 0, B.ArrowLength / 2 - 0.4), Color3.fromRGB(180, 30, 30), Enum.Material.Fabric, arrow)
	return tool
end

local function buildTool(id: string): Tool?
	local def = Config.Weapons[id]
	if id == "Arco" and def then
		return buildBow(def)
	end
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

-- Copia decorativa del arma (anclada, sin Tool) para la mesa de la armeria.
-- Queda tumbada: su eje largo (Z) en horizontal y centrada en la empunadura.
function Weapons.displayModel(id: string): Model?
	local tool = buildTool(id)
	if not tool then
		return nil
	end
	local model = Instance.new("Model")
	model.Name = "Display_" .. id
	for _, inst in tool:GetChildren() do
		if inst:IsA("BasePart") then
			inst.Anchored = true
			inst.CanCollide = false
			inst.CanTouch = false
			inst.CanQuery = false
			inst.Parent = model
		end
	end
	tool:Destroy()
	local grip = model:FindFirstChild("Handle")
	if grip and grip:IsA("BasePart") then
		grip.Name = "Grip"
		model.PrimaryPart = grip
	end
	return model
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

-- Quita todas las armas (al renacer): mochila, mano y StarterGear.
function Weapons.revoke(player: Player)
	local places: { Instance? } = { player:FindFirstChild("StarterGear"), player:FindFirstChildOfClass("Backpack"), player.Character }
	for _, place in places do
		if place then
			for _, item in place:GetChildren() do
				if item:IsA("Tool") and item:GetAttribute("WeaponId") ~= nil then
					item:Destroy()
				end
			end
		end
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
