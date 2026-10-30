--!strict
-- Ajustes del jugador (remote "Settings"):
--   ("Save", { music, effects, lowQuality, hitboxes }) -> se guardan con sus
--     datos (PlayerData los valida y los publica en el atributo Settings)
--   ("AFK", boolean) -> atributo AFK: no entra en las rondas hasta quitarlo
--     (solo durante la sesión)

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Net = require(ReplicatedStorage.Shared.Net)
local PlayerData = require(script.Parent.PlayerData)

local Settings = {}

local lastSave: { [Player]: number } = {}

function Settings.start()
	Net.get("Settings").OnServerEvent:Connect(function(player, kind, value)
		if kind == "Save" and typeof(value) == "table" then
			-- el cliente ya espera a que dejes de mover el deslizador
			if os.clock() - (lastSave[player] or 0) < 0.5 then
				return
			end
			lastSave[player] = os.clock()
			PlayerData.setSettings(player, value)
		elseif kind == "AFK" and typeof(value) == "boolean" then
			player:SetAttribute("AFK", value)
		end
	end)
	Players.PlayerRemoving:Connect(function(player)
		lastSave[player] = nil
	end)
end

return Settings
