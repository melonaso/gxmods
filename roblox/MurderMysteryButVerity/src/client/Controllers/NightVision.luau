--!strict
-- Visión nocturna para quien es Verity (solo en su pantalla): una luz que
-- sigue a la cámara e ilumina lo que tiene alrededor, más exposición, menos
-- niebla y un tinte verde. Los supervivientes siguen viendo la noche oscura.
-- El servidor cambia la iluminación al empezar y acabar cada ronda; aquí se
-- vuelve a aplicar el ajuste encima de lo que llegue.

local Lighting = game:GetService("Lighting")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local player = Players.LocalPlayer

local EXPOSURE_BONUS = 0.7
local FOG_FACTOR = 0.45 -- la niebla se reduce a menos de la mitad

local NightVision = {}

local active = false
local grade: ColorCorrectionEffect? = nil
local lamp: Part? = nil
local follow: RBXScriptConnection? = nil
local exposureBase = 0
local exposureApplied: number? = nil
local fogBase = 0
local fogApplied: number? = nil

-- las propiedades se guardan en float32: se comparan con margen para no
-- confundir nuestro propio ajuste con un cambio del servidor
local function differs(value: number, applied: number?): boolean
	return applied == nil or math.abs(value - applied) > 1e-3
end

local function atmosphere(): Atmosphere?
	return Lighting:FindFirstChildOfClass("Atmosphere")
end

local function applyLighting()
	if not active then
		return
	end
	if differs(Lighting.ExposureCompensation, exposureApplied) then
		exposureBase = Lighting.ExposureCompensation
		exposureApplied = exposureBase + EXPOSURE_BONUS
		Lighting.ExposureCompensation = exposureApplied :: number
	end
	local atmo = atmosphere()
	if atmo and differs(atmo.Density, fogApplied) then
		fogBase = atmo.Density
		fogApplied = fogBase * FOG_FACTOR
		atmo.Density = fogApplied :: number
	end
end

local function enable()
	if active then
		return
	end
	active = true
	exposureApplied, fogApplied = nil, nil
	applyLighting()

	local effect = Instance.new("ColorCorrectionEffect")
	effect.Name = "NightVision"
	effect.Brightness = 0.06
	effect.Contrast = 0.15
	effect.Saturation = -0.75
	effect.TintColor = Color3.fromRGB(170, 255, 185)
	effect.Parent = Workspace.CurrentCamera
	grade = effect

	-- luz local que acompaña a la cámara (solo la ve Verity)
	local part = Instance.new("Part")
	part.Name = "NightVisionLamp"
	part.Anchored = true
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = false
	part.Transparency = 1
	part.Size = Vector3.one
	local light = Instance.new("PointLight")
	light.Range = 70
	light.Brightness = 1.4
	light.Color = Color3.fromRGB(200, 255, 210)
	light.Shadows = false
	light.Parent = part
	part.Parent = Workspace.CurrentCamera
	lamp = part
	follow = RunService.RenderStepped:Connect(function()
		local camera = Workspace.CurrentCamera
		if camera and lamp then
			lamp.CFrame = camera.CFrame
		end
	end)
end

local function disable()
	if not active then
		return
	end
	active = false
	if follow then
		follow:Disconnect()
		follow = nil
	end
	if grade then
		grade:Destroy()
		grade = nil
	end
	if lamp then
		lamp:Destroy()
		lamp = nil
	end
	if exposureApplied and not differs(Lighting.ExposureCompensation, exposureApplied) then
		Lighting.ExposureCompensation = exposureBase
	end
	local atmo = atmosphere()
	if atmo and fogApplied and not differs(atmo.Density, fogApplied) then
		atmo.Density = fogBase
	end
	exposureApplied, fogApplied = nil, nil
end

local function refresh()
	local phase = Workspace:GetAttribute("Phase")
	local inRound = phase == "Starting" or phase == "Playing"
	if inRound and player:GetAttribute("Role") == "Verity" then
		enable()
	else
		disable()
	end
end

function NightVision.start()
	player:GetAttributeChangedSignal("Role"):Connect(refresh)
	Workspace:GetAttributeChangedSignal("Phase"):Connect(refresh)
	Lighting:GetPropertyChangedSignal("ExposureCompensation"):Connect(applyLighting)
	Lighting.ChildAdded:Connect(function(child)
		if child:IsA("Atmosphere") then
			child:GetPropertyChangedSignal("Density"):Connect(applyLighting)
		end
	end)
	local atmo = atmosphere()
	if atmo then
		atmo:GetPropertyChangedSignal("Density"):Connect(applyLighting)
	end
	refresh()
end

return NightVision
