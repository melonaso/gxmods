--!strict
-- Verity: mientras espera es la bola sonriente (su diseno original) flotando
-- en el portal. Cada N minutos la bola se retuerce, se transforma en el
-- monstruo y persigue al jugador visible mas cercano. Atraviesa todo salvo el
-- suelo, los refugios y las murallas compradas (que golpea hasta romperlas).
-- Se va si se acaba el tiempo o si lo matan.
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
local S = Config.Sounds

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
local ball: Model? = nil
local releasing = false -- durante la transformacion la IA esta apagada
local rootY = 8
local attackUntil = 0
local stunnedUntil = 0
local lastScream = 0
local lastMoveOrder = 0
local lastHurtSound = 0
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
local function roar(parent: Instance, volume: number, maxDistance: number?)
	if S.VerityRoar ~= 0 then
		Sfx.play(S.VerityRoar, parent, { Volume = volume, MaxDistance = maxDistance })
	else
		Sfx.play(S.RoarSource, parent, { Volume = volume, Speed = 0.5, MaxDistance = maxDistance })
		Sfx.play(S.Bass, parent, { Volume = volume, Speed = 0.3, MaxDistance = maxDistance })
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
	releasing = false
	phase = "Waiting"
	nextAt = now() + interval()
	endsAt = 0
	health = 0
	warned = {}
	contributions = {}
	restoreWalls()
	publish()
	task.delay(3, placeBall) -- la bola vuelve al portal
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
	Sfx.play(S.Victory, workspace, { Volume = 1.2 })
	Net.fireAll("Notify", "VERITY HA SIDO DERROTADO. La estepa vuelve a ser del Khan.", "reward")
	despawn()
end

local function canAttack(t: number): boolean
	return t >= attackUntil + V.MeleeCooldown - V.AttackAnimTime and t >= stunnedUntil
end

-- Animacion "levantar y aplastar" (el cliente la ve via KillStart).
-- onImpact corre en el instante del golpe.
local function swing(onImpact: () -> ())
	local m = model
	if not m then
		return
	end
	local t = now()
	attackUntil = t + V.AttackAnimTime
	m:SetAttribute("KillStart", t)
	task.delay(Pose.KillImpact, function()
		if model == m and root then
			flash(Color3.fromRGB(255, 0, 0))
			Sfx.play(S.Bass, root, { Volume = 2, Speed = 0.5, MaxDistance = 120 })
			onImpact()
		end
	end)
	task.delay(V.AttackAnimTime, function()
		if model == m then
			m:SetAttribute("KillStart", nil)
		end
	end)
end

local function attackPlayer(targetPlayer: Player)
	swing(function()
		local r, h = rootOf(targetPlayer)
		if r and h and root and not targetPlayer:GetAttribute("Hidden") and flat(r.Position - root.Position).Magnitude <= V.MeleeRange + 3 then
			h:TakeDamage(V.MeleeDamage)
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

local function step(_dt: number)
	local r, h = root, humanoid
	if not model or not r or not h or releasing then
		return
	end
	local t = now()

	if t >= endsAt then
		Net.fireAll("Notify", "Verity se desvanece en la niebla... por ahora.", "warning")
		despawn()
		return
	end
	if r.Position.Y < -40 then -- por si cae del mapa
		model:PivotTo(CFrame.new(World.PortalPosition + Vector3.new(0, rootY, 0)))
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

	local stunned = t < stunnedUntil
	local enraged = health / maxHealth <= V.EnrageThreshold
	local speed = if enraged then V.EnragedSpeed else V.WalkSpeed
	h.WalkSpeed = if stunned then speed * 0.3 else speed
	model:SetAttribute("Sprinting", enraged and target ~= nil and not stunned)

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

	if canAttack(t) then
		if targetPlayer and bestDist <= V.MeleeRange then
			attackPlayer(targetPlayer)
		elseif target and flat(r.AssemblyLinearVelocity).Magnitude < 3 then
			-- frenado por una muralla: la golpea
			local wall = blockingWall(position)
			if wall then
				attackWall(wall)
			end
		end
	end

	-- rugido: dana a todos los que esten a la vista y cerca
	if not stunned and t - lastScream >= V.ScreamCooldown then
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
			roar(r, 2, 220)
			for _, ph in victims do
				ph:TakeDamage(V.ScreamDamage)
			end
			Net.fireAll("Notify", "Verity RUGE", "danger")
		end
	end

	publish()
end

function Verity.isActive(): boolean
	return phase == "Active" and model ~= nil and root ~= nil and not releasing
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

-- La bola se retuerce y se convierte en el monstruo (TransformTime segundos).
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
	align.MaxTorque = 1e7
	align.Responsiveness = 60
	align.Parent = r

	rootY = rig.rootY
	r.Anchored = true
	m:PivotTo(CFrame.new(World.PortalPosition + Vector3.new(0, rootY + 0.5, 0)) * CFrame.Angles(0, math.pi, 0))
	h.WalkSpeed = V.WalkSpeed
	m.Parent = workspace

	model, root, humanoid, highlight = m, r, h, hl
	local count = math.max(1, #Players:GetPlayers())
	maxHealth = V.BaseHealth + V.HealthPerPlayer * (count - 1)
	health = maxHealth
	contributions = {}
	attackUntil = 0
	stunnedUntil = 0
	releasing = true
	phase = "Active"
	endsAt = now() + V.DurationSeconds + V.TransformTime
	publish()
	Net.fireAll("Notify", "La bola sonriente se retuerce...", "danger")

	-- transformacion: la bola se retuerce (BallFX) y el monstruo aparece poco a poco
	placeBall()
	local start = now()
	if ball then
		ball:SetAttribute("TransformStart", start)
	end
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
		if ball then
			ball:Destroy()
			ball = nil
		end
		m:SetAttribute("TransformStart", nil)
		r.Anchored = false
		r:SetNetworkOwner(nil) -- el servidor mueve a Verity
		releasing = false
		lastScream = now()
		heartbeatConn = RunService.Heartbeat:Connect(step)
		-- rugido de liberacion: lo oyen todos
		roar(workspace, 1.8)
		Net.fireAll("Notify", "VERITY HA DESPERTADO. Pelea con tus armas o escondete hasta que se vaya.", "danger")
	end)
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
