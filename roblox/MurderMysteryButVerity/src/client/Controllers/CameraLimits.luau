--!strict
-- Límite de alejamiento de la cámara según el rol (Config.Camera). El
-- servidor ya lo fija, pero se aplica también aquí: el cambio en el propio
-- cliente es inmediato y no depende de la replicación.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)

local player = Players.LocalPlayer

local CameraLimits = {}

local function apply()
	local role = player:GetAttribute("Role")
	local max = if role == "Verity"
		then Config.Camera.VerityMaxZoom
		elseif role == "Survivor" then Config.Camera.SurvivorMaxZoom
		else Config.Camera.LobbyMaxZoom
	if player.CameraMaxZoomDistance ~= max then
		player.CameraMaxZoomDistance = max
	end
	player.CameraMinZoomDistance = math.min(player.CameraMinZoomDistance, max)
end

function CameraLimits.start()
	player:GetAttributeChangedSignal("Role"):Connect(apply)
	player.CharacterAdded:Connect(function()
		task.defer(apply)
	end)
	-- si algo lo cambia (otro script, replicación tardía), se vuelve a fijar
	player:GetPropertyChangedSignal("CameraMaxZoomDistance"):Connect(apply)
	apply()
end

return CameraLimits
