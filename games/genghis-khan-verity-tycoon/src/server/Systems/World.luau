--!strict
-- Construye la estepa: suelo, spawn central, estandarte del Khan,
-- cuevas del chaman (refugios publicos) y el portal por donde llega Verity.
local Lighting = game:GetService("Lighting")
local ServerStorage = game:GetService("ServerStorage")

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
-- El suelo es una placa base de pasto (como la "Grass Baseplate" de Roblox)
-- con matas de pasto 3D encima. La placa es tambien el suelo de Verity
-- (grupo Ground). El terreno de Roblox solo se usa para el rio y para las
-- colinas y montanas del horizonte, lejos de todo edificio.

local RIVER_Z = 239 -- el rio Onon cruza el sur del mapa
local RIVER_HALF = 7
local GRASS = Color3.fromRGB(88, 140, 62)

local function plotCenters(): { CFrame }
	local list = {}
	for i = 1, Config.PlotCount do
		local angle = (i - 1) / Config.PlotCount * math.pi * 2
		local pos = Vector3.new(math.cos(angle) * Config.PlotRingRadius, 0, math.sin(angle) * Config.PlotRingRadius)
		table.insert(list, CFrame.lookAt(pos, Vector3.zero))
	end
	return list
end

local function buildGround(map: Folder)
	local old = workspace:FindFirstChild("Baseplate")
	if old then
		old:Destroy()
	end
	local terrain = workspace.Terrain
	terrain:SetMaterialColor(Enum.Material.Grass, Color3.fromRGB(96, 138, 60))
	terrain:SetMaterialColor(Enum.Material.Rock, Color3.fromRGB(108, 102, 96))
	terrain:SetMaterialColor(Enum.Material.Snow, Color3.fromRGB(235, 238, 245))
	terrain:SetMaterialColor(Enum.Material.Sand, Color3.fromRGB(205, 182, 135))
	terrain.WaterColor = Color3.fromRGB(45, 85, 100)
	terrain.WaterTransparency = 0.45
	terrain.WaterWaveSize = 0.12
	terrain.WaterWaveSpeed = 6
	terrain.WaterReflectance = 0.6

	-- placa base de pasto (como la "Grass Baseplate" de Roblox), partida por el rio.
	-- Tambien es el suelo de Verity (grupo Ground).
	local HALF = 550
	local function plate(name: string, zFrom: number, zTo: number)
		local p = Build.part({
			Name = name,
			Size = Vector3.new(HALF * 2, 2, zTo - zFrom),
			CFrame = CFrame.new(0, -1, (zFrom + zTo) / 2),
			Color = GRASS,
			Material = Enum.Material.Grass,
			Parent = map,
		})
		p.CanQuery = false
		Build.markGround(p)
	end
	plate("Steppe", -HALF, RIVER_Z - RIVER_HALF)
	plate("SteppeSouth", RIVER_Z + RIVER_HALF, HALF)

	-- rio Onon: agua de terreno en el hueco entre las placas, con lecho y orillas de arena
	terrain:FillBlock(CFrame.new(0, -9, RIVER_Z), Vector3.new(HALF * 2, 6, RIVER_HALF * 2 + 4), Enum.Material.Sand)
	terrain:FillBlock(CFrame.new(0, -3, RIVER_Z), Vector3.new(HALF * 2, 6, RIVER_HALF * 2), Enum.Material.Water)
	for _, side in { -1, 1 } do
		Build.part({
			Name = "RiverBank",
			Size = Vector3.new(HALF * 2, 0.3, 4),
			CFrame = CFrame.new(0, 0.1, RIVER_Z + side * (RIVER_HALF + 2)),
			Color = Color3.fromRGB(205, 182, 135),
			Material = Enum.Material.Sand,
			Parent = map,
		}).CanCollide = false
	end
	local riverSign = Build.part({ Name = "RiverSign", Size = Vector3.new(1, 1, 1), CFrame = CFrame.new(0, 8, RIVER_Z), Transparency = 1, CanCollide = false, Parent = map })
	Build.billboard(riverSign, "Rio Onon", 0, 220).TextColor3 = Color3.fromRGB(180, 220, 255)

	-- suelos especiales: plaza empedrada, tierra en las cuevas y barro en el portal
	local function disc(name: string, center: Vector3, radius: number, color: Color3, material: Enum.Material)
		local d = Build.part({
			Name = name,
			Shape = Enum.PartType.Cylinder,
			Size = Vector3.new(0.2, radius * 2, radius * 2),
			CFrame = CFrame.new(center + Vector3.new(0, 0.05, 0)) * CFrame.Angles(0, 0, math.pi / 2),
			Color = color,
			Material = material,
			CanCollide = false,
			Parent = map,
		})
		d.CanQuery = false
	end
	disc("Plaza", Vector3.zero, 28, Color3.fromRGB(130, 120, 105), Enum.Material.Cobblestone)
	for i = 0, 3 do
		local angle = math.pi / 4 + i * math.pi / 2
		disc("CaveGround", Vector3.new(math.cos(angle) * 75, 0, math.sin(angle) * 75), 18, Color3.fromRGB(112, 96, 72), Enum.Material.Ground)
	end
	disc("PortalMud", World.PortalPosition, 26, Color3.fromRGB(70, 58, 45), Enum.Material.Mud)

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
end

-- Pasto 3D: matas de 3 a 5 hojas finas e inclinadas. Si pones un modelo de
-- pasto de la Toolbox en ServerStorage.GrassTuft, se usa ese en su lugar.
local function grassTuft(parent: Instance, pos: Vector3, rng: Random)
	local custom = ServerStorage:FindFirstChild("GrassTuft")
	if custom and (custom:IsA("Model") or custom:IsA("BasePart")) then
		local clone = custom:Clone()
		for _, inst in clone:GetDescendants() do
			if inst:IsA("BasePart") then
				inst.Anchored = true
				inst.CanCollide = false
			end
		end
		if clone:IsA("BasePart") then
			clone.Anchored = true
			clone.CanCollide = false
		end
		clone:PivotTo(CFrame.new(pos) * CFrame.Angles(0, rng:NextNumber(0, math.pi * 2), 0))
		clone.Parent = parent
		return
	end
	local shades = { Color3.fromRGB(82, 130, 50), Color3.fromRGB(104, 146, 58), Color3.fromRGB(70, 112, 44), Color3.fromRGB(132, 150, 70) }
	for _ = 1, rng:NextInteger(3, 5) do
		local h = rng:NextNumber(1.2, 2.6)
		local blade = Build.part({
			Name = "Blade",
			Size = Vector3.new(0.12, h, 0.45),
			CFrame = CFrame.new(pos + Vector3.new(rng:NextNumber(-0.5, 0.5), 0, rng:NextNumber(-0.5, 0.5)))
				* CFrame.Angles(0, rng:NextNumber(0, math.pi * 2), 0)
				* CFrame.Angles(rng:NextNumber(-0.35, 0.35), 0, rng:NextNumber(-0.35, 0.35))
				* CFrame.new(0, h / 2, 0),
			Color = shades[rng:NextInteger(1, #shades)],
			Material = Enum.Material.SmoothPlastic,
			CanCollide = false,
			Parent = parent,
		})
		blade.CanQuery = false
		blade.CanTouch = false
		blade.CastShadow = false
	end
end

-- Arbustos, pasto 3D, ovoos (altares de piedras con seda azul), yurtas nomadas,
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

	-- arbustos de la estepa
	local bushColors = { Color3.fromRGB(88, 104, 48), Color3.fromRGB(104, 112, 56), Color3.fromRGB(76, 90, 44), Color3.fromRGB(120, 112, 64) }
	for _ = 1, 140 do
		local pos = randomSpot(40, 300, 0)
		if pos then
			local size = rng:NextNumber(2, 4.5)
			local bush = Build.part({
				Name = "Bush",
				Shape = Enum.PartType.Ball,
				Size = Vector3.new(size * 1.3, size, size * 1.3),
				CFrame = CFrame.new(pos + Vector3.new(0, size * 0.3, 0)),
				Color = bushColors[rng:NextInteger(1, #bushColors)],
				Material = Enum.Material.Grass,
				CanCollide = false,
				Parent = scenery,
			})
			bush.CastShadow = true
			bush.CanQuery = false
		end
	end
	-- pasto 3D por toda la estepa (lejos de edificios)
	local grass = Instance.new("Folder")
	grass.Name = "Grass3D"
	grass.Parent = scenery
	for _ = 1, 650 do
		local pos = randomSpot(32, 340, 2)
		if pos then
			grassTuft(grass, pos, rng)
		end
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
	-- campo de batalla: tierra pisoteada con manchas de pasto
	local ground = Build.part({
		Name = "ArenaGround",
		Size = Vector3.new(half * 2 + 20, 2, half * 2 + 20),
		CFrame = CFrame.new(center + Vector3.new(0, -1, 0)),
		Color = Color3.fromRGB(105, 90, 66),
		Material = Enum.Material.Ground,
		Parent = arena,
	})
	ground.CanQuery = false
	Build.markGround(ground)
	local arenaRng = Random.new(1227) -- 1227: muere Gengis Khan
	for _ = 1, 40 do
		local p = center + Vector3.new(arenaRng:NextNumber(-half + 30, half - 30), 0, arenaRng:NextNumber(-half + 30, half - 30))
		local r = arenaRng:NextNumber(12, 30)
		local patch = Build.part({
			Name = "GrassPatch",
			Shape = Enum.PartType.Cylinder,
			Size = Vector3.new(0.2, r * 2, r * 2),
			CFrame = CFrame.new(p + Vector3.new(0, 0.05, 0)) * CFrame.Angles(0, 0, math.pi / 2),
			Color = GRASS,
			Material = Enum.Material.Grass,
			CanCollide = false,
			Parent = arena,
		})
		patch.CanQuery = false
	end
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
