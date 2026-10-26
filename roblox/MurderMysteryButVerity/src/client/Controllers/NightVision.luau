--!strict
-- Verity ve en la oscuridad (solo en su pantalla). No es un filtro de
-- lentes: para ella la noche se ve casi como de día, con los colores
-- normales, mientras los supervivientes siguen viendo sombras azules.
--   - luz ambiente mucho más alta (las zonas sin lámpara dejan de ser negras)
--   - más exposición, menos niebla y menos desenfoque a lo lejos
--   - el filtro cinematográfico oscuro se suaviza
--   - una luz suave sigue a la cámara para que nada quede en negro
-- El servidor cambia la iluminación al empezar y acabar cada ronda: cada
-- ajuste se vuelve a aplicar encima del valor que llegue.

local Lighting = game:GetService("Lighting")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local player = Players.LocalPlayer

local NightVision = {}

type Override = {
	className: string, -- dónde está la propiedad (Lighting o un efecto dentro de Lighting)
	prop: string,
	adjust: (any) -> any, -- valor del servidor -> valor para Verity
	base: any,
	applied: any,
}

local function toward(target: Color3, amount: number): (Color3) -> Color3
	return function(value: Color3): Color3
		return value:Lerp(target, amount)
	end
end

local OVERRIDES: { Override } = {
	{ className = "Lighting", prop = "Ambient", adjust = toward(Color3.fromRGB(140, 142, 150), 0.75), base = nil, applied = nil },
	{ className = "Lighting", prop = "OutdoorAmbient", adjust = toward(Color3.fromRGB(150, 152, 160), 0.7), base = nil, applied = nil },
	{ className = "Lighting", prop = "ExposureCompensation", adjust = function(v: number): number
		return v + 0.45
	end, base = nil, applied = nil },
	{ className = "Atmosphere", prop = "Density", adjust = function(v: number): number
		return v * 0.35
	end, base = nil, applied = nil },
	{ className = "ColorCorrectionEffect", prop = "Contrast", adjust = function(v: number): number
		return v * 0.4
	end, base = nil, applied = nil },
	{ className = "ColorCorrectionEffect", prop = "TintColor", adjust = toward(Color3.new(1, 1, 1), 0.7), base = nil, applied = nil },
	{ className = "DepthOfFieldEffect", prop = "FarIntensity", adjust = function(v: number): number
		return v * 0.25
	end, base = nil, applied = nil },
}

local active = false
local lamp: Part? = nil
local follow: RBXScriptConnection? = nil
local watched: { [Instance]: boolean } = {}

local function target(className: string): Instance?
	if className == "Lighting" then
		return Lighting
	end
	return Lighting:FindFirstChildOfClass(className)
end

-- las propiedades se guardan con menos precisión: se compara con margen para
-- no confundir nuestro propio ajuste con un cambio del servidor
local function differs(a: any, b: any): boolean
	if b == nil then
		return true
	end
	if typeof(a) == "number" then
		return math.abs(a - b) > 1e-3
	end
	if typeof(a) == "Color3" then
		return math.abs(a.R - b.R) + math.abs(a.G - b.G) + math.abs(a.B - b.B) > 3 / 255
	end
	return a ~= b
end

local function apply()
	if not active then
		return
	end
	for _, o in OVERRIDES do
		local inst = target(o.className)
		if inst then
			local current = (inst :: any)[o.prop]
			if differs(current, o.applied) then
				o.base = current
				o.applied = o.adjust(current)
				;(inst :: any)[o.prop] = o.applied
			end
		end
	end
end

local function watch(inst: Instance)
	if watched[inst] then
		return
	end
	watched[inst] = true
	inst.Changed:Connect(function()
		if active then
			apply()
		end
	end)
end

local function enable()
	if active then
		return
	end
	active = true
	for _, o in OVERRIDES do
		o.base, o.applied = nil, nil
	end
	apply()

	-- luz suave que acompaña a la cámara (solo la ve Verity)
	local part = Instance.new("Part")
	part.Name = "NightVisionLamp"
	part.Anchored = true
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = false
	part.Transparency = 1
	part.Size = Vector3.one
	local light = Instance.new("PointLight")
	light.Range = 60
	light.Brightness = 0.7
	light.Color = Color3.fromRGB(235, 238, 245)
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
	if lamp then
		lamp:Destroy()
		lamp = nil
	end
	-- devuelve los valores del servidor (si no los cambió entretanto)
	for _, o in OVERRIDES do
		local inst = target(o.className)
		if inst and o.applied ~= nil and not differs((inst :: any)[o.prop], o.applied) then
			(inst :: any)[o.prop] = o.base
		end
		o.base, o.applied = nil, nil
	end
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
	watch(Lighting)
	for _, child in Lighting:GetChildren() do
		watch(child)
	end
	Lighting.ChildAdded:Connect(function(child)
		watch(child)
		if active then
			apply()
		end
	end)
	refresh()
end

return NightVision
