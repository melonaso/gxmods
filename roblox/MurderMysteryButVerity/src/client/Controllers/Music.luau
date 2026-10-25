--!strict
-- Música ambiente de terror. Cambia de lista según la fase (lobby, ronda,
-- resultados) con un fundido, y encadena pistas al terminar cada una.
-- Las pistas son de DistroKid y APM oficiales en Roblox (uso permitido en
-- experiencias). Se puede silenciar desde el HUD.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local SoundService = game:GetService("SoundService")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)

local Music = {}

local sound: Sound
local currentList: { number } = {}
local currentName = ""
local index = 0
local enabled = true

local function listFor(phase: string): (string, { number })
	if phase == "Starting" or phase == "Playing" then
		return "Round", Config.Music.Round
	elseif phase == "Results" then
		return "Results", Config.Music.Results
	end
	return "Lobby", Config.Music.Lobby
end

local function fade(volume: number, time: number): Tween
	local tween = TweenService:Create(sound, TweenInfo.new(time, Enum.EasingStyle.Sine), { Volume = volume })
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
		fade(Config.Music.Volume, 2)
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
	local name, list = listFor(phase)
	if name == currentName then
		return
	end
	currentName = name
	currentList = list
	index = math.random(0, math.max(0, #list - 1))
	if sound.IsPlaying then
		fade(0, 1.2).Completed:Wait()
	end
	playNext()
end

function Music.setEnabled(value: boolean)
	enabled = value
	fade(if value then Config.Music.Volume else 0, 0.6)
end

function Music.isEnabled(): boolean
	return enabled
end

function Music.init()
	sound = Instance.new("Sound")
	sound.Name = "AmbientMusic"
	sound.Looped = false
	sound.Volume = 0
	sound.Parent = SoundService
	sound.Ended:Connect(playNext)
end

function Music.start()
	Workspace:GetAttributeChangedSignal("Phase"):Connect(function()
		task.spawn(onPhase)
	end)
	onPhase()
end

return Music
