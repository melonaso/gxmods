--!strict
-- Animacion de la Lanza del Khan, el Trueno de Tengri, la Maza de Hierro y
-- la Bomba de Polvora, para cualquier jugador que las tenga equipadas. El
-- servidor marca el golpe con el atributo AttackAt del Tool (hora del
-- servidor) y aqui se anima el brazo derecho:
--   Lanza  : baja la lanza a horizontal (punta al frente), estocada hacia
--            delante y vuelta a la guardia.
--   Trueno : alza el baculo por encima de la cabeza, lo baja de golpe (en ese
--            instante el servidor lanza el rayo, Config.Staff.CastTime) y el
--            orbe brilla con el destello.
--   Maza   : la alza y la baja de golpe (Config.Mace.ImpactTime).
--   Bomba  : la lleva por detras del hombro y la lanza (Config.Bomb.ThrowTime);
--            la mano queda vacia hasta que "recarga" (Config.Bomb.ReloadTime).
-- Todo es local: cambia Motor6D.C0 del hombro, el brillo del orbe y la
-- transparencia local de la bomba.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)

type Joint = { motor: Motor6D, base: CFrame, frame: CFrame }
type State = {
	tool: Tool,
	shoulder: Joint?,
}
type Pose = { pitch: number, push: number, flash: number }

local SPEAR_TIME = 0.55
local STAFF_TIME = 0.75
local MACE_TIME = 0.8
local BOMB_TIME = 0.8
local ANIMATED = { Lanza = true, Trueno = true, Maza = true, Bomba = true }
local ORB_BASE = 1.5 -- brillo normal del orbe (igual que en Weapons.buildThunderStaff)

local WeaponAnimator = {}

local states: { [Tool]: State } = {}

local function joint(character: Model, names: { string }): Joint?
	for _, inst in character:GetDescendants() do
		if inst:IsA("Motor6D") and table.find(names, inst.Name) then
			return { motor = inst, base = inst.C0, frame = inst.C0.Rotation }
		end
	end
	return nil
end

-- rotacion (y empuje hacia delante) en el marco del torso, sea R15 o R6
local function setJoint(j: Joint?, rotation: CFrame, push: number)
	if j and j.motor.Parent then
		j.motor.C0 = CFrame.new(0, 0, -push) * j.base * (j.frame:Inverse() * rotation * j.frame)
	end
end

local function smooth(a: number): number
	a = math.clamp(a, 0, 1)
	return a * a * (3 - 2 * a)
end

local function lerp(a: number, b: number, t: number): number
	return a + (b - a) * t
end

-- angulos: positivo sube el brazo, negativo lo baja (sobre la pose "toolnone",
-- que ya tiene el brazo al frente). Con el brazo bajado la lanza queda horizontal.
local function spearPose(p: number): Pose
	local down = math.rad(-85)
	if p < 0.12 then -- baja la lanza a horizontal
		return { pitch = down * smooth(p / 0.12), push = 0, flash = 0 }
	elseif p < 0.24 then -- estocada
		return { pitch = down, push = 1.8 * smooth((p - 0.12) / 0.12), flash = 0 }
	else -- vuelta a la guardia
		local t = smooth((p - 0.24) / (SPEAR_TIME - 0.24))
		return { pitch = down * (1 - t), push = 1.8 * (1 - t), flash = 0 }
	end
end

local function staffPose(p: number): Pose
	local up, strike = math.rad(70), math.rad(-55)
	local cast = Config.Staff.CastTime
	local windup = cast - 0.05
	if p < windup then -- alza el baculo
		return { pitch = up * smooth(p / windup), push = 0, flash = 0 }
	elseif p < cast + 0.03 then -- lo baja de golpe: sale el rayo
		local t = smooth((p - windup) / 0.08)
		return { pitch = lerp(up, strike, t), push = 0.6 * t, flash = t }
	elseif p < cast + 0.15 then -- sostiene mientras se apaga el destello
		local t = (p - cast - 0.03) / 0.12
		return { pitch = strike, push = 0.6, flash = 1 - t * 0.7 }
	else -- vuelta a la guardia
		local t = smooth((p - cast - 0.15) / (STAFF_TIME - cast - 0.15))
		return { pitch = strike * (1 - t), push = 0.6 * (1 - t), flash = 0.3 * (1 - t) }
	end
end

-- alza y baja de golpe: el impacto llega en "impact" segundos
local function smashPose(p: number, impact: number, length: number): Pose
	local up, strike = math.rad(80), math.rad(-60)
	local windup = impact - 0.06
	if p < windup then
		return { pitch = up * smooth(p / windup), push = 0, flash = 0 }
	elseif p < impact + 0.04 then
		local t = smooth((p - windup) / 0.1)
		return { pitch = up + (strike - up) * t, push = 0.5 * t, flash = 0 }
	elseif p < impact + 0.16 then
		return { pitch = strike, push = 0.5, flash = 0 }
	else
		local t = smooth((p - impact - 0.16) / (length - impact - 0.16))
		return { pitch = strike * (1 - t), push = 0.5 * (1 - t), flash = 0 }
	end
end

-- lanzamiento por encima del hombro: sale de la mano en "release" segundos
local function throwPose(p: number, release: number, length: number): Pose
	local back, follow = math.rad(110), math.rad(-25)
	local windup = release - 0.1
	if p < windup then
		return { pitch = back * smooth(p / windup), push = -0.3 * smooth(p / windup), flash = 0 }
	elseif p < release + 0.05 then
		local t = smooth((p - windup) / 0.15)
		return { pitch = back + (follow - back) * t, push = -0.3 + 0.9 * t, flash = 0 }
	else
		local t = smooth((p - release - 0.05) / (length - release - 0.05))
		return { pitch = follow * (1 - t), push = 0.6 * (1 - t), flash = 0 }
	end
end

-- la bomba desaparece de la mano al lanzarla y vuelve al recargar
local function setBombVisible(tool: Tool, visible: boolean)
	local t = if visible then 0 else 1
	for _, inst in tool:GetDescendants() do
		if inst:IsA("BasePart") then
			inst.LocalTransparencyModifier = t
		elseif inst:IsA("Sparkles") then
			inst.Enabled = visible
		end
	end
end

local function setOrb(tool: Tool, flash: number)
	local orb = tool:FindFirstChild("Orb")
	local light = orb and orb:FindFirstChildOfClass("PointLight")
	if light then
		light.Brightness = ORB_BASE + 6 * flash
		light.Range = 10 + 8 * flash
	end
end

local LENGTH = { Lanza = SPEAR_TIME, Trueno = STAFF_TIME, Maza = MACE_TIME, Bomba = BOMB_TIME }

local function animate(state: State, id: string)
	local tool = state.tool
	local attackAt = (tool:GetAttribute("AttackAt") :: number?) or -math.huge
	local p = workspace:GetServerTimeNow() - attackAt
	if id == "Bomba" then
		setBombVisible(tool, p < Config.Bomb.ThrowTime or p >= Config.Bomb.ReloadTime)
	end
	local length = LENGTH[id] or STAFF_TIME
	if p < 0 or p >= length then
		setJoint(state.shoulder, CFrame.identity, 0)
		if id == "Trueno" then
			setOrb(tool, 0)
		end
		return
	end
	local pose = if id == "Lanza"
		then spearPose(p)
		elseif id == "Maza" then smashPose(p, Config.Mace.ImpactTime, MACE_TIME)
		elseif id == "Bomba" then throwPose(p, Config.Bomb.ThrowTime, BOMB_TIME)
		else staffPose(p)
	setJoint(state.shoulder, CFrame.Angles(pose.pitch, 0, 0), pose.push)
	if id == "Trueno" then
		setOrb(tool, pose.flash)
	end
end

function WeaponAnimator.start()
	RunService.RenderStepped:Connect(function()
		local active: { [Tool]: { character: Model, id: string } } = {}
		for _, player in Players:GetPlayers() do
			local character = player.Character
			local tool = character and character:FindFirstChildOfClass("Tool")
			local id = tool and tool:GetAttribute("WeaponId")
			if character and tool and typeof(id) == "string" and ANIMATED[id] then
				active[tool] = { character = character, id = id :: string }
			end
		end
		-- arma guardada o personaje muerto: brazo a su sitio (antes de que otra
		-- arma recien equipada lea la posicion base del hombro)
		for tool, state in states do
			if not active[tool] then
				local j = state.shoulder
				if j and j.motor.Parent then
					j.motor.C0 = j.base
				end
				setBombVisible(tool, true) -- por si se guardo sin recargar
				states[tool] = nil
			end
		end
		for tool, info in active do
			local state = states[tool]
			if not state then
				state = {
					tool = tool,
					shoulder = joint(info.character, { "RightShoulder", "Right Shoulder" }),
				}
				states[tool] = state
			end
			animate(state, info.id)
		end
	end)
end

return WeaponAnimator
