--!strict
-- Anima a los jinetes de la batalla final (personajes con el atributo Mounted):
--   - caballo: las cuatro patas galopan segun la velocidad (diagonales
--     alternadas: delantera izq. con trasera der.), con el cuello cabeceando
--   - jinete: piernas abiertas a los lados del caballo y rodillas dobladas.
-- Se hace en Stepped (PreSimulation), DESPUES de que el Animator de Roblox
-- aplique la animacion de caminar/correr, asi que esta pose la reemplaza en
-- las piernas. Los brazos siguen con sus animaciones (armas, arco).
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local HorseAnimator = {}

type Rider = { phase: number }

local riders: { [Model]: Rider } = {}

local LEGS = { LegFL = 0, LegBR = 0, LegFR = math.pi, LegBL = math.pi } -- desfase del galope

local function motor(parent: Instance?, name: string): Motor6D?
	if not parent then
		return nil
	end
	local found = parent:FindFirstChild(name, true)
	return if found and found:IsA("Motor6D") then found else nil
end

local function animate(character: Model, rider: Rider, dt: number)
	local root = character:FindFirstChild("HumanoidRootPart")
	local horse = character:FindFirstChild("Horse")
	if not (root and root:IsA("BasePart") and horse) then
		return
	end
	local velocity = root.AssemblyLinearVelocity
	local speed = Vector3.new(velocity.X, 0, velocity.Z).Magnitude
	local gallop = math.clamp(speed / 30, 0, 1)
	rider.phase += dt * (2 + speed * 0.32)
	local ph = rider.phase

	-- patas del caballo
	for name, offset in LEGS do
		local leg = motor(horse, name)
		if leg then
			local swing = math.sin(ph + offset) * 0.75 * gallop
			leg.Transform = CFrame.Angles(swing, 0, 0)
		end
	end

	-- jinete montado: muslos hacia delante y abiertos, rodillas dobladas
	local bounce = math.sin(ph * 2) * 0.08 * gallop
	local hips = { LeftHip = -1, RightHip = 1 }
	for name, side in hips do
		local hip = motor(character, name)
		if hip then
			hip.Transform = CFrame.Angles(0, 0, side * 0.55) * CFrame.Angles(math.rad(55) + bounce, 0, 0)
		end
	end
	for _, name in { "LeftKnee", "RightKnee" } do
		local knee = motor(character, name)
		if knee then
			knee.Transform = CFrame.Angles(math.rad(-75), 0, 0)
		end
	end
end

function HorseAnimator.start()
	RunService.Stepped:Connect(function(_, dt)
		for _, player in Players:GetPlayers() do
			local character = player.Character
			if character and character:GetAttribute("Mounted") then
				local rider = riders[character]
				if not rider then
					rider = { phase = 0 }
					riders[character] = rider
				end
				animate(character, rider, dt)
			end
		end
		for character in riders do
			if not character.Parent or not character:GetAttribute("Mounted") then
				riders[character] = nil
			end
		end
	end)
end

return HorseAnimator
