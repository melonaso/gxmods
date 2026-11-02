--!strict
-- Efectos de sonido creados en el servidor (los oyen todos).
-- Con parent = una pieza, el sonido es 3D; con parent = workspace, es global.
-- Cada sonido va a un SoundGroup de SoundService:
--   "Effects" (por defecto): se ensordece mientras suena el canto de garganta
--   "Song": el canto mismo, que nunca se ensordece
-- (Controllers/SoundDuck hace el ensordecido en cada cliente.)
local Debris = game:GetService("Debris")
local SoundService = game:GetService("SoundService")

local Sfx = {}

export type Options = {
	Volume: number?,
	Speed: number?,
	MinDistance: number?,
	MaxDistance: number?,
	Lifetime: number?,
	Group: string?,
}

function Sfx.group(name: string): SoundGroup
	local existing = SoundService:FindFirstChild(name)
	if existing and existing:IsA("SoundGroup") then
		return existing
	end
	local g = Instance.new("SoundGroup")
	g.Name = name
	g.Parent = SoundService
	return g
end

function Sfx.play(id: string | number, parent: Instance, options: Options?): Sound?
	if id == 0 or id == "" then
		return nil
	end
	local o: Options = options or {}
	local sound = Instance.new("Sound")
	sound.SoundId = if typeof(id) == "number" then "rbxassetid://" .. id else id
	sound.Volume = o.Volume or 1
	sound.PlaybackSpeed = o.Speed or 1
	sound.RollOffMinDistance = o.MinDistance or 10
	sound.RollOffMaxDistance = o.MaxDistance or 150
	sound.SoundGroup = Sfx.group(o.Group or "Effects")
	sound.Parent = parent
	sound:Play()
	Debris:AddItem(sound, o.Lifetime or 10)
	return sound
end

return Sfx
