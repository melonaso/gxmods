--!strict
-- Tragamonedas del lobby (solo diversión): pantalla con tres rodillos,
-- palanca que baja y sube, sonidos y luces de premio. El resultado lo decide
-- el servidor (Slots.luau); aquí solo se anima, y todos ven girar las
-- máquinas de los demás.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Locale = require(ReplicatedStorage.Shared.Locale)
local UI = require(script.Parent.Parent.Lib.UI)

local S = Config.Slots
local C = UI.Colors
local T = Locale.t

local Casino = {}

local LEVER_ANGLE = math.rad(-70) -- la palanca baja hacia quien juega (-Z)
local IDLE_TEXT = Locale.mark("Tira de la palanca")
local JACKPOT_COLORS = { Color3.fromRGB(255, 60, 80), Color3.fromRGB(255, 200, 60), Color3.fromRGB(80, 220, 255), Color3.fromRGB(140, 255, 120) }

type Machine = {
	screen: BasePart,
	reels: { TextLabel },
	status: TextLabel,
	arm: BasePart?,
	knob: BasePart?,
	pivot: CFrame,
	armOffset: CFrame,
	knobOffset: CFrame,
	light: BasePart?,
	lightColor: Color3,
	token: number,
}

local function showSymbol(label: TextLabel, index: number)
	local symbol = S.Symbols[index] or "?"
	label.Text = symbol
	label.TextColor3 = if symbol == "7" then C.Verity else Color3.fromRGB(40, 30, 40)
end

local function playAt(part: BasePart, id: string, volume: number, speed: number?)
	local sound = Instance.new("Sound")
	sound.SoundId = id
	sound.Volume = volume
	sound.PlaybackSpeed = speed or 1
	sound.RollOffMaxDistance = 50
	sound.Parent = part
	sound:Play()
	sound.Ended:Once(function()
		sound:Destroy()
	end)
end

local function setLever(m: Machine, angle: number)
	local rotated = m.pivot * CFrame.Angles(angle, 0, 0)
	if m.arm then
		m.arm.CFrame = rotated * m.armOffset
	end
	if m.knob then
		m.knob.CFrame = rotated * m.knobOffset
	end
end

local function pullLever(m: Machine)
	local value = Instance.new("NumberValue")
	value.Changed:Connect(function(angle)
		setLever(m, angle)
	end)
	UI.tween(value, 0.15, { Value = LEVER_ANGLE }, Enum.EasingStyle.Quad).Completed:Wait()
	UI.tween(value, 0.45, { Value = 0 }, Enum.EasingStyle.Back).Completed:Wait()
	value:Destroy()
	setLever(m, 0)
end

local function build(model: Instance): Machine?
	local screen = model:FindFirstChild("Screen")
	if not (screen and screen:IsA("BasePart")) then
		return nil
	end
	local surface = UI.new("SurfaceGui", {
		Name = "Reels",
		Face = Enum.NormalId.Front,
		SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud,
		PixelsPerStud = 60,
		LightInfluence = 0, -- la pantalla brilla en la oscuridad
		Parent = screen,
	})
	local root = UI.new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(16, 10, 22), BorderSizePixel = 0, Parent = surface }, {
		UI.new("UIGradient", { Rotation = 90, Color = ColorSequence.new(Color3.fromRGB(60, 20, 50), Color3.fromRGB(12, 8, 18)) }),
	})
	local reels = {}
	for i = 1, 3 do
		local frame = UI.new("Frame", {
			AnchorPoint = Vector2.new(0.5, 0.5),
			Position = UDim2.fromScale(0.2 + (i - 1) * 0.3, 0.4),
			Size = UDim2.fromScale(0.26, 0.6),
			BackgroundColor3 = Color3.fromRGB(245, 240, 230),
			Parent = root,
		}, { UI.corner(10), UI.stroke(0.2, Color3.fromRGB(255, 200, 60)) })
		local label = UI.label({ Size = UDim2.fromScale(1, 1), TextScaled = true, FontFace = UI.FontHeavy, Parent = frame })
		table.insert(reels, label)
	end
	local status = UI.label({
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.fromScale(0.5, 0.97),
		Size = UDim2.fromScale(0.9, 0.2),
		TextScaled = true,
		FontFace = UI.FontBold,
		TextColor3 = C.Gold,
		Text = T(IDLE_TEXT),
		Parent = root,
	})

	local arm = model:FindFirstChild("LeverArm")
	local knob = model:FindFirstChild("LeverKnob")
	local armPart = if arm and arm:IsA("BasePart") then arm else nil
	local knobPart = if knob and knob:IsA("BasePart") then knob else nil
	-- la palanca gira sobre el extremo inferior del brazo
	local pivot = if armPart then armPart.CFrame * CFrame.new(0, -armPart.Size.Y / 2, 0) else screen.CFrame
	local light = model:FindFirstChild("TopLight")
	local lightPart = if light and light:IsA("BasePart") then light else nil

	local m: Machine = {
		screen = screen,
		reels = reels,
		status = status,
		arm = armPart,
		knob = knobPart,
		pivot = pivot,
		armOffset = if armPart then pivot:ToObjectSpace(armPart.CFrame) else CFrame.new(),
		knobOffset = if knobPart then pivot:ToObjectSpace(knobPart.CFrame) else CFrame.new(),
		light = lightPart,
		lightColor = if lightPart then lightPart.Color else C.Gold,
		token = 0,
	}
	-- lo último que salió (o una tirada de muestra)
	local last = model:GetAttribute("SpinResult")
	local shown = { 1, 4, 6 }
	if typeof(last) == "string" then
		for i, v in string.split(last, ",") do
			shown[i] = tonumber(v) or shown[i]
		end
	end
	for i, label in reels do
		showSymbol(label, shown[i])
	end
	return m
end

local function celebrate(m: Machine, token: number, jackpot: boolean)
	if jackpot then
		m.status.Text = T("¡JACKPOT!")
		for k = 1, 3 do
			playAt(m.screen, "rbxasset://sounds/electronicpingshort.wav", 0.8, 1 + k * 0.2)
		end
		for k = 1, 16 do
			if m.token ~= token then
				break
			end
			if m.light then
				m.light.Color = JACKPOT_COLORS[k % #JACKPOT_COLORS + 1]
			end
			UI.pulse(m.status, 1.15)
			task.wait(0.12)
		end
		if m.light then
			m.light.Color = m.lightColor
		end
	else
		m.status.Text = T("¡Casi!")
		playAt(m.screen, "rbxasset://sounds/electronicpingshort.wav", 0.5, 0.8)
	end
end

local function spin(m: Machine, result: { number })
	m.token += 1
	local token = m.token
	task.spawn(pullLever, m)
	playAt(m.screen, "rbxasset://sounds/collide.wav", 0.6, 1.4)
	m.status.Text = T("¡Suerte!")
	local stopped = { false, false, false }
	local start = os.clock()
	local ticks = 0
	while m.token == token do
		local elapsed = os.clock() - start
		local spinning = false
		for i, label in m.reels do
			if not stopped[i] then
				if elapsed >= S.SpinTime * (0.375 + 0.25 * (i - 1)) then
					stopped[i] = true
					showSymbol(label, result[i])
					UI.pulse(label.Parent :: GuiObject, 1.15)
					playAt(m.screen, "rbxasset://sounds/clickfast.wav", 0.7, 0.8)
				else
					spinning = true
					showSymbol(label, math.random(1, #S.Symbols))
				end
			end
		end
		if not spinning then
			break
		end
		ticks += 1
		if ticks % 2 == 0 then
			playAt(m.screen, "rbxasset://sounds/clickfast.wav", 0.25, 1.6)
		end
		task.wait(0.06)
	end
	if m.token ~= token then
		return -- otra tirada empezó encima
	end
	local a, b, c = result[1], result[2], result[3]
	if a == b and b == c then
		celebrate(m, token, true)
	elseif a == b or b == c or a == c then
		celebrate(m, token, false)
	else
		m.status.Text = T("Otra vez")
	end
	task.delay(2.5, function()
		if m.token == token then
			m.status.Text = T(IDLE_TEXT)
		end
	end)
end

local function watch(model: Instance)
	local m = build(model)
	if not m then
		return
	end
	Locale.changed:Connect(function()
		m.token += 1 -- corta la animación en curso
		m.status.Text = T(IDLE_TEXT)
	end)
	model:GetAttributeChangedSignal("SpinId"):Connect(function()
		local raw = model:GetAttribute("SpinResult")
		if typeof(raw) ~= "string" then
			return
		end
		local result = {}
		for i, v in string.split(raw, ",") do
			result[i] = tonumber(v) or 1
		end
		task.spawn(spin, m, result)
	end)
end

function Casino.start()
	local lobby = Workspace:WaitForChild("Lobby", 30)
	if not lobby then
		return
	end
	for _, inst in lobby:GetDescendants() do
		if inst:GetAttribute("SlotMachine") then
			watch(inst)
		end
	end
end

return Casino
