--!strict
-- Unico punto de entrada del cliente. Arranque en dos fases:
-- init() de todos los controladores primero, luego start() de todos.
-- Cada controlador arranca protegido: si uno falla, se avisa en Output y los
-- demas siguen funcionando (antes un error cortaba todo el arranque).
local Controllers = script.Controllers

local loaded: { [string]: any } = {}
for _, child in Controllers:GetChildren() do
	if child:IsA("ModuleScript") then
		local ok, result = pcall(require, child)
		if ok then
			loaded[child.Name] = result
		else
			warn("[Client] no se pudo cargar " .. child.Name .. ": " .. tostring(result))
		end
	end
end

for name, system in loaded do
	if typeof(system.init) == "function" then
		local ok, err = pcall(system.init)
		if not ok then
			warn("[Client] " .. name .. ".init fallo: " .. tostring(err))
		end
	end
end

for name, system in loaded do
	if typeof(system.start) == "function" then
		task.spawn(function()
			local ok, err = pcall(system.start)
			if not ok then
				warn("[Client] " .. name .. ".start fallo: " .. tostring(err))
			end
		end)
	end
end
