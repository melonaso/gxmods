--!strict
-- Único Script del servidor: carga todos los sistemas en dos fases
-- (init síncrono para todos, luego start en paralelo).

local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Los remotes deben existir antes de que cualquier cliente los espere.
require(ReplicatedStorage.Shared.Net).setup()

local Systems = script.Systems

local loaded: { [string]: any } = {}
for _, child in Systems:GetChildren() do
	if child:IsA("ModuleScript") then
		loaded[child.Name] = require(child) :: any
	end
end

-- MapService primero: el lobby debe existir antes de que aparezcan jugadores.
local ORDER = { "MapService", "PlayerData", "Monetization", "Killer", "Movement", "Crafting", "Bots", "Round" }
for _, name in ORDER do
	local system = loaded[name]
	if system and typeof(system.init) == "function" then
		system.init()
	end
end
for name, system in loaded do
	if not table.find(ORDER, name) and typeof(system.init) == "function" then
		system.init()
	end
end

for _, system in loaded do
	if typeof(system.start) == "function" then
		task.spawn(system.start)
	end
end
