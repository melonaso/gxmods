--!strict
-- Datos persistentes (suerte, pociones, victorias, monedas, objetos y skins)
-- y cálculo de la probabilidad de ser Verity.
--
-- Guardado: al salir, al cerrar el servidor, al terminar cada ronda y cada
-- AUTOSAVE_INTERVAL segundos. Bloqueo de sesión: solo un servidor escribe los
-- datos de un jugador a la vez (si cambia de servidor muy rápido, el nuevo
-- espera a que el anterior termine de guardar, así no se pierden monedas ni
-- victorias ni se duplican).
--
-- Si el DataStore no está disponible (archivo local sin publicar o sin
-- "Enable Studio Access to API Services"), todo funciona en memoria y se
-- avisa una vez en Output. Antes, el error de GetDataStore detenía el
-- servidor completo.

local DataStoreService = game:GetService("DataStoreService")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Locale = require(ReplicatedStorage.Shared.Locale)

export type Data = {
	luck: number,
	boostRounds: number,
	boostMultiplier: number,
	wins: number,
	coins: number,
	items: { string }, -- objetos comprados
	equipped: { string }, -- objetos que se llevan a las rondas
	skins: { string }, -- skins de Verity compradas
	skin: string, -- skin equipada
	receipts: { string },
	settings: Settings, -- ajustes del jugador (volumen, calidad, hitboxes)
}

export type Settings = { music: number, effects: number, lowQuality: boolean, hitboxes: boolean, language: string }

local MAX_STORED_RECEIPTS = 50
local STORE_NAME = "SurviveAVerity_v1"
local AUTOSAVE_INTERVAL = 60
local LOCK_TTL = AUTOSAVE_INTERVAL * 3 -- un bloqueo sin renovar tanto tiempo es de un servidor caído
local LOCK_RETRIES = 6 -- esperas de 5 s a que el servidor anterior suelte la sesión

local PlayerData = {}

local store: DataStore? = nil
local memoryOnly = false
local sessions: { [Player]: Data } = {}
local passMultiplier: { [Player]: number } = {}
local saving: { [Player]: boolean } = {}

local function key(player: Player): string
	return "u_" .. player.UserId
end

local function useMemory(reason: string)
	if not memoryOnly then
		memoryOnly = true
		warn(`[PlayerData] DataStore no disponible ({reason}). Los datos se guardan solo en memoria durante esta sesión.`)
	end
end

local function getStore(): DataStore?
	if memoryOnly then
		return nil
	end
	if store then
		return store
	end
	if game.PlaceId == 0 then
		useMemory("lugar sin publicar")
		return nil
	end
	local ok, result = pcall(DataStoreService.GetDataStore, DataStoreService, STORE_NAME)
	if not ok then
		useMemory(tostring(result))
		return nil
	end
	store = result
	return store
end

-- Errores que no se arreglan reintentando (Studio sin acceso a API, etc.).
local function isPermanent(err: string): boolean
	local lower = string.lower(err)
	return string.find(lower, "publish", 1, true) ~= nil
		or string.find(lower, "studio", 1, true) ~= nil
		or string.find(lower, "403", 1, true) ~= nil
		or string.find(lower, "api", 1, true) ~= nil
end

local function call<T>(fn: (DataStore) -> T): (boolean, T?)
	for attempt = 1, 3 do
		local ds = getStore()
		if not ds then
			return false, nil
		end
		local ok, result = pcall(fn, ds)
		if ok then
			return true, result
		end
		local message = tostring(result)
		if isPermanent(message) then
			useMemory(message)
			return false, nil
		end
		warn(`[PlayerData] intento {attempt} falló: {message}`)
		task.wait(attempt * 2)
	end
	return false, nil
end

local function defaults(): Data
	return {
		luck = 0,
		boostRounds = 0,
		boostMultiplier = 1,
		wins = 0,
		coins = 0,
		items = {},
		equipped = {},
		skins = { "Classic" },
		skin = "Classic",
		receipts = {},
		settings = { music = 1, effects = 1, lowQuality = false, hitboxes = false, language = "auto" },
	}
end

-- Ajustes válidos a partir de lo que mande el cliente o haya guardado.
local function sanitizeSettings(raw: any): Settings
	local s = { music = 1, effects = 1, lowQuality = false, hitboxes = false, language = "auto" }
	if typeof(raw) == "table" then
		s.music = math.clamp(tonumber(raw.music) or 1, 0, 1)
		s.effects = math.clamp(tonumber(raw.effects) or 1, 0, 1)
		s.lowQuality = raw.lowQuality == true
		s.hitboxes = raw.hitboxes == true
		-- "auto" (idioma de la cuenta) o uno de los idiomas del juego
		s.language = if typeof(raw.language) == "string" and Locale.findLanguage(raw.language) then raw.language else "auto"
	end
	return s
end

local function stringList(raw: any): { string }
	local list = {}
	if typeof(raw) == "table" then
		for _, v in raw do
			if typeof(v) == "string" and not table.find(list, v) then
				table.insert(list, v)
			end
		end
	end
	return list
end

local function sanitize(raw: any): Data
	local data = defaults()
	if typeof(raw) == "table" then
		data.luck = tonumber(raw.luck) or 0
		data.boostRounds = tonumber(raw.boostRounds) or 0
		data.boostMultiplier = tonumber(raw.boostMultiplier) or 1
		data.wins = tonumber(raw.wins) or 0
		data.coins = math.max(0, math.floor(tonumber(raw.coins) or 0))
		data.items = stringList(raw.items)
		data.equipped = stringList(raw.equipped)
		-- solo objetos que siguen existiendo en la tienda (la Linterna pasó a ser de todos)
		for i = #data.equipped, 1, -1 do
			local known = false
			for _, item in Config.Items do
				known = known or item.Key == data.equipped[i]
			end
			if not known then
				table.remove(data.equipped, i)
			end
		end
		while #data.equipped > Config.MaxEquipped do
			table.remove(data.equipped) -- antes se podían equipar más
		end
		data.skins = stringList(raw.skins)
		if not table.find(data.skins, "Classic") then
			table.insert(data.skins, 1, "Classic")
		end
		data.skin = if typeof(raw.skin) == "string" and table.find(data.skins, raw.skin) then raw.skin else "Classic"
		data.receipts = stringList(raw.receipts)
		data.settings = sanitizeSettings(raw.settings)
	end
	return data
end

-- Publica en atributos lo que el cliente necesita mostrar.
local function publish(player: Player)
	local data = sessions[player]
	if not data then
		return
	end
	player:SetAttribute("BoostRounds", data.boostRounds)
	player:SetAttribute("Coins", data.coins)
	player:SetAttribute("OwnedItems", HttpService:JSONEncode(data.items))
	player:SetAttribute("EquippedItems", HttpService:JSONEncode(data.equipped))
	player:SetAttribute("OwnedSkins", HttpService:JSONEncode(data.skins))
	player:SetAttribute("Skin", data.skin)
	player:SetAttribute("Settings", HttpService:JSONEncode(data.settings))
	local leaderstats = player:FindFirstChild("leaderstats")
	if leaderstats then
		local wins = leaderstats:FindFirstChild("Victorias")
		if wins and wins:IsA("IntValue") then
			wins.Value = data.wins
		end
		local coins = leaderstats:FindFirstChild("Monedas")
		if coins and coins:IsA("IntValue") then
			coins.Value = data.coins
		end
	end
end
PlayerData.publish = publish

function PlayerData.get(player: Player): Data?
	return sessions[player]
end

function PlayerData.isLoaded(player: Player): boolean
	return sessions[player] ~= nil
end

function PlayerData.isMemoryOnly(): boolean
	return memoryOnly
end

-- ¿La sesión de estos datos la tiene otro servidor que sigue vivo?
local function lockedByOther(stored: any): boolean
	if typeof(stored) ~= "table" or typeof(stored.lock) ~= "table" then
		return false
	end
	local lock = stored.lock
	return lock.job ~= game.JobId and typeof(lock.time) == "number" and os.time() - lock.time < LOCK_TTL
end

local function write(player: Player, data: Data, release: boolean): boolean
	local ok = call(function(ds)
		return ds:UpdateAsync(key(player), function(stored)
			if lockedByOther(stored) then
				return nil -- otro servidor tiene la sesión: no se pisan sus datos
			end
			local value: { [string]: any } = table.clone(data) :: any
			value.lock = if release then nil else { job = game.JobId, time = os.time() }
			return value
		end)
	end)
	return ok or memoryOnly
end

-- Guarda los datos del jugador. `release` suelta la sesión (al salir o al
-- cerrar el servidor). Nunca hay dos guardados del mismo jugador a la vez.
function PlayerData.save(player: Player, release: boolean?): boolean
	local data = sessions[player]
	if not data then
		return false
	end
	if memoryOnly then
		return true
	end
	while saving[player] do
		task.wait(0.1)
	end
	saving[player] = true
	local ok = write(player, data, release == true)
	saving[player] = nil
	return ok
end

function PlayerData.setSettings(player: Player, raw: any)
	local data = sessions[player]
	if data then
		data.settings = sanitizeSettings(raw)
		publish(player)
	end
end

-- Monedas -----------------------------------------------------------------

function PlayerData.addCoins(player: Player, amount: number)
	local data = sessions[player]
	if data and amount > 0 then
		data.coins += math.floor(amount)
		publish(player)
	end
end

function PlayerData.spendCoins(player: Player, amount: number): boolean
	local data = sessions[player]
	if not data or data.coins < amount then
		return false
	end
	data.coins -= amount
	publish(player)
	return true
end

-- Probabilidad de ser Verity ----------------------------------------------

function PlayerData.setPassMultiplier(player: Player, multiplier: number)
	passMultiplier[player] = multiplier
	PlayerData.refreshChances()
end

function PlayerData.weight(player: Player): number
	local data = sessions[player]
	if not data then
		return 0
	end
	local weight = (1 + data.luck) * (passMultiplier[player] or 1)
	if data.boostRounds > 0 then
		weight *= data.boostMultiplier
	end
	return weight
end

-- Rotación de Verity (como en Survive the Killer): nadie repite hasta que
-- todos los del servidor hayan sido Verity una vez. Con 10 jugadores, en 10
-- rondas todos lo han sido. Entre los que faltan, el orden lo deciden la
-- suerte y los pases. Se guarda por UserId: salir y volver no reinicia el turno.
local rotationDone: { [number]: boolean } = {}

local function publishRotation()
	local done, total = 0, 0
	for player in sessions do
		total += 1
		local had = rotationDone[player.UserId] == true
		if had then
			done += 1
		end
		player:SetAttribute("RotationDone", had)
	end
	Workspace:SetAttribute("RotationDone", done)
	Workspace:SetAttribute("RotationTotal", total)
end

-- Jugadores que aún no han sido Verity en esta rotación (si ya lo fueron
-- todos, empieza una rotación nueva).
local function rotationPool(candidates: { Player }): { Player }
	local pool = {}
	for _, player in candidates do
		if not rotationDone[player.UserId] then
			table.insert(pool, player)
		end
	end
	if #pool == 0 then
		table.clear(rotationDone)
		pool = table.clone(candidates)
	end
	return pool
end

-- Publica en cada jugador su probabilidad actual (0-100) como atributo: 0 %
-- si ya fue Verity en esta rotación.
function PlayerData.refreshChances()
	local players = {}
	for player in sessions do
		table.insert(players, player)
	end
	local pool = {}
	for _, player in players do
		if not rotationDone[player.UserId] then
			pool[player] = true
		end
	end
	if next(pool) == nil then
		for _, player in players do
			pool[player] = true
		end
	end
	local total = 0
	for player in pool do
		total += PlayerData.weight(player)
	end
	for _, player in players do
		local chance = if pool[player] and total > 0 then PlayerData.weight(player) / total * 100 else 0
		player:SetAttribute("VerityChance", math.floor(chance * 10 + 0.5) / 10)
	end
	publishRotation()
end

-- Partida en solitario: el jugador alterna entre ser Verity y superviviente
-- (contra una Verity NPC). Devuelve nil cuando le toca a la NPC.
function PlayerData.pickSoloKiller(player: Player): Player?
	if rotationDone[player.UserId] then
		rotationDone[player.UserId] = nil
		return nil
	end
	rotationDone[player.UserId] = true
	return player
end

function PlayerData.pickKiller(candidates: { Player }): Player?
	if #candidates == 0 then
		return nil
	end
	local pool = rotationPool(candidates)
	local chosen = pool[#pool]
	local total = 0
	for _, player in pool do
		total += PlayerData.weight(player)
	end
	if total <= 0 then
		chosen = pool[math.random(1, #pool)]
	else
		local roll = math.random() * total
		for _, player in pool do
			roll -= PlayerData.weight(player)
			if roll <= 0 then
				chosen = player
				break
			end
		end
	end
	rotationDone[chosen.UserId] = true
	return chosen
end

-- Se llama al empezar una ronda: el elegido pierde su suerte, el resto gana,
-- y todos los participantes consumen una ronda de poción.
function PlayerData.applyRoundRoles(killer: Player?, participants: { Player })
	for _, player in participants do
		local data = sessions[player]
		if data then
			if player == killer then
				data.luck = 0
			else
				data.luck = math.min(data.luck + Config.Chance.LuckPerRound, Config.Chance.MaxLuck)
			end
			if data.boostRounds > 0 then
				data.boostRounds -= 1
				if data.boostRounds == 0 then
					data.boostMultiplier = 1
				end
			end
			publish(player)
		end
	end
	PlayerData.refreshChances()
end

function PlayerData.addWin(player: Player)
	local data = sessions[player]
	if data then
		data.wins += 1
		publish(player)
	end
end

-- Concede un producto de forma idempotente. Devuelve true solo si quedó
-- guardado (o ya estaba concedido); si no, Roblox reintentará el recibo.
function PlayerData.grantProduct(player: Player, receiptId: string, multiplier: number, rounds: number): boolean
	local data = sessions[player]
	if not data then
		return false
	end
	if table.find(data.receipts, receiptId) then
		return true
	end
	local before = table.clone(data)
	before.receipts = table.clone(data.receipts)

	data.boostRounds += rounds
	data.boostMultiplier = math.max(data.boostMultiplier, multiplier)
	table.insert(data.receipts, receiptId)
	while #data.receipts > MAX_STORED_RECEIPTS do
		table.remove(data.receipts, 1)
	end

	if not PlayerData.save(player) then
		sessions[player] = before
		return false
	end
	publish(player)
	PlayerData.refreshChances()
	return true
end

local function onPlayerAdded(player: Player)
	if sessions[player] then
		return
	end
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	local coins = Instance.new("IntValue")
	coins.Name = "Monedas"
	coins.Parent = leaderstats
	local wins = Instance.new("IntValue")
	wins.Name = "Victorias"
	wins.Parent = leaderstats
	leaderstats.Parent = player

	-- Carga y reclama la sesión en una sola operación. Si otro servidor aún
	-- la tiene (el jugador acaba de salir de allí), se espera a que la suelte.
	local ok, raw, locked = false, nil :: any, false
	for attempt = 1, LOCK_RETRIES do
		ok = call(function(ds)
			return ds:UpdateAsync(key(player), function(stored)
				raw = stored
				locked = lockedByOther(stored)
				if locked then
					return nil
				end
				local value = if typeof(stored) == "table" then stored else {}
				value.lock = { job = game.JobId, time = os.time() }
				return value
			end)
		end)
		if not (ok and locked) or not player.Parent then
			break
		end
		task.wait(5)
	end
	if not player.Parent then
		if ok and not locked then
			write(player, sanitize(raw), true) -- salió mientras cargaba: suelta la sesión
		end
		return
	end
	if ok and locked then
		-- Cargar igualmente podría duplicar o perder monedas y victorias.
		player:Kick("Tus datos aún se están guardando. Vuelve a entrar en unos segundos. / Your data is still saving. Please rejoin in a few seconds.")
		return
	end
	local data = sanitize(if ok then raw else nil)
	if not ok and not memoryOnly then
		-- El DataStore existe pero falló: no guardamos para no pisar datos reales.
		player:SetAttribute("DataUnsaved", true)
	end
	sessions[player] = data
	publish(player)
	PlayerData.refreshChances()
end

local function onPlayerRemoving(player: Player)
	if not player:GetAttribute("DataUnsaved") then
		PlayerData.save(player, true)
	end
	sessions[player] = nil
	passMultiplier[player] = nil
	PlayerData.refreshChances()
end

-- Autoguardado escalonado (también renueva el bloqueo de sesión).
local function autosave()
	while true do
		task.wait(AUTOSAVE_INTERVAL)
		local list = {}
		for player in sessions do
			table.insert(list, player)
		end
		for _, player in list do
			if sessions[player] and player.Parent and not player:GetAttribute("DataUnsaved") and not saving[player] then
				task.spawn(PlayerData.save, player)
				task.wait(1)
			end
		end
	end
end

function PlayerData.init()
	Players.PlayerAdded:Connect(onPlayerAdded)
	Players.PlayerRemoving:Connect(onPlayerRemoving)
	for _, player in Players:GetPlayers() do
		task.spawn(onPlayerAdded, player)
	end
	task.spawn(autosave)
	game:BindToClose(function()
		if memoryOnly then
			return
		end
		local pending = 0
		for player in sessions do
			if not player:GetAttribute("DataUnsaved") then
				pending += 1
				task.spawn(function()
					PlayerData.save(player, true)
					pending -= 1
				end)
			end
		end
		local deadline = os.clock() + 25
		while pending > 0 and os.clock() < deadline do
			task.wait(0.2)
		end
	end)
end

return PlayerData
