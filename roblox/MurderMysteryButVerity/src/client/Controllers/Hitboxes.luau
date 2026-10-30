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

local enabled = false
local folder: Folder? = nil
local drawn: { [Model]: { Instance } } = {}

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

local function new(className: string, props: { [string]: any }): Instance
	local inst = Instance.new(className)
	for k, v in props do
		(inst :: any)[k] = v
	end
	;(inst :: any).AlwaysOnTop = false -- las paredes lo tapan
	inst.Parent = folder
	return inst
end

-- Caja tenue del personaje, pegada a su HumanoidRootPart.
local function drawBox(model: Model, root: BasePart, color: Color3, parts: { Instance })
	local cf, size = model:GetBoundingBox()
	table.insert(parts, new("BoxHandleAdornment", {
		Adornee = root,
		CFrame = root.CFrame:ToObjectSpace(cf),
		Size = size,
		Color3 = color,
		Transparency = 0.85,
		ZIndex = 0,
	}))
end

-- Alcance de Verity dibujado en el suelo.
local function drawReach(model: Model, root: BasePart, parts: { Instance })
	local humanoid = model:FindFirstChildOfClass("Humanoid")
	if not humanoid then
		return
	end
	local ground = CFrame.new(0, -(root.Size.Y / 2 + humanoid.HipHeight) + 0.15, 0)
	local flat = ground * CFrame.Angles(math.rad(90), 0, 0) -- el cilindro crece a lo largo de Z
	local ring = new("CylinderHandleAdornment", { Adornee = root, CFrame = flat, Radius = K.KillRange, Height = 0.08,
		Color3 = VERITY, Transparency = 0.7, ZIndex = 0 })
	pcall(function()
		(ring :: any).InnerRadius = K.KillRange - 0.3 -- solo el borde
	end)
	table.insert(parts, ring)
	table.insert(parts, new("CylinderHandleAdornment", { Adornee = root, CFrame = flat, Radius = K.KillCloseRange, Height = 0.06,
		Color3 = VERITY, Transparency = 0.82, ZIndex = 0 }))
	local half = math.acos(K.KillConeDot)
	for _, side in { 1, -1 } do
		table.insert(parts, new("BoxHandleAdornment", {
			Adornee = root,
			CFrame = ground * CFrame.Angles(0, side * half, 0) * CFrame.new(0, 0, -K.KillRange / 2),
			Size = Vector3.new(0.2, 0.08, K.KillRange),
			Color3 = VERITY,
			Transparency = 0.65,
			ZIndex = 0,
		}))
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
	for model, parts in drawn do
		if list[model] == nil or not model.Parent then
			for _, inst in parts do
				inst:Destroy()
			end
			drawn[model] = nil
		end
	end
	for model, isVerity in list do
		local root = rootOf(model)
		if root and not drawn[model] then
			local parts: { Instance } = {}
			drawBox(model, root, if isVerity then VERITY else SELF, parts)
			if isVerity then
				drawReach(model, root, parts)
			end
			drawn[model] = parts
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
end

return Hitboxes
