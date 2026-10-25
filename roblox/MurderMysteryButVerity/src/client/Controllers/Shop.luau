--!strict
-- Tienda: pestañas Objetos (monedas), Skins de Verity (monedas) y Pases
-- (Robux). Se abre con el botón "Tienda" (fuera de partida) o desde el
-- mostrador del lobby. Las compras las valida el servidor (ShopRequest).

local HttpService = game:GetService("HttpService")
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ProximityPromptService = game:GetService("ProximityPromptService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Net = require(ReplicatedStorage.Shared.Net)
local UI = require(script.Parent.Parent.Lib.UI)

local player = Players.LocalPlayer
local C = UI.Colors

local Shop = {}

type Tab = "Items" | "Skins" | "Passes"

local gui: ScreenGui
local openButton: TextButton
local openChance: TextLabel
local panel: CanvasGroup
local coinsLabel: TextLabel
local footer: TextLabel
local pages: { [Tab]: ScrollingFrame } = {}
local tabButtons: { [Tab]: TextButton } = {}
local refreshers: { () -> () } = {}
local isOpen = false
local request: RemoteEvent

local function decode(attr: string): { string }
	local raw = player:GetAttribute(attr)
	if typeof(raw) ~= "string" then
		return {}
	end
	local ok, result = pcall(HttpService.JSONDecode, HttpService, raw)
	return if ok and typeof(result) == "table" then result else {}
end

local function coins(): number
	return (player:GetAttribute("Coins") :: number?) or 0
end

local function setTab(tab: Tab)
	for name, page in pages do
		page.Visible = name == tab
		local button = tabButtons[name]
		button.BackgroundColor3 = if name == tab then C.Verity else C.PanelLight
		button.TextColor3 = if name == tab then Color3.new(1, 1, 1) else C.Muted
	end
	footer.Visible = tab == "Items"
end

local function setOpen(open: boolean, tab: Tab?)
	isOpen = open
	if tab then
		setTab(tab)
	end
	if open then
		panel.Visible = true
		UI.tween(panel, 0.25, { GroupTransparency = 0 })
	else
		UI.tween(panel, 0.2, { GroupTransparency = 1 }).Completed:Connect(function()
			if not isOpen then
				panel.Visible = false
			end
		end)
	end
end

local function styleButton(button: TextButton, text: string, kind: "buy" | "neutral" | "done")
	button.Text = text
	if kind == "buy" then
		button.BackgroundColor3 = C.Gold
		button.TextColor3 = Color3.fromRGB(30, 20, 10)
	elseif kind == "neutral" then
		button.BackgroundColor3 = C.Survivor
		button.TextColor3 = Color3.fromRGB(10, 30, 25)
	else
		button.BackgroundColor3 = C.PanelLight
		button.TextColor3 = C.Good
	end
end

local function card(parent: Instance, order: number): (Frame, TextButton)
	local frame = UI.new("Frame", {
		LayoutOrder = order,
		BackgroundColor3 = C.PanelLight,
		BackgroundTransparency = 0.15,
		Parent = parent,
	}, { UI.corner(12) })
	local button: TextButton = UI.new("TextButton", {
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -10),
		Size = UDim2.new(1, -20, 0, 30),
		FontFace = UI.FontBold,
		TextSize = 13,
		AutoButtonColor = true,
		Parent = frame,
	}, { UI.corner(8) })
	return frame, button
end

local function texts(frame: Frame, title: string, description: string)
	UI.label({ Position = UDim2.fromOffset(62, 12), Size = UDim2.new(1, -70, 0, 34), TextXAlignment = Enum.TextXAlignment.Left,
		TextWrapped = true, FontFace = UI.FontBold, TextSize = 14, Text = title, Parent = frame })
	UI.label({ Position = UDim2.fromOffset(10, 58), Size = UDim2.new(1, -20, 0, 44), TextXAlignment = Enum.TextXAlignment.Left,
		TextYAlignment = Enum.TextYAlignment.Top, TextWrapped = true, TextSize = 11, TextColor3 = C.Muted, Text = description, Parent = frame })
end

local function buildItems(page: ScrollingFrame)
	for i, item in Config.Items do
		local frame, button = card(page, i)
		UI.new("TextLabel", {
			Position = UDim2.fromOffset(10, 10),
			Size = UDim2.fromOffset(42, 42),
			BackgroundColor3 = item.Color,
			FontFace = UI.FontHeavy,
			TextSize = 13,
			TextColor3 = Color3.new(1, 1, 1),
			Text = item.Badge,
			Parent = frame,
		}, { UI.corner(10), UI.new("UIGradient", { Transparency = NumberSequence.new(0, 0.35), Rotation = 90 }) })
		texts(frame, item.Title, item.Description)
		local function refresh()
			local owned = table.find(decode("OwnedItems"), item.Key) ~= nil
			local equipped = table.find(decode("EquippedItems"), item.Key) ~= nil
			if not owned then
				styleButton(button, `Comprar · {item.Price}`, "buy")
				button.AutoButtonColor = coins() >= item.Price
				button.BackgroundTransparency = if coins() >= item.Price then 0 else 0.5
			elseif equipped then
				styleButton(button, "Equipado (quitar)", "done")
				button.BackgroundTransparency = 0
			else
				styleButton(button, "Equipar", "neutral")
				button.BackgroundTransparency = 0
			end
		end
		table.insert(refreshers, refresh)
		button.Activated:Connect(function()
			local owned = table.find(decode("OwnedItems"), item.Key) ~= nil
			request:FireServer(if owned then "EquipItem" else "BuyItem", item.Key)
		end)
	end
end

local function buildSkins(page: ScrollingFrame)
	for i, skin in Config.Skins do
		local s: any = skin
		local frame, button = card(page, i)
		-- muestra: círculo con el tinte y el contorno de la skin
		local base = Color3.fromRGB(214, 194, 92)
		UI.new("Frame", {
			Position = UDim2.fromOffset(10, 10),
			Size = UDim2.fromOffset(42, 42),
			BackgroundColor3 = base:Lerp(s.Tint, s.Amount),
			BackgroundTransparency = if s.Ghost then 0.45 else 0,
			Parent = frame,
		}, { UI.corner(21), UI.stroke(if s.Outline then 0 else 0.7, s.Outline or Color3.new(1, 1, 1)) })
		texts(frame, s.Title, s.Description)
		local function refresh()
			local owned = table.find(decode("OwnedSkins"), s.Key) ~= nil or s.Price == 0
			local equipped = player:GetAttribute("Skin") == s.Key
			if equipped then
				styleButton(button, "Equipada", "done")
				button.BackgroundTransparency = 0
			elseif owned then
				styleButton(button, "Equipar", "neutral")
				button.BackgroundTransparency = 0
			else
				styleButton(button, `Comprar · {s.Price}`, "buy")
				button.BackgroundTransparency = if coins() >= s.Price then 0 else 0.5
			end
		end
		table.insert(refreshers, refresh)
		button.Activated:Connect(function()
			local owned = table.find(decode("OwnedSkins"), s.Key) ~= nil or s.Price == 0
			request:FireServer(if owned then "EquipSkin" else "BuySkin", s.Key)
		end)
	end
end

local function buildPasses(page: ScrollingFrame)
	local list = {}
	for _, pass in Config.GamePasses do
		table.insert(list, { kind = "pass", key = pass.Key, id = pass.Id, badge = `{pass.Multiplier}x`, title = pass.Title, description = pass.Description })
	end
	for _, product in Config.Products do
		table.insert(list, { kind = "product", key = product.Key, id = product.Id, badge = `x{product.Multiplier}`, title = product.Title, description = product.Description })
	end
	for i, entry in list do
		local frame, button = card(page, i)
		UI.new("TextLabel", {
			Position = UDim2.fromOffset(10, 10),
			Size = UDim2.fromOffset(42, 42),
			BackgroundColor3 = if entry.kind == "product" then Color3.fromRGB(150, 80, 255) else C.Verity,
			FontFace = UI.FontHeavy,
			TextSize = 16,
			TextColor3 = Color3.new(1, 1, 1),
			Text = entry.badge,
			Parent = frame,
		}, { UI.corner(10) })
		texts(frame, entry.title, entry.description)
		if entry.id == 0 then
			styleButton(button, "Pronto", "done")
			button.TextColor3 = C.Muted
			button.AutoButtonColor = false
			continue
		end
		styleButton(button, "...", "buy")
		task.spawn(function()
			local infoType = if entry.kind == "pass" then Enum.InfoType.GamePass else Enum.InfoType.Product
			local ok, info = pcall(MarketplaceService.GetProductInfo, MarketplaceService, entry.id, infoType)
			button.Text = if ok and info and info.PriceInRobux then `R$ {info.PriceInRobux}` else "Comprar"
		end)
		local function refresh()
			if entry.kind == "pass" and player:GetAttribute("Pass_" .. entry.key) then
				styleButton(button, "Adquirido", "done")
			end
		end
		table.insert(refreshers, refresh)
		button.Activated:Connect(function()
			if entry.kind == "pass" then
				if not player:GetAttribute("Pass_" .. entry.key) then
					MarketplaceService:PromptGamePassPurchase(player, entry.id)
				end
			else
				MarketplaceService:PromptProductPurchase(player, entry.id)
			end
		end)
	end
end

local function build()
	gui = UI.new("ScreenGui", {
		Name = "Shop",
		ResetOnSpawn = false,
		ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
		DisplayOrder = 5,
		Parent = player:WaitForChild("PlayerGui"),
	})

	openButton = UI.new("TextButton", {
		Name = "OpenShop",
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(0, 14, 0.5, 0),
		Size = UDim2.fromOffset(132, 46),
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.2,
		Text = "",
		AutoButtonColor = true,
		Parent = gui,
	}, { UI.corner(12), UI.stroke(0.6, C.Gold) })
	UI.label({ Size = UDim2.new(1, -24, 0, 18), Position = UDim2.fromOffset(12, 6), TextXAlignment = Enum.TextXAlignment.Left, FontFace = UI.FontBold, TextSize = 15, Text = "Tienda", Parent = openButton })
	openChance = UI.label({ Size = UDim2.new(1, -24, 0, 14), Position = UDim2.fromOffset(12, 25), TextXAlignment = Enum.TextXAlignment.Left, TextSize = 11, TextColor3 = C.Muted, Parent = openButton })

	panel = UI.new("CanvasGroup", {
		Name = "Panel",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.52),
		Size = UDim2.fromOffset(620, 450),
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.05,
		GroupTransparency = 1,
		Visible = false,
		Parent = gui,
	}, { UI.corner(18), UI.stroke(0.8) })
	local scale = UI.new("UIScale", { Parent = panel })
	local function fit()
		local camera = Workspace.CurrentCamera
		if camera then
			local view = camera.ViewportSize
			scale.Scale = math.min(1, (view.X - 24) / 620, (view.Y - 60) / 450)
		end
	end
	fit()
	if Workspace.CurrentCamera then
		Workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(fit)
	end

	-- cabecera
	UI.label({ Position = UDim2.fromOffset(18, 14), Size = UDim2.fromOffset(200, 26), TextXAlignment = Enum.TextXAlignment.Left,
		FontFace = UI.FontHeavy, TextSize = 22, Text = "TIENDA", Parent = panel })
	local coinPill = UI.new("Frame", {
		Position = UDim2.fromOffset(130, 14),
		Size = UDim2.fromOffset(0, 26),
		AutomaticSize = Enum.AutomaticSize.X,
		BackgroundColor3 = C.PanelLight,
		Parent = panel,
	}, { UI.corner(13), UI.new("UIPadding", { PaddingLeft = UDim.new(0, 30), PaddingRight = UDim.new(0, 12) }) })
	UI.new("Frame", { Position = UDim2.new(0, -22, 0.5, -8), Size = UDim2.fromOffset(16, 16), BackgroundColor3 = C.Gold, Parent = coinPill }, { UI.corner(8) })
	coinsLabel = UI.label({ Size = UDim2.fromScale(0, 1), AutomaticSize = Enum.AutomaticSize.X, FontFace = UI.FontBold, TextSize = 14, TextColor3 = C.Gold, Parent = coinPill })
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

	-- pestañas
	local tabs = UI.new("Frame", {
		Position = UDim2.fromOffset(18, 50),
		Size = UDim2.new(1, -36, 0, 30),
		BackgroundTransparency = 1,
		Parent = panel,
	}, { UI.new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }) })
	local tabDefs: { { name: Tab, label: string } } = {
		{ name = "Items", label = "Objetos" },
		{ name = "Skins", label = "Skins de Verity" },
		{ name = "Passes", label = "Pases" },
	}
	for i, def in tabDefs do
		local name, label = def.name, def.label
		local button: TextButton = UI.new("TextButton", {
			LayoutOrder = i,
			Size = UDim2.fromOffset(0, 30),
			AutomaticSize = Enum.AutomaticSize.X,
			BackgroundColor3 = C.PanelLight,
			FontFace = UI.FontBold,
			TextSize = 13,
			TextColor3 = C.Muted,
			Text = label,
			Parent = tabs,
		}, { UI.corner(15), UI.new("UIPadding", { PaddingLeft = UDim.new(0, 14), PaddingRight = UDim.new(0, 14) }) })
		tabButtons[name] = button
		button.Activated:Connect(function()
			setTab(name)
		end)

		local page: ScrollingFrame = UI.new("ScrollingFrame", {
			Position = UDim2.fromOffset(14, 90),
			Size = UDim2.new(1, -28, 1, -126),
			BackgroundTransparency = 1,
			BorderSizePixel = 0,
			ScrollBarThickness = 4,
			ScrollBarImageColor3 = C.Muted,
			CanvasSize = UDim2.new(),
			AutomaticCanvasSize = Enum.AutomaticSize.Y,
			Visible = false,
			Parent = panel,
		}, {
			UI.new("UIGridLayout", { CellSize = UDim2.fromOffset(186, 148), CellPadding = UDim2.fromOffset(8, 8), SortOrder = Enum.SortOrder.LayoutOrder }),
			UI.new("UIPadding", { PaddingLeft = UDim.new(0, 4), PaddingTop = UDim.new(0, 2) }),
		})
		pages[name] = page
	end
	footer = UI.label({ AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 18, 1, -10), Size = UDim2.new(1, -36, 0, 16),
		TextXAlignment = Enum.TextXAlignment.Left, TextSize = 11, TextColor3 = C.Muted, Parent = panel })

	buildItems(pages.Items)
	buildSkins(pages.Skins)
	buildPasses(pages.Passes)
	setTab("Items")

	openButton.Activated:Connect(function()
		setOpen(not isOpen)
	end)
end

local function refresh()
	local chance = (player:GetAttribute("VerityChance") :: number?) or 0
	openChance.Text = `{coins()} monedas · Verity {chance}%`
	coinsLabel.Text = tostring(coins())
	footer.Text = `Objetos equipados: {#decode("EquippedItems")}/{Config.MaxEquipped} · se llevan a las rondas`
	for _, fn in refreshers do
		fn()
	end
	local role = player:GetAttribute("Role")
	local inRound = role == "Survivor" or role == "Verity"
	openButton.Visible = not inRound
	if inRound and isOpen then
		setOpen(false)
	end
end

function Shop.init()
	build()
end

function Shop.start()
	request = Net.get("ShopRequest")
	for _, attr in { "VerityChance", "Coins", "OwnedItems", "EquippedItems", "OwnedSkins", "Skin", "Role", "Pass_Chance2x", "Pass_Chance3x" } do
		player:GetAttributeChangedSignal(attr):Connect(refresh)
	end
	-- mostrador de la tienda en el lobby
	ProximityPromptService.PromptTriggered:Connect(function(prompt)
		if prompt:GetAttribute("OpensShop") then
			setOpen(true, "Items")
		end
	end)
	refresh()
end

return Shop
