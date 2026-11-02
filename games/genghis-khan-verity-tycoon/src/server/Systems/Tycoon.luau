--!strict
-- Plots del tycoon: botones de compra, droppers (animales/caravanas),
-- cinta, colector, caja para recoger oro, empalizada y Gran Yurta.
local Debris = game:GetService("Debris")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local Net = require(Shared.Net)
local Types = require(Shared.Types)

local Build = require(script.Parent.Parent.Lib.Build)
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
}

local Tycoon = {}

local SLOT_X = { -21, -9, 3, 15 }
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
	plot.cashLabel.Text = string.format("Recoger: %d oro", math.floor(plot.pending))
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

local function buildDropper(plot: Plot, def: Types.ButtonDef)
	local owner = plot.owner :: Player
	local generation = plot.generation
	local x = SLOT_X[def.Slot or 1]
	local cf = plot.cframe
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
	table.insert(plot.built, yurt)
	local zone = Build.hidingZone(World.getHidingFolder(), cf * CFrame.new(0, 5, 0), Vector3.new(14, 10, 14), owner.UserId)
	table.insert(plot.built, zone)
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
	end
end

local function tryBuy(plot: Plot, def: Types.ButtonDef, player: Player)
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

	-- cinta transportadora: una pieza anclada con velocidad mueve lo que cae encima
	local conveyor = Build.part({ Name = "Conveyor", Size = Vector3.new(50, 1, 5), CFrame = cf * CFrame.new(-2, 1.5, 0), Color = Color3.fromRGB(40, 35, 30), Material = Enum.Material.Fabric, Parent = model })
	conveyor.AssemblyLinearVelocity = cf.RightVector * 10
	Build.part({ Name = "RailA", Size = Vector3.new(50, 1.5, 0.5), CFrame = cf * CFrame.new(-2, 2.75, 2.75), Color = Color3.fromRGB(110, 70, 35), Material = Enum.Material.Wood, Parent = model })
	Build.part({ Name = "RailB", Size = Vector3.new(50, 1.5, 0.5), CFrame = cf * CFrame.new(-2, 2.75, -2.75), Color = Color3.fromRGB(110, 70, 35), Material = Enum.Material.Wood, Parent = model })

	local collector = Build.part({ Name = "Collector", Size = Vector3.new(4, 4, 7), CFrame = cf * CFrame.new(25, 3, 0), Color = Color3.fromRGB(230, 190, 60), Material = Enum.Material.Neon, Parent = model })

	local cashPad = Build.part({ Name = "CashPad", Size = Vector3.new(6, 1, 6), CFrame = cf * CFrame.new(25, 1.2, -12), Color = Color3.fromRGB(60, 200, 90), Material = Enum.Material.Neon, Parent = model })
	local cashLabel = Build.billboard(cashPad, "Recoger: 0 oro", 4, 220)

	-- punto de aparicion del dueno (lo teletransportamos al reaparecer)
	local spawn = Build.part({ Name = "HomePad", Size = Vector3.new(6, 1, 6), CFrame = cf * CFrame.new(0, 1.2, -28), Color = Color3.fromRGB(170, 30, 30), Material = Enum.Material.Slate, Parent = model })

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
		cashLabel = cashLabel,
		signLabel = signLabel,
		spawn = spawn,
		spawnConn = nil,
	}

	-- botones en dos filas de 6, entre la cinta y la entrada
	for i, def in Config.Buttons do
		local col = (i - 1) % 6
		local row = (i - 1) // 6
		local button = Build.part({
			Name = "Button_" .. def.Id,
			Size = Vector3.new(5, 1, 5),
			CFrame = cf * CFrame.new(-25 + col * 8, 1.2, -12 - row * 9),
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
				tryBuy(plot, def, player)
				task.delay(0.5, function()
					debounce = false
				end)
			end
		end)
		plot.buttons[def.Id] = button
	end

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

	cashPad.Touched:Connect(function(hit)
		local player = isOwnerTouch(plot, hit)
		if player and plot.pending > 0 then
			PlayerData.addGold(player, math.floor(plot.pending))
			plot.pending = 0
			updateCash(plot)
		end
	end)

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
