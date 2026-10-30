--!strict
-- "Ver hitboxes" (Ajustes), solo en tu pantalla y sin ventajas: nunca marca
-- a otros supervivientes ni a nadie escondido, nada se ve a través de las
-- paredes (las paredes lo tapan) y todo es tenue, sin brillo. Durante la
-- ronda muestra:
--   - tu propia caja
--   - la caja de Verity y su alcance real para atrapar (Config.Killer: el
--     anillo de KillRange, las dos líneas del cono frontal y el círculo de
--     KillCloseRange): si eres Verity, el tuyo; si eres superviviente, solo
--     cuando Verity está a menos de NEAR studs

local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)

local K = Config.Killer
local player = Players.LocalPlayer
local NEAR = 40
local SELF = Color3.fromRGB(70, 200, 175)
local VERITY = Color3.fromRGB(200, 50, 60)

local Hitboxes = {}

type Drawn = {
	model: Model,
	root: BasePart,
	humanoid: Humanoid,
	width: number,
	depth: number,
	box: BoxHandleAdornment,
	ring: CylinderHandleAdornment?,
	close: CylinderHandleAdornment?,
	lines: { BoxHandleAdornment },
	all: { Instance },
}

local enabled = false
local folder: Folder? = nil
local drawn: { [Model]: Drawn } = {}

local function clear()
	if folder then
		folder:Destroy()
		folder = nil
	end
	table.clear(drawn)
end

local function rootOf(model: Model): BasePart?
	local root = model:FindFirstChild("HumanoidRootPart")
	return if root and root:IsA("BasePart") then root else nil
end

-- Qué se dibuja: modelo -> es Verity
local function wanted(): { [Model]: boolean }
	local list: { [Model]: boolean } = {}
	local role = player:GetAttribute("Role")
	local mine = player.Character
	if not mine or (role ~= "Survivor" and role ~= "Verity") then
		return list
	end
	list[mine] = role == "Verity"
	if role == "Survivor" then
		local myRoot = rootOf(mine)
		for _, verity in CollectionService:GetTagged("VerityCharacter") do
			local root = verity:IsA("Model") and rootOf(verity)
			if verity:IsA("Model") and root and myRoot and (root.Position - myRoot.Position).Magnitude <= NEAR then
				list[verity] = true
			end
		end
	end
	return list
end

local function new(className: string, props: { [string]: any }): any
	local inst = Instance.new(className)
	for k, v in props do
		(inst :: any)[k] = v
	end
	;(inst :: any).AlwaysOnTop = false -- las paredes lo tapan
	inst.Parent = folder
	return inst
end

local function draw(model: Model, root: BasePart, humanoid: Humanoid, isVerity: boolean): Drawn
	local color = if isVerity then VERITY else SELF
	local d: Drawn = {
		model = model,
		root = root,
		humanoid = humanoid,
		width = if isVerity then 4 else 3,
		depth = if isVerity then 2.5 else 1.6,
		box = new("BoxHandleAdornment", { Adornee = root, Color3 = color, Transparency = 0.85, ZIndex = 0 }),
		ring = nil,
		close = nil,
		lines = {},
		all = {},
	}
	table.insert(d.all, d.box)
	if isVerity then
		local ring = new("CylinderHandleAdornment", { Adornee = root, Radius = K.KillRange, Height = 0.08, Color3 = VERITY,
			Transparency = 0.7, ZIndex = 0 })
		pcall(function()
			ring.InnerRadius = K.KillRange - 0.3 -- solo el borde
		end)
		local close = new("CylinderHandleAdornment", { Adornee = root, Radius = K.KillCloseRange, Height = 0.06, Color3 = VERITY,
			Transparency = 0.82, ZIndex = 0 })
		d.ring = ring
		d.close = close
		table.insert(d.all, ring)
		table.insert(d.all, close)
		for _ = 1, 2 do
			local line = new("BoxHandleAdornment", { Adornee = root, Size = Vector3.new(0.2, 0.08, K.KillRange), Color3 = VERITY,
				Transparency = 0.65, ZIndex = 0 })
			table.insert(d.lines, line)
			table.insert(d.all, line)
		end
	end
	return d
end

-- Cada fotograma: la caja va de los pies a la cabeza (se encoge al agacharse
-- y baja al correr a cuatro patas) y el alcance se pega al suelo.
local HALF_CONE = math.acos(K.KillConeDot)

local function update(d: Drawn)
	local root, humanoid = d.root, d.humanoid
	local feet = -(root.Size.Y / 2 + humanoid.HipHeight)
	local head = d.model:FindFirstChild("Head")
	local top = if head and head:IsA("BasePart")
		then root.CFrame:PointToObjectSpace(head.Position).Y + head.Size.Y / 2
		else root.Size.Y / 2 + 2
	top = math.max(top, feet + 1)
	d.box.Size = Vector3.new(d.width, top - feet, d.depth)
	d.box.CFrame = CFrame.new(0, (top + feet) / 2, 0)
	local ground = CFrame.new(0, feet + 0.15, 0)
	local flat = ground * CFrame.Angles(math.rad(90), 0, 0) -- el cilindro crece a lo largo de Z
	if d.ring then
		d.ring.CFrame = flat
	end
	if d.close then
		d.close.CFrame = flat
	end
	for k, line in d.lines do
		local side = if k == 1 then 1 else -1
		line.CFrame = ground * CFrame.Angles(0, side * HALF_CONE, 0) * CFrame.new(0, 0, -K.KillRange / 2)
	end
end

local function refresh()
	if not folder then
		local f = Instance.new("Folder")
		f.Name = "Hitboxes"
		f.Parent = Workspace.CurrentCamera
		folder = f
	end
	local list = wanted()
	for model, d in drawn do
		if list[model] == nil or not model.Parent or not d.root.Parent then
			for _, inst in d.all do
				inst:Destroy()
			end
			drawn[model] = nil
		end
	end
	for model, isVerity in list do
		local root = rootOf(model)
		local humanoid = model:FindFirstChildOfClass("Humanoid")
		if root and humanoid and not drawn[model] then
			drawn[model] = draw(model, root, humanoid, isVerity)
		end
	end
end

function Hitboxes.setEnabled(value: boolean)
	enabled = value
	if not value then
		clear()
	end
end

function Hitboxes.isEnabled(): boolean
	return enabled
end

function Hitboxes.start()
	local accumulator = 0
	RunService.Heartbeat:Connect(function(dt)
		accumulator += dt
		if accumulator < 0.25 or not enabled then
			return
		end
		accumulator = 0
		refresh()
	end)
	RunService.RenderStepped:Connect(function()
		if enabled then
			for _, d in drawn do
				update(d)
			end
		end
	end)
end

return Hitboxes
