--!strict
-- Balistas de las torres de la puerta (Tycoon.buildTowers).
-- El jugador sentado en el banco apunta con el raton/dedo; su cliente
-- (Controllers/Ballista) manda TowerFire con el punto al que apunta. Aqui se
-- valida todo: que este sentado en una balista, la recarga y el alcance. El
-- servidor decide si el virote da a Verity (pasa cerca de el en su linea).
local Debris = game:GetService("Debris")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local Net = require(Shared.Net)

local Build = require(script.Parent.Parent.Lib.Build)
local Sfx = require(script.Parent.Parent.Lib.Sfx)
local Verity = require(script.Parent.Verity)

local T = Config.Tower

local Ballista = {}

-- Virote: astil, punta de hierro y plumas rojas, en linea recta.
local function flyBolt(from: Vector3, to: Vector3): number
	local dist = (to - from).Magnitude
	local time = math.clamp(dist / T.BoltSpeed, 0.05, 1)
	local bolt = Build.part({ Name = "BallistaBolt", Size = Vector3.new(0.25, 0.25, 4), CFrame = CFrame.lookAt(from, to), Color = Color3.fromRGB(150, 110, 60), Material = Enum.Material.Wood, CanCollide = false, Parent = workspace })
	bolt.CanQuery = false
	bolt.CanTouch = false
	local head = Build.part({ Name = "BoltHead", Size = Vector3.new(0.5, 0.5, 0.8), CFrame = bolt.CFrame * CFrame.new(0, 0, -2.3), Color = Color3.fromRGB(70, 70, 75), Material = Enum.Material.Metal, CanCollide = false, Anchored = false, Parent = bolt })
	head.CanQuery = false
	head.CanTouch = false
	head.Massless = true
	local weld = Instance.new("WeldConstraint")
	weld.Part0 = bolt
	weld.Part1 = head
	weld.Parent = head
	local a0 = Instance.new("Attachment")
	a0.Position = Vector3.new(0, 0.12, 1.8)
	a0.Parent = bolt
	local a1 = Instance.new("Attachment")
	a1.Position = Vector3.new(0, -0.12, 1.8)
	a1.Parent = bolt
	local trail = Instance.new("Trail")
	trail.Attachment0 = a0
	trail.Attachment1 = a1
	trail.Lifetime = 0.25
	trail.Color = ColorSequence.new(Color3.fromRGB(240, 220, 180))
	trail.Transparency = NumberSequence.new(0.3, 1)
	trail.Parent = bolt
	TweenService:Create(bolt, TweenInfo.new(time, Enum.EasingStyle.Linear), { CFrame = CFrame.lookAt(to, to + (to - from)) }):Play()
	Debris:AddItem(bolt, time + 1.5) -- se queda clavado un momento
	return time
end

local function setLoaded(turret: Model, loaded: boolean)
	for _, p in turret:GetChildren() do
		if p:IsA("BasePart") and p.Name == "LoadedBolt" then
			p.Transparency = if loaded then 0 else 1
		end
	end
end

local function onFire(player: Player, target: any)
	-- el cliente solo manda un punto: se comprueba que sea un Vector3 valido
	if typeof(target) ~= "Vector3" or target ~= target or target.Magnitude > 1e5 then
		return
	end
	local character = player.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if not humanoid or humanoid.Health <= 0 then
		return
	end
	local seat = humanoid.SeatPart
	if not seat or seat.Name ~= "BallistaSeat" then
		return
	end
	local ballista = seat.Parent
	local turret = ballista and ballista:FindFirstChild("Turret")
	local hub = turret and turret:FindFirstChild("Hub")
	if not (ballista and ballista:IsA("Model") and turret and turret:IsA("Model") and hub and hub:IsA("BasePart")) then
		return
	end
	local t = workspace:GetServerTimeNow()
	if t - ((ballista:GetAttribute("FiredAt") :: number?) or 0) < T.Cooldown then
		return
	end
	local origin = hub.Position
	local offset = (target :: Vector3) - origin
	if offset.Magnitude < 3 then
		return
	end
	local dir = offset.Unit
	ballista:SetAttribute("FiredAt", t)
	turret:PivotTo(CFrame.lookAt(origin, origin + dir))

	local tip = origin + dir * 4.5
	local endPoint = tip + dir * math.min(T.Range, offset.Magnitude)
	-- ¿pasa el virote cerca de Verity? (es alto: tolerancia generosa)
	local hit = false
	local bossPos = Verity.getPosition()
	if bossPos then
		local along = (bossPos - tip):Dot(dir)
		if along > 0 and along <= T.Range then
			local closest = tip + dir * along
			if (bossPos - closest).Magnitude <= Verity.getHitRadius() + 6 then
				hit = true
				endPoint = closest
			end
		end
	end

	setLoaded(turret, false)
	Sfx.play(Config.Sounds.Lunge, hub, { Volume = 1.2, Speed = 0.45 })
	Sfx.play(Config.Sounds.Bass, hub, { Volume = 0.8, Speed = 1.4 })
	local flight = flyBolt(tip, endPoint)
	if hit then
		task.delay(flight, function()
			Verity.damage(player, T.Damage)
		end)
	end
	task.delay(T.Cooldown * 0.85, function()
		if turret.Parent then
			setLoaded(turret, true)
			Sfx.play(Config.Sounds.BowDraw, hub, { Volume = 0.5, Speed = 0.4 })
		end
	end)
end

function Ballista.init()
	Net.onServer("TowerFire", onFire)
end

return Ballista
