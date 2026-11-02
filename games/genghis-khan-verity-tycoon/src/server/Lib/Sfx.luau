--!strict
-- Efectos de sonido creados en el servidor (los oyen todos).
-- Con parent = una pieza, el sonido es 3D; con parent = workspace, es global.
local Debris = game:GetService("Debris")

local Sfx = {}

export type Options = {
	Volume: number?,
	Speed: number?,
	MaxDistance: number?,
	Lifetime: number?,
}

function Sfx.play(id: string | number, parent: Instance, options: Options?): Sound?
	if id == 0 or id == "" then
		return nil
	end
	local o: Options = options or {}
	local sound = Instance.new("Sound")
	sound.SoundId = if typeof(id) == "number" then "rbxassetid://" .. id else id
	sound.Volume = o.Volume or 1
	sound.PlaybackSpeed = o.Speed or 1
	sound.RollOffMaxDistance = o.MaxDistance or 150
	sound.Parent = parent
	sound:Play()
	Debris:AddItem(sound, o.Lifetime or 10)
	return sound
end

return Sfx
