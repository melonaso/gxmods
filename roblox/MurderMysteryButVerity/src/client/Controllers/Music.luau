--!strict
-- Audio de tensión. La música suena SOLO en el lobby (las pistas de
-- partida); en el mapa no hay música, solo lo que da miedo:
--   1. ambiente de la ronda: un zumbido metálico y un retumbar grave que
--      suben de volumen y de tono con la tensión
--   2. persecución industrial cuando Verity está cerca de alguien (si eres
--      Verity, cerca de un superviviente; si eres superviviente, cerca de
--      Verity), montada por capas en el cliente:
--        - el zumbido metálico acelerado y distorsionado, con un temblor
--          mecánico (maquinaria que rechina)
--        - golpes de prensa hidráulica distorsionados, cada vez más rápidos
--        - chirridos y raspados de metal al azar
--   3. latido grave (supervivientes): empieza cuando Verity está a ~55 studs
--      y se acelera al acercarse
-- La tensión también sube antes de que Verity despierte, durante la
-- revelación de cada minuto y en el último minuto. El botón ♪ del HUD lo
-- silencia todo; el volumen está en Ajustes (grupo "Music").

local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local SoundService = game:GetService("SoundService")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Audio = require(script.Parent.Parent.Lib.Audio)
local Location = require(script.Parent.Parent.Lib.Location)

local player = Players.LocalPlayer
local CHASE_RADIUS = 38
local HEART_RADIUS = 55
local FINAL_MINUTE = 60

local Music = {}

local sound: Sound -- pista del lobby
local drone: Sound
local rumble: Sound
local grind: Sound -- base de la persecución
local hitTemplate: Sound
local scrapeTemplate: Sound
local heart: Sound
local index = 0
local enabled = true
local inLobby: boolean? = nil
local transitioning = false

local function fade(target: Sound, volume: number, time: number): Tween
	local tween = TweenService:Create(target, TweenInfo.new(time, Enum.EasingStyle.Sine), { Volume = volume })
	tween:Play()
	return tween
end

local function playNext()
	local list = Config.Music.Lobby
	if #list == 0 or not inLobby then
		sound:Stop()
		return
	end
	index = index % #list + 1
	sound.SoundId = `rbxassetid://{list[index]}`
	sound.TimePosition = 0
	sound.Volume = 0
	sound:Play()
	if enabled then
		fade(sound, Config.Music.Volume, 2)
	end
	-- si la pista no carga (moderada o no disponible), pasa a la siguiente
	local expected = sound.SoundId
	task.delay(8, function()
		if sound.SoundId == expected and sound.TimeLength == 0 and #list > 1 then
			playNext()
		end
	end)
end

-- Música solo en el lobby: entra al volver y se apaga al llegar al mapa.
local function refreshTrack()
	local here = Location.inLobby()
	if here == inLobby then
		return
	end
	inLobby = here
	transitioning = true
	if here then
		index = math.random(0, math.max(0, #Config.Music.Lobby - 1))
		if sound.IsPlaying then
			fade(sound, 0, 0.8).Completed:Wait()
		end
		playNext()
	elseif sound.IsPlaying then
		fade(sound, 0, 1.2).Completed:Wait()
		if not inLobby then
			sound:Stop()
		end
	end
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
		-- Verity puede ser otro jugador o un NPC
		for _, verity in CollectionService:GetTagged("VerityCharacter") do
			if verity:GetAttribute("Released") then
				consider(verity)
			end
		end
	end
	return best
end

local function layer(name: string, id: number | string, looped: boolean): Sound
	local s = Instance.new("Sound")
	s.Name = name
	s.SoundId = if typeof(id) == "number" then `rbxassetid://{id}` else id
	s.Looped = looped
	s.Volume = 0
	s.SoundGroup = Audio.group("Music") -- volumen de música en Ajustes
	s.Parent = SoundService
	return s
end

local function effect(className: string, parent: Instance, props: { [string]: any })
	local inst = Instance.new(className)
	for k, v in props do
		(inst :: any)[k] = v
	end
	inst.Parent = parent
end

-- Copia de una plantilla (con sus efectos) que se borra al terminar.
local function oneShot(template: Sound, speed: number, volume: number)
	local s = template:Clone()
	s.PlaybackSpeed = speed
	s.Volume = volume
	s.Parent = SoundService
	s:Play()
	s.Ended:Once(function()
		s:Destroy()
	end)
	game:GetService("Debris"):AddItem(s, 4)
end

function Music.setEnabled(value: boolean)
	enabled = value
	if inLobby then
		fade(sound, if value then Config.Music.Volume else 0, 0.6)
	end
end

function Music.isEnabled(): boolean
	return enabled
end

function Music.init()
	sound = layer("LobbyMusic", "", false)
	sound.Ended:Connect(playNext)

	drone = layer("TensionDrone", Config.Music.Drone, true)
	rumble = layer("TensionRumble", Config.Music.Rumble, true)
	heart = layer("Heartbeat", Config.Music.HeartbeatHit, false)

	-- persecución: maquinaria que rechina...
	grind = layer("ChaseGrind", Config.Music.Drone, true)
	grind.PlaybackSpeed = 1.45
	effect("DistortionSoundEffect", grind, { Level = 0.55 })
	effect("TremoloSoundEffect", grind, { Depth = 0.6, Frequency = 7, Duty = 0.5 })
	effect("EqualizerSoundEffect", grind, { LowGain = 4, MidGain = 2, HighGain = 3 })
	-- ...golpes de prensa...
	hitTemplate = layer("ChaseHit", Config.Music.HeartbeatHit, false)
	effect("DistortionSoundEffect", hitTemplate, { Level = 0.8 })
	effect("ReverbSoundEffect", hitTemplate, { DecayTime = 1.6, Density = 1, Diffusion = 0.6, WetLevel = -4 })
	-- ...y chirridos de metal
	scrapeTemplate = layer("ChaseScrape", Config.Music.ChaseScrape, false)
	effect("DistortionSoundEffect", scrapeTemplate, { Level = 0.7 })
	effect("ReverbSoundEffect", scrapeTemplate, { DecayTime = 2.5, Density = 1, Diffusion = 0.8, WetLevel = -2 })
end

function Music.start()
	for _, s in { drone, rumble, grind } do
		s:Play()
	end
	refreshTrack()

	local V = Config.Music.Volume
	local accumulator = 0
	local chaseLevel = 0
	local tension = 0
	local nextBeat = 0
	local nextHit = 0
	local hitCount = 0
	local nextScrape = 0
	RunService.Heartbeat:Connect(function(dt)
		accumulator += dt
		if accumulator < 0.05 then
			return
		end
		local step = accumulator
		accumulator = 0
		task.spawn(refreshTrack)

		local phase = Workspace:GetAttribute("Phase")
		local playing = enabled and phase == "Playing"
		local inRound = enabled and (phase == "Playing" or phase == "Starting") and not inLobby
		local now = Workspace:GetServerTimeNow()
		local clock = os.clock()

		-- ¿qué tan cerca está el peligro?
		local distance = if playing and not inLobby then threatDistance() else math.huge
		local chaseTarget = math.clamp(1 - (distance - 12) / (CHASE_RADIUS - 12), 0, 1)
		chaseLevel += (chaseTarget - chaseLevel) * math.min(1, step * 3.5)

		-- tensión general: cercanía, cuenta atrás de Verity, revelación y último minuto
		local target = 0
		if inRound then
			target = 0.25 + 0.75 * math.clamp(1 - (distance - 12) / (HEART_RADIUS - 12), 0, 1)
			local releaseAt = (Workspace:GetAttribute("KillerReleaseAt") :: number?) or 0
			if releaseAt > now and releaseAt - now < 6 then
				target = math.max(target, 0.85)
			end
			if ((Workspace:GetAttribute("RevealUntil") :: number?) or 0) > now then
				target = math.max(target, 0.7)
			end
			local endsAt = (Workspace:GetAttribute("PhaseEndsAt") :: number?) or 0
			if playing and endsAt > now and endsAt - now <= FINAL_MINUTE then
				target = math.max(target, 0.65)
			end
		end
		tension += (target - tension) * math.min(1, step * 2)

		-- ambiente de la ronda (en el lobby, nada)
		drone.Volume = if inRound then V * (0.45 + 0.9 * tension) * (1 - 0.5 * chaseLevel) else 0
		drone.PlaybackSpeed = 0.9 + 0.25 * tension
		rumble.Volume = if inRound then V * (0.5 + 0.6 * tension) else 0

		-- persecución industrial
		grind.Volume = chaseLevel * V * 2.2
		grind.PlaybackSpeed = 1.3 + 0.35 * chaseLevel
		if chaseLevel > 0.15 and clock >= nextHit then
			-- golpe-golpe-silencio, como una prensa; más rápido cuanto más cerca
			hitCount += 1
			local accent = hitCount % 4 == 1
			nextHit = clock + (0.62 - 0.32 * chaseLevel) * (if hitCount % 4 == 3 then 0.5 else 1)
			if hitCount % 4 ~= 0 then
				oneShot(hitTemplate, if accent then 0.5 else 0.62, chaseLevel * (if accent then 2.2 else 1.5))
			end
		end
		if chaseLevel > 0.4 and clock >= nextScrape then
			nextScrape = clock + math.random(12, 35) / 10 * (1.4 - chaseLevel)
			oneShot(scrapeTemplate, math.random(26, 48) / 100, chaseLevel * 1.6)
		end
		if chaseLevel < 0.05 then
			hitCount = 0
		end
		if enabled and inLobby and sound.IsPlaying and not transitioning then
			sound.Volume = V
		end

		-- latido: solo supervivientes, más rápido cuanto más cerca está Verity
		local closeness = math.clamp(1 - (distance - 10) / (HEART_RADIUS - 10), 0, 1)
		if playing and player:GetAttribute("Role") == "Survivor" and closeness > 0 and clock >= nextBeat then
			nextBeat = clock + (1.15 - 0.7 * closeness)
			local volume = (0.35 + 0.65 * closeness) * 1.4
			-- "pum-pum": dos golpes graves (copias, para que no se corten entre sí)
			for k, offset in { 0, 0.17 } do
				task.delay(offset, function()
					oneShot(heart, if k == 1 then 0.42 else 0.36, if k == 1 then volume else volume * 0.7)
				end)
			end
		end
	end)
end

return Music
