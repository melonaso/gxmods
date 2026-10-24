-- Hola Vecino obby VFX installer.
-- Paste ALL of this into Studio: View > Command Bar, then press Enter.
-- Re-running it replaces the previous VFX scripts.
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local vfx = ReplicatedStorage:FindFirstChild("VFX")
if not vfx then
	vfx = Instance.new("Folder")
	vfx.Name = "VFX"
	vfx.Parent = ReplicatedStorage
end
local function install(className, name, parent, source)
	local old = parent:FindFirstChild(name)
	if old then old:Destroy() end
	local script = Instance.new(className)
	script.Name = name
	script.Source = source
	script.Parent = parent
end
install("ModuleScript", "Config", vfx, [=[
--!strict
-- ModuleScript: ReplicatedStorage > VFX > Config
-- Central configuration for "De izquierda a derecha hola vecino obby" special effects.
-- Particle textures were generated with ForgeGUI and published to Roblox.

local Config = {}

-- Particle textures (ForgeGUI). These are the uploaded Decal ids; VFXServer converts
-- them to Image ids at runtime, so you can also put plain Image ids here.
Config.Textures = {
	Sparkle = "rbxassetid://84408672280834",
	Glow = "rbxassetid://140554714981336",
	Splash = "rbxassetid://124800911923236",
	Spark = "rbxassetid://134074808117970",
	Ring = "rbxassetid://85856607052166",
}

-- Sound ids (optional). Leave "" to play no sound for that event.
-- Use any audio from the Creator Store, e.g. "rbxassetid://1234567890".
Config.Sounds = {
	Checkpoint = "",
	LobbyEnd = "",
	Finish = "",
	Death = "",
	GamePass = "",
}

Config.Colors = {
	Checkpoint = { Color3.fromRGB(80, 255, 170), Color3.fromRGB(80, 200, 255) },
	LobbyEnd = { Color3.fromRGB(255, 220, 90), Color3.fromRGB(255, 150, 60) },
	Finish = { Color3.fromRGB(255, 90, 90), Color3.fromRGB(255, 220, 80), Color3.fromRGB(90, 200, 255) },
	Death = { Color3.fromRGB(255, 70, 90), Color3.fromRGB(150, 60, 255) },
	GamePass = { Color3.fromRGB(255, 230, 120), Color3.fromRGB(255, 140, 255) },
}

-- How the server finds trigger parts. A part counts when it carries the
-- CollectionService tag, OR lives inside the folder of the same name in Workspace,
-- OR its lowercase name matches one of the Names patterns.
-- Every SpawnLocation also counts as a checkpoint (most obby kits use them).
Config.Triggers = {
	Checkpoint = { Tag = "Checkpoint", Folder = "Checkpoints", Names = { "^checkpoint" } },
	LobbyEnd = { Tag = "LobbyEnd", Folder = "LobbyEnd", Names = { "^lobbyend", "^finlobby" } },
	Finish = { Tag = "Finish", Folder = "Finish", Names = { "^finish", "^meta$", "^win$" } },
}
Config.SpawnLocationsAreCheckpoints = true

-- Show a text banner on screen for the player who triggered the event.
Config.Banners = {
	Checkpoint = "¡Checkpoint!",
	LobbyEnd = "¡Saliste del lobby!",
	Finish = "¡LLEGASTE AL FINAL!",
	GamePass = "¡Gracias por tu compra!",
}

-- Seconds before the same player can retrigger the same part (re-touching, respawning).
Config.TouchCooldown = 3

return Config
]=])
install("ModuleScript", "Effects", vfx, [=[
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

local VFX = script.Parent

-- Prefer the Image id the server converted from the uploaded Decal id.
local function tex(name: string): string
	local converted = VFX:GetAttribute("Texture_" .. name)
	if typeof(converted) == "string" and converted ~= "" then
		return converted
	end
	return Config.Textures[name]
end

function Effects.Checkpoint(position: Vector3)
	local colors = Config.Colors.Checkpoint
	local a = anchorAt(position, 3)
	burst(a, {
		texture = tex("Ring"), colors = colors, count = 3, spread = 0,
		size = NumberRange.new(1, 10), speed = NumberRange.new(0), lifetime = NumberRange.new(0.6, 0.8),
		rotSpeed = NumberRange.new(0), growTo = 14,
	})
	burst(a, {
		texture = tex("Sparkle"), colors = colors, count = 30, spread = 35,
		size = NumberRange.new(0.4, 1.2), speed = NumberRange.new(12, 22), lifetime = NumberRange.new(0.8, 1.4),
		acceleration = Vector3.new(0, -12, 0),
	})
	burst(a, {
		texture = tex("Glow"), colors = colors, count = 2, spread = 0,
		size = NumberRange.new(4, 8), speed = NumberRange.new(0), lifetime = NumberRange.new(0.5),
	})
	flashLight(a, colors[1], 18, 0.8)
	playSound(Config.Sounds.Checkpoint, position)
end

function Effects.LobbyEnd(position: Vector3)
	local colors = Config.Colors.LobbyEnd
	local a = anchorAt(position, 4)
	burst(a, {
		texture = tex("Glow"), colors = colors, count = 3, spread = 0,
		size = NumberRange.new(6, 12), speed = NumberRange.new(0), lifetime = NumberRange.new(0.7),
	})
	burst(a, {
		texture = tex("Sparkle"), colors = colors, count = 50,
		size = NumberRange.new(0.5, 1.5), speed = NumberRange.new(10, 25), lifetime = NumberRange.new(1, 2),
		acceleration = Vector3.new(0, -8, 0),
	})
	burst(a, {
		texture = tex("Ring"), colors = colors, count = 2, spread = 0,
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
				texture = tex("Spark"), colors = colors, count = 60,
				size = NumberRange.new(0.6, 1.6), speed = NumberRange.new(25, 40), lifetime = NumberRange.new(1, 1.8),
				acceleration = Vector3.new(0, -20, 0), rotSpeed = NumberRange.new(0),
			})
			burst(a, {
				texture = tex("Sparkle"), colors = colors, count = 25,
				size = NumberRange.new(0.5, 1.2), speed = NumberRange.new(5, 12), lifetime = NumberRange.new(1.5, 2.5),
				acceleration = Vector3.new(0, -4, 0),
			})
			burst(a, {
				texture = tex("Glow"), colors = colors, count = 1, spread = 0,
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
		texture = tex("Splash"), colors = colors, count = 6, spread = 60,
		size = NumberRange.new(2, 5), speed = NumberRange.new(4, 10), lifetime = NumberRange.new(0.5, 0.9),
		acceleration = Vector3.new(0, -30, 0),
	})
	burst(a, {
		texture = tex("Spark"), colors = colors, count = 20,
		size = NumberRange.new(0.3, 0.8), speed = NumberRange.new(15, 30), lifetime = NumberRange.new(0.4, 0.8),
		acceleration = Vector3.new(0, -25, 0), rotSpeed = NumberRange.new(0),
	})
	burst(a, {
		texture = tex("Glow"), colors = colors, count = 2, spread = 0,
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
		texture = tex("Ring"), colors = colors, count = 3, spread = 0,
		size = NumberRange.new(2, 8), speed = NumberRange.new(0), lifetime = NumberRange.new(0.8),
		rotSpeed = NumberRange.new(0), growTo = 16,
	})
	burst(a, {
		texture = tex("Glow"), colors = colors, count = 3, spread = 0,
		size = NumberRange.new(4, 9), speed = NumberRange.new(0), lifetime = NumberRange.new(0.8),
	})
	-- Rising sparkle column that keeps emitting for a moment.
	local column = Instance.new("ParticleEmitter")
	column.Texture = tex("Sparkle")
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
]=])
install("Script", "VFXServer", game:GetService("ServerScriptService"), [=[
--!strict
-- Script: ServerScriptService > VFXServer
-- Detects game events on the server and tells every client to play the matching effect.
-- Clients never send anything back, so exploiters can't spam effects for others.

local CollectionService = game:GetService("CollectionService")
local InsertService = game:GetService("InsertService")
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")

local VFX = ReplicatedStorage:WaitForChild("VFX")
local Config = require(VFX:WaitForChild("Config"))

local remote = Instance.new("RemoteEvent")
remote.Name = "VFXEvent"
remote.Parent = VFX

-- Other server scripts can trigger effects too:
--   ServerScriptService.PlayVFX:Fire("GamePass", player)          -- e.g. after a developer product
--   ServerScriptService.PlayVFX:Fire("Checkpoint", player, part.Position)
local playVFX = Instance.new("BindableEvent")
playVFX.Name = "PlayVFX"
playVFX.Parent = ServerScriptService

local function fire(eventName: string, player: Player, position: Vector3?)
	remote:FireAllClients(eventName, player, position)
end

playVFX.Event:Connect(fire)

-- Touch triggers ---------------------------------------------------------------

local lastTouch: { [Player]: { [BasePart]: number } } = {}
local reachedCheckpoints: { [Player]: { [BasePart]: boolean } } = {}
local spawnedAt: { [Player]: number } = {}

-- Touches this soon after spawning are the player landing on their spawn, not reaching it.
local SPAWN_GRACE = 1.5

local function playerFromHit(hit: BasePart): Player?
	local character = hit:FindFirstAncestorOfClass("Model")
	if not character then
		return nil
	end
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if not humanoid or humanoid.Health <= 0 then
		return nil
	end
	return Players:GetPlayerFromCharacter(character)
end

local function onTouched(eventName: string, part: BasePart, hit: BasePart)
	local player = playerFromHit(hit)
	if not player then
		return
	end

	if eventName == "Checkpoint" then
		-- Only the first time this player reaches this checkpoint, so respawning on it stays quiet.
		local reached = reachedCheckpoints[player]
		if not reached then
			reached = {}
			reachedCheckpoints[player] = reached
		end
		if reached[part] then
			return
		end
		reached[part] = true
		if os.clock() - (spawnedAt[player] or -math.huge) < SPAWN_GRACE then
			return
		end
	else
		local touches = lastTouch[player]
		if not touches then
			touches = {}
			lastTouch[player] = touches
		end
		local now = os.clock()
		if now - (touches[part] or -math.huge) < Config.TouchCooldown then
			return
		end
		touches[part] = now
	end

	fire(eventName, player, part.Position)
end

local hooked: { [BasePart]: boolean } = {}
local hookedCount: { [string]: number } = {}

local function hookPart(eventName: string, instance: Instance)
	if not instance:IsA("BasePart") or hooked[instance] then
		return
	end
	local part = instance :: BasePart
	hooked[part] = true
	hookedCount[eventName] = (hookedCount[eventName] or 0) + 1
	part.Touched:Connect(function(hit)
		onTouched(eventName, part, hit)
	end)
	part.Destroying:Once(function()
		hooked[part] = nil
	end)
end

-- Name / SpawnLocation based detection, so the system works without tags.
local function classify(instance: Instance): string?
	if not instance:IsA("BasePart") then
		return nil
	end
	if Config.SpawnLocationsAreCheckpoints and instance:IsA("SpawnLocation") then
		return "Checkpoint"
	end
	local name = string.lower(instance.Name)
	for eventName, trigger in Config.Triggers do
		for _, pattern in trigger.Names do
			if string.find(name, pattern) then
				return eventName
			end
		end
	end
	return nil
end

local function hookByName(instance: Instance)
	local eventName = classify(instance)
	if eventName then
		hookPart(eventName, instance)
	end
end

for eventName, trigger in Config.Triggers do
	for _, tagged in CollectionService:GetTagged(trigger.Tag) do
		hookPart(eventName, tagged)
	end
	CollectionService:GetInstanceAddedSignal(trigger.Tag):Connect(function(tagged)
		hookPart(eventName, tagged)
	end)

	local folder = workspace:FindFirstChild(trigger.Folder)
	if folder then
		for _, descendant in folder:GetDescendants() do
			hookPart(eventName, descendant)
		end
		folder.DescendantAdded:Connect(function(descendant)
			hookPart(eventName, descendant)
		end)
	end
end

for _, descendant in workspace:GetDescendants() do
	hookByName(descendant)
end
workspace.DescendantAdded:Connect(hookByName)

print(string.format(
	"[VFX] Listo. Checkpoints: %d | Final del lobby: %d | Meta: %d",
	hookedCount.Checkpoint or 0,
	hookedCount.LobbyEnd or 0,
	hookedCount.Finish or 0
))
if (hookedCount.LobbyEnd or 0) == 0 then
	warn("[VFX] No encontré la parte del final del lobby: ponle el tag 'LobbyEnd' o llámala 'LobbyEnd'.")
end
if (hookedCount.Finish or 0) == 0 then
	warn("[VFX] No encontré la meta: ponle el tag 'Finish' o llámala 'Finish'.")
end

-- Texture ids ------------------------------------------------------------------
-- Uploaded images come back as Decal ids, which ParticleEmitters can't display.
-- Load each Decal (works because the place owner owns the asset) and share the
-- real Image id with clients through attributes on the VFX folder.

for textureName, id in Config.Textures do
	task.spawn(function()
		local assetId = tonumber(string.match(id, "%d+"))
		if not assetId then
			return
		end
		local ok, model = pcall(InsertService.LoadAsset, InsertService, assetId)
		if not ok or not model then
			return -- Already an Image id (or not loadable): clients use Config as is.
		end
		local decal = model:FindFirstChildWhichIsA("Decal", true)
		if decal and decal.Texture ~= "" then
			VFX:SetAttribute("Texture_" .. textureName, decal.Texture)
		end
		model:Destroy()
	end)
end

-- Death ------------------------------------------------------------------------

local function onCharacterAdded(player: Player, character: Model)
	spawnedAt[player] = os.clock()
	local humanoid = character:WaitForChild("Humanoid", 10)
	if not humanoid or not humanoid:IsA("Humanoid") then
		return
	end
	humanoid.Died:Once(function()
		local root = character:FindFirstChild("HumanoidRootPart")
		local position = if root and root:IsA("BasePart") then root.Position else character:GetPivot().Position
		fire("Death", player, position)
	end)
end

local function onPlayerAdded(player: Player)
	player.CharacterAdded:Connect(function(character)
		onCharacterAdded(player, character)
	end)
	if player.Character then
		onCharacterAdded(player, player.Character)
	end
end

Players.PlayerAdded:Connect(onPlayerAdded)
for _, player in Players:GetPlayers() do
	task.spawn(onPlayerAdded, player)
end

Players.PlayerRemoving:Connect(function(player)
	lastTouch[player] = nil
	reachedCheckpoints[player] = nil
	spawnedAt[player] = nil
end)

-- Game pass purchase -----------------------------------------------------------

MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, _gamePassId, wasPurchased)
	if wasPurchased then
		fire("GamePass", player, nil)
	end
end)
]=])
install("LocalScript", "VFXClient", game:GetService("StarterPlayer"):WaitForChild("StarterPlayerScripts"), [=[
--!strict
-- LocalScript: StarterPlayer > StarterPlayerScripts > VFXClient
-- Plays the world effect for everyone, and the screen flash + banner only for
-- the player who triggered the event.

local ContentProvider = game:GetService("ContentProvider")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local VFX = ReplicatedStorage:WaitForChild("VFX")
local Config = require(VFX:WaitForChild("Config"))
local Effects = require(VFX:WaitForChild("Effects"))
local remote = VFX:WaitForChild("VFXEvent") :: RemoteEvent

local localPlayer = Players.LocalPlayer

-- Preload textures so the first effect doesn't pop in blank. Runs again whenever
-- the server shares a converted texture id.
local function preload()
	local assets = {}
	for textureName, id in Config.Textures do
		local decal = Instance.new("Decal")
		decal.Texture = VFX:GetAttribute("Texture_" .. textureName) or id
		table.insert(assets, decal)
	end
	ContentProvider:PreloadAsync(assets)
end
task.spawn(preload)
VFX.AttributeChanged:Connect(function()
	task.spawn(preload)
end)

print("[VFX] Cliente listo.")

local function personal(eventName: string, color: Color3, strength: number)
	Effects.ScreenFlash(color, strength)
	local text = Config.Banners[eventName]
	if text then
		Effects.Banner(text, color)
	end
end

remote.OnClientEvent:Connect(function(eventName: string, player: Player, position: Vector3?)
	local isMe = player == localPlayer
	local colors = Config.Colors[eventName]
	if not colors then
		return
	end

	if eventName == "GamePass" then
		if player.Character then
			Effects.GamePass(player.Character)
		end
		if isMe then
			personal(eventName, colors[1], 0.45)
		end
		return
	end

	if not position then
		return
	end

	if eventName == "Checkpoint" then
		Effects.Checkpoint(position)
		if isMe then
			personal(eventName, colors[1], 0.2)
		end
	elseif eventName == "LobbyEnd" then
		Effects.LobbyEnd(position)
		if isMe then
			personal(eventName, colors[1], 0.3)
		end
	elseif eventName == "Finish" then
		Effects.Finish(position)
		if isMe then
			personal(eventName, colors[2], 0.5)
		end
	elseif eventName == "Death" then
		Effects.Death(position)
		if isMe then
			Effects.ScreenFlash(colors[1], 0.35)
		end
	end
end)
]=])
ChangeHistoryService:SetWaypoint("Install Hola Vecino VFX")
print("[VFX] Instalado. Dale a Play y revisa el Output.")
