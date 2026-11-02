--!strict
-- Tecla G (o boton Y del mando, o boton en pantalla en movil): canto de garganta.
-- Solo pide al servidor que cante; el cooldown real lo valida el servidor.
local ContextActionService = game:GetService("ContextActionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Net = require(Shared.Net)

local player = Players.LocalPlayer

local ThroatSing = {}

local ACTION = "ThroatSing"
local label: TextLabel

local function remaining(): number
	local readyAt = (player:GetAttribute("SingReadyAt") :: number?) or 0
	return readyAt - workspace:GetServerTimeNow()
end

local function onAction(_name: string, state: Enum.UserInputState, _input: InputObject): Enum.ContextActionResult
	if state == Enum.UserInputState.Begin and remaining() <= 0 then
		Net.fireServer("ThroatSing")
	end
	return Enum.ContextActionResult.Sink
end

function ThroatSing.init()
	local gui = Instance.new("ScreenGui")
	gui.Name = "ThroatSingHUD"
	gui.ResetOnSpawn = false
	label = Instance.new("TextLabel")
	label.Size = UDim2.fromOffset(300, 26)
	label.Position = UDim2.new(1, -16, 1, -16)
	label.AnchorPoint = Vector2.new(1, 1)
	label.BackgroundTransparency = 0.4
	label.BackgroundColor3 = Color3.fromRGB(20, 30, 50)
	label.Font = Enum.Font.GothamBold
	label.TextSize = 16
	label.TextColor3 = Color3.fromRGB(150, 210, 255)
	label.Parent = gui
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 6)
	corner.Parent = label
	gui.Parent = player:WaitForChild("PlayerGui")
end

function ThroatSing.start()
	ContextActionService:BindAction(ACTION, onAction, true, Enum.KeyCode.G, Enum.KeyCode.ButtonY)
	ContextActionService:SetTitle(ACTION, "Canto")
	ContextActionService:SetPosition(ACTION, UDim2.new(1, -150, 1, -150))

	local acc = 0
	RunService.Heartbeat:Connect(function(dt)
		acc += dt
		if acc < 0.2 then
			return
		end
		acc = 0
		local r = remaining()
		label.Text = if r > 0
			then string.format("Canto de garganta (G): %ds", math.ceil(r))
			else "Canto de garganta (G): listo"
	end)
end

return ThroatSing
