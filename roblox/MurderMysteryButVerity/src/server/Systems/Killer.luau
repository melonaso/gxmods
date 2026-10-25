--!strict
-- Verity: transforma al asesino en la criatura (modelo preparado por
-- VerityModel, con la skin equipada) y resuelve el ataque de la tecla Q: agarra a la víctima, la levanta sobre
-- la cabeza y la aplasta contra el suelo, que la hace volar en pedazos.
-- La animación la reproducen los clientes con VerityPose; el servidor usa la
-- misma línea de tiempo para mover a la víctima entre las manos.

local Debris = game:GetService("Debris")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
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

local current: Player? = nil
local context: Context? = nil
local released = false
local killing = false
local lastKill = 0
local rig: Pose.RigData? = nil

local function now(): number
	return Workspace:GetServerTimeNow()
end

local function rootOf(player: Player): BasePart?
	return Entity.root(player)
end

-- Crea a Verity en `spawn` (CFrame a 3 studs sobre el suelo) y la asigna
-- como personaje del jugador. Queda anclada hasta release().
local function morph(player: Player, spawn: CFrame): Model?
	local skin = player:GetAttribute("Skin")
	local model, data = VerityModel.create(if typeof(skin) == "string" then skin else nil)
	if not (model and data) then
		warn("[Killer] no hay modelo de Verity disponible")
		return nil
	end
	rig = data
	model.Name = player.Name
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

function Killer.tryKill(player: Player)
	local ctx = context
	if player ~= current or not ctx or not released or killing then
		return
	end
	if os.clock() - lastKill < K.KillCooldown then
		return
	end
	local character = player.Character
	local root = rootOf(player)
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

function Killer.setup(player: Player, spawn: CFrame, ctx: Context)
	current = player
	context = ctx
	released = false
	killing = false
	morph(player, spawn)
end

function Killer.release()
	local player = current
	if not player then
		return
	end
	released = true
	local character = player.Character
	local root = rootOf(player)
	if root then
		root.Anchored = false
	end
	if character then
		character:SetAttribute("Released", true)
	end
end

function Killer.current(): Player?
	return current
end

function Killer.isKilling(): boolean
	return killing
end

function Killer.cleanup()
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
