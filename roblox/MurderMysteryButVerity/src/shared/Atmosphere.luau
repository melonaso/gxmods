--!strict
-- Ambientes de iluminación. El servidor pone el de la ronda para todos
-- (MapService.setAtmosphere) y el cliente vuelve a poner el del lobby solo en
-- su pantalla mientras su personaje está en el lobby (LobbyAtmosphere).
--
-- Tres ambientes cinematográficos: lobby (atardecer cálido), interiores de
-- noche (oscuro, frío, contraste alto) y exteriores de noche (luna y niebla).
-- Con Lighting.Technology = Future (en default.project.json) las luces de
-- cada habitación proyectan sombras reales.

local Lighting = game:GetService("Lighting")

export type Preset = {
	lighting: { [string]: any },
	atmosphere: { [string]: any },
	color: { [string]: any },
	bloom: { [string]: any },
	dof: { [string]: any },
	rays: number,
}

local Atmosphere = {}

Atmosphere.Presets = {
	Lobby = {
		lighting = { ClockTime = 18.6, Brightness = 1.6, ExposureCompensation = 0, Ambient = Color3.fromRGB(70, 58, 66), OutdoorAmbient = Color3.fromRGB(110, 90, 110),
			ColorShift_Top = Color3.new(0, 0, 0), ColorShift_Bottom = Color3.new(0, 0, 0) },
		atmosphere = { Density = 0.28, Offset = 0.1, Color = Color3.fromRGB(199, 160, 180), Decay = Color3.fromRGB(110, 80, 110), Glare = 0.4, Haze = 1.2 },
		color = { Brightness = 0, Contrast = 0.1, Saturation = 0.05, TintColor = Color3.fromRGB(255, 240, 228) },
		bloom = { Intensity = 0.6, Size = 24, Threshold = 1.4 },
		dof = { FarIntensity = 0.12, FocusDistance = 45, InFocusRadius = 50, NearIntensity = 0 },
		rays = 0.06,
	},
	-- Noche de invierno cinematográfica: sombras azul marino (se distinguen
	-- las formas, no los detalles), niebla oscura que se traga lo lejano y
	-- lámparas cálidas que dejan "charcos" de luz anaranjada con mucho
	-- contraste. Los bordes de la pantalla se oscurecen (Cinematics).
	Indoor = {
		lighting = { ClockTime = 0, Brightness = 0.4, ExposureCompensation = 0.1, Ambient = Color3.fromRGB(40, 50, 88), OutdoorAmbient = Color3.fromRGB(34, 44, 78),
			ColorShift_Top = Color3.fromRGB(40, 60, 110), ColorShift_Bottom = Color3.fromRGB(10, 14, 30) },
		atmosphere = { Density = 0.36, Offset = 0, Color = Color3.fromRGB(38, 48, 84), Decay = Color3.fromRGB(12, 16, 34), Glare = 0, Haze = 1.5 },
		color = { Brightness = -0.03, Contrast = 0.28, Saturation = -0.05, TintColor = Color3.fromRGB(190, 205, 255) },
		bloom = { Intensity = 1, Size = 32, Threshold = 1 },
		dof = { FarIntensity = 0.2, FocusDistance = 34, InFocusRadius = 46, NearIntensity = 0 },
		rays = 0,
	},
	Outdoor = {
		lighting = { ClockTime = 0.3, Brightness = 0.8, ExposureCompensation = 0.1, Ambient = Color3.fromRGB(36, 46, 84), OutdoorAmbient = Color3.fromRGB(52, 66, 114),
			ColorShift_Top = Color3.fromRGB(60, 90, 160), ColorShift_Bottom = Color3.fromRGB(14, 18, 40) },
		atmosphere = { Density = 0.38, Offset = 0.05, Color = Color3.fromRGB(44, 58, 100), Decay = Color3.fromRGB(14, 18, 40), Glare = 0.1, Haze = 1.8 },
		color = { Brightness = -0.03, Contrast = 0.28, Saturation = -0.05, TintColor = Color3.fromRGB(185, 200, 255) },
		bloom = { Intensity = 1, Size = 32, Threshold = 1 },
		dof = { FarIntensity = 0.2, FocusDistance = 40, InFocusRadius = 56, NearIntensity = 0 },
		rays = 0,
	},
} :: { [string]: Preset }

-- Las propiedades se guardan con menos precisión: se compara con margen para
-- no reescribir (y volver a disparar Changed) lo que ya tiene el valor.
function Atmosphere.differs(a: any, b: any): boolean
	if b == nil then
		return true
	end
	if typeof(a) == "number" and typeof(b) == "number" then
		return math.abs(a - b) > 1e-3
	end
	if typeof(a) == "Color3" and typeof(b) == "Color3" then
		return math.abs(a.R - b.R) + math.abs(a.G - b.G) + math.abs(a.B - b.B) > 3 / 255
	end
	return a ~= b
end

-- Efecto de Lighting por nombre. Solo el servidor los crea; el cliente usa
-- los que le llegan (y se salta los que aún no han llegado).
local function effect(className: string, name: string, create: boolean): Instance?
	local existing = Lighting:FindFirstChild(name)
	if existing or not create then
		return existing
	end
	local inst = Instance.new(className)
	inst.Name = name
	inst.Parent = Lighting
	return inst
end

local function set(target: Instance?, props: { [string]: any })
	if not target then
		return
	end
	for k, v in props do
		if Atmosphere.differs((target :: any)[k], v) then
			(target :: any)[k] = v
		end
	end
end

-- Aplica un ambiente. `create`: crear los efectos que falten (servidor).
function Atmosphere.apply(name: string, create: boolean)
	local preset = Atmosphere.Presets[name] or Atmosphere.Presets.Lobby
	set(Lighting, preset.lighting)
	set(effect("Atmosphere", "CinematicAtmosphere", create), preset.atmosphere)
	set(effect("ColorCorrectionEffect", "CinematicGrade", create), preset.color)
	set(effect("BloomEffect", "CinematicBloom", create), preset.bloom)
	set(effect("DepthOfFieldEffect", "CinematicDepth", create), preset.dof)
	set(effect("SunRaysEffect", "CinematicRays", create), { Intensity = preset.rays, Spread = 0.6 })
	if create then
		local sky = effect("Sky", "NightSky", true) :: Sky
		sky.StarCount = 3000
		sky.MoonAngularSize = 14
		sky.CelestialBodiesShown = true
	end
end

return Atmosphere
