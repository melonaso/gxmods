--!strict
-- Ambiente de terror mientras Verity esta activo: noche, niebla, tinte rojo
-- y temblor de camara cuando esta cerca.
local Lighting = game:GetService("Lighting")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local VerityFX = {}

-- Con Atmosphere en Lighting, la niebla clasica (FogEnd) no hace nada: la
-- noche se hace oscureciendo la atmosfera y las nubes. El dia se lee del
-- servidor la primera vez (World.buildLighting).
local NIGHT = { ClockTime = 0.5, Brightness = 1 }
local FINAL = { ClockTime = 0.2, Brightness = 1.5 }
local NIGHT_ATMOS = { Density = 0.55, Color = Color3.fromRGB(30, 12, 12), Decay = Color3.fromRGB(10, 0, 0), Haze = 2.5, Glare = 0 }
local FINAL_ATMOS = { Density = 0.5, Color = Color3.fromRGB(110, 35, 10), Decay = Color3.fromRGB(70, 10, 0), Haze = 2.2, Glare = 0.2 }
local NIGHT_CLOUDS = { Cover = 0.85, Color = Color3.fromRGB(40, 32, 32) }
local FINAL_CLOUDS = { Cover = 0.8, Color = Color3.fromRGB(120, 40, 20) }

local day: { [string]: any }? = nil
local dayAtmos: { [string]: any }? = nil
local dayClouds: { [string]: any }? = nil

local function atmosphere(): Atmosphere?
	return Lighting:FindFirstChildOfClass("Atmosphere")
end

local function clouds(): Clouds?
	return workspace.Terrain:FindFirstChildOfClass("Clouds")
end

local function captureDay()
	if day then
		return
	end
	day = { ClockTime = Lighting.ClockTime, Brightness = Lighting.Brightness }
	local a = atmosphere()
	if a then
		dayAtmos = { Density = a.Density, Color = a.Color, Decay = a.Decay, Haze = a.Haze, Glare = a.Glare }
	end
	local c = clouds()
	if c then
		dayClouds = { Cover = c.Cover, Color = c.Color }
	end
end

local correction: ColorCorrectionEffect
local active = false
local current = "Day"

-- "Day", "Night" (Verity aqui o huyendo) o "Final" (batalla final, cielo rojo)
local function apply(look: string)
	if look == current then
		return
	end
	current = look
	active = look ~= "Day"
	captureDay()
	local info = TweenInfo.new(if active then 3 else 6)
	TweenService:Create(Lighting, info, if look == "Final" then FINAL elseif look == "Night" then NIGHT else day :: any):Play()
	local a = atmosphere()
	local atmosGoal = if look == "Final" then FINAL_ATMOS elseif look == "Night" then NIGHT_ATMOS else dayAtmos
	if a and atmosGoal then
		TweenService:Create(a, info, atmosGoal):Play()
	end
	local c = clouds()
	local cloudGoal = if look == "Final" then FINAL_CLOUDS elseif look == "Night" then NIGHT_CLOUDS else dayClouds
	if c and cloudGoal then
		TweenService:Create(c, info, cloudGoal):Play()
	end
	TweenService:Create(correction, info, {
		TintColor = if look == "Final" then Color3.fromRGB(255, 170, 140) elseif look == "Night" then Color3.fromRGB(255, 200, 200) else Color3.new(1, 1, 1),
		Saturation = if active then -0.35 else 0,
		Contrast = if active then 0.15 else 0,
	}):Play()
end

local function lookFor(phase: any): string
	if phase == "Final" then
		return "Final"
	elseif phase == "Active" or phase == "Fleeing" then
		return "Night"
	end
	return "Day"
end

function VerityFX.init()
	correction = Instance.new("ColorCorrectionEffect")
	correction.Name = "VerityCorrection"
	correction.Parent = Lighting
end

function VerityFX.start()
	-- espera a que el servidor ponga la luz del dia antes de guardarla
	Lighting:WaitForChild("SteppeAtmosphere", 10)
	workspace.Terrain:WaitForChild("SteppeClouds", 10)
	workspace:GetAttributeChangedSignal("VerityPhase"):Connect(function()
		apply(lookFor(workspace:GetAttribute("VerityPhase")))
	end)
	apply(lookFor(workspace:GetAttribute("VerityPhase")))

	local camera = workspace.CurrentCamera
	RunService.RenderStepped:Connect(function()
		if not active then
			return
		end
		local verity = workspace:FindFirstChild("Verity")
		local character = Players.LocalPlayer.Character
		local root = character and character:FindFirstChild("HumanoidRootPart")
		local vroot = verity and verity:IsA("Model") and verity.PrimaryPart
		if not (root and root:IsA("BasePart") and vroot) then
			return
		end
		local dist = (vroot.Position - root.Position).Magnitude
		local reach = if current == "Final" then 70 else 35
		if dist < reach then
			local k = (1 - dist / reach) * 0.012
			camera.CFrame *= CFrame.Angles((math.random() - 0.5) * k, (math.random() - 0.5) * k, 0)
		end
	end)
end

return VerityFX
