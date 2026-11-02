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

local correction: ColorCorrectionEffect
local active = false

local function apply(isActive: boolean)
	if isActive == active then
		return
	end
	active = isActive
	local info = TweenInfo.new(if isActive then 3 else 6)
	TweenService:Create(Lighting, info, if isActive then NIGHT else DAY):Play()
	TweenService:Create(correction, info, {
		TintColor = if isActive then Color3.fromRGB(255, 200, 200) else Color3.new(1, 1, 1),
		Saturation = if isActive then -0.35 else 0,
		Contrast = if isActive then 0.15 else 0,
	}):Play()
end

function VerityFX.init()
	correction = Instance.new("ColorCorrectionEffect")
	correction.Name = "VerityCorrection"
	correction.Parent = Lighting
end

function VerityFX.start()
	workspace:GetAttributeChangedSignal("VerityPhase"):Connect(function()
		apply(workspace:GetAttribute("VerityPhase") == "Active")
	end)
	apply(workspace:GetAttribute("VerityPhase") == "Active")

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
		if dist < 35 then
			local k = (1 - dist / 35) * 0.012
			camera.CFrame *= CFrame.Angles((math.random() - 0.5) * k, (math.random() - 0.5) * k, 0)
		end
	end)
end

return VerityFX
