--!strict
-- Oro, compras y muertes de Verity por jugador, con guardado en DataStore.
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local Types = require(Shared.Types)

type Session = {
	profile: Types.Profile,
	canSave: boolean,
	goldValue: IntValue,
	killsValue: IntValue,
	rebirthValue: IntValue,
}

local PlayerData = {}

local sessions: { [Player]: Session } = {}
local store: DataStore? = nil

local loadedEvent = Instance.new("BindableEvent")
-- Se dispara con (player) cuando su perfil ya esta cargado.
PlayerData.Loaded = loadedEvent.Event

local function keyFor(player: Player): string
	return "player_" .. player.UserId
end

local function sync(session: Session)
	session.goldValue.Value = math.floor(session.profile.Gold)
	session.killsValue.Value = session.profile.VerityKills
	session.rebirthValue.Value = session.profile.Rebirths
end

local function load(player: Player)
	local profile: Types.Profile = { Gold = Config.StartingGold, Owned = {}, VerityKills = 0, Rebirths = 0 }
	local canSave = false
	-- SaveStatus (lo muestra el HUD): "ok" se guarda | "off" sin DataStore | "error" no se pudo leer
	local status = "off"

	if store then
		local ok, data = false, nil
		for attempt = 1, 3 do
			ok, data = pcall(function()
				return (store :: DataStore):GetAsync(keyFor(player))
			end)
			if ok then
				break
			end
			task.wait(attempt)
		end
		if ok then
			canSave = true
			status = "ok"
			if typeof(data) == "table" then
				profile.Gold = math.max(0, tonumber(data.Gold) or profile.Gold)
				profile.VerityKills = math.max(0, tonumber(data.VerityKills) or 0)
				profile.Rebirths = math.max(0, math.floor(tonumber(data.Rebirths) or 0))
				if typeof(data.Owned) == "table" then
					for id, value in data.Owned do
						if typeof(id) == "string" and value == true then
							profile.Owned[id] = true
						end
					end
				end
			end
		else
			status = "error"
			-- No sobrescribimos datos que no pudimos leer.
			warn("[PlayerData] No se pudo cargar a " .. player.Name .. "; esta sesion no se guardara.")
		end
	end

	if not player.Parent then
		return -- se fue mientras cargaba
	end

	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	local goldValue = Instance.new("IntValue")
	goldValue.Name = "Oro"
	goldValue.Parent = leaderstats
	local killsValue = Instance.new("IntValue")
	killsValue.Name = "Verity"
	killsValue.Parent = leaderstats
	local rebirthValue = Instance.new("IntValue")
	rebirthValue.Name = "Renacer"
	rebirthValue.Parent = leaderstats
	leaderstats.Parent = player
	player:SetAttribute("SaveStatus", status)

	local session: Session = { profile = profile, canSave = canSave, goldValue = goldValue, killsValue = killsValue, rebirthValue = rebirthValue }
	sessions[player] = session
	sync(session)
	loadedEvent:Fire(player)
end

local function save(player: Player)
	local session = sessions[player]
	if not session or not session.canSave or not store then
		return
	end
	local snapshot = {
		Gold = math.floor(session.profile.Gold),
		VerityKills = session.profile.VerityKills,
		Rebirths = session.profile.Rebirths,
		Owned = table.clone(session.profile.Owned),
	}
	local ok, err = pcall(function()
		(store :: DataStore):UpdateAsync(keyFor(player), function()
			return snapshot
		end)
	end)
	if not ok then
		warn("[PlayerData] Error guardando a " .. player.Name .. ": " .. tostring(err))
	end
end

function PlayerData.isLoaded(player: Player): boolean
	return sessions[player] ~= nil
end

function PlayerData.getGold(player: Player): number
	local s = sessions[player]
	return if s then s.profile.Gold else 0
end

function PlayerData.addGold(player: Player, amount: number)
	local s = sessions[player]
	if not s or amount <= 0 then
		return
	end
	s.profile.Gold += amount
	sync(s)
end

function PlayerData.trySpend(player: Player, amount: number): boolean
	local s = sessions[player]
	if not s or s.profile.Gold < amount then
		return false
	end
	s.profile.Gold -= amount
	sync(s)
	return true
end

function PlayerData.owns(player: Player, id: string): boolean
	local s = sessions[player]
	return s ~= nil and s.profile.Owned[id] == true
end

function PlayerData.setOwned(player: Player, id: string)
	local s = sessions[player]
	if s then
		s.profile.Owned[id] = true
	end
end

function PlayerData.addVerityKill(player: Player)
	local s = sessions[player]
	if s then
		s.profile.VerityKills += 1
		sync(s)
	end
end

function PlayerData.getRebirths(player: Player): number
	local s = sessions[player]
	return if s then s.profile.Rebirths else 0
end

-- Cuanto oro extra gana por sus renacimientos (1 = nada extra).
function PlayerData.rebirthMultiplier(player: Player?): number
	if not player then
		return 1
	end
	return 1 + Config.Rebirth.BonusPerRebirth * PlayerData.getRebirths(player)
end

-- Renacer: campamento y oro desde cero, +1 renacimiento. Se guarda al momento.
function PlayerData.rebirth(player: Player)
	local s = sessions[player]
	if not s then
		return
	end
	s.profile.Owned = {}
	s.profile.Gold = Config.StartingGold
	s.profile.Rebirths += 1
	sync(s)
	task.spawn(save, player)
end

function PlayerData.init()
	local ok, result = pcall(function()
		return DataStoreService:GetDataStore(Config.DataStoreName)
	end)
	if ok then
		store = result
	else
		warn("[PlayerData] DataStore no disponible (activa 'Studio Access to API Services'). Sin guardado.")
	end

	Players.PlayerAdded:Connect(load)
	for _, player in Players:GetPlayers() do
		task.spawn(load, player)
	end

	Players.PlayerRemoving:Connect(function(player)
		save(player)
		sessions[player] = nil
	end)

	game:BindToClose(function()
		local pending = 0
		for player in sessions do
			pending += 1
			task.spawn(function()
				save(player)
				pending -= 1
			end)
		end
		local deadline = os.clock() + 25
		while pending > 0 and os.clock() < deadline do
			task.wait(0.1)
		end
	end)
end

function PlayerData.start()
	while true do
		task.wait(Config.AutosaveSeconds)
		for player in sessions do
			task.spawn(save, player)
		end
	end
end

return PlayerData
