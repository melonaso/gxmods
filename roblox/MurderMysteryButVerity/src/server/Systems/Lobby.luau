--!strict
-- Lobby: gestiona el obby (la lava te devuelve al inicio y el cofre de la
-- meta da monedas, con espera entre premios). Obstáculos:
--   ObbyBlink (número): plataforma que parpadea y desaparece un rato; el
--     valor es su desfase en segundos para que no desaparezcan todas a la vez
--   ObbySweeper: barra de lava que gira; tocarla te devuelve al inicio

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local T = require(ReplicatedStorage.Shared.Locale).t
local Coins = require(script.Parent.Coins)

local Lobby = {}

local lastReward: { [Player]: number } = {}
local lastLava: { [Player]: number } = {}
local O = Config.Obby

local function playerFromHit(hit: BasePart): Player?
	local model = hit:FindFirstAncestorOfClass("Model")
	return if model then Players:GetPlayerFromCharacter(model) else nil
end

local function sendToStart(player: Player, start: BasePart)
	local character = player.Character
	if not character or os.clock() - (lastLava[player] or 0) < 0.5 then
		return
	end
	lastLava[player] = os.clock()
	character:PivotTo(start.CFrame + Vector3.new(0, 4, 0))
end

-- Plataformas que parpadean: sólidas, avisan parpadeando y desaparecen.
local function runBlinkers(blinkers: { BasePart })
	local base: { [BasePart]: number } = {}
	for _, p in blinkers do
		base[p] = p.Transparency
	end
	local cycle = O.BlinkSolid + O.BlinkWarn + O.BlinkGone
	RunService.Heartbeat:Connect(function()
		local now = Workspace:GetServerTimeNow()
		for _, p in blinkers do
			local t = (now + ((p:GetAttribute("ObbyBlink") :: number?) or 0)) % cycle
			local solid = t < O.BlinkSolid + O.BlinkWarn
			local transparency = if not solid
				then 0.85
				elseif t >= O.BlinkSolid then (if math.floor(t * 10) % 2 == 0 then 0.6 else base[p])
				else base[p]
			if p.CanCollide ~= solid then
				p.CanCollide = solid
			end
			if p.Transparency ~= transparency then
				p.Transparency = transparency
			end
		end
	end)
end

-- Barras de lava giratorias. Cada cliente las gira en su pantalla con el
-- mismo reloj (Obby.luau, sin tirones); aquí solo se calcula, con el ángulo
-- que tiene la barra en este instante, si toca a alguien.
local function runSweepers(sweepers: { BasePart }, start: BasePart)
	local accumulator = 0
	RunService.Heartbeat:Connect(function(dt)
		accumulator += dt
		if accumulator < 0.05 then
			return
		end
		accumulator = 0
		local angle = Workspace:GetServerTimeNow() * math.rad(O.SweeperSpeed)
		for _, bar in sweepers do
			local center = bar.Position
			local dir = (CFrame.Angles(0, angle, 0) * bar.CFrame.Rotation).RightVector -- largo de la barra
			for _, player in Players:GetPlayers() do
				local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
				if root and root:IsA("BasePart") then
					local offset = root.Position - center
					local flat = Vector3.new(offset.X, 0, offset.Z)
					local along = flat:Dot(dir)
					local across = (flat - dir * along).Magnitude
					-- la barra va a la altura de las piernas: de los pies a la cintura
					if math.abs(along) <= bar.Size.X / 2 and across <= 1.3 and offset.Y > -0.5 and offset.Y < 3.2 then
						sendToStart(player, start)
					end
				end
			end
		end
	end)
end

local function setupObby(lobby: Instance)
	local obby = lobby:FindFirstChild("Obby")
	if not obby then
		return
	end
	local start = obby:FindFirstChild("ObbyStart") :: BasePart?
	local spawnPoint = lobby:FindFirstChildWhichIsA("SpawnLocation", true)
	local blinkers: { BasePart } = {}
	local sweepers: { BasePart } = {}
	for _, part in obby:GetDescendants() do
		if not part:IsA("BasePart") then
			continue
		end
		if part:GetAttribute("ObbyBlink") ~= nil then
			table.insert(blinkers, part)
		end
		if part:GetAttribute("ObbySweeper") then
			table.insert(sweepers, part)
		end
		if part:GetAttribute("ObbyLava") then
			part.Touched:Connect(function(hit)
				local player = playerFromHit(hit)
				if player and start then
					sendToStart(player, start)
				end
			end)
		elseif part:GetAttribute("ObbyGoal") then
			part.Touched:Connect(function(hit)
				local player = playerFromHit(hit)
				local character = player and player.Character
				if not (player and character) then
					return
				end
				local now = os.clock()
				local wait = Config.Coins.ObbyCooldown - (now - (lastReward[player] or -math.huge))
				if wait > 0 then
					return
				end
				lastReward[player] = now
				Coins.award(player, Config.Coins.ObbyReward, T("obby completado"))
				if spawnPoint then
					character:PivotTo(spawnPoint.CFrame + Vector3.new(0, 4, 0))
				end
			end)
		end
	end
	if #blinkers > 0 then
		runBlinkers(blinkers)
	end
	if #sweepers > 0 and start then
		runSweepers(sweepers, start)
	end
end

function Lobby.start()
	local lobby = Workspace:WaitForChild("Lobby", 10)
	if not lobby then
		return
	end
	setupObby(lobby)
	Players.PlayerRemoving:Connect(function(player)
		lastReward[player] = nil
		lastLava[player] = nil
	end)
end

return Lobby
