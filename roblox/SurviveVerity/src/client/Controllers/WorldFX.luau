--!strict
-- Efectos locales: oro girando, lámparas parpadeantes, golpes, tótems,
-- viñeta de "radio de terror" y bloqueo de prompts para Verity.

local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local ProximityPromptService = game:GetService("ProximityPromptService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local Assets = require(ReplicatedStorage.Shared.Assets)
local Net = require(ReplicatedStorage.Shared.Net)
local UI = require(script.Parent.Parent.Lib.UI)

local player = Players.LocalPlayer

local TERROR_RADIUS = 45

local WorldFX = {}

local goldBlocks: { [BasePart]: CFrame } = {}
local vignette: Frame

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

local function onEffect(kind: string, position: Vector3)
	if kind == "Slash" then
		playSound("rbxasset://sounds/swordslash.wav", position, 1)
		burst(position, Color3.fromRGB(255, 40, 60), Assets.GlowOrb, 28, 14)
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
end

local function killerRoot(): BasePart?
	for _, other in Players:GetPlayers() do
		if other ~= player and other:GetAttribute("Role") == "Verity" then
			local character = other.Character
			local root = character and character:FindFirstChild("HumanoidRootPart")
			if root and root:IsA("BasePart") then
				return root
			end
		end
	end
	return nil
end

local function updateTerror()
	local intensity = 0
	if player:GetAttribute("Role") == "Survivor" then
		local character = player.Character
		local myRoot = character and character:FindFirstChild("HumanoidRootPart")
		local theirRoot = killerRoot()
		if myRoot and myRoot:IsA("BasePart") and theirRoot and not theirRoot.Anchored then
			local distance = (myRoot.Position - theirRoot.Position).Magnitude
			intensity = math.clamp(1 - distance / TERROR_RADIUS, 0, 1)
		end
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

	local function applyRole()
		-- Verity no puede recoger oro ni craftear.
		ProximityPromptService.Enabled = player:GetAttribute("Role") ~= "Verity"
	end
	player:GetAttributeChangedSignal("Role"):Connect(applyRole)
	applyRole()

	local flickerClock = 0
	RunService.RenderStepped:Connect(function(dt)
		local t = os.clock()
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
						light.Brightness = if math.random() < 0.12 then 0.1 else 0.9
					end
				end
			end
		end

		updateTerror()
	end)
end

return WorldFX
