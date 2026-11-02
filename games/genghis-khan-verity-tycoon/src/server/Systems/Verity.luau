--!strict
-- Verity: llega cada N minutos por el portal, persigue al jugador visible mas
-- cercano, atraviesa paredes y solo se va si se acaba el tiempo o si lo matan.
-- Usa el mismo modelo/rig de "Survive A Verity" (Lib/VerityModel) y el
-- cliente lo anima con Controllers/VerityAnimator.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local Net = require(Shared.Net)
local Pose = require(Shared.VerityPose)
local Types = require(Shared.Types)

local Build = require(script.Parent.Parent.Lib.Build)
local VerityModel = require(script.Parent.Parent.Lib.VerityModel)
local PlayerData = require(script.Parent.PlayerData)
local World = require(script.Parent.World)

local V = Config.Verity

local Verity = {}

local phase: Types.VerityPhase = "Waiting"
local nextAt = 0
local endsAt = 0
local health = 0
local maxHealth = 0
local model: Model? = nil
local root: BasePart? = nil
local humanoid: Humanoid? = nil
local highlight: Highlight? = nil
local rootY = 8
local attackUntil = 0
local lastScream = 0
local lastMoveOrder = 0
local contributions: { [number]: number } = {}
local heartbeatConn: RBXScriptConnection? = nil
local warned: { [number]: boolean } = {}

local function now(): number
	return workspace:GetServerTimeNow()
end

local function interval(): number
	return if RunService:IsStudio() then V.StudioIntervalSeconds else V.IntervalSeconds
end

local function publish()
	workspace:SetAttribute("VerityPhase", phase)
	workspace:SetAttribute("VerityNextAt", nextAt)
	workspace:SetAttribute("VerityEndsAt", endsAt)
	workspace:SetAttribute("VerityHP", math.max(0, math.floor(health)))
	workspace:SetAttribute("VerityMaxHP", maxHealth)
end

-- ===== Escondites =====

local function insidePart(part: BasePart, point: Vector3): boolean
	local localPoint = part.CFrame:PointToObjectSpace(point)
	local half = part.Size / 2
	return math.abs(localPoint.X) <= half.X and math.abs(localPoint.Y) <= half.Y and math.abs(localPoint.Z) <= half.Z
end

function Verity.isHidden(player: Player, point: Vector3): boolean
	for _, zone in World.getHidingFolder():GetChildren() do
		if zone:IsA("BasePart") then
			local owner = zone:GetAttribute("OwnerUserId")
			if (owner == nil or owner == player.UserId) and insidePart(zone, point) then
				return true
			end
		end
	end
	return false
end

local function rootOf(player: Player): (BasePart?, Humanoid?)
	local character = player.Character
	if not character then
		return nil, nil
	end
	local r = character:FindFirstChild("HumanoidRootPart")
	local h = character:FindFirstChildOfClass("Humanoid")
	if r and r:IsA("BasePart") and h and h.Health > 0 then
		return r, h
	end
	return nil, nil
end

local function flat(v: Vector3): Vector3
	return Vector3.new(v.X, 0, v.Z)
end

-- ===== Efectos =====

local function flash(color: Color3)
	local h = highlight
	if not h then
		return
	end
	h.FillColor = color
	h.FillTransparency = 0.4
	task.delay(0.15, function()
		if h.Parent then
			h.FillTransparency = 1
		end
	end)
end

local function screamFx(at: Vector3)
	local ring = Build.part({
		Name = "Scream",
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(2, 2, 2),
		CFrame = CFrame.new(at + Vector3.new(0, 8, 0)),
		Color = Color3.fromRGB(120, 0, 0),
		Material = Enum.Material.ForceField,
		CanCollide = false,
		Parent = workspace,
	})
	ring.CanQuery = false
	ring.CanTouch = false
	local d = V.ScreamRadius * 2
	TweenService:Create(ring, TweenInfo.new(0.6), { Size = Vector3.new(d, d, d), Transparency = 1 }):Play()
	task.delay(0.7, function()
		ring:Destroy()
	end)
end

-- ===== Ciclo de vida =====

local function despawn()
	if heartbeatConn then
		heartbeatConn:Disconnect()
		heartbeatConn = nil
	end
	if model then
		model:Destroy()
	end
	model, root, humanoid, highlight = nil, nil, nil, nil
	phase = "Waiting"
	nextAt = now() + interval()
	endsAt = 0
	health = 0
	warned = {}
	contributions = {}
	publish()
end

local function defeat()
	local total = 0
	for _, dmg in contributions do
		total += dmg
	end
	for userId, dmg in contributions do
		local player = Players:GetPlayerByUserId(userId)
		if player and total > 0 then
			local reward = V.ParticipationReward + math.floor(V.RewardPool * dmg / total)
			PlayerData.addGold(player, reward)
			PlayerData.addVerityKill(player)
			Net.fireClient(player, "Notify", string.format("Recompensa por tu valor: +%d oro", reward), "reward")
		end
	end
	Net.fireAll("Notify", "VERITY HA SIDO DERROTADO. La estepa vuelve a ser del Khan.", "reward")
	despawn()
end

-- Golpe "levantar y aplastar": la animacion la ve el cliente via KillStart;
-- el dano cae en el instante del impacto si el objetivo sigue al alcance.
local function attack(targetPlayer: Player)
	local m = model
	if not m then
		return
	end
	local t = now()
	attackUntil = t + V.AttackAnimTime
	m:SetAttribute("KillStart", t)
	task.delay(Pose.KillImpact, function()
		if model ~= m or not root then
			return
		end
		flash(Color3.fromRGB(255, 0, 0))
		local r, h = rootOf(targetPlayer)
		if r and h and not targetPlayer:GetAttribute("Hidden") and flat(r.Position - root.Position).Magnitude <= V.MeleeRange + 3 then
			h:TakeDamage(V.MeleeDamage)
		end
	end)
	task.delay(V.AttackAnimTime, function()
		if model == m then
			m:SetAttribute("KillStart", nil)
		end
	end)
end

local function step(_dt: number)
	local r, h = root, humanoid
	if not model or not r or not h then
		return
	end
	local t = now()

	if t >= endsAt then
		Net.fireAll("Notify", "Verity se desvanece en la niebla... por ahora.", "warning")
		despawn()
		return
	end
	if r.Position.Y < -40 then -- por si cae del mapa
		(model :: Model):PivotTo(CFrame.new(World.PortalPosition + Vector3.new(0, rootY, 0)))
	end

	-- objetivo: el jugador visible y vivo mas cercano
	local position = r.Position
	local target: BasePart? = nil
	local targetPlayer: Player? = nil
	local bestDist = math.huge
	for _, player in Players:GetPlayers() do
		local pr = rootOf(player)
		if pr and not player:GetAttribute("Hidden") then
			local d = flat(pr.Position - position).Magnitude
			if d < bestDist then
				bestDist = d
				target = pr
				targetPlayer = player
			end
		end
	end

	local enraged = health / maxHealth <= V.EnrageThreshold
	h.WalkSpeed = if enraged then V.EnragedSpeed else V.WalkSpeed
	model:SetAttribute("Sprinting", enraged and target ~= nil)

	-- moverse (quieto mientras ataca)
	if t - lastMoveOrder >= 0.1 then
		lastMoveOrder = t
		if t < attackUntil then
			h:MoveTo(position)
		elseif target then
			h:MoveTo(target.Position)
		elseif flat(World.PortalPosition - position).Magnitude > 6 then
			h:MoveTo(World.PortalPosition) -- nadie a la vista: vuelve a rondar el portal
		end
	end

	if targetPlayer and bestDist <= V.MeleeRange and t >= attackUntil + V.MeleeCooldown - V.AttackAnimTime then
		attack(targetPlayer)
	end

	-- grito: dana a todos los que esten a la vista y cerca
	if t - lastScream >= V.ScreamCooldown then
		local victims = {}
		for _, player in Players:GetPlayers() do
			local pr, ph = rootOf(player)
			if pr and ph and not player:GetAttribute("Hidden") and flat(pr.Position - position).Magnitude <= V.ScreamRadius then
				table.insert(victims, ph)
			end
		end
		if #victims > 0 then
			lastScream = t
			screamFx(position)
			for _, ph in victims do
				ph:TakeDamage(V.ScreamDamage)
			end
			Net.fireAll("Notify", "Verity GRITA", "danger")
		end
	end

	publish()
end

function Verity.isActive(): boolean
	return phase == "Active" and model ~= nil and root ~= nil
end

function Verity.getPosition(): Vector3?
	if not Verity.isActive() then
		return nil
	end
	return (root :: BasePart).Position
end

-- Llamado por Weapons tras validar alcance y cooldown.
function Verity.damage(player: Player, amount: number)
	if not Verity.isActive() or amount <= 0 then
		return
	end
	health -= amount
	contributions[player.UserId] = (contributions[player.UserId] or 0) + amount
	flash(Color3.fromRGB(255, 200, 0))
	if health <= 0 then
		defeat()
	else
		publish()
	end
end

function Verity.spawn()
	if phase == "Active" then
		return
	end
	local m, rig = VerityModel.create()
	if not m or not rig then
		warn("[Verity] No hay modelo de Verity (falta ServerStorage.VerityFallback); se salta este ataque.")
		nextAt = now() + interval()
		publish()
		return
	end
	local r = m.PrimaryPart
	local h = m:FindFirstChildOfClass("Humanoid")
	if not r or not h then
		m:Destroy()
		return
	end

	Build.ensureGroups()
	for _, inst in m:GetDescendants() do
		if inst:IsA("BasePart") then
			inst.CollisionGroup = Build.VERITY_GROUP
		end
	end
	local hl = Instance.new("Highlight")
	hl.Name = "HitFlash"
	hl.FillTransparency = 1
	hl.OutlineTransparency = 1
	hl.Parent = m

	rootY = rig.rootY
	m:PivotTo(CFrame.new(World.PortalPosition + Vector3.new(0, rootY + 0.5, 0)) * CFrame.Angles(0, math.pi, 0))
	h.WalkSpeed = V.WalkSpeed
	m.Parent = workspace
	r:SetNetworkOwner(nil) -- el servidor mueve a Verity

	model, root, humanoid, highlight = m, r, h, hl
	local count = math.max(1, #Players:GetPlayers())
	maxHealth = V.BaseHealth + V.HealthPerPlayer * (count - 1)
	health = maxHealth
	contributions = {}
	attackUntil = 0
	lastScream = now()
	phase = "Active"
	endsAt = now() + V.DurationSeconds
	heartbeatConn = RunService.Heartbeat:Connect(step)
	publish()
	Net.fireAll("Notify", "VERITY HA LLEGADO. Pelea con tus armas o escondete hasta que se vaya.", "danger")
end

function Verity.init()
	VerityModel.load()
	nextAt = now() + interval()
	publish()

	-- Comando de prueba: "/verity" en el chat (solo en Studio o el creador del juego)
	local function allowed(player: Player?): boolean
		return player ~= nil and (RunService:IsStudio() or player.UserId == game.CreatorId)
	end
	pcall(function() -- chat nuevo (TextChatService)
		local command = Instance.new("TextChatCommand")
		command.Name = "VerityCommand"
		command.PrimaryAlias = "/verity"
		command.Triggered:Connect(function(source: TextSource)
			if allowed(Players:GetPlayerByUserId(source.UserId)) then
				Verity.spawn()
			end
		end)
		command.Parent = game:GetService("TextChatService")
	end)
	local function hook(player: Player) -- chat clasico
		player.Chatted:Connect(function(message)
			if message:lower() == "/verity" and allowed(player) then
				Verity.spawn()
			end
		end)
	end
	Players.PlayerAdded:Connect(hook)
	for _, player in Players:GetPlayers() do
		hook(player)
	end
end

function Verity.start()
	while true do
		task.wait(0.25)

		-- actualizar quien esta escondido (lo lee la IA y el HUD del cliente)
		for _, player in Players:GetPlayers() do
			local r = rootOf(player)
			local hidden = r ~= nil and Verity.isHidden(player, r.Position)
			if player:GetAttribute("Hidden") ~= hidden then
				player:SetAttribute("Hidden", hidden)
			end
		end

		if phase == "Waiting" then
			local remaining = nextAt - now()
			for _, mark in V.WarningTimes do
				-- solo avisa al cruzar la marca (no si el intervalo ya empezo por debajo)
				if remaining <= mark and remaining > mark - 2 and not warned[mark] then
					warned[mark] = true
					local text = if mark >= 60
						then string.format("Verity despierta en %d minuto(s)...", mark // 60)
						else string.format("Verity despierta en %d segundos. Prepara tus armas o busca refugio.", mark)
					Net.fireAll("Notify", text, "warning")
				end
			end
			if remaining <= 0 then
				Verity.spawn()
			end
		end
	end
end

return Verity
