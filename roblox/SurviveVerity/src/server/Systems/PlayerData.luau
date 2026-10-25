--!strict
-- Datos persistentes (suerte, pociones, victorias) y cálculo de la
-- probabilidad de ser Verity.

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)

export type Data = {
	luck: number,
	boostRounds: number,
	boostMultiplier: number,
	wins: number,
	receipts: { string },
}

local MAX_STORED_RECEIPTS = 50
local store = DataStoreService:GetDataStore("SurviveVerity_v1")

local PlayerData = {}

local sessions: { [Player]: Data } = {}
local passMultiplier: { [Player]: number } = {}

local function key(player: Player): string
	return "u_" .. player.UserId
end

local function defaults(): Data
	return { luck = 0, boostRounds = 0, boostMultiplier = 1, wins = 0, receipts = {} }
end

local function sanitize(raw: any): Data
	local data = defaults()
	if typeof(raw) == "table" then
		data.luck = tonumber(raw.luck) or 0
		data.boostRounds = tonumber(raw.boostRounds) or 0
		data.boostMultiplier = tonumber(raw.boostMultiplier) or 1
		data.wins = tonumber(raw.wins) or 0
		if typeof(raw.receipts) == "table" then
			for _, id in raw.receipts do
				if typeof(id) == "string" then
					table.insert(data.receipts, id)
				end
			end
		end
	end
	return data
end

local function retry<T>(fn: () -> T): (boolean, T?)
	for attempt = 1, 3 do
		local ok, result = pcall(fn)
		if ok then
			return true, result
		end
		warn(`[PlayerData] intento {attempt} falló: {result}`)
		task.wait(attempt * 2)
	end
	return false, nil
end

local function publish(player: Player)
	local data = sessions[player]
	if not data then
		return
	end
	player:SetAttribute("BoostRounds", data.boostRounds)
	local leaderstats = player:FindFirstChild("leaderstats")
	local wins = leaderstats and leaderstats:FindFirstChild("Victorias")
	if wins and wins:IsA("IntValue") then
		wins.Value = data.wins
	end
end

function PlayerData.get(player: Player): Data?
	return sessions[player]
end

function PlayerData.isLoaded(player: Player): boolean
	return sessions[player] ~= nil
end

function PlayerData.save(player: Player): boolean
	local data = sessions[player]
	if not data then
		return false
	end
	local ok = retry(function()
		return store:UpdateAsync(key(player), function()
			return data
		end)
	end)
	return ok
end

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
function PlayerData.applyRoundRoles(killer: Player, participants: { Player })
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
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	local wins = Instance.new("IntValue")
	wins.Name = "Victorias"
	wins.Parent = leaderstats
	leaderstats.Parent = player

	local ok, raw = retry(function()
		return store:GetAsync(key(player))
	end)
	if not player.Parent then
		return
	end
	if not ok then
		-- Sin datos no guardamos nada para no sobrescribir el progreso real.
		warn(`[PlayerData] no se pudieron cargar los datos de {player.Name}; sesión sin guardado`)
	end
	sessions[player] = sanitize(raw)
	if not ok then
		player:SetAttribute("DataUnsaved", true)
	end
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
