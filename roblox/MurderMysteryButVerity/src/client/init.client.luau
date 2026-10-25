--!strict
-- Único LocalScript: carga los controladores en dos fases.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- el traductor del jugador debe estar listo antes de construir la interfaz
require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Locale")).init(3)

local Controllers = script.Controllers

local loaded: { any } = {}
for _, child in Controllers:GetChildren() do
	if child:IsA("ModuleScript") then
		table.insert(loaded, require(child) :: any)
	end
end
for _, controller in loaded do
	if typeof(controller.init) == "function" then
		controller.init()
	end
end
for _, controller in loaded do
	if typeof(controller.start) == "function" then
		task.spawn(controller.start)
	end
end
