--!strict
-- Efectos locales: oro girando, lámparas parpadeantes, golpes, tótems,
-- viñeta de "radio de terror", bloqueo de prompts para Verity y la
-- revelación de cada minuto (Verity ve a los supervivientes en rojo; quien
-- es revelado recibe un pulso rojo en pantalla para que cambie de sitio).

local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local ProximityPromptService = game:GetService("ProximityPromptService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local SoundService = game:GetService("SoundService")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local Assets = require(ReplicatedStorage.Shared.Assets)
local Config = require(ReplicatedStorage.Shared.Config)
local Locale = require(ReplicatedStorage.Shared.Locale)
local Net = require(ReplicatedStorage.Shared.Net)
local UI = require(script.Parent.Parent.Lib.UI)

local player = Players.LocalPlayer

local TERROR_RADIUS = 45

local WorldFX = {}

local goldBlocks: { [BasePart]: CFrame } = {}
local coins: { [BasePart]: CFrame } = {}
local vignette: Frame
local flash: Frame
local revealedUntil = 0 -- os.clock() hasta el que dura mi aviso de revelación

local function playSound(id: string, position: Vector3, volume: number?)
	local holder = Instance.new("Part")
	holder.Anchored = true
	holder.CanCollide = false
	holder.CanQuery = false
	holder.Transparency = 1
	holder.Size = Vector3.one
	holder.Position = position
	holder.Parent = Workspace
	local sound = Instance.new("Sound")
	sound.SoundId = id
	sound.Volume = volume or 0.8
	sound.RollOffMaxDistance = 120
	sound.Parent = holder
	sound:Play()
	game:GetService("Debris"):AddItem(holder, 4)
	return holder
end

local function burst(position: Vector3, color: Color3, texture: string, count: number, speed: number)
	local holder = playSound("", position, 0)
	local emitter = Instance.new("ParticleEmitter")
	if texture ~= "" then
		emitter.Texture = texture
	end
	emitter.Color = ColorSequence.new(color)
	emitter.LightEmission = 1
	emitter.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.8), NumberSequenceKeypoint.new(1, 0) })
	emitter.Transparency = NumberSequence.new(0, 1)
	emitter.Lifetime = NumberRange.new(0.35, 0.7)
	emitter.Speed = NumberRange.new(speed * 0.5, speed)
	emitter.SpreadAngle = Vector2.new(180, 180)
	emitter.Rate = 0
	emitter.Parent = holder
	emitter:Emit(count)
end

local function shockRing(position: Vector3)
	local ring = Instance.new("Part")
	ring.Anchored = true
	ring.CanCollide = false
	ring.CanQuery = false
	ring.Transparency = 1
	ring.Size = Vector3.new(1, 0.05, 1)
	ring.CFrame = CFrame.new(position)
	ring.Parent = Workspace
	local decal = Instance.new("Decal")
	decal.Face = Enum.NormalId.Top
	decal.Texture = if Assets.ShockRing ~= "" then Assets.ShockRing else Assets.GlowOrb
	decal.Color3 = Color3.fromRGB(110, 230, 255)
	decal.Parent = ring
	UI.tween(ring, 0.9, { Size = Vector3.new(36, 0.05, 36) })
	UI.tween(decal, 0.9, { Transparency = 1 })
	game:GetService("Debris"):AddItem(ring, 1)
end

local screams: { Sound } = {}
local shakeUntil = 0
local shakeStrength = 0

-- Salpicadura de sangre: nube de líquido, gotas alargadas que caen y
-- sacudida de cámara según la distancia.
local function gore(position: Vector3)
	playSound("rbxasset://sounds/swordslash.wav", position, 1)
	playSound("rbxasset://sounds/collide.wav", position, 1)

	local holder = playSound("", position + Vector3.new(0, 1, 0), 0)
	local splash = Instance.new("ParticleEmitter")
	splash.Texture = if Assets.Splash ~= "" then Assets.Splash else Assets.GlowOrb
	splash.Color = ColorSequence.new(Color3.fromRGB(170, 8, 20), Color3.fromRGB(90, 0, 8))
	splash.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1.5), NumberSequenceKeypoint.new(0.4, 4), NumberSequenceKeypoint.new(1, 2.5) })
	splash.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.7, 0.3), NumberSequenceKeypoint.new(1, 1) })
	splash.Lifetime = NumberRange.new(0.5, 0.9)
	splash.Speed = NumberRange.new(8, 22)
	splash.SpreadAngle = Vector2.new(70, 70)
	splash.EmissionDirection = Enum.NormalId.Top
	splash.Acceleration = Vector3.new(0, -45, 0)
	splash.Rotation = NumberRange.new(0, 360)
	splash.Rate = 0
	splash.Parent = holder
	splash:Emit(26)

	local drops = Instance.new("ParticleEmitter")
	drops.Texture = if Assets.Streak ~= "" then Assets.Streak else Assets.GlowOrb
	drops.Color = ColorSequence.new(Color3.fromRGB(150, 4, 14))
	drops.Size = NumberSequence.new(0.6, 0.2)
	drops.Lifetime = NumberRange.new(0.8, 1.4)
	drops.Speed = NumberRange.new(20, 45)
	drops.SpreadAngle = Vector2.new(80, 80)
	drops.EmissionDirection = Enum.NormalId.Top
	drops.Acceleration = Vector3.new(0, -70, 0)
	drops.Orientation = Enum.ParticleOrientation.VelocityParallel
	drops.Rate = 0
	drops.Parent = holder
	drops:Emit(60)

	local camera = Workspace.CurrentCamera
	if camera then
		local distance = (camera.CFrame.Position - position).Magnitude
		local strength = math.clamp(1 - distance / 70, 0, 1)
		if strength > 0 then
			shakeStrength = strength
			shakeUntil = os.clock() + 0.45
		end
		-- destello rojo si estás muy cerca
		if distance < 30 then
			flash.BackgroundTransparency = 0.45
			UI.tween(flash, 0.8, { BackgroundTransparency = 1 })
		end
	end
end

local function radar(targets: { Model })
	for _, model in targets do
		if typeof(model) == "Instance" and model:IsA("Model") and model.Parent then
			local highlight = Instance.new("Highlight")
			highlight.Name = "RadarHighlight"
			highlight.FillColor = Color3.fromRGB(255, 60, 90)
			highlight.FillTransparency = 0.5
			highlight.OutlineColor = Color3.fromRGB(255, 200, 210)
			highlight.DepthMode = Enum.HighlightDepthMode.AlwaysOnTop
			highlight.Parent = model
			game:GetService("Debris"):AddItem(highlight, 6)
		end
	end
	playSound("rbxasset://sounds/electronicpingshort.wav", Workspace.CurrentCamera and Workspace.CurrentCamera.CFrame.Position or Vector3.zero, 0.6)
end

-- Grito de la víctima: suena en ella (sube con ella) mientras Verity la levanta.
local function grabScream(victimRoot: Instance)
	if typeof(victimRoot) ~= "Instance" or not victimRoot:IsA("BasePart") then
		return
	end
	local sound = Instance.new("Sound")
	sound.Name = "DeathScream"
	sound.SoundId = `rbxassetid://{Config.Music.DeathScream}`
	sound.Volume = 1.4
	sound.RollOffMinDistance = 15
	sound.RollOffMaxDistance = 160
	sound.Parent = victimRoot
	sound:Play()
	table.insert(screams, sound)
	game:GetService("Debris"):AddItem(sound, 6)
end

-- La explosión corta el grito en seco.
local function cutScreams()
	for _, sound in screams do
		sound:Stop()
		sound:Destroy()
	end
	table.clear(screams)
end

-- Crujidos de huesos durante la transformación.
local function boneCracks(position: Vector3)
	local id = Config.Sounds.BoneCracks
	if id ~= 0 then
		playSound(`rbxassetid://{id}`, position, 1.6)
		return
	end
	-- sustituto con sonidos internos: golpes secos agudos que se aceleran
	task.spawn(function()
		local t = 0
		local duration = Config.Round.TransformTime
		while t < duration do
			local progress = t / duration
			local holder = playSound("rbxasset://sounds/action_footsteps_plastic.mp3", position, 0.9 + progress * 0.6)
			local sound = holder:FindFirstChildOfClass("Sound")
			if sound then
				sound.PlaybackSpeed = 1.8 + math.random() * 1.2
				sound.TimePosition = math.random() * 0.2
			end
			local wait = (0.16 - progress * 0.11) * (0.6 + math.random() * 0.8)
			task.wait(wait)
			t += wait
		end
		local final = playSound("rbxasset://sounds/action_jump_land.mp3", position, 1.5)
		local sound = final:FindFirstChildOfClass("Sound")
		if sound then
			sound.PlaybackSpeed = 0.7
		end
	end)
end

local function transform(position: Vector3)
	boneCracks(position)
	burst(position, Color3.fromRGB(240, 210, 70), Assets.Splash, 30, 16)
	task.delay(Config.Round.TransformTime * 0.92, function()
		shockRing(position - Vector3.new(0, 7, 0))
		burst(position, Color3.fromRGB(255, 230, 120), Assets.GlowOrb, 40, 22)
		local camera = Workspace.CurrentCamera
		if camera then
			local strength = math.clamp(1 - (camera.CFrame.Position - position).Magnitude / 90, 0, 1)
			if strength > 0 then
				shakeStrength = strength
				shakeUntil = os.clock() + 0.6
			end
		end
	end)
end

-- Verity queda libre: un grito distorsionado y grave sobre dos golpes sordos,
-- sin distancia (se oye igual en todo el mapa), con temblor y destello.
local function released()
	local S = Config.Sounds
	local function global(id: number, speed: number, volume: number): Sound
		local s = Instance.new("Sound")
		s.SoundId = `rbxassetid://{id}`
		s.PlaybackSpeed = speed
		s.Volume = volume
		s.Parent = SoundService
		s:Play()
		game:GetService("Debris"):AddItem(s, 12)
		return s
	end
	global(S.ReleaseHit, 0.22, S.ReleaseVolume)
	task.delay(0.09, function()
		global(S.ReleaseHit, 0.3, S.ReleaseVolume * 0.8)
	end)
	local scream = global(S.ReleaseScream, 0.82, S.ReleaseVolume * 0.75)
	-- solo el primer alarido: se apaga a los ~4 s
	task.delay(3.2, function()
		TweenService:Create(scream, TweenInfo.new(1.4), { Volume = 0 }):Play()
	end)
	shakeStrength = 1
	shakeUntil = os.clock() + 0.9
	flash.BackgroundTransparency = 0.4
	UI.tween(flash, 1.2, { BackgroundTransparency = 1 })
end

local function onEffect(kind: string, position: any)
	if kind == "Grab" then
		grabScream(position)
		return
	elseif kind == "Transform" then
		transform(position)
		return
	elseif kind == "Released" then
		released()
		return
	end
	if kind == "Radar" then
		radar(position)
		return
	elseif kind == "Knockback" then
		local character = player.Character
		local root = character and character:FindFirstChild("HumanoidRootPart")
		if root and root:IsA("BasePart") and typeof(position) == "Vector3" then
			root.AssemblyLinearVelocity = position
		end
		return
	elseif kind == "Coin" then
		playSound("rbxasset://sounds/electronicpingshort.wav", position, 0.35)
		burst(position, Color3.fromRGB(255, 220, 90), Assets.Sparkle, 8, 5)
		return
	elseif kind == "Heal" then
		burst(position, Color3.fromRGB(120, 255, 140), Assets.Sparkle, 20, 6)
		return
	elseif kind == "Trap" then
		playSound("rbxasset://sounds/swordslash.wav", position, 0.9)
		burst(position, Color3.fromRGB(200, 200, 210), Assets.Sparkle, 12, 8)
		return
	elseif kind == "Push" then
		playSound("rbxasset://sounds/collide.wav", position, 0.8)
		shockRing(position)
		return
	elseif kind == "Revealed" then
		-- me han revelado: pulso rojo y tres latidos graves
		local duration = if typeof(position) == "number" then position else 5
		revealedUntil = os.clock() + duration
		local camera = Workspace.CurrentCamera
		local at = if camera then camera.CFrame.Position else Vector3.zero
		for i = 0, 2 do
			task.delay(i * 0.55, function()
				local holder = playSound("rbxasset://sounds/electronicpingshort.wav", at, 1)
				local sound = holder:FindFirstChildOfClass("Sound")
				if sound then
					sound.PlaybackSpeed = 0.35
				end
			end)
		end
		flash.BackgroundTransparency = 0.55
		UI.tween(flash, 0.9, { BackgroundTransparency = 1 })
		return
	end
	if kind == "Gore" then
		cutScreams()
		gore(position)
	elseif kind == "Totem" then
		playSound("rbxasset://sounds/electronicpingshort.wav", position, 1)
		burst(position + Vector3.new(0, 4, 0), Color3.fromRGB(120, 230, 255), Assets.Sparkle, 40, 10)
		shockRing(position + Vector3.new(0, 0.2, 0))
	elseif kind == "Pickup" then
		playSound("rbxasset://sounds/clickfast.wav", position, 0.6)
		burst(position, Color3.fromRGB(255, 220, 120), Assets.Sparkle, 14, 6)
	end
end

local function buildVignette()
	local gui = UI.new("ScreenGui", {
		Name = "TerrorVignette",
		IgnoreGuiInset = true,
		ResetOnSpawn = false,
		DisplayOrder = -1,
		Parent = player:WaitForChild("PlayerGui"),
	})
	vignette = UI.new("Frame", {
		Size = UDim2.fromScale(1, 1),
		BackgroundTransparency = 1,
		Parent = gui,
	})
	-- dos capas con degradado: bordes rojos, centro transparente
	for _, rotation in { 0, 90 } do
		UI.new("Frame", {
			Size = UDim2.fromScale(1, 1),
			BackgroundColor3 = Color3.fromRGB(150, 0, 20),
			BorderSizePixel = 0,
			Parent = vignette,
		}, {
			UI.new("UIGradient", {
				Rotation = rotation,
				Transparency = NumberSequence.new({
					NumberSequenceKeypoint.new(0, 0.2),
					NumberSequenceKeypoint.new(0.18, 1),
					NumberSequenceKeypoint.new(0.82, 1),
					NumberSequenceKeypoint.new(1, 0.2),
				}),
			}),
		})
	end
	vignette.Visible = false
	flash = UI.new("Frame", {
		Size = UDim2.fromScale(1, 1),
		BackgroundColor3 = Color3.fromRGB(140, 0, 12),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		Parent = gui,
	})
end

local function killerRoot(): BasePart?
	for _, character in CollectionService:GetTagged("VerityCharacter") do
		if character ~= player.Character then
			local root = character:FindFirstChild("HumanoidRootPart")
			if root and root:IsA("BasePart") then
				return root
			end
		end
	end
	return nil
end

-- Verity ve en rojo, a través de las paredes, a quien está revelado (o el
-- escondite donde está metido).
local function showReveal(inst: Instance)
	if player:GetAttribute("Role") ~= "Verity" or inst:FindFirstChild("RevealHighlight") then
		return
	end
	local highlight = Instance.new("Highlight")
	highlight.Name = "RevealHighlight"
	highlight.FillColor = Color3.fromRGB(255, 30, 50)
	highlight.FillTransparency = 0.45
	highlight.OutlineColor = Color3.fromRGB(255, 90, 100)
	highlight.OutlineTransparency = 0
	highlight.DepthMode = Enum.HighlightDepthMode.AlwaysOnTop
	highlight.Parent = inst
end

local function hideReveal(inst: Instance)
	local highlight = inst:FindFirstChild("RevealHighlight")
	if highlight then
		highlight:Destroy()
	end
end

local function updateTerror()
	local intensity = 0
	if player:GetAttribute("Role") == "Survivor" then
		local character = player.Character
		local myRoot = character and character:FindFirstChild("HumanoidRootPart")
		local theirRoot = killerRoot()
		local released = theirRoot and theirRoot.Parent and (theirRoot.Parent :: Instance):GetAttribute("Released")
		if myRoot and myRoot:IsA("BasePart") and theirRoot and released then
			local distance = (myRoot.Position - theirRoot.Position).Magnitude
			intensity = math.clamp(1 - distance / TERROR_RADIUS, 0, 1)
		end
	end
	if os.clock() < revealedUntil then
		intensity = math.max(intensity, 0.75) -- revelado: Verity sabe dónde estoy
	end
	vignette.Visible = intensity > 0
	if intensity > 0 then
		-- pulso tipo latido, más rápido cuanto más cerca
		local beat = (math.sin(os.clock() * (4 + intensity * 6)) + 1) / 2
		local alpha = 1 - intensity * (0.55 + beat * 0.3)
		for _, layer in vignette:GetChildren() do
			if layer:IsA("Frame") then
				layer.BackgroundTransparency = alpha
			end
		end
	end
end

local function trackGold(inst: Instance)
	if inst:IsA("BasePart") then
		goldBlocks[inst] = inst.CFrame
	end
end

function WorldFX.init()
	buildVignette()
end

function WorldFX.start()
	Net.get("Effect").OnClientEvent:Connect(onEffect)

	for _, inst in CollectionService:GetTagged("GoldBlock") do
		trackGold(inst)
	end
	CollectionService:GetInstanceAddedSignal("GoldBlock"):Connect(trackGold)
	CollectionService:GetInstanceRemovedSignal("GoldBlock"):Connect(function(inst)
		goldBlocks[inst :: BasePart] = nil
	end)
	local function trackCoin(inst: Instance)
		if inst:IsA("BasePart") then
			coins[inst] = inst.CFrame
		end
	end
	for _, inst in CollectionService:GetTagged("Coin") do
		trackCoin(inst)
	end
	CollectionService:GetInstanceAddedSignal("Coin"):Connect(trackCoin)
	CollectionService:GetInstanceRemovedSignal("Coin"):Connect(function(inst)
		coins[inst :: BasePart] = nil
	end)

	-- textos de los ProximityPrompt (esconderse, oro, tienda...) en mi idioma;
	-- si el servidor los cambia, se vuelven a traducir
	local hooked: { [ProximityPrompt]: boolean } = setmetatable({}, { __mode = "k" }) :: any
	ProximityPromptService.PromptShown:Connect(function(prompt)
		if hooked[prompt] then
			return
		end
		hooked[prompt] = true
		local function apply()
			local action, object = Locale.t(prompt.ActionText), Locale.t(prompt.ObjectText)
			if prompt.ActionText ~= action then
				prompt.ActionText = action
			end
			if prompt.ObjectText ~= object then
				prompt.ObjectText = object
			end
		end
		apply()
		prompt:GetPropertyChangedSignal("ActionText"):Connect(apply)
		prompt:GetPropertyChangedSignal("ObjectText"):Connect(apply)
	end)

	-- textos del mundo creados en el servidor (mesas de crafteo...), traducidos
	local function trackWorldText(inst: Instance)
		if inst:IsA("TextLabel") then
			Locale.renderWorldText(inst)
			inst.AttributeChanged:Connect(function()
				Locale.renderWorldText(inst)
			end)
		end
	end
	for _, inst in CollectionService:GetTagged("WorldText") do
		trackWorldText(inst)
	end
	CollectionService:GetInstanceAddedSignal("WorldText"):Connect(trackWorldText)

	for _, inst in CollectionService:GetTagged("Revealed") do
		showReveal(inst)
	end
	CollectionService:GetInstanceAddedSignal("Revealed"):Connect(showReveal)
	CollectionService:GetInstanceRemovedSignal("Revealed"):Connect(hideReveal)

	local function applyRole()
		-- Verity no puede recoger oro ni craftear.
		ProximityPromptService.Enabled = player:GetAttribute("Role") ~= "Verity"
		if player:GetAttribute("Role") ~= "Verity" then
			for _, inst in CollectionService:GetTagged("Revealed") do
				hideReveal(inst)
			end
		end
	end
	player:GetAttributeChangedSignal("Role"):Connect(applyRole)
	applyRole()

	local flickerClock = 0
	RunService.RenderStepped:Connect(function(dt)
		local t = os.clock()
		for coin, base in coins do
			if coin.Parent then
				-- de canto, girando sobre sí misma
				coin.CFrame = base * CFrame.new(0, math.sin(t * 3 + base.X) * 0.2, 0) * CFrame.Angles(0, t * 3, 0)
			else
				coins[coin] = nil
			end
		end
		for block, base in goldBlocks do
			if block.Parent then
				block.CFrame = base * CFrame.new(0, math.sin(t * 2) * 0.25, 0) * CFrame.Angles(0, t * 1.5, math.rad(15))
			else
				goldBlocks[block] = nil
			end
		end

		flickerClock += dt
		if flickerClock > 0.08 then
			flickerClock = 0
			for _, lamp in CollectionService:GetTagged("MansionLamp") do
				if lamp:GetAttribute("Flicker") then
					local light = lamp:FindFirstChildOfClass("PointLight")
					if light then
						-- parpadeo relativo al brillo original de cada lámpara
						local base = light:GetAttribute("BaseBrightness") :: number?
						if not base then
							base = light.Brightness
							light:SetAttribute("BaseBrightness", base)
						end
						light.Brightness = if math.random() < 0.12 then (base :: number) * 0.12 else base :: number
					end
				end
			end
		end

		updateTerror()
	end)

	-- la sacudida va después de la cámara para que no la sobrescriba
	RunService:BindToRenderStep("GoreShake", Enum.RenderPriority.Camera.Value + 1, function()
		local camera = Workspace.CurrentCamera
		if camera and os.clock() < shakeUntil then
			local m = shakeStrength * (shakeUntil - os.clock()) / 0.45
			camera.CFrame *= CFrame.Angles(math.rad(math.random(-10, 10) / 10 * 2 * m), math.rad(math.random(-10, 10) / 10 * 2 * m), 0)
		end
	end)
end

return WorldFX
