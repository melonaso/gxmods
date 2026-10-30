--!strict
-- Bucle principal: espera -> intermedio -> partida -> resultados.
-- El estado se replica con atributos de Workspace:
--   Phase, PhaseEndsAt (GetServerTimeNow), Totems, MaxTotems, SurvivorsAlive,
--   MapName, KillerReleaseAt
-- Los supervivientes pueden ser jugadores o NPCs (partida en solitario).

local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Locale = require(ReplicatedStorage.Shared.Locale)
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
local VerityBot = require(script.Parent.VerityBot)

local R = Config.Round
local T = Locale.t -- marca los textos para traducirlos en el cliente

local Round = {}

local survivors: { [Instance]: boolean } = {} -- Player o NPC -> vivo
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

-- Jugadores que no están en modo AFK (botón de ajustes).
local function activeCount(): number
	local count = 0
	for _, player in Players:GetPlayers() do
		if not player:GetAttribute("AFK") then
			count += 1
		end
	end
	return count
end

local function eligiblePlayers(): { Player }
	local list = {}
	for _, player in Players:GetPlayers() do
		if PlayerData.isLoaded(player) and player.Character and not player:GetAttribute("AFK") then
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

local function notifyAll(text: string, kind: string?, args: { [string]: any }?)
	Net.get("Notify"):FireAllClients(text, kind or "info", args)
end

local function notify(player: Player, text: string, kind: string?, args: { [string]: any }?)
	Net.get("Notify"):FireClient(player, text, kind or "info", args)
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
	notifyAll(T("{name} crafteó un tótem: -{seconds}s"), "good", { name = Entity.name(who), seconds = Config.Crafting.TimeReductionPerTotem })
	return true
end

-- Un solo jugador (sin contar a los AFK): la partida se completa con NPCs.
local function isSolo(): boolean
	return R.SoloBots and activeCount() == 1
end

-- Se puede jugar con MinPlayers jugadores reales, o en solitario con NPCs.
-- Si alguien acaba de entrar y aún carga, se espera por él.
local function ready(): boolean
	local count = #eligiblePlayers()
	return count >= R.MinPlayers or (count == 1 and isSolo())
end

local function waitForPlayers()
	setPhase("Waiting")
	while not ready() do
		task.wait(1)
	end
end

local function intermission(): boolean
	setPhase("Intermission", R.IntermissionTime)
	local deadline = os.clock() + R.IntermissionTime
	while os.clock() < deadline do
		if not ready() then
			return false
		end
		task.wait(0.5)
	end
	return true
end

-- Devuelve el jugador que será Verity, o nil si la maneja la IA (en
-- solitario, el jugador alterna entre Verity y superviviente).
local function chooseKiller(participants: { Player }, solo: boolean): Player?
	if solo then
		return PlayerData.pickSoloKiller(participants[1])
	end
	return PlayerData.pickKiller(participants)
end

-- Anti-campeo: marca a los supervivientes (y los escondites ocupados) con la
-- etiqueta "Revealed" mientras dura la revelación. Los clientes de Verity
-- dibujan el resaltado rojo; la Verity NPC usa RevealedUntil.
local revealUntil = 0

local function refreshReveal()
	local active = now() < revealUntil
	local wanted: { [Instance]: boolean } = {}
	if active then
		for _, who in aliveSurvivors() do
			local character = Entity.character(who)
			if character then
				wanted[character] = true
				character:SetAttribute("RevealedUntil", revealUntil)
				local spot = Hiding.spotOf(who)
				if spot then
					wanted[spot.model] = true
				end
			end
		end
	end
	for _, inst in CollectionService:GetTagged("Revealed") do
		if not wanted[inst] then
			CollectionService:RemoveTag(inst, "Revealed")
		end
	end
	for inst in wanted do
		CollectionService:AddTag(inst, "Revealed")
	end
end

local function reveal(killerPlayer: Player?)
	revealUntil = now() + R.RevealDuration
	Workspace:SetAttribute("RevealUntil", revealUntil)
	refreshReveal()
	for _, who in aliveSurvivors() do
		if who:IsA("Player") then
			Net.get("Effect"):FireClient(who, "Revealed", R.RevealDuration)
			notify(who, T("¡Verity puede verte! Cambia de sitio."), "bad")
		end
	end
	if killerPlayer then
		notify(killerPlayer, T("Los supervivientes están marcados en rojo."), "warn")
	end
end

local function humanSurvivorsAlive(): number
	local count = 0
	for who, alive in survivors do
		if alive and who:IsA("Player") and who.Parent then
			count += 1
		end
	end
	return count
end

local function playRound()
	local participants = eligiblePlayers()
	if #participants == 0 then
		return
	end
	local solo = #participants == 1 and isSolo()
	if #participants < R.MinPlayers and not solo then
		return
	end
	local killerPlayer = chooseKiller(participants, solo)
	if not killerPlayer and not solo then
		return
	end
	PlayerData.applyRoundRoles(killerPlayer, participants)
	local killerName = if killerPlayer then killerPlayer.DisplayName else "Verity (NPC)"

	setPhase("Starting")
	local map = MapService.load()
	currentMap = map.model
	MapService.setAtmosphere(true, map.outdoor)
	Workspace:SetAttribute("MapOutdoor", map.outdoor)
	Workspace:SetAttribute("MapName", map.name)
	notifyAll(T("Mapa: {map}"), "info", { map = Locale.ref(map.name) })

	table.clear(survivors)
	totems = 0
	revealUntil = 0
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
		if player == killerPlayer then
			player:SetAttribute("Role", "Verity")
			player.CameraMaxZoomDistance = Config.Camera.VerityMaxZoom
		else
			player:SetAttribute("Role", "Survivor")
			player.CameraMaxZoomDistance = Config.Camera.SurvivorMaxZoom
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
		Net.get("RoleReveal"):FireClient(player, player:GetAttribute("Role"), killerName)
	end

	local killer = Killer.setup(killerPlayer, map.killerSpawn, {
		survivors = aliveSurvivors,
		onGrab = function(victim, position)
			-- si estaba escondida, Verity la saca del escondite (visible y sujeta)
			if Hiding.isHidden(victim) then
				Hiding.unhide(victim, true)
			end
			markDead(victim, position)
			notifyAll(T("Verity atrapó a {name}"), "bad", { name = Entity.name(victim) })
			if killerPlayer then
				Coins.award(killerPlayer, Config.Coins.RewardKill, T("atrapar"))
			end
		end,
		goreParent = map.model,
	})
	-- Si Verity se reinicia o muere, pierde la ronda.
	local killerCharacter = if killer then Entity.character(killer) else nil
	local killerHumanoid = killerCharacter and killerCharacter:FindFirstChildOfClass("Humanoid")

	-- Objetos de la tienda: solo los supervivientes y solo en la ronda
	for _, player in participants do
		if survivors[player] then
			Items.give(player)
		end
	end

	-- Puntos transitables (los dos pisos): monedas, patrullas y huidas
	local points: { Vector3 } = {}
	for _, cf in map.survivorSpawns do
		table.insert(points, cf.Position)
	end
	for _, p in map.goldSpawns do
		table.insert(points, p)
	end
	-- Monedas por el mapa (antes de crear NPCs para que no caigan encima de ellos)
	Coins.start(map.model, points)

	-- Escondites (armarios, taquillas, ataúdes...)
	Hiding.start(map.model, {
		isSurvivor = function(who)
			return survivors[who] == true
		end,
	})

	-- En solitario, NPCs hasta completar la partida
	local bots: { Model } = {}
	local slots = R.MaxPlayers - #participants - (if killerPlayer then 0 else 1)
	if solo and slots > 0 then
		local botCtx = {
			parent = map.model,
			killerRoot = function(): BasePart?
				return if killer then Entity.root(killer) else nil
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
		for _ = 1, slots do
			table.insert(spawns, nextSpawn())
		end
		bots = Bots.spawn(slots, spawns, botCtx)
		for _, bot in bots do
			survivors[bot] = true
			watchDeath(bot, bot:FindFirstChildOfClass("Humanoid") :: Humanoid, bot)
		end
		Bots.startAI(bots, botCtx)
	end
	publishAlive()

	if not killerPlayer and killerCharacter then
		VerityBot.start(killerCharacter, { survivors = aliveSurvivors, points = points })
	end

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
	local nextReveal = math.huge
	local humansWereAlive = humanSurvivorsAlive() > 0
	local winner: string
	while true do
		task.wait(0.25)
		-- Partida en solitario y entra otro jugador: fuera NPCs, se cancela la
		-- ronda (sin premios) y la siguiente ya es entre jugadores reales.
		if solo and activeCount() > 1 then
			winner = "Cancelled"
			VerityBot.stop()
			Bots.stop()
			for _, bot in bots do
				survivors[bot] = nil
				if Hiding.isHidden(bot) then
					Hiding.unhide(bot)
				end
				bot:Destroy()
			end
			if not killerPlayer and killerCharacter then
				killerCharacter:Destroy()
			end
			publishAlive()
			notifyAll(T("Entró otro jugador: se acabó la partida contra NPCs."), "info")
			break
		end
		if not released and (Workspace:GetAttribute("KillerReleaseAt") :: number) <= now() then
			released = true
			Killer.release()
			notifyAll(T("¡Verity ha sido liberada!"), "bad")
			nextReveal = now() + R.RevealInterval
			Workspace:SetAttribute("NextRevealAt", nextReveal)
		end
		if released and now() >= nextReveal then
			reveal(killerPlayer)
			nextReveal += R.RevealInterval
			Workspace:SetAttribute("NextRevealAt", nextReveal)
		end
		if revealUntil > 0 then
			refreshReveal()
			if now() >= revealUntil then
				revealUntil = 0
			end
		end
		for who, alive in survivors do
			if alive and not Entity.exists(who) then
				markDead(who, nil)
			end
		end
		if killerPlayer and not killerPlayer.Parent then
			winner = "Survivors"
			notifyAll(T("Verity abandonó la partida."), "info")
			break
		end
		if not killerCharacter or not killerCharacter.Parent or (killerPlayer and killerPlayer.Character ~= killerCharacter)
			or not killerHumanoid or killerHumanoid.Health <= 0 then
			winner = "Survivors"
			notifyAll(T("Verity ha caído."), "info")
			break
		end
		if #aliveSurvivors() == 0 and not Killer.isKilling() then
			winner = "Verity"
			break
		end
		-- Verity NPC: si caen todos los jugadores, no hace falta esperar el
		-- reloj entero mirando a los NPCs
		if humansWereAlive and not killerPlayer and humanSurvivorsAlive() == 0 then
			humansWereAlive = false
			local shortened = math.min(endsAt, now() + 20)
			if shortened < endsAt then
				endsAt = shortened
				Workspace:SetAttribute("PhaseEndsAt", endsAt)
				notifyAll(T("Has caído. La ronda termina en {seconds} s."), "info", { seconds = 20 })
			end
		end
		if now() >= endsAt then
			winner = if #aliveSurvivors() > 0 then "Survivors" else "Verity"
			break
		end
	end

	-- Resultados
	local survivorNames = {}
	if winner == "Survivors" then
		for _, who in aliveSurvivors() do
			if who:IsA("Player") then
				PlayerData.addWin(who)
				Coins.award(who, Config.Coins.RewardSurvive + Config.Coins.RewardWin, T("sobrevivir"))
			end
			table.insert(survivorNames, Entity.name(who))
		end
	elseif winner == "Verity" and killerPlayer and killerPlayer.Parent then
		PlayerData.addWin(killerPlayer)
		Coins.award(killerPlayer, Config.Coins.RewardWin, T("victoria"))
	end
	for _, player in participants do
		if player.Parent then
			task.spawn(PlayerData.save, player)
		end
	end
	Net.get("RoundResult"):FireAllClients(winner, killerName, survivorNames, totems)
	setPhase("Results", R.ResultsTime)

	for _, c in deathConnections do
		c:Disconnect()
	end
	revealUntil = 0
	refreshReveal()
	VerityBot.stop()
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
	Workspace:SetAttribute("NextRevealAt", nil)
	Workspace:SetAttribute("RevealUntil", nil)
	table.clear(survivors)
	for _, player in participants do
		if player.Parent then
			player:SetAttribute("Role", "Lobby")
			player:SetAttribute("Gold", 0)
			player.CameraMaxZoomDistance = Config.Camera.LobbyMaxZoom
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
	local function setup(player: Player)
		player:SetAttribute("Role", "Lobby")
		player:SetAttribute("Gold", 0)
		player.CameraMaxZoomDistance = Config.Camera.LobbyMaxZoom
	end
	Players.PlayerAdded:Connect(setup)
	for _, player in Players:GetPlayers() do
		setup(player)
	end
end

function Round.start()
	while true do
		waitForPlayers()
		if intermission() then
			local ok, err = pcall(playRound)
			if not ok then
				warn(`[Round] error en la ronda: {err}`)
				revealUntil = 0
				refreshReveal()
				VerityBot.stop()
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
					player.CameraMaxZoomDistance = Config.Camera.LobbyMaxZoom
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
