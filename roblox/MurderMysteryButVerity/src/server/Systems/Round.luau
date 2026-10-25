--!strict
-- Bucle principal: espera -> intermedio -> partida -> resultados.
-- El estado se replica con atributos de Workspace:
--   Phase, PhaseEndsAt (GetServerTimeNow), Totems, MaxTotems, SurvivorsAlive, MapName

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Net = require(ReplicatedStorage.Shared.Net)
local Crafting = require(script.Parent.Crafting)
local Killer = require(script.Parent.Killer)
local MapService = require(script.Parent.MapService)
local PlayerData = require(script.Parent.PlayerData)

local R = Config.Round

local Round = {}

local survivors: { [Player]: boolean } = {} -- jugador -> vivo
local endsAt = 0
local totems = 0
local currentMap: Model? = nil

local function now(): number
	return Workspace:GetServerTimeNow()
end

local function setPhase(phase: string, duration: number?)
	Workspace:SetAttribute("Phase", phase)
	Workspace:SetAttribute("PhaseEndsAt", if duration then now() + duration else 0)
end

local function eligiblePlayers(): { Player }
	local list = {}
	for _, player in Players:GetPlayers() do
		if PlayerData.isLoaded(player) and player.Character then
			table.insert(list, player)
		end
	end
	return list
end

local function aliveSurvivors(): { Player }
	local list = {}
	for player, alive in survivors do
		if alive and player.Parent then
			table.insert(list, player)
		end
	end
	return list
end

local function publishAlive()
	Workspace:SetAttribute("SurvivorsAlive", #aliveSurvivors())
end

local function notifyAll(text: string, kind: string?)
	Net.get("Notify"):FireAllClients(text, kind or "info")
end

local function markDead(player: Player, position: Vector3?)
	if not survivors[player] then
		return
	end
	survivors[player] = false
	player:SetAttribute("Role", "Dead")
	if position then
		Crafting.dropGold(player, position)
	else
		player:SetAttribute("Gold", 0)
	end
	publishAlive()
end

local function onTotem(player: Player): boolean
	local remaining = endsAt - now()
	if remaining <= R.MinRemainingAfterTotem then
		return false
	end
	endsAt = math.max(now() + R.MinRemainingAfterTotem, endsAt - Config.Crafting.TimeReductionPerTotem)
	totems += 1
	Workspace:SetAttribute("PhaseEndsAt", endsAt)
	Workspace:SetAttribute("Totems", totems)
	notifyAll(`{player.DisplayName} crafteó un tótem: -{Config.Crafting.TimeReductionPerTotem}s`, "good")
	return true
end

local function waitForPlayers()
	setPhase("Waiting")
	while #eligiblePlayers() < R.MinPlayers do
		task.wait(1)
	end
end

local function intermission(): boolean
	setPhase("Intermission", R.IntermissionTime)
	local deadline = os.clock() + R.IntermissionTime
	while os.clock() < deadline do
		if #eligiblePlayers() < R.MinPlayers then
			return false
		end
		task.wait(0.5)
	end
	return true
end

local function playRound()
	local participants = eligiblePlayers()
	local killer = PlayerData.pickKiller(participants)
	if not killer then
		return
	end
	PlayerData.applyRoundRoles(killer, participants)

	setPhase("Starting")
	local map = MapService.load()
	currentMap = map.model
	MapService.setAtmosphere(true)
	Workspace:SetAttribute("MapName", map.name)
	notifyAll(`Mapa: {map.name}`, "info")

	table.clear(survivors)
	totems = 0
	Workspace:SetAttribute("Totems", 0)
	Workspace:SetAttribute("MaxTotems", Config.Crafting.MaxTotemsPerRound)

	local deathConnections: { RBXScriptConnection } = {}
	local spawnIndex = 0
	for _, player in participants do
		player:SetAttribute("Gold", 0)
		if player == killer then
			player:SetAttribute("Role", "Verity")
		else
			player:SetAttribute("Role", "Survivor")
			survivors[player] = true
			local character = player.Character
			local humanoid = character and character:FindFirstChildOfClass("Humanoid")
			if character and humanoid and humanoid.Health > 0 then
				spawnIndex = spawnIndex % #map.survivorSpawns + 1
				character:PivotTo(map.survivorSpawns[spawnIndex])
				humanoid.WalkSpeed = Config.Killer.SurvivorWalkSpeed
				table.insert(deathConnections, humanoid.Died:Connect(function()
					local root = character:FindFirstChild("HumanoidRootPart")
					markDead(player, if root and root:IsA("BasePart") then root.Position else nil)
				end))
			else
				survivors[player] = false
				player:SetAttribute("Role", "Dead")
			end
		end
		Net.get("RoleReveal"):FireClient(player, player:GetAttribute("Role"), killer.DisplayName)
	end
	publishAlive()

	Killer.setup(killer, map.killerSpawn, {
		survivors = aliveSurvivors,
		onKill = function(_, victim)
			notifyAll(`{victim.DisplayName} fue atrapado por Verity`, "bad")
		end,
	})

	-- Si Verity se reinicia o muere, pierde la ronda.
	local killerCharacter = killer.Character
	local killerHumanoid = killerCharacter and killerCharacter:FindFirstChildOfClass("Humanoid")

	Crafting.start({
		parent = map.model,
		goldSpawns = map.goldSpawns,
		tableSpots = map.tableSpots,
		survivorCount = #aliveSurvivors(),
		isSurvivor = function(player)
			return survivors[player] == true
		end,
		onTotem = onTotem,
		totemsCrafted = function()
			return totems
		end,
	})

	endsAt = now() + R.Duration
	setPhase("Playing")
	Workspace:SetAttribute("PhaseEndsAt", endsAt)
	Workspace:SetAttribute("KillerReleaseAt", now() + R.KillerReleaseDelay)

	local released = false
	local winner: string
	while true do
		task.wait(0.25)
		if not released and (Workspace:GetAttribute("KillerReleaseAt") :: number) <= now() then
			released = true
			Killer.release()
			notifyAll("¡Verity ha sido liberada!", "bad")
		end
		for player, alive in survivors do
			if alive and not player.Parent then
				markDead(player, nil)
			end
		end
		if not killer.Parent then
			winner = "Survivors"
			notifyAll("Verity abandonó la partida.", "info")
			break
		end
		if killer.Character ~= killerCharacter or not killerHumanoid or killerHumanoid.Health <= 0 then
			winner = "Survivors"
			notifyAll("Verity ha caído.", "info")
			break
		end
		if #aliveSurvivors() == 0 then
			winner = "Verity"
			break
		end
		if now() >= endsAt then
			winner = "Survivors"
			break
		end
	end

	-- Resultados
	local alive = aliveSurvivors()
	local survivorNames = {}
	if winner == "Survivors" then
		for _, player in alive do
			PlayerData.addWin(player)
			table.insert(survivorNames, player.DisplayName)
		end
	elseif killer.Parent then
		PlayerData.addWin(killer)
	end
	Net.get("RoundResult"):FireAllClients(winner, killer.DisplayName, survivorNames, totems)
	setPhase("Results", R.ResultsTime)

	for _, c in deathConnections do
		c:Disconnect()
	end
	Crafting.stop()
	Killer.cleanup()
	task.wait(R.ResultsTime)

	map.model:Destroy()
	currentMap = nil
	MapService.setAtmosphere(false)
	Workspace:SetAttribute("MapName", nil)
	Workspace:SetAttribute("KillerReleaseAt", nil)
	table.clear(survivors)
	for _, player in participants do
		if player.Parent then
			player:SetAttribute("Role", "Lobby")
			player:SetAttribute("Gold", 0)
			-- Devuelve a todos al lobby con su avatar normal.
			task.spawn(function()
				pcall(player.LoadCharacter, player)
			end)
		end
	end
end

function Round.init()
	Workspace:SetAttribute("Totems", 0)
	Workspace:SetAttribute("MaxTotems", Config.Crafting.MaxTotemsPerRound)
	Players.PlayerAdded:Connect(function(player)
		player:SetAttribute("Role", "Lobby")
		player:SetAttribute("Gold", 0)
	end)
	for _, player in Players:GetPlayers() do
		player:SetAttribute("Role", "Lobby")
	end
end

function Round.start()
	while true do
		waitForPlayers()
		if intermission() then
			local ok, err = pcall(playRound)
			if not ok then
				warn(`[Round] error en la ronda: {err}`)
				Crafting.stop()
				Killer.cleanup()
				MapService.setAtmosphere(false)
				if currentMap then
					currentMap:Destroy()
					currentMap = nil
				end
				for _, player in Players:GetPlayers() do
					player:SetAttribute("Role", "Lobby")
					task.spawn(function()
						pcall(player.LoadCharacter, player)
					end)
				end
				task.wait(3)
			end
		end
	end
end

return Round
