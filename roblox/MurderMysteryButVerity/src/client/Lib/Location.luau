--!strict
-- ¿Está mi personaje en el lobby? Se mide con la caja que ocupa el modelo
-- Workspace.Lobby (sirve igual con el lobby generado o con el de respaldo).

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

local player = Players.LocalPlayer

local Location = {}

type Box = { cf: CFrame, half: Vector3 }

local box: Box? = nil

local function lobbyBox(): Box?
	if box then
		return box
	end
	local lobby = Workspace:FindFirstChild("Lobby")
	if lobby and lobby:IsA("Model") then
		local cf, size = lobby:GetBoundingBox()
		box = { cf = cf, half = size / 2 + Vector3.new(4, 10, 4) } -- un poco de margen (saltos, el techo del obby)
	end
	return box
end

function Location.inLobby(): boolean
	local character = player.Character
	local root = character and character:FindFirstChild("HumanoidRootPart")
	local b = lobbyBox()
	if not (root and root:IsA("BasePart") and b) then
		-- sin personaje (reapareciendo): está en el lobby si no juega la ronda
		local role = player:GetAttribute("Role")
		return role ~= "Survivor" and role ~= "Verity"
	end
	local p = b.cf:PointToObjectSpace(root.Position)
	return math.abs(p.X) <= b.half.X and math.abs(p.Y) <= b.half.Y and math.abs(p.Z) <= b.half.Z
end

return Location
