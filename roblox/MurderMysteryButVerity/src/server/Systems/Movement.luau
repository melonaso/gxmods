--!strict
-- Velocidades autoritativas en el servidor.
--   Shift: correr (supervivientes con estamina; Verity sin límite y más rápida)
--   C:     agacharse (solo Verity)
--   Q:     atrapar (solo Verity, lo resuelve Killer)
--   F:     linterna de los supervivientes (sin batería; la ven todos)
--   TestRole: en modo prueba, elegir ser Verity o superviviente en la próxima ronda

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Config = require(ReplicatedStorage.Shared.Config)
local Net = require(ReplicatedStorage.Shared.Net)
local Killer = require(script.Parent.Killer)

local M = Config.Movement
local MAX_ACTIONS_PER_SECOND = 15

type State = {
	sprint: boolean,
	crouch: boolean,
	stamina: number,
	lastDrain: number,
	energizedUntil: number,
	actions: number,
	window: number,
}

local Movement = {}

local states: { [Player]: State } = {}

local function state(player: Player): State
	local s = states[player]
	if not s then
		s = { sprint = false, crouch = false, stamina = M.StaminaMax, lastDrain = 0, energizedUntil = 0, actions = 0, window = os.clock() }
		states[player] = s
	end
	return s
end

-- Linterna en la cabeza del superviviente: la crea el servidor para que
-- todos (también Verity) vean el haz.
local function setFlashlight(player: Player, on: boolean)
	local character = player.Character
	local head = character and character:FindFirstChild("Head")
	if not (character and head and head:IsA("BasePart")) then
		return
	end
	local light = head:FindFirstChild("Flashlight")
	if on and not light then
		local spot = Instance.new("SpotLight")
		spot.Name = "Flashlight"
		spot.Face = Enum.NormalId.Front
		spot.Range = 55
		spot.Angle = 50
		spot.Brightness = 4
		spot.Color = Color3.fromRGB(255, 238, 205)
		spot.Shadows = true
		spot.Parent = head
		light = spot
	end
	if light and light:IsA("SpotLight") then
		light.Enabled = on
	end
	character:SetAttribute("Flashlight", on or nil)
end

local function onAction(player: Player, action: unknown, value: unknown)
	local s = state(player)
	local clock = os.clock()
	if clock - s.window > 1 then
		s.window = clock
		s.actions = 0
	end
	s.actions += 1
	if s.actions > MAX_ACTIONS_PER_SECOND then
		return
	end

	local role = player:GetAttribute("Role")
	if action == "Sprint" and typeof(value) == "boolean" then
		s.sprint = value
	elseif action == "Crouch" and typeof(value) == "boolean" then
		s.crouch = value and role == "Verity"
	elseif action == "Kill" and role == "Verity" then
		Killer.tryKill(player)
	elseif action == "Flashlight" then
		local character = player.Character
		local on = not (character and character:GetAttribute("Flashlight"))
		setFlashlight(player, on and role == "Survivor")
	elseif action == "TestRole" and Config.Testing.Enabled and (value == "Verity" or value == "Survivor") then
		-- botón del lobby (modo prueba): rol en la próxima ronda
		player:SetAttribute("TestRole", value)
	end
end

local function update(dt: number)
	local clock = os.clock()
	for _, player in Players:GetPlayers() do
		local character = player.Character
		local humanoid = character and character:FindFirstChildOfClass("Humanoid")
		if not (character and humanoid) or humanoid.Health <= 0 then
			continue
		end
		local s = state(player)
		local role = player:GetAttribute("Role")
		local moving = humanoid.MoveDirection.Magnitude > 0.1
		-- bobinas de velocidad (las pone Items en el personaje)
		local mult = (character:GetAttribute("SpeedMult") :: number?) or 1
		local energized = clock < s.energizedUntil

		if role == "Verity" then
			local busy = Killer.isKilling()
			if busy then
				s.crouch = false
				humanoid.WalkSpeed = 0
			else
				local speed = if s.crouch then M.VerityCrouch elseif s.sprint then M.VeritySprint else M.VerityWalk
				humanoid.WalkSpeed = speed * mult
				local stand = (character:GetAttribute("HipHeightStand") :: number?) or humanoid.HipHeight
				local drop = (character:GetAttribute("CrouchDrop") :: number?) or 0
				humanoid.HipHeight = if s.crouch then stand - drop else stand
			end
			if character:GetAttribute("Crouching") ~= s.crouch then
				character:SetAttribute("Crouching", s.crouch)
			end
			-- el animador usa el andar de carrera (a cuatro patas) cuando esprinta
			local sprinting = s.sprint and moving and not s.crouch
			if character:GetAttribute("Sprinting") ~= sprinting then
				character:SetAttribute("Sprinting", sprinting)
			end
		elseif role == "Survivor" then
			if energized then
				s.stamina = M.StaminaMax
			end
			if s.sprint and moving and s.stamina > 0 then
				if not energized then
					s.stamina = math.max(0, s.stamina - M.StaminaDrain * dt)
				end
				s.lastDrain = clock
				humanoid.WalkSpeed = M.SurvivorSprint * mult
			else
				if clock - s.lastDrain > M.StaminaRegenDelay then
					s.stamina = math.min(M.StaminaMax, s.stamina + M.StaminaRegen * dt)
				end
				humanoid.WalkSpeed = M.SurvivorWalk * mult
			end
		else
			-- lobby: correr libre
			s.stamina = M.StaminaMax
			humanoid.WalkSpeed = (if s.sprint then M.SurvivorSprint else M.SurvivorWalk) * mult
		end

		local shown = player:GetAttribute("Stamina") :: number?
		local rounded = math.floor(s.stamina + 0.5)
		if shown ~= rounded then
			player:SetAttribute("Stamina", rounded)
		end
	end
end

-- Al empezar una ronda todos arrancan con la estamina llena y de pie.
function Movement.reset(player: Player)
	local s = state(player)
	s.stamina = M.StaminaMax
	s.crouch = false
	s.sprint = false
end

-- Bebida energética: estamina llena e infinita durante `seconds`.
function Movement.energize(player: Player, seconds: number)
	local s = state(player)
	s.stamina = M.StaminaMax
	s.energizedUntil = os.clock() + seconds
end

function Movement.init()
	Net.get("Action").OnServerEvent:Connect(onAction)
	-- la linterna solo es de los supervivientes en la ronda
	local function watch(player: Player)
		player:GetAttributeChangedSignal("Role"):Connect(function()
			if player:GetAttribute("Role") ~= "Survivor" then
				setFlashlight(player, false)
			end
		end)
	end
	Players.PlayerAdded:Connect(watch)
	for _, player in Players:GetPlayers() do
		watch(player)
	end
	Players.PlayerRemoving:Connect(function(player)
		states[player] = nil
	end)
end

function Movement.start()
	RunService.Heartbeat:Connect(update)
end

return Movement
