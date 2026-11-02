--!strict
-- Ambiente de terror mientras Verity esta activo: noche, niebla, tinte rojo
-- y temblor de camara cuando esta cerca.
local Lighting = game:GetService("Lighting")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local VerityFX = {}

local DAY = { ClockTime = 15, FogEnd = 1500, FogColor = Color3.fromRGB(200, 210, 220), Brightness = 2 }
local NIGHT = { ClockTime = 0.5, FogEnd = 160, FogColor = Color3.fromRGB(15, 5, 5), Brightness = 1 }
local FINAL = { ClockTime = 0.2, FogEnd = 320, FogColor = Color3.fromRGB(60, 10, 0), Brightness = 1.5 }

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
	local info = TweenInfo.new(if active then 3 else 6)
	TweenService:Create(Lighting, info, if look == "Final" then FINAL elseif look == "Night" then NIGHT else DAY):Play()
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
