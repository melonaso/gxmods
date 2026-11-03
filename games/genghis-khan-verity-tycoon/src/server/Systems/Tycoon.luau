--!strict
-- Plots del tycoon: botones de compra, droppers (animales/caravanas),
-- cinta, colector, caja para recoger oro, empalizada, Gran Yurta,
-- murallas contra Verity y segundo piso.
local Debris = game:GetService("Debris")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local Net = require(Shared.Net)
local Types = require(Shared.Types)

local Build = require(script.Parent.Parent.Lib.Build)
local Props = require(script.Parent.Parent.Lib.Props)
local Sfx = require(script.Parent.Parent.Lib.Sfx)
local FinalBattle = require(script.Parent.FinalBattle)
local Verity = require(script.Parent.Verity)
local PlayerData = require(script.Parent.PlayerData)
local Weapons = require(script.Parent.Weapons)
local World = require(script.Parent.World)

type Plot = {
	index: number,
	cframe: CFrame,
	model: Model,
	owner: Player?,
	generation: number, -- sube cada vez que se libera el plot; corta los bucles viejos
	pending: number,
	multiplier: number,
	built: { Instance },
	buttons: { [string]: BasePart },
	finalPad: BasePart,
	claimPad: BasePart,
	cashLabel: TextLabel,
	signLabel: TextLabel,
	spawn: BasePart,
	spawnConn: RBXScriptConnection?,
	arrows: { BasePart },
	guideLabel: TextLabel,
	wall: Model?,
	weaponTable: CFrame,
	gate: { left: BasePart, right: BasePart, open: boolean, y: number }?,
	floor2: Model?,
	towers: Model?,
}

local Tycoon = {}

local SLOT_X = { -21, -9, 3, 15 }
local H2 = Config.Floor2Height
-- posicion de la fila de droppers/cinta en cada piso (local al plot)
local LINE = {
	[1] = { y = 0, z = 30 }, -- al fondo del campamento: deja libre el centro
	[2] = { y = H2 - 0.5, z = 14 }, -- la losa del segundo piso tiene la cara de arriba en H2 + 0.5
}
local SAND = Color3.fromRGB(214, 190, 140)

local plots: { Plot } = {}
local plotOf: { [Player]: Plot } = {}
local lastWarn: { [Player]: number } = {}
local tycoonFolder: Folder
local oreFolder: Folder

local defsById: { [string]: Types.ButtonDef } = {}
for _, def in Config.Buttons do
	defsById[def.Id] = def
end

local function isOwnerTouch(plot: Plot, hit: BasePart): Player?
	local character = hit.Parent
	if not character then
		return nil
	end
	local player = Players:GetPlayerFromCharacter(character)
	if player and plot.owner == player then
		local humanoid = character:FindFirstChildOfClass("Humanoid")
		if humanoid and humanoid.Health > 0 then
			return player
		end
	end
	return nil
end

local function updateCash(plot: Plot)
	local text = string.format("Recoger: %d oro", math.floor(plot.pending))
	plot.cashLabel.Text = text
	local floor2 = plot.floor2
	local label2 = floor2 and floor2:FindFirstChild("Floor2Cash", true)
	if label2 and label2:IsA("TextLabel") then
		label2.Text = text
	end
end

local function available(plot: Plot, def: Types.ButtonDef): boolean
	local owner = plot.owner
	if not owner or PlayerData.owns(owner, def.Id) then
		return false
	end
	return def.Requires == nil or PlayerData.owns(owner, def.Requires :: string)
end

local function refreshButtons(plot: Plot)
	for id, button in plot.buttons do
		button.Parent = if available(plot, defsById[id]) then plot.model else nil
	end
	-- tycoon completo: aparece el circulo de la batalla final
	local owner = plot.owner
	plot.finalPad.Parent = if owner and FinalBattle.isUnlocked(owner) then plot.model else nil
end

-- ===== Construcciones =====

-- Cinta + barandas + colector de un piso. El colector suma al oro pendiente del plot.
local function buildLine(plot: Plot, parent: Instance, floor: number)
	local line = LINE[floor]
	local cf = plot.cframe * CFrame.new(0, line.y, line.z)
	local conveyor = Build.part({ Name = "Conveyor", Size = Vector3.new(50, 1, 5), CFrame = cf * CFrame.new(-2, 1.5, 0), Color = Color3.fromRGB(40, 35, 30), Material = Enum.Material.Fabric, Parent = parent })
	-- una pieza anclada con velocidad mueve lo que cae encima
	conveyor.AssemblyLinearVelocity = plot.cframe.RightVector * Config.ConveyorSpeed
	Build.part({ Name = "RailA", Size = Vector3.new(50, 1.5, 0.5), CFrame = cf * CFrame.new(-2, 2.75, 2.75), Color = Color3.fromRGB(110, 70, 35), Material = Enum.Material.Wood, Parent = parent })
	Build.part({ Name = "RailB", Size = Vector3.new(50, 1.5, 0.5), CFrame = cf * CFrame.new(-2, 2.75, -2.75), Color = Color3.fromRGB(110, 70, 35), Material = Enum.Material.Wood, Parent = parent })
	local collector = Build.part({ Name = "Collector", Size = Vector3.new(4, 4, 7), CFrame = cf * CFrame.new(25, 3, 0), Color = Color3.fromRGB(230, 190, 60), Material = Enum.Material.Neon, Parent = parent })
	collector.Touched:Connect(function(hit)
		if hit:GetAttribute("PlotIndex") ~= plot.index then
			return
		end
		local value = hit:GetAttribute("OreValue")
		hit:Destroy()
		if plot.owner and typeof(value) == "number" then
			plot.pending += value * plot.multiplier * PlayerData.rebirthMultiplier(plot.owner :: Player)
			updateCash(plot)
		end
	end)
end

local function buildCashPad(plot: Plot, parent: Instance, offset: Vector3): TextLabel
	local cashPad = Build.part({ Name = "CashPad", Size = Vector3.new(6, 1, 6), CFrame = plot.cframe * CFrame.new(offset), Color = Color3.fromRGB(60, 200, 90), Material = Enum.Material.Neon, Parent = parent })
	cashPad.Touched:Connect(function(hit)
		local player = isOwnerTouch(plot, hit)
		if player and plot.pending > 0 then
			Sfx.play(Config.Sounds.Collect, cashPad, { Volume = 0.8, Speed = 1.4 })
			PlayerData.addGold(player, math.floor(plot.pending))
			plot.pending = 0
			updateCash(plot)
		end
	end)
	return Build.billboard(cashPad, "Recoger: 0 oro", 4, 220)
end

-- ===== Droppers =====
-- Cada dropper es un portico de madera lacada sobre la cinta: cuatro postes,
-- tejadillo a dos aguas (rojo en la planta baja, azul en el segundo piso)
-- con cumbrera dorada, tolva en embudo con la mercancia asomando, farol y un
-- letrero tallado al frente. Detras, un corral con el animal (o el tesoro)
-- que produce el oro.
local WOOD = Color3.fromRGB(110, 70, 35)
local LACQUER = { [1] = Color3.fromRGB(165, 32, 30), [2] = Color3.fromRGB(35, 70, 140) }
local GOLD = Color3.fromRGB(225, 180, 60)
local HAY = Color3.fromRGB(205, 175, 95)

local DROPPER_THEME: { [string]: string } = {
	d1 = "sheep",
	d2 = "goat",
	d3 = "horse",
	d4 = "caravan",
	d5 = "yak",
	d6 = "camel",
	d7 = "falcon",
	d8 = "treasure",
}

local function decor(model: Instance, name: string, size: Vector3, cf: CFrame, color: Color3, material: Enum.Material?, shape: Enum.PartType?): Part
	local p = Build.part({ Name = name, Size = size, CFrame = cf, Color = color, Material = material or Enum.Material.Wood, Shape = shape, Parent = model })
	p.CanCollide = false
	p.CanQuery = false
	p.CanTouch = false
	return p
end

-- Letrero de madera con texto tallado (SurfaceGui en la cara delantera -Z).
local function carvedSign(parent: Instance, cf: CFrame, size: Vector3, text: string, textColor: Color3): Part
	local board = decor(parent, "Sign", size, cf, Color3.fromRGB(70, 42, 22), Enum.Material.Wood)
	local gui = Instance.new("SurfaceGui")
	gui.Face = Enum.NormalId.Front
	gui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	gui.PixelsPerStud = 40
	gui.LightInfluence = 0.4
	local label = Instance.new("TextLabel")
	label.Size = UDim2.new(1, -10, 1, -6)
	label.Position = UDim2.fromOffset(5, 3)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.Fantasy
	label.TextScaled = true
	label.TextColor3 = textColor
	label.TextStrokeColor3 = Color3.new(0, 0, 0)
	label.TextStrokeTransparency = 0.5
	label.Text = text
	label.Parent = gui
	gui.Parent = board
	return board
end

local function buildPen(model: Model, cf: CFrame, theme: string)
	-- corral detras de la cinta: suelo de paja y valla baja
	local pen = cf * CFrame.new(0, 0, 6.6)
	decor(model, "Hay", Vector3.new(9.6, 0.2, 4.6), pen * CFrame.new(0, 1.1, 0), HAY, Enum.Material.Fabric)
	for _, x in { -4.9, 4.9 } do
		for _, z in { -2.2, 2.2 } do
			decor(model, "PenPost", Vector3.new(0.4, 2.8, 0.4), pen * CFrame.new(x, 2.4, z), WOOD)
		end
		for _, y in { 1.9, 3.0 } do
			decor(model, "PenRail", Vector3.new(0.25, 0.25, 4.6), pen * CFrame.new(x, y, 0), WOOD)
		end
	end
	for _, y in { 1.9, 3.0 } do
		decor(model, "PenRail", Vector3.new(10, 0.25, 0.25), pen * CFrame.new(0, y, 2.2), WOOD)
	end
	local ground = pen * CFrame.new(0, 1.2, 0)
	if theme == "sheep" then
		Props.sheep(model, ground * CFrame.new(-1.8, 0, -0.6))
		Props.sheep(model, ground * CFrame.new(1.6, 0, 0.7) * CFrame.Angles(0, math.rad(160), 0))
	elseif theme == "goat" then
		Props.goat(model, ground * CFrame.new(-1.5, 0, 0))
		Props.goat(model, ground * CFrame.new(1.8, 0, 0.6) * CFrame.Angles(0, math.rad(200), 0))
	elseif theme == "horse" then
		Props.horse(model, ground, Color3.fromRGB(115, 72, 40))
	elseif theme == "caravan" then
		Props.camel(model, ground * CFrame.new(-0.5, 0, 0), true)
	elseif theme == "yak" then
		Props.yak(model, ground * CFrame.new(-0.3, 0, 0))
	elseif theme == "camel" then
		Props.camel(model, ground * CFrame.new(-1.2, 0, -0.6), false)
		Props.camel(model, ground * CFrame.new(1.4, 0, 0.8) * CFrame.Angles(0, math.rad(180), 0), false)
	elseif theme == "falcon" then
		Props.falcon(model, ground * CFrame.new(-2, 0, 0), false)
		Props.falcon(model, ground * CFrame.new(2, 0, 0.4) * CFrame.Angles(0, math.rad(20), 0), true)
	elseif theme == "treasure" then
		Props.treasure(model, ground * CFrame.new(0, 0, 0.3))
	end
end

local function buildDropper(plot: Plot, def: Types.ButtonDef)
	local owner = plot.owner :: Player
	local generation = plot.generation
	local floor = def.Floor or 1
	local x = SLOT_X[def.Slot or 1]
	local line = LINE[floor]
	local cf = plot.cframe * CFrame.new(x, line.y, line.z)
	local lacquer = LACQUER[floor] or LACQUER[1]
	local model = Instance.new("Model")
	model.Name = "Dropper_" .. def.Id

	-- portico: cuatro postes a los lados de la cinta y vigas arriba
	for _, px in { -2.1, 2.1 } do
		for _, pz in { -3.5, 3.5 } do
			local post = Build.part({ Name = "Post", Size = Vector3.new(0.6, 10.2, 0.6), CFrame = cf * CFrame.new(px, 6.1, pz), Color = lacquer, Material = Enum.Material.Wood, Parent = model })
			post.CanQuery = false
			decor(model, "PostFoot", Vector3.new(0.9, 0.6, 0.9), cf * CFrame.new(px, 1.3, pz), Color3.fromRGB(70, 66, 60), Enum.Material.Slate)
		end
		decor(model, "Beam", Vector3.new(0.7, 0.7, 7.8), cf * CFrame.new(px, 11.2, 0), WOOD)
	end
	for _, pz in { -3.5, 3.5 } do
		decor(model, "Beam", Vector3.new(5.2, 0.7, 0.7), cf * CFrame.new(0, 10.9, pz), WOOD)
	end
	-- tejadillo a dos aguas con cumbrera dorada
	for _, side in { -1, 1 } do
		decor(model, "Roof", Vector3.new(6.2, 0.35, 4.9), cf * CFrame.new(0, 12.45, side * 1.95) * CFrame.Angles(side * math.rad(28), 0, 0), lacquer, Enum.Material.WoodPlanks)
		decor(model, "RoofEdge", Vector3.new(6.4, 0.25, 0.3), cf * CFrame.new(0, 11.4, side * 4.15), GOLD, Enum.Material.Metal)
	end
	decor(model, "Ridge", Vector3.new(6.6, 0.45, 0.45), cf * CFrame.new(0, 13.6, 0), GOLD, Enum.Material.Metal)
	for _, px in { -3.3, 3.3 } do
		decor(model, "RidgeEnd", Vector3.new(0.5, 0.9, 0.5), cf * CFrame.new(px, 13.9, 0), GOLD, Enum.Material.Metal)
	end

	-- tolva en embudo: borde, mercancia asomando y boca de hierro
	decor(model, "HopperRim", Vector3.new(4.2, 0.6, 4.2), cf * CFrame.new(0, 10.0, 0), GOLD, Enum.Material.Metal)
	decor(model, "Goods", Vector3.new(3.6, 0.3, 3.6), cf * CFrame.new(0, 10.35, 0), def.OreColor or SAND, Enum.Material.Fabric)
	decor(model, "Funnel", Vector3.new(3.6, 1.0, 3.6), cf * CFrame.new(0, 9.2, 0), WOOD, Enum.Material.WoodPlanks)
	decor(model, "Funnel", Vector3.new(2.7, 0.9, 2.7), cf * CFrame.new(0, 8.3, 0), WOOD, Enum.Material.WoodPlanks)
	decor(model, "Funnel", Vector3.new(1.8, 0.8, 1.8), cf * CFrame.new(0, 7.5, 0), lacquer, Enum.Material.Wood)
	local spout = decor(model, "Spout", Vector3.new(1.1, 0.7, 1.1), cf * CFrame.new(0, 6.8, 0), Color3.fromRGB(60, 58, 55), Enum.Material.Metal)
	for _, px in { -1.95, 1.95 } do
		decor(model, "HopperStrap", Vector3.new(0.25, 1.4, 0.25), cf * CFrame.new(px, 10.4, 0), WOOD)
	end

	-- farol colgado y letrero al frente
	local lantern = decor(model, "Lantern", Vector3.new(0.6, 0.85, 0.6), cf * CFrame.new(2.1, 9.7, -3.9), Color3.fromRGB(255, 190, 90), Enum.Material.Neon)
	decor(model, "LanternCap", Vector3.new(0.75, 0.2, 0.75), cf * CFrame.new(2.1, 10.2, -3.9), Color3.fromRGB(50, 40, 30), Enum.Material.Metal)
	local light = Instance.new("PointLight")
	light.Color = Color3.fromRGB(255, 180, 90)
	light.Range = 10
	light.Brightness = 1.2
	light.Shadows = false
	light.Parent = lantern
	carvedSign(model, cf * CFrame.new(0, 9.4, -3.95), Vector3.new(4.6, 1.3, 0.25), def.Name, GOLD)

	buildPen(model, cf, DROPPER_THEME[def.Id] or "sheep")
	model.Parent = plot.model
	table.insert(plot.built, model)

	local wool = DROPPER_THEME[def.Id] == "sheep"
	local treasure = DROPPER_THEME[def.Id] == "treasure"
	task.spawn(function()
		while plot.generation == generation and plot.owner == owner and model.Parent do
			task.wait(def.Interval or 2)
			if plot.generation ~= generation then
				break
			end
			-- fardos de mercancia; lana en bolas y monedas de oro brillantes
			local ore = Build.part({
				Name = "Ore",
				Size = if wool then Vector3.new(1.3, 1.3, 1.3) else Vector3.new(1.3, 1.1, 1.1),
				CFrame = spout.CFrame * CFrame.new(0, -1.1, 0),
				Color = def.OreColor or SAND,
				Material = if treasure then Enum.Material.Metal elseif wool then Enum.Material.Fabric else Enum.Material.Fabric,
				Shape = if wool or treasure then Enum.PartType.Ball else nil,
				Anchored = false,
				Parent = oreFolder,
			})
			if treasure then
				ore.Reflectance = 0.3
			end
			ore:SetAttribute("OreValue", def.Value or 1)
			ore:SetAttribute("PlotIndex", plot.index)
			ore:SetNetworkOwner(nil) -- el servidor controla la fisica (anti-trampas)
			Debris:AddItem(ore, 25)
		end
	end)
end

local function buildFence(plot: Plot)
	local model = Instance.new("Model")
	model.Name = "Fence"
	local wood = Color3.fromRGB(120, 80, 40)
	local cf = plot.cframe
	local function seg(size: Vector3, offset: Vector3)
		Build.part({ Name = "Stake", Size = size, CFrame = cf * CFrame.new(offset), Color = wood, Material = Enum.Material.Wood, Parent = model })
	end
	seg(Vector3.new(80, 5, 1), Vector3.new(0, 3, 39.5)) -- fondo
	seg(Vector3.new(1, 5, 80), Vector3.new(-39.5, 3, 0))
	seg(Vector3.new(1, 5, 80), Vector3.new(39.5, 3, 0))
	seg(Vector3.new(30, 5, 1), Vector3.new(-25, 3, -39.5)) -- frente con entrada de 20
	seg(Vector3.new(30, 5, 1), Vector3.new(25, 3, -39.5))
	model.Parent = plot.model
	table.insert(plot.built, model)
end

local function buildShelter(plot: Plot)
	local owner = plot.owner :: Player
	-- la puerta de la yurta mira hacia el frente del plot
	local cf = plot.cframe * CFrame.new(-29, 0, 10) -- lado izquierdo, puerta hacia la entrada
	local yurt = Build.yurt(plot.model, cf, 9, 10)
	Build.markSolid(yurt)
	table.insert(plot.built, yurt)
	local zone = Build.hidingZone(World.getHidingFolder(), cf * CFrame.new(0, 5, 0), Vector3.new(14, 10, 14), owner.UserId)
	table.insert(plot.built, zone)
end

-- Muralla alrededor del plot con una puerta en el frente.
--   - los muros son solidos para todos (grupo Solid)
--   - la puerta tiene una barrera invisible que solo frena a Verity (grupo
--     VerityWall): los jugadores siempre pasan; las hojas se abren solas
--     cuando alguien se acerca (updateGates)
--   - barra de vida encima de la puerta
-- Verity.luau golpea los WallSegment hasta romperlos y los repara al irse.
local GATE_HALF = 6 -- media anchura de la puerta

-- Decoracion de la muralla (piezas "WallDecor": sin colision; Verity.luau las
-- desvanece junto con la muralla cuando se rompe).
--   madera : troncos verticales con la punta afilada (empalizada)
--   piedra : zocalo, cornisa, almenas, contrafuertes y bastiones en las esquinas
--   en ambas: portada con pilares, tejadillo y placa sobre la puerta
local function wallDecor(model: Model, cf: CFrame, def: Types.ButtonDef, h: number)
	local color = def.WallColor or Color3.fromRGB(120, 115, 105)
	local material = def.WallMaterial or Enum.Material.Cobblestone
	local darker = color:Lerp(Color3.new(0, 0, 0), 0.3)
	local lighter = color:Lerp(Color3.new(1, 1, 1), 0.15)
	local function d(name: string, size: Vector3, offset: CFrame, c: Color3, m: Enum.Material?, shape: Enum.PartType?): Part
		local p = decor(model, name, size, cf * offset, c, m or material, shape)
		p.Name = "WallDecor"
		p:SetAttribute("Kind", name)
		return p
	end
	-- tramos (centro x, centro z, largo, eje) sin la puerta
	type Run = { x: number, z: number, len: number, alongX: boolean, out: Vector3 }
	local side = (86 - GATE_HALF * 2) / 2
	local runs: { Run } = {
		{ x = 0, z = 42, len = 86, alongX = true, out = Vector3.zAxis },
		{ x = 42, z = 0, len = 82, alongX = false, out = Vector3.xAxis },
		{ x = -42, z = 0, len = 82, alongX = false, out = -Vector3.xAxis },
		{ x = -(GATE_HALF + side / 2), z = -42, len = side, alongX = true, out = -Vector3.zAxis },
		{ x = GATE_HALF + side / 2, z = -42, len = side, alongX = true, out = -Vector3.zAxis },
	}
	local function along(run: Run, t: number, outward: number, y: number): CFrame
		local pos = if run.alongX then Vector3.new(run.x + t, y, run.z) else Vector3.new(run.x, y, run.z + t)
		return CFrame.new(pos + run.out * outward)
	end
	local function size3(run: Run, lengthwise: number, height: number, thick: number): Vector3
		return if run.alongX then Vector3.new(lengthwise, height, thick) else Vector3.new(thick, height, lengthwise)
	end

	if material == Enum.Material.WoodPlanks then
		-- empalizada: troncos por fuera con la punta afilada sobresaliendo
		for _, run in runs do
			local count = math.floor(run.len / 2.4)
			for i = 0, count - 1 do
				local t = -run.len / 2 + 1.2 + i * (run.len - 2.4) / math.max(1, count - 1)
				local extra = (i % 2) * 0.8
				d("Log", Vector3.new(h + 1 + extra, 1.3, 1.3), along(run, t, 1.3, (h + 1 + extra) / 2 + 0.5) * CFrame.Angles(0, 0, math.pi / 2), color:Lerp(Color3.fromRGB(90, 58, 30), (i % 3) * 0.2), Enum.Material.Wood, Enum.PartType.Cylinder)
				d("LogTip", Vector3.new(0.95, 0.95, 0.95), along(run, t, 1.3, h + 1.3 + extra) * (if run.alongX then CFrame.Angles(0, 0, math.rad(45)) else CFrame.Angles(math.rad(45), 0, 0)), Color3.fromRGB(95, 62, 32), Enum.Material.Wood)
			end
			-- travesano por dentro
			d("Rail", size3(run, run.len, 0.6, 0.5), along(run, 0, -1.25, h * 0.7), Color3.fromRGB(90, 58, 30), Enum.Material.Wood)
		end
	else
		for _, run in runs do
			d("Plinth", size3(run, run.len + 0.6, 2.4, 2.8), along(run, 0, 0, 2.2), darker)
			d("Cornice", size3(run, run.len + 0.6, 0.7, 2.8), along(run, 0, 0, h + 0.65), lighter)
			-- almenas
			local count = math.floor(run.len / 3)
			for i = 0, count - 1 do
				local t = -run.len / 2 + 1.5 + i * 3
				d("Merlon", size3(run, 1.7, 2.2, 2.2), along(run, t, 0, h + 2.1), color)
			end
			-- contrafuertes por fuera cada ~14 studs
			local n = math.max(1, math.floor(run.len / 14))
			for i = 1, n - 1 do
				local t = -run.len / 2 + i * run.len / n
				d("Buttress", size3(run, 1.8, h - 1, 1.4), along(run, t, 1.6, (h - 1) / 2 + 1), darker)
			end
		end
		-- bastiones en las esquinas
		for _, cx in { -42, 42 } do
			for _, cz in { -42, 42 } do
				d("Bastion", Vector3.new(5, h + 3, 5), CFrame.new(cx, (h + 3) / 2 + 1, cz), color)
				d("BastionBase", Vector3.new(5.8, 3, 5.8), CFrame.new(cx, 2.5, cz), darker)
				d("BastionTop", Vector3.new(5.8, 0.6, 5.8), CFrame.new(cx, h + 4.3, cz), lighter)
				for _, mx in { -2, 2 } do
					for _, mz in { -2, 2 } do
						d("Merlon", Vector3.new(1.4, 1.8, 1.4), CFrame.new(cx + mx, h + 5.5, cz + mz), color)
					end
				end
			end
		end
	end

	-- portada: pilares, tejadillo rojo con cumbrera dorada y placa del clan
	local red = Color3.fromRGB(165, 32, 30)
	for _, sx in { -1, 1 } do
		-- (las hojas abiertas quedan pegadas a los pilares, sin atravesarlos)
		d("GatePillar", Vector3.new(2.2, h + 4, 3.4), CFrame.new(sx * (GATE_HALF + 1.5), (h + 4) / 2 + 1, -42), red, Enum.Material.Wood)
		d("PillarCap", Vector3.new(2.8, 0.6, 4), CFrame.new(sx * (GATE_HALF + 1.5), h + 5.3, -42), GOLD, Enum.Material.Metal)
	end
	for _, sz in { -1, 1 } do
		d("GateRoof", Vector3.new(GATE_HALF * 2 + 2, 0.45, 3.4), CFrame.new(0, h + 6.3, -42 + sz * 1.5) * CFrame.Angles(-sz * math.rad(26), 0, 0), red, Enum.Material.WoodPlanks)
	end
	d("GateRidge", Vector3.new(GATE_HALF * 2 + 2.4, 0.5, 0.5), CFrame.new(0, h + 7.1, -42), GOLD, Enum.Material.Metal)
	local plaque = carvedSign(model, cf * CFrame.new(0, h + 4.2, -43.6), Vector3.new(7, 1.6, 0.3), def.Name, GOLD)
	plaque.Name = "WallDecor"
end

local function buildWall(plot: Plot, def: Types.ButtonDef)
	local owner = plot.owner :: Player
	if plot.wall then
		plot.wall:Destroy() -- el nivel nuevo reemplaza al anterior
		plot.wall = nil
		plot.gate = nil
	end
	Build.ensureGroups()
	local h = def.WallHeight or 14
	local maxHp = def.WallHP or 500
	local model = Instance.new("Model")
	model.Name = "Wall_" .. plot.index
	local function seg(size: Vector3, offset: Vector3, group: string): Part
		local p = Build.part({ Name = "WallSegment", Size = size, CFrame = plot.cframe * CFrame.new(offset), Color = def.WallColor, Material = def.WallMaterial, Parent = model })
		p.CollisionGroup = group
		return p
	end
	local y = h / 2 + 1
	local side = (86 - GATE_HALF * 2) / 2
	seg(Vector3.new(86, h, 2), Vector3.new(0, y, 42), Build.SOLID_GROUP) -- fondo
	seg(Vector3.new(2, h, 82), Vector3.new(42, y, 0), Build.SOLID_GROUP)
	seg(Vector3.new(2, h, 82), Vector3.new(-42, y, 0), Build.SOLID_GROUP)
	seg(Vector3.new(side, h, 2), Vector3.new(-(GATE_HALF + side / 2), y, -42), Build.SOLID_GROUP) -- frente izq.
	seg(Vector3.new(side, h, 2), Vector3.new(GATE_HALF + side / 2, y, -42), Build.SOLID_GROUP) -- frente der.
	-- barrera invisible de la puerta: solo para Verity
	local barrier = seg(Vector3.new(GATE_HALF * 2, h, 2), Vector3.new(0, y, -42), Build.WALL_GROUP)
	barrier.Transparency = 1
	barrier:SetAttribute("Invisible", true)
	-- dintel
	Build.part({ Name = "Lintel", Size = Vector3.new(GATE_HALF * 2 + 4, 2, 3), CFrame = plot.cframe * CFrame.new(0, h + 2, -42), Color = Color3.fromRGB(170, 30, 30), Material = Enum.Material.Wood, Parent = model }).CollisionGroup = Build.SOLID_GROUP
	wallDecor(model, plot.cframe, def, h)

	-- hojas de la puerta (decorativas: no chocan con nadie)
	local function leaf(hingeX: number, dir: number): Part
		local p = Build.part({
			Name = "GateLeaf",
			Size = Vector3.new(GATE_HALF, h, 0.8),
			CFrame = plot.cframe * CFrame.new(hingeX, y, -42) * CFrame.new(dir * GATE_HALF / 2, 0, 0),
			Color = Color3.fromRGB(110, 70, 35),
			Material = Enum.Material.WoodPlanks,
			CanCollide = false,
			Parent = model,
		})
		p.CanQuery = false
		p.CanTouch = false
		return p
	end
	local left = leaf(-GATE_HALF, 1)
	local right = leaf(GATE_HALF, -1)
	plot.gate = { left = left, right = right, open = false, y = y }

	-- barra de vida encima de la puerta
	local sign = Build.part({ Name = "WallSign", Size = Vector3.new(1, 1, 1), CFrame = plot.cframe * CFrame.new(0, h + 10, -42), Transparency = 1, CanCollide = false, Parent = model })
	sign.CanQuery = false
	sign.CanTouch = false
	local gui = Instance.new("BillboardGui")
	gui.Size = UDim2.fromOffset(320, 58)
	gui.MaxDistance = 250
	gui.Adornee = sign
	local title = Instance.new("TextLabel")
	title.Size = UDim2.new(1, 0, 0, 24)
	title.BackgroundTransparency = 1
	title.Font = Enum.Font.GothamBlack
	title.TextScaled = true
	title.TextColor3 = Color3.new(1, 1, 1)
	title.TextStrokeTransparency = 0.3
	title.Parent = gui
	local bar = Instance.new("Frame")
	bar.Size = UDim2.new(1, 0, 0, 26)
	bar.Position = UDim2.fromOffset(0, 30)
	bar.BackgroundColor3 = Color3.fromRGB(25, 10, 10)
	bar.BorderSizePixel = 0
	bar.Parent = gui
	local fill = Instance.new("Frame")
	fill.Size = UDim2.fromScale(1, 1)
	fill.BorderSizePixel = 0
	fill.Parent = bar
	local amount = Instance.new("TextLabel")
	amount.Size = UDim2.fromScale(1, 1)
	amount.BackgroundTransparency = 1
	amount.Font = Enum.Font.GothamBold
	amount.TextScaled = true
	amount.TextColor3 = Color3.new(1, 1, 1)
	amount.TextStrokeTransparency = 0.3
	amount.ZIndex = 2
	amount.Parent = bar
	for _, frame in { bar, fill } do
		local corner = Instance.new("UICorner")
		corner.CornerRadius = UDim.new(0, 6)
		corner.Parent = frame
	end
	gui.Parent = sign

	local function refresh()
		local hp = (model:GetAttribute("HP") :: number?) or 0
		local ratio = math.clamp(hp / maxHp, 0, 1)
		title.Text = def.Name
		fill.Size = UDim2.fromScale(ratio, 1)
		-- verde con vida llena, rojo cuando se esta rompiendo
		fill.BackgroundColor3 = Color3.fromRGB(220, 50, 40):Lerp(Color3.fromRGB(60, 200, 80), ratio)
		if model:GetAttribute("Broken") then
			amount.Text = "ROTA - se repara cuando Verity se vaya"
			title.TextColor3 = Color3.fromRGB(255, 80, 80)
		else
			amount.Text = string.format("%d / %d", hp, maxHp)
			title.TextColor3 = Color3.new(1, 1, 1)
		end
	end
	model:SetAttribute("MaxHP", maxHp)
	model:SetAttribute("HP", maxHp)
	model:SetAttribute("Broken", false)
	model:SetAttribute("OwnerUserId", owner.UserId)
	model:GetAttributeChangedSignal("HP"):Connect(refresh)
	model:GetAttributeChangedSignal("Broken"):Connect(refresh)
	refresh()
	model.Parent = World.getWallFolder()
	plot.wall = model
	table.insert(plot.built, model)
end

-- ===== Torres de la puerta =====
-- Dos torres de piedra a los lados de la puerta (atraviesan la linea de la
-- muralla), con escalera de mano por dentro y, arriba, una plataforma con
-- almenas, tejado rojo con el estandarte de crines y una balista.
-- La balista: banco (Seat "BallistaSeat") y torreta giratoria (Model "Turret",
-- PrimaryPart "Hub"). Systems/Ballista valida y dispara; Controllers/Ballista
-- apunta la torreta y manda el disparo.
local TOWER_X = 11 -- centro de cada torre (la puerta mide 12 de ancho)
local STONE = Color3.fromRGB(128, 120, 106)

local function buildBallista(parent: Instance, top: CFrame)
	local ballista = Instance.new("Model")
	ballista.Name = "Ballista"
	local wood = Color3.fromRGB(105, 66, 34)
	local iron = Color3.fromRGB(70, 70, 75)
	decor(ballista, "Mount", Vector3.new(2.4, 1.1, 1.1), top * CFrame.new(0, 1.2, -1) * CFrame.Angles(0, 0, math.pi / 2), wood, Enum.Material.Wood, Enum.PartType.Cylinder).CanCollide = true
	local pivot = top * CFrame.new(0, 2.6, -1)
	local turret = Instance.new("Model")
	turret.Name = "Turret"
	local hub = decor(turret, "Hub", Vector3.new(0.9, 0.5, 0.9), pivot, iron, Enum.Material.Metal)
	decor(turret, "Stock", Vector3.new(0.7, 0.5, 5.8), pivot * CFrame.new(0, 0, -0.6), wood, Enum.Material.Wood)
	decor(turret, "Groove", Vector3.new(0.3, 0.12, 5.4), pivot * CFrame.new(0, 0.3, -0.6), Color3.fromRGB(45, 30, 18), Enum.Material.Wood)
	decor(turret, "BowBlock", Vector3.new(1.6, 0.8, 0.9), pivot * CFrame.new(0, 0.1, -2.9), wood, Enum.Material.Wood)
	for _, side in { -1, 1 } do
		-- brazos hacia atras en las puntas; la cuerda va de las puntas a la una
		local a = -side * 0.35
		decor(turret, "BowArm", Vector3.new(3.2, 0.35, 0.35), pivot * CFrame.new(side * 1.55, 0.1, -2.9) * CFrame.Angles(0, a, 0), Color3.fromRGB(80, 50, 26), Enum.Material.Wood)
		local tip = Vector3.new(side * 3.05, 0.1, -2.35)
		decor(turret, "ArmTip", Vector3.new(0.4, 0.4, 0.4), pivot * CFrame.new(tip), GOLD, Enum.Material.Metal)
		local claw = Vector3.new(0, 0.3, 0.6)
		decor(turret, "String", Vector3.new(0.07, 0.07, (claw - tip).Magnitude), pivot * CFrame.lookAt((tip + claw) / 2, claw), Color3.fromRGB(230, 220, 200), Enum.Material.Fabric)
	end
	decor(turret, "LoadedBolt", Vector3.new(0.22, 0.22, 3.8), pivot * CFrame.new(0, 0.45, -1.6), Color3.fromRGB(150, 110, 60), Enum.Material.Wood)
	decor(turret, "LoadedBolt", Vector3.new(0.45, 0.45, 0.8), pivot * CFrame.new(0, 0.45, -3.85), iron, Enum.Material.Metal)
	decor(turret, "LoadedBolt", Vector3.new(0.05, 0.4, 0.7), pivot * CFrame.new(0, 0.6, 0.0), Color3.fromRGB(170, 30, 30), Enum.Material.Fabric)
	decor(turret, "Winch", Vector3.new(1.8, 0.7, 0.7), pivot * CFrame.new(0, -0.1, 1.9), wood, Enum.Material.Wood, Enum.PartType.Cylinder)
	for _, side in { -1, 1 } do
		decor(turret, "WinchHandle", Vector3.new(0.15, 1.2, 0.15), pivot * CFrame.new(side * 1.0, 0.2, 1.9), iron, Enum.Material.Metal)
	end
	turret.PrimaryPart = hub
	turret.Parent = ballista

	local seat = Instance.new("Seat")
	seat.Name = "BallistaSeat"
	seat.Size = Vector3.new(2, 0.6, 2)
	seat.CFrame = top * CFrame.new(0, 0.3, 2.6)
	seat.Color = Color3.fromRGB(150, 30, 30)
	seat.Material = Enum.Material.Fabric
	seat.Anchored = true
	seat.TopSurface = Enum.SurfaceType.Smooth
	seat.BottomSurface = Enum.SurfaceType.Smooth
	seat.Parent = ballista
	ballista:SetAttribute("FiredAt", 0)
	ballista.Parent = parent
end

local function buildTowers(plot: Plot)
	if plot.towers then
		return
	end
	local H = Config.Tower.Height
	local model = Instance.new("Model")
	model.Name = "GateTowers"
	local darker = STONE:Lerp(Color3.new(0, 0, 0), 0.3)
	local lighter = STONE:Lerp(Color3.new(1, 1, 1), 0.15)
	local red = Color3.fromRGB(165, 32, 30)
	for _, sx in { -1, 1 } do
		local base = plot.cframe * CFrame.new(sx * TOWER_X, 0, -42)
		local function block(name: string, size: Vector3, offset: Vector3, color: Color3, material: Enum.Material?): Part
			return Build.part({ Name = name, Size = size, CFrame = base * CFrame.new(offset), Color = color, Material = material or Enum.Material.Cobblestone, Parent = model })
		end
		block("TowerBody", Vector3.new(8, H - 2.5, 8), Vector3.new(0, 1 + (H - 2.5) / 2, 0), STONE)
		block("TowerPlinth", Vector3.new(8.8, 3, 8.8), Vector3.new(0, 2.5, 0), darker)
		for _, y in { 11, 20 } do
			block("TowerBand", Vector3.new(8.4, 0.6, 8.4), Vector3.new(0, y, 0), lighter)
		end
		-- saeteras (troneras estrechas) por fuera y por el costado
		for _, y in { 8, 16, 24 } do
			decor(model, "ArrowSlit", Vector3.new(0.5, 2.4, 0.15), base * CFrame.new(0, y, -4.05), Color3.fromRGB(15, 12, 10), Enum.Material.SmoothPlastic)
			decor(model, "ArrowSlit", Vector3.new(0.15, 2.4, 0.5), base * CFrame.new(sx * 4.05, y - 4, 0), Color3.fromRGB(15, 12, 10), Enum.Material.SmoothPlastic)
		end
		-- plataforma de arriba (sobresale como un matacan) con suelo de madera
		block("TowerCorbel", Vector3.new(9.6, 1.5, 9.6), Vector3.new(0, H - 0.75, 0), lighter)
		block("TowerFloor", Vector3.new(9.2, 0.2, 9.2), Vector3.new(0, H + 0.1, 0), Color3.fromRGB(120, 82, 45), Enum.Material.WoodPlanks)
		local top = base * CFrame.new(0, H + 0.2, 0)
		-- almenas (con hueco por dentro, donde llega la escalera)
		for _, o in { -3.6, -1.2, 1.2, 3.6 } do
			block("TowerMerlon", Vector3.new(1.4, 1.8, 0.8), Vector3.new(o, H + 1.1, -4.4), STONE)
			block("TowerMerlon", Vector3.new(0.8, 1.8, 1.4), Vector3.new(-4.4, H + 1.1, o), STONE)
			block("TowerMerlon", Vector3.new(0.8, 1.8, 1.4), Vector3.new(4.4, H + 1.1, o), STONE)
			if math.abs(o) > 2 then
				block("TowerMerlon", Vector3.new(1.4, 1.8, 0.8), Vector3.new(o, H + 1.1, 4.4), STONE)
			end
		end
		-- tejado rojo sobre cuatro postes, con el estandarte de crines (sulde)
		for _, px in { -4.2, 4.2 } do
			for _, pz in { -4.2, 4.2 } do
				block("RoofPost", Vector3.new(0.5, 6.2, 0.5), Vector3.new(px, H + 3.3, pz), red, Enum.Material.Wood)
			end
		end
		decor(model, "TowerRoof", Vector3.new(11, 0.5, 11), top * CFrame.new(0, 6.3, 0), red, Enum.Material.WoodPlanks)
		decor(model, "TowerRoof", Vector3.new(7.6, 0.5, 7.6), top * CFrame.new(0, 6.8, 0), red, Enum.Material.WoodPlanks)
		decor(model, "TowerRoof", Vector3.new(4.2, 0.6, 4.2), top * CFrame.new(0, 7.3, 0), red, Enum.Material.WoodPlanks)
		decor(model, "RoofTrim", Vector3.new(11.3, 0.2, 11.3), top * CFrame.new(0, 6.0, 0), GOLD, Enum.Material.Metal)
		decor(model, "SuldePole", Vector3.new(0.3, 3.2, 0.3), top * CFrame.new(0, 9.2, 0), Color3.fromRGB(90, 60, 30), Enum.Material.Wood)
		decor(model, "SuldeTuft", Vector3.new(1.3, 1.3, 1.3), top * CFrame.new(0, 10.2, 0), Color3.fromRGB(30, 25, 20), Enum.Material.Fabric, Enum.PartType.Ball)
		decor(model, "SuldeTip", Vector3.new(0.25, 1.1, 0.25), top * CFrame.new(0, 11.2, 0), GOLD, Enum.Material.Metal)

		-- escalera de mano por dentro del campamento
		local truss = Instance.new("TrussPart")
		truss.Name = "TowerLadder"
		truss.Size = Vector3.new(2, H + 2, 2)
		truss.CFrame = base * CFrame.new(0, (H + 2) / 2, 5)
		truss.Color = Color3.fromRGB(110, 70, 35)
		truss.Material = Enum.Material.Wood
		truss.Anchored = true
		truss.Parent = model
		local sign = carvedSign(model, base * CFrame.new(2.6, 6, 4.1) * CFrame.Angles(0, math.pi, 0), Vector3.new(2.8, 1.2, 0.2), "BALISTA: sube y sientate", GOLD)
		sign.Name = "TowerSign"

		buildBallista(model, top)
	end
	model.Parent = plot.model
	plot.towers = model
	table.insert(plot.built, model)
end

-- Abre las puertas cuando hay un jugador vivo a menos de 14 studs y las cierra si no.
local GATE_TWEEN = TweenInfo.new(0.5, Enum.EasingStyle.Quad)
local function updateGates()
	local roots: { Vector3 } = {}
	for _, player in Players:GetPlayers() do
		local character = player.Character
		local root = character and character:FindFirstChild("HumanoidRootPart")
		local humanoid = character and character:FindFirstChildOfClass("Humanoid")
		if root and root:IsA("BasePart") and humanoid and humanoid.Health > 0 then
			table.insert(roots, root.Position)
		end
	end
	for _, plot in plots do
		local gate = plot.gate
		if gate and gate.left.Parent then
			local center = (plot.cframe * CFrame.new(0, gate.y, -42)).Position
			local near = false
			for _, pos in roots do
				if (pos - center).Magnitude <= 14 then
					near = true
					break
				end
			end
			if near ~= gate.open then
				gate.open = near
				local angle = if near then math.rad(90) else 0 -- 90: no choca con las torres
				local hingeL = plot.cframe * CFrame.new(-GATE_HALF, gate.y, -42)
				local hingeR = plot.cframe * CFrame.new(GATE_HALF, gate.y, -42)
				-- se abren hacia fuera del campamento (-Z local)
				TweenService:Create(gate.left, GATE_TWEEN, { CFrame = hingeL * CFrame.Angles(0, angle, 0) * CFrame.new(GATE_HALF / 2, 0, 0) }):Play()
				TweenService:Create(gate.right, GATE_TWEEN, { CFrame = hingeR * CFrame.Angles(0, -angle, 0) * CFrame.new(-GATE_HALF / 2, 0, 0) }):Play()
			end
		end
	end
end

-- Segundo piso: losa sobre la mitad trasera, escalera, cinta, colector y caja.
local function buildFloor2(plot: Plot)
	if plot.floor2 then
		return
	end
	local model = Instance.new("Model")
	model.Name = "Floor2"
	local cf = plot.cframe
	local wood = Color3.fromRGB(150, 105, 60)
	Build.part({ Name = "Slab", Size = Vector3.new(80, 1, 40), CFrame = cf * CFrame.new(0, H2, 20), Color = wood, Material = Enum.Material.WoodPlanks, Parent = model })
	for _, x in { -39, 39 } do
		for _, z in { 1, 39 } do
			Build.part({ Name = "Column", Size = Vector3.new(2, H2, 2), CFrame = cf * CFrame.new(x, H2 / 2, z), Color = Color3.fromRGB(170, 30, 30), Material = Enum.Material.Wood, Parent = model })
		end
	end
	-- baranda del borde delantero (deja libre la llegada de la escalera)
	Build.part({ Name = "Railing", Size = Vector3.new(73, 3, 0.6), CFrame = cf * CFrame.new(3.5, H2 + 2, 0.3), Color = Color3.fromRGB(170, 30, 30), Material = Enum.Material.Wood, Parent = model })
	-- escalera: escalones macizos de ~1 stud por el lado izquierdo, subiendo hacia atras
	local steps = 19
	local rise = (H2 + 0.5 - 1) / steps
	for i = 1, steps do
		local height = rise * i
		Build.part({
			Name = "Step",
			Size = Vector3.new(5, height, 2),
			CFrame = cf * CFrame.new(-36, 1 + height / 2, -38 + 2 * (i - 1) + 1),
			Color = wood,
			Material = Enum.Material.WoodPlanks,
			Parent = model,
		})
	end
	buildLine(plot, model, 2)
	local label2 = buildCashPad(plot, model, Vector3.new(25, H2 + 1.2, 30))
	label2.Name = "Floor2Cash"
	model.Parent = plot.model
	plot.floor2 = model
	table.insert(plot.built, model)
	updateCash(plot)
end

-- Armeria: las armas compradas se exhiben tumbadas sobre la mesa del centro.
local WEAPON_SLOT = { Sable = -8.75, Arco = -5.25, Lanza = -1.75, Trueno = 1.75, Maza = 5.25, Bomba = 8.75 }
local function displayWeapon(plot: Plot, id: string)
	local x = WEAPON_SLOT[id]
	if not x or plot.model:FindFirstChild("Display_" .. id) then
		return
	end
	local display = Weapons.displayModel(id)
	if display then
		display:PivotTo(plot.weaponTable * CFrame.new(x, 0.35, 0))
		display.Parent = plot.model
		table.insert(plot.built, display)
	end
end

local function buildWeaponTable(model: Model, top: CFrame)
	local wood = Color3.fromRGB(105, 68, 38)
	Build.part({ Name = "TableTop", Size = Vector3.new(22, 0.6, 10), CFrame = top * CFrame.new(0, -0.3, 0), Color = wood, Material = Enum.Material.WoodPlanks, Parent = model })
	Build.part({ Name = "TableRunner", Size = Vector3.new(21, 0.05, 3), CFrame = top * CFrame.new(0, 0.02, 0), Color = Color3.fromRGB(150, 30, 30), Material = Enum.Material.Fabric, Parent = model })
	for _, x in { -10.3, 10.3 } do
		for _, z in { -4.3, 4.3 } do
			Build.part({ Name = "TableLeg", Size = Vector3.new(0.8, 3.2, 0.8), CFrame = top * CFrame.new(x, -2.2, z), Color = wood, Material = Enum.Material.Wood, Parent = model })
		end
	end
	local sign = Build.part({ Name = "ArmorySign", Size = Vector3.new(1, 1, 1), CFrame = top * CFrame.new(0, 4.5, 0), Transparency = 1, CanCollide = false, Parent = model })
	sign.CanQuery = false
	Build.billboard(sign, "Armeria del Khan", 0, 220).TextColor3 = Color3.fromRGB(240, 210, 140)
end

local function applyBuild(plot: Plot, def: Types.ButtonDef)
	local owner = plot.owner
	if not owner then
		return
	end
	if def.Kind == "Dropper" then
		buildDropper(plot, def)
	elseif def.Kind == "Weapon" and def.WeaponId then
		Weapons.grant(owner, def.WeaponId)
		displayWeapon(plot, def.WeaponId)
	elseif def.Kind == "Multiplier" then
		plot.multiplier = math.max(plot.multiplier, def.Multiplier or 1)
	elseif def.Kind == "Shelter" then
		buildShelter(plot)
	elseif def.Kind == "Decor" then
		buildFence(plot)
	elseif def.Kind == "Wall" then
		buildWall(plot, def)
	elseif def.Kind == "Floor" then
		buildFloor2(plot)
	elseif def.Kind == "Towers" then
		buildTowers(plot)
	end
end

local function tryBuy(plot: Plot, def: Types.ButtonDef, player: Player, button: BasePart)
	if not available(plot, def) then
		return
	end
	if not PlayerData.trySpend(player, def.Cost) then
		local t = os.clock()
		if t - (lastWarn[player] or 0) > 2 then
			lastWarn[player] = t
			Net.fireClient(player, "Notify", string.format("Necesitas %d oro para %s", def.Cost, def.Name), "info")
		end
		return
	end
	PlayerData.setOwned(player, def.Id)
	if def.Kind == "Weapon" then
		Sfx.play(Config.Sounds.WeaponUnlock, button, { Volume = 1 })
	else
		Sfx.play(Config.Sounds.Purchase, button, { Volume = 0.8, Speed = 0.8 })
	end
	applyBuild(plot, def)
	refreshButtons(plot)
	Net.fireClient(player, "Notify", "Comprado: " .. def.Name, "reward")
end

-- ===== Plots =====

-- Camino con flechas desde la plaza: azul si el campamento esta libre, gris si tiene dueno.
local function setGuide(plot: Plot)
	local owner = plot.owner
	local color = if owner then Color3.fromRGB(150, 150, 150) else Color3.fromRGB(70, 150, 255)
	for _, arrow in plot.arrows do
		arrow.Color = color
		arrow.Material = if owner then Enum.Material.SmoothPlastic else Enum.Material.Neon
	end
	plot.guideLabel.Text = if owner
		then string.format("Campamento %d: de %s", plot.index, owner.DisplayName)
		else string.format("Campamento %d: LIBRE", plot.index)
	plot.guideLabel.TextColor3 = if owner then Color3.fromRGB(220, 220, 220) else Color3.fromRGB(170, 210, 255)
end


-- Declarada aqui porque el circulo "Reclamar" de buildPlot la llama y se
-- define mas abajo (una funcion local solo existe desde su linea).
local assign: (Player, Plot) -> ()

local function buildPlot(index: number): Plot
	local angle = (index - 1) / Config.PlotCount * math.pi * 2
	local pos = Vector3.new(math.cos(angle) * Config.PlotRingRadius, 0, math.sin(angle) * Config.PlotRingRadius)
	-- -Z local (el frente) mira al centro del mapa
	local cf = CFrame.lookAt(pos, Vector3.new(0, 0, 0))

	local model = Instance.new("Model")
	model.Name = "Plot" .. index

	Build.markGround(Build.part({ Name = "Base", Size = Vector3.new(80, 1, 80), CFrame = cf * CFrame.new(0, 0.5, 0), Color = SAND, Material = Enum.Material.Sand, Parent = model }))

	local post = Build.part({ Name = "SignPost", Size = Vector3.new(1, 10, 1), CFrame = cf * CFrame.new(0, 5, -38), Color = Color3.fromRGB(110, 70, 35), Material = Enum.Material.Wood, Parent = model })
	local signLabel = Build.billboard(post, "Campamento libre", 7, 260)

	-- punto de aparicion del dueno (lo teletransportamos al reaparecer)
	local spawn = Build.part({ Name = "HomePad", Size = Vector3.new(6, 1, 6), CFrame = cf * CFrame.new(28, 1.2, -30), Color = Color3.fromRGB(170, 30, 30), Material = Enum.Material.Slate, Parent = model })

	model.Parent = tycoonFolder

	local plot: Plot = {
		index = index,
		cframe = cf,
		model = model,
		owner = nil,
		generation = 0,
		pending = 0,
		multiplier = 1,
		built = {},
		buttons = {},
		cashLabel = nil :: any, -- se asigna abajo
		finalPad = nil :: any, -- se asigna abajo
		claimPad = nil :: any, -- se asigna abajo
		signLabel = signLabel,
		spawn = spawn,
		spawnConn = nil,
		arrows = {},
		guideLabel = nil :: any, -- se asigna abajo
		wall = nil,
		weaponTable = cf * CFrame.new(4, 3.8, 6),
		gate = nil,
		floor2 = nil,
		towers = nil,
	}
	buildLine(plot, model, 1)
	plot.cashLabel = buildCashPad(plot, model, Vector3.new(25, 1.2, -12))
	buildWeaponTable(model, plot.weaponTable)

	-- circulo dorado de la batalla final (oculto hasta completar el tycoon)
	local finalPad = Build.part({
		Name = "FinalPad",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(1, 8, 8),
		CFrame = cf * CFrame.new(14, 1.2, -30) * CFrame.Angles(0, 0, math.pi / 2),
		Color = Color3.fromRGB(255, 190, 40),
		Material = Enum.Material.Neon,
	})
	local finalLabel = Build.billboard(finalPad, "BATALLA FINAL\npisa aqui para convocarla", 5, 260)
	finalLabel.TextColor3 = Color3.fromRGB(255, 120, 60)
	local finalDebounce = false
	finalPad.Touched:Connect(function(hit)
		if finalDebounce then
			return
		end
		local player = isOwnerTouch(plot, hit)
		if player then
			finalDebounce = true
			FinalBattle.request(player)
			task.delay(3, function()
				finalDebounce = false
			end)
		end
	end)
	plot.finalPad = finalPad

	-- circulo azul para reclamar el campamento (visible mientras este libre)
	local claimPad = Build.part({
		Name = "ClaimPad",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(1, 9, 9),
		CFrame = cf * CFrame.new(0, 1.2, -36) * CFrame.Angles(0, 0, math.pi / 2), -- alrededor del poste del estandarte
		Color = Color3.fromRGB(70, 150, 255),
		Material = Enum.Material.Neon,
		Parent = model,
	})
	Build.billboard(claimPad, "RECLAMAR CAMPAMENTO\npisa aqui", 5, 260).TextColor3 = Color3.fromRGB(170, 210, 255)
	claimPad.Touched:Connect(function(hit)
		local character = hit.Parent
		local player = character and Players:GetPlayerFromCharacter(character)
		if player then
			assign(player, plot)
		end
	end)
	plot.claimPad = claimPad

	-- camino de tierra con flechas desde la plaza hasta la entrada del campamento
	local dir = Vector3.new(pos.X, 0, pos.Z).Unit
	local from = dir * 30
	local to = dir * (Config.PlotRingRadius - 47)
	local length = (to - from).Magnitude
	local path = Build.part({
		Name = "Path",
		Size = Vector3.new(7, 0.2, length),
		CFrame = CFrame.lookAt((from + to) / 2 + Vector3.new(0, 0.08, 0), to + Vector3.new(0, 0.08, 0)),
		Color = Color3.fromRGB(135, 110, 75),
		Material = Enum.Material.Ground,
		CanCollide = false,
		Parent = model,
	})
	path.CanQuery = false
	for d = 6, length - 4, 20 do
		local at = CFrame.lookAt(from + dir * d + Vector3.new(0, 0.25, 0), to + Vector3.new(0, 0.25, 0))
		local shaft = Build.part({ Name = "ArrowShaft", Size = Vector3.new(1.4, 0.15, 5), CFrame = at, Color = Color3.new(1, 1, 1), Material = Enum.Material.Neon, CanCollide = false, Parent = model })
		-- punta: cuadrado girado 45 grados en la parte delantera
		local tip = Build.part({ Name = "ArrowTip", Size = Vector3.new(3, 0.15, 3), CFrame = at * CFrame.new(0, 0, -2.6) * CFrame.Angles(0, math.rad(45), 0), Color = Color3.new(1, 1, 1), Material = Enum.Material.Neon, CanCollide = false, Parent = model })
		for _, p in { shaft, tip } do
			p.CanQuery = false
			p.CanTouch = false
			table.insert(plot.arrows, p)
		end
	end
	local guidePost = Build.part({ Name = "GuideSign", Size = Vector3.new(1, 1, 1), CFrame = CFrame.new(from + dir * 6 + Vector3.new(0, 6, 0)), Transparency = 1, CanCollide = false, Parent = model })
	guidePost.CanQuery = false
	plot.guideLabel = Build.billboard(guidePost, "", 0, 260)
	setGuide(plot)

	-- botones en dos filas de 6, entre la cinta y la entrada
	local perFloor = { 0, 0 }
	for _, def in Config.Buttons do
		local floor = def.Floor or 1
		perFloor[floor] += 1
		local i = perFloor[floor]
		local col = (i - 1) % 6
		local row = (i - 1) // 6
		local offset = if floor == 1
			then Vector3.new(-25 + col * 8, 1.2, -12 - row * 9)
			else Vector3.new(-25 + col * 8, H2 + 1.2, 30 - row * 7)
		local button = Build.part({
			Name = "Button_" .. def.Id,
			Size = Vector3.new(5, 1, 5),
			CFrame = cf * CFrame.new(offset),
			Color = Color3.fromRGB(200, 40, 40),
			Material = Enum.Material.Neon,
		})
		local label = Build.billboard(button, string.format("%s\n%d oro", def.Name, def.Cost), 3.5, 180)
		label.Size = UDim2.fromScale(1, 1)
		local debounce = false
		button.Touched:Connect(function(hit)
			if debounce then
				return
			end
			local player = isOwnerTouch(plot, hit)
			if player then
				debounce = true
				tryBuy(plot, def, player, button)
				task.delay(0.5, function()
					debounce = false
				end)
			end
		end)
		plot.buttons[def.Id] = button
	end

	return plot
end

-- Borra todo lo construido (al irse el dueno o al renacer).
local function resetBuilds(plot: Plot)
	plot.generation += 1
	plot.pending = 0
	plot.multiplier = 1
	for _, inst in plot.built do
		inst:Destroy()
	end
	plot.built = {}
	plot.wall = nil
	plot.gate = nil
	plot.floor2 = nil
	plot.towers = nil
	updateCash(plot)
end

local function release(plot: Plot)
	local owner = plot.owner
	resetBuilds(plot)
	plot.owner = nil
	plot.signLabel.Text = "Campamento libre"
	plot.claimPad.Parent = plot.model
	setGuide(plot)
	if plot.spawnConn then
		plot.spawnConn:Disconnect()
		plot.spawnConn = nil
	end
	updateCash(plot)
	refreshButtons(plot)
	if owner then
		plotOf[owner] = nil
	end
end

-- El jugador reclama un campamento libre pisando su circulo "Reclamar".
function assign(player: Player, p: Plot)
	if plotOf[player] or not player.Parent or p.owner then
		return
	end
	if not PlayerData.isLoaded(player) then
		local t = os.clock()
		if t - (lastWarn[player] or 0) > 2 then
			lastWarn[player] = t
			Net.fireClient(player, "Notify", "Cargando tus datos... pisa el circulo otra vez en un momento.", "info")
		end
		return
	end
	p.owner = player
	plotOf[player] = p
	p.signLabel.Text = "Campamento de " .. player.DisplayName
	p.claimPad.Parent = nil
	player:SetAttribute("HasPlot", true)
	setGuide(p)

	-- reconstruye lo que ya habia comprado (en orden de la lista)
	for _, def in Config.Buttons do
		if PlayerData.owns(player, def.Id) then
			applyBuild(p, def)
		end
	end
	refreshButtons(p)

	-- desde ahora reaparece en su campamento
	p.spawnConn = player.CharacterAdded:Connect(function(character: Model)
		task.wait(0.1)
		character:PivotTo(p.spawn.CFrame + Vector3.new(0, 4, 0))
	end)
	Sfx.play(Config.Sounds.WeaponUnlock, p.spawn, { Volume = 1, Speed = 0.7 })
	Net.fireClient(player, "Notify", "Has levantado tu campamento, Khan. Reune rebanos y armas antes de que caiga la noche.", "reward")
	-- el ciclo de Verity empieza con el primer campamento del servidor
	Verity.startCycle()
end

-- Renacer (tras ganar la batalla final, si el jugador quiere): empieza de
-- cero con mas oro para siempre. Lo ofrece FinalBattle con CanRebirth.
local function rebirth(player: Player)
	if not player:GetAttribute("CanRebirth") then
		return
	end
	player:SetAttribute("CanRebirth", false)
	PlayerData.rebirth(player)
	Weapons.revoke(player)
	local plot = plotOf[player]
	if plot then
		resetBuilds(plot)
		refreshButtons(plot)
	end
	Sfx.play(Config.Sounds.Victory, workspace, { Volume = 0.8 })
	Net.fireClient(player, "Notify", string.format("RENACISTE (x%d). Tu campamento empieza de cero, pero ahora ganas x%.1f de oro.", PlayerData.getRebirths(player), PlayerData.rebirthMultiplier(player)), "reward")
end

function Tycoon.init()
	tycoonFolder = Instance.new("Folder")
	tycoonFolder.Name = "Tycoons"
	tycoonFolder.Parent = workspace
	oreFolder = Instance.new("Folder")
	oreFolder.Name = "Ore"
	oreFolder.Parent = tycoonFolder

	for i = 1, Config.PlotCount do
		table.insert(plots, buildPlot(i))
	end

	Net.onServer("Rebirth", rebirth)
	local function onJoin(player: Player)
		player:SetAttribute("HasPlot", false)
	end
	Players.PlayerAdded:Connect(onJoin)
	for _, player in Players:GetPlayers() do
		onJoin(player)
	end
	Players.PlayerRemoving:Connect(function(player)
		local plot = plotOf[player]
		if plot then
			release(plot)
		end
		lastWarn[player] = nil
	end)
end

function Tycoon.start()
	while true do
		task.wait(0.2)
		updateGates()
	end
end

return Tycoon
