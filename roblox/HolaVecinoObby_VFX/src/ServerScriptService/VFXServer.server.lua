--!strict
-- Script: ServerScriptService > VFXServer
-- Detects game events on the server and tells every client to play the matching effect.
-- Clients never send anything back, so exploiters can't spam effects for others.

local CollectionService = game:GetService("CollectionService")
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

local function hookPart(eventName: string, instance: Instance)
	if not instance:IsA("BasePart") or hooked[instance] then
		return
	end
	local part = instance :: BasePart
	hooked[part] = true
	part.Touched:Connect(function(hit)
		onTouched(eventName, part, hit)
	end)
	part.Destroying:Once(function()
		hooked[part] = nil
	end)
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

-- Death ------------------------------------------------------------------------

local function onCharacterAdded(player: Player, character: Model)
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
end)

-- Game pass purchase -----------------------------------------------------------

MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, _gamePassId, wasPurchased)
	if wasPurchased then
		fire("GamePass", player, nil)
	end
end)
