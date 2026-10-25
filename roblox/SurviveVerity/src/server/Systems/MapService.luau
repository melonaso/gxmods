--!strict
-- Lobby, mapas y ambientación.
--
-- Mapas personalizados: coloca Models en ServerStorage/Maps con:
--   SurvivorSpawns (Folder de Parts), KillerSpawn (Part),
--   GoldSpawns (Folder de Parts), CraftingTables (Folder de Parts: la mesa
--   se coloca encima de cada Part). Si no hay ninguno, se genera una mansión.

local Lighting = game:GetService("Lighting")
local ServerStorage = game:GetService("ServerStorage")
local Workspace = game:GetService("Workspace")

export type MapInfo = {
	model: Model,
	name: string,
	survivorSpawns: { CFrame },
	killerSpawn: CFrame,
	goldSpawns: { Vector3 },
	tableSpots: { CFrame },
}

local LOBBY_HEIGHT = 300
local CELL = 40
local GRID = 4
local WALL_HEIGHT = 18
local DOOR_WIDTH = 10

local MapService = {}

local lobbySpawn: CFrame = CFrame.new(0, LOBBY_HEIGHT + 4, 0)
local rng = Random.new()

local function part(props: { [string]: any }, parent: Instance): Part
	local p = Instance.new("Part")
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	for k, v in props do
		(p :: any)[k] = v
	end
	p.Parent = parent
	return p
end

local function buildLobby(): Model
	local lobby = Instance.new("Model")
	lobby.Name = "Lobby"

	local y = LOBBY_HEIGHT
	part({ Name = "Floor", Size = Vector3.new(90, 2, 90), CFrame = CFrame.new(0, y, 0), Material = Enum.Material.WoodPlanks, Color = Color3.fromRGB(92, 64, 51) }, lobby)
	part({ Name = "Rug", Size = Vector3.new(30, 0.2, 30), CFrame = CFrame.new(0, y + 1.1, 0), Material = Enum.Material.Fabric, Color = Color3.fromRGB(110, 22, 32) }, lobby)
	for i = 0, 3 do
		local angle = math.rad(i * 90)
		local cf = CFrame.new(0, y, 0) * CFrame.Angles(0, angle, 0) * CFrame.new(0, 7, -45)
		part({ Name = "Wall", Size = Vector3.new(90, 12, 2), CFrame = cf, Material = Enum.Material.Brick, Color = Color3.fromRGB(60, 46, 58) }, lobby)
	end
	for _, x in { -30, 30 } do
		for _, z in { -30, 30 } do
			local lamp = part({ Name = "Lamp", Size = Vector3.new(1.5, 1.5, 1.5), Shape = Enum.PartType.Ball, CFrame = CFrame.new(x, y + 10, z), Material = Enum.Material.Neon, Color = Color3.fromRGB(255, 196, 120), CanCollide = false }, lobby)
			local light = Instance.new("PointLight")
			light.Range = 40
			light.Brightness = 1.4
			light.Color = Color3.fromRGB(255, 200, 140)
			light.Parent = lamp
		end
	end

	-- Cartel con el nombre del juego
	local sign = part({ Name = "Sign", Size = Vector3.new(36, 9, 1), CFrame = CFrame.new(0, y + 7, -43.5), Material = Enum.Material.SmoothPlastic, Color = Color3.fromRGB(20, 14, 20) }, lobby)
	local surface = Instance.new("SurfaceGui")
	surface.Face = Enum.NormalId.Back
	surface.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	surface.PixelsPerStud = 30
	surface.Parent = sign
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Text = "SURVIVE <font color=\"#ff3b4e\">VERITY</font>"
	label.RichText = true
	label.TextScaled = true
	label.Font = Enum.Font.GothamBlack
	label.TextColor3 = Color3.new(1, 1, 1)
	label.Parent = surface

	local spawn = Instance.new("SpawnLocation")
	spawn.Name = "LobbySpawn"
	spawn.Anchored = true
	spawn.Neutral = true
	spawn.Duration = 0
	spawn.Size = Vector3.new(8, 1, 8)
	spawn.CFrame = CFrame.new(0, y + 1.5, 10)
	spawn.Transparency = 1
	spawn.CanCollide = false
	spawn.Parent = lobby

	lobby.Parent = Workspace
	return lobby
end

function MapService.ensureLobby()
	local lobby = Workspace:FindFirstChild("Lobby") or buildLobby()
	local spawn = lobby:FindFirstChildWhichIsA("SpawnLocation", true)
	if spawn then
		lobbySpawn = spawn.CFrame + Vector3.new(0, 3, 0)
	end
	-- Solo el lobby debe ser punto de aparición.
	for _, inst in Workspace:GetDescendants() do
		if inst:IsA("SpawnLocation") and not inst:IsDescendantOf(lobby) then
			inst.Enabled = false
		end
	end
end

function MapService.lobbyCFrame(): CFrame
	return lobbySpawn * CFrame.new(rng:NextNumber(-12, 12), 0, rng:NextNumber(-12, 12))
end

-- Mansión procedural ---------------------------------------------------------

local WALL_COLOR = Color3.fromRGB(70, 58, 72)
local FLOOR_COLOR = Color3.fromRGB(78, 54, 44)

local function wallWithDoor(parent: Instance, from: Vector3, to: Vector3)
	local dir = to - from
	local length = dir.Magnitude
	local unit = dir.Unit
	local look = CFrame.lookAt(Vector3.zero, unit)

	-- 15% sin pared (habitación abierta), resto con 1 puerta (a veces 2)
	if rng:NextNumber() < 0.15 then
		return
	end
	local doors = if rng:NextNumber() < 0.3 then 2 else 1
	local gaps: { number } = {}
	if doors == 1 then
		table.insert(gaps, rng:NextNumber(DOOR_WIDTH, length - DOOR_WIDTH))
	else
		table.insert(gaps, rng:NextNumber(DOOR_WIDTH * 0.75, length / 2 - DOOR_WIDTH * 0.75))
		table.insert(gaps, rng:NextNumber(length / 2 + DOOR_WIDTH * 0.75, length - DOOR_WIDTH * 0.75))
	end

	local cursor = 0
	local function segment(a: number, b: number)
		if b - a < 0.5 then
			return
		end
		local mid = from + unit * ((a + b) / 2)
		part({
			Name = "Wall",
			Size = Vector3.new(1.5, WALL_HEIGHT, b - a),
			CFrame = CFrame.new(mid + Vector3.new(0, WALL_HEIGHT / 2, 0)) * look,
			Material = Enum.Material.Plaster,
			Color = WALL_COLOR,
		}, parent)
	end
	for _, center in gaps do
		segment(cursor, center - DOOR_WIDTH / 2)
		-- dintel sobre la puerta
		local mid = from + unit * center
		part({
			Name = "Lintel",
			Size = Vector3.new(1.5, WALL_HEIGHT - 10, DOOR_WIDTH),
			CFrame = CFrame.new(mid + Vector3.new(0, 10 + (WALL_HEIGHT - 10) / 2, 0)) * look,
			Material = Enum.Material.Plaster,
			Color = WALL_COLOR,
		}, parent)
		cursor = center + DOOR_WIDTH / 2
	end
	segment(cursor, length)
end

local FURNITURE = {
	{ size = Vector3.new(6, 4, 3), color = Color3.fromRGB(101, 67, 45), material = Enum.Material.Wood }, -- cómoda
	{ size = Vector3.new(4, 9, 2), color = Color3.fromRGB(84, 56, 40), material = Enum.Material.Wood }, -- estantería
	{ size = Vector3.new(4, 4, 4), color = Color3.fromRGB(140, 104, 66), material = Enum.Material.WoodPlanks }, -- caja
	{ size = Vector3.new(8, 3, 4), color = Color3.fromRGB(96, 30, 40), material = Enum.Material.Fabric }, -- sofá
}

local function buildMansion(): MapInfo
	local model = Instance.new("Model")
	model.Name = "Mansión de Verity"
	local half = CELL * GRID / 2

	part({ Name = "Floor", Size = Vector3.new(CELL * GRID, 2, CELL * GRID), CFrame = CFrame.new(0, -1, 0), Material = Enum.Material.WoodPlanks, Color = FLOOR_COLOR }, model)
	-- Muros exteriores
	for i = 0, 3 do
		local cf = CFrame.Angles(0, math.rad(i * 90), 0) * CFrame.new(0, WALL_HEIGHT / 2, -half)
		part({ Name = "OuterWall", Size = Vector3.new(CELL * GRID + 2, WALL_HEIGHT, 2), CFrame = cf, Material = Enum.Material.Brick, Color = Color3.fromRGB(52, 40, 50) }, model)
	end
	part({ Name = "Ceiling", Size = Vector3.new(CELL * GRID, 1, CELL * GRID), CFrame = CFrame.new(0, WALL_HEIGHT + 0.5, 0), Material = Enum.Material.Plaster, Color = Color3.fromRGB(30, 24, 32) }, model)

	-- Paredes interiores con puertas
	for i = 1, GRID - 1 do
		local c = -half + i * CELL
		for j = 0, GRID - 1 do
			local a = -half + j * CELL
			wallWithDoor(model, Vector3.new(c, 0, a), Vector3.new(c, 0, a + CELL))
			wallWithDoor(model, Vector3.new(a, 0, c), Vector3.new(a + CELL, 0, c))
		end
	end

	local centers: { Vector3 } = {}
	local blocked: { Vector3 } = {}
	for gx = 0, GRID - 1 do
		for gz = 0, GRID - 1 do
			local center = Vector3.new(-half + (gx + 0.5) * CELL, 0, -half + (gz + 0.5) * CELL)
			table.insert(centers, center)

			-- Lámpara por habitación
			local lamp = part({ Name = "Lamp", Size = Vector3.new(2, 0.6, 2), CFrame = CFrame.new(center + Vector3.new(0, WALL_HEIGHT - 0.4, 0)), Material = Enum.Material.Neon, Color = Color3.fromRGB(255, 170, 110), CanCollide = false }, model)
			local light = Instance.new("PointLight")
			light.Range = 26
			light.Brightness = 0.9
			light.Color = Color3.fromRGB(255, 170, 120)
			light.Shadows = true
			light.Parent = lamp
			lamp:SetAttribute("Flicker", rng:NextNumber() < 0.35)
			lamp:AddTag("MansionLamp")

			-- Muebles cerca de las paredes para tener cobertura
			for _ = 1, rng:NextInteger(1, 3) do
				local f = FURNITURE[rng:NextInteger(1, #FURNITURE)]
				local offset = Vector3.new(rng:NextNumber(-14, 14), 0, rng:NextNumber(-14, 14))
				if offset.Magnitude > 7 then
					local pos = center + offset + Vector3.new(0, f.size.Y / 2, 0)
					part({ Name = "Furniture", Size = f.size, CFrame = CFrame.new(pos) * CFrame.Angles(0, math.rad(rng:NextInteger(0, 3) * 90), 0), Material = f.material, Color = f.color }, model)
					table.insert(blocked, pos)
				end
			end
		end
	end

	local function freeSpot(center: Vector3): Vector3
		for _ = 1, 12 do
			local p = center + Vector3.new(rng:NextNumber(-15, 15), 0, rng:NextNumber(-15, 15))
			local ok = true
			for _, b in blocked do
				if (Vector3.new(b.X, 0, b.Z) - p).Magnitude < 6 then
					ok = false
					break
				end
			end
			if ok then
				return p
			end
		end
		return center
	end

	-- Mesas: en habitaciones distintas, lejos del centro del mapa
	local shuffled = table.clone(centers)
	for i = #shuffled, 2, -1 do
		local j = rng:NextInteger(1, i)
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	end
	local tableSpots: { CFrame } = {}
	for _, c in shuffled do
		if #tableSpots >= 3 then
			break
		end
		if c.Magnitude > CELL * 0.8 then
			local spot = freeSpot(c)
			table.insert(blocked, spot)
			table.insert(tableSpots, CFrame.new(spot) * CFrame.Angles(0, math.rad(rng:NextInteger(0, 3) * 90), 0))
		end
	end

	local goldSpawns: { Vector3 } = {}
	for _, c in centers do
		for _ = 1, 2 do
			table.insert(goldSpawns, freeSpot(c) + Vector3.new(0, 1.6, 0))
		end
	end

	local survivorSpawns: { CFrame } = {}
	for _, c in centers do
		if c.Magnitude > CELL then
			table.insert(survivorSpawns, CFrame.new(freeSpot(c) + Vector3.new(0, 3, 0)))
		end
	end

	-- Verity aparece en una de las habitaciones centrales
	local killerSpawn = CFrame.new(freeSpot(centers[GRID + 2]) + Vector3.new(0, 3, 0))

	model.Parent = Workspace
	return {
		model = model,
		name = model.Name,
		survivorSpawns = survivorSpawns,
		killerSpawn = killerSpawn,
		goldSpawns = goldSpawns,
		tableSpots = tableSpots,
	}
end

local function loadCustomMap(template: Model): MapInfo?
	local model = template:Clone()
	local function cframes(folderName: string): { CFrame }
		local list = {}
		local folder = model:FindFirstChild(folderName)
		if folder then
			for _, child in folder:GetChildren() do
				if child:IsA("BasePart") then
					child.Transparency = 1
					child.CanCollide = false
					-- se usa la base de la Part (a ras de suelo)
					table.insert(list, child.CFrame - Vector3.new(0, child.Size.Y / 2, 0))
				end
			end
		end
		return list
	end
	local survivors = cframes("SurvivorSpawns")
	local gold = cframes("GoldSpawns")
	local tables = cframes("CraftingTables")
	local killer = model:FindFirstChild("KillerSpawn")
	if #survivors == 0 or #gold == 0 or #tables == 0 or not (killer and killer:IsA("BasePart")) then
		warn(`[MapService] el mapa {template.Name} no tiene la estructura requerida; se usa la mansión`)
		model:Destroy()
		return nil
	end
	killer.Transparency = 1
	killer.CanCollide = false
	local goldPositions = {}
	for _, cf in gold do
		table.insert(goldPositions, cf.Position + Vector3.new(0, 1.6, 0))
	end
	model.Parent = Workspace
	local spawnsUp = {}
	for _, cf in survivors do
		table.insert(spawnsUp, cf + Vector3.new(0, 3, 0))
	end
	return {
		model = model,
		name = template.Name,
		survivorSpawns = spawnsUp,
		killerSpawn = killer.CFrame + Vector3.new(0, 3 - killer.Size.Y / 2, 0),
		goldSpawns = goldPositions,
		tableSpots = tables,
	}
end

function MapService.load(): MapInfo
	local maps = ServerStorage:FindFirstChild("Maps")
	if maps then
		local options = {}
		for _, child in maps:GetChildren() do
			if child:IsA("Model") then
				table.insert(options, child)
			end
		end
		if #options > 0 then
			local info = loadCustomMap(options[rng:NextInteger(1, #options)])
			if info then
				return info
			end
		end
	end
	return buildMansion()
end

-- Ambientación ----------------------------------------------------------------

local lobbyLighting = {
	ClockTime = 14.5,
	Brightness = 2,
	Ambient = Color3.fromRGB(120, 110, 120),
	OutdoorAmbient = Color3.fromRGB(128, 128, 128),
	FogEnd = 100000,
	FogColor = Color3.fromRGB(192, 192, 192),
}
local roundLighting = {
	ClockTime = 0,
	Brightness = 0.4,
	Ambient = Color3.fromRGB(38, 30, 44),
	OutdoorAmbient = Color3.fromRGB(30, 24, 36),
	FogEnd = 150,
	FogColor = Color3.fromRGB(16, 10, 20),
}

function MapService.setAtmosphere(inRound: boolean)
	for k, v in if inRound then roundLighting else lobbyLighting do
		(Lighting :: any)[k] = v
	end
end

function MapService.init()
	MapService.ensureLobby()
	MapService.setAtmosphere(false)
end

return MapService
