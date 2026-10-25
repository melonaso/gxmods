--!strict
-- Punto único de definición de remotes. El servidor los crea al iniciar
-- (Net.setup); el cliente solo los espera. El estado continuo (fase,
-- temporizador, oro, estamina) viaja por atributos.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

-- Remotes cliente -> servidor: "Action" (Shift, C, Q) y "ShopRequest"
-- (comprar/equipar). El servidor valida rol, precio y límites.
export type RemoteName = "Notify" | "RoleReveal" | "RoundResult" | "Effect" | "Action" | "ShopRequest"

local NAMES: { RemoteName } = { "Notify", "RoleReveal", "RoundResult", "Effect", "Action", "ShopRequest" }
local FOLDER_NAME = "Remotes"

local Net = {}

local function folder(): Folder
	if RunService:IsServer() then
		local existing = ReplicatedStorage:FindFirstChild(FOLDER_NAME)
		if existing then
			return existing :: Folder
		end
		local f = Instance.new("Folder")
		f.Name = FOLDER_NAME
		for _, name in NAMES do
			local remote = Instance.new("RemoteEvent")
			remote.Name = name
			remote.Parent = f
		end
		f.Parent = ReplicatedStorage
		return f
	end
	return ReplicatedStorage:WaitForChild(FOLDER_NAME) :: Folder
end

-- Debe llamarse en el servidor antes que nada: si no, el cliente se queda
-- esperando la carpeta y la interfaz nunca se actualiza.
function Net.setup()
	folder()
end

function Net.get(name: RemoteName): RemoteEvent
	return folder():WaitForChild(name) :: RemoteEvent
end

return Net
