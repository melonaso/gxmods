--!strict
-- Introduccion cinematografica al entrar al juego: la historia de como te
-- proclaman Gengis Khan (kurultai de 1206 junto al rio Onon) y el secreto de
-- la estepa (Verity). Camara en tomas sobre el mapa real, franjas negras de
-- cine, texto que se escribe letra a letra y boton para saltar.
-- Al terminar: camara normal, controles activos y el HUD pide reclamar un
-- campamento (el contador de Verity aun no existe).
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local StarterGui = game:GetService("StarterGui")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)

local HUD = require(script.Parent.HUD)

type Shot = {
	from: CFrame,
	to: CFrame,
	lines: { string },
	title: boolean?,
}

local SHOTS: { Shot } = {
	{ -- la estepa
		from = CFrame.lookAt(Vector3.new(-260, 45, 180), Vector3.new(0, 10, 0)),
		to = CFrame.lookAt(Vector3.new(-170, 35, 120), Vector3.new(0, 15, 0)),
		lines = {
			"Año 1206. La estepa de Mongolia.",
			"Durante siglos, las tribus de las llanuras se mataron entre sí por pastos, caballos y venganza.",
		},
	},
	{ -- el kurultai ante el estandarte
		from = CFrame.lookAt(Vector3.new(34, 18, 34), Vector3.new(0, 26, 0)),
		to = CFrame.lookAt(Vector3.new(-30, 24, 34), Vector3.new(0, 28, 0)),
		lines = {
			"Hoy, junto al río Onón, todos los clanes se han reunido en un gran kurultai.",
			"Ante el estandarte blanco de nueve colas te alzan sobre un fieltro blanco... y te dan un nuevo nombre.",
		},
		title = true,
	},
	{ -- el circulo de piedras negras
		from = CFrame.lookAt(Vector3.new(0, 40, -150), Vector3.new(0, 4, -260)),
		to = CFrame.lookAt(Vector3.new(0, 10, -226), Vector3.new(0, 5, -260)),
		lines = {
			"Pero la estepa guarda un secreto que ningún kan se ha atrevido a nombrar.",
			"En el círculo de piedras negras del norte duerme una sonrisa amarilla.",
			"Los chamanes la llaman Verity. Cuando cae la noche, despierta... y caza.",
		},
	},
	{ -- los campamentos
		from = CFrame.lookAt(Vector3.new(0, 60, 40), Vector3.new(150, 0, 0)),
		to = CFrame.lookAt(Vector3.new(0, 140, 30), Vector3.new(0, 0, 0)),
		lines = {
			"Levanta tu campamento. Reúne rebaños, caravanas de seda y armas.",
			"Y cuando caiga la noche, Khan... pelea, o escóndete.",
		},
	},
}

local CHAR_TIME = 0.03 -- segundos por letra
local HOLD = 2.2 -- segundos que se queda cada frase

local Intro = {}

local skip = false
local cameraTween: Tween? = nil -- el movimiento de la toma en curso (se cancela al saltar)
local gui: ScreenGui
local blackout: Frame
local story: TextLabel
local titleMain: TextLabel
local titleSub: TextLabel

local function sleep(seconds: number)
	local elapsed = 0
	while elapsed < seconds and not skip do
		elapsed += task.wait(0.05)
	end
end

local function fade(target: number, seconds: number)
	TweenService:Create(blackout, TweenInfo.new(seconds), { BackgroundTransparency = target }):Play()
	sleep(seconds)
end

local function typewrite(line: string)
	story.Text = line
	story.MaxVisibleGraphemes = 0
	local total = utf8.len(line) or #line
	local shown = 0
	while shown < total and not skip do
		shown += 1
		story.MaxVisibleGraphemes = shown
		task.wait(CHAR_TIME)
	end
	story.MaxVisibleGraphemes = -1
	sleep(HOLD)
end

local function showTitle()
	for _, label in { titleMain, titleSub } do
		TweenService:Create(label, TweenInfo.new(1.2), { TextTransparency = 0, TextStrokeTransparency = 0.4 }):Play()
	end
	story.Text = ""
	sleep(3.2)
	for _, label in { titleMain, titleSub } do
		TweenService:Create(label, TweenInfo.new(1), { TextTransparency = 1, TextStrokeTransparency = 1 }):Play()
	end
	sleep(0.8)
end

local function shotDuration(shot: Shot): number
	local seconds = 0
	for _, line in shot.lines do
		seconds += (utf8.len(line) or #line) * CHAR_TIME + HOLD
	end
	return seconds + (if shot.title then 4 else 0)
end

local function buildGui(player: Player)
	gui = Instance.new("ScreenGui")
	gui.Name = "Intro"
	gui.ResetOnSpawn = false
	gui.IgnoreGuiInset = true
	gui.DisplayOrder = 100

	local function bar(y: number, anchor: number)
		local f = Instance.new("Frame")
		f.Size = UDim2.new(1, 0, 0.14, 0)
		f.Position = UDim2.fromScale(0, y)
		f.AnchorPoint = Vector2.new(0, anchor)
		f.BackgroundColor3 = Color3.new(0, 0, 0)
		f.BorderSizePixel = 0
		f.Parent = gui
		return f
	end
	bar(0, 0)
	local bottom = bar(1, 1)

	story = Instance.new("TextLabel")
	story.Size = UDim2.new(0.8, 0, 0.8, 0)
	story.Position = UDim2.fromScale(0.5, 0.5)
	story.AnchorPoint = Vector2.new(0.5, 0.5)
	story.BackgroundTransparency = 1
	story.Font = Enum.Font.Garamond
	story.TextScaled = true
	story.TextWrapped = true
	story.TextColor3 = Color3.fromRGB(240, 225, 190)
	story.Text = ""
	story.Parent = bottom
	local size = Instance.new("UITextSizeConstraint")
	size.MaxTextSize = 30
	size.Parent = story

	local function title(text: string, y: number, textSize: number, color: Color3): TextLabel
		local l = Instance.new("TextLabel")
		l.Size = UDim2.new(1, 0, 0, textSize + 10)
		l.Position = UDim2.fromScale(0.5, y)
		l.AnchorPoint = Vector2.new(0.5, 0.5)
		l.BackgroundTransparency = 1
		l.Font = Enum.Font.Fantasy
		l.TextSize = textSize
		l.TextColor3 = color
		l.TextStrokeColor3 = Color3.new(0, 0, 0)
		l.TextTransparency = 1
		l.TextStrokeTransparency = 1
		l.Text = text
		l.Parent = gui
		return l
	end
	titleMain = title("GENGIS KHAN", 0.42, 84, Color3.fromRGB(235, 190, 80))
	titleSub = title("VERITY TYCOON", 0.54, 40, Color3.fromRGB(200, 40, 40))

	local skipButton = Instance.new("TextButton")
	skipButton.Size = UDim2.fromOffset(150, 36)
	skipButton.Position = UDim2.new(1, -20, 1, -20)
	skipButton.AnchorPoint = Vector2.new(1, 1)
	skipButton.BackgroundColor3 = Color3.fromRGB(40, 30, 20)
	skipButton.BackgroundTransparency = 0.2
	skipButton.Font = Enum.Font.GothamBold
	skipButton.TextSize = 16
	skipButton.TextColor3 = Color3.fromRGB(240, 225, 190)
	skipButton.Text = "Saltar intro  >"
	skipButton.ZIndex = 3
	skipButton.Parent = gui
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 8)
	corner.Parent = skipButton
	skipButton.Activated:Connect(function()
		skip = true
		-- corta ya el movimiento de camara de la toma; si no, sigue moviendo la
		-- camara un rato y pelea con la camara normal
		if cameraTween then
			cameraTween:Cancel()
		end
	end)

	blackout = Instance.new("Frame")
	blackout.Size = UDim2.fromScale(1, 1)
	blackout.BackgroundColor3 = Color3.new(0, 0, 0)
	blackout.BorderSizePixel = 0
	blackout.ZIndex = 2
	blackout.Parent = gui

	gui.Parent = player:WaitForChild("PlayerGui")
end

local function controls(player: Player): any
	local ok, result = pcall(function()
		local module = require(player:WaitForChild("PlayerScripts"):WaitForChild("PlayerModule") :: ModuleScript) :: any
		return module:GetControls()
	end)
	return if ok then result else nil
end

function Intro.start()
	local player = Players.LocalPlayer
	if Config.Intro and Config.Intro.Enabled == false then
		HUD.setIntroDone()
		return
	end
	buildGui(player)
	local character = player.Character or player.CharacterAdded:Wait()
	workspace:WaitForChild("Map", 15)
	local ctrl = controls(player)
	if ctrl then
		ctrl:Disable()
	end
	pcall(function()
		StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.All, false)
	end)

	local camera = workspace.CurrentCamera
	camera.CameraType = Enum.CameraType.Scriptable

	for i, shot in SHOTS do
		if skip then
			break
		end
		camera.CFrame = shot.from
		local tween = TweenService:Create(camera, TweenInfo.new(shotDuration(shot), Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), { CFrame = shot.to })
		cameraTween = tween
		tween:Play()
		if i == 1 then
			fade(1, 2)
		end
		for _, line in shot.lines do
			if skip then
				break
			end
			typewrite(line)
		end
		if shot.title and not skip then
			showTitle()
		end
	end

	-- vuelta al jugador, en el spawn del centro
	if cameraTween then
		cameraTween:Cancel()
		cameraTween = nil
	end
	skip = false
	story.Text = ""
	fade(0, 0.6)
	local root = character:FindFirstChild("HumanoidRootPart")
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if root and root:IsA("BasePart") then
		camera.CFrame = CFrame.lookAt(root.Position + Vector3.new(0, 8, 16), root.Position)
	end
	camera.CameraType = Enum.CameraType.Custom
	if humanoid then
		camera.CameraSubject = humanoid
	end
	pcall(function()
		StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.All, true)
	end)
	if ctrl then
		ctrl:Enable()
	end
	HUD.setIntroDone()
	fade(1, 1.2)
	gui:Destroy()
end

return Intro
