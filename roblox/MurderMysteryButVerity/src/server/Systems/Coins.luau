--!strict
-- Monedas repartidas por el mapa en cada ronda. Se recogen con solo
-- acercarse (Verity tiene más alcance por su tamaño; el Imán lo triplica).
-- Cada jugador puede llevar como máximo Config.Coins.MaxPerRound por ronda.

local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Locale = require(ReplicatedStorage.Shared.Locale)
local Net = require(ReplicatedStorage.Shared.Net)
local PlayerData = require(script.Parent.PlayerData)

local C = Config.Coins
local T = Locale.t

local Coins = {}

local folder: Folder? = nil
local coins: { BasePart } = {}
local connection: RBXScriptConnection? = nil
local fullWarned: { [Player]: boolean } = {}

local function makeCoin(position: Vector3, parent: Instance): BasePart
	local coin = Instance.new("Part")
	coin.Name = "Coin"
	coin.Shape = Enum.PartType.Cylinder
	coin.Size = Vector3.new(0.25, 1.7, 1.7)
	coin.Color = Color3.fromRGB(255, 196, 40)
	coin.Material = Enum.Material.Neon
	coin.Anchored = true
	coin.CanCollide = false
	coin.CanQuery = false
	coin.CanTouch = false
	coin.CFrame = CFrame.new(position)
	CollectionService:AddTag(coin, "Coin")
	coin.Parent = parent
	return coin
end

-- Busca el suelo bajo un punto; descarta techos de muebles altos y muros.
local function groundAt(point: Vector3, map: Instance): Vector3?
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Include
	params.FilterDescendantsInstances = { map }
	local hit = Workspace:Raycast(point + Vector3.new(0, 8, 0), Vector3.new(0, -30, 0), params)
	if hit and hit.Position.Y < point.Y + 4 then
		return hit.Position
	end
	return nil
end

function Coins.start(map: Instance, points: { Vector3 })
	Coins.stop()
	local f = Instance.new("Folder")
	f.Name = "Coins"
	f.Parent = map
	folder = f
	table.clear(fullWarned)
	for _, player in Players:GetPlayers() do
		player:SetAttribute("RoundCoins", 0)
	end

	local rng = Random.new()
	local attempts = 0
	while #coins < C.PerMap and attempts < C.PerMap * 6 and #points > 0 do
		attempts += 1
		local base = points[rng:NextInteger(1, #points)]
		local candidate = base + Vector3.new(rng:NextNumber(-9, 9), 0, rng:NextNumber(-9, 9))
		local ground = groundAt(candidate, map)
		if ground then
			table.insert(coins, makeCoin(ground + Vector3.new(0, 1.4, 0), f))
		end
	end

	local accumulator = 0
	connection = RunService.Heartbeat:Connect(function(dt)
		accumulator += dt
		if accumulator < 0.1 then
			return
		end
		accumulator = 0
		for _, player in Players:GetPlayers() do
			local character = player.Character
			local root = character and character:FindFirstChild("HumanoidRootPart")
			local humanoid = character and character:FindFirstChildOfClass("Humanoid")
			if not (character and root and root:IsA("BasePart") and humanoid and humanoid.Health > 0) then
				continue
			end
			local role = player:GetAttribute("Role")
			if role ~= "Verity" and role ~= "Survivor" then
				continue
			end
			local radius = if role == "Verity" then C.VerityPickupRadius else C.PickupRadius
			if character:GetAttribute("CoinMagnet") then
				radius *= C.MagnetMultiplier
			end
			-- para Verity se mide desde los pies, no desde la cadera
			local feet = root.Position - Vector3.new(0, humanoid.HipHeight + root.Size.Y / 2, 0)
			for i = #coins, 1, -1 do
				local coin = coins[i]
				local d1 = (coin.Position - root.Position).Magnitude
				local d2 = (coin.Position - feet).Magnitude
				if math.min(d1, d2) <= radius then
					local collected = (player:GetAttribute("RoundCoins") :: number?) or 0
					if collected >= C.MaxPerRound then
						if not fullWarned[player] then
							fullWarned[player] = true
							Net.get("Notify"):FireClient(player, T("¡Bolsa de monedas llena!"), "warn")
						end
						break
					end
					player:SetAttribute("RoundCoins", collected + 1)
					PlayerData.addCoins(player, 1)
					Net.get("Effect"):FireClient(player, "Coin", coin.Position)
					coin:Destroy()
					table.remove(coins, i)
				end
			end
		end
	end)
end

-- `reason`: texto traducible (márcalo con Locale.t al llamar).
function Coins.award(player: Player, amount: number, reason: string)
	if amount <= 0 or not player.Parent then
		return
	end
	PlayerData.addCoins(player, amount)
	Net.get("Notify"):FireClient(player, T("+{amount} monedas ({reason})"), "good", { amount = amount, reason = Locale.ref(reason) })
end

function Coins.stop()
	if connection then
		connection:Disconnect()
		connection = nil
	end
	if folder then
		folder:Destroy()
		folder = nil
	end
	table.clear(coins)
end

return Coins
