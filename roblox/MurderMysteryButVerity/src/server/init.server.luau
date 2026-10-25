--!strict
-- Único Script del servidor: carga todos los sistemas en dos fases
-- (init síncrono para todos, luego start en paralelo). Cada sistema se
-- protege con pcall: si uno falla, el resto sigue funcionando y el error
-- queda en Output con el nombre del sistema.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Los remotes deben existir antes de que cualquier cliente los espere.
require(ReplicatedStorage.Shared.Net).setup()

local Systems = script.Systems

local loaded: { [string]: any } = {}
for _, child in Systems:GetChildren() do
	if child:IsA("ModuleScript") then
		local ok, result = pcall(require, child)
		if ok then
			loaded[child.Name] = result
		else
			warn(`[Server] no se pudo cargar {child.Name}: {result}`)
		end
	end
end

local function run(name: string, phase: string)
	local system = loaded[name]
	if system and typeof(system[phase]) == "function" then
		local ok, err = pcall(system[phase])
		if not ok then
			warn(`[Server] {name}.{phase} falló: {err}`)
		end
	end
end

-- MapService primero: el lobby debe existir antes de que aparezcan jugadores.
local ORDER = {
	"MapService", "PlayerData", "Monetization", "VerityModel", "Killer", "Movement",
	"Items", "Shop", "Coins", "Crafting", "Bots", "Lobby", "Round",
}
for _, name in ORDER do
	run(name, "init")
end
for name in loaded do
	if not table.find(ORDER, name) then
		run(name, "init")
	end
end

for name in loaded do
	task.spawn(run, name, "start")
end
