--!strict
-- Botón ⚙ (junto al de la música) con el panel de ajustes:
--   Ver hitboxes, Calidad baja, volumen de Música y de Efectos, Modo AFK e
--   Idioma (automático = el de tu cuenta de Roblox, o cualquiera de los que
--   trae el juego; se aplica al momento).
-- Todo menos el modo AFK se guarda con tus datos (remote "Settings" ->
-- PlayerData) y se aplica al volver a entrar. El modo AFK dura la sesión:
-- mientras está activo no entras en las rondas.

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local Workspace = game:GetService("Workspace")

local Locale = require(ReplicatedStorage.Shared.Locale)
local Net = require(ReplicatedStorage.Shared.Net)
local Audio = require(script.Parent.Parent.Lib.Audio)
local UI = require(script.Parent.Parent.Lib.UI)
local Hitboxes = require(script.Parent.Hitboxes)
local Quality = require(script.Parent.Quality)

local player = Players.LocalPlayer
local C = UI.Colors
local T = Locale.t

local Settings = {}

type Values = { music: number, effects: number, lowQuality: boolean, hitboxes: boolean, language: string }

local values: Values = { music = 1, effects = 1, lowQuality = false, hitboxes = false, language = "auto" }
local loaded = false -- ¿ya llegaron los ajustes guardados?
local saveToken = 0
local gui: ScreenGui
local panel: CanvasGroup
local languageList: ScrollingFrame
local panelScale: UIScale
local fitScale = 1
local isOpen = false
local refreshers: { () -> () } = {}

local function apply()
	Audio.setVolume("Music", values.music)
	Audio.setVolume("Effects", values.effects)
	Quality.setLow(values.lowQuality)
	Hitboxes.setEnabled(values.hitboxes)
	for _, fn in refreshers do
		fn()
	end
end

-- Guarda cuando dejas de tocar los ajustes un momento (no en cada píxel del
-- deslizador).
local function changed()
	apply()
	saveToken += 1
	local token = saveToken
	task.delay(0.8, function()
		if token == saveToken then
			Net.get("Settings"):FireServer("Save", values)
		end
	end)
end

local function setOpen(open: boolean)
	if open == isOpen then
		return
	end
	isOpen = open
	if open then
		panel.Visible = true
		panelScale.Scale = fitScale * 0.85
		UI.tween(panel, 0.25, { GroupTransparency = 0 })
		UI.tween(panelScale, 0.4, { Scale = fitScale }, Enum.EasingStyle.Back)
	else
		UI.tween(panelScale, 0.2, { Scale = fitScale * 0.9 })
		UI.tween(panel, 0.2, { GroupTransparency = 1 })
		task.delay(0.21, function()
			if not isOpen then
				panel.Visible = false
			end
		end)
	end
end

local function rowLabel(text: string, y: number, hint: string?)
	UI.label({ Position = UDim2.fromOffset(20, y), Size = UDim2.new(1, -120, 0, 18), TextXAlignment = Enum.TextXAlignment.Left,
		FontFace = UI.FontBold, TextSize = 14, Text = text, Parent = panel })
	if hint then
		UI.label({ Position = UDim2.fromOffset(20, y + 18), Size = UDim2.new(1, -120, 0, 14), TextXAlignment = Enum.TextXAlignment.Left,
			TextSize = 11, TextColor3 = C.Muted, TextTruncate = Enum.TextTruncate.AtEnd, Text = hint, Parent = panel })
	end
end

-- Interruptor redondo a la derecha de la fila.
local function toggle(text: string, hint: string, y: number, get: () -> boolean, set: (boolean) -> ())
	rowLabel(text, y, hint)
	local button: TextButton = UI.new("TextButton", {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -20, 0, y + 4),
		Size = UDim2.fromOffset(50, 26),
		BackgroundColor3 = C.PanelLight,
		Text = "",
		AutoButtonColor = false,
		Parent = panel,
	}, { UI.corner(13) })
	local knob = UI.new("Frame", { Position = UDim2.fromOffset(3, 3), Size = UDim2.fromOffset(20, 20), BackgroundColor3 = Color3.new(1, 1, 1),
		Parent = button }, { UI.corner(10) })
	local function render()
		local on = get()
		UI.tween(button, 0.2, { BackgroundColor3 = if on then C.Survivor else C.PanelLight })
		UI.tween(knob, 0.25, { Position = UDim2.fromOffset(if on then 27 else 3, 3) }, Enum.EasingStyle.Back)
	end
	button.Activated:Connect(function()
		set(not get())
		render()
	end)
	table.insert(refreshers, render)
	render()
end

-- Deslizador 0-100 % (ratón o dedo).
local function slider(text: string, y: number, get: () -> number, set: (number) -> ())
	rowLabel(text, y)
	local valueLabel = UI.label({ AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -20, 0, y), Size = UDim2.fromOffset(50, 18),
		TextXAlignment = Enum.TextXAlignment.Right, FontFace = UI.FontBold, TextSize = 13, TextColor3 = C.Gold, Parent = panel })
	local track = UI.new("Frame", { Position = UDim2.fromOffset(20, y + 26), Size = UDim2.new(1, -40, 0, 8), BackgroundColor3 = C.PanelLight,
		Active = true, Parent = panel }, { UI.corner(4) })
	local fill = UI.new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = C.Gold, BorderSizePixel = 0, Parent = track }, { UI.corner(4) })
	local knob = UI.new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(1, 0.5), Size = UDim2.fromOffset(18, 18),
		BackgroundColor3 = Color3.new(1, 1, 1), Parent = track }, { UI.corner(9) })
	local function render()
		local v = get()
		fill.Size = UDim2.fromScale(v, 1)
		knob.Position = UDim2.fromScale(v, 0.5)
		valueLabel.Text = `{math.floor(v * 100 + 0.5)}%`
	end
	local dragging = false
	local function fromX(x: number)
		local rel = math.clamp((x - track.AbsolutePosition.X) / math.max(1, track.AbsoluteSize.X), 0, 1)
		set(math.floor(rel * 20 + 0.5) / 20) -- pasos de 5 %
		render()
	end
	track.InputBegan:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
			dragging = true
			UI.pulse(knob, 1.3)
			fromX(input.Position.X)
		end
	end)
	UserInputService.InputChanged:Connect(function(input)
		if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
			fromX(input.Position.X)
		end
	end)
	UserInputService.InputEnded:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
			dragging = false
		end
	end)
	table.insert(refreshers, render)
	render()
end

local function languageName(code: string): string
	local entry = Locale.findLanguage(code)
	return if entry then entry.name else T("Automático")
end

-- Fila "Idioma": botón con el idioma actual que abre una lista.
local function languageRow(y: number)
	rowLabel(T("Idioma"), y)
	local button: TextButton = UI.new("TextButton", {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -20, 0, y - 4),
		Size = UDim2.fromOffset(170, 28),
		BackgroundColor3 = C.PanelLight,
		FontFace = UI.FontBold,
		TextSize = 13,
		TextColor3 = C.Text,
		TextTruncate = Enum.TextTruncate.AtEnd,
		Text = `{languageName(values.language)}  ▾`,
		Parent = panel,
	}, { UI.corner(10) })
	languageList = UI.new("ScrollingFrame", {
		Name = "Languages",
		AnchorPoint = Vector2.new(1, 1),
		Position = UDim2.new(1, -20, 0, y - 8),
		Size = UDim2.fromOffset(200, 236),
		BackgroundColor3 = C.Panel,
		BorderSizePixel = 0,
		ScrollBarThickness = 4,
		ScrollBarImageColor3 = C.Muted,
		CanvasSize = UDim2.new(),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
		ZIndex = 10,
		Visible = false,
		Parent = panel,
	}, {
		UI.corner(10),
		UI.stroke(0.6),
		UI.new("UIListLayout", { Padding = UDim.new(0, 2), SortOrder = Enum.SortOrder.LayoutOrder }),
		UI.new("UIPadding", { PaddingTop = UDim.new(0, 4), PaddingBottom = UDim.new(0, 4), PaddingLeft = UDim.new(0, 4), PaddingRight = UDim.new(0, 8) }),
	})
	local options = { "auto" }
	for _, entry in Locale.Languages do
		table.insert(options, entry.code)
	end
	for i, code in options do
		local selected = code == values.language
		local option: TextButton = UI.new("TextButton", {
			LayoutOrder = i,
			Size = UDim2.new(1, 0, 0, 26),
			BackgroundColor3 = if selected then C.Survivor else C.PanelLight,
			BackgroundTransparency = if selected then 0.2 else 0.5,
			FontFace = if selected then UI.FontBold else UI.Font,
			TextSize = 13,
			TextColor3 = C.Text,
			Text = languageName(code),
			ZIndex = 11,
			Parent = languageList,
		}, { UI.corner(6) })
		option.Activated:Connect(function()
			languageList.Visible = false
			if code == values.language then
				return
			end
			values.language = code
			changed()
			-- cambia al momento: la interfaz se vuelve a dibujar en ese idioma
			task.spawn(Locale.setLanguage, if code == "auto" then nil else code)
		end)
	end
	button.Activated:Connect(function()
		languageList.Visible = not languageList.Visible
	end)
end

local function build()
	gui = UI.new("ScreenGui", {
		Name = "Settings",
		ResetOnSpawn = false,
		ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
		DisplayOrder = 6,
		Parent = player:WaitForChild("PlayerGui"),
	})
	-- junto al botón de música del HUD
	local gear: TextButton = UI.new("TextButton", {
		Name = "Open",
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(0, 54, 0.5, 40),
		Size = UDim2.fromOffset(34, 26),
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.3,
		FontFace = UI.FontBold,
		TextSize = 15,
		TextColor3 = C.Text,
		Text = "⚙",
		Parent = gui,
	}, { UI.corner(8) })
	gear.Activated:Connect(function()
		setOpen(not isOpen)
	end)

	panel = UI.new("CanvasGroup", {
		Name = "Panel",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(360, 400),
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.05,
		GroupTransparency = 1,
		Visible = false,
		Parent = gui,
	}, { UI.corner(18), UI.stroke(0.8) })
	panelScale = UI.new("UIScale", { Parent = panel })
	local function fit()
		local camera = Workspace.CurrentCamera
		if camera then
			fitScale = math.min(1, (camera.ViewportSize.X - 24) / 360, (camera.ViewportSize.Y - 40) / 400)
			panelScale.Scale = fitScale
		end
	end
	fit()
	if Workspace.CurrentCamera then
		Workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(fit)
	end

	UI.label({ Position = UDim2.fromOffset(20, 14), Size = UDim2.fromOffset(200, 26), TextXAlignment = Enum.TextXAlignment.Left,
		FontFace = UI.FontHeavy, TextSize = 22, Text = T("AJUSTES"), Parent = panel })
	local close: TextButton = UI.new("TextButton", {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -14, 0, 12),
		Size = UDim2.fromOffset(30, 30),
		BackgroundColor3 = C.PanelLight,
		FontFace = UI.FontBold,
		TextColor3 = C.Muted,
		TextSize = 14,
		Text = "X",
		Parent = panel,
	}, { UI.corner(15) })
	close.Activated:Connect(function()
		setOpen(false)
	end)

	toggle(T("Ver hitboxes"), T("Cajas de los jugadores y alcance de Verity"), 56, function()
		return values.hitboxes
	end, function(v)
		values.hitboxes = v
		changed()
	end)
	toggle(T("Calidad baja"), T("Sin sombras, partículas ni efectos: más FPS"), 104, function()
		return values.lowQuality
	end, function(v)
		values.lowQuality = v
		changed()
	end)
	slider(T("Música"), 152, function()
		return values.music
	end, function(v)
		values.music = v
		changed()
	end)
	slider(T("Efectos"), 204, function()
		return values.effects
	end, function(v)
		values.effects = v
		changed()
	end)
	toggle(T("Modo AFK"), T("No entrarás en las rondas hasta quitarlo"), 262, function()
		return player:GetAttribute("AFK") == true
	end, function(v)
		Net.get("Settings"):FireServer("AFK", v)
		player:SetAttribute("AFK", v) -- se ve al instante; el servidor lo confirma
	end)
	languageRow(316)
	UI.label({ AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -12), Size = UDim2.new(1, -40, 0, 14), TextSize = 11,
		TextColor3 = C.Muted, Text = T("Se guardan automáticamente"), Parent = panel })
	UI.animateButtons(gui)
end

-- Ajustes guardados (llegan cuando el servidor carga tus datos).
local function load()
	local raw = player:GetAttribute("Settings")
	if loaded or typeof(raw) ~= "string" then
		return
	end
	local ok, data = pcall(HttpService.JSONDecode, HttpService, raw)
	if not ok or typeof(data) ~= "table" then
		return
	end
	loaded = true
	values.music = math.clamp(tonumber(data.music) or 1, 0, 1)
	values.effects = math.clamp(tonumber(data.effects) or 1, 0, 1)
	values.lowQuality = data.lowQuality == true
	values.hitboxes = data.hitboxes == true
	values.language = if typeof(data.language) == "string" and Locale.findLanguage(data.language) then data.language else "auto"
	apply()
	if values.language ~= "auto" then
		task.spawn(Locale.setLanguage, values.language)
	end
end

-- Al cambiar de idioma se vuelve a dibujar el panel (abierto si lo estaba).
local function rebuild()
	local wasOpen = isOpen
	gui:Destroy()
	table.clear(refreshers)
	isOpen = false
	build()
	if wasOpen then
		panel.Visible = true
		panel.GroupTransparency = 0
		panelScale.Scale = fitScale
		isOpen = true
	end
end

function Settings.init()
	build()
end

function Settings.start()
	Audio.watch()
	apply()
	load()
	player:GetAttributeChangedSignal("Settings"):Connect(load)
	player:GetAttributeChangedSignal("AFK"):Connect(function()
		for _, fn in refreshers do
			fn()
		end
	end)
	Locale.changed:Connect(rebuild)
end

return Settings
