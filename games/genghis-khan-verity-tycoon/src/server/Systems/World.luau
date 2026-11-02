--!strict
-- Construye la estepa: suelo, spawn central, estandarte del Khan,
-- cuevas del chaman (refugios publicos) y el portal por donde llega Verity.
local Lighting = game:GetService("Lighting")

local Build = require(script.Parent.Parent.Lib.Build)

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

local function buildGround(map: Folder)
	local old = workspace:FindFirstChild("Baseplate")
	if old then
		old:Destroy()
	end
	Build.markGround(Build.part({
		Name = "Steppe",
		Size = Vector3.new(640, 2, 640),
		CFrame = CFrame.new(0, -1, 0),
		Color = Color3.fromRGB(124, 140, 72),
		Material = Enum.Material.Grass,
		Parent = map,
	}))
	-- colinas de fondo
	local rng = Random.new(1206) -- 1206: Temujin es proclamado Gengis Khan
	for _ = 1, 24 do
		local angle = rng:NextNumber(0, math.pi * 2)
		local dist = rng:NextNumber(280, 310)
		local size = rng:NextNumber(30, 70)
		Build.part({
			Name = "Hill",
			Shape = Enum.PartType.Ball,
			Size = Vector3.new(size, size, size),
			CFrame = CFrame.new(math.cos(angle) * dist, -size * 0.25, math.sin(angle) * dist),
			Color = Color3.fromRGB(104, 120, 62),
			Material = Enum.Material.Grass,
			Parent = map,
		})
	end
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

function World.init()
	local map = World.getMapFolder()
	buildGround(map)
	buildCenter(map)
	buildCaves(map)
	buildPortal(map)

	Lighting.ClockTime = 15
	Lighting.Brightness = 2
	Lighting.FogColor = Color3.fromRGB(200, 210, 220)
	Lighting.FogEnd = 1500
end

return World
