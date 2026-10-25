--!strict
-- Lobby: coloca el modelo real de Verity en el pedestal (mirando al spawn)
-- y gestiona el obby: la lava te devuelve al inicio y el cofre de la meta
-- da monedas (con espera entre premios).

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local T = require(ReplicatedStorage.Shared.Locale).t
local Coins = require(script.Parent.Coins)
local VerityModel = require(script.Parent.VerityModel)

local Lobby = {}

local lastReward: { [Player]: number } = {}
local lastLava: { [Player]: number } = {}

local function playerFromHit(hit: BasePart): Player?
	local model = hit:FindFirstAncestorOfClass("Model")
	return if model then Players:GetPlayerFromCharacter(model) else nil
end

local function placeStatue(lobby: Instance)
	local statue = lobby:FindFirstChild("VerityStatue")
	local spot = statue and statue:FindFirstChild("StatueSpot")
	if not (statue and spot and spot:IsA("BasePart")) then
		return
	end
	if VerityModel.source() == "ServerStorage.VerityFallback" then
		return -- la estatua de piezas ya es ese mismo modelo
	end
	local model = VerityModel.statue()
	if not model then
		return
	end
	for _, child in statue:GetChildren() do
		if child:GetAttribute("StatueBody") then
			child:Destroy()
		end
	end
	local rootY = (model:GetAttribute("RootY") :: number?) or 8
	-- StatueSpot está girado 180°: el modelo (que mira a -Z) queda mirando al spawn
	model:PivotTo(spot.CFrame * CFrame.new(0, rootY, 0))
	model.Name = "VerityModel"
	model.Parent = statue
end

local function setupObby(lobby: Instance)
	local obby = lobby:FindFirstChild("Obby")
	if not obby then
		return
	end
	local start = obby:FindFirstChild("ObbyStart") :: BasePart?
	local spawnPoint = lobby:FindFirstChildWhichIsA("SpawnLocation", true)
	for _, part in obby:GetDescendants() do
		if not part:IsA("BasePart") then
			continue
		end
		if part:GetAttribute("ObbyLava") then
			part.Touched:Connect(function(hit)
				local player = playerFromHit(hit)
				local character = player and player.Character
				if not (player and character and start) then
					return
				end
				if os.clock() - (lastLava[player] or 0) < 0.5 then
					return
				end
				lastLava[player] = os.clock()
				character:PivotTo(start.CFrame + Vector3.new(0, 4, 0))
			end)
		elseif part:GetAttribute("ObbyGoal") then
			part.Touched:Connect(function(hit)
				local player = playerFromHit(hit)
				local character = player and player.Character
				if not (player and character) then
					return
				end
				local now = os.clock()
				local wait = Config.Coins.ObbyCooldown - (now - (lastReward[player] or -math.huge))
				if wait > 0 then
					return
				end
				lastReward[player] = now
				Coins.award(player, Config.Coins.ObbyReward, T("obby completado"))
				if spawnPoint then
					character:PivotTo(spawnPoint.CFrame + Vector3.new(0, 4, 0))
				end
			end)
		end
	end
end

function Lobby.start()
	local lobby = Workspace:WaitForChild("Lobby", 10)
	if not lobby then
		return
	end
	placeStatue(lobby)
	setupObby(lobby)
	Players.PlayerRemoving:Connect(function(player)
		lastReward[player] = nil
		lastLava[player] = nil
	end)
end

return Lobby
