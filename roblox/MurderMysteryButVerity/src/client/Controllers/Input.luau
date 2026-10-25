--!strict
-- Controles: Shift correr, C agacharse (Verity), Q atrapar (Verity).
-- Solo envía intenciones; el servidor valida rol, estamina y distancia.

local ContextActionService = game:GetService("ContextActionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Net = require(ReplicatedStorage.Shared.Net)

local player = Players.LocalPlayer

local Input = {}

local action: RemoteEvent
local crouching = false

local function isVerity(): boolean
	return player:GetAttribute("Role") == "Verity"
end

local function onSprint(_, state: Enum.UserInputState)
	if state == Enum.UserInputState.Begin then
		action:FireServer("Sprint", true)
	elseif state == Enum.UserInputState.End or state == Enum.UserInputState.Cancel then
		action:FireServer("Sprint", false)
	end
	return Enum.ContextActionResult.Pass
end

local function onCrouch(_, state: Enum.UserInputState)
	if state ~= Enum.UserInputState.Begin or not isVerity() then
		return Enum.ContextActionResult.Pass
	end
	crouching = not crouching
	action:FireServer("Crouch", crouching)
	return Enum.ContextActionResult.Sink
end

local lastKill = 0
local function onKill(_, state: Enum.UserInputState)
	if state ~= Enum.UserInputState.Begin or not isVerity() then
		return Enum.ContextActionResult.Pass
	end
	if os.clock() - lastKill > 0.25 then
		lastKill = os.clock()
		action:FireServer("Kill")
	end
	return Enum.ContextActionResult.Sink
end

function Input.start()
	action = Net.get("Action")
	ContextActionService:BindAction("Sprint", onSprint, false, Enum.KeyCode.LeftShift, Enum.KeyCode.RightShift, Enum.KeyCode.ButtonL3)
	ContextActionService:BindAction("Crouch", onCrouch, false, Enum.KeyCode.C, Enum.KeyCode.ButtonB)
	ContextActionService:BindAction("Kill", onKill, false, Enum.KeyCode.Q, Enum.KeyCode.ButtonX)
	player:GetAttributeChangedSignal("Role"):Connect(function()
		crouching = false
	end)
end

return Input
