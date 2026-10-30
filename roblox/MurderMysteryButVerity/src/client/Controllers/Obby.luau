--!strict
-- Gira en pantalla las barras de lava del obby (ObbySweeper). El ángulo sale
-- del reloj compartido del servidor, así que coincide con el que usa
-- Lobby.luau para saber si una barra te toca.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)

local Obby = {}

function Obby.start()
	local lobby = Workspace:WaitForChild("Lobby", 30)
	if not lobby then
		return
	end
	local bars: { [BasePart]: CFrame } = {}
	for _, inst in lobby:GetDescendants() do
		if inst:IsA("BasePart") and inst:GetAttribute("ObbySweeper") then
			bars[inst] = inst.CFrame
		end
	end
	if next(bars) == nil then
		return
	end
	local speed = math.rad(Config.Obby.SweeperSpeed)
	RunService.RenderStepped:Connect(function()
		local angle = Workspace:GetServerTimeNow() * speed
		for bar, home in bars do
			bar.CFrame = home * CFrame.Angles(0, angle, 0)
		end
	end)
end

return Obby
