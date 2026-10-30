--!strict
-- Martillo de fuerza del lobby (solo diversión: no cuesta ni da monedas).
--   1. Al pulsar E (prompt), el servidor reserva la máquina y avisa a ese
--      jugador (Minigame "StrikerStart") para que vea la aguja (Striker.luau).
--   2. El cliente devuelve la fuerza 0-100 (Minigame "Strike"); solo se acepta
--      de quien reservó la máquina y dentro de Config.Striker.Window.
--   3. Se publica para todos en atributos del modelo: StrikePower, StrikeBy y
--      StrikeId (el último en cambiar); y el récord del servidor en
--      RecordPower / RecordBy.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Locale = require(ReplicatedStorage.Shared.Locale)
local Net = require(ReplicatedStorage.Shared.Net)

local S = Config.Striker
local T = Locale.t

local Arcade = {}

type Booking = { player: Player, ends: number, swung: boolean }

local machines: { [Instance]: boolean } = {} -- martillos del lobby
local bookings: { [Instance]: Booking } = {} -- quién está golpeando cada uno

local function strike(player: Player, machine: Instance, raw: any)
	local booking = bookings[machine]
	if not booking or booking.player ~= player or booking.swung or os.clock() > booking.ends then
		return
	end
	local power = math.clamp(math.floor(tonumber(raw) or 0), 0, 100)
	booking.swung = true
	booking.ends = os.clock() + 2.8 -- la máquina queda ocupada mientras sube el disco
	machine:SetAttribute("StrikePower", power)
	machine:SetAttribute("StrikeBy", player.DisplayName)
	machine:SetAttribute("StrikeId", ((machine:GetAttribute("StrikeId") :: number?) or 0) + 1)
	if power > ((machine:GetAttribute("RecordPower") :: number?) or -1) then
		machine:SetAttribute("RecordPower", power)
		machine:SetAttribute("RecordBy", player.DisplayName)
	end
	task.delay(0.9, function()
		if not player.Parent then
			return
		end
		if power >= S.BellAt then
			Net.get("Notify"):FireClient(player, T("¡DING! Fuerza {power}"), "good", { power = power })
		else
			Net.get("Notify"):FireClient(player, T("Fuerza: {power}"), "info", { power = power })
		end
	end)
end

local function setup(machine: Instance)
	local prompt = machine:FindFirstChildWhichIsA("ProximityPrompt", true)
	if not prompt then
		return
	end
	machines[machine] = true
	prompt.Triggered:Connect(function(player)
		local booking = bookings[machine]
		if booking and os.clock() < booking.ends then
			return -- otro jugador está golpeando
		end
		bookings[machine] = { player = player, ends = os.clock() + S.Window, swung = false }
		Net.get("Minigame"):FireClient(player, "StrikerStart", machine)
	end)
end

function Arcade.start()
	Net.get("Minigame").OnServerEvent:Connect(function(player, kind, machine, power)
		if kind == "Strike" and typeof(machine) == "Instance" and machines[machine] then
			strike(player, machine, power)
		end
	end)
	Players.PlayerRemoving:Connect(function(player: Player)
		for machine, booking in bookings do
			if booking.player == player then
				bookings[machine] = nil
			end
		end
	end)
	local lobby = Workspace:WaitForChild("Lobby", 10)
	if not lobby then
		return
	end
	for _, inst in lobby:GetDescendants() do
		if inst:GetAttribute("Striker") then
			setup(inst)
		end
	end
end

return Arcade
