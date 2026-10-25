--!strict
-- Velocidades autoritativas en el servidor.
--   Shift: correr (supervivientes con estamina; Verity sin límite y más rápida)
--   C:     agacharse (solo Verity)
--   Q:     atrapar (solo Verity, lo resuelve Killer)

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Config = require(ReplicatedStorage.Shared.Config)
local Net = require(ReplicatedStorage.Shared.Net)
local Pose = require(ReplicatedStorage.Shared.VerityPose)
local Killer = require(script.Parent.Killer)

local M = Config.Movement
local MAX_ACTIONS_PER_SECOND = 15

type State = {
	sprint: boolean,
	crouch: boolean,
	stamina: number,
	lastDrain: number,
	actions: number,
	window: number,
}

local Movement = {}

local states: { [Player]: State } = {}

local function state(player: Player): State
	local s = states[player]
	if not s then
		s = { sprint = false, crouch = false, stamina = M.StaminaMax, lastDrain = 0, actions = 0, window = os.clock() }
		states[player] = s
	end
	return s
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

		if role == "Verity" then
			local busy = Killer.isKilling()
			if busy then
				s.crouch = false
				humanoid.WalkSpeed = 0
			else
				local speed = if s.crouch then M.VerityCrouch elseif s.sprint then M.VeritySprint else M.VerityWalk
				humanoid.WalkSpeed = speed
				humanoid.HipHeight = if s.crouch then Pose.HipHeight - Pose.CrouchDrop else Pose.HipHeight
			end
			if character:GetAttribute("Crouching") ~= s.crouch then
				character:SetAttribute("Crouching", s.crouch)
			end
		elseif role == "Survivor" then
			if s.sprint and moving and s.stamina > 0 then
				s.stamina = math.max(0, s.stamina - M.StaminaDrain * dt)
				s.lastDrain = clock
				humanoid.WalkSpeed = M.SurvivorSprint
			else
				if clock - s.lastDrain > M.StaminaRegenDelay then
					s.stamina = math.min(M.StaminaMax, s.stamina + M.StaminaRegen * dt)
				end
				humanoid.WalkSpeed = M.SurvivorWalk
			end
		else
			-- lobby: correr libre
			s.stamina = M.StaminaMax
			humanoid.WalkSpeed = if s.sprint then M.SurvivorSprint else M.SurvivorWalk
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

function Movement.init()
	Net.get("Action").OnServerEvent:Connect(onAction)
	Players.PlayerRemoving:Connect(function(player)
		states[player] = nil
	end)
end

function Movement.start()
	RunService.Heartbeat:Connect(update)
end

return Movement
