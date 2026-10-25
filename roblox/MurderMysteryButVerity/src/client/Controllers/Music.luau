--!strict
-- Música ambiente de terror en tres capas:
--   1. pista principal según la fase (lobby, ronda interior, ronda exterior,
--      resultados), con fundido entre pistas
--   2. zumbido metálico muy bajo durante la ronda
--   3. persecución: sube cuando Verity está cerca de alguien (si eres Verity,
--      cerca de un superviviente; si eres superviviente, cerca de Verity)
-- Pistas de DistroKid y APM oficiales en Roblox (uso permitido en experiencias),
-- encontradas con ForgeGUI. Se silencia todo con el botón ♪ del HUD.

local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local SoundService = game:GetService("SoundService")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)

local player = Players.LocalPlayer
local CHASE_RADIUS = 38

local Music = {}

local sound: Sound
local drone: Sound
local chase: Sound
local currentList: { number } = {}
local currentName = ""
local index = 0
local enabled = true
local transitioning = false

local function listFor(phase: string): (string, { number })
	if phase == "Starting" or phase == "Playing" then
		if Workspace:GetAttribute("MapOutdoor") then
			return "Outdoor", Config.Music.Outdoor
		end
		return "Round", Config.Music.Round
	elseif phase == "Results" then
		return "Results", Config.Music.Results
	end
	return "Lobby", Config.Music.Lobby
end

local function fade(target: Sound, volume: number, time: number): Tween
	local tween = TweenService:Create(target, TweenInfo.new(time, Enum.EasingStyle.Sine), { Volume = volume })
	tween:Play()
	return tween
end

local function playNext()
	if #currentList == 0 then
		sound:Stop()
		return
	end
	index = index % #currentList + 1
	sound.SoundId = `rbxassetid://{currentList[index]}`
	sound.TimePosition = 0
	sound.Volume = 0
	sound:Play()
	if enabled then
		fade(sound, Config.Music.Volume, 2)
	end
	-- si la pista no carga (moderada o no disponible), pasa a la siguiente
	local expected = sound.SoundId
	task.delay(8, function()
		if sound.SoundId == expected and sound.TimeLength == 0 and #currentList > 1 then
			playNext()
		end
	end)
end

local function onPhase()
	local phase = (Workspace:GetAttribute("Phase") :: string?) or "Waiting"
	local inRound = phase == "Playing" or phase == "Starting"
	fade(drone, if inRound and enabled then Config.Music.Volume * 0.35 else 0, 2)
	local name, list = listFor(phase)
	if name == currentName then
		return
	end
	currentName = name
	currentList = list
	index = math.random(0, math.max(0, #list - 1))
	transitioning = true
	if sound.IsPlaying then
		fade(sound, 0, 1.2).Completed:Wait()
	end
	playNext()
	task.delay(2.1, function()
		transitioning = false
	end)
end

-- Distancia entre Verity y el superviviente más cercano que me importa.
local function threatDistance(): number
	local role = player:GetAttribute("Role")
	local character = player.Character
	local root = character and character:FindFirstChild("HumanoidRootPart")
	if not (root and root:IsA("BasePart")) then
		return math.huge
	end
	local best = math.huge
	local function consider(model: Instance?)
		local other = model and model:FindFirstChild("HumanoidRootPart")
		local humanoid = model and model:FindFirstChildOfClass("Humanoid")
		if other and other:IsA("BasePart") and humanoid and humanoid.Health > 0 then
			best = math.min(best, (other.Position - root.Position).Magnitude)
		end
	end
	if role == "Verity" then
		for _, other in Players:GetPlayers() do
			if other:GetAttribute("Role") == "Survivor" then
				consider(other.Character)
			end
		end
		for _, bot in CollectionService:GetTagged("Bot") do
			if not bot:GetAttribute("Hidden") then
				consider(bot)
			end
		end
	elseif role == "Survivor" then
		for _, other in Players:GetPlayers() do
			if other:GetAttribute("Role") == "Verity" and other.Character and other.Character:GetAttribute("Released") then
				consider(other.Character)
			end
		end
	end
	return best
end

function Music.setEnabled(value: boolean)
	enabled = value
	fade(sound, if value then Config.Music.Volume else 0, 0.6)
	onPhase()
end

function Music.isEnabled(): boolean
	return enabled
end

function Music.init()
	sound = Instance.new("Sound")
	sound.Name = "AmbientMusic"
	sound.Volume = 0
	sound.Parent = SoundService
	sound.Ended:Connect(playNext)

	drone = Instance.new("Sound")
	drone.Name = "AmbientDrone"
	drone.SoundId = `rbxassetid://{Config.Music.Drone}`
	drone.Looped = true
	drone.Volume = 0
	drone.Parent = SoundService

	chase = Instance.new("Sound")
	chase.Name = "ChaseMusic"
	chase.SoundId = `rbxassetid://{Config.Music.Chase}`
	chase.Looped = true
	chase.Volume = 0
	chase.Parent = SoundService
end

function Music.start()
	Workspace:GetAttributeChangedSignal("Phase"):Connect(function()
		task.spawn(onPhase)
	end)
	drone:Play()
	chase:Play()
	onPhase()

	-- la persecución sube y baja según la distancia; la música principal se agacha
	local accumulator = 0
	local chaseLevel = 0
	RunService.Heartbeat:Connect(function(dt)
		accumulator += dt
		if accumulator < 0.25 then
			return
		end
		accumulator = 0
		local phase = Workspace:GetAttribute("Phase")
		local target = 0
		if enabled and phase == "Playing" then
			local d = threatDistance()
			target = math.clamp(1 - (d - 12) / (CHASE_RADIUS - 12), 0, 1)
		end
		chaseLevel += (target - chaseLevel) * 0.35
		chase.Volume = chaseLevel * Config.Music.Volume * 1.6
		if enabled and sound.IsPlaying and not transitioning then
			sound.Volume = Config.Music.Volume * (1 - 0.7 * chaseLevel)
		end
	end)
end

return Music
