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
