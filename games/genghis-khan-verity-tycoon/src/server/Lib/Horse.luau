--!strict
-- Caballo mongol para la batalla final. Es decorativo y va soldado al
-- jinete: el jugador se mueve como siempre (WASD), pero mas rapido y mas
-- alto (HipHeight). Las patas tienen Motor6D para que Controllers/HorseAnimator
-- las haga galopar y ponga al jinete con las piernas abiertas (montado).
-- Espacio del jinete: -Z = hacia delante, +Y = arriba. Solo avatares R15.
local Build = require(script.Parent.Build)

local Horse = {}

local BROWN = Color3.fromRGB(115, 72, 40)
local DARK = Color3.fromRGB(35, 25, 18)
local RED = Color3.fromRGB(160, 30, 30)
local BODY_Y = -2.3 -- centro del cuerpo respecto a HumanoidRootPart
local LEG_LEN = 3.1
-- la pezuna toca el suelo: raiz a (|BODY_Y| + 1.2 + LEG_LEN) studs del suelo
local ROOT_HEIGHT = -BODY_Y + 1.2 + LEG_LEN

local LEGS = {
	{ name = "LegFL", x = -0.75, z = -2.5 },
	{ name = "LegFR", x = 0.75, z = -2.5 },
	{ name = "LegBL", x = -0.75, z = 2.6 },
	{ name = "LegBR", x = 0.75, z = 2.6 },
}

function Horse.isMounted(character: Model): boolean
	return character:FindFirstChild("Horse") ~= nil
end

function Horse.mount(character: Model, speed: number)
	local root = character:FindFirstChild("HumanoidRootPart")
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if not (root and root:IsA("BasePart") and humanoid) or Horse.isMounted(character) then
		return
	end
	local horse = Instance.new("Model")
	horse.Name = "Horse"
	local base = root.CFrame

	local function part(name: string, size: Vector3, offset: CFrame, color: Color3, material: Enum.Material?): Part
		local p = Build.part({ Name = name, Size = size, CFrame = base * offset, Color = color, Material = material or Enum.Material.SmoothPlastic, Anchored = false, CanCollide = false })
		p.Massless = true
		p.CanQuery = false
		p.CanTouch = false
		p.Parent = horse
		return p
	end
	local function weldTo(p0: BasePart, p1: BasePart)
		local w = Instance.new("WeldConstraint")
		w.Part0 = p0
		w.Part1 = p1
		w.Parent = p1
	end

	local body = part("Body", Vector3.new(2.4, 2.4, 6.4), CFrame.new(0, BODY_Y, 0.3), BROWN)
	local mount = Instance.new("Weld")
	mount.Name = "MountWeld"
	mount.Part0 = root
	mount.Part1 = body
	mount.C0 = CFrame.new(0, BODY_Y, 0.3)
	mount.Parent = body

	-- cuello, cabeza, orejas, crin, cola, montura
	weldTo(body, part("Neck", Vector3.new(1.2, 3.2, 1.5), CFrame.new(0, BODY_Y + 1.4, -3.2) * CFrame.Angles(math.rad(-35), 0, 0), BROWN))
	weldTo(body, part("Mane", Vector3.new(0.35, 3, 0.7), CFrame.new(0, BODY_Y + 1.7, -2.8) * CFrame.Angles(math.rad(-35), 0, 0), DARK))
	weldTo(body, part("Head", Vector3.new(1.1, 1.2, 2.6), CFrame.new(0, BODY_Y + 2.6, -4.6) * CFrame.Angles(math.rad(-25), 0, 0), BROWN))
	weldTo(body, part("Muzzle", Vector3.new(1, 1, 0.6), CFrame.new(0, BODY_Y + 2.05, -5.85) * CFrame.Angles(math.rad(-25), 0, 0), DARK))
	weldTo(body, part("EarL", Vector3.new(0.25, 0.6, 0.25), CFrame.new(-0.35, BODY_Y + 3.4, -4.0), BROWN))
	weldTo(body, part("EarR", Vector3.new(0.25, 0.6, 0.25), CFrame.new(0.35, BODY_Y + 3.4, -4.0), BROWN))
	weldTo(body, part("Tail", Vector3.new(0.45, 2.8, 0.45), CFrame.new(0, BODY_Y - 0.4, 3.9) * CFrame.Angles(math.rad(30), 0, 0), DARK))
	weldTo(body, part("Saddle", Vector3.new(2.6, 0.45, 2.4), CFrame.new(0, BODY_Y + 1.3, 0.1), RED, Enum.Material.Fabric))
	weldTo(body, part("Blanket", Vector3.new(2.65, 1.2, 2.2), CFrame.new(0, BODY_Y + 0.6, 0.1), Color3.fromRGB(30, 70, 140), Enum.Material.Fabric))

	-- patas articuladas (Motor6D en la cadera del caballo)
	for _, leg in LEGS do
		local hip = CFrame.new(leg.x, -1.2, leg.z) -- borde de abajo del cuerpo
		local legPart = part(leg.name, Vector3.new(0.6, LEG_LEN, 0.6), CFrame.new(0, BODY_Y, 0.3) * hip * CFrame.new(0, -LEG_LEN / 2, 0), BROWN)
		local motor = Instance.new("Motor6D")
		motor.Name = leg.name
		motor.Part0 = body
		motor.Part1 = legPart
		motor.C0 = hip
		motor.C1 = CFrame.new(0, LEG_LEN / 2, 0)
		motor.Parent = legPart
		weldTo(legPart, part("Hoof", Vector3.new(0.7, 0.4, 0.7), CFrame.new(0, BODY_Y, 0.3) * hip * CFrame.new(0, -LEG_LEN + 0.1, 0), DARK))
	end

	horse.Parent = character
	character:SetAttribute("BaseHipHeight", humanoid.HipHeight)
	character:SetAttribute("BaseWalkSpeed", humanoid.WalkSpeed)
	humanoid.HipHeight = ROOT_HEIGHT - root.Size.Y / 2
	humanoid.WalkSpeed = speed
	character:SetAttribute("Mounted", true)
end

function Horse.dismount(character: Model)
	local horse = character:FindFirstChild("Horse")
	if horse then
		horse:Destroy()
	end
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if humanoid then
		humanoid.HipHeight = (character:GetAttribute("BaseHipHeight") :: number?) or humanoid.HipHeight
		humanoid.WalkSpeed = (character:GetAttribute("BaseWalkSpeed") :: number?) or 16
	end
	character:SetAttribute("Mounted", nil)
end

return Horse
