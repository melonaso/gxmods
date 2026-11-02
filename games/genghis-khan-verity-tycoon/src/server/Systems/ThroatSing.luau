--!strict
-- Canto de garganta mongol (khöömei). El cliente solo pide cantar (remote sin
-- datos); aqui se valida el cooldown y se aplican los efectos:
--   - Verity a menos de StunRadius queda aturdido (lento y sin atacar) y recibe dano
--   - los jugadores a menos de HealRadius (tu incluido) se curan
--   - ondas de sonido visibles y el canto, que oyen todos
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local Net = require(Shared.Net)

local Build = require(script.Parent.Parent.Lib.Build)
local Sfx = require(script.Parent.Parent.Lib.Sfx)
local Verity = require(script.Parent.Verity)

local T = Config.ThroatSing

local ThroatSing = {}

local readyAt: { [Player]: number } = {}

local function waves(root: BasePart)
	for i = 0, 2 do
		task.delay(i * 0.45, function()
			if not root.Parent then
				return
			end
			local ring = Build.part({
				Name = "SongWave",
				Shape = Enum.PartType.Cylinder,
				Size = Vector3.new(0.3, 4, 4),
				-- cilindro acostado = anillo plano a la altura del pecho
				CFrame = CFrame.new(root.Position) * CFrame.Angles(0, 0, math.pi / 2),
				Color = Color3.fromRGB(120, 200, 255),
				Material = Enum.Material.Neon,
				CanCollide = false,
				Parent = workspace,
			})
			ring.CanQuery = false
			ring.CanTouch = false
			ring.Transparency = 0.3
			local d = T.StunRadius * 2
			TweenService:Create(ring, TweenInfo.new(1.1, Enum.EasingStyle.Quad), { Size = Vector3.new(0.3, d, d), Transparency = 1 }):Play()
			task.delay(1.2, function()
				ring:Destroy()
			end)
		end)
	end
end

local function sing(player: Player)
	local t = os.clock()
	if t < (readyAt[player] or 0) then
		return -- en cooldown (el cliente tambien lo bloquea, pero aqui manda el servidor)
	end
	local character = player.Character
	local root = character and character:FindFirstChild("HumanoidRootPart")
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if not (root and root:IsA("BasePart") and humanoid and humanoid.Health > 0) then
		return
	end
	readyAt[player] = t + T.Cooldown
	player:SetAttribute("SingReadyAt", workspace:GetServerTimeNow() + T.Cooldown)

	-- el canto (grupo "Song": no se ensordece; fuerte hasta MinDistance)
	local song = { Group = "Song", MinDistance = 40, MaxDistance = T.DuckRadius, Lifetime = T.Duration + 1 }
	local sound: Sound?
	if Config.Sounds.ThroatSing ~= 0 then
		sound = Sfx.play(Config.Sounds.ThroatSing, root, { Volume = 2, Group = song.Group, MinDistance = song.MinDistance, MaxDistance = song.MaxDistance, Lifetime = song.Lifetime })
	else
		-- sustituto: zumbido grave de APM mas una capa aguda (el "silbido" de los armonicos)
		sound = Sfx.play(Config.Sounds.ThroatSingFallback, root, { Volume = 1.8, Speed = 0.7, Group = song.Group, MinDistance = song.MinDistance, MaxDistance = song.MaxDistance, Lifetime = song.Lifetime })
		Sfx.play(Config.Sounds.ThroatSingFallback, root, { Volume = 0.7, Speed = 1.9, Group = song.Group, MinDistance = song.MinDistance, MaxDistance = song.MaxDistance, Lifetime = T.Duration })
	end
	-- los clientes cercanos ensordecen todo lo demas mientras dure (Controllers/SoundDuck)
	local songUntil = workspace:GetServerTimeNow() + T.Duration
	workspace:SetAttribute("SongUntil", math.max((workspace:GetAttribute("SongUntil") :: number?) or 0, songUntil))
	workspace:SetAttribute("SongPos", root.Position)
	if sound then
		task.delay(T.Duration, function()
			if sound.Parent then
				sound:Stop()
				sound:Destroy()
			end
		end)
	end
	waves(root)

	-- curar aliados cercanos
	for _, other in Players:GetPlayers() do
		local oc = other.Character
		local orr = oc and oc:FindFirstChild("HumanoidRootPart")
		local oh = oc and oc:FindFirstChildOfClass("Humanoid")
		if orr and orr:IsA("BasePart") and oh and oh.Health > 0 and (orr.Position - root.Position).Magnitude <= T.HealRadius then
			oh.Health = math.min(oh.MaxHealth, oh.Health + T.Heal)
		end
	end

	-- aturdir a Verity
	local vpos = Verity.getPosition()
	if vpos and (Vector3.new(vpos.X, 0, vpos.Z) - Vector3.new(root.Position.X, 0, root.Position.Z)).Magnitude <= T.StunRadius then
		Verity.stun(T.StunSeconds)
		Verity.damage(player, T.Damage)
		Net.fireClient(player, "Notify", "Tu canto de garganta aturde a Verity", "reward")
	end
end

function ThroatSing.init()
	Net.onServer("ThroatSing", sing)
	Players.PlayerRemoving:Connect(function(player)
		readyAt[player] = nil
	end)
end

return ThroatSing
