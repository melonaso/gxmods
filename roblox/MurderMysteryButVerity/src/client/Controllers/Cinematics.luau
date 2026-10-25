--!strict
-- Toques cinematográficos (solo cámara y pantalla, nunca bloquean el juego
-- más de unos segundos):
--   - inicio de ronda: barras de cine, título del mapa y la cámara rodea a tu
--     personaje (o a la bola, si eres Verity)
--   - transformación: si eres Verity, la cámara orbita a tu alrededor mientras
--     la bola se convierte en el monstruo
--   - ataque: pequeño zoom (campo de visión) mientras Verity levanta a la víctima

local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Net = require(ReplicatedStorage.Shared.Net)
local Pose = require(ReplicatedStorage.Shared.VerityPose)
local UI = require(script.Parent.Parent.Lib.UI)

local player = Players.LocalPlayer

local Cinematics = {}

local gui: ScreenGui
local topBar: Frame
local bottomBar: Frame
local title: CanvasGroup
local titleLabel: TextLabel
local subtitleLabel: TextLabel
local busy = false
local introToken = 0

local function tween(inst: Instance, time: number, goal: { [string]: any })
	local t = TweenService:Create(inst, TweenInfo.new(time, Enum.EasingStyle.Quint, Enum.EasingDirection.Out), goal)
	t:Play()
	return t
end

local function letterbox(show: boolean)
	local h = if show then 0.09 else 0
	tween(topBar, 0.6, { Size = UDim2.fromScale(1, h) })
	tween(bottomBar, 0.6, { Size = UDim2.fromScale(1, h) })
end

local function build()
	gui = UI.new("ScreenGui", {
		Name = "Cinematics",
		IgnoreGuiInset = true,
		ResetOnSpawn = false,
		DisplayOrder = 10,
		Parent = player:WaitForChild("PlayerGui"),
	})
	topBar = UI.new("Frame", { Size = UDim2.fromScale(1, 0), BackgroundColor3 = Color3.new(0, 0, 0), BorderSizePixel = 0, Parent = gui })
	bottomBar = UI.new("Frame", {
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.fromScale(0, 1),
		Size = UDim2.fromScale(1, 0),
		BackgroundColor3 = Color3.new(0, 0, 0),
		BorderSizePixel = 0,
		Parent = gui,
	})
	title = UI.new("CanvasGroup", {
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 0.9, -12),
		Size = UDim2.fromOffset(600, 80),
		BackgroundTransparency = 1,
		GroupTransparency = 1,
		Parent = gui,
	})
	titleLabel = UI.label({
		Size = UDim2.new(1, 0, 0, 46),
		FontFace = Font.new("rbxasset://fonts/families/Merriweather.json", Enum.FontWeight.Bold),
		TextSize = 40,
		TextColor3 = Color3.fromRGB(240, 232, 220),
		Parent = title,
	})
	subtitleLabel = UI.label({
		Position = UDim2.fromOffset(0, 50),
		Size = UDim2.new(1, 0, 0, 20),
		TextSize = 14,
		TextColor3 = Color3.fromRGB(190, 180, 170),
		Parent = title,
	})
end

-- Distancia segura de cámara: no atraviesa paredes.
local function clampCamera(target: Vector3, wanted: Vector3, ignore: { Instance }): Vector3
	local params = RaycastParams.new()
	params.FilterDescendantsInstances = ignore
	local direction = wanted - target
	local hit = Workspace:Raycast(target, direction, params)
	if hit then
		return target + direction.Unit * math.max(2, (hit.Position - target).Magnitude - 1)
	end
	return wanted
end

-- Órbita de cámara alrededor de `focus()` durante `duration`.
local function orbit(focus: () -> Vector3?, duration: number, radius: { number }, height: { number }, sweep: number, startAngle: number)
	local camera = Workspace.CurrentCamera
	if not camera or busy then
		return
	end
	busy = true
	local previousType = camera.CameraType
	camera.CameraType = Enum.CameraType.Scriptable
	local start = os.clock()
	local ignore: { Instance } = {}
	if player.Character then
		table.insert(ignore, player.Character)
	end
	local connection: RBXScriptConnection
	connection = RunService.RenderStepped:Connect(function()
		local t = math.clamp((os.clock() - start) / duration, 0, 1)
		local eased = t * t * (3 - 2 * t)
		local target = focus()
		if not target then
			return
		end
		local angle = startAngle + sweep * eased
		local r = radius[1] + (radius[2] - radius[1]) * eased
		local h = height[1] + (height[2] - height[1]) * eased
		local wanted = target + Vector3.new(math.cos(angle) * r, h, math.sin(angle) * r)
		local position = clampCamera(target, wanted, ignore)
		camera.CFrame = CFrame.lookAt(position, target)
	end)
	task.delay(duration, function()
		connection:Disconnect()
		camera.CameraType = if previousType == Enum.CameraType.Scriptable then Enum.CameraType.Custom else previousType
		busy = false
	end)
end

local function rootPosition(): Vector3?
	local character = player.Character
	local root = character and character:FindFirstChild("HumanoidRootPart")
	return if root and root:IsA("BasePart") then root.Position else nil
end

local function ballPosition(): Vector3?
	for _, inst in CollectionService:GetTagged("VerityBall") do
		if inst:IsA("Model") and inst:GetAttribute("Owner") == player.Name then
			return inst:GetPivot().Position
		end
	end
	return nil
end

-- Oculta el título del mapa (también al volver al lobby, pase lo que pase).
local function hideTitle()
	introToken += 1
	tween(title, 0.6, { GroupTransparency = 1 })
	letterbox(Workspace:GetAttribute("Phase") == "Results")
end

local function facingAngle(): number
	local character = player.Character
	local root = character and character:FindFirstChild("HumanoidRootPart")
	if root and root:IsA("BasePart") then
		local look = root.CFrame.LookVector
		return math.atan2(look.Z, look.X)
	end
	return 0
end

local function roundIntro(mapName: string)
	introToken += 1
	local token = introToken
	-- el título se oculta solo, aunque la cámara falle
	task.delay(4.2, function()
		if introToken == token then
			hideTitle()
		end
	end)
	titleLabel.Text = string.upper(mapName)
	local role = player:GetAttribute("Role")
	subtitleLabel.Text = if role == "Verity" then "Despierta y atrápalos a todos" else "Sobrevive hasta el amanecer"
	letterbox(true)
	tween(title, 0.8, { GroupTransparency = 0 })
	task.wait(0.4)
	local isVerity = role == "Verity"
	local focus = if isVerity then function()
		return ballPosition() or rootPosition()
	end else rootPosition
	local ok, err = pcall(orbit, focus, 3.6, if isVerity then { 18, 12 } else { 13, 9 }, { 6, 3 }, math.rad(110), facingAngle() + math.rad(130))
	if not ok then
		warn(`[Cinematics] cámara de introducción: {err}`)
	end
end

local function transformShot()
	if player:GetAttribute("Role") ~= "Verity" then
		return
	end
	local rigHeight = 16
	local character = player.Character
	if character then
		rigHeight = (character:GetAttribute("RigHeight") :: number?) or 16
	end
	letterbox(true)
	orbit(function()
		local root = rootPosition()
		return if root then root + Vector3.new(0, rigHeight * 0.25, 0) else nil
	end, Config.Round.TransformTime + 0.5, { 16, 24 }, { 2, 9 }, math.rad(160), facingAngle() + math.rad(60))
	task.delay(Config.Round.TransformTime + 0.5, function()
		letterbox(false)
	end)
end

local function watchKills(character: Model)
	character:GetAttributeChangedSignal("KillStart"):Connect(function()
		local camera = Workspace.CurrentCamera
		if not camera then
			return
		end
		if character:GetAttribute("KillStart") then
			tween(camera, 0.35, { FieldOfView = 58 })
			task.delay(Pose.KillImpact, function()
				tween(camera, 0.15, { FieldOfView = 76 })
			end)
		else
			tween(camera, 0.6, { FieldOfView = 70 })
		end
	end)
end

function Cinematics.init()
	build()
end

function Cinematics.start()
	Workspace:GetAttributeChangedSignal("MapName"):Connect(function()
		local name = Workspace:GetAttribute("MapName")
		if typeof(name) == "string" then
			task.wait(0.6) -- deja que el personaje llegue al mapa
			roundIntro(name)
		else
			hideTitle()
		end
	end)
	Workspace:GetAttributeChangedSignal("Phase"):Connect(function()
		local phase = Workspace:GetAttribute("Phase")
		if phase ~= "Starting" and phase ~= "Playing" then
			hideTitle()
		end
	end)
	Net.get("Effect").OnClientEvent:Connect(function(kind)
		if kind == "Transform" then
			transformShot()
		end
	end)
	player.CharacterAdded:Connect(watchKills)
	if player.Character then
		watchKills(player.Character)
	end
end

return Cinematics
