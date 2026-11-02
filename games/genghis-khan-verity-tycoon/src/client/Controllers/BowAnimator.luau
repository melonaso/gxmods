--!strict
-- Animacion del Arco Compuesto, para cualquier jugador que lo tenga equipado:
--   listo   : flecha encordada, brazo izquierdo apoyado en la cuerda
--   tensar  : (ShotAt .. +DrawTime) la cuerda y la flecha retroceden hacia el
--             arquero y el brazo izquierdo tira hacia la cara
--   soltar  : la flecha desaparece (sale la del servidor) y la cuerda vibra
--   recargar: (tras RecoverTime) aparece una flecha nueva
-- El brazo derecho ya lo pone al frente la animacion "toolnone" de Roblox.
-- Todo es local: cambia Weld.C0 de la cuerda/flecha y Motor6D.C0 del brazo.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)

local B = Config.Bow

type Joint = { motor: Motor6D, base: CFrame, frame: CFrame }
type State = {
	tool: Tool,
	shoulder: Joint?,
	elbow: Joint?,
	blend: number,
}

local BowAnimator = {}

local states: { [Tool]: State } = {}

local function joint(character: Model, names: { string }): Joint?
	for _, inst in character:GetDescendants() do
		if inst:IsA("Motor6D") and table.find(names, inst.Name) then
			return { motor = inst, base = inst.C0, frame = inst.C0.Rotation }
		end
	end
	return nil
end

-- rotacion expresada en el marco del torso, sea cual sea el C0 (R15 o R6)
local function setJoint(j: Joint?, rotation: CFrame)
	if j and j.motor.Parent then
		j.motor.C0 = j.base * (j.frame:Inverse() * rotation * j.frame)
	end
end

local function restore(state: State)
	for _, j in { state.shoulder, state.elbow } do
		if j and j.motor.Parent then
			j.motor.C0 = j.base
		end
	end
end

local function smooth(a: number): number
	a = math.clamp(a, 0, 1)
	return a * a * (3 - 2 * a)
end

local function placeString(tool: Tool, name: string, tip: Vector3, nock: Vector3)
	local part = tool:FindFirstChild(name)
	local weld = part and part:FindFirstChild("BowWeld")
	if part and part:IsA("BasePart") and weld and weld:IsA("Weld") then
		part.Size = Vector3.new(0.06, 0.06, (tip - nock).Magnitude)
		weld.C0 = CFrame.lookAt((tip + nock) / 2, tip)
	end
end

local function setArrowVisible(arrow: BasePart, visible: boolean)
	local t = if visible then 0 else 1
	arrow.LocalTransparencyModifier = t
	-- punta y plumas son piezas aparte soldadas a la flecha
	local tool = arrow.Parent
	if tool then
		for _, name in { "ArrowHead", "Fletching" } do
			local p = tool:FindFirstChild(name)
			if p and p:IsA("BasePart") then
				p.LocalTransparencyModifier = t
			end
		end
	end
end

local function animate(state: State, character: Model, dt: number)
	local tool = state.tool
	local shotAt = (tool:GetAttribute("ShotAt") :: number?) or -math.huge
	local p = workspace:GetServerTimeNow() - shotAt

	local draw = 0
	local vibrate = 0
	local arrowVisible = true
	if p >= 0 and p < B.DrawTime then
		draw = smooth(p / B.DrawTime)
	elseif p >= B.DrawTime and p < B.DrawTime + B.RecoverTime then
		local q = p - B.DrawTime
		vibrate = math.sin(q * 70) * 0.25 * (1 - q / B.RecoverTime)
		arrowVisible = false
	end

	-- cuerda: el punto de encordar retrocede hacia el arquero (-X)
	local nock = Vector3.new(B.StringTop.X - B.DrawDistance * draw + vibrate, 0, 0)
	placeString(tool, "StringTop", B.StringTop, nock)
	placeString(tool, "StringBottom", B.StringBottom, nock)

	local arrow = tool:FindFirstChild("NockedArrow")
	local arrowWeld = arrow and arrow:FindFirstChild("BowWeld")
	if arrow and arrow:IsA("BasePart") and arrowWeld and arrowWeld:IsA("Weld") then
		local center = nock + Vector3.new(B.ArrowLength / 2, 0, 0)
		arrowWeld.C0 = CFrame.lookAt(center, center + Vector3.xAxis)
		setArrowVisible(arrow, arrowVisible)
	end

	-- brazo izquierdo: al frente apoyado en la cuerda; al tensar tira hacia la cara
	state.blend = math.min(1, state.blend + dt * 6) -- entra suave al equipar
	local k = state.blend
	local pitch = math.rad(80) * k
	local yaw = -(0.45 + 0.25 * draw) * k -- hacia el centro del cuerpo
	setJoint(state.shoulder, CFrame.Angles(0, yaw, 0) * CFrame.Angles(pitch, 0, 0))
	setJoint(state.elbow, CFrame.Angles(math.rad(25 + 85 * draw) * k, 0, 0))
end

function BowAnimator.start()
	RunService.RenderStepped:Connect(function(dt)
		local seen: { [Tool]: boolean } = {}
		for _, player in Players:GetPlayers() do
			local character = player.Character
			local tool = character and character:FindFirstChildOfClass("Tool")
			if character and tool and tool:GetAttribute("WeaponId") == "Arco" then
				seen[tool] = true
				local state = states[tool]
				if not state then
					state = {
						tool = tool,
						shoulder = joint(character, { "LeftShoulder", "Left Shoulder" }),
						elbow = joint(character, { "LeftElbow" }),
						blend = 0,
					}
					states[tool] = state
				end
				animate(state, character, dt)
			end
		end
		-- arco guardado o personaje muerto: brazo a su sitio
		for tool, state in states do
			if not seen[tool] then
				restore(state)
				states[tool] = nil
			end
		end
	end)
end

return BowAnimator
