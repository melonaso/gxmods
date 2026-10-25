--!strict
-- Compras con monedas: objetos y skins de Verity. El cliente solo pide
-- ("BuyItem", key) / ("EquipItem", key) / ("BuySkin", key) / ("EquipSkin", key);
-- aquí se valida todo (existencia, precio, propiedad, límite de equipados).

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Net = require(ReplicatedStorage.Shared.Net)
local Items = require(script.Parent.Items)
local PlayerData = require(script.Parent.PlayerData)

local Shop = {}

local lastRequest: { [Player]: number } = {}

local function find(list: { any }, key: string): any?
	for _, entry in list do
		if entry.Key == key then
			return entry
		end
	end
	return nil
end

local function notify(player: Player, text: string, kind: string?)
	Net.get("Notify"):FireClient(player, text, kind or "info")
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
			notify(player, `Te faltan {item.Price - data.coins} monedas.`, "warn")
			return
		end
		table.insert(data.items, key)
		if #data.equipped < Config.MaxEquipped then
			table.insert(data.equipped, key)
		end
		PlayerData.publish(player)
		Items.give(player)
		notify(player, `Compraste {item.Title}.`, "good")
		persist(player)
	elseif action == "EquipItem" then
		if not table.find(data.items, key) then
			return
		end
		local index = table.find(data.equipped, key)
		if index then
			table.remove(data.equipped, index)
		elseif #data.equipped >= Config.MaxEquipped then
			notify(player, `Solo puedes llevar {Config.MaxEquipped} objetos. Quita uno primero.`, "warn")
			return
		else
			table.insert(data.equipped, key)
		end
		PlayerData.publish(player)
		Items.give(player)
		persist(player)
	elseif action == "BuySkin" then
		local skin = find(Config.Skins, key)
		if not skin or table.find(data.skins, key) then
			return
		end
		if not PlayerData.spendCoins(player, skin.Price) then
			notify(player, `Te faltan {skin.Price - data.coins} monedas.`, "warn")
			return
		end
		table.insert(data.skins, key)
		data.skin = key
		PlayerData.publish(player)
		notify(player, `Skin {skin.Title} comprada y equipada.`, "good")
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
