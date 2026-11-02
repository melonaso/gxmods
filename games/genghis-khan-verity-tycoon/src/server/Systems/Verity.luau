--!strict
-- Verity tiene dos modos:
--   Noche (cada N minutos): la bola sonriente del portal se retuerce y se
--     transforma en el monstruo, que persigue al jugador visible mas cercano.
--     Atraviesa todo salvo el suelo, los refugios y las murallas (que golpea
--     hasta romperlas). Si lo matan, NO desaparece: huye herido hacia el
--     portal y se pierde en la oscuridad. Si nadie lo mata, se va al acabarse
--     el tiempo.
--   Final (Systems/FinalBattle): forma final mas grande y fuerte en el campo
--     de batalla, contra los jinetes que se unieron. Si muere, se hunde en la
--     tierra para siempre (hasta la proxima batalla final).
-- Modelo/rig y animaciones: los de "Survive A Verity" (Lib/VerityModel,
-- Controllers/VerityAnimator y Controllers/BallFX).
local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local ServerStorage = game:GetService("ServerStorage")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local Net = require(Shared.Net)
local Pose = require(Shared.VerityPose)
local Types = require(Shared.Types)

local Build = require(script.Parent.Parent.Lib.Build)
local Sfx = require(script.Parent.Parent.Lib.Sfx)
local VerityModel = require(script.Parent.Parent.Lib.VerityModel)
local PlayerData = require(script.Parent.PlayerData)
local World = require(script.Parent.World)

local V = Config.Verity
local F = Config.FinalBattle
local S = Config.Sounds

type Mode = "Night" | "Final"

local Verity = {}

local phase: Types.VerityPhase = "Waiting"
local mode: Mode = "Night"
local P: any = V -- parametros del modo actual (Config.Verity o Config.FinalBattle)
local home = World.PortalPosition -- adonde vuelve / ronda
local participants: { [Player]: boolean }? = nil -- modo Final: solo estos son objetivo
local hold = false -- FinalBattle pausa las noches mientras convoca / pelea
local nextAt = 0
local endsAt = 0
local health = 0
local maxHealth = 0
local model: Model? = nil
local root: BasePart? = nil
local humanoid: Humanoid? = nil
local highlight: Highlight? = nil
local ball: Model? = nil
local releasing = false -- transformacion o muerte: la IA esta apagada
local rootY = 8
local attackUntil = 0
local stunnedUntil = 0
local lastScream = 0
local lastMoveOrder = 0
local lastHurtSound = 0
local fleeStart = 0
local contributions: { [number]: number } = {}
local heartbeatConn: RBXScriptConnection? = nil
local warned: { [number]: boolean } = {}

local finalEnded = Instance.new("BindableEvent")
-- (victory: boolean) cuando termina la batalla final
Verity.FinalEnded = finalEnded.Event

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

-- ¿Puede Verity ir a por este jugador?
local function eligible(player: Player): boolean
	if mode == "Final" then
		return participants ~= nil and participants[player] == true
	end
	return not player:GetAttribute("Hidden")
end

local function flat(v: Vector3): Vector3
	return Vector3.new(v.X, 0, v.Z)
end

-- ===== Bola sonriente (espera en el portal) =====

local function placeBall()
	if ball and ball.Parent then
		return
	end
	local template = ServerStorage:FindFirstChild("VerityBall")
	if not (template and template:IsA("Model")) then
		return
	end
	local m = template:Clone()
	local core = m:FindFirstChild("Core")
	if core and core:IsA("BasePart") then
		m.PrimaryPart = core
	end
	local center = World.PortalPosition + Vector3.new(0, 4, 0)
	-- mira hacia el centro del mapa (+Z desde el portal)
	m:PivotTo(CFrame.lookAt(center, center + Vector3.new(0, 0, 1)))
	m.Name = "VerityBall"
	CollectionService:AddTag(m, "VerityBall")
	m.Parent = workspace
	ball = m
end

-- ===== Murallas =====

local function wallSegments(wall: Instance): { BasePart }
	local list = {}
	for _, p in wall:GetChildren() do
		if p:IsA("BasePart") and p.Name == "WallSegment" then
			table.insert(list, p)
		end
	end
	return list
end

local function closestFlatDistance(part: BasePart, point: Vector3): number
	local lp = part.CFrame:PointToObjectSpace(point)
	local half = part.Size / 2
	local clamped = Vector3.new(math.clamp(lp.X, -half.X, half.X), math.clamp(lp.Y, -half.Y, half.Y), math.clamp(lp.Z, -half.Z, half.Z))
	return flat(part.CFrame:PointToWorldSpace(clamped) - point).Magnitude
end

-- Muralla intacta que le cierra el paso (a menos de 9 studs).
local function blockingWall(point: Vector3): Model?
	for _, wall in World.getWallFolder():GetChildren() do
		if wall:IsA("Model") and not wall:GetAttribute("Broken") then
			for _, seg in wallSegments(wall) do
				if closestFlatDistance(seg, point) <= 9 then
					return wall
				end
			end
		end
	end
	return nil
end

local function setWallBroken(wall: Model, broken: boolean)
	wall:SetAttribute("Broken", broken)
	for _, seg in wallSegments(wall) do
		seg.CanCollide = not broken
		if not seg:GetAttribute("Invisible") then -- la barrera de la puerta siempre es invisible
			seg.Transparency = if broken then 0.85 else 0
		end
	end
end

local function restoreWalls()
	for _, wall in World.getWallFolder():GetChildren() do
		if wall:IsA("Model") then
			wall:SetAttribute("HP", wall:GetAttribute("MaxHP"))
			setWallBroken(wall, false)
		end
	end
end

-- ===== Efectos =====

-- Rugido de monstruo (no grito): el asset propio si esta subido; si no, el
-- alarido de Pro Sound Effects a mitad de velocidad suena grave y gutural,
-- con un golpe de bajo muy lento debajo para darle cuerpo.
local function roar(parent: Instance, volume: number, maxDistance: number?, pitch: number?)
	local k = pitch or 1
	if S.VerityRoar ~= 0 then
		Sfx.play(S.VerityRoar, parent, { Volume = volume, Speed = k, MaxDistance = maxDistance })
	else
		Sfx.play(S.RoarSource, parent, { Volume = volume, Speed = 0.5 * k, MaxDistance = maxDistance })
		Sfx.play(S.Bass, parent, { Volume = volume, Speed = 0.3 * k, MaxDistance = maxDistance })
	end
end

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

local function screamFx(at: Vector3, radius: number)
	local ring = Build.part({
		Name = "Roar",
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
	local d = radius * 2
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
	releasing = false
	phase = "Waiting"
	mode = "Night"
	P = V
	home = World.PortalPosition
	participants = nil
	nextAt = now() + interval()
	endsAt = 0
	health = 0
	warned = {}
	contributions = {}
	restoreWalls()
	publish()
	task.delay(3, placeBall) -- la bola vuelve al portal
end

local function giveRewards()
	local total = 0
	for _, dmg in contributions do
		total += dmg
	end
	for userId, dmg in contributions do
		local player = Players:GetPlayerByUserId(userId)
		if player and total > 0 then
			local reward = P.ParticipationReward + math.floor(P.RewardPool * dmg / total)
			PlayerData.addGold(player, reward)
			PlayerData.addVerityKill(player)
			Net.fireClient(player, "Notify", string.format("Recompensa por tu valor: +%d oro", reward), "reward")
		end
	end
end

-- Noche normal: herido, deja de pelear y corre de vuelta al portal.
local function startFlee()
	local r, h, m = root, humanoid, model
	if not r or not h or not m then
		despawn()
		return
	end
	phase = "Fleeing"
	fleeStart = now()
	attackUntil = 0
	m:SetAttribute("KillStart", nil)
	m:SetAttribute("Sprinting", true)
	h.WalkSpeed = V.FleeSpeed
	h:MoveTo(home)
	roar(r, 2.2, 260, 0.8)
	Sfx.play(S.Victory, workspace, { Volume = 1.2 })
	Net.fireAll("Notify", "VERITY, HERIDO, HUYE HACIA LA OSCURIDAD. Volvera...", "reward")
	publish()
end

-- Batalla final: se retuerce y se hunde en la tierra.
local function finalDeath()
	local m, r = model, root
	if not m or not r then
		finalEnded:Fire(true)
		despawn()
		return
	end
	releasing = true
	if heartbeatConn then
		heartbeatConn:Disconnect()
		heartbeatConn = nil
	end
	m:SetAttribute("KillStart", nil)
	m:SetAttribute("TransformStart", now()) -- la pose de transformacion sirve de agonia
	r.Anchored = true
	roar(r, 3, 600, 0.7)
	Sfx.play(S.Victory, workspace, { Volume = 1.5 })
	Net.fireAll("Notify", "LA FORMA FINAL DE VERITY HA CAIDO. El imperio del Khan es eterno.", "reward")
	task.spawn(function()
		local start = m:GetPivot()
		local depth = rootY * 2.2
		for i = 1, 70 do
			if not m.Parent then
				break
			end
			local a = i / 70
			local shake = (1 - a) * 0.8
			m:PivotTo(start * CFrame.new((math.random() - 0.5) * shake, -depth * a * a, (math.random() - 0.5) * shake))
			task.wait(0.05)
		end
		finalEnded:Fire(true)
		despawn()
	end)
end

local function defeat()
	giveRewards()
	if mode == "Final" then
		finalDeath()
	else
		startFlee()
	end
end

local function canAttack(t: number): boolean
	return t >= attackUntil + P.MeleeCooldown - P.AttackAnimTime and t >= stunnedUntil
end

-- Animacion "levantar y aplastar" (el cliente la ve via KillStart).
-- onImpact corre en el instante del golpe.
local function swing(onImpact: () -> ())
	local m = model
	if not m then
		return
	end
	local t = now()
	attackUntil = t + P.AttackAnimTime
	m:SetAttribute("KillStart", t)
	task.delay(Pose.KillImpact, function()
		if model == m and root and phase ~= "Fleeing" then
			flash(Color3.fromRGB(255, 0, 0))
			Sfx.play(S.Bass, root, { Volume = 2, Speed = 0.5, MaxDistance = 120 })
			onImpact()
		end
	end)
	task.delay(P.AttackAnimTime, function()
		if model == m then
			m:SetAttribute("KillStart", nil)
		end
	end)
end

local function attackPlayer(targetPlayer: Player)
	swing(function()
		local r, h = rootOf(targetPlayer)
		if r and h and root and eligible(targetPlayer) and flat(r.Position - root.Position).Magnitude <= P.MeleeRange + 3 then
			h:TakeDamage(P.MeleeDamage)
			Sfx.play(S.PlayerScream, r, { Volume = 0.7 })
		end
	end)
end

local function attackWall(wall: Model)
	swing(function()
		if not wall.Parent or wall:GetAttribute("Broken") then
			return
		end
		local hp = math.max(0, ((wall:GetAttribute("HP") :: number?) or 0) - V.WallDamage)
		wall:SetAttribute("HP", hp)
		if root then
			Sfx.play(S.Slash, root, { Volume = 1.5, Speed = 0.35 })
		end
		if hp <= 0 then
			setWallBroken(wall, true)
			local owner = Players:GetPlayerByUserId((wall:GetAttribute("OwnerUserId") :: number?) or 0)
			if owner then
				Net.fireClient(owner, "Notify", "Verity rompio tu muralla. Se reparara cuando se vaya.", "danger")
			end
		end
	end)
end

local function stepFlee(r: BasePart, h: Humanoid, t: number)
	if t - lastMoveOrder >= 0.2 then
		lastMoveOrder = t
		h:MoveTo(home)
	end
	if flat(home - r.Position).Magnitude < 10 or t - fleeStart > V.FleeTimeout then
		Net.fireAll("Notify", "Verity se perdio en la oscuridad del portal.", "warning")
		despawn()
	end
end

local function step(_dt: number)
	local r, h = root, humanoid
	if not model or not r or not h or releasing then
		return
	end
	local t = now()

	if r.Position.Y < home.Y - 40 then -- por si cae del mapa
		model:PivotTo(CFrame.new(home + Vector3.new(0, rootY, 0)))
	end

	if phase == "Fleeing" then
		stepFlee(r, h, t)
		return
	end

	if t >= endsAt then
		if mode == "Final" then
			Net.fireAll("Notify", "La forma final de Verity resistio. Volved mas fuertes.", "danger")
			finalEnded:Fire(false)
		else
			Net.fireAll("Notify", "Verity se desvanece en la niebla... por ahora.", "warning")
		end
		despawn()
		return
	end

	-- objetivo: el jugador valido y vivo mas cercano
	local position = r.Position
	local target: BasePart? = nil
	local targetPlayer: Player? = nil
	local bestDist = math.huge
	for _, player in Players:GetPlayers() do
		local pr = rootOf(player)
		if pr and eligible(player) then
			local d = flat(pr.Position - position).Magnitude
			if d < bestDist then
				bestDist = d
				target = pr
				targetPlayer = player
			end
		end
	end

	local stunned = t < stunnedUntil
	local enraged = health / maxHealth <= P.EnrageThreshold
	local speed = if enraged then P.EnragedSpeed else P.WalkSpeed
	h.WalkSpeed = if stunned then speed * 0.3 else speed
	model:SetAttribute("Sprinting", (enraged or mode == "Final") and target ~= nil and not stunned)

	-- moverse (quieto mientras ataca)
	if t - lastMoveOrder >= 0.1 then
		lastMoveOrder = t
		if t < attackUntil then
			h:MoveTo(position)
		elseif target then
			h:MoveTo(target.Position)
		elseif flat(home - position).Magnitude > 6 then
			h:MoveTo(home) -- nadie a la vista: vuelve a rondar su sitio
		end
	end

	if canAttack(t) then
		if targetPlayer and bestDist <= P.MeleeRange then
			attackPlayer(targetPlayer)
		elseif mode == "Night" and target and flat(r.AssemblyLinearVelocity).Magnitude < 3 then
			-- frenado por una muralla: la golpea
			local wall = blockingWall(position)
			if wall then
				attackWall(wall)
			end
		end
	end

	-- rugido: dana a todos los que esten a tiro
	if not stunned and t - lastScream >= P.ScreamCooldown then
		local victims = {}
		for _, player in Players:GetPlayers() do
			local pr, ph = rootOf(player)
			if pr and ph and eligible(player) and flat(pr.Position - position).Magnitude <= P.ScreamRadius then
				table.insert(victims, ph)
			end
		end
		if #victims > 0 then
			lastScream = t
			screamFx(position, P.ScreamRadius)
			roar(r, if mode == "Final" then 3 else 2, if mode == "Final" then 400 else 220, if mode == "Final" then 0.8 else 1)
			for _, ph in victims do
				ph:TakeDamage(P.ScreamDamage)
			end
			Net.fireAll("Notify", "Verity RUGE", "danger")
		end
	end

	publish()
end

function Verity.getPhase(): Types.VerityPhase
	return phase
end

function Verity.isActive(): boolean
	return (phase == "Active" or phase == "Final") and model ~= nil and root ~= nil and not releasing
end

-- "Grosor" de Verity para el alcance de las armas (la forma final es mas grande).
function Verity.getHitRadius(): number
	return V.HitRadius * (if mode == "Final" then F.Scale else 1)
end

function Verity.getPosition(): Vector3?
	if not Verity.isActive() then
		return nil
	end
	return (root :: BasePart).Position
end

-- Llamado por Weapons y ThroatSing tras validar alcance y cooldown.
function Verity.damage(player: Player, amount: number)
	if not Verity.isActive() or amount <= 0 then
		return
	end
	health -= amount
	contributions[player.UserId] = (contributions[player.UserId] or 0) + amount
	flash(Color3.fromRGB(255, 200, 0))
	local t = os.clock()
	if root and t - lastHurtSound > 0.25 then
		lastHurtSound = t
		Sfx.play(S.Bass, root, { Volume = 0.8, Speed = 1.8 })
	end
	if health <= 0 then
		health = 0
		publish()
		defeat()
	else
		publish()
	end
end

-- Canto de garganta: lo deja lento y sin atacar unos segundos.
function Verity.stun(seconds: number)
	if not Verity.isActive() then
		return
	end
	stunnedUntil = math.max(stunnedUntil, now() + seconds)
	flash(Color3.fromRGB(80, 180, 255))
end

-- FinalBattle: mientras convoca o pelea, las noches normales se posponen.
function Verity.setHold(value: boolean)
	hold = value
end

-- FinalBattle: un jinete murio o se fue; deja de ser objetivo.
function Verity.removeParticipant(player: Player)
	if participants then
		participants[player] = nil
	end
end

-- FinalBattle: ya no queda nadie peleando.
function Verity.abortFinal()
	if mode == "Final" and phase == "Final" and not releasing then
		Net.fireAll("Notify", "Los jinetes cayeron. La forma final de Verity resistio.", "danger")
		finalEnded:Fire(false)
		despawn()
	end
end

-- Crea el monstruo invisible y lo revela con la animacion de transformacion.
-- scale: 1 en la noche, F.Scale en la batalla final.
local function emerge(at: Vector3, scale: number, onReleased: () -> ()): boolean
	local m, rig = VerityModel.create()
	if not m or not rig then
		warn("[Verity] No hay modelo de Verity (falta ServerStorage.VerityFallback).")
		return false
	end
	if scale ~= 1 then
		m:ScaleTo(m:GetScale() * scale)
	end
	local r = m.PrimaryPart
	local h = m:FindFirstChildOfClass("Humanoid")
	if not r or not h then
		m:Destroy()
		return false
	end
	h.HipHeight = rig.hipHeight * scale

	Build.ensureGroups()
	local hiddenParts: { [BasePart]: number } = {}
	for _, inst in m:GetDescendants() do
		if inst:IsA("BasePart") then
			inst.CollisionGroup = Build.VERITY_GROUP
			if inst ~= r then
				hiddenParts[inst] = inst.Transparency
				inst.Transparency = 1 -- invisible hasta la transformacion
			end
		end
	end
	local hl = Instance.new("Highlight")
	hl.Name = "HitFlash"
	hl.FillTransparency = 1
	hl.OutlineTransparency = 1
	hl.Parent = m

	-- se mantiene de pie: solo puede girar sobre el eje vertical
	local upright = Instance.new("Attachment")
	upright.Name = "UprightAttachment"
	upright.CFrame = CFrame.fromMatrix(Vector3.zero, Vector3.yAxis, -Vector3.xAxis) -- eje X del attachment = arriba
	upright.Parent = r
	local align = Instance.new("AlignOrientation")
	align.Mode = Enum.OrientationAlignmentMode.OneAttachment
	align.AlignType = Enum.AlignType.PrimaryAxisParallel
	align.Attachment0 = upright
	align.PrimaryAxis = Vector3.yAxis
	align.MaxTorque = 1e8
	align.Responsiveness = 60
	align.Parent = r

	rootY = rig.rootY * scale
	r.Anchored = true
	m:PivotTo(CFrame.new(at + Vector3.new(0, rootY + 0.5, 0)) * CFrame.Angles(0, math.pi, 0))
	h.WalkSpeed = P.WalkSpeed
	m.Parent = workspace

	model, root, humanoid, highlight = m, r, h, hl
	attackUntil = 0
	stunnedUntil = 0
	contributions = {}
	releasing = true

	local start = now()
	m:SetAttribute("TransformStart", start)
	Sfx.play(S.Bass, workspace, { Volume = 1.5, Speed = 0.35 })

	task.spawn(function()
		local duration = V.TransformTime
		local revealFrom = duration * 0.35
		local steps = 14
		task.wait(revealFrom)
		for i = 1, steps do
			local alpha = i / steps
			for part, base in hiddenParts do
				if part.Parent then
					part.Transparency = 1 - (1 - base) * alpha
				end
			end
			task.wait((duration - revealFrom) / steps)
		end
		if model ~= m then
			return
		end
		m:SetAttribute("TransformStart", nil)
		r.Anchored = false
		r:SetNetworkOwner(nil) -- el servidor mueve a Verity
		releasing = false
		lastScream = now()
		heartbeatConn = RunService.Heartbeat:Connect(step)
		onReleased()
	end)
	return true
end

-- Noche normal: la bola sonriente se retuerce y se convierte en el monstruo.
function Verity.spawn()
	if phase ~= "Waiting" then
		return
	end
	mode = "Night"
	P = V
	home = World.PortalPosition
	participants = nil
	local ok = emerge(home, 1, function()
		-- rugido de liberacion: lo oyen todos
		roar(workspace, 1.8)
		Net.fireAll("Notify", "VERITY HA DESPERTADO. Pelea con tus armas o escondete hasta que se vaya.", "danger")
	end)
	if not ok then
		nextAt = now() + interval()
		publish()
		return
	end
	if ball then
		ball:SetAttribute("TransformStart", now()) -- BallFX: se retuerce y se hunde en el monstruo
		task.delay(V.TransformTime, function()
			if ball then
				ball:Destroy()
				ball = nil
			end
		end)
	end
	local count = math.max(1, #Players:GetPlayers())
	maxHealth = V.BaseHealth + V.HealthPerPlayer * (count - 1)
	health = maxHealth
	phase = "Active"
	endsAt = now() + V.DurationSeconds + V.TransformTime
	publish()
	Net.fireAll("Notify", "La bola sonriente se retuerce...", "danger")
end

-- Batalla final: forma final en el centro del campo contra los jinetes.
function Verity.spawnFinal(center: Vector3, riders: { Player }): boolean
	if phase ~= "Waiting" then
		return false
	end
	mode = "Final"
	P = F
	home = center
	participants = {}
	for _, player in riders do
		(participants :: { [Player]: boolean })[player] = true
	end
	local ok = emerge(center, F.Scale, function()
		roar(workspace, 2.5, nil, 0.8)
		Net.fireAll("Notify", "LA FORMA FINAL DE VERITY HA DESPERTADO", "danger")
	end)
	if not ok then
		mode, P, home, participants = "Night", V, World.PortalPosition, nil
		return false
	end
	local m = model :: Model
	-- aura de fuego de la forma final
	local aura = Instance.new("Highlight")
	aura.Name = "FinalAura"
	aura.FillColor = Color3.fromRGB(90, 0, 0)
	aura.FillTransparency = 0.7
	aura.OutlineColor = Color3.fromRGB(255, 60, 0)
	aura.OutlineTransparency = 0
	aura.Parent = m
	local fire = Instance.new("Fire")
	fire.Size = 18
	fire.Heat = 20
	fire.Color = Color3.fromRGB(255, 80, 20)
	fire.SecondaryColor = Color3.fromRGB(120, 0, 0)
	fire.Parent = root

	maxHealth = F.BaseHealth + F.HealthPerPlayer * (math.max(1, #riders) - 1)
	health = maxHealth
	phase = "Final"
	endsAt = now() + F.Duration + V.TransformTime
	publish()
	return true
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
			if allowed(Players:GetPlayerByUserId(source.UserId)) and not hold then
				Verity.spawn()
			end
		end)
		command.Parent = game:GetService("TextChatService")
	end)
	local function hook(player: Player) -- chat clasico
		player.Chatted:Connect(function(message)
			if message:lower() == "/verity" and allowed(player) and not hold then
				Verity.spawn()
			end
		end)
	end
	Players.PlayerAdded:Connect(hook)
	for _, player in Players:GetPlayers() do
		hook(player)
	end
	Players.PlayerRemoving:Connect(function(player)
		Verity.removeParticipant(player)
	end)
end

function Verity.start()
	placeBall()
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
			if hold then
				-- batalla final en marcha: la noche se pospone
				nextAt = math.max(nextAt, now() + 90)
				warned = {}
				publish()
			else
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
end

return Verity
