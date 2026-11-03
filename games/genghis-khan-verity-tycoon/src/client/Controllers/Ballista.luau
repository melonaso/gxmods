--!strict
-- Balista de las torres de la puerta: mientras estas sentado en su banco
--   - la torreta sigue a tu raton (o al centro de la pantalla con mando)
--   - clic / toque / R2 dispara un virote al punto que apuntas
--   - abajo se ve si esta lista o recargando; salta para bajarte
-- Al sentarte se guardan las armas de la mano (para que el clic no las use).
-- El servidor (Systems/Ballista) valida el disparo y decide si da a Verity.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local Net = require(Shared.Net)

local player = Players.LocalPlayer

local BallistaController = {}

local current: Model? = nil
local lastShot = 0
local gui: ScreenGui
local hint: TextLabel
local status: TextLabel
local crosshair: TextLabel

local function seatedBallista(): Model?
	local character = player.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	local seat = humanoid and humanoid.SeatPart
	if seat and seat.Name == "BallistaSeat" and seat.Parent and seat.Parent:IsA("Model") then
		return seat.Parent :: Model
	end
	return nil
end

-- Punto del mundo bajo una posicion de pantalla (viewport = con la franja de arriba).
local function aimAt(ray: Ray): Vector3
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	local ignore: { Instance } = {}
	if player.Character then
		table.insert(ignore, player.Character)
	end
	if current then
		table.insert(ignore, current)
	end
	params.FilterDescendantsInstances = ignore
	local result = workspace:Raycast(ray.Origin, ray.Direction * 1000, params)
	return if result then result.Position else ray.Origin + ray.Direction * 1000
end

local function mouseAim(): Vector3
	local camera = workspace.CurrentCamera
	if UserInputService.GamepadEnabled and not UserInputService.MouseEnabled then
		local size = camera.ViewportSize
		return aimAt(camera:ViewportPointToRay(size.X / 2, size.Y / 2))
	end
	local mouse = UserInputService:GetMouseLocation()
	return aimAt(camera:ViewportPointToRay(mouse.X, mouse.Y))
end

local function turretOf(ballista: Model): (Model?, BasePart?)
	local turret = ballista:FindFirstChild("Turret")
	local hub = turret and turret:FindFirstChild("Hub")
	if turret and turret:IsA("Model") and hub and hub:IsA("BasePart") then
		return turret, hub
	end
	return nil, nil
end

local function point(target: Vector3)
	local ballista = current
	if not ballista then
		return
	end
	local turret, hub = turretOf(ballista)
	if turret and hub and (target - hub.Position).Magnitude > 3 then
		turret:PivotTo(CFrame.lookAt(hub.Position, target))
	end
end

local function fire(target: Vector3)
	if not current then
		return
	end
	local now = workspace:GetServerTimeNow()
	local firedAt = (current:GetAttribute("FiredAt") :: number?) or 0
	if now - firedAt < Config.Tower.Cooldown or now - lastShot < 0.3 then
		return
	end
	lastShot = now
	point(target)
	Net.fireServer("TowerFire", target)
end

local function buildGui()
	gui = Instance.new("ScreenGui")
	gui.Name = "BallistaHUD"
	gui.ResetOnSpawn = false
	gui.Enabled = false
	hint = Instance.new("TextLabel")
	hint.Size = UDim2.new(0.6, 0, 0, 26)
	hint.Position = UDim2.new(0.5, 0, 1, -150)
	hint.AnchorPoint = Vector2.new(0.5, 1)
	hint.BackgroundTransparency = 1
	hint.Font = Enum.Font.GothamBold
	hint.TextScaled = true
	hint.TextColor3 = Color3.fromRGB(240, 225, 190)
	hint.TextStrokeTransparency = 0.3
	hint.Text = "BALISTA: apunta y haz clic (o toca) para disparar  |  Salta para bajarte"
	hint.Parent = gui
	status = Instance.new("TextLabel")
	status.Size = UDim2.new(0.3, 0, 0, 30)
	status.Position = UDim2.new(0.5, 0, 1, -118)
	status.AnchorPoint = Vector2.new(0.5, 1)
	status.BackgroundTransparency = 1
	status.Font = Enum.Font.GothamBlack
	status.TextScaled = true
	status.TextStrokeTransparency = 0.3
	status.Parent = gui
	crosshair = Instance.new("TextLabel")
	crosshair.Size = UDim2.fromOffset(40, 40)
	crosshair.Position = UDim2.fromScale(0.5, 0.5)
	crosshair.AnchorPoint = Vector2.new(0.5, 0.5)
	crosshair.BackgroundTransparency = 1
	crosshair.Font = Enum.Font.GothamBold
	crosshair.TextSize = 36
	crosshair.TextColor3 = Color3.fromRGB(255, 80, 60)
	crosshair.TextStrokeTransparency = 0.2
	crosshair.Text = "+"
	crosshair.Visible = false
	crosshair.Parent = gui
	gui.Parent = player:WaitForChild("PlayerGui")
end

function BallistaController.start()
	buildGui()

	UserInputService.InputBegan:Connect(function(input, processed)
		if processed or not current then
			return
		end
		if input.UserInputType == Enum.UserInputType.MouseButton1 or input.KeyCode == Enum.KeyCode.ButtonR2 then
			fire(mouseAim())
		elseif input.UserInputType == Enum.UserInputType.Touch then
			local camera = workspace.CurrentCamera
			local target = aimAt(camera:ScreenPointToRay(input.Position.X, input.Position.Y))
			fire(target)
		end
	end)

	RunService.RenderStepped:Connect(function()
		local ballista = seatedBallista()
		if ballista ~= current then
			current = ballista
			gui.Enabled = ballista ~= nil
			if ballista then
				local character = player.Character
				local humanoid = character and character:FindFirstChildOfClass("Humanoid")
				if humanoid then
					humanoid:UnequipTools() -- el clic es para la balista
				end
			end
		end
		if not current then
			return
		end
		-- la torreta sigue al raton (solo en tu pantalla; el servidor la gira al disparar)
		if UserInputService.MouseEnabled or UserInputService.GamepadEnabled then
			point(mouseAim())
		end
		crosshair.Visible = UserInputService.GamepadEnabled and not UserInputService.MouseEnabled
		local left = Config.Tower.Cooldown - (workspace:GetServerTimeNow() - ((current:GetAttribute("FiredAt") :: number?) or 0))
		if left > 0 then
			status.Text = string.format("Recargando... %.1f s", left)
			status.TextColor3 = Color3.fromRGB(255, 170, 80)
		else
			status.Text = "LISTA PARA DISPARAR"
			status.TextColor3 = Color3.fromRGB(120, 230, 120)
		end
	end)
end

return BallistaController
