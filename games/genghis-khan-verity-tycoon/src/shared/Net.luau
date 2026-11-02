--!strict
-- Envoltorio de remotes. El servidor los crea; el cliente los espera.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Remotes = require(script.Parent.Remotes)

local Net = {}

local folder: Folder
if RunService:IsServer() then
	local existing = ReplicatedStorage:FindFirstChild("Remotes")
	if existing and existing:IsA("Folder") then
		folder = existing
	else
		folder = Instance.new("Folder")
		folder.Name = "Remotes"
	end
	for _, name in Remotes do
		if not folder:FindFirstChild(name) then
			local remote = Instance.new("RemoteEvent")
			remote.Name = name
			remote.Parent = folder
		end
	end
	folder.Parent = ReplicatedStorage
else
	folder = ReplicatedStorage:WaitForChild("Remotes") :: Folder
end

local function get(name: Remotes.RemoteName): RemoteEvent
	return folder:WaitForChild(name) :: RemoteEvent
end

function Net.fireClient(player: Player, name: Remotes.RemoteName, ...: any)
	get(name):FireClient(player, ...)
end

function Net.fireAll(name: Remotes.RemoteName, ...: any)
	get(name):FireAllClients(...)
end

function Net.fireServer(name: Remotes.RemoteName, ...: any)
	get(name):FireServer(...)
end

function Net.onServer(name: Remotes.RemoteName, handler: (Player, ...any) -> ()): RBXScriptConnection
	return get(name).OnServerEvent:Connect(handler)
end

function Net.onClient(name: Remotes.RemoteName, handler: (...any) -> ()): RBXScriptConnection
	return get(name).OnClientEvent:Connect(handler)
end

return Net
