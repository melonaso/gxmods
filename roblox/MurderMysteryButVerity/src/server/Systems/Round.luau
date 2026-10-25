--!strict
-- Bucle principal: espera -> intermedio -> partida -> resultados.
-- El estado se replica con atributos de Workspace:
--   Phase, PhaseEndsAt (GetServerTimeNow), Totems, MaxTotems, SurvivorsAlive,
--   MapName, KillerReleaseAt
-- Los supervivientes pueden ser jugadores o NPCs (modo prueba).

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Net = require(ReplicatedStorage.Shared.Net)
local Entity = require(script.Parent.Parent.Lib.Entity)
local Bots = require(script.Parent.Bots)
local Coins = require(script.Parent.Coins)
local Crafting = require(script.Parent.Crafting)
local Hiding = require(script.Parent.Hiding)
local Items = require(script.Parent.Items)
local Killer = require(script.Parent.Killer)
local MapService = require(script.Parent.MapService)
local Movement = require(script.Parent.Movement)
local PlayerData = require(script.Parent.PlayerData)

local R = Config.Round
local T = Config.Testing

local Round = {}

local survivors: { [Instance]: boolean } = {} -- Player o NPC -> vivo
local endsAt = 0
local totems = 0
local currentMap: Model? = nil

local function now(): number
	return Workspace:GetServerTimeNow()
end

local function minPlayers(): number
	return if T.Enabled then 1 else R.MinPlayers
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

local function aliveSurvivors(): { Instance }
	local list = {}
	for who, alive in survivors do
		if alive and Entity.exists(who) then
			table.insert(list, who)
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

local function markDead(who: Instance, position: Vector3?)
	if not survivors[who] then
		return
	end
	survivors[who] = false
	if Hiding.isHidden(who) then
		Hiding.unhide(who, true)
	end
	if who:IsA("Player") then
		who:SetAttribute("Role", "Dead")
	end
	if position then
		Crafting.dropGold(who, position)
	else
		who:SetAttribute("Gold", 0)
	end
	publishAlive()
end

local function onTotem(who: Instance): boolean
	local remaining = endsAt - now()
	if remaining <= R.MinRemainingAfterTotem then
		return false
	end
	endsAt = math.max(now() + R.MinRemainingAfterTotem, endsAt - Config.Crafting.TimeReductionPerTotem)
	totems += 1
	Workspace:SetAttribute("PhaseEndsAt", endsAt)
	Workspace:SetAttribute("Totems", totems)
	notifyAll(`{Entity.name(who)} crafteó un tótem: -{Config.Crafting.TimeReductionPerTotem}s`, "good")
	return true
end

local function waitForPlayers()
	setPhase("Waiting")
	while #eligiblePlayers() < minPlayers() do
		task.wait(1)
	end
end

local function intermission(): boolean
	local duration = if T.Enabled then T.IntermissionTime else R.IntermissionTime
	setPhase("Intermission", duration)
	local deadline = os.clock() + duration
	while os.clock() < deadline do
		if #eligiblePlayers() < minPlayers() then
			return false
		end
		task.wait(0.5)
	end
	return true
end

local function chooseKiller(participants: { Player }): Player?
	if T.Enabled then
		-- modo prueba: el primer jugador del servidor siempre es Verity
		return participants[1]
	end
	return PlayerData.pickKiller(participants)
end

local function playRound()
	local participants = eligiblePlayers()
	local killer = chooseKiller(participants)
	if not killer then
		return
	end
	PlayerData.applyRoundRoles(killer, participants)

	setPhase("Starting")
	local map = MapService.load()
	currentMap = map.model
	MapService.setAtmosphere(true, map.outdoor)
	Workspace:SetAttribute("MapOutdoor", map.outdoor)
	Workspace:SetAttribute("MapName", map.name)
	notifyAll(`Mapa: {map.name}`, "info")

	table.clear(survivors)
	totems = 0
	Workspace:SetAttribute("Totems", 0)
	Workspace:SetAttribute("MaxTotems", Config.Crafting.MaxTotemsPerRound)

	local deathConnections: { RBXScriptConnection } = {}
	local function watchDeath(who: Instance, humanoid: Humanoid, character: Model)
		table.insert(deathConnections, humanoid.Died:Connect(function()
			local root = character:FindFirstChild("HumanoidRootPart")
			markDead(who, if root and root:IsA("BasePart") then root.Position else nil)
		end))
	end

	local spawnIndex = 0
	local function nextSpawn(): CFrame
		spawnIndex = spawnIndex % #map.survivorSpawns + 1
		return map.survivorSpawns[spawnIndex]
	end

	for _, player in participants do
		player:SetAttribute("Gold", 0)
		Movement.reset(player)
		if player == killer then
			player:SetAttribute("Role", "Verity")
		else
			player:SetAttribute("Role", "Survivor")
			survivors[player] = true
			local character = player.Character
			local humanoid = character and character:FindFirstChildOfClass("Humanoid")
			if character and humanoid and humanoid.Health > 0 then
				character:PivotTo(nextSpawn())
				-- sin etiqueta de nombre: delataría a quien se esconde (vuelve al reaparecer en el lobby)
				humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
				watchDeath(player, humanoid, character)
			else
				survivors[player] = false
				player:SetAttribute("Role", "Dead")
			end
		end
		Net.get("RoleReveal"):FireClient(player, player:GetAttribute("Role"), killer.DisplayName)
	end

	Killer.setup(killer, map.killerSpawn, {
		survivors = aliveSurvivors,
		onGrab = function(victim, position)
			-- si estaba escondida, Verity la saca del escondite (visible y sujeta)
			if Hiding.isHidden(victim) then
				Hiding.unhide(victim, true)
			end
			markDead(victim, position)
			notifyAll(`Verity atrapó a {Entity.name(victim)}`, "bad")
			Coins.award(killer, Config.Coins.RewardKill, "atrapar")
		end,
		goreParent = map.model,
	})
	Items.give(killer)
	-- Si Verity se reinicia o muere, pierde la ronda.
	local killerCharacter = killer.Character
	local killerHumanoid = killerCharacter and killerCharacter:FindFirstChildOfClass("Humanoid")

	-- Monedas por el mapa (antes de crear NPCs para que no caigan encima de ellos)
	local coinPoints: { Vector3 } = {}
	for _, cf in map.survivorSpawns do
		table.insert(coinPoints, cf.Position)
	end
	for _, p in map.goldSpawns do
		table.insert(coinPoints, p)
	end
	Coins.start(map.model, coinPoints)

	-- Escondites (armarios, taquillas, ataúdes...)
	Hiding.start(map.model, {
		isSurvivor = function(who)
			return survivors[who] == true
		end,
	})

	-- NPCs para completar la partida (modo prueba)
	local bots: { Model } = {}
	if T.Enabled and T.Bots > 0 then
		local points: { Vector3 } = {}
		for _, cf in map.survivorSpawns do
			table.insert(points, cf.Position)
		end
		for _, p in map.goldSpawns do
			table.insert(points, p)
		end
		local botCtx = {
			parent = map.model,
			killerRoot = function(): BasePart?
				return Entity.root(killer)
			end,
			killerReleased = function(): boolean
				return (Workspace:GetAttribute("KillerReleaseAt") :: number? or math.huge) <= now()
			end,
			isAlive = function(bot: Model): boolean
				return survivors[bot] == true
			end,
			points = points,
		}
		local spawns = {}
		for _ = 1, T.Bots do
			table.insert(spawns, nextSpawn())
		end
		bots = Bots.spawn(T.Bots, spawns, botCtx)
		for _, bot in bots do
			survivors[bot] = true
			watchDeath(bot, bot:FindFirstChildOfClass("Humanoid") :: Humanoid, bot)
		end
		Bots.startAI(bots, botCtx)
	end
	publishAlive()

	Crafting.start({
		parent = map.model,
		goldSpawns = map.goldSpawns,
		tableSpots = map.tableSpots,
		survivorCount = #aliveSurvivors(),
		isSurvivor = function(who)
			return survivors[who] == true
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
		for who, alive in survivors do
			if alive and not Entity.exists(who) then
				markDead(who, nil)
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
		if #aliveSurvivors() == 0 and not Killer.isKilling() then
			winner = "Verity"
			break
		end
		if now() >= endsAt then
			winner = "Survivors"
			break
		end
	end

	-- Resultados
	local survivorNames = {}
	if winner == "Survivors" then
		for _, who in aliveSurvivors() do
			if who:IsA("Player") then
				PlayerData.addWin(who)
				Coins.award(who, Config.Coins.RewardSurvive + Config.Coins.RewardWin, "sobrevivir")
			end
			table.insert(survivorNames, Entity.name(who))
		end
	elseif killer.Parent then
		PlayerData.addWin(killer)
		Coins.award(killer, Config.Coins.RewardWin, "victoria")
	end
	for _, player in participants do
		if player.Parent then
			task.spawn(PlayerData.save, player)
		end
	end
	Net.get("RoundResult"):FireAllClients(winner, killer.DisplayName, survivorNames, totems)
	setPhase("Results", R.ResultsTime)

	for _, c in deathConnections do
		c:Disconnect()
	end
	Bots.stop()
	Crafting.stop()
	Coins.stop()
	Hiding.stop()
	Items.cleanup()
	Killer.cleanup()
	task.wait(R.ResultsTime)

	map.model:Destroy() -- también elimina NPCs y restos
	currentMap = nil
	MapService.setAtmosphere(false)
	Workspace:SetAttribute("MapName", nil)
	Workspace:SetAttribute("MapOutdoor", nil)
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
	Workspace:SetAttribute("TestMode", T.Enabled)
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
				Bots.stop()
				Crafting.stop()
				Coins.stop()
				Hiding.stop()
				Items.cleanup()
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
