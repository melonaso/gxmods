--!strict
-- ModuleScript: ReplicatedStorage > VFX > Effects
-- Client-side effect builders. Everything created here is cleaned up with Debris.

local Debris = game:GetService("Debris")
local Lighting = game:GetService("Lighting")
local Players = game:GetService("Players")
local SoundService = game:GetService("SoundService")
local TweenService = game:GetService("TweenService")

local Config = require(script.Parent:WaitForChild("Config"))

local Effects = {}

type BurstOptions = {
	texture: string,
	colors: { Color3 },
	count: number,
	size: NumberRange,
	speed: NumberRange,
	lifetime: NumberRange,
	spread: number?,
	acceleration: Vector3?,
	direction: Enum.NormalId?,
	rotSpeed: NumberRange?,
	brightness: number?,
	growTo: number?,
}

local function colorSequence(colors: { Color3 }): ColorSequence
	if #colors == 1 then
		return ColorSequence.new(colors[1])
	end
	local keypoints = {}
	for i, color in colors do
		table.insert(keypoints, ColorSequenceKeypoint.new((i - 1) / (#colors - 1), color))
	end
	return ColorSequence.new(keypoints)
end

local function anchorAt(position: Vector3, lifetime: number): Attachment
	local attachment = Instance.new("Attachment")
	attachment.WorldPosition = position
	attachment.Parent = workspace.Terrain
	Debris:AddItem(attachment, lifetime)
	return attachment
end

local function burst(attachment: Attachment, options: BurstOptions)
	local emitter = Instance.new("ParticleEmitter")
	emitter.Texture = options.texture
	emitter.Color = colorSequence(options.colors)
	emitter.LightEmission = 1
	emitter.Brightness = options.brightness or 2
	emitter.Speed = options.speed
	emitter.Lifetime = options.lifetime
	emitter.SpreadAngle = Vector2.new(options.spread or 180, options.spread or 180)
	emitter.Acceleration = options.acceleration or Vector3.zero
	emitter.EmissionDirection = options.direction or Enum.NormalId.Top
	emitter.Rotation = NumberRange.new(0, 360)
	emitter.RotSpeed = options.rotSpeed or NumberRange.new(-90, 90)
	emitter.Drag = 2
	emitter.Enabled = false
	local endSize = options.growTo or 0
	emitter.Size = NumberSequence.new({
		NumberSequenceKeypoint.new(0, options.size.Min),
		NumberSequenceKeypoint.new(0.3, options.size.Max),
		NumberSequenceKeypoint.new(1, endSize),
	})
	emitter.Transparency = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0),
		NumberSequenceKeypoint.new(0.7, 0.2),
		NumberSequenceKeypoint.new(1, 1),
	})
	emitter.Parent = attachment
	emitter:Emit(options.count)
end

local function flashLight(attachment: Attachment, color: Color3, range: number, duration: number)
	local light = Instance.new("PointLight")
	light.Color = color
	light.Range = range
	light.Brightness = 6
	light.Shadows = false
	light.Parent = attachment
	TweenService:Create(light, TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
		Brightness = 0,
	}):Play()
end

local function playSound(id: string, position: Vector3?)
	if id == "" then
		return
	end
	local sound = Instance.new("Sound")
	sound.SoundId = id
	sound.Volume = 0.8
	if position then
		sound.Parent = anchorAt(position, 10)
		sound.RollOffMaxDistance = 120
	else
		sound.Parent = SoundService
	end
	sound.Ended:Once(function()
		sound:Destroy()
	end)
	sound:Play()
	Debris:AddItem(sound, 10)
end

-- Short full-screen color flash plus a bloom pulse for the local player only.
function Effects.ScreenFlash(color: Color3, strength: number)
	local playerGui = Players.LocalPlayer:FindFirstChildOfClass("PlayerGui")
	if not playerGui then
		return
	end
	local gui = Instance.new("ScreenGui")
	gui.IgnoreGuiInset = true
	gui.DisplayOrder = 50
	gui.ResetOnSpawn = false
	local frame = Instance.new("Frame")
	frame.Size = UDim2.fromScale(1, 1)
	frame.BackgroundColor3 = color
	frame.BackgroundTransparency = 1 - strength
	frame.BorderSizePixel = 0
	frame.Parent = gui
	gui.Parent = playerGui
	TweenService:Create(frame, TweenInfo.new(0.6, Enum.EasingStyle.Quad), { BackgroundTransparency = 1 }):Play()
	Debris:AddItem(gui, 0.7)

	local bloom = Instance.new("BloomEffect")
	bloom.Intensity = 1.5
	bloom.Size = 40
	bloom.Threshold = 0.8
	bloom.Parent = Lighting
	TweenService:Create(bloom, TweenInfo.new(0.8, Enum.EasingStyle.Quad), { Intensity = 0 }):Play()
	Debris:AddItem(bloom, 0.9)
end

-- Animated text banner in the upper middle of the screen.
function Effects.Banner(text: string, color: Color3)
	local playerGui = Players.LocalPlayer:FindFirstChildOfClass("PlayerGui")
	if not playerGui then
		return
	end
	local gui = Instance.new("ScreenGui")
	gui.DisplayOrder = 60
	gui.ResetOnSpawn = false
	local label = Instance.new("TextLabel")
	label.AnchorPoint = Vector2.new(0.5, 0.5)
	label.Position = UDim2.fromScale(0.5, 0.22)
	label.Size = UDim2.fromScale(0.6, 0.1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.FredokaOne
	label.Text = text
	label.TextScaled = true
	label.TextColor3 = color
	label.TextStrokeTransparency = 0
	label.TextStrokeColor3 = Color3.new(0, 0, 0)
	local scale = Instance.new("UIScale")
	scale.Scale = 0.2
	scale.Parent = label
	label.Parent = gui
	gui.Parent = playerGui

	TweenService:Create(scale, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { Scale = 1 }):Play()
	task.delay(1.6, function()
		TweenService:Create(label, TweenInfo.new(0.5), { TextTransparency = 1, TextStrokeTransparency = 1 }):Play()
	end)
	Debris:AddItem(gui, 2.2)
end

local T = Config.Textures

function Effects.Checkpoint(position: Vector3)
	local colors = Config.Colors.Checkpoint
	local a = anchorAt(position, 3)
	burst(a, {
		texture = T.Ring, colors = colors, count = 3, spread = 0,
		size = NumberRange.new(1, 10), speed = NumberRange.new(0), lifetime = NumberRange.new(0.6, 0.8),
		rotSpeed = NumberRange.new(0), growTo = 14,
	})
	burst(a, {
		texture = T.Sparkle, colors = colors, count = 30, spread = 35,
		size = NumberRange.new(0.4, 1.2), speed = NumberRange.new(12, 22), lifetime = NumberRange.new(0.8, 1.4),
		acceleration = Vector3.new(0, -12, 0),
	})
	burst(a, {
		texture = T.Glow, colors = colors, count = 2, spread = 0,
		size = NumberRange.new(4, 8), speed = NumberRange.new(0), lifetime = NumberRange.new(0.5),
	})
	flashLight(a, colors[1], 18, 0.8)
	playSound(Config.Sounds.Checkpoint, position)
end

function Effects.LobbyEnd(position: Vector3)
	local colors = Config.Colors.LobbyEnd
	local a = anchorAt(position, 4)
	burst(a, {
		texture = T.Glow, colors = colors, count = 3, spread = 0,
		size = NumberRange.new(6, 12), speed = NumberRange.new(0), lifetime = NumberRange.new(0.7),
	})
	burst(a, {
		texture = T.Sparkle, colors = colors, count = 50,
		size = NumberRange.new(0.5, 1.5), speed = NumberRange.new(10, 25), lifetime = NumberRange.new(1, 2),
		acceleration = Vector3.new(0, -8, 0),
	})
	burst(a, {
		texture = T.Ring, colors = colors, count = 2, spread = 0,
		size = NumberRange.new(2, 12), speed = NumberRange.new(0), lifetime = NumberRange.new(0.8),
		rotSpeed = NumberRange.new(0), growTo = 20,
	})
	flashLight(a, colors[1], 24, 1.2)
	playSound(Config.Sounds.LobbyEnd, position)
end

function Effects.Finish(position: Vector3)
	local colors = Config.Colors.Finish
	playSound(Config.Sounds.Finish, position)
	-- Three staggered firework bursts above the finish line.
	for i = 1, 3 do
		task.delay((i - 1) * 0.35, function()
			local offset = Vector3.new(math.random(-8, 8), 10 + math.random(0, 6), math.random(-8, 8))
			local a = anchorAt(position + offset, 4)
			burst(a, {
				texture = T.Spark, colors = colors, count = 60,
				size = NumberRange.new(0.6, 1.6), speed = NumberRange.new(25, 40), lifetime = NumberRange.new(1, 1.8),
				acceleration = Vector3.new(0, -20, 0), rotSpeed = NumberRange.new(0),
			})
			burst(a, {
				texture = T.Sparkle, colors = colors, count = 25,
				size = NumberRange.new(0.5, 1.2), speed = NumberRange.new(5, 12), lifetime = NumberRange.new(1.5, 2.5),
				acceleration = Vector3.new(0, -4, 0),
			})
			burst(a, {
				texture = T.Glow, colors = colors, count = 1, spread = 0,
				size = NumberRange.new(10, 16), speed = NumberRange.new(0), lifetime = NumberRange.new(0.5),
			})
			flashLight(a, colors[i] or colors[1], 40, 1)
		end)
	end
end

function Effects.Death(position: Vector3)
	local colors = Config.Colors.Death
	local a = anchorAt(position, 3)
	burst(a, {
		texture = T.Splash, colors = colors, count = 6, spread = 60,
		size = NumberRange.new(2, 5), speed = NumberRange.new(4, 10), lifetime = NumberRange.new(0.5, 0.9),
		acceleration = Vector3.new(0, -30, 0),
	})
	burst(a, {
		texture = T.Spark, colors = colors, count = 20,
		size = NumberRange.new(0.3, 0.8), speed = NumberRange.new(15, 30), lifetime = NumberRange.new(0.4, 0.8),
		acceleration = Vector3.new(0, -25, 0), rotSpeed = NumberRange.new(0),
	})
	burst(a, {
		texture = T.Glow, colors = colors, count = 2, spread = 0,
		size = NumberRange.new(5, 9), speed = NumberRange.new(0), lifetime = NumberRange.new(0.4),
	})
	flashLight(a, colors[1], 16, 0.6)
	playSound(Config.Sounds.Death, position)
end

-- Follows the buyer's character so the effect stays on them while they move.
function Effects.GamePass(character: Model)
	local root = character:FindFirstChild("HumanoidRootPart")
	if not root or not root:IsA("BasePart") then
		return
	end
	local colors = Config.Colors.GamePass
	local a = Instance.new("Attachment")
	a.Position = Vector3.new(0, -2.5, 0)
	a.Parent = root
	Debris:AddItem(a, 5)

	burst(a, {
		texture = T.Ring, colors = colors, count = 3, spread = 0,
		size = NumberRange.new(2, 8), speed = NumberRange.new(0), lifetime = NumberRange.new(0.8),
		rotSpeed = NumberRange.new(0), growTo = 16,
	})
	burst(a, {
		texture = T.Glow, colors = colors, count = 3, spread = 0,
		size = NumberRange.new(4, 9), speed = NumberRange.new(0), lifetime = NumberRange.new(0.8),
	})
	-- Rising sparkle column that keeps emitting for a moment.
	local column = Instance.new("ParticleEmitter")
	column.Texture = T.Sparkle
	column.Color = colorSequence(colors)
	column.LightEmission = 1
	column.Brightness = 3
	column.Rate = 60
	column.Speed = NumberRange.new(6, 12)
	column.SpreadAngle = Vector2.new(20, 20)
	column.Lifetime = NumberRange.new(1, 1.6)
	column.Size = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0.6),
		NumberSequenceKeypoint.new(1, 0),
	})
	column.Rotation = NumberRange.new(0, 360)
	column.RotSpeed = NumberRange.new(-120, 120)
	column.Parent = a
	task.delay(2, function()
		column.Enabled = false
	end)
	flashLight(a, colors[1], 20, 2)
	playSound(Config.Sounds.GamePass, nil)
end

return Effects
