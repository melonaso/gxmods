--!strict
-- Música de terror por capas, pensada para que la tensión no baje nunca:
--   1. pista principal según la fase (lobby, ronda interior, ronda exterior,
--      resultados), con fundido entre pistas
--   2. durante la ronda, dos capas de fondo: un zumbido metálico y un
--      retumbar grave. El zumbido sube de volumen y de tono con la tensión
--   3. persecución: sube cuando Verity está cerca de alguien (si eres Verity,
--      cerca de un superviviente; si eres superviviente, cerca de Verity) y la
--      música principal se agacha
--   4. latido grave (supervivientes): empieza cuando Verity está a ~55 studs y
--      se acelera al acercarse
--   5. último minuto: la música principal cambia a una pista más urgente
-- La tensión también sube en los segundos antes de que Verity despierte y
-- durante la revelación de cada minuto.
-- Pistas de DistroKid, APM y Pro Sound Effects oficiales en Roblox (uso
-- permitido en experiencias), encontradas con ForgeGUI. El botón ♪ del HUD
-- lo silencia todo.

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
local HEART_RADIUS = 55
local FINAL_MINUTE = 60

local Music = {}

local sound: Sound
local drone: Sound
local rumble: Sound
local chase: Sound
local finale: Sound
local heart: Sound
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
		-- Verity puede ser otro jugador o un NPC (modo prueba)
		for _, verity in CollectionService:GetTagged("VerityCharacter") do
			if verity:GetAttribute("Released") then
				consider(verity)
			end
		end
	end
	return best
end

local function layer(name: string, id: number, looped: boolean): Sound
	local s = Instance.new("Sound")
	s.Name = name
	s.SoundId = `rbxassetid://{id}`
	s.Looped = looped
	s.Volume = 0
	s.Parent = SoundService
	return s
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

	drone = layer("TensionDrone", Config.Music.Drone, true)
	rumble = layer("TensionRumble", Config.Music.Rumble, true)
	chase = layer("ChaseMusic", Config.Music.Chase, true)
	finale = layer("FinalMinute", Config.Music.FinalMinute, true)
	heart = layer("Heartbeat", Config.Music.HeartbeatHit, false)
end

function Music.start()
	Workspace:GetAttributeChangedSignal("Phase"):Connect(function()
		task.spawn(onPhase)
	end)
	for _, s in { drone, rumble, chase, finale } do
		s:Play()
	end
	onPhase()

	local V = Config.Music.Volume
	local accumulator = 0
	local chaseLevel = 0
	local tension = 0
	local finaleLevel = 0
	local nextBeat = 0
	RunService.Heartbeat:Connect(function(dt)
		accumulator += dt
		if accumulator < 0.1 then
			return
		end
		local step = accumulator
		accumulator = 0

		local phase = Workspace:GetAttribute("Phase")
		local playing = enabled and phase == "Playing"
		local inRound = enabled and (phase == "Playing" or phase == "Starting")
		local now = Workspace:GetServerTimeNow()

		-- ¿qué tan cerca está el peligro?
		local distance = if playing then threatDistance() else math.huge
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
		end
		local endsAt = (Workspace:GetAttribute("PhaseEndsAt") :: number?) or 0
		local finalMinute = playing and endsAt > now and endsAt - now <= FINAL_MINUTE
		if finalMinute then
			target = math.max(target, 0.6)
		end
		tension += (target - tension) * math.min(1, step * 2)

		-- capas de fondo
		drone.Volume = if inRound then V * (0.45 + 0.9 * tension) else 0
		drone.PlaybackSpeed = 0.9 + 0.25 * tension
		rumble.Volume = if inRound then V * (0.5 + 0.5 * tension) else 0
		chase.Volume = chaseLevel * V * 1.7

		-- último minuto: la pista principal da paso a una más urgente
		finaleLevel += ((if finalMinute then 1 else 0) - finaleLevel) * math.min(1, step * 0.8)
		finale.Volume = finaleLevel * V * 1.1 * (1 - 0.6 * chaseLevel)
		if enabled and sound.IsPlaying and not transitioning then
			sound.Volume = V * (1 - 0.7 * chaseLevel) * (1 - finaleLevel)
		end

		-- latido: solo supervivientes, más rápido cuanto más cerca está Verity
		local closeness = math.clamp(1 - (distance - 10) / (HEART_RADIUS - 10), 0, 1)
		if playing and player:GetAttribute("Role") == "Survivor" and closeness > 0 then
			local clock = os.clock()
			if clock >= nextBeat then
				nextBeat = clock + (1.15 - 0.7 * closeness)
				local volume = (0.35 + 0.65 * closeness) * 1.4
				-- "pum-pum": dos golpes graves (copias, para que no se corten entre sí)
				for k, offset in { 0, 0.17 } do
					task.delay(offset, function()
						local beat = heart:Clone()
						beat.PlaybackSpeed = if k == 1 then 0.42 else 0.36
						beat.Volume = if k == 1 then volume else volume * 0.7
						beat.Parent = SoundService
						beat:Play()
						beat.Ended:Once(function()
							beat:Destroy()
						end)
						game:GetService("Debris"):AddItem(beat, 3)
					end)
				end
			end
		end
	end)
end

return Music
