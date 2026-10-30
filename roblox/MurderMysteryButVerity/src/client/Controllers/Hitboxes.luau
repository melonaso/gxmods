--!strict
-- "Ver hitboxes" (Ajustes), solo en tu pantalla. Durante la ronda marca:
--   - la caja de cada personaje: supervivientes y NPCs en turquesa, Verity en rojo
--   - alrededor de Verity, su alcance real para atrapar (Config.Killer): el
--     anillo de KillRange, las dos líneas del cono frontal (KillConeDot) y el
--     círculo de KillCloseRange, donde atrapa en cualquier dirección

local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)

local K = Config.Killer
local SURVIVOR = Color3.fromRGB(70, 220, 190)
local VERITY = Color3.fromRGB(255, 59, 78)

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

-- Personajes de la ronda: modelo -> es Verity
local function characters(): { [Model]: boolean }
	local list: { [Model]: boolean } = {}
	for _, player in Players:GetPlayers() do
		local role = player:GetAttribute("Role")
		if player.Character and (role == "Survivor" or role == "Verity") then
			list[player.Character] = role == "Verity"
		end
	end
	for _, bot in CollectionService:GetTagged("Bot") do
		if bot:IsA("Model") and bot.Parent then
			list[bot] = false
		end
	end
	for _, verity in CollectionService:GetTagged("VerityCharacter") do
		if verity:IsA("Model") and verity.Parent then
			list[verity] = true
		end
	end
	return list
end

local function new(className: string, props: { [string]: any }): Instance
	local inst = Instance.new(className)
	for k, v in props do
		(inst :: any)[k] = v
	end
	inst.Parent = folder
	return inst
end

-- Alcance de Verity dibujado en el suelo, pegado a su HumanoidRootPart.
local function drawReach(model: Model, parts: { Instance })
	local root = model:FindFirstChild("HumanoidRootPart")
	local humanoid = model:FindFirstChildOfClass("Humanoid")
	if not (root and root:IsA("BasePart") and humanoid) then
		return
	end
	local ground = CFrame.new(0, -(root.Size.Y / 2 + humanoid.HipHeight) + 0.15, 0)
	local flat = ground * CFrame.Angles(math.rad(90), 0, 0) -- el cilindro crece a lo largo de Z
	local ring = new("CylinderHandleAdornment", { Adornee = root, CFrame = flat, Radius = K.KillRange, Height = 0.1,
		Color3 = VERITY, Transparency = 0.45, ZIndex = 1 })
	pcall(function()
		(ring :: any).InnerRadius = K.KillRange - 0.35 -- solo el borde
	end)
	table.insert(parts, ring)
	table.insert(parts, new("CylinderHandleAdornment", { Adornee = root, CFrame = flat, Radius = K.KillCloseRange, Height = 0.08,
		Color3 = VERITY, Transparency = 0.7, ZIndex = 1 }))
	local half = math.acos(K.KillConeDot)
	for _, side in { 1, -1 } do
		table.insert(parts, new("BoxHandleAdornment", {
			Adornee = root,
			CFrame = ground * CFrame.Angles(0, side * half, 0) * CFrame.new(0, 0, -K.KillRange / 2),
			Size = Vector3.new(0.25, 0.1, K.KillRange),
			Color3 = VERITY,
			Transparency = 0.3,
			ZIndex = 1,
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
	local wanted = characters()
	for model, parts in drawn do
		if wanted[model] == nil or not model.Parent then
			for _, inst in parts do
				inst:Destroy()
			end
			drawn[model] = nil
		end
	end
	for model, isVerity in wanted do
		if not drawn[model] then
			local parts: { Instance } = {}
			table.insert(parts, new("SelectionBox", {
				Adornee = model,
				Color3 = if isVerity then VERITY else SURVIVOR,
				LineThickness = 0.06,
				SurfaceTransparency = 1,
				Transparency = 0.15,
			}))
			if isVerity then
				drawReach(model, parts)
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
		if accumulator < 0.5 or not enabled then
			return
		end
		accumulator = 0
		refresh()
	end)
end

return Hitboxes
