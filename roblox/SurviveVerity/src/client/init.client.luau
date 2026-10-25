--!strict
-- Único LocalScript: carga los controladores en dos fases.

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
