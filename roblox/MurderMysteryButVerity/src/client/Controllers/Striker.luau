--!strict
-- Martillo de fuerza del lobby (solo diversión).
--   - Tu turno (Minigame "StrikerStart"): abajo aparece una barra con una
--     aguja que va y viene; pulsa ¡GOLPEAR!, E o Espacio en el momento justo.
--     La aguja se frena en los extremos, así que acertar arriba es posible.
--   - Todos ven el resultado: el disco sube por la torre hasta la fuerza
--     conseguida y, si llega arriba, la campana suena y se ilumina.
--   - Encima de cada máquina se ve el récord del servidor.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Locale = require(ReplicatedStorage.Shared.Locale)
local Net = require(ReplicatedStorage.Shared.Net)
local UI = require(script.Parent.Parent.Lib.UI)

local S = Config.Striker
local C = UI.Colors
local T = Locale.t
local player = Players.LocalPlayer

local Striker = {}

local RISE = 13.4 -- studs que sube el disco con fuerza 100 (de la base a la campana)
local BELL_COLORS = { Color3.fromRGB(255, 240, 150), Color3.fromRGB(255, 120, 60), Color3.fromRGB(255, 200, 60) }

local gui: ScreenGui
local meter: Frame
local needle: Frame
local playing: Instance? = nil
local playStart = 0
local playConnection: RBXScriptConnection? = nil

local function playAt(part: BasePart, id: string, volume: number, speed: number)
	local sound = Instance.new("Sound")
	sound.SoundId = id
	sound.Volume = volume
	sound.PlaybackSpeed = speed
	sound.RollOffMaxDistance = 60
	sound.Parent = part
	sound:Play()
	sound.Ended:Once(function()
		sound:Destroy()
	end)
end

-- Posición de la aguja (0-1): coseno, más lenta cerca de los extremos.
local function needleAt(t: number): number
	return (1 - math.cos(2 * math.pi * t / S.NeedlePeriod)) / 2
end

local function finish()
	local machine = playing
	if not machine then
		return
	end
	playing = nil
	if playConnection then
		playConnection:Disconnect()
		playConnection = nil
	end
	local power = math.floor(needleAt(os.clock() - playStart) * 100 + 0.5)
	Net.get("Minigame"):FireServer("Strike", machine, power)
	UI.pulse(meter, 1.08)
	task.delay(0.4, function()
		if not playing then
			UI.show(meter, false)
		end
	end)
end

local function begin(machine: Instance)
	playing = machine
	playStart = os.clock()
	UI.show(meter, true)
	if playConnection then
		playConnection:Disconnect()
	end
	playConnection = RunService.RenderStepped:Connect(function()
		local t = os.clock() - playStart
		needle.Position = UDim2.fromScale(needleAt(t), 0.5)
		if t > S.Window - 0.5 then
			finish() -- se acabó el tiempo: golpea con lo que haya
		end
	end)
end

local function build()
	gui = UI.new("ScreenGui", { Name = "Striker", ResetOnSpawn = false, DisplayOrder = 7, Parent = player:WaitForChild("PlayerGui") })
	meter = UI.new("Frame", {
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -90),
		Size = UDim2.fromOffset(340, 96),
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.1,
		Visible = false,
		Parent = gui,
	}, { UI.corner(14), UI.stroke(0.6, C.Gold) })
	UI.label({ Position = UDim2.fromOffset(0, 8), Size = UDim2.new(1, 0, 0, 16), FontFace = UI.FontBold, TextSize = 13,
		Text = T("¡Pulsa en el momento justo!"), Parent = meter })
	local bar = UI.new("Frame", { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 30), Size = UDim2.new(1, -40, 0, 18),
		BackgroundColor3 = Color3.new(1, 1, 1), Parent = meter }, {
		UI.corner(9),
		UI.new("UIGradient", { Color = ColorSequence.new({
			ColorSequenceKeypoint.new(0, Color3.fromRGB(70, 200, 120)),
			ColorSequenceKeypoint.new(0.6, Color3.fromRGB(255, 200, 60)),
			ColorSequenceKeypoint.new(0.94, Color3.fromRGB(255, 70, 50)),
			ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 240, 150)),
		}) }),
	})
	needle = UI.new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0, 0.5), Size = UDim2.new(0, 5, 1, 10),
		BackgroundColor3 = Color3.new(1, 1, 1), Parent = bar }, { UI.corner(2), UI.stroke(0, Color3.new(0, 0, 0)) })
	local hit: TextButton = UI.new("TextButton", {
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -8),
		Size = UDim2.fromOffset(150, 28),
		BackgroundColor3 = C.Verity,
		FontFace = UI.FontHeavy,
		TextSize = 14,
		TextColor3 = Color3.new(1, 1, 1),
		Text = T("¡GOLPEAR!"),
		Parent = meter,
	}, { UI.corner(10) })
	hit.Activated:Connect(finish)
	UI.animateButtons(gui)
end

-- Escala de colores en la torre, disco animado, campana y récord.
local function watch(machine: Instance)
	local tower = machine:FindFirstChild("Tower")
	local puck = machine:FindFirstChild("Puck")
	local bell = machine:FindFirstChild("Bell")
	if not (tower and tower:IsA("BasePart") and puck and puck:IsA("BasePart") and bell and bell:IsA("BasePart")) then
		return
	end
	local surface = UI.new("SurfaceGui", { Face = Enum.NormalId.Front, SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud, PixelsPerStud = 20,
		LightInfluence = 0.4, Parent = tower })
	local scale = UI.new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(1, 1, 1), BorderSizePixel = 0, Parent = surface }, {
		UI.new("UIGradient", { Rotation = -90, Color = ColorSequence.new({
			ColorSequenceKeypoint.new(0, Color3.fromRGB(70, 200, 120)),
			ColorSequenceKeypoint.new(0.6, Color3.fromRGB(255, 200, 60)),
			ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 70, 50)),
		}) }),
	})
	for k = 1, 9 do
		UI.new("Frame", { AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.fromScale(0, 1 - k / 10), Size = UDim2.new(0.35, 0, 0, 2),
			BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0.4, BorderSizePixel = 0, Parent = scale })
	end
	-- solo se ve de cerca (no tapa la pantalla desde el otro lado del lobby)
	local record = UI.new("BillboardGui", { Adornee = bell, Size = UDim2.fromOffset(170, 24), StudsOffset = Vector3.new(0, 4.4, 0),
		MaxDistance = 28, LightInfluence = 0, Parent = bell })
	local recordLabel = UI.label({ Size = UDim2.fromScale(1, 1), TextScaled = true, FontFace = UI.FontBold, TextColor3 = C.Gold,
		TextStrokeTransparency = 0.4, Parent = record })
	local function showRecord()
		local power = machine:GetAttribute("RecordPower")
		local by = machine:GetAttribute("RecordBy")
		recordLabel.Text = if typeof(power) == "number" and typeof(by) == "string"
			then T("Récord: {name} ({power})", { name = by, power = power })
			else T("Sin récord todavía")
	end
	showRecord()
	machine:GetAttributeChangedSignal("RecordPower"):Connect(showRecord)

	local home = puck.CFrame
	local bellColor = bell.Color
	local token = 0
	machine:GetAttributeChangedSignal("StrikeId"):Connect(function()
		local power = (machine:GetAttribute("StrikePower") :: number?) or 0
		token += 1
		local mine = token
		playAt(puck, "rbxasset://sounds/collide.wav", 0.9, 0.7)
		local height = Instance.new("NumberValue")
		height.Changed:Connect(function(v)
			puck.CFrame = home + Vector3.new(0, v, 0)
		end)
		UI.tween(height, 0.6, { Value = RISE * power / 100 }, Enum.EasingStyle.Quad).Completed:Wait()
		if mine ~= token then
			height:Destroy()
			return
		end
		if power >= S.BellAt then
			playAt(bell, "rbxasset://sounds/electronicpingshort.wav", 1, 1.6)
			playAt(bell, "rbxasset://sounds/electronicpingshort.wav", 0.8, 2)
			for k = 1, 10 do
				bell.Color = BELL_COLORS[k % #BELL_COLORS + 1]
				UI.pulse(recordLabel, 1.1)
				task.wait(0.08)
			end
			bell.Color = bellColor
		else
			task.wait(0.4)
		end
		UI.tween(height, 0.8, { Value = 0 }, Enum.EasingStyle.Bounce).Completed:Wait()
		height:Destroy()
	end)
end

function Striker.init()
	build()
end

function Striker.start()
	Net.get("Minigame").OnClientEvent:Connect(function(kind, machine)
		if kind == "StrikerStart" and typeof(machine) == "Instance" then
			begin(machine)
		end
	end)
	UserInputService.InputBegan:Connect(function(input, processed)
		if playing and (input.KeyCode == Enum.KeyCode.Space or (input.KeyCode == Enum.KeyCode.E and not processed)) then
			-- el mismo E que abrió el juego no cuenta: espera un instante
			if os.clock() - playStart > 0.25 then
				finish()
			end
		end
	end)
	local lobby = Workspace:WaitForChild("Lobby", 30)
	if not lobby then
		return
	end
	for _, inst in lobby:GetDescendants() do
		if inst:GetAttribute("Striker") then
			task.spawn(watch, inst)
		end
	end
end

return Striker
