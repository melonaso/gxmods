--!strict
-- Punto único de definición de remotes. El servidor los crea al iniciar;
-- el cliente solo los espera. El estado continuo (fase, temporizador, oro)
-- viaja por atributos, así que solo hay eventos servidor -> cliente.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

export type RemoteName = "Notify" | "RoleReveal" | "RoundResult" | "Effect"

local NAMES: { RemoteName } = { "Notify", "RoleReveal", "RoundResult", "Effect" }
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

function Net.get(name: RemoteName): RemoteEvent
	return folder():WaitForChild(name) :: RemoteEvent
end

return Net
