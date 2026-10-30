--!strict
-- "Calidad baja" (Ajustes), solo en tu pantalla: sin sombras, sin efectos
-- de postproceso caros (bloom, desenfoque, rayos), sin partículas ni rastros
-- y lámparas sin sombras. Todo se guarda y se restaura al desactivarlo; lo
-- que aparezca mientras está activo (sangre, destellos...) también se baja.

local Lighting = game:GetService("Lighting")
local Workspace = game:GetService("Workspace")

local Quality = {}

local low = false
local saved: { [Instance]: { [string]: any } } = setmetatable({}, { __mode = "k" }) :: any

local function set(inst: Instance, prop: string, value: any)
	local props = saved[inst]
	if not props then
		props = {}
		saved[inst] = props
	end
	if props[prop] == nil then
		props[prop] = (inst :: any)[prop]
	end
	(inst :: any)[prop] = value
end

local function lower(inst: Instance)
	if inst:IsA("ParticleEmitter") or inst:IsA("Trail") or inst:IsA("Beam") or inst:IsA("Smoke") or inst:IsA("Fire") or inst:IsA("Sparkles") then
		set(inst, "Enabled", false)
	elseif inst:IsA("PointLight") or inst:IsA("SpotLight") or inst:IsA("SurfaceLight") then
		if inst.Shadows then
			set(inst, "Shadows", false)
		end
	elseif inst:IsA("BloomEffect") or inst:IsA("DepthOfFieldEffect") or inst:IsA("SunRaysEffect") or inst:IsA("BlurEffect") then
		set(inst, "Enabled", false)
	end
end

function Quality.setLow(value: boolean)
	if value == low then
		return
	end
	low = value
	if low then
		set(Lighting, "GlobalShadows", false)
		for _, root in { Workspace, Lighting } :: { Instance } do
			for _, inst in root:GetDescendants() do
				lower(inst)
			end
		end
	else
		for inst, props in saved do
			if inst.Parent or inst == Lighting then
				for prop, value in props do
					(inst :: any)[prop] = value
				end
			end
		end
		table.clear(saved)
	end
end

function Quality.isLow(): boolean
	return low
end

function Quality.start()
	for _, root in { Workspace, Lighting } :: { Instance } do
		root.DescendantAdded:Connect(function(inst)
			if low then
				task.defer(lower, inst) -- después de que su script termine de configurarlo
			end
		end)
	end
end

return Quality
