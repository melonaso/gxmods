--!strict
-- HUD discreto: píldora superior con fase y reloj, chip de oro, avisos
-- pequeños, tarjeta de rol y banner de resultados.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Net = require(ReplicatedStorage.Shared.Net)
local UI = require(script.Parent.Parent.Lib.UI)
local Music = require(script.Parent.Music)

local player = Players.LocalPlayer
local C = UI.Colors

local HUD = {}

local PHASE_TEXT = {
	Waiting = "ESPERANDO JUGADORES",
	Intermission = "INTERMEDIO",
	Starting = "PREPARANDO",
	Playing = "SOBREVIVE",
	Results = "RESULTADOS",
}

local gui: ScreenGui
local phaseLabel: TextLabel
local timerLabel: TextLabel
local infoPill: Frame
local infoLabel: TextLabel
local goldChip: Frame
local goldLabel: TextLabel
local controls: Frame
local controlsLabel: TextLabel
local coinChip: Frame
local coinLabel: TextLabel
local staminaBar: Frame
local staminaFill: Frame
local toastList: Frame
local roleCard: CanvasGroup
local resultCard: CanvasGroup

local function formatTime(seconds: number): string
	seconds = math.max(0, math.ceil(seconds))
	return string.format("%d:%02d", seconds // 60, seconds % 60)
end

local function build()
	gui = UI.new("ScreenGui", {
		Name = "HUD",
		ResetOnSpawn = false,
		ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
		Parent = player:WaitForChild("PlayerGui"),
	})

	-- Píldora superior
	local pill = UI.new("Frame", {
		Name = "TopPill",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 8),
		Size = UDim2.fromOffset(190, 50),
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.25,
		Parent = gui,
	}, { UI.corner(14), UI.stroke() })
	phaseLabel = UI.label({
		Size = UDim2.new(1, 0, 0, 14),
		Position = UDim2.fromOffset(0, 6),
		TextSize = 11,
		FontFace = UI.FontBold,
		TextColor3 = C.Muted,
		Text = "",
		Parent = pill,
	})
	timerLabel = UI.label({
		Size = UDim2.new(1, 0, 0, 26),
		Position = UDim2.fromOffset(0, 19),
		TextSize = 24,
		FontFace = UI.FontHeavy,
		Text = "",
		Parent = pill,
	})

	infoPill = UI.new("Frame", {
		Name = "Info",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 62),
		Size = UDim2.fromOffset(0, 24),
		AutomaticSize = Enum.AutomaticSize.X,
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.4,
		Parent = gui,
	}, { UI.corner(12), UI.new("UIPadding", { PaddingLeft = UDim.new(0, 12), PaddingRight = UDim.new(0, 12) }) })
	infoLabel = UI.label({
		Size = UDim2.fromScale(0, 1),
		AutomaticSize = Enum.AutomaticSize.X,
		TextSize = 13,
		RichText = true,
		TextColor3 = C.Muted,
		Parent = infoPill,
	})

	-- Chip de oro (solo supervivientes en partida)
	goldChip = UI.new("Frame", {
		Name = "Gold",
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.new(0, 16, 1, -16),
		Size = UDim2.fromOffset(118, 42),
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.25,
		Visible = false,
		Parent = gui,
	}, { UI.corner(12), UI.stroke() })
	UI.new("Frame", {
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(0, 12, 0.5, 0),
		Size = UDim2.fromOffset(18, 18),
		Rotation = 45,
		BackgroundColor3 = C.Gold,
		Parent = goldChip,
	}, {
		UI.corner(4),
		UI.new("UIGradient", {
			Color = ColorSequence.new(Color3.fromRGB(255, 240, 170), Color3.fromRGB(220, 150, 20)),
			Rotation = 90,
		}),
	})
	goldLabel = UI.label({
		Position = UDim2.fromOffset(42, 0),
		Size = UDim2.new(1, -50, 1, 0),
		TextXAlignment = Enum.TextXAlignment.Left,
		FontFace = UI.FontBold,
		TextSize = 16,
		Parent = goldChip,
	})

	-- Monedas de la ronda (abajo a la izquierda, encima del oro)
	coinChip = UI.new("Frame", {
		Name = "RoundCoins",
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.new(0, 16, 1, -66),
		Size = UDim2.fromOffset(118, 34),
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.3,
		Visible = false,
		Parent = gui,
	}, { UI.corner(12) })
	UI.new("Frame", {
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(0, 12, 0.5, 0),
		Size = UDim2.fromOffset(16, 16),
		BackgroundColor3 = Color3.fromRGB(255, 196, 40),
		Parent = coinChip,
	}, { UI.corner(8), UI.stroke(0.4, Color3.fromRGB(150, 100, 10)) })
	coinLabel = UI.label({
		Position = UDim2.fromOffset(36, 0),
		Size = UDim2.new(1, -44, 1, 0),
		TextXAlignment = Enum.TextXAlignment.Left,
		FontFace = UI.FontBold,
		TextSize = 14,
		Parent = coinChip,
	})

	-- Botón de música (debajo del de la tienda)
	local musicButton: TextButton = UI.new("TextButton", {
		Name = "Music",
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(0, 14, 0.5, 40),
		Size = UDim2.fromOffset(34, 26),
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.3,
		FontFace = UI.FontBold,
		TextSize = 14,
		TextColor3 = C.Text,
		Text = "♪",
		Parent = gui,
	}, { UI.corner(8) })
	musicButton.Activated:Connect(function()
		Music.setEnabled(not Music.isEnabled())
		musicButton.TextColor3 = if Music.isEnabled() then C.Text else C.Muted
		musicButton.BackgroundTransparency = if Music.isEnabled() then 0.3 else 0.6
	end)

	-- Controles y estamina (abajo al centro, discretos)
	controls = UI.new("Frame", {
		Name = "Controls",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -14),
		Size = UDim2.fromOffset(0, 26),
		AutomaticSize = Enum.AutomaticSize.X,
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.4,
		Visible = false,
		Parent = gui,
	}, { UI.corner(13), UI.new("UIPadding", { PaddingLeft = UDim.new(0, 12), PaddingRight = UDim.new(0, 12) }) })
	controlsLabel = UI.label({
		Size = UDim2.fromScale(0, 1),
		AutomaticSize = Enum.AutomaticSize.X,
		TextSize = 13,
		RichText = true,
		TextColor3 = C.Muted,
		Parent = controls,
	})
	staminaBar = UI.new("Frame", {
		Name = "Stamina",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -46),
		Size = UDim2.fromOffset(180, 6),
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.3,
		Visible = false,
		Parent = gui,
	}, { UI.corner(3) })
	staminaFill = UI.new("Frame", {
		Size = UDim2.fromScale(1, 1),
		BackgroundColor3 = C.Survivor,
		BorderSizePixel = 0,
		Parent = staminaBar,
	}, { UI.corner(3) })

	-- Avisos (esquina superior derecha, apilados)
	toastList = UI.new("Frame", {
		Name = "Toasts",
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -16, 0, 8),
		Size = UDim2.fromOffset(280, 300),
		BackgroundTransparency = 1,
		Parent = gui,
	}, {
		UI.new("UIListLayout", {
			Padding = UDim.new(0, 6),
			HorizontalAlignment = Enum.HorizontalAlignment.Right,
			SortOrder = Enum.SortOrder.LayoutOrder,
		}),
	})

	-- Tarjeta de rol
	roleCard = UI.new("CanvasGroup", {
		Name = "RoleCard",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.4),
		Size = UDim2.fromOffset(380, 132),
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.1,
		GroupTransparency = 1,
		Visible = false,
		Parent = gui,
	}, { UI.corner(18), UI.stroke(0.8) })

	resultCard = UI.new("CanvasGroup", {
		Name = "Result",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.fromScale(0.5, 0.18),
		Size = UDim2.fromOffset(420, 118),
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.1,
		GroupTransparency = 1,
		Visible = false,
		Parent = gui,
	}, { UI.corner(18), UI.stroke(0.8) })
end

local toastOrder = 0
local TOAST_COLORS = { info = C.Muted, good = C.Good, warn = C.Warn, bad = C.Verity }

local function toast(text: string, kind: string?)
	toastOrder += 1
	local color = TOAST_COLORS[kind or "info"] or C.Muted
	local frame = UI.new("CanvasGroup", {
		LayoutOrder = toastOrder,
		Size = UDim2.fromOffset(0, 34),
		AutomaticSize = Enum.AutomaticSize.X,
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.2,
		GroupTransparency = 1,
		Parent = toastList,
	}, {
		UI.corner(10),
		UI.new("UIPadding", { PaddingLeft = UDim.new(0, 14), PaddingRight = UDim.new(0, 12) }),
		UI.new("Frame", {
			Size = UDim2.new(0, 3, 1, -14),
			Position = UDim2.new(0, -8, 0, 7),
			BackgroundColor3 = color,
			BorderSizePixel = 0,
		}, { UI.corner(2) }),
	})
	UI.label({
		Size = UDim2.fromScale(0, 1),
		AutomaticSize = Enum.AutomaticSize.X,
		TextSize = 14,
		Text = text,
		Parent = frame,
	})
	UI.tween(frame, 0.25, { GroupTransparency = 0 })
	-- máximo 4 avisos visibles
	local toasts = {}
	for _, child in toastList:GetChildren() do
		if child:IsA("CanvasGroup") then
			table.insert(toasts, child)
		end
	end
	if #toasts > 4 then
		table.sort(toasts, function(a, b)
			return a.LayoutOrder < b.LayoutOrder
		end)
		toasts[1]:Destroy()
	end
	task.delay(4, function()
		if frame.Parent then
			UI.tween(frame, 0.4, { GroupTransparency = 1 }).Completed:Wait()
			frame:Destroy()
		end
	end)
end
HUD.toast = toast

local function showCard(card: CanvasGroup, title: string, headline: string, color: Color3, body: string, duration: number)
	card:ClearAllChildren()
	UI.corner(18).Parent = card
	UI.stroke(0.5, color).Parent = card
	UI.label({ Size = UDim2.new(1, 0, 0, 16), Position = UDim2.fromOffset(0, 14), TextSize = 12, FontFace = UI.FontBold, TextColor3 = C.Muted, Text = title, Parent = card })
	UI.label({ Size = UDim2.new(1, 0, 0, 40), Position = UDim2.fromOffset(0, 32), TextSize = 34, FontFace = UI.FontHeavy, TextColor3 = color, Text = headline, Parent = card })
	UI.label({ Size = UDim2.new(1, -40, 0, 36), Position = UDim2.fromOffset(20, 76), TextSize = 14, TextWrapped = true, TextColor3 = C.Text, Text = body, Parent = card })

	card.Visible = true
	card.GroupTransparency = 1
	local scale = UI.new("UIScale", { Scale = 0.92, Parent = card })
	UI.tween(card, 0.35, { GroupTransparency = 0 })
	UI.tween(scale, 0.45, { Scale = 1 }, Enum.EasingStyle.Back)
	task.delay(duration, function()
		UI.tween(card, 0.5, { GroupTransparency = 1 }).Completed:Wait()
		card.Visible = false
	end)
end

local function onRoleReveal(role: string, killerName: string)
	if role == "Verity" then
		showCard(roleCard, "TU ROL", "ERES VERITY", C.Verity, "Atrapa a todos antes de que acabe el tiempo. Q atrapar · Shift correr · C agacharse", 4)
	elseif role == "Survivor" then
		showCard(roleCard, "TU ROL", "SUPERVIVIENTE", C.Survivor, `Verity es {killerName}. Busca oro, craftea tótems y resiste. Shift para correr.`, 4)
	end
end

local function onRoundResult(winner: string, killerName: string, survivors: { string }, totems: number)
	if winner == "Verity" then
		showCard(resultCard, "FIN DE LA RONDA", "VERITY GANA", C.Verity, `{killerName} atrapó a todos. Tótems crafteados: {totems}`, Config.Round.ResultsTime - 0.5)
	else
		local names = if #survivors > 0 then table.concat(survivors, ", ") else "nadie"
		if #names > 70 then
			names = `{#survivors} supervivientes`
		end
		showCard(resultCard, "FIN DE LA RONDA", "SUPERVIVIENTES GANAN", C.Survivor, `Sobrevivieron: {names}. Tótems: {totems}`, Config.Round.ResultsTime - 0.5)
	end
end

local function update()
	local phase = (Workspace:GetAttribute("Phase") :: string?) or "Waiting"
	local endsAt = (Workspace:GetAttribute("PhaseEndsAt") :: number?) or 0
	local now = Workspace:GetServerTimeNow()
	local remaining = endsAt - now
	local role = (player:GetAttribute("Role") :: string?) or "Lobby"

	phaseLabel.Text = PHASE_TEXT[phase] or phase
	if phase == "Waiting" then
		local needed = if Workspace:GetAttribute("TestMode") then 1 else Config.Round.MinPlayers
		timerLabel.Text = `{#Players:GetPlayers()}/{needed}`
	elseif endsAt > 0 then
		timerLabel.Text = formatTime(remaining)
	else
		timerLabel.Text = "..."
	end
	local urgent = phase == "Playing" and remaining <= 10
	timerLabel.TextColor3 = if urgent then C.Verity else C.Text

	-- Línea de información contextual
	local info = ""
	if phase == "Waiting" or phase == "Intermission" or role == "Lobby" then
		local chance = (player:GetAttribute("VerityChance") :: number?) or 0
		info = `Probabilidad de Verity: <font color="#ff3b4e"><b>{chance}%</b></font>`
		if phase == "Playing" then
			info ..= "  ·  ronda en curso"
		end
	elseif phase == "Playing" then
		local releaseAt = (Workspace:GetAttribute("KillerReleaseAt") :: number?) or 0
		local totems = Workspace:GetAttribute("Totems") or 0
		local maxTotems = Workspace:GetAttribute("MaxTotems") or 0
		local alive = Workspace:GetAttribute("SurvivorsAlive") or 0
		if releaseAt > now then
			info = `Verity sale en <font color="#ff3b4e"><b>{math.ceil(releaseAt - now)}s</b></font>`
		else
			info = `Tótems <font color="#ffc83c"><b>{totems}/{maxTotems}</b></font>  ·  Vivos <b>{alive}</b>`
		end
	end
	infoLabel.Text = info
	infoPill.Visible = info ~= ""

	local inRound = phase == "Playing" or phase == "Starting"
	local key = function(k: string, text: string)
		return `<font color="#f0ecf5"><b>{k}</b></font> {text}`
	end
	if inRound and role == "Verity" then
		controlsLabel.Text = `{key("Q", "Atrapar")}   {key("Shift", "Correr")}   {key("C", "Agacharse")}`
	elseif inRound and role == "Survivor" then
		controlsLabel.Text = `{key("Shift", "Correr")}   {key("E", "Oro / mesa")}   {key("F", "Craftear")}`
	else
		controlsLabel.Text = ""
	end
	controls.Visible = controlsLabel.Text ~= ""

	local stamina = (player:GetAttribute("Stamina") :: number?) or Config.Movement.StaminaMax
	staminaBar.Visible = inRound and role == "Survivor" and stamina < Config.Movement.StaminaMax
	staminaFill.Size = UDim2.fromScale(stamina / Config.Movement.StaminaMax, 1)
	staminaFill.BackgroundColor3 = if stamina < 25 then C.Warn else C.Survivor

	coinChip.Visible = phase == "Playing" and (role == "Survivor" or role == "Verity")
	if coinChip.Visible then
		local got = (player:GetAttribute("RoundCoins") :: number?) or 0
		coinLabel.Text = `{got}/{Config.Coins.MaxPerRound}`
	end

	local showGold = phase == "Playing" and role == "Survivor"
	goldChip.Visible = showGold
	if showGold then
		local gold = (player:GetAttribute("Gold") :: number?) or 0
		goldLabel.Text = `Oro {gold}/{Config.Crafting.MaxGoldCarried}`
	end
end

function HUD.init()
	build()
end

function HUD.start()
	-- el HUD se actualiza aunque los remotes tarden en llegar
	local accumulator = 0
	RunService.Heartbeat:Connect(function(dt)
		accumulator += dt
		if accumulator >= 0.1 then
			accumulator = 0
			update()
		end
	end)
	update()

	Net.get("Notify").OnClientEvent:Connect(toast)
	Net.get("RoleReveal").OnClientEvent:Connect(onRoleReveal)
	Net.get("RoundResult").OnClientEvent:Connect(onRoundResult)
end

return HUD
