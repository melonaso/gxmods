--!strict
-- Renacer tras ganar la batalla final (atributo CanRebirth que pone el servidor):
--   - aparece una ventana que pregunta si quieres renacer
--   - si eliges "Ahora no", queda un boton "Renacer" abajo a la izquierda
--     mientras sigas pudiendo hacerlo (hasta salir del juego)
-- Renacer = campamento y oro desde cero, +50 % de oro para siempre.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local Net = require(Shared.Net)

local player = Players.LocalPlayer

local Rebirth = {}

local modal: Frame
local body: TextLabel
local smallButton: TextButton
local dismissed = false

local function nextMultiplier(): number
	local current = 0
	local leaderstats = player:FindFirstChild("leaderstats")
	local value = leaderstats and leaderstats:FindFirstChild("Renacer")
	if value and value:IsA("IntValue") then
		current = value.Value
	end
	return 1 + Config.Rebirth.BonusPerRebirth * (current + 1)
end

local function refresh()
	local can = player:GetAttribute("CanRebirth") == true
	if not can then
		dismissed = false
	end
	body.Text = string.format(
		"Venciste a la forma final de Verity.\n\nSi renaces, tu campamento y tu oro empiezan de cero, pero desde ahora ganas x%.1f de oro para siempre.\n\nTus muertes de Verity y tus renacimientos se conservan.",
		nextMultiplier()
	)
	modal.Visible = can and not dismissed
	smallButton.Visible = can and dismissed
end

local function button(parent: Instance, text: string, color: Color3, position: UDim2): TextButton
	local b = Instance.new("TextButton")
	b.Size = UDim2.fromOffset(180, 44)
	b.Position = position
	b.AnchorPoint = Vector2.new(0.5, 1)
	b.BackgroundColor3 = color
	b.Font = Enum.Font.GothamBlack
	b.TextSize = 18
	b.TextColor3 = Color3.new(1, 1, 1)
	b.Text = text
	b.Parent = parent
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 8)
	corner.Parent = b
	return b
end

function Rebirth.init()
	local gui = Instance.new("ScreenGui")
	gui.Name = "RebirthUI"
	gui.ResetOnSpawn = false
	gui.DisplayOrder = 20

	modal = Instance.new("Frame")
	modal.Size = UDim2.fromOffset(460, 300)
	modal.Position = UDim2.fromScale(0.5, 0.5)
	modal.AnchorPoint = Vector2.new(0.5, 0.5)
	modal.BackgroundColor3 = Color3.fromRGB(30, 22, 14)
	modal.BackgroundTransparency = 0.05
	modal.Visible = false
	modal.Parent = gui
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 12)
	corner.Parent = modal
	local stroke = Instance.new("UIStroke")
	stroke.Color = Color3.fromRGB(235, 190, 80)
	stroke.Thickness = 2
	stroke.Parent = modal

	local title = Instance.new("TextLabel")
	title.Size = UDim2.new(1, 0, 0, 50)
	title.BackgroundTransparency = 1
	title.Font = Enum.Font.Fantasy
	title.TextSize = 34
	title.TextColor3 = Color3.fromRGB(235, 190, 80)
	title.Text = "¿RENACER?"
	title.Parent = modal

	body = Instance.new("TextLabel")
	body.Size = UDim2.new(1, -40, 0, 160)
	body.Position = UDim2.fromOffset(20, 52)
	body.BackgroundTransparency = 1
	body.Font = Enum.Font.Gotham
	body.TextSize = 16
	body.TextWrapped = true
	body.TextColor3 = Color3.fromRGB(240, 230, 210)
	body.TextYAlignment = Enum.TextYAlignment.Top
	body.Parent = modal

	local yes = button(modal, "Renacer", Color3.fromRGB(190, 120, 20), UDim2.new(0.28, 0, 1, -18))
	local no = button(modal, "Ahora no", Color3.fromRGB(70, 60, 50), UDim2.new(0.72, 0, 1, -18))
	yes.Activated:Connect(function()
		modal.Visible = false
		Net.fireServer("Rebirth")
	end)
	no.Activated:Connect(function()
		dismissed = true
		refresh()
	end)

	smallButton = Instance.new("TextButton")
	smallButton.Size = UDim2.fromOffset(150, 30)
	smallButton.Position = UDim2.new(0, 136, 1, -16)
	smallButton.AnchorPoint = Vector2.new(0, 1)
	smallButton.BackgroundColor3 = Color3.fromRGB(190, 120, 20)
	smallButton.Font = Enum.Font.GothamBold
	smallButton.TextSize = 15
	smallButton.TextColor3 = Color3.new(1, 1, 1)
	smallButton.Text = "Renacer..."
	smallButton.Visible = false
	smallButton.Parent = gui
	local smallCorner = Instance.new("UICorner")
	smallCorner.CornerRadius = UDim.new(0, 6)
	smallCorner.Parent = smallButton
	smallButton.Activated:Connect(function()
		dismissed = false
		refresh()
	end)

	gui.Parent = player:WaitForChild("PlayerGui")
end

function Rebirth.start()
	player:GetAttributeChangedSignal("CanRebirth"):Connect(refresh)
	refresh()
end

return Rebirth
