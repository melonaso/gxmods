--!strict
-- Musica de fondo segun el momento:
--   Calma   -> construyendo el tycoon
--   Aviso   -> ultimo minuto antes de que llegue Verity
--   Batalla -> Verity esta aqui (con una capa de zumbido grave de tension)
-- Boton "Musica" abajo a la izquierda para silenciarla.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local SoundService = game:GetService("SoundService")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)

local M = Config.Music

type Mode = "Calm" | "Warning" | "Battle"

local Music = {}

local mode: Mode? = nil
local track: Sound? = nil
local drone: Sound
local muted = false
local index: { [string]: number } = { Calm = 0, Warning = 0, Battle = 0 }

local musicGroup: SoundGroup

local function newSound(id: number, looped: boolean): Sound
	local s = Instance.new("Sound")
	s.SoundGroup = musicGroup -- lo ensordece Controllers/SoundDuck durante el canto
	s.SoundId = "rbxassetid://" .. id
	s.Looped = looped
	s.Volume = 0
	s.Parent = SoundService
	return s
end

local function fadeOut(s: Sound)
	TweenService:Create(s, TweenInfo.new(1.5), { Volume = 0 }):Play()
	task.delay(1.6, function()
		s:Destroy()
	end)
end

local playNext: (Mode) -> ()

function playNext(m: Mode)
	local list = M[m] :: { number }
	if #list == 0 then
		return
	end
	index[m] = index[m] % #list + 1
	local s = newSound(list[index[m]], false)
	track = s
	s:Play()
	TweenService:Create(s, TweenInfo.new(1.5), { Volume = if muted then 0 else M.Volume }):Play()
	s.Ended:Connect(function()
		if track == s and mode == m then
			s:Destroy()
			playNext(m)
		end
	end)
	-- si la pista no carga (moderada o no disponible), pasa a la siguiente
	task.delay(6, function()
		if track == s and mode == m and s.TimeLength == 0 and #list > 1 then
			s:Destroy()
			playNext(m)
		end
	end)
end

local function setMode(m: Mode)
	if m == mode then
		return
	end
	mode = m
	if track then
		fadeOut(track)
		track = nil
	end
	playNext(m)
	local droneVolume = if m == "Battle" and not muted then M.Volume * 0.6 else 0
	TweenService:Create(drone, TweenInfo.new(2), { Volume = droneVolume }):Play()
end

local function currentMode(): Mode
	local phase = workspace:GetAttribute("VerityPhase")
	if phase == "Active" or phase == "Final" or phase == "Fleeing" then
		return "Battle"
	end
	local nextAt = (workspace:GetAttribute("VerityNextAt") :: number?) or math.huge
	if nextAt - workspace:GetServerTimeNow() <= 60 then
		return "Warning"
	end
	return "Calm"
end

function Music.init()
	-- grupo local (solo en este cliente)
	musicGroup = Instance.new("SoundGroup")
	musicGroup.Name = "Music"
	musicGroup.Parent = SoundService
	drone = newSound(M.Drone, true)
	drone.PlaybackSpeed = 0.8
	drone:Play()

	local gui = Instance.new("ScreenGui")
	gui.Name = "MusicToggle"
	gui.ResetOnSpawn = false
	local button = Instance.new("TextButton")
	button.Size = UDim2.fromOffset(110, 30)
	button.Position = UDim2.new(0, 16, 1, -16)
	button.AnchorPoint = Vector2.new(0, 1)
	button.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
	button.BackgroundTransparency = 0.3
	button.Font = Enum.Font.GothamBold
	button.TextSize = 16
	button.TextColor3 = Color3.new(1, 1, 1)
	button.Text = "Musica: si"
	button.Parent = gui
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 6)
	corner.Parent = button
	button.Activated:Connect(function()
		muted = not muted
		button.Text = if muted then "Musica: no" else "Musica: si"
		if track then
			track.Volume = if muted then 0 else M.Volume
		end
		drone.Volume = if not muted and mode == "Battle" then M.Volume * 0.6 else 0
	end)
	gui.Parent = Players.LocalPlayer:WaitForChild("PlayerGui")
end

function Music.start()
	local acc = 0
	RunService.Heartbeat:Connect(function(dt)
		acc += dt
		if acc < 0.5 then
			return
		end
		acc = 0
		setMode(currentMode())
	end)
end

return Music
