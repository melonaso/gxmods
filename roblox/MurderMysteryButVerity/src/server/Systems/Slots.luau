--!strict
-- Tragamonedas del lobby: solo para pasar el rato mientras empieza la ronda.
-- Tirar de la palanca no cuesta nada y no da monedas (nada de apuestas).
-- El servidor decide el resultado y lo publica en atributos del modelo:
--   SpinResult ("3,3,5": índices de Config.Slots.Symbols), SpinBy (nombre
--   de quien tiró) y SpinId (contador, el último en cambiar).
-- Los clientes animan la palanca y los rodillos (Casino.luau).

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Locale = require(ReplicatedStorage.Shared.Locale)
local Net = require(ReplicatedStorage.Shared.Net)

local S = Config.Slots
local T = Locale.t

local Slots = {}

local rng = Random.new()

local function roll(): number
	local total = 0
	for _, weight in S.Weights do
		total += weight
	end
	local r = rng:NextNumber() * total
	for i, weight in S.Weights do
		r -= weight
		if r <= 0 then
			return i
		end
	end
	return #S.Weights
end

local function spin(): { number }
	if rng:NextNumber() < S.JackpotChance then
		local symbol = roll()
		return { symbol, symbol, symbol }
	end
	return { roll(), roll(), roll() }
end

local function setup(machine: Instance)
	local prompt = machine:FindFirstChildWhichIsA("ProximityPrompt", true)
	if not prompt then
		return
	end
	local busyUntil = 0
	prompt.Triggered:Connect(function(player)
		if os.clock() < busyUntil then
			return
		end
		busyUntil = os.clock() + S.Cooldown
		local result = spin()
		machine:SetAttribute("SpinBy", player.Name)
		machine:SetAttribute("SpinResult", table.concat(result, ","))
		machine:SetAttribute("SpinId", ((machine:GetAttribute("SpinId") :: number?) or 0) + 1)
		task.delay(S.SpinTime + 0.3, function()
			if not player.Parent then
				return
			end
			local a, b, c = result[1], result[2], result[3]
			if a == b and b == c then
				Net.get("Notify"):FireClient(player, T("¡JACKPOT! Tres {symbol} (solo por diversión)"), "good", { symbol = S.Symbols[a] })
			elseif a == b or b == c or a == c then
				Net.get("Notify"):FireClient(player, T("¡Casi! Dos iguales"), "info")
			end
		end)
	end)
end

function Slots.start()
	local lobby = Workspace:WaitForChild("Lobby", 10)
	if not lobby then
		return
	end
	for _, inst in lobby:GetDescendants() do
		if inst:GetAttribute("SlotMachine") then
			setup(inst)
		end
	end
end

return Slots
