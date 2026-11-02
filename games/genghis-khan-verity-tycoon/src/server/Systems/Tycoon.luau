--!strict
-- Plots del tycoon: botones de compra, droppers (animales/caravanas),
-- cinta, colector, caja para recoger oro, empalizada, Gran Yurta,
-- murallas contra Verity y segundo piso.
local Debris = game:GetService("Debris")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local Net = require(Shared.Net)
local Types = require(Shared.Types)

local Build = require(script.Parent.Parent.Lib.Build)
local Sfx = require(script.Parent.Parent.Lib.Sfx)
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
	cashLabel: TextLabel,
	signLabel: TextLabel,
	spawn: BasePart,
	spawnConn: RBXScriptConnection?,
	wall: Model?,
	floor2: Model?,
}

local Tycoon = {}

local SLOT_X = { -21, -9, 3, 15 }
local H2 = Config.Floor2Height
-- posicion de la fila de droppers/cinta en cada piso (local al plot)
local LINE = {
	[1] = { y = 0, z = 0 },
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
			plot.pending += value * plot.multiplier
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
	local cf = plot.cframe * CFrame.new(-26, 0, 26)
	local yurt = Build.yurt(plot.model, cf, 9, 10)
	Build.markSolid(yurt)
	table.insert(plot.built, yurt)
	local zone = Build.hidingZone(World.getHidingFolder(), cf * CFrame.new(0, 5, 0), Vector3.new(14, 10, 14), owner.UserId)
	table.insert(plot.built, zone)
end

-- Muralla alrededor del plot. Grupo de colision VerityWall: los jugadores (y el
-- oro) la atraviesan, Verity no. Verity.luau la golpea y la repara al irse.
local function buildWall(plot: Plot, def: Types.ButtonDef)
	local owner = plot.owner :: Player
	if plot.wall then
		plot.wall:Destroy() -- el nivel nuevo reemplaza al anterior
		plot.wall = nil
	end
	Build.ensureGroups()
	local h = def.WallHeight or 14
	local maxHp = def.WallHP or 500
	local model = Instance.new("Model")
	model.Name = "Wall_" .. plot.index
	local function seg(size: Vector3, offset: Vector3)
		local p = Build.part({ Name = "WallSegment", Size = size, CFrame = plot.cframe * CFrame.new(offset), Color = def.WallColor, Material = def.WallMaterial, Parent = model })
		p.CollisionGroup = Build.WALL_GROUP
	end
	seg(Vector3.new(86, h, 2), Vector3.new(0, h / 2 + 1, 42))
	seg(Vector3.new(86, h, 2), Vector3.new(0, h / 2 + 1, -42))
	seg(Vector3.new(2, h, 82), Vector3.new(42, h / 2 + 1, 0))
	seg(Vector3.new(2, h, 82), Vector3.new(-42, h / 2 + 1, 0))
	local sign = Build.part({ Name = "WallSign", Size = Vector3.new(1, 1, 1), CFrame = plot.cframe * CFrame.new(0, h + 4, -42), Transparency = 1, CanCollide = false, Parent = model })
	sign.CanQuery = false
	sign.CanTouch = false
	local label = Build.billboard(sign, "", 0, 260)
	local function refresh()
		local hp = (model:GetAttribute("HP") :: number?) or 0
		if model:GetAttribute("Broken") then
			label.Text = def.Name .. ": ROTA"
			label.TextColor3 = Color3.fromRGB(255, 80, 80)
		else
			label.Text = string.format("%s: %d / %d", def.Name, hp, maxHp)
			label.TextColor3 = Color3.new(1, 1, 1)
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

local function applyBuild(plot: Plot, def: Types.ButtonDef)
	local owner = plot.owner
	if not owner then
		return
	end
	if def.Kind == "Dropper" then
		buildDropper(plot, def)
	elseif def.Kind == "Weapon" and def.WeaponId then
		Weapons.grant(owner, def.WeaponId)
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

local function buildPlot(index: number): Plot
	local angle = (index - 1) / Config.PlotCount * math.pi * 2
	local pos = Vector3.new(math.cos(angle) * Config.PlotRingRadius, 0, math.sin(angle) * Config.PlotRingRadius)
	-- -Z local (el frente) mira al centro del mapa
	local cf = CFrame.lookAt(pos, Vector3.new(0, 0, 0))

	local model = Instance.new("Model")
	model.Name = "Plot" .. index

	Build.markGround(Build.part({ Name = "Base", Size = Vector3.new(80, 1, 80), CFrame = cf * CFrame.new(0, 0.5, 0), Color = SAND, Material = Enum.Material.Sand, Parent = model }))

	local post = Build.part({ Name = "SignPost", Size = Vector3.new(1, 10, 1), CFrame = cf * CFrame.new(0, 5, -38), Color = Color3.fromRGB(110, 70, 35), Material = Enum.Material.Wood, Parent = model })
	local signLabel = Build.billboard(post, "Plot libre", 7, 260)

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
		signLabel = signLabel,
		spawn = spawn,
		spawnConn = nil,
		wall = nil,
		floor2 = nil,
	}
	buildLine(plot, model, 1)
	plot.cashLabel = buildCashPad(plot, model, Vector3.new(25, 1.2, -12))

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

local function release(plot: Plot)
	local owner = plot.owner
	plot.generation += 1
	plot.owner = nil
	plot.pending = 0
	plot.multiplier = 1
	for _, inst in plot.built do
		inst:Destroy()
	end
	plot.built = {}
	plot.wall = nil
	plot.floor2 = nil
	plot.signLabel.Text = "Plot libre"
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

local function assign(player: Player)
	if plotOf[player] or not player.Parent then
		return
	end
	local plot: Plot? = nil
	for _, p in plots do
		if not p.owner then
			plot = p
			break
		end
	end
	if not plot then
		Net.fireClient(player, "Notify", "No hay plots libres en este servidor.", "warning")
		return
	end
	local p = plot :: Plot
	p.owner = player
	plotOf[player] = p
	p.signLabel.Text = "Campamento de " .. player.DisplayName

	-- reconstruye lo que ya habia comprado (en orden de la lista)
	for _, def in Config.Buttons do
		if PlayerData.owns(player, def.Id) then
			applyBuild(p, def)
		end
	end
	refreshButtons(p)

	local function sendHome(character: Model)
		task.wait(0.1)
		character:PivotTo(p.spawn.CFrame + Vector3.new(0, 4, 0))
	end
	p.spawnConn = player.CharacterAdded:Connect(sendHome)
	if player.Character then
		task.spawn(sendHome, player.Character)
	end
	Net.fireClient(player, "Notify", "Bienvenido, Khan. Compra animales para ganar oro y armas para enfrentar a Verity.", "info")
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

	PlayerData.Loaded:Connect(assign)
	Players.PlayerRemoving:Connect(function(player)
		local plot = plotOf[player]
		if plot then
			release(plot)
		end
		lastWarn[player] = nil
	end)
end

function Tycoon.start()
	-- por si alguien cargo antes de conectar Loaded
	for _, player in Players:GetPlayers() do
		if PlayerData.isLoaded(player) then
			assign(player)
		end
	end
end

return Tycoon
