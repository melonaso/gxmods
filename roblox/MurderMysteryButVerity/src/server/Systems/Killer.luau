--!strict
-- Verity: transforma al asesino en la criatura (modelo preparado por
-- VerityModel, con la skin equipada) y resuelve el ataque de la tecla Q: agarra a la víctima, la levanta sobre
-- la cabeza y la aplasta contra el suelo, que la hace volar en pedazos.
-- Verity puede ser un jugador o un NPC (modo prueba, cuando el jugador elige
-- ser superviviente): en ese caso el "dueño" es el propio modelo y lo maneja
-- VerityBot. El personaje lleva la etiqueta "VerityCharacter" en ambos casos.
-- La animación la reproducen los clientes con VerityPose; el servidor usa la
-- misma línea de tiempo para mover a la víctima entre las manos.

local CollectionService = game:GetService("CollectionService")
local Debris = game:GetService("Debris")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local ServerStorage = game:GetService("ServerStorage")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local Assets = require(ReplicatedStorage.Shared.Assets)
local Config = require(ReplicatedStorage.Shared.Config)
local Net = require(ReplicatedStorage.Shared.Net)
local Pose = require(ReplicatedStorage.Shared.VerityPose)
local Entity = require(script.Parent.Parent.Lib.Entity)
local VerityModel = require(script.Parent.VerityModel)

export type Context = {
	survivors: () -> { Instance },
	onGrab: (victim: Instance, position: Vector3) -> (), -- la víctima ya cuenta como muerta
	goreParent: Instance,
}

local K = Config.Killer
local BLOOD = Color3.fromRGB(120, 4, 12)

local Killer = {}

local current: Instance? = nil -- Player o Model (Verity NPC)
local context: Context? = nil
local released = false
local killing = false
local lastKill = 0
local rig: Pose.RigData? = nil
local ball: Model? = nil
local hiddenParts: { [BasePart]: number } = {}
local cameraOffset = Vector3.zero

local function now(): number
	return Workspace:GetServerTimeNow()
end

local function rootOf(owner: Instance): BasePart?
	return Entity.root(owner)
end

-- Crea a Verity en `spawn` (CFrame a 3 studs sobre el suelo). Con un jugador,
-- pasa a ser su personaje; sin él, es un NPC dentro de `parent`. Queda
-- anclada hasta release().
local function morph(player: Player?, spawn: CFrame, parent: Instance): Model?
	local skin = if player then player:GetAttribute("Skin") else nil
	local model, data = VerityModel.create(if typeof(skin) == "string" then skin else nil)
	if not (model and data) then
		warn("[Killer] no hay modelo de Verity disponible")
		return nil
	end
	rig = data
	model.Name = if player then player.Name else "Verity"
	CollectionService:AddTag(model, "VerityCharacter")
	local root = model.PrimaryPart :: BasePart
	local floorY = spawn.Position.Y - 3
	local look = spawn.LookVector * Vector3.new(1, 0, 1)
	local facing = if look.Magnitude > 0.01 then look.Unit else Vector3.new(0, 0, -1)
	local position = Vector3.new(spawn.Position.X, floorY + data.rootY + 0.1, spawn.Position.Z)
	model:PivotTo(CFrame.lookAt(position, position + facing))
	root.Anchored = true

	local humanoid = model:FindFirstChildOfClass("Humanoid") :: Humanoid
	-- cámara a la altura de la cabeza
	humanoid.CameraOffset = Vector3.new(0, math.max(0, (model:GetAttribute("RigHeight") :: number? or 16) * 0.85 - data.rootY), 0)
	humanoid.WalkSpeed = Config.Movement.VerityWalk
	humanoid.HipHeight = data.hipHeight

	if not player then
		humanoid.DisplayName = "Verity"
		humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
		model:SetAttribute("IsVerityBot", true)
		model.Parent = parent
		pcall(root.SetNetworkOwner, root, nil)
		return model
	end
	local old = player.Character
	player.Character = model
	model.Parent = Workspace
	if old then
		old:Destroy()
	end
	return model
end

local function bloodPool(position: Vector3, size: number, parent: Instance)
	local pool = Instance.new("Part")
	pool.Name = "BloodPool"
	pool.Anchored = true
	pool.CanCollide = false
	pool.CanQuery = false
	pool.Shape = Enum.PartType.Cylinder
	pool.Color = BLOOD
	pool.Material = Enum.Material.Glass
	pool.Reflectance = 0.12
	pool.Size = Vector3.new(0.06, 0.5, 0.5)
	-- el eje del cilindro es X: se gira para que quede plano en el suelo
	pool.CFrame = CFrame.new(position) * CFrame.Angles(0, math.random() * math.pi, math.rad(90))
	pool.Parent = parent
	TweenService:Create(pool, TweenInfo.new(0.6 + math.random() * 0.6, Enum.EasingStyle.Quint), { Size = Vector3.new(0.06, size, size) }):Play()
end

local function bleedingEmitter(part: BasePart)
	local emitter = Instance.new("ParticleEmitter")
	if Assets.Splash ~= "" then
		emitter.Texture = Assets.Splash
	end
	emitter.Color = ColorSequence.new(Color3.fromRGB(150, 6, 16), Color3.fromRGB(80, 0, 6))
	emitter.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.5), NumberSequenceKeypoint.new(1, 0.1) })
	emitter.Transparency = NumberSequence.new(0, 0.8)
	emitter.Lifetime = NumberRange.new(0.4, 0.8)
	emitter.Rate = 30
	emitter.Speed = NumberRange.new(1, 4)
	emitter.Acceleration = Vector3.new(0, -40, 0)
	emitter.SpreadAngle = Vector2.new(60, 60)
	emitter.Parent = part
	task.delay(1.6, function()
		emitter.Enabled = false
	end)
end

-- Rompe a la víctima en pedazos que salen volando.
local function explode(character: Model, impact: Vector3, parent: Instance)
	for _, inst in character:GetDescendants() do
		if inst:IsA("JointInstance") or inst:IsA("WeldConstraint") or inst:IsA("Motor6D") then
			inst:Destroy()
		end
	end
	for _, inst in character:GetDescendants() do
		if inst:IsA("BasePart") then
			inst.Anchored = false
			-- el servidor simula los pedazos (si no, el cliente de la víctima los congela)
			pcall(inst.SetNetworkOwner, inst, nil)
			inst.CanCollide = inst.Name ~= "HumanoidRootPart"
			if inst.Name == "HumanoidRootPart" then
				inst.Transparency = 1
			end
			local dir = Vector3.new(math.random() - 0.5, 0, math.random() - 0.5)
			dir = if dir.Magnitude > 0.01 then dir.Unit else Vector3.xAxis
			inst.AssemblyLinearVelocity = dir * math.random(25, 55) + Vector3.new(0, math.random(35, 65), 0)
			inst.AssemblyAngularVelocity = Vector3.new(math.random(-20, 20), math.random(-20, 20), math.random(-20, 20))
			if inst.Name ~= "HumanoidRootPart" then
				bleedingEmitter(inst)
				if inst.Size.Magnitude > 1 then
					inst.Color = inst.Color:Lerp(BLOOD, 0.35)
				end
			end
		end
	end
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if humanoid then
		humanoid.Health = 0
	end
	-- charcos y salpicaduras en el suelo
	bloodPool(impact + Vector3.new(0, 0.05, 0), 9, parent)
	for _ = 1, 6 do
		local offset = Vector3.new(math.random(-9, 9), 0.04, math.random(-9, 9))
		bloodPool(impact + offset, 1.5 + math.random() * 3, parent)
	end
	Net.get("Effect"):FireAllClients("Gore", impact)
	if not Players:GetPlayerFromCharacter(character) then
		Debris:AddItem(character, 12)
	end
end

local function findVictim(root: BasePart, ctx: Context): Instance?
	local forward = root.CFrame.LookVector * Vector3.new(1, 0, 1)
	forward = if forward.Magnitude > 0 then forward.Unit else Vector3.zAxis
	local best: Instance? = nil
	local bestDistance = K.KillRange
	for _, survivor in ctx.survivors() do
		local targetRoot = Entity.root(survivor)
		local humanoid = Entity.humanoid(survivor)
		if targetRoot and humanoid and humanoid.Health > 0 and targetRoot:GetAttribute("Grabbed") ~= true then
			local offset = (targetRoot.Position - root.Position) * Vector3.new(1, 0, 1)
			local distance = offset.Magnitude
			local facing = if distance > 0.01 then offset.Unit:Dot(forward) else 1
			if distance <= bestDistance and (facing >= K.KillConeDot or distance < 4) then
				best = survivor
				bestDistance = distance
			end
		end
	end
	return best
end

-- `who`: el jugador que es Verity o el modelo de la Verity NPC.
function Killer.tryKill(who: Instance)
	local ctx = context
	if who ~= current or not ctx or not released or killing then
		return
	end
	if os.clock() - lastKill < K.KillCooldown then
		return
	end
	local character = Entity.character(who)
	local root = rootOf(who)
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	local data = rig
	if not (character and root and humanoid and data) then
		return
	end
	local victim = findVictim(root, ctx)
	if not victim then
		return
	end
	local victimCharacter = Entity.character(victim)
	local victimRoot = Entity.root(victim)
	if not (victimCharacter and victimRoot) then
		return
	end

	killing = true
	ctx.onGrab(victim, victimRoot.Position)
	-- el grito suena en la víctima mientras la levanta; la explosión lo corta
	Net.get("Effect"):FireAllClients("Grab", victimRoot)

	-- Verity se queda quieta y de pie mientras dura la animación (si estaba
	-- agachada, se la levanta: el cálculo de las manos parte de los pies).
	local feetY = root.Position.Y - root.Size.Y / 2 - humanoid.HipHeight
	character:SetAttribute("Crouching", false)
	humanoid.HipHeight = data.hipHeight
	root.Anchored = true
	root.CFrame = CFrame.new(root.Position.X, feetY + data.rootY, root.Position.Z) * root.CFrame.Rotation
	local killerCF = root.CFrame
	victimRoot.Anchored = true
	victimRoot:SetAttribute("Grabbed", true) -- un cepo no debe soltarla
	local victimStart = victimRoot.CFrame
	local start = now()
	character:SetAttribute("KillStart", start)

	-- La víctima mira a Verity mientras cuelga de sus manos
	local hangRotation = (killerCF - killerCF.Position) * CFrame.Angles(0, math.pi, 0)
	local origin = CFrame.new(killerCF.Position.X, feetY, killerCF.Position.Z) * killerCF.Rotation

	local connection: RBXScriptConnection
	local impacted = false
	connection = RunService.Heartbeat:Connect(function()
		local t = now() - start
		if not victimRoot.Parent then
			connection:Disconnect()
			return
		end
		if t < Pose.KillImpact then
			local grip = origin:PointToWorldSpace(Pose.gripLocal(t, data))
			local target = CFrame.new(grip - Vector3.new(0, 1.2, 0)) * hangRotation
			local alpha = math.clamp((t - 0.2) / (Pose.KillGrab - 0.2), 0, 1)
			victimRoot.CFrame = victimStart:Lerp(target, alpha * alpha * (3 - 2 * alpha))
		elseif not impacted then
			impacted = true
			connection:Disconnect()
			local grip = origin:PointToWorldSpace(Pose.gripLocal(Pose.KillImpact, data))
			local ground = Vector3.new(grip.X, origin.Position.Y, grip.Z)
			explode(victimCharacter, ground, ctx.goreParent)
		end
	end)

	task.delay(Pose.KillDuration, function()
		if connection.Connected then
			connection:Disconnect()
		end
		if character.Parent then
			character:SetAttribute("KillStart", nil)
			root.Anchored = false
		end
		killing = false
		lastKill = os.clock()
	end)
end

-- La bola sonriente (diseño original de Verity) que espera durante la
-- ventaja inicial. El monstruo ya está en su sitio, pero invisible.
local function spawnBall(character: Model, spawn: CFrame, parent: Instance)
	local template = ServerStorage:FindFirstChild("VerityBall")
	if not (template and template:IsA("Model")) then
		return
	end
	local model = template:Clone()
	local core = model:FindFirstChild("Core")
	if core and core:IsA("BasePart") then
		model.PrimaryPart = core
	end
	local floorY = spawn.Position.Y - 3
	local look = spawn.LookVector * Vector3.new(1, 0, 1)
	local facing = if look.Magnitude > 0.01 then look.Unit else Vector3.new(0, 0, -1)
	local center = Vector3.new(spawn.Position.X, floorY + 3.6, spawn.Position.Z)
	model:PivotTo(CFrame.lookAt(center, center + facing))
	model.Name = "VerityBall"
	model:SetAttribute("Owner", character.Name)
	CollectionService:AddTag(model, "VerityBall")
	model.Parent = parent
	ball = model

	-- el monstruo queda invisible hasta la transformación
	table.clear(hiddenParts)
	for _, inst in character:GetDescendants() do
		if inst:IsA("BasePart") and inst.Name ~= "HumanoidRootPart" then
			hiddenParts[inst] = inst.Transparency
			inst.Transparency = 1
		elseif inst:IsA("Highlight") or inst:IsA("ParticleEmitter") then
			inst.Enabled = false
		elseif inst:IsA("Decal") or inst:IsA("SurfaceGui") then
			if inst:IsA("SurfaceGui") then
				inst.Enabled = false
			else
				inst.Transparency = 1
			end
		end
	end
	-- cámara a la altura de la bola
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if humanoid and rig then
		cameraOffset = humanoid.CameraOffset
		humanoid.CameraOffset = Vector3.new(0, 4 - rig.rootY, 0)
	end
end

-- player = nil: Verity es un NPC. Devuelve el "dueño" de Verity (el jugador
-- o el modelo del NPC).
function Killer.setup(player: Player?, spawn: CFrame, ctx: Context): Instance?
	context = ctx
	released = false
	killing = false
	local character = morph(player, spawn, ctx.goreParent)
	current = if player then player else character
	if character then
		spawnBall(character, spawn, ctx.goreParent)
	end
	return current
end

-- La bola se retuerce (huesos crujiendo) y se convierte en el monstruo.
-- Los clientes animan la bola con TransformStart; aquí se revela el
-- monstruo poco a poco y se libera al terminar.
function Killer.release()
	local owner = current
	if not owner then
		return
	end
	local character = Entity.character(owner)
	local root = rootOf(owner)
	local duration = Config.Round.TransformTime
	local start = now()
	local ballModel = ball
	if ballModel then
		ballModel:SetAttribute("TransformStart", start)
	end
	if character then
		character:SetAttribute("TransformStart", start)
	end
	Net.get("Effect"):FireAllClients("Transform", if root then root.Position else Vector3.zero)

	task.spawn(function()
		local steps = 14
		local revealFrom = duration * 0.35
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
		if character and character.Parent then
			for _, inst in character:GetDescendants() do
				if inst:IsA("Highlight") or inst:IsA("ParticleEmitter") or inst:IsA("SurfaceGui") then
					inst.Enabled = true
				elseif inst:IsA("Decal") then
					inst.Transparency = 0
				end
			end
			local humanoid = character:FindFirstChildOfClass("Humanoid")
			if humanoid then
				humanoid.CameraOffset = cameraOffset
			end
			character:SetAttribute("TransformStart", nil)
			character:SetAttribute("Released", true)
		end
		if ballModel then
			ballModel:Destroy()
		end
		ball = nil
		table.clear(hiddenParts)
		if root and root.Parent then
			root.Anchored = false
		end
		released = true
	end)
end

function Killer.current(): Instance?
	return current
end

function Killer.isReleased(): boolean
	return released
end

function Killer.isKilling(): boolean
	return killing
end

function Killer.cleanup()
	if ball then
		ball:Destroy()
		ball = nil
	end
	table.clear(hiddenParts)
	rig = nil
	current = nil
	context = nil
	released = false
	killing = false
end

function Killer.init()
	Players.PlayerRemoving:Connect(function(player)
		if player == current then
			current = nil
		end
	end)
end

return Killer
