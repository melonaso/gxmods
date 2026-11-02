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
	terrain:FillBlock(CFrame.new(0, -6, 0), Vector3.new(HALF * 2, 12, HALF * 2), Enum.Material.Grass)

	-- rio Onon: lecho y orillas de arena, agua encima
	terrain:FillBlock(CFrame.new(0, -2, RIVER_Z), Vector3.new(HALF * 2, 4, RIVER_HALF * 2 + 10), Enum.Material.Sand)
	terrain:FillBlock(CFrame.new(0, -3, RIVER_Z), Vector3.new(HALF * 2, 6, RIVER_HALF * 2), Enum.Material.Water)
	local riverSign = Build.part({ Name = "RiverSign", Size = Vector3.new(1, 1, 1), CFrame = CFrame.new(0, 8, RIVER_Z), Transparency = 1, CanCollide = false, Parent = map })
	Build.billboard(riverSign, "Rio Onon", 0, 220).TextColor3 = Color3.fromRGB(180, 220, 255)

	-- donde NO debe salir pasto: plaza empedrada (con sus yurtas), arena bajo los
	-- campamentos, tierra en los caminos y las cuevas, barro en el portal.
	-- Se rellena TODA la profundidad del terreno (12 studs): el terreno va en
	-- bloques de 4 studs y una capa fina no reemplaza el pasto, cuyas hojas
	-- largas atravesarian los suelos y los botones.
	terrain:FillCylinder(CFrame.new(0, -6, 0), 12, 50, Enum.Material.Cobblestone)
	for _, cf in plotCenters() do
		terrain:FillBlock(cf * CFrame.new(0, -6, 0), Vector3.new(100, 12, 100), Enum.Material.Sand)
		-- camino de la plaza a la entrada (mismo trazado que las flechas de Tycoon)
		local dir = Vector3.new(cf.Position.X, 0, cf.Position.Z).Unit
		local from = dir * 28
		local to = dir * (Config.PlotRingRadius - 45)
		terrain:FillBlock(CFrame.lookAt((from + to) / 2, to) * CFrame.new(0, -6, 0), Vector3.new(10, 12, (to - from).Magnitude), Enum.Material.Ground)
	end
	for i = 0, 3 do
		local angle = math.pi / 4 + i * math.pi / 2
		terrain:FillCylinder(CFrame.new(math.cos(angle) * 75, -6, math.sin(angle) * 75), 12, 20, Enum.Material.Ground)
	end
	terrain:FillCylinder(CFrame.new(World.PortalPosition + Vector3.new(0, -6, 0)), 12, 30, Enum.Material.Mud)

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

local function buildCaves(map: Folder)
	local hiding = World.getHidingFolder()
	for i = 0, 3 do
		local angle = math.pi / 4 + i * math.pi / 2
		local pos = Vector3.new(math.cos(angle) * 75, 0, math.sin(angle) * 75)
		-- la puerta (lado -Z local) mira hacia el centro
		local cf = CFrame.lookAt(pos, Vector3.new(0, 0, 0))
		local cave = Build.boxShelter(map, cf, 22, 22, 11, Color3.fromRGB(95, 90, 85), Enum.Material.Slate)
		cave.Name = "ShamanCave"
		Build.markSolid(cave)
		Build.hidingZone(hiding, cf * CFrame.new(0, 5, 0), Vector3.new(19, 10, 19), nil)
		local sign = Build.part({ Name = "Sign", Size = Vector3.new(1, 1, 1), CFrame = cf * CFrame.new(0, 14, -11), Transparency = 1, CanCollide = false, Parent = cave })
		Build.billboard(sign, "Cueva del Chaman (refugio)", 0, 260)
		-- fogata adentro
		local fire = Build.part({ Name = "Fire", Size = Vector3.new(2, 1, 2), CFrame = cf * CFrame.new(0, 0.5, 4), Color = Color3.fromRGB(80, 50, 30), Material = Enum.Material.Wood, Parent = cave })
		Instance.new("Fire", fire).Size = 4
		local light = Instance.new("PointLight")
		light.Color = Color3.fromRGB(255, 160, 80)
		light.Range = 18
		light.Parent = fire
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
	terrain:FillBlock(CFrame.new(center + Vector3.new(0, -6, 0)), Vector3.new(half * 2 + 120, 12, half * 2 + 120), Enum.Material.Grass)
	local arenaRng = Random.new(1227) -- 1227: muere Gengis Khan
	for _ = 1, 30 do
		local p = center + Vector3.new(arenaRng:NextNumber(-half + 30, half - 30), 0, arenaRng:NextNumber(-half + 30, half - 30))
		terrain:FillCylinder(CFrame.new(p + Vector3.new(0, -6, 0)), 12, arenaRng:NextNumber(10, 26), Enum.Material.Ground)
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
