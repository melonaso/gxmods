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

local Weapons = {}

-- colores de las armas (arriba: tambien los usa onActivated)
local STEEL = Color3.fromRGB(205, 208, 215)
local BRONZE = Color3.fromRGB(190, 140, 60)
local LEATHER = Color3.fromRGB(70, 42, 25)
local TRUENO_COLOR = Color3.fromRGB(120, 200, 255)

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

	local handleInst = tool:FindFirstChild("Handle")
	local soundAt: Instance = if handleInst then handleInst else tool
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
		projectile(from, bossPos, TRUENO_COLOR)
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

-- ===== Armas cuerpo a cuerpo y baculo (modelos hechos con piezas) =====
-- Convencion del agarre (la misma que el arco): la mano queda en GripPos
-- (espacio del mango), +Z apunta hacia arriba / hacia la punta y +X hacia
-- delante (el filo). Todas las piezas se sueldan al mango.


local function newTool(id: string, def: Types.WeaponDef, gripPos: Vector3): Tool
	local tool = Instance.new("Tool")
	tool.Name = def.DisplayName
	tool.CanBeDropped = false
	tool.RequiresHandle = true
	tool.ToolTip = string.format("Dano %d | Alcance %d", def.Damage, def.Range)
	tool:SetAttribute("WeaponId", id)
	tool.GripPos = gripPos
	tool.GripForward = Vector3.new(-1, 0, 0)
	tool.GripRight = Vector3.new(0, 1, 0)
	tool.GripUp = Vector3.new(0, 0, 1)
	return tool
end

local function handlePart(tool: Tool, size: Vector3, color: Color3, material: Enum.Material): Part
	local handle = Build.part({ Name = "Handle", Size = size, CFrame = CFrame.new(), Color = color, Material = material, Anchored = false, CanCollide = false })
	handle.Massless = true
	handle.Parent = tool
	return handle
end

-- Pieza decorativa soldada al mango (cf en el espacio del mango).
local function attach(tool: Tool, handle: BasePart, name: string, size: Vector3, cf: CFrame, color: Color3, material: Enum.Material, shape: Enum.PartType?): Part
	local p = Build.part({ Name = name, Size = size, CFrame = cf, Color = color, Material = material, Shape = shape, Anchored = false, CanCollide = false })
	p.Massless = true
	p.CanQuery = false
	p.CanTouch = false
	local weld = Instance.new("WeldConstraint")
	weld.Part0 = handle
	weld.Part1 = p
	weld.Parent = p
	p.Parent = tool
	return p
end

-- Cilindro con su eje a lo largo de Z (el eje propio del cilindro de Roblox es X).
local ALONG_Z = CFrame.Angles(0, math.rad(90), 0)

-- Sable mongol: hoja curva de acero (se curva hacia atras), guarda redonda de
-- bronce con gavilanes, empunadura de cuero y pomo.
local function buildSaber(def: Types.WeaponDef): Tool
	local tool = newTool("Sable", def, Vector3.zero)
	local handle = handlePart(tool, Vector3.new(0.3, 0.36, 1.3), LEATHER, Enum.Material.Fabric)
	attach(tool, handle, "Pommel", Vector3.new(0.5, 0.5, 0.5), CFrame.new(0, 0, -0.8), BRONZE, Enum.Material.Metal, Enum.PartType.Ball)
	attach(tool, handle, "Guard", Vector3.new(0.2, 1.0, 1.0), CFrame.new(0, 0, 0.75) * ALONG_Z, BRONZE, Enum.Material.Metal, Enum.PartType.Cylinder)
	attach(tool, handle, "Quillons", Vector3.new(1.5, 0.16, 0.16), CFrame.new(0, 0, 0.78), BRONZE, Enum.Material.Metal)
	-- hoja: segmentos que giran 5 grados cada uno hacia -X y se van afinando
	local point = Vector3.new(0, 0, 0.88)
	local widths = { 0.34, 0.33, 0.31, 0.29, 0.26, 0.22, 0.14 }
	local lengths = { 0.72, 0.72, 0.72, 0.72, 0.72, 0.6, 0.45 }
	for k = 1, #widths do
		local angle = math.rad(5 * (k - 1))
		local dir = Vector3.new(-math.sin(angle), 0, math.cos(angle))
		local nextPoint = point + dir * lengths[k]
		local blade = attach(tool, handle, "Blade", Vector3.new(widths[k], 0.07, lengths[k] + 0.05), CFrame.lookAt((point + nextPoint) / 2, nextPoint), STEEL, Enum.Material.Metal)
		blade.Reflectance = 0.25
		point = nextPoint
	end
	return tool
end

-- Lanza del Khan: asta larga, punta de hoja de acero, anillo de bronce, borla
-- de crin roja (tipica de las lanzas mongolas) y regaton en la base.
local function buildSpear(def: Types.WeaponDef): Tool
	local tool = newTool("Lanza", def, Vector3.new(0, 0, -1.5))
	local handle = handlePart(tool, Vector3.new(0.3, 0.3, 9), Color3.fromRGB(95, 62, 32), Enum.Material.Wood)
	attach(tool, handle, "Butt", Vector3.new(0.4, 0.4, 0.45), CFrame.new(0, 0, -4.65), BRONZE, Enum.Material.Metal)
	attach(tool, handle, "Collar", Vector3.new(0.4, 0.46, 0.46), CFrame.new(0, 0, 4.6) * ALONG_Z, BRONZE, Enum.Material.Metal, Enum.PartType.Cylinder)
	local head = { { z = 5.3, w = 0.55, l = 1.0 }, { z = 6.2, w = 0.32, l = 0.9 }, { z = 6.85, w = 0.12, l = 0.5 } }
	for _, seg in head do
		local p = attach(tool, handle, "SpearHead", Vector3.new(seg.w, 0.08, seg.l), CFrame.new(0, 0, seg.z), STEEL, Enum.Material.Metal)
		p.Reflectance = 0.25
	end
	for k = 0, 7 do
		local a = k / 8 * math.pi * 2
		attach(tool, handle, "Tassel", Vector3.new(0.09, 0.09, 1.5), CFrame.new(math.cos(a) * 0.22, math.sin(a) * 0.22, 3.85) * CFrame.Angles(math.sin(a) * 0.35, -math.cos(a) * 0.35, 0), Color3.fromRGB(170, 25, 25), Enum.Material.Fabric)
	end
	return tool
end

-- Trueno de Tengri: baculo de metal azul con anillos de oro, puntas de rayo y
-- un orbe que brilla (Tengri, el cielo eterno).
local function buildThunderStaff(def: Types.WeaponDef): Tool
	local tool = newTool("Trueno", def, Vector3.new(0, 0, -1.2))
	local handle = handlePart(tool, Vector3.new(0.34, 0.34, 6.5), Color3.fromRGB(40, 60, 120), Enum.Material.Metal)
	attach(tool, handle, "Cap", Vector3.new(0.45, 0.45, 0.3), CFrame.new(0, 0, -3.35), BRONZE, Enum.Material.Metal)
	for _, z in { 1.6, 2.4, 3.0 } do
		attach(tool, handle, "Ring", Vector3.new(0.18, 0.55, 0.55), CFrame.new(0, 0, z) * ALONG_Z, Color3.fromRGB(230, 190, 60), Enum.Material.Metal, Enum.PartType.Cylinder)
	end
	for k = 0, 2 do
		local a = k / 3 * math.pi * 2
		attach(tool, handle, "Prong", Vector3.new(0.12, 0.12, 1.3), CFrame.new(math.cos(a) * 0.35, math.sin(a) * 0.35, 3.75) * CFrame.Angles(-math.sin(a) * 0.4, math.cos(a) * 0.4, 0), Color3.fromRGB(230, 190, 60), Enum.Material.Metal)
	end
	local orb = attach(tool, handle, "Orb", Vector3.new(0.95, 0.95, 0.95), CFrame.new(0, 0, 3.75), TRUENO_COLOR, Enum.Material.Neon, Enum.PartType.Ball)
	local light = Instance.new("PointLight")
	light.Color = TRUENO_COLOR
	light.Range = 10
	light.Brightness = 1.5
	light.Parent = orb
	return tool
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
	if not def then
		return nil
	end
	if id == "Arco" then
		return buildBow(def)
	elseif id == "Sable" then
		return buildSaber(def)
	elseif id == "Lanza" then
		return buildSpear(def)
	elseif id == "Trueno" then
		return buildThunderStaff(def)
	end
	return nil
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
