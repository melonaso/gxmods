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
}

local Tycoon = {}

local SLOT_X = { -21, -9, 3, 15 }
local H2 = Config.Floor2Height
-- posicion de la fila de droppers/cinta en cada piso (local al plot)
local LINE = {
	[1] = { y = 0, z = 30 }, -- al fondo del campamento: deja libre el centro
	[2] = { y = H2, z = 14 },
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

local function buildDropper(plot: Plot, def: Types.ButtonDef)
	local owner = plot.owner :: Player
	local generation = plot.generation
	local x = SLOT_X[def.Slot or 1]
	local line = LINE[def.Floor or 1]
	local cf = plot.cframe * CFrame.new(0, line.y, line.z)
	local model = Instance.new("Model")
	model.Name = "Dropper_" .. def.Id
	Build.part({ Name = "Pillar", Size = Vector3.new(1, 10, 1), CFrame = cf * CFrame.new(x, 6, -5), Color = Color3.fromRGB(110, 70, 35), Material = Enum.Material.Wood, Parent = model })
	Build.part({ Name = "Arm", Size = Vector3.new(1, 1, 5), CFrame = cf * CFrame.new(x, 10.5, -2.5), Color = Color3.fromRGB(110, 70, 35), Material = Enum.Material.Wood, Parent = model })
	local hopper = Build.part({ Name = "Hopper", Size = Vector3.new(4, 3, 4), CFrame = cf * CFrame.new(x, 9.5, 0), Color = def.OreColor or SAND, Material = Enum.Material.Fabric, Parent = model })
	Build.billboard(hopper, def.Name, 3, 160)
	model.Parent = plot.model
	table.insert(plot.built, model)

	task.spawn(function()
		while plot.generation == generation and plot.owner == owner and model.Parent do
			task.wait(def.Interval or 2)
			if plot.generation ~= generation then
				break
			end
			local ore = Build.part({
				Name = "Ore",
				Size = Vector3.new(1.2, 1.2, 1.2),
				CFrame = hopper.CFrame * CFrame.new(0, -2.2, 0),
				Color = def.OreColor or SAND,
				Material = Enum.Material.SmoothPlastic,
				Anchored = false,
				Parent = oreFolder,
			})
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
	local sign = Build.part({ Name = "WallSign", Size = Vector3.new(1, 1, 1), CFrame = plot.cframe * CFrame.new(0, h + 6, -42), Transparency = 1, CanCollide = false, Parent = model })
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
				local angle = if near then math.rad(100) else 0
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
local WEAPON_SLOT = { Sable = -6, Arco = -2, Lanza = 2, Trueno = 6 }
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
	Build.part({ Name = "TableTop", Size = Vector3.new(17, 0.6, 10), CFrame = top * CFrame.new(0, -0.3, 0), Color = wood, Material = Enum.Material.WoodPlanks, Parent = model })
	Build.part({ Name = "TableRunner", Size = Vector3.new(16, 0.05, 3), CFrame = top * CFrame.new(0, 0.02, 0), Color = Color3.fromRGB(150, 30, 30), Material = Enum.Material.Fabric, Parent = model })
	for _, x in { -7.8, 7.8 } do
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
