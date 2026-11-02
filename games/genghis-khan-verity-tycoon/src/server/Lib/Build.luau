--!strict
-- Ayudas para construir el mapa con Parts (sin assets externos).
local PhysicsService = game:GetService("PhysicsService")

local Build = {}

-- Verity atraviesa paredes y vallas: solo choca con el suelo.
Build.GROUND_GROUP = "Ground"
Build.VERITY_GROUP = "VerityGhost"
Build.WALL_GROUP = "VerityWall" -- murallas: frenan a Verity, los jugadores pasan
Build.SOLID_GROUP = "Solid" -- refugios: nadie los atraviesa, ni Verity
local groupsReady = false
function Build.ensureGroups()
	if groupsReady then
		return
	end
	groupsReady = true
	for _, name in { Build.GROUND_GROUP, Build.VERITY_GROUP, Build.WALL_GROUP, Build.SOLID_GROUP } do
		if not PhysicsService:IsCollisionGroupRegistered(name) then
			PhysicsService:RegisterCollisionGroup(name)
		end
	end
	PhysicsService:CollisionGroupSetCollidable(Build.VERITY_GROUP, "Default", false)
	PhysicsService:CollisionGroupSetCollidable(Build.VERITY_GROUP, Build.VERITY_GROUP, false)
	PhysicsService:CollisionGroupSetCollidable(Build.VERITY_GROUP, Build.GROUND_GROUP, true)
	PhysicsService:CollisionGroupSetCollidable(Build.WALL_GROUP, "Default", false)
	PhysicsService:CollisionGroupSetCollidable(Build.WALL_GROUP, Build.VERITY_GROUP, true)
	PhysicsService:CollisionGroupSetCollidable(Build.SOLID_GROUP, Build.VERITY_GROUP, true)
end

-- Todas las piezas del modelo pasan a ser solidas tambien para Verity.
function Build.markSolid(model: Instance)
	Build.ensureGroups()
	for _, inst in model:GetDescendants() do
		if inst:IsA("BasePart") then
			inst.CollisionGroup = Build.SOLID_GROUP
		end
	end
end

function Build.markGround(part: BasePart)
	Build.ensureGroups()
	part.CollisionGroup = Build.GROUND_GROUP
end

export type PartProps = {
	Name: string?,
	Size: Vector3,
	CFrame: CFrame,
	Color: Color3?,
	Material: Enum.Material?,
	Parent: Instance?,
	Anchored: boolean?,
	CanCollide: boolean?,
	Transparency: number?,
	Shape: Enum.PartType?,
}

function Build.part(props: PartProps): Part
	local p = Instance.new("Part")
	p.Name = props.Name or "Part"
	p.Size = props.Size
	p.CFrame = props.CFrame
	p.Color = props.Color or Color3.fromRGB(163, 162, 165)
	p.Material = props.Material or Enum.Material.SmoothPlastic
	p.Anchored = if props.Anchored == nil then true else props.Anchored
	p.CanCollide = if props.CanCollide == nil then true else props.CanCollide
	p.Transparency = props.Transparency or 0
	if props.Shape then
		p.Shape = props.Shape
	end
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = props.Parent
	return p
end

function Build.billboard(adornee: BasePart, text: string, offsetY: number, width: number?): TextLabel
	local gui = Instance.new("BillboardGui")
	gui.Size = UDim2.fromOffset(width or 200, 50)
	gui.StudsOffset = Vector3.new(0, offsetY, 0)
	gui.AlwaysOnTop = false
	gui.MaxDistance = 120
	gui.Adornee = adornee

	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.GothamBold
	label.TextScaled = true
	label.TextColor3 = Color3.new(1, 1, 1)
	label.TextStrokeTransparency = 0.3
	label.Text = text
	label.Parent = gui

	gui.Parent = adornee
	return label
end

-- Zona invisible donde Verity no puede ver al jugador.
-- ownerUserId = nil -> refugio publico.
function Build.hidingZone(parent: Instance, cf: CFrame, size: Vector3, ownerUserId: number?): Part
	local zone = Build.part({
		Name = "HidingZone",
		Size = size,
		CFrame = cf,
		Parent = parent,
		CanCollide = false,
		Transparency = 1,
	})
	zone.CanQuery = false
	zone.CanTouch = false
	if ownerUserId then
		zone:SetAttribute("OwnerUserId", ownerUserId)
	end
	return zone
end

-- Choza rectangular con puerta en el lado local -Z.
function Build.boxShelter(parent: Instance, cf: CFrame, w: number, d: number, h: number, color: Color3, material: Enum.Material): Model
	local model = Instance.new("Model")
	model.Name = "Shelter"
	local t = 1.5
	local door = 6
	local function wall(size: Vector3, offset: Vector3)
		Build.part({ Name = "Wall", Size = size, CFrame = cf * CFrame.new(offset), Color = color, Material = material, Parent = model })
	end
	wall(Vector3.new(w, h, t), Vector3.new(0, h / 2, d / 2)) -- fondo
	wall(Vector3.new(t, h, d), Vector3.new(-w / 2, h / 2, 0)) -- izquierda
	wall(Vector3.new(t, h, d), Vector3.new(w / 2, h / 2, 0)) -- derecha
	local side = (w - door) / 2
	wall(Vector3.new(side, h, t), Vector3.new(-(door / 2 + side / 2), h / 2, -d / 2))
	wall(Vector3.new(side, h, t), Vector3.new(door / 2 + side / 2, h / 2, -d / 2))
	wall(Vector3.new(door, h - 7, t), Vector3.new(0, h - (h - 7) / 2, -d / 2)) -- dintel
	wall(Vector3.new(w + t, t, d + t), Vector3.new(0, h + t / 2, 0)) -- techo
	model.Parent = parent
	return model
end

-- Yurta redonda hecha de segmentos, con la puerta en el lado local -Z.
function Build.yurt(parent: Instance, cf: CFrame, radius: number, height: number): Model
	local model = Instance.new("Model")
	model.Name = "Yurt"
	local segments = 16
	local felt = Color3.fromRGB(235, 225, 200)
	local segWidth = 2 * math.pi * radius / segments + 0.3
	for i = 0, segments - 1 do
		local angle = (i + 0.5) / segments * 2 * math.pi
		-- angulo 0 apunta a -Z (la puerta): dejamos libre el segmento 0 y el ultimo
		if i ~= 0 and i ~= segments - 1 then
			local dir = Vector3.new(math.sin(angle), 0, -math.cos(angle))
			local pos = dir * radius + Vector3.new(0, height / 2, 0)
			local segCf = cf * CFrame.lookAt(pos, Vector3.new(0, height / 2, 0))
			Build.part({ Name = "Felt", Size = Vector3.new(segWidth, height, 1), CFrame = segCf, Color = felt, Material = Enum.Material.Fabric, Parent = model })
		end
	end
	-- techo conico: discos (cilindros acostados) cada vez mas chicos
	local upright = CFrame.Angles(0, 0, math.pi / 2) -- el eje del cilindro es X; lo ponemos vertical
	local tiers = { 1.1, 0.75, 0.45 }
	for i, scale in tiers do
		local r = (radius + 1) * scale
		Build.part({
			Name = "Roof",
			Shape = Enum.PartType.Cylinder,
			Size = Vector3.new(1.2, r * 2, r * 2),
			CFrame = cf * CFrame.new(0, height + (i - 0.5) * 1.2, 0) * upright,
			Color = felt,
			Material = Enum.Material.Fabric,
			Parent = model,
		})
	end
	Build.part({
		Name = "Crown",
		Size = Vector3.new(3, 1, 3),
		CFrame = cf * CFrame.new(0, height + #tiers * 1.2 + 0.5, 0),
		Color = Color3.fromRGB(170, 30, 30),
		Material = Enum.Material.Wood,
		Parent = model,
	})
	-- marco de puerta
	Build.part({
		Name = "Door",
		Size = Vector3.new(6, 1, 1.2),
		CFrame = cf * CFrame.new(0, 7.5, -radius),
		Color = Color3.fromRGB(170, 30, 30),
		Material = Enum.Material.Wood,
		Parent = model,
	})
	model.Parent = parent
	return model
end

return Build
