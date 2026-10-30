--!strict
-- HUD discreto: píldora superior con fase y reloj, chip de oro, avisos
-- pequeños, tarjeta de rol y banner de resultados. Todo animado: los
-- elementos aparecen con rebote y se encogen al irse, el reloj late en los
-- últimos segundos, los chips laten al ganar oro o monedas y las tarjetas
-- entran con un destello.
-- Todos los textos pasan por Locale.t (traducibles a cualquier idioma).

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Locale = require(ReplicatedStorage.Shared.Locale)
local Net = require(ReplicatedStorage.Shared.Net)
local UI = require(script.Parent.Parent.Lib.UI)
local Music = require(script.Parent.Music)

local player = Players.LocalPlayer
local C = UI.Colors
local T = Locale.t

local HUD = {}

local PHASE_TEXT = {
	Waiting = Locale.mark("ESPERANDO JUGADORES"),
	Intermission = Locale.mark("INTERMEDIO"),
	Starting = Locale.mark("PREPARANDO"),
	Playing = Locale.mark("SOBREVIVE"),
	Results = Locale.mark("RESULTADOS"),
}

local gui: ScreenGui
local pill: Frame
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
	pill = UI.new("Frame", {
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
		AnchorPoint = Vector2.new(0.5, 0.5), -- late desde el centro
		Size = UDim2.new(1, 0, 0, 26),
		Position = UDim2.new(0.5, 0, 0, 32),
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

	UI.animateButtons(gui)
end

local toastOrder = 0
local TOAST_COLORS = { info = C.Muted, good = C.Good, warn = C.Warn, bad = C.Verity }

local function toast(text: string, kind: string?, args: { [string]: any }?)
	text = T(text, args)
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
	-- entra con rebote; los avisos malos además dan una sacudida
	local scale = UI.new("UIScale", { Scale = 0.5, Parent = frame })
	UI.tween(frame, 0.25, { GroupTransparency = 0 })
	UI.tween(scale, 0.4, { Scale = 1 }, Enum.EasingStyle.Back)
	if kind == "bad" then
		frame.Rotation = 4
		UI.tween(frame, 0.5, { Rotation = 0 }, Enum.EasingStyle.Elastic)
	end
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
			UI.tween(scale, 0.3, { Scale = 0.7 })
			UI.tween(frame, 0.3, { GroupTransparency = 1 }).Completed:Wait()
			frame:Destroy()
		end
	end)
end
HUD.toast = toast

local cardHome: { [CanvasGroup]: UDim2 } = {}
local cardToken: { [CanvasGroup]: number } = {}

local function showCard(card: CanvasGroup, title: string, headline: string, color: Color3, body: string, duration: number)
	local home = cardHome[card] or card.Position
	cardHome[card] = home
	local token = (cardToken[card] or 0) + 1
	cardToken[card] = token

	card:ClearAllChildren()
	UI.corner(18).Parent = card
	UI.stroke(0.5, color).Parent = card
	UI.label({ Size = UDim2.new(1, 0, 0, 16), Position = UDim2.fromOffset(0, 14), TextSize = 12, FontFace = UI.FontBold, TextColor3 = C.Muted, Text = title, Parent = card })
	local headlineLabel = UI.label({ AnchorPoint = Vector2.new(0.5, 0.5), Size = UDim2.new(1, 0, 0, 40), Position = UDim2.new(0.5, 0, 0, 52), TextSize = 34,
		FontFace = UI.FontHeavy, TextColor3 = color, Text = headline, Parent = card })
	UI.label({ Size = UDim2.new(1, -40, 0, 36), Position = UDim2.fromOffset(20, 76), TextSize = 14, TextWrapped = true, TextColor3 = C.Text, Text = body, Parent = card })
	-- destello que cruza la tarjeta
	local shine = UI.new("UIGradient", {
		Rotation = 20,
		Offset = Vector2.new(-1, 0),
		Transparency = NumberSequence.new({
			NumberSequenceKeypoint.new(0, 1),
			NumberSequenceKeypoint.new(0.42, 1),
			NumberSequenceKeypoint.new(0.5, 0.8),
			NumberSequenceKeypoint.new(0.58, 1),
			NumberSequenceKeypoint.new(1, 1),
		}),
	})
	UI.new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(1, 1, 1), ZIndex = 5, Parent = card }, { UI.corner(18), shine })

	-- entrada: baja con rebote, el titular se asienta y pasa el destello
	card.Visible = true
	card.GroupTransparency = 1
	card.Position = home + UDim2.fromOffset(0, -26)
	local scale = UI.new("UIScale", { Scale = 0.9, Parent = card })
	local headlineScale = UI.new("UIScale", { Scale = 1.4, Parent = headlineLabel })
	UI.tween(card, 0.35, { GroupTransparency = 0 })
	UI.tween(card, 0.5, { Position = home }, Enum.EasingStyle.Back)
	UI.tween(scale, 0.5, { Scale = 1 }, Enum.EasingStyle.Back)
	UI.tween(headlineScale, 0.6, { Scale = 1 }, Enum.EasingStyle.Back)
	task.delay(0.25, function()
		UI.tween(shine, 0.9, { Offset = Vector2.new(1, 0) }, Enum.EasingStyle.Sine)
	end)

	-- salida: sube un poco, se encoge y se desvanece
	task.delay(duration, function()
		if cardToken[card] ~= token then
			return -- ya se mostró otra tarjeta en su lugar
		end
		UI.tween(card, 0.4, { Position = home + UDim2.fromOffset(0, -14) })
		UI.tween(scale, 0.4, { Scale = 0.94 })
		UI.tween(card, 0.4, { GroupTransparency = 1 }).Completed:Wait()
		if cardToken[card] == token then
			card.Visible = false
			card.Position = home
		end
	end)
end

local function onRoleReveal(role: string, killerName: string)
	if role == "Verity" then
		showCard(roleCard, T("TU ROL"), T("ERES VERITY"), C.Verity, T("Eres una bola sonriente... por ahora. Ves en la oscuridad. Al despertar: Q atrapar · Shift correr · C agacharse"), 4.5)
	elseif role == "Survivor" then
		showCard(roleCard, T("TU ROL"), T("SUPERVIVIENTE"), C.Survivor,
			T("Verity es {name}. F linterna, R esconderse, E oro y tótems. Cada minuto Verity te verá en rojo: ¡muévete!", { name = killerName }), 5)
	end
end

local function onRoundResult(winner: string, killerName: string, survivors: { string }, totems: number)
	if winner == "Verity" then
		showCard(resultCard, T("FIN DE LA RONDA"), T("VERITY GANA"), C.Verity, T("{name} atrapó a todos. Tótems crafteados: {totems}", { name = killerName, totems = totems }), Config.Round.ResultsTime - 0.5)
	elseif winner == "Cancelled" then
		showCard(resultCard, T("FIN DE LA RONDA"), T("RONDA CANCELADA"), C.Muted, T("Entró otro jugador. La próxima ronda es entre jugadores reales."), Config.Round.ResultsTime - 0.5)
	else
		local names = if #survivors > 0 then table.concat(survivors, ", ") else T("nadie")
		if #names > 70 then
			names = T("{count} supervivientes", { count = #survivors })
		end
		showCard(resultCard, T("FIN DE LA RONDA"), T("SUPERVIVIENTES GANAN"), C.Survivor, T("Sobrevivieron: {names}. Tótems: {totems}", { names = names, totems = totems }), Config.Round.ResultsTime - 0.5)
	end
end

local lastPhase: string? = nil
local lastSecond = -1
local lastRoundCoins = 0
local lastGold = 0
local wasRevealed = false

local function update()
	local phase = (Workspace:GetAttribute("Phase") :: string?) or "Waiting"
	local endsAt = (Workspace:GetAttribute("PhaseEndsAt") :: number?) or 0
	local now = Workspace:GetServerTimeNow()
	local remaining = endsAt - now
	local role = (player:GetAttribute("Role") :: string?) or "Lobby"

	-- la píldora late al cambiar de fase; el reloj, cada segundo de los últimos
	if phase ~= lastPhase then
		if lastPhase ~= nil then
			UI.pulse(pill, 1.12)
		end
		lastPhase = phase
	end
	local second = math.ceil(remaining)
	if second ~= lastSecond then
		lastSecond = second
		local finalCountdown = (phase == "Playing" and second <= 10) or (phase == "Intermission" and second <= 5)
		if finalCountdown and second > 0 and endsAt > 0 then
			UI.pulse(timerLabel, if phase == "Playing" then 1.3 else 1.18)
		end
	end

	phaseLabel.Text = T(PHASE_TEXT[phase] or phase)
	if phase == "Waiting" then
		local ready = 0
		for _, other in Players:GetPlayers() do
			if not other:GetAttribute("AFK") then
				ready += 1
			end
		end
		timerLabel.Text = `{ready}/{Config.Round.MinPlayers}`
	elseif endsAt > 0 then
		timerLabel.Text = formatTime(remaining)
	else
		timerLabel.Text = "..."
	end
	local urgent = phase == "Playing" and remaining <= 10
	timerLabel.TextColor3 = if urgent then C.Verity else C.Text

	-- Línea de información contextual
	local info = ""
	local active = 0 -- jugadores que no están AFK
	for _, other in Players:GetPlayers() do
		if not other:GetAttribute("AFK") then
			active += 1
		end
	end
	if (phase == "Waiting" or phase == "Intermission" or role == "Lobby") and player:GetAttribute("AFK") then
		info = `<font color="#ffbe5a"><b>{T("Modo AFK")}</b></font>  ·  ` .. T("No entrarás en las rondas hasta quitarlo")
	elseif phase == "Waiting" or phase == "Intermission" or role == "Lobby" then
		if active == 1 and Config.Round.SoloBots then
			-- en solitario se alterna: una ronda Verity, otra superviviente
			local isVerity = not player:GetAttribute("RotationDone")
			local nextRole = if isVerity then T("Verity") else T("Superviviente")
			local color = if isVerity then "#ff3b4e" else "#46dcbe"
			info = T("Próxima ronda: {role}", { role = `<font color="{color}"><b>{nextRole}</b></font>` })
				.. "  ·  " .. T("Partida en solitario con NPCs")
		else
			local chance = (player:GetAttribute("VerityChance") :: number?) or 0
			info = T("Probabilidad de Verity: {chance}", { chance = `<font color="#ff3b4e"><b>{chance}%</b></font>` })
			-- rotación: nadie repite hasta que todos hayan sido Verity
			local total = (Workspace:GetAttribute("RotationTotal") :: number?) or 0
			if total > 1 then
				if player:GetAttribute("RotationDone") then
					info ..= "  ·  " .. T("Ya fuiste Verity en esta rotación")
				else
					local done = (Workspace:GetAttribute("RotationDone") :: number?) or 0
					info ..= "  ·  " .. T("Rotación: {done}/{total} ya fueron Verity", { done = done, total = total })
				end
			end
		end
		if phase == "Playing" then
			info ..= "  ·  " .. T("ronda en curso")
		end
	elseif phase == "Playing" then
		local releaseAt = (Workspace:GetAttribute("KillerReleaseAt") :: number?) or 0
		local totems = Workspace:GetAttribute("Totems") or 0
		local maxTotems = Workspace:GetAttribute("MaxTotems") or 0
		local alive = Workspace:GetAttribute("SurvivorsAlive") or 0
		local revealUntil = (Workspace:GetAttribute("RevealUntil") :: number?) or 0
		local nextReveal = (Workspace:GetAttribute("NextRevealAt") :: number?) or 0
		if releaseAt > now then
			info = T("Verity despierta en {seconds}", { seconds = `<font color="#ff3b4e"><b>{math.ceil(releaseAt - now)}s</b></font>` })
		else
			info = T("Tótems {totems}  ·  Vivos {alive}", { totems = `<font color="#ffc83c"><b>{totems}/{maxTotems}</b></font>`, alive = `<b>{alive}</b>` })
			if revealUntil > now then
				info ..= "  ·  " .. `<font color="#ff3b4e"><b>{T("¡Revelados!")}</b></font>`
				if not wasRevealed then
					UI.pulse(infoPill, 1.2)
				end
			elseif nextReveal > now then
				local seconds = math.ceil(nextReveal - now)
				local color = if seconds <= 10 then "#ff3b4e" else "#a59cb2"
				info ..= "  ·  " .. T("Revelación en {seconds}", { seconds = `<font color="{color}"><b>{seconds}s</b></font>` })
			end
		end
	end
	wasRevealed = phase == "Playing" and ((Workspace:GetAttribute("RevealUntil") :: number?) or 0) > now
	infoLabel.Text = info
	UI.show(infoPill, info ~= "")

	local inRound = phase == "Playing" or phase == "Starting"
	local key = function(k: string, text: string)
		return `<font color="#f0ecf5"><b>{k}</b></font> {text}`
	end
	if inRound and role == "Verity" then
		controlsLabel.Text = `{key("Q", T("Atrapar"))}   {key("Shift", T("Correr"))}   {key("C", T("Agacharse"))}`
	elseif inRound and role == "Survivor" then
		controlsLabel.Text = `{key("Shift", T("Correr"))}   {key("F", T("Linterna"))}   {key("E", T("Oro / tótem"))}   {key("R", T("Esconderse"))}`
	else
		controlsLabel.Text = ""
	end
	UI.show(controls, controlsLabel.Text ~= "")

	local stamina = (player:GetAttribute("Stamina") :: number?) or Config.Movement.StaminaMax
	UI.show(staminaBar, inRound and role == "Survivor" and stamina < Config.Movement.StaminaMax)
	UI.tween(staminaFill, 0.12, { Size = UDim2.fromScale(stamina / Config.Movement.StaminaMax, 1) }, Enum.EasingStyle.Linear)
	staminaFill.BackgroundColor3 = if stamina < 25 then C.Warn else C.Survivor

	local showCoins = phase == "Playing" and (role == "Survivor" or role == "Verity")
	UI.show(coinChip, showCoins)
	local got = (player:GetAttribute("RoundCoins") :: number?) or 0
	if showCoins then
		coinLabel.Text = `{got}/{Config.Coins.MaxPerRound}`
		if got > lastRoundCoins then
			UI.pulse(coinChip, 1.18)
		end
	end
	lastRoundCoins = got

	local showGold = phase == "Playing" and role == "Survivor"
	UI.show(goldChip, showGold)
	local gold = (player:GetAttribute("Gold") :: number?) or 0
	if showGold then
		goldLabel.Text = T("Oro {gold}/{max}", { gold = gold, max = Config.Crafting.MaxGoldCarried })
		if gold > lastGold then
			UI.pulse(goldChip, 1.18)
		end
	end
	lastGold = gold
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
