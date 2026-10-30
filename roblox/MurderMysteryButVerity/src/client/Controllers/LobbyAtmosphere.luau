--!strict
-- El lobby siempre se ve con su luz cálida, aunque haya una ronda en marcha.
-- La iluminación de Roblox es una sola para todo el servidor y al empezar
-- cada ronda el servidor pone la noche oscura; quien está en el lobby (los
-- que esperan y los eliminados) vuelve a poner la del lobby solo en su
-- pantalla. Al salir del lobby (al llegar al mapa) se recupera la de la ronda.

local Lighting = game:GetService("Lighting")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local Atmosphere = require(ReplicatedStorage.Shared.Atmosphere)
local Location = require(script.Parent.Parent.Lib.Location)

local player = Players.LocalPlayer

local LobbyAtmosphere = {}

local overriding = false
local dirty = false

local function serverPreset(): string
	local name = Workspace:GetAttribute("Atmosphere")
	return if typeof(name) == "string" then name else "Lobby"
end

local function wanted(): boolean
	-- Verity no espera en el lobby durante su ronda y ya ve en la oscuridad
	return serverPreset() ~= "Lobby" and player:GetAttribute("Role") ~= "Verity" and Location.inLobby()
end

local function step()
	if wanted() then
		-- también después de cada cambio que llegue del servidor
		if not overriding or dirty then
			Atmosphere.apply("Lobby", false)
		end
		overriding = true
	elseif overriding then
		overriding = false
		Atmosphere.apply(serverPreset(), false)
	end
	dirty = false
end

local function watch(inst: Instance)
	inst.Changed:Connect(function()
		dirty = true
	end)
end

function LobbyAtmosphere.start()
	watch(Lighting)
	for _, child in Lighting:GetChildren() do
		watch(child)
	end
	Lighting.ChildAdded:Connect(function(child)
		watch(child)
		dirty = true
	end)
	local accumulator = 0
	RunService.Heartbeat:Connect(function(dt)
		accumulator += dt
		if accumulator >= 0.2 then
			accumulator = 0
			step()
		end
	end)
	step()
end

return LobbyAtmosphere
