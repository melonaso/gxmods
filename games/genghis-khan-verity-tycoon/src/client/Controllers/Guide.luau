--!strict
-- Mientras no tengas campamento (y ya acabo la intro), un haz azul en arco
-- sale de tu personaje hacia el circulo RECLAMAR libre mas cercano.
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local HUD = require(script.Parent.HUD)

local player = Players.LocalPlayer

local Guide = {}

local beam: Beam
local fromAttachment: Attachment
local toAttachment: Attachment

-- El eje X de un Attachment es la direccion del arco del Beam: lo ponemos hacia arriba.
local UP_AXIS = CFrame.fromMatrix(Vector3.zero, Vector3.yAxis, -Vector3.xAxis)

local function nearestFreePad(from: Vector3): BasePart?
	local folder = workspace:FindFirstChild("Tycoons")
	if not folder then
		return nil
	end
	local best: BasePart? = nil
	local bestDist = math.huge
	for _, plot in folder:GetChildren() do
		local pad = plot:FindFirstChild("ClaimPad")
		if pad and pad:IsA("BasePart") then
			local d = (pad.Position - from).Magnitude
			if d < bestDist then
				bestDist = d
				best = pad
			end
		end
	end
	return best
end

function Guide.init()
	fromAttachment = Instance.new("Attachment")
	fromAttachment.Name = "GuideFrom"
	fromAttachment.CFrame = UP_AXIS
	toAttachment = Instance.new("Attachment")
	toAttachment.Name = "GuideTo"
	toAttachment.CFrame = UP_AXIS
	beam = Instance.new("Beam")
	beam.Name = "CampGuide"
	beam.Attachment0 = fromAttachment
	beam.Attachment1 = toAttachment
	beam.Color = ColorSequence.new(Color3.fromRGB(90, 170, 255), Color3.fromRGB(170, 220, 255))
	beam.Transparency = NumberSequence.new(0.15, 0.4)
	beam.LightEmission = 1
	beam.Width0 = 1.2
	beam.Width1 = 1.2
	beam.FaceCamera = true
	beam.Segments = 24
	beam.CurveSize0 = 30 -- sube desde el jugador...
	beam.CurveSize1 = -30 -- ...y baja sobre el circulo
	beam.Enabled = false
end

function Guide.start()
	local acc = 0
	RunService.Heartbeat:Connect(function(dt)
		acc += dt
		if acc < 0.3 then
			return
		end
		acc = 0
		local character = player.Character
		local root = character and character:FindFirstChild("HumanoidRootPart")
		local wanted = HUD.isIntroDone() and not player:GetAttribute("HasPlot")
		local pad = if wanted and root and root:IsA("BasePart") then nearestFreePad(root.Position) else nil
		if pad and root and root:IsA("BasePart") then
			fromAttachment.Parent = root
			toAttachment.Parent = pad
			beam.Parent = root
			beam.Enabled = true
		else
			beam.Enabled = false
		end
	end)
end

return Guide
