--!strict
-- Figuras decorativas hechas con piezas para los corrales de los droppers:
-- oveja, cabra, caballo, camello (con o sin fardos de seda), yak, halcones y
-- el cofre del tesoro. Todas son ancladas y sin colision (no estorban).
-- Espacio de cada figura: origen en el suelo, mira hacia +X.
local Build = require(script.Parent.Build)
local Horse = require(script.Parent.Horse)

local Props = {}

local function add(model: Model, base: CFrame, name: string, size: Vector3, offset: CFrame, color: Color3, material: Enum.Material?, shape: Enum.PartType?): Part
	local p = Build.part({
		Name = name,
		Size = size,
		CFrame = base * offset,
		Color = color,
		Material = material or Enum.Material.SmoothPlastic,
		Shape = shape,
		CanCollide = false,
		Parent = model,
	})
	p.CanQuery = false
	p.CanTouch = false
	p.CastShadow = size.Magnitude > 1.2
	return p
end

local function at(x: number, y: number, z: number): CFrame
	return CFrame.new(x, y, z)
end

local function legs(model: Model, base: CFrame, halfX: number, halfZ: number, height: number, thick: number, color: Color3)
	for _, x in { -halfX, halfX } do
		for _, z in { -halfZ, halfZ } do
			add(model, base, "Leg", Vector3.new(thick, height, thick), at(x, height / 2, z), color)
		end
	end
end

function Props.sheep(model: Model, base: CFrame)
	local wool = Color3.fromRGB(240, 237, 226)
	local face = Color3.fromRGB(45, 40, 36)
	legs(model, base, 0.5, 0.28, 0.85, 0.26, face)
	for _, spec in { { -0.45, 1.35, 0, 1.3 }, { 0.4, 1.35, 0, 1.3 }, { 0, 1.6, 0, 1.4 }, { -0.1, 1.3, 0.3, 1.1 }, { -0.1, 1.3, -0.3, 1.1 } } do
		add(model, base, "Wool", Vector3.new(spec[4], spec[4], spec[4]), at(spec[1], spec[2], spec[3]), wool, Enum.Material.Fabric, Enum.PartType.Ball)
	end
	add(model, base, "Head", Vector3.new(0.6, 0.55, 0.45), at(1.1, 1.55, 0), face)
	add(model, base, "WoolCap", Vector3.new(0.55, 0.55, 0.55), at(0.95, 1.85, 0), wool, Enum.Material.Fabric, Enum.PartType.Ball)
	for _, z in { -0.32, 0.32 } do
		add(model, base, "Ear", Vector3.new(0.14, 0.1, 0.35), at(0.95, 1.65, z), face)
	end
	add(model, base, "Tail", Vector3.new(0.35, 0.35, 0.35), at(-1.05, 1.45, 0), wool, Enum.Material.Fabric, Enum.PartType.Ball)
end

function Props.goat(model: Model, base: CFrame)
	local coat = Color3.fromRGB(150, 112, 75)
	local dark = Color3.fromRGB(60, 45, 32)
	legs(model, base, 0.55, 0.22, 0.9, 0.22, dark)
	add(model, base, "Body", Vector3.new(1.6, 0.75, 0.7), at(0, 1.25, 0), coat, Enum.Material.Fabric)
	add(model, base, "Belly", Vector3.new(1.2, 0.2, 0.6), at(0, 0.85, 0), Color3.fromRGB(225, 215, 195), Enum.Material.Fabric)
	add(model, base, "Neck", Vector3.new(0.32, 0.7, 0.32), at(0.75, 1.7, 0) * CFrame.Angles(0, 0, -0.45), coat, Enum.Material.Fabric)
	add(model, base, "Head", Vector3.new(0.6, 0.38, 0.34), at(1.1, 2.0, 0) * CFrame.Angles(0, 0, -0.35), coat, Enum.Material.Fabric)
	add(model, base, "Beard", Vector3.new(0.1, 0.32, 0.1), at(1.3, 1.7, 0), dark)
	for _, z in { -0.12, 0.12 } do
		add(model, base, "Horn", Vector3.new(0.11, 0.6, 0.11), at(0.85, 2.35, z) * CFrame.Angles(0, 0, 0.75), Color3.fromRGB(80, 70, 60))
		add(model, base, "Ear", Vector3.new(0.3, 0.08, 0.14), at(0.9, 2.05, z * 2.6), coat, Enum.Material.Fabric)
	end
	add(model, base, "Tail", Vector3.new(0.1, 0.3, 0.1), at(-0.85, 1.7, 0) * CFrame.Angles(0, 0, 0.5), dark)
end

-- Caballo: el mismo de la estepa (Lib/Horse), sin montura.
function Props.horse(model: Model, base: CFrame, coat: Color3)
	local forward = base.RightVector
	local yaw = math.atan2(-forward.X, -forward.Z)
	Horse.statue(base.Position, yaw, coat, model)
end

-- Camello bactriano (dos jorobas). Con bales = true lleva fardos de seda.
function Props.camel(model: Model, base: CFrame, bales: boolean)
	local coat = Color3.fromRGB(185, 145, 92)
	local dark = Color3.fromRGB(120, 88, 55)
	legs(model, base, 0.85, 0.32, 2.0, 0.34, coat)
	add(model, base, "Body", Vector3.new(2.4, 1.0, 1.0), at(0, 2.45, 0), coat, Enum.Material.Fabric)
	for _, x in { -0.5, 0.45 } do
		add(model, base, "Hump", Vector3.new(0.95, 0.95, 0.95), at(x, 3.05, 0), dark, Enum.Material.Fabric, Enum.PartType.Ball)
	end
	add(model, base, "Neck", Vector3.new(0.42, 1.5, 0.42), at(1.45, 3.0, 0) * CFrame.Angles(0, 0, -0.55), coat, Enum.Material.Fabric)
	add(model, base, "NeckHair", Vector3.new(0.5, 0.9, 0.5), at(1.3, 2.75, 0) * CFrame.Angles(0, 0, -0.55), dark, Enum.Material.Fabric)
	add(model, base, "Head", Vector3.new(0.95, 0.45, 0.45), at(2.0, 3.65, 0), coat, Enum.Material.Fabric)
	add(model, base, "Tail", Vector3.new(0.12, 0.7, 0.12), at(-1.25, 2.3, 0), dark)
	if bales then
		add(model, base, "Saddle", Vector3.new(1.4, 0.15, 1.3), at(0, 2.98, 0), Color3.fromRGB(150, 30, 35), Enum.Material.Fabric)
		for _, z in { -0.75, 0.75 } do
			add(model, base, "SilkBale", Vector3.new(0.9, 0.8, 0.5), at(0, 2.55, z), Color3.fromRGB(170, 35, 50), Enum.Material.Fabric)
			add(model, base, "BaleBand", Vector3.new(0.12, 0.84, 0.54), at(0, 2.55, z), Color3.fromRGB(230, 185, 60), Enum.Material.Fabric)
		end
		add(model, base, "Rope", Vector3.new(0.06, 0.06, 2.0), at(2.2, 3.4, 0) * CFrame.Angles(0.5, 0.6, 0), Color3.fromRGB(190, 160, 110), Enum.Material.Fabric)
	end
end

function Props.yak(model: Model, base: CFrame)
	local coat = Color3.fromRGB(38, 30, 26)
	local hair = Color3.fromRGB(55, 44, 38)
	local horn = Color3.fromRGB(235, 228, 210)
	legs(model, base, 0.75, 0.38, 1.1, 0.38, coat)
	add(model, base, "Body", Vector3.new(2.2, 1.35, 1.2), at(0, 1.95, 0), coat, Enum.Material.Fabric)
	add(model, base, "Skirt", Vector3.new(2.3, 0.65, 1.32), at(0, 1.3, 0), hair, Enum.Material.Fabric)
	add(model, base, "Hump", Vector3.new(1.0, 1.0, 1.0), at(0.55, 2.6, 0), coat, Enum.Material.Fabric, Enum.PartType.Ball)
	add(model, base, "Head", Vector3.new(0.75, 0.65, 0.65), at(1.35, 1.9, 0), coat, Enum.Material.Fabric)
	add(model, base, "Muzzle", Vector3.new(0.3, 0.4, 0.45), at(1.75, 1.75, 0), Color3.fromRGB(70, 60, 55))
	for _, side in { -1, 1 } do
		add(model, base, "Horn", Vector3.new(0.14, 0.14, 0.55), at(1.35, 2.25, side * 0.45) * CFrame.Angles(side * 0.6, 0, 0), horn)
		add(model, base, "HornTip", Vector3.new(0.12, 0.45, 0.12), at(1.35, 2.55, side * 0.62) * CFrame.Angles(side * -0.3, 0, 0), horn)
	end
	add(model, base, "Tail", Vector3.new(0.18, 0.9, 0.18), at(-1.15, 1.75, 0) * CFrame.Angles(0, 0, 0.2), hair, Enum.Material.Fabric)
end

-- Halcon sobre una percha (los mongoles cazaban con halcones y aguilas).
function Props.falcon(model: Model, base: CFrame, spread: boolean)
	local wood = Color3.fromRGB(105, 70, 40)
	local brown = Color3.fromRGB(110, 75, 45)
	local light = Color3.fromRGB(215, 195, 160)
	add(model, base, "Perch", Vector3.new(0.3, 2.4, 0.3), at(0, 1.2, 0), wood, Enum.Material.Wood)
	add(model, base, "PerchBar", Vector3.new(0.25, 0.25, 1.3), at(0, 2.4, 0), wood, Enum.Material.Wood)
	add(model, base, "Body", Vector3.new(0.45, 0.75, 0.42), at(0, 2.9, 0) * CFrame.Angles(0, 0, 0.18), brown, Enum.Material.Fabric)
	add(model, base, "Chest", Vector3.new(0.12, 0.5, 0.34), at(0.2, 2.9, 0) * CFrame.Angles(0, 0, 0.18), light, Enum.Material.Fabric)
	add(model, base, "Head", Vector3.new(0.38, 0.38, 0.38), at(0.1, 3.38, 0), brown, Enum.Material.Fabric, Enum.PartType.Ball)
	add(model, base, "Beak", Vector3.new(0.18, 0.1, 0.1), at(0.32, 3.33, 0), Color3.fromRGB(240, 190, 50))
	add(model, base, "Tail", Vector3.new(0.12, 0.45, 0.28), at(-0.18, 2.45, 0) * CFrame.Angles(0, 0, 0.35), Color3.fromRGB(70, 48, 30), Enum.Material.Fabric)
	for _, side in { -1, 1 } do
		if spread then
			add(model, base, "Wing", Vector3.new(0.5, 0.08, 1.2), at(-0.05, 3.15, side * 0.75) * CFrame.Angles(side * -0.35, 0, 0), Color3.fromRGB(80, 55, 35), Enum.Material.Fabric)
		else
			add(model, base, "Wing", Vector3.new(0.25, 0.65, 0.08), at(-0.05, 2.9, side * 0.24) * CFrame.Angles(0, 0, 0.25), Color3.fromRGB(80, 55, 35), Enum.Material.Fabric)
		end
	end
end

-- Cofre abierto rebosando oro, monedas y gemas (Tesoro de Karakorum).
function Props.treasure(model: Model, base: CFrame)
	local wood = Color3.fromRGB(100, 62, 32)
	local gold = Color3.fromRGB(255, 200, 60)
	add(model, base, "Chest", Vector3.new(2.2, 1.1, 1.3), at(0, 0.55, 0), wood, Enum.Material.WoodPlanks)
	for _, y in { 0.15, 0.95 } do
		add(model, base, "Trim", Vector3.new(2.26, 0.14, 1.36), at(0, y, 0), gold, Enum.Material.Metal)
	end
	for _, x in { -0.9, 0.9 } do
		add(model, base, "Corner", Vector3.new(0.14, 1.12, 1.36), at(x, 0.55, 0), gold, Enum.Material.Metal)
	end
	-- tapa abierta hacia atras
	add(model, base, "Lid", Vector3.new(2.2, 0.4, 1.3), at(0, 1.1, -0.65) * CFrame.Angles(-1.15, 0, 0) * at(0, 0.2, 0.65), wood, Enum.Material.WoodPlanks)
	local pile = add(model, base, "GoldPile", Vector3.new(1.9, 0.6, 1.1), at(0, 1.15, 0), gold, Enum.Material.Metal)
	pile.Reflectance = 0.3
	for i = 1, 9 do
		local a = i * 2.4
		local coin = add(model, base, "Coin", Vector3.new(0.08, 0.45, 0.45), at(math.cos(a) * (1.3 + (i % 3) * 0.25), 0.05, math.sin(a) * (0.9 + (i % 2) * 0.3)) * CFrame.Angles(0, 0, math.pi / 2), gold, Enum.Material.Metal, Enum.PartType.Cylinder)
		coin.Reflectance = 0.3
	end
	local gems = { Color3.fromRGB(220, 30, 40), Color3.fromRGB(40, 110, 255), Color3.fromRGB(40, 200, 90) }
	for i, color in gems do
		add(model, base, "Gem", Vector3.new(0.3, 0.3, 0.3), at(-0.6 + i * 0.35, 1.5, (i - 2) * 0.25), color, Enum.Material.Neon, Enum.PartType.Ball)
	end
	for i = 0, 1 do
		add(model, base, "GoldBar", Vector3.new(0.7, 0.25, 0.32), at(1.6, 0.13 + i * 0.25, 0.4 - i * 0.1) * CFrame.Angles(0, i * 0.4, 0), gold, Enum.Material.Metal)
	end
end

return Props
