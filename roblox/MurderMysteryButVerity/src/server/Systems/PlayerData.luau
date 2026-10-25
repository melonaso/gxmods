--!strict
-- Datos persistentes (suerte, pociones, victorias, monedas, objetos y skins)
-- y cálculo de la probabilidad de ser Verity.
--
-- Si el DataStore no está disponible (archivo local sin publicar o sin
-- "Enable Studio Access to API Services"), todo funciona en memoria y se
-- avisa una vez en Output. Antes, el error de GetDataStore detenía el
-- servidor completo.

local DataStoreService = game:GetService("DataStoreService")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)

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
}

local MAX_STORED_RECEIPTS = 50
local STORE_NAME = "MurderMysteryButVerity_v1"

local PlayerData = {}

local store: DataStore? = nil
local memoryOnly = false
local sessions: { [Player]: Data } = {}
local passMultiplier: { [Player]: number } = {}

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
	}
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

function PlayerData.save(player: Player): boolean
	local data = sessions[player]
	if not data then
		return false
	end
	if memoryOnly then
		return true
	end
	local ok = call(function(ds)
		return ds:UpdateAsync(key(player), function()
			return data
		end)
	end)
	return ok or memoryOnly
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

-- Publica en cada jugador su probabilidad actual (0-100) como atributo.
function PlayerData.refreshChances()
	local total = 0
	for player in sessions do
		total += PlayerData.weight(player)
	end
	for player in sessions do
		local chance = if total > 0 then PlayerData.weight(player) / total * 100 else 0
		player:SetAttribute("VerityChance", math.floor(chance * 10 + 0.5) / 10)
	end
end

function PlayerData.pickKiller(candidates: { Player }): Player?
	local total = 0
	for _, player in candidates do
		total += PlayerData.weight(player)
	end
	if total <= 0 then
		return candidates[math.random(1, #candidates)]
	end
	local roll = math.random() * total
	for _, player in candidates do
		roll -= PlayerData.weight(player)
		if roll <= 0 then
			return player
		end
	end
	return candidates[#candidates]
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

	local ok, raw = call(function(ds)
		return ds:GetAsync(key(player))
	end)
	if not player.Parent then
		return
	end
	local data = sanitize(if ok then raw else nil)
	if not ok and not memoryOnly then
		-- El DataStore existe pero falló: no guardamos para no pisar datos reales.
		player:SetAttribute("DataUnsaved", true)
	end
	if Config.Testing.Enabled and data.coins < Config.Testing.StartingCoins then
		data.coins = Config.Testing.StartingCoins
	end
	sessions[player] = data
	publish(player)
	PlayerData.refreshChances()
end

local function onPlayerRemoving(player: Player)
	if not player:GetAttribute("DataUnsaved") then
		PlayerData.save(player)
	end
	sessions[player] = nil
	passMultiplier[player] = nil
	PlayerData.refreshChances()
end

function PlayerData.init()
	Players.PlayerAdded:Connect(onPlayerAdded)
	Players.PlayerRemoving:Connect(onPlayerRemoving)
	for _, player in Players:GetPlayers() do
		task.spawn(onPlayerAdded, player)
	end
	game:BindToClose(function()
		if memoryOnly then
			return
		end
		local pending = 0
		for player in sessions do
			if not player:GetAttribute("DataUnsaved") then
				pending += 1
				task.spawn(function()
					PlayerData.save(player)
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
