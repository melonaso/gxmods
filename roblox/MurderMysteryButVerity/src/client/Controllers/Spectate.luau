--!strict
-- Espectar: quien espera en el lobby (o ya cayó) puede mirar la ronda.
-- Durante la partida aparece el botón "Espectar" abajo al centro; luego
-- ◀ ▶ (o las flechas del teclado) cambian de jugador y "Salir" vuelve al
-- lobby. La cámara sigue a supervivientes, NPCs y Verity. Mientras espectas,
-- la luz y la viñeta son las del mapa (Location.setSpectating).

local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local Workspace = game:GetService("Workspace")

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Locale = require(ReplicatedStorage.Shared.Locale)
local Location = require(script.Parent.Parent.Lib.Location)
local UI = require(script.Parent.Parent.Lib.UI)

local player = Players.LocalPlayer
local C = UI.Colors
local T = Locale.t

local Spectate = {}

type Target = { model: Model, name: string, role: string }

local gui: ScreenGui
local openButton: TextButton
local bar: Frame
local nameLabel: TextLabel
local roleLabel: TextLabel
local spectating = false
local current: Model? = nil

local function alive(model: Instance): boolean
	local humanoid = model:FindFirstChildOfClass("Humanoid")
	return model.Parent ~= nil and humanoid ~= nil and humanoid.Health > 0
end

-- A quién se puede mirar: jugadores en la ronda, NPCs supervivientes y la
-- Verity NPC (la de un jugador ya sale con los jugadores).
local function targets(): { Target }
	local list: { Target } = {}
	for _, other in Players:GetPlayers() do
		local role = other:GetAttribute("Role")
		local character = other.Character
		if other ~= player and (role == "Verity" or role == "Survivor") and character and alive(character) then
			table.insert(list, { model = character, name = other.DisplayName, role = role :: string })
		end
	end
	for _, bot in CollectionService:GetTagged("Bot") do
		if bot:IsA("Model") and alive(bot) then
			local humanoid = bot:FindFirstChildOfClass("Humanoid") :: Humanoid
			table.insert(list, { model = bot, name = if humanoid.DisplayName ~= "" then humanoid.DisplayName else bot.Name, role = "Survivor" })
		end
	end
	for _, verity in CollectionService:GetTagged("VerityCharacter") do
		if verity:IsA("Model") and verity.Parent and not Players:GetPlayerFromCharacter(verity) then
			table.insert(list, { model = verity, name = "Verity", role = "Verity" })
		end
	end
	return list
end

-- Solo quien no juega la ronda (en el lobby o ya eliminado) y con la
-- partida en marcha.
local function canSpectate(): boolean
	local role = player:GetAttribute("Role")
	return Workspace:GetAttribute("Phase") == "Playing" and role ~= "Survivor" and role ~= "Verity"
end

local function focus(target: Target)
	current = target.model
	local camera = Workspace.CurrentCamera
	local humanoid = target.model:FindFirstChildOfClass("Humanoid")
	if camera then
		camera.CameraType = Enum.CameraType.Custom
		camera.CameraSubject = humanoid or target.model:FindFirstChild("HumanoidRootPart") or target.model.PrimaryPart
	end
	nameLabel.Text = target.name
	local isVerity = target.role == "Verity"
	roleLabel.Text = if isVerity then T("Verity") else T("Superviviente")
	roleLabel.TextColor3 = if isVerity then C.Verity else C.Survivor
	UI.pulse(bar, 1.06)
end

local function stop()
	if not spectating then
		return
	end
	spectating = false
	current = nil
	Location.setSpectating(false)
	local camera = Workspace.CurrentCamera
	local character = player.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if camera and humanoid then
		camera.CameraSubject = humanoid
	end
end

-- Pasa al siguiente (dir = 1) o al anterior (dir = -1).
local function cycle(dir: number)
	local list = targets()
	if #list == 0 then
		stop()
		return
	end
	local index = 0
	for i, target in list do
		if target.model == current then
			index = i
			break
		end
	end
	if index == 0 then
		index = if dir > 0 then 1 else #list
	else
		index = (index - 1 + dir) % #list + 1
	end
	focus(list[index])
end

local function begin()
	if spectating or not canSpectate() then
		return
	end
	spectating = true
	Location.setSpectating(true)
	cycle(1)
end

local function arrow(text: string, x: number, dir: number): TextButton
	local button: TextButton = UI.new("TextButton", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.new(0.5, x, 0.5, 0),
		Size = UDim2.fromOffset(36, 36),
		BackgroundColor3 = C.PanelLight,
		FontFace = UI.FontHeavy,
		TextSize = 18,
		TextColor3 = C.Text,
		Text = text,
		Parent = bar,
	}, { UI.corner(18) })
	button.Activated:Connect(function()
		cycle(dir)
	end)
	return button
end

local function build()
	gui = UI.new("ScreenGui", {
		Name = "Spectate",
		ResetOnSpawn = false,
		DisplayOrder = 4,
		Parent = player:WaitForChild("PlayerGui"),
	})
	openButton = UI.new("TextButton", {
		Name = "Open",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -18),
		Size = UDim2.fromOffset(0, 40),
		AutomaticSize = Enum.AutomaticSize.X,
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.2,
		FontFace = UI.FontBold,
		TextSize = 15,
		TextColor3 = C.Text,
		Text = "👁  " .. T("Espectar"),
		Visible = false,
		Parent = gui,
	}, { UI.corner(12), UI.stroke(0.6, C.Survivor), UI.new("UIPadding", { PaddingLeft = UDim.new(0, 16), PaddingRight = UDim.new(0, 16) }) })
	openButton.Activated:Connect(begin)

	bar = UI.new("Frame", {
		Name = "Bar",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -18),
		Size = UDim2.fromOffset(360, 56),
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.15,
		Visible = false,
		Parent = gui,
	}, { UI.corner(14), UI.stroke() })
	UI.label({ Position = UDim2.fromOffset(0, 6), Size = UDim2.new(1, 0, 0, 12), TextSize = 10, FontFace = UI.FontBold, TextColor3 = C.Muted,
		Text = T("ESPECTANDO"), Parent = bar })
	nameLabel = UI.label({ Position = UDim2.new(0, 70, 0, 18), Size = UDim2.new(1, -140, 0, 20), TextSize = 16, FontFace = UI.FontHeavy,
		TextTruncate = Enum.TextTruncate.AtEnd, Parent = bar })
	roleLabel = UI.label({ Position = UDim2.new(0, 70, 0, 37), Size = UDim2.new(1, -140, 0, 14), TextSize = 11, FontFace = UI.FontBold, Parent = bar })
	arrow("◀", -150, -1)
	arrow("▶", 104, 1)
	local exit: TextButton = UI.new("TextButton", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.new(0.5, 150, 0.5, 0),
		Size = UDim2.fromOffset(44, 36),
		BackgroundColor3 = C.Verity,
		FontFace = UI.FontBold,
		TextSize = 12,
		TextColor3 = Color3.new(1, 1, 1),
		Text = T("Salir"),
		Parent = bar,
	}, { UI.corner(10) })
	exit.Activated:Connect(stop)
	UI.animateButtons(gui)
end

function Spectate.init()
	build()
end

function Spectate.start()
	local accumulator = 0
	RunService.Heartbeat:Connect(function(dt)
		accumulator += dt
		if accumulator < 0.25 then
			return
		end
		accumulator = 0
		if spectating then
			if not canSpectate() then
				stop()
			elseif not (current and alive(current)) then
				cycle(1) -- el que mirabas cayó o se fue
			end
		end
		UI.show(openButton, not spectating and canSpectate())
		UI.show(bar, spectating)
	end)
	UserInputService.InputBegan:Connect(function(input, processed)
		if processed or not spectating then
			return
		end
		if input.KeyCode == Enum.KeyCode.Left then
			cycle(-1)
		elseif input.KeyCode == Enum.KeyCode.Right then
			cycle(1)
		end
	end)
	-- al reaparecer o entrar en la ronda, la cámara vuelve a tu personaje
	player.CharacterAdded:Connect(function()
		stop()
	end)
	-- otro idioma: se vuelve a construir (y se sigue mirando al mismo)
	Locale.changed:Connect(function()
		local watching = current
		gui:Destroy()
		build()
		if spectating then
			for _, target in targets() do
				if target.model == watching then
					focus(target)
				end
			end
		end
	end)
end

return Spectate
