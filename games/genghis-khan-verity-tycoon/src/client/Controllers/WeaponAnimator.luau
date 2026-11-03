--!strict
-- Animacion de la Lanza del Khan y del Trueno de Tengri, para cualquier
-- jugador que las tenga equipadas. El servidor marca el golpe con el atributo
-- AttackAt del Tool (hora del servidor) y aqui se anima el brazo derecho:
--   Lanza  : baja la lanza a horizontal (punta al frente), estocada hacia
--            delante y vuelta a la guardia.
--   Trueno : alza el baculo por encima de la cabeza, lo baja de golpe (en ese
--            instante el servidor lanza el rayo, Config.Staff.CastTime) y el
--            orbe brilla con el destello.
-- Todo es local: cambia Motor6D.C0 del hombro y el brillo del orbe.
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

local function setOrb(tool: Tool, flash: number)
	local orb = tool:FindFirstChild("Orb")
	local light = orb and orb:FindFirstChildOfClass("PointLight")
	if light then
		light.Brightness = ORB_BASE + 6 * flash
		light.Range = 10 + 8 * flash
	end
end

local function animate(state: State, id: string)
	local tool = state.tool
	local attackAt = (tool:GetAttribute("AttackAt") :: number?) or -math.huge
	local p = workspace:GetServerTimeNow() - attackAt
	local length = if id == "Lanza" then SPEAR_TIME else STAFF_TIME
	if p < 0 or p >= length then
		setJoint(state.shoulder, CFrame.identity, 0)
		if id == "Trueno" then
			setOrb(tool, 0)
		end
		return
	end
	local pose = if id == "Lanza" then spearPose(p) else staffPose(p)
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
			if character and tool and (id == "Lanza" or id == "Trueno") then
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
