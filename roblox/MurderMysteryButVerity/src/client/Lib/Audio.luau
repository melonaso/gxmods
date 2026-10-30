--!strict
-- Grupos de sonido del cliente para los volúmenes de Ajustes:
--   "Music"   la música y sus capas (Music.luau les pone el grupo al crearlas)
--   "Effects" todo lo demás (pasos, gritos, máquinas, avisos...): cualquier
--             sonido sin grupo que aparezca en el mundo, la interfaz o
--             SoundService entra aquí.

local Players = game:GetService("Players")
local SoundService = game:GetService("SoundService")
local Workspace = game:GetService("Workspace")

local Audio = {}

local groups: { [string]: SoundGroup } = {}

function Audio.group(name: string): SoundGroup
	local existing = groups[name]
	if existing then
		return existing
	end
	local group = Instance.new("SoundGroup")
	group.Name = name
	group.Volume = 1
	group.Parent = SoundService
	groups[name] = group
	return group
end

function Audio.setVolume(name: string, volume: number)
	Audio.group(name).Volume = math.clamp(volume, 0, 1)
end

local function assign(inst: Instance)
	if inst:IsA("Sound") and inst.SoundGroup == nil then
		inst.SoundGroup = Audio.group("Effects")
	end
end

function Audio.watch()
	local roots: { Instance } = { Workspace, SoundService, Players.LocalPlayer:WaitForChild("PlayerGui") }
	for _, root in roots do
		for _, inst in root:GetDescendants() do
			assign(inst)
		end
		root.DescendantAdded:Connect(assign)
	end
end

return Audio
