--!strict
-- Construye la estepa: suelo, spawn central, estandarte del Khan,
-- cuevas del chaman (refugios publicos) y el portal por donde llega Verity.
local Lighting = game:GetService("Lighting")

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared").Config)
local Build = require(script.Parent.Parent.Lib.Build)
local Horse = require(script.Parent.Parent.Lib.Horse)

local World = {}

World.PortalPosition = Vector3.new(0, 0, -260)

local mapFolder: Folder? = nil
local hidingFolder: Folder? = nil
local wallFolder: Folder? = nil

-- Murallas compradas (Model con atributos HP, MaxHP, OwnerUserId, Broken).
function World.getWallFolder(): Folder
	if not wallFolder then
		local f = Instance.new("Folder")
		f.Name = "Walls"
		f.Parent = workspace
		wallFolder = f
	end
	return wallFolder :: Folder
end

function World.getMapFolder(): Folder
	if not mapFolder then
		local f = Instance.new("Folder")
		f.Name = "Map"
		f.Parent = workspace
		mapFolder = f
	end
	return mapFolder :: Folder
end

-- Carpeta con todas las zonas de escondite (publicas y Gran Yurta de cada plot).
function World.getHidingFolder(): Folder
	if not hidingFolder then
		local f = Instance.new("Folder")
		f.Name = "HidingZones"
		f.Parent = workspace
		hidingFolder = f
	end
	return hidingFolder :: Folder
end

-- ===== Terreno y paisaje =====
-- El suelo es el pasto natural del terreno de Roblox (hojas largas con
-- Decoration). Donde no debe salir pasto (plaza, campamentos, caminos,
-- cuevas, portal) el terreno es de otro material. Debajo hay piezas
-- invisibles (grupo Ground) que son el suelo de Verity.

local RIVER_Z = 239 -- el rio Onon cruza el sur del mapa
local RIVER_HALF = 7

local function plotCenters(): { CFrame }
	local list = {}
	for i = 1, Config.PlotCount do
		local angle = (i - 1) / Config.PlotCount * math.pi * 2
		local pos = Vector3.new(math.cos(angle) * Config.PlotRingRadius, 0, math.sin(angle) * Config.PlotRingRadius)
		table.insert(list, CFrame.lookAt(pos, Vector3.zero))
	end
	return list
end

-- ===== Rellenos de terreno alineados a la rejilla =====
-- El terreno de Roblox va en celdas de 4x4x4 studs. Un relleno girado o
-- redondo (FillBlock con rotacion, FillCylinder) deja el borde de arriba
-- "suavizado" y levanta el suelo unos 2 studs, tapando pisos y botones.
-- Por eso todo se rellena con bloques SIN girar, alineados a la rejilla y con
-- la cara de arriba en FILL_TOP. Las formas giradas o redondas se
-- arman fila a fila con tramos rectos.
local VOXEL = 4
-- Roblox dibuja la superficie del terreno unos 2 studs POR ENCIMA del borde
-- de arriba del relleno (visto en el juego: con rellenos hasta y = 0 el suelo
-- tapaba los botones y el spawn). Por eso todo se rellena hasta y = -2 y la
-- superficie visible queda a ras de los pisos (y = 0).
local FILL_TOP = -2

local function fillRect(terrain: Terrain, x0: number, x1: number, z0: number, z1: number, material: Enum.Material)
	local ax0 = math.floor(math.min(x0, x1) / VOXEL) * VOXEL
	local ax1 = math.ceil(math.max(x0, x1) / VOXEL) * VOXEL
	local az0 = math.floor(math.min(z0, z1) / VOXEL) * VOXEL
	local az1 = math.ceil(math.max(z0, z1) / VOXEL) * VOXEL
	if ax1 > ax0 and az1 > az0 then
		terrain:FillBlock(CFrame.new((ax0 + ax1) / 2, FILL_TOP - 6, (az0 + az1) / 2), Vector3.new(ax1 - ax0, 12, az1 - az0), material)
	end
end

-- Recorre la rejilla por filas y rellena los tramos de celdas cuyo centro esta dentro.
local function fillShape(terrain: Terrain, minX: number, maxX: number, minZ: number, maxZ: number, inside: (Vector3) -> boolean, material: Enum.Material)
	local x0 = math.floor(minX / VOXEL) * VOXEL
	local x1 = math.ceil(maxX / VOXEL) * VOXEL
	local z0 = math.floor(minZ / VOXEL) * VOXEL
	local z1 = math.ceil(maxZ / VOXEL) * VOXEL
	for z = z0, z1 - VOXEL, VOXEL do
		local runStart: number? = nil
		for x = x0, x1, VOXEL do
			local cellInside = x < x1 and inside(Vector3.new(x + VOXEL / 2, 0, z + VOXEL / 2))
			if cellInside and runStart == nil then
				runStart = x
			elseif not cellInside and runStart ~= nil then
				fillRect(terrain, runStart, x, z, z + VOXEL, material)
				runStart = nil
			end
		end
	end
end

local function fillDisc(terrain: Terrain, center: Vector3, radius: number, material: Enum.Material)
	fillShape(terrain, center.X - radius, center.X + radius, center.Z - radius, center.Z + radius, function(p)
		return Vector3.new(p.X - center.X, 0, p.Z - center.Z).Magnitude <= radius
	end, material)
end

-- Rectangulo girado (cf a nivel del suelo, tamano en sus ejes X y Z locales).
local function fillRotatedRect(terrain: Terrain, cf: CFrame, sizeX: number, sizeZ: number, material: Enum.Material)
	local hx, hz = sizeX / 2, sizeZ / 2
	local minX, maxX, minZ, maxZ = math.huge, -math.huge, math.huge, -math.huge
	for _, corner in { Vector3.new(-hx, 0, -hz), Vector3.new(hx, 0, -hz), Vector3.new(-hx, 0, hz), Vector3.new(hx, 0, hz) } do
		local w = cf:PointToWorldSpace(corner)
		minX, maxX = math.min(minX, w.X), math.max(maxX, w.X)
		minZ, maxZ = math.min(minZ, w.Z), math.max(maxZ, w.Z)
	end
	fillShape(terrain, minX, maxX, minZ, maxZ, function(p)
		local l = cf:PointToObjectSpace(Vector3.new(p.X, cf.Position.Y, p.Z))
		return math.abs(l.X) <= hx and math.abs(l.Z) <= hz
	end, material)
end

-- Pasto natural de Roblox: Terrain con material Grass y Decoration (las hojas
-- largas que se mueven con el viento). GrassLength = 1 es el largo maximo.
-- Las hojas solo se dibujan con calidad grafica media o alta.
local function naturalGrass(terrain: Terrain)
	terrain:SetMaterialColor(Enum.Material.Grass, Color3.fromRGB(96, 140, 58))
	pcall(function()
		terrain.Decoration = true
	end)
	pcall(function()
		(terrain :: any).GrassLength = 1
	end)
end

-- Suelo invisible de Verity (solo choca con el grupo Ground): coincide con la
-- superficie del terreno (y = 0).
local function verityFloor(name: string, size: Vector3, cf: CFrame, parent: Instance)
	local p = Build.part({ Name = name, Size = size, CFrame = cf, Transparency = 1, Parent = parent })
	p.CanQuery = false
	Build.markGround(p)
end

local function buildGround(map: Folder)
	local old = workspace:FindFirstChild("Baseplate")
	if old then
		old:Destroy()
	end
	local terrain = workspace.Terrain
	naturalGrass(terrain)
	terrain:SetMaterialColor(Enum.Material.Ground, Color3.fromRGB(118, 98, 70))
	terrain:SetMaterialColor(Enum.Material.Sand, Color3.fromRGB(205, 182, 135))
	terrain:SetMaterialColor(Enum.Material.Rock, Color3.fromRGB(108, 102, 96))
	terrain:SetMaterialColor(Enum.Material.Cobblestone, Color3.fromRGB(130, 120, 105))
	terrain:SetMaterialColor(Enum.Material.Mud, Color3.fromRGB(70, 58, 45))
	terrain:SetMaterialColor(Enum.Material.Snow, Color3.fromRGB(235, 238, 245))
	terrain.WaterColor = Color3.fromRGB(45, 85, 100)
	terrain.WaterTransparency = 0.45
	terrain.WaterWaveSize = 0.12
	terrain.WaterWaveSpeed = 6
	terrain.WaterReflectance = 0.6

	-- pradera de pasto natural (superficie en y = 0)
	local HALF = 550
	terrain:FillBlock(CFrame.new(0, FILL_TOP - 6, 0), Vector3.new(HALF * 2, 12, HALF * 2), Enum.Material.Grass)

	-- rio Onon: lecho y orillas de arena, agua encima
	terrain:FillBlock(CFrame.new(0, FILL_TOP - 2, RIVER_Z), Vector3.new(HALF * 2, 4, RIVER_HALF * 2 + 10), Enum.Material.Sand)
	terrain:FillBlock(CFrame.new(0, FILL_TOP - 3, RIVER_Z), Vector3.new(HALF * 2, 6, RIVER_HALF * 2), Enum.Material.Water)
	local riverSign = Build.part({ Name = "RiverSign", Size = Vector3.new(1, 1, 1), CFrame = CFrame.new(0, 8, RIVER_Z), Transparency = 1, CanCollide = false, Parent = map })
	Build.billboard(riverSign, "Rio Onon", 0, 220).TextColor3 = Color3.fromRGB(180, 220, 255)

	-- donde NO debe salir pasto: plaza empedrada (con sus yurtas), arena bajo los
	-- campamentos, tierra en los caminos y las cuevas, barro en el portal.
	-- Se rellena toda la profundidad (12 studs, superficie en y = 0) con
	-- bloques alineados a la rejilla (ver fillRect): asi ni salen hojas ni el
	-- suelo se levanta sobre los pisos y los botones.
	fillDisc(terrain, Vector3.zero, 50, Enum.Material.Cobblestone)
	for _, cf in plotCenters() do
		fillRotatedRect(terrain, cf, 100, 100, Enum.Material.Sand)
		-- camino de la plaza a la entrada (mismo trazado que las flechas de Tycoon)
		local dir = Vector3.new(cf.Position.X, 0, cf.Position.Z).Unit
		local from = dir * 28
		local to = dir * (Config.PlotRingRadius - 45)
		fillRotatedRect(terrain, CFrame.lookAt((from + to) / 2, to), 10, (to - from).Magnitude, Enum.Material.Ground)
	end
	for i = 0, 3 do
		local angle = math.pi / 4 + i * math.pi / 2
		fillDisc(terrain, Vector3.new(math.cos(angle) * 75, 0, math.sin(angle) * 75), 20, Enum.Material.Ground)
	end
	fillDisc(terrain, World.PortalPosition, 30, Enum.Material.Mud)

	-- horizonte: colinas y montanas nevadas SOLO lejos (nada toca edificios, campamentos ni el portal)
	local rng = Random.new(1206) -- 1206: Temujin es proclamado Gengis Khan
	for _ = 1, 26 do
		local angle = rng:NextNumber(0, math.pi * 2)
		local dist = rng:NextNumber(400, 440)
		local pos = Vector3.new(math.cos(angle) * dist, 0, math.sin(angle) * dist)
		if math.abs(pos.Z - RIVER_Z) > 40 then
			local r = rng:NextNumber(18, 32) -- borde interior >= 368
			terrain:FillBall(pos - Vector3.new(0, r * 0.55, 0), r, Enum.Material.Grass)
		end
	end
	for i = 1, 14 do
		local angle = (i / 14) * math.pi * 2 + rng:NextNumber(-0.15, 0.15)
		local dist = rng:NextNumber(500, 540)
		local pos = Vector3.new(math.cos(angle) * dist, 0, math.sin(angle) * dist)
		local r = rng:NextNumber(70, 100) -- borde interior >= 400
		terrain:FillBall(pos - Vector3.new(0, r * 0.35, 0), r, Enum.Material.Rock)
		terrain:FillBall(pos + Vector3.new(0, r * 0.45, 0), r * 0.3, Enum.Material.Snow)
	end

	-- suelo de Verity: sin cubrir el rio (el agua se cruza nadando)
	local north = RIVER_Z - RIVER_HALF + HALF
	verityFloor("Steppe", Vector3.new(HALF * 2, 2, north), CFrame.new(0, -1, -HALF + north / 2), map)
	local south = HALF - (RIVER_Z + RIVER_HALF)
	verityFloor("SteppeSouth", Vector3.new(HALF * 2, 2, south), CFrame.new(0, -1, HALF - south / 2), map)
end

-- Ovoos (altares de piedras con seda azul), yurtas nomadas,
-- fogata en la plaza y caballos salvajes pastando.
local function buildScenery(map: Folder)
	local scenery = Instance.new("Folder")
	scenery.Name = "Scenery"
	scenery.Parent = map
	local rng = Random.new(1162) -- 1162: nace Temujin
	local plots = plotCenters()

	local function free(pos: Vector3, margin: number): boolean
		if pos.Magnitude < 34 or math.abs(pos.Z - RIVER_Z) < RIVER_HALF + 8 then
			return false
		end
		if (pos - World.PortalPosition).Magnitude < 40 then
			return false
		end
		for _, cf in plots do
			if (pos - cf.Position).Magnitude < 66 + margin then
				return false
			end
		end
		for i = 0, 3 do
			local angle = math.pi / 4 + i * math.pi / 2
			if (pos - Vector3.new(math.cos(angle) * 75, 0, math.sin(angle) * 75)).Magnitude < 22 + margin then
				return false
			end
		end
		return true
	end
	local function randomSpot(minR: number, maxR: number, margin: number): Vector3?
		for _ = 1, 30 do
			local angle = rng:NextNumber(0, math.pi * 2)
			local dist = rng:NextNumber(minR, maxR)
			local pos = Vector3.new(math.cos(angle) * dist, 0, math.sin(angle) * dist)
			if free(pos, margin) then
				return pos
			end
		end
		return nil
	end

	-- ovoos: monton de piedras con un palo y cintas de seda azul (khadag)
	local function ovoo(pos: Vector3)
		local model = Instance.new("Model")
		model.Name = "Ovoo"
		for layer = 0, 3 do
			local r = 6 - layer * 1.4
			for k = 0, 7 - layer do
				local a = k / (8 - layer) * math.pi * 2 + layer
				local s = rng:NextNumber(1.6, 2.6)
				Build.part({ Name = "Stone", Size = Vector3.new(s, s * 0.8, s), CFrame = CFrame.new(pos + Vector3.new(math.cos(a) * r, 0.6 + layer * 1.3, math.sin(a) * r)) * CFrame.Angles(rng:NextNumber(0, 1), rng:NextNumber(0, 6), 0), Color = Color3.fromRGB(120, 115, 108), Material = Enum.Material.Slate, Parent = model })
			end
		end
		Build.part({ Name = "Pole", Size = Vector3.new(0.6, 12, 0.6), CFrame = CFrame.new(pos + Vector3.new(0, 6, 0)), Color = Color3.fromRGB(110, 75, 40), Material = Enum.Material.Wood, Parent = model })
		for k = 0, 5 do
			local a = k / 6 * math.pi * 2
			local ribbon = Build.part({
				Name = "Khadag",
				Size = Vector3.new(0.1, 3, 0.7),
				CFrame = CFrame.new(pos + Vector3.new(math.cos(a) * 1.2, 10, math.sin(a) * 1.2)) * CFrame.Angles(0, -a, math.rad(25)),
				Color = Color3.fromRGB(40, 110, 200),
				Material = Enum.Material.Fabric,
				CanCollide = false,
				Parent = model,
			})
			ribbon.CanQuery = false
		end
		model.Parent = scenery
	end
	ovoo(Vector3.new(235, 0, -70))
	ovoo(Vector3.new(-235, 0, 70))
	ovoo(Vector3.new(120, 0, -235))

	-- yurtas nomadas alrededor de la plaza, con la puerta hacia el estandarte
	for _, angle in { 0, math.pi, -math.pi / 2 } do
		local pos = Vector3.new(math.cos(angle) * 40, 0, math.sin(angle) * 40)
		local yurt = Build.yurt(scenery, CFrame.lookAt(pos, Vector3.zero), 6, 7)
		Build.markSolid(yurt)
	end

	-- fogata de la plaza
	local fireCf = CFrame.new(10, 0, -10)
	for k = 0, 3 do
		Build.part({ Name = "Log", Size = Vector3.new(0.8, 0.8, 4), CFrame = fireCf * CFrame.Angles(0, k * math.pi / 4, 0) * CFrame.new(0, 0.4, 0), Color = Color3.fromRGB(80, 55, 35), Material = Enum.Material.Wood, Parent = scenery })
	end
	local ember = Build.part({ Name = "Embers", Size = Vector3.new(2, 0.6, 2), CFrame = fireCf * CFrame.new(0, 0.6, 0), Color = Color3.fromRGB(255, 120, 40), Material = Enum.Material.Neon, CanCollide = false, Parent = scenery })
	local fire = Instance.new("Fire")
	fire.Size = 6
	fire.Heat = 12
	fire.Parent = ember
	local smoke = Instance.new("Smoke")
	smoke.Opacity = 0.08
	smoke.RiseVelocity = 4
	smoke.Size = 3
	smoke.Parent = ember
	local light = Instance.new("PointLight")
	light.Color = Color3.fromRGB(255, 150, 70)
	light.Range = 22
	light.Brightness = 1.5
	light.Parent = ember

	-- caballos salvajes pastando en grupos
	local coats = { Color3.fromRGB(115, 72, 40), Color3.fromRGB(70, 45, 30), Color3.fromRGB(190, 170, 140), Color3.fromRGB(40, 32, 28) }
	for _, herd in { Vector3.new(220, 0, 165), Vector3.new(-230, 0, -160), Vector3.new(0, 0, 205), Vector3.new(-240, 0, 180) } do
		for k = 1, 3 do
			local pos = herd + Vector3.new(rng:NextNumber(-12, 12), 0, rng:NextNumber(-12, 12))
			Horse.statue(pos, rng:NextNumber(0, math.pi * 2), coats[rng:NextInteger(1, #coats)], scenery)
		end
	end
end

-- Luz de la estepa: atmosfera con bruma, nubes, sol con rayos y un leve grading.
local function buildLighting()
	Lighting.ClockTime = 14.5
	Lighting.Brightness = 3
	Lighting.Ambient = Color3.fromRGB(70, 70, 80)
	Lighting.OutdoorAmbient = Color3.fromRGB(140, 135, 125)
	Lighting.ExposureCompensation = 0.1
	local function ensure(className: string, name: string, parent: Instance): Instance
		local existing = parent:FindFirstChild(name)
		if existing then
			return existing
		end
		local inst = Instance.new(className)
		inst.Name = name
		inst.Parent = parent
		return inst
	end
	local atmosphere = ensure("Atmosphere", "SteppeAtmosphere", Lighting) :: Atmosphere
	atmosphere.Density = 0.3
	atmosphere.Offset = 0.15
	atmosphere.Color = Color3.fromRGB(199, 186, 160)
	atmosphere.Decay = Color3.fromRGB(120, 110, 95)
	atmosphere.Glare = 0.3
	atmosphere.Haze = 1.4
	ensure("Sky", "SteppeSky", Lighting)
	local bloom = ensure("BloomEffect", "SteppeBloom", Lighting) :: BloomEffect
	bloom.Intensity = 0.5
	bloom.Size = 24
	bloom.Threshold = 1.6
	local rays = ensure("SunRaysEffect", "SteppeSunRays", Lighting) :: SunRaysEffect
	rays.Intensity = 0.08
	rays.Spread = 0.8
	local grade = ensure("ColorCorrectionEffect", "SteppeGrade", Lighting) :: ColorCorrectionEffect
	grade.Saturation = 0.12
	grade.Contrast = 0.08
	grade.TintColor = Color3.fromRGB(255, 248, 235)
	local clouds = ensure("Clouds", "SteppeClouds", workspace.Terrain) :: Clouds
	clouds.Cover = 0.55
	clouds.Density = 0.55
end

local function buildCenter(map: Folder)
	local spawn = Instance.new("SpawnLocation")
	spawn.Name = "CentralSpawn"
	spawn.Size = Vector3.new(12, 1, 12)
	spawn.CFrame = CFrame.new(0, 0.5, 20)
	spawn.Anchored = true
	spawn.Neutral = true
	spawn.Duration = 0
	spawn.Color = Color3.fromRGB(170, 30, 30)
	spawn.Material = Enum.Material.Slate
	spawn.Parent = map

	-- Sulde: estandarte de crines del Khan
	Build.part({ Name = "SuldePole", Size = Vector3.new(1, 30, 1), CFrame = CFrame.new(0, 15, 0), Color = Color3.fromRGB(90, 60, 30), Material = Enum.Material.Wood, Parent = map })
	Build.part({
		Name = "SuldeTuft",
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(5, 5, 5),
		CFrame = CFrame.new(0, 28, 0),
		Color = Color3.fromRGB(30, 25, 20),
		Material = Enum.Material.Fabric,
		Parent = map,
	})
	local tip = Build.part({ Name = "SuldeTip", Size = Vector3.new(0.6, 4, 0.6), CFrame = CFrame.new(0, 32, 0), Color = Color3.fromRGB(230, 190, 60), Material = Enum.Material.Metal, Parent = map })
	Build.billboard(tip, "ESTEPA DEL KHAN", 4, 300)
end

-- Cuevas del Chaman: refugio de piedra (muros solidos, Verity no entra)
-- cubierto de rocas para que parezca una cueva en un pedregal. En la entrada:
-- rocas a los lados y encima, cuerda con khadag (panuelos de seda azul de las
-- ofrendas), braseros y un ovoo. Dentro: fogata con circulo de piedras,
-- tambor chamanico, pieles de oveja y telas colgadas.
local function buildCaves(map: Folder)
	local hiding = World.getHidingFolder()
	local rockColors = { Color3.fromRGB(96, 90, 84), Color3.fromRGB(110, 103, 94), Color3.fromRGB(84, 79, 74), Color3.fromRGB(120, 112, 100) }
	local blues = { Color3.fromRGB(60, 130, 220), Color3.fromRGB(90, 160, 235), Color3.fromRGB(235, 240, 250), Color3.fromRGB(45, 105, 200) }
	for i = 0, 3 do
		local angle = math.pi / 4 + i * math.pi / 2
		local pos = Vector3.new(math.cos(angle) * 75, 0, math.sin(angle) * 75)
		-- la puerta (lado -Z local) mira hacia el centro
		local cf = CFrame.lookAt(pos, Vector3.new(0, 0, 0))
		local rng = Random.new(1206 + i)
		local cave = Build.boxShelter(map, cf, 22, 22, 11, Color3.fromRGB(88, 82, 76), Enum.Material.Rock)
		cave.Name = "ShamanCave"

		local function piece(name: string, size: Vector3, offset: CFrame, color: Color3, material: Enum.Material, shape: Enum.PartType?, solid: boolean?): Part
			local p = Build.part({ Name = name, Size = size, CFrame = cf * offset, Color = color, Material = material, Shape = shape, Parent = cave })
			p.CanCollide = solid == true
			p.CanQuery = solid == true
			p.CanTouch = false
			return p
		end
		local function rock(size: Vector3, offset: Vector3, tilt: number)
			local rot = CFrame.Angles(rng:NextNumber(-tilt, tilt), rng:NextNumber(-0.18, 0.18), rng:NextNumber(-tilt, tilt))
			piece("Rock", size, CFrame.new(offset) * rot, rockColors[rng:NextInteger(1, #rockColors)], Enum.Material.Rock, nil, true)
		end

		-- pedregal: rocas sobre el techo, detras y a los lados (sin tapar la puerta
		-- ni salir hacia los caminos de los campamentos)
		for _, rx in { -5.5, 5.5 } do
			for _, rz in { -4.5, 5.5 } do
				local sy = rng:NextNumber(3, 5)
				rock(Vector3.new(rng:NextNumber(8, 10.5), sy, rng:NextNumber(8, 10.5)), Vector3.new(rx, 12.5 + sy / 2 - 0.5, rz), 0.15)
			end
		end
		local crown = rng:NextNumber(4, 6)
		rock(Vector3.new(7, crown, 7), Vector3.new(rng:NextNumber(-2, 2), 15 + crown / 2, rng:NextNumber(-1, 3)), 0.2)
		for _, rx in { -7.5, 0, 7.5 } do
			local sy = rng:NextNumber(9, 13)
			local sz = rng:NextNumber(4, 6)
			rock(Vector3.new(rng:NextNumber(7, 9), sy, sz), Vector3.new(rx, sy / 2 - 0.5, 11.75 + sz / 2 - 0.4), 0.1)
		end
		for _, sx in { -1, 1 } do
			for _, rz in { 1, 8 } do
				local sy = rng:NextNumber(8, 11)
				rock(Vector3.new(2.6, sy, rng:NextNumber(6, 7.5)), Vector3.new(sx * (11.75 + 1.1), sy / 2 - 0.5, rz), 0.08)
			end
		end
		-- entrada: rocas a los lados de la puerta y una losa encima
		for _, sx in { -1, 1 } do
			local sy = rng:NextNumber(11, 12.5)
			rock(Vector3.new(4.4, sy, 3), Vector3.new(sx * 5.6, sy / 2 - 0.5, -12.9), 0.06)
		end
		piece("Lintel", Vector3.new(9, 2.6, 3.4), CFrame.new(0, 12.2, -12.9) * CFrame.Angles(0, 0, math.rad(4)), rockColors[1], Enum.Material.Rock, nil, true)

		-- cuerda con khadag (panuelos de seda) cruzando la entrada
		piece("Rope", Vector3.new(8.4, 0.14, 0.14), CFrame.new(0, 10.6, -14.7), Color3.fromRGB(190, 160, 110), Enum.Material.Fabric)
		for k = 0, 6 do
			local x = -3.3 + k * 1.1
			piece("Khadag", Vector3.new(0.45, 1.6 + (k % 3) * 0.35, 0.06), CFrame.new(x, 9.7 - (k % 3) * 0.17, -14.7) * CFrame.Angles(0, 0, math.rad((k % 2) * 8 - 4)), blues[k % #blues + 1], Enum.Material.Fabric)
		end
		-- braseros a los lados de la entrada
		for _, sx in { -1, 1 } do
			piece("BrazierStand", Vector3.new(0.4, 3, 0.4), CFrame.new(sx * 6, 1.5, -17), Color3.fromRGB(50, 45, 40), Enum.Material.Metal, nil, true)
			local bowl = piece("Brazier", Vector3.new(1.8, 0.8, 1.8), CFrame.new(sx * 6, 3.3, -17), Color3.fromRGB(60, 50, 40), Enum.Material.Metal, nil, true)
			local fire = Instance.new("Fire")
			fire.Size = 3
			fire.Heat = 6
			fire.Parent = bowl
			local light = Instance.new("PointLight")
			light.Color = Color3.fromRGB(255, 150, 70)
			light.Range = 16
			light.Brightness = 1.5
			light.Parent = bowl
		end
		-- ovoo: monton de piedras con un palo y panuelos azules (del lado
		-- contrario al camino de campamento que pasa mas cerca de la cueva)
		local ovooSide = if i % 2 == 0 then 1 else -1
		local ovoo = CFrame.new(ovooSide * 9.5, 0, -18)
		for tier, data in { { 2.2, 6, 0.7 }, { 1.4, 5, 1.6 }, { 0.6, 3, 2.4 } } do
			for k = 0, data[2] - 1 do
				local a = k / data[2] * math.pi * 2 + tier
				piece("OvooStone", Vector3.new(1.3, 1.3, 1.3), ovoo * CFrame.new(math.cos(a) * data[1], data[3], math.sin(a) * data[1]), rockColors[(k + tier) % #rockColors + 1], Enum.Material.Rock, Enum.PartType.Ball)
			end
		end
		piece("OvooPole", Vector3.new(0.3, 5, 0.3), ovoo * CFrame.new(0, 4, 0), Color3.fromRGB(110, 75, 40), Enum.Material.Wood)
		for k = 0, 3 do
			local a = k / 4 * math.pi * 2
			piece("Khadag", Vector3.new(0.06, 2.2, 0.4), ovoo * CFrame.new(math.cos(a) * 0.5, 5.4, math.sin(a) * 0.5) * CFrame.Angles(math.cos(a) * 0.5, 0, math.sin(a) * 0.5), blues[k + 1], Enum.Material.Fabric)
		end

		-- dentro: fogata con circulo de piedras y troncos
		local fire = piece("Fire", Vector3.new(2, 0.6, 2), CFrame.new(0, 0.3, 3), Color3.fromRGB(60, 35, 20), Enum.Material.Wood)
		for k = 0, 9 do
			local a = k / 10 * math.pi * 2
			piece("FireStone", Vector3.new(0.8, 0.6, 0.8), CFrame.new(math.cos(a) * 1.7, 0.3, 3 + math.sin(a) * 1.7), rockColors[k % #rockColors + 1], Enum.Material.Rock, Enum.PartType.Ball)
		end
		for k = 0, 2 do
			piece("Log", Vector3.new(2.2, 0.35, 0.35), CFrame.new(0, 0.5, 3) * CFrame.Angles(0, k * math.pi / 3, 0.25), Color3.fromRGB(90, 58, 30), Enum.Material.Wood, Enum.PartType.Cylinder)
		end
		Instance.new("Fire", fire).Size = 4
		local light = Instance.new("PointLight")
		light.Color = Color3.fromRGB(255, 160, 80)
		light.Range = 18
		light.Parent = fire
		-- tambor chamanico (hengereg) apoyado en la pared, con su maza
		piece("DrumRim", Vector3.new(0.6, 3, 3), CFrame.new(-8.6, 2.6, 7.5) * CFrame.Angles(0, math.rad(55), math.rad(10)), Color3.fromRGB(130, 30, 30), Enum.Material.Wood, Enum.PartType.Cylinder)
		piece("DrumSkin", Vector3.new(0.65, 2.7, 2.7), CFrame.new(-8.6, 2.6, 7.5) * CFrame.Angles(0, math.rad(55), math.rad(10)), Color3.fromRGB(225, 205, 165), Enum.Material.Fabric, Enum.PartType.Cylinder)
		piece("DrumStick", Vector3.new(0.15, 0.15, 1.8), CFrame.new(-7.2, 1.1, 6.2) * CFrame.Angles(0, 0.6, 0), Color3.fromRGB(110, 75, 40), Enum.Material.Wood)
		-- pieles de oveja en el suelo
		piece("Sheepskin", Vector3.new(3.2, 0.12, 2.2), CFrame.new(5.5, 0.08, 4) * CFrame.Angles(0, 0.4, 0), Color3.fromRGB(235, 228, 210), Enum.Material.Fabric)
		piece("Sheepskin", Vector3.new(2.8, 0.12, 2), CFrame.new(-4.5, 0.08, 1) * CFrame.Angles(0, -0.5, 0), Color3.fromRGB(215, 205, 185), Enum.Material.Fabric)
		-- telas azules y blancas colgadas en la pared del fondo
		for k = 0, 4 do
			piece("Hanging", Vector3.new(0.8, 3.2, 0.08), CFrame.new(-4 + k * 2, 7, 10.1), blues[k % #blues + 1], Enum.Material.Fabric)
		end
		piece("HangingRod", Vector3.new(10, 0.2, 0.2), CFrame.new(0, 8.7, 10.05), Color3.fromRGB(110, 75, 40), Enum.Material.Wood)

		Build.markSolid(cave)
		Build.hidingZone(hiding, cf * CFrame.new(0, 5, 0), Vector3.new(19, 10, 19), nil)
		local sign = Build.part({ Name = "Sign", Size = Vector3.new(1, 1, 1), CFrame = cf * CFrame.new(0, 21, -11), Transparency = 1, CanCollide = false, Parent = cave })
		sign.CanQuery = false
		Build.billboard(sign, "Cueva del Chaman (refugio)", 0, 260)
	end
end

local function buildPortal(map: Folder)
	local base = World.PortalPosition
	for i = 0, 9 do
		local angle = i / 10 * math.pi * 2
		local h = 8 + (i % 3) * 3
		Build.part({
			Name = "PortalStone",
			Size = Vector3.new(2.5, h, 2.5),
			CFrame = CFrame.new(base + Vector3.new(math.cos(angle) * 16, h / 2, math.sin(angle) * 16)) * CFrame.Angles(0, angle, math.rad(6)),
			Color = Color3.fromRGB(20, 20, 24),
			Material = Enum.Material.Basalt,
			Parent = map,
		})
	end
	local core = Build.part({
		Name = "PortalCore",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(0.4, 26, 26),
		CFrame = CFrame.new(base + Vector3.new(0, 0.2, 0)) * CFrame.Angles(0, 0, math.pi / 2),
		Color = Color3.fromRGB(10, 0, 0),
		Material = Enum.Material.Neon,
		CanCollide = false,
		Parent = map,
	})
	core.Transparency = 0.2
	local sign = Build.part({ Name = "PortalSign", Size = Vector3.new(1, 1, 1), CFrame = CFrame.new(base + Vector3.new(0, 18, 0)), Transparency = 1, CanCollide = false, Parent = map })
	Build.billboard(sign, "Aqui despierta Verity", 0, 260).TextColor3 = Color3.fromRGB(255, 80, 80)
end

-- Campo de la batalla final: llanura aparte, lejos del mapa principal, con
-- piedras, braseros y paredes invisibles en el borde (para no caerse a caballo).
local function buildArena(map: Folder)
	local F = Config.FinalBattle
	local center = F.Arena
	local half = F.ArenaHalfSize
	local arena = Instance.new("Folder")
	arena.Name = "FinalArena"
	arena.Parent = map
	-- campo de batalla: pasto natural con manchas de tierra pisoteada
	local terrain = workspace.Terrain
	terrain:FillBlock(CFrame.new(center + Vector3.new(0, FILL_TOP - 6, 0)), Vector3.new(half * 2 + 120, 12, half * 2 + 120), Enum.Material.Grass)
	local arenaRng = Random.new(1227) -- 1227: muere Gengis Khan
	for _ = 1, 30 do
		local p = center + Vector3.new(arenaRng:NextNumber(-half + 30, half - 30), 0, arenaRng:NextNumber(-half + 30, half - 30))
		fillDisc(terrain, p, arenaRng:NextNumber(10, 26), Enum.Material.Ground)
	end
	verityFloor("ArenaGround", Vector3.new(half * 2 + 20, 2, half * 2 + 20), CFrame.new(center + Vector3.new(0, -1, 0)), arena)
	for i = 0, 3 do
		local angle = i * math.pi / 2
		local dir = Vector3.new(math.cos(angle), 0, math.sin(angle))
		local edge = Build.part({
			Name = "ArenaEdge",
			Size = Vector3.new(half * 2 + 20, 60, 4),
			CFrame = CFrame.lookAt(center + dir * (half + 8) + Vector3.new(0, 30, 0), center + Vector3.new(0, 30, 0)),
			Transparency = 1,
			Parent = arena,
		})
		edge.CanQuery = false
	end
	-- anillo de piedras y braseros
	for i = 0, 15 do
		local angle = i / 16 * math.pi * 2
		local pos = center + Vector3.new(math.cos(angle), 0, math.sin(angle)) * (half - 30)
		local h = 14 + (i % 3) * 6
		Build.part({ Name = "Stone", Size = Vector3.new(5, h, 5), CFrame = CFrame.new(pos + Vector3.new(0, h / 2, 0)) * CFrame.Angles(0, angle, math.rad(5)), Color = Color3.fromRGB(40, 38, 40), Material = Enum.Material.Basalt, Parent = arena })
		if i % 2 == 0 then
			local brazier = Build.part({ Name = "Brazier", Size = Vector3.new(4, 3, 4), CFrame = CFrame.new(pos + Vector3.new(0, 1.5, 0) - (pos - center).Unit * 10), Color = Color3.fromRGB(60, 40, 25), Material = Enum.Material.Metal, Parent = arena })
			local fire = Instance.new("Fire")
			fire.Size = 8
			fire.Parent = brazier
			local light = Instance.new("PointLight")
			light.Color = Color3.fromRGB(255, 140, 60)
			light.Range = 40
			light.Brightness = 2
			light.Parent = brazier
		end
	end
	local sign = Build.part({ Name = "ArenaSign", Size = Vector3.new(1, 1, 1), CFrame = CFrame.new(center + Vector3.new(0, 70, 0)), Transparency = 1, CanCollide = false, Parent = arena })
	Build.billboard(sign, "CAMPO DE LA BATALLA FINAL", 0, 500).TextColor3 = Color3.fromRGB(255, 120, 60)
end

function World.init()
	local map = World.getMapFolder()
	buildGround(map)
	buildCenter(map)
	buildCaves(map)
	buildPortal(map)
	buildArena(map)
	buildScenery(map)
	buildLighting()

end

return World
