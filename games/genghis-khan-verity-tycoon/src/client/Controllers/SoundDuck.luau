--!strict
-- Mientras suena un canto de garganta cerca (a menos de DuckRadius), todo lo
-- demas se ensordece: la musica y los efectos bajan de volumen y pierden los
-- agudos (como oidos bajo el agua), para que el canto se oiga claro.
-- El canto va en el grupo "Song" y nunca se toca.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local SoundService = game:GetService("SoundService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)

local T = Config.ThroatSing
local DUCKED_GROUPS = { "Effects", "Music" }

local SoundDuck = {}

local duck = 0 -- 0 = normal, 1 = totalmente ensordecido

local function equalizer(group: SoundGroup): EqualizerSoundEffect
	local existing = group:FindFirstChild("SongDuck")
	if existing and existing:IsA("EqualizerSoundEffect") then
		return existing
	end
	local eq = Instance.new("EqualizerSoundEffect")
	eq.Name = "SongDuck"
	eq.HighGain = 0
	eq.MidGain = 0
	eq.LowGain = 0
	eq.Parent = group
	return eq
end

local function nearSong(): boolean
	local songUntil = (workspace:GetAttribute("SongUntil") :: number?) or 0
	if workspace:GetServerTimeNow() >= songUntil then
		return false
	end
	local songPos = workspace:GetAttribute("SongPos")
	local character = Players.LocalPlayer.Character
	local root = character and character:FindFirstChild("HumanoidRootPart")
	if typeof(songPos) ~= "Vector3" or not (root and root:IsA("BasePart")) then
		return true -- sin posicion: mejor ensordecer igual
	end
	return (root.Position - songPos).Magnitude <= T.DuckRadius
end

function SoundDuck.start()
	RunService.Heartbeat:Connect(function(dt)
		local target = if nearSong() then 1 else 0
		-- entra rapido (0.15 s) y sale despacio (~0.8 s)
		local speed = if target > duck then 7 else 1.3
		duck += (target - duck) * math.min(1, dt * speed)
		if duck < 0.001 and target == 0 then
			duck = 0
		end
		for _, name in DUCKED_GROUPS do
			local group = SoundService:FindFirstChild(name)
			if group and group:IsA("SoundGroup") then
				group.Volume = 1 - (1 - T.DuckVolume) * duck
				local eq = equalizer(group)
				eq.HighGain = -40 * duck
				eq.MidGain = -18 * duck
				eq.LowGain = -4 * duck
			end
		end
	end)
end

return SoundDuck
