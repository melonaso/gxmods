--!strict
-- Compras con monedas: objetos y skins de Verity. El cliente solo pide
-- ("BuyItem", key) / ("EquipItem", key) / ("BuySkin", key) / ("EquipSkin", key);
-- aquí se valida todo (existencia, precio, propiedad, límite de equipados).

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Locale = require(ReplicatedStorage.Shared.Locale)
local Net = require(ReplicatedStorage.Shared.Net)
local PlayerData = require(script.Parent.PlayerData)

local Shop = {}

local T = Locale.t

local lastRequest: { [Player]: number } = {}

local function find(list: { any }, key: string): any?
	for _, entry in list do
		if entry.Key == key then
			return entry
		end
	end
	return nil
end

local function notify(player: Player, text: string, kind: string?, args: { [string]: any }?)
	Net.get("Notify"):FireClient(player, text, kind or "info", args)
end

local function persist(player: Player)
	task.spawn(PlayerData.save, player)
end

local function onRequest(player: Player, action: unknown, key: unknown)
	local now = os.clock()
	if now - (lastRequest[player] or 0) < 0.25 then
		return
	end
	lastRequest[player] = now
	if typeof(action) ~= "string" or typeof(key) ~= "string" then
		return
	end
	local data = PlayerData.get(player)
	if not data then
		return
	end

	if action == "BuyItem" then
		local item = find(Config.Items, key)
		if not item or table.find(data.items, key) then
			return
		end
		if not PlayerData.spendCoins(player, item.Price) then
			notify(player, T("Te faltan {coins} monedas."), "warn", { coins = item.Price - data.coins })
			return
		end
		table.insert(data.items, key)
		if #data.equipped < Config.MaxEquipped then
			table.insert(data.equipped, key)
		end
		PlayerData.publish(player)
		notify(player, T("Compraste {item}."), "good", { item = Locale.ref(item.Title) })
		persist(player)
	elseif action == "EquipItem" then
		if not table.find(data.items, key) then
			return
		end
		local index = table.find(data.equipped, key)
		if index then
			table.remove(data.equipped, index)
		elseif #data.equipped >= Config.MaxEquipped then
			notify(player, T("Solo puedes llevar {count} objetos por ronda. Quita uno primero."), "warn", { count = Config.MaxEquipped })
			return
		else
			table.insert(data.equipped, key)
		end
		PlayerData.publish(player)
		persist(player)
	elseif action == "BuySkin" then
		local skin = find(Config.Skins, key)
		if not skin or table.find(data.skins, key) then
			return
		end
		if not PlayerData.spendCoins(player, skin.Price) then
			notify(player, T("Te faltan {coins} monedas."), "warn", { coins = skin.Price - data.coins })
			return
		end
		table.insert(data.skins, key)
		data.skin = key
		PlayerData.publish(player)
		notify(player, T("Skin {skin} comprada y equipada."), "good", { skin = Locale.ref(skin.Title) })
		persist(player)
	elseif action == "EquipSkin" then
		if not table.find(data.skins, key) then
			return
		end
		data.skin = key
		PlayerData.publish(player)
		persist(player)
	end
end

function Shop.init()
	Net.get("ShopRequest").OnServerEvent:Connect(onRequest)
	Players.PlayerRemoving:Connect(function(player)
		lastRequest[player] = nil
	end)
end

return Shop
