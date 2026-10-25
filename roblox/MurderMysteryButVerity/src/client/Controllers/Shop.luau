--!strict
-- Botón pequeño "Pases" (solo fuera de partida) y panel de compra de
-- multiplicadores de probabilidad.

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local UI = require(script.Parent.Parent.Lib.UI)

local player = Players.LocalPlayer
local C = UI.Colors

local Shop = {}

local gui: ScreenGui
local openButton: TextButton
local panel: CanvasGroup
local chanceLabel: TextLabel
local boostLabel: TextLabel
local isOpen = false

type Item = {
	kind: "pass" | "product",
	key: string,
	id: number,
	badge: string,
	title: string,
	description: string,
}

local function items(): { Item }
	local list: { Item } = {}
	for _, pass in Config.GamePasses do
		table.insert(list, { kind = "pass", key = pass.Key, id = pass.Id, badge = `{pass.Multiplier}x`, title = pass.Title, description = pass.Description })
	end
	for _, product in Config.Products do
		table.insert(list, { kind = "product", key = product.Key, id = product.Id, badge = `x{product.Multiplier}`, title = product.Title, description = product.Description })
	end
	return list
end

local function setOpen(open: boolean)
	isOpen = open
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

local function buildRow(item: Item, parent: Instance, order: number)
	local row = UI.new("Frame", {
		LayoutOrder = order,
		Size = UDim2.new(1, 0, 0, 64),
		BackgroundColor3 = C.PanelLight,
		BackgroundTransparency = 0.2,
		Parent = parent,
	}, { UI.corner(12) })

	local badgeColor = if item.kind == "product" then Color3.fromRGB(150, 80, 255) else C.Verity
	UI.new("TextLabel", {
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(0, 10, 0.5, 0),
		Size = UDim2.fromOffset(44, 44),
		BackgroundColor3 = badgeColor,
		FontFace = UI.FontHeavy,
		TextColor3 = Color3.new(1, 1, 1),
		TextSize = 17,
		Text = item.badge,
		Parent = row,
	}, {
		UI.corner(10),
		UI.new("UIGradient", {
			Transparency = NumberSequence.new(0, 0.35),
			Rotation = 90,
		}),
	})
	UI.label({ Position = UDim2.fromOffset(64, 11), Size = UDim2.new(1, -170, 0, 18), TextXAlignment = Enum.TextXAlignment.Left, FontFace = UI.FontBold, TextSize = 15, Text = item.title, Parent = row })
	UI.label({ Position = UDim2.fromOffset(64, 30), Size = UDim2.new(1, -170, 0, 26), TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top, TextWrapped = true, TextSize = 12, TextColor3 = C.Muted, Text = item.description, Parent = row })

	local button: TextButton = UI.new("TextButton", {
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -10, 0.5, 0),
		Size = UDim2.fromOffset(90, 34),
		BackgroundColor3 = C.Gold,
		FontFace = UI.FontBold,
		TextSize = 14,
		TextColor3 = Color3.fromRGB(30, 20, 10),
		AutoButtonColor = true,
		Text = "...",
		Parent = row,
	}, { UI.corner(10) })

	local function refreshOwned()
		if item.kind == "pass" and player:GetAttribute("Pass_" .. item.key) then
			button.Text = "Adquirido"
			button.BackgroundColor3 = C.PanelLight
			button.TextColor3 = C.Good
			button.Active = false
			button.AutoButtonColor = false
		end
	end

	if item.id == 0 then
		button.Text = "Pronto"
		button.BackgroundColor3 = C.PanelLight
		button.TextColor3 = C.Muted
		button.AutoButtonColor = false
		return
	end

	task.spawn(function()
		local infoType = if item.kind == "pass" then Enum.InfoType.GamePass else Enum.InfoType.Product
		local ok, info = pcall(MarketplaceService.GetProductInfo, MarketplaceService, item.id, infoType)
		if button.Text == "..." then
			button.Text = if ok and info and info.PriceInRobux then `R$ {info.PriceInRobux}` else "Comprar"
		end
		refreshOwned()
	end)
	if item.kind == "pass" then
		player:GetAttributeChangedSignal("Pass_" .. item.key):Connect(refreshOwned)
	end

	button.Activated:Connect(function()
		if item.kind == "pass" then
			if not player:GetAttribute("Pass_" .. item.key) then
				MarketplaceService:PromptGamePassPurchase(player, item.id)
			end
		else
			MarketplaceService:PromptProductPurchase(player, item.id)
		end
	end)
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
		Size = UDim2.fromOffset(58, 58),
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.2,
		Text = "",
		AutoButtonColor = true,
		Parent = gui,
	}, { UI.corner(14), UI.stroke(0.6, C.Verity) })
	UI.label({ Size = UDim2.new(1, 0, 0, 26), Position = UDim2.fromOffset(0, 8), FontFace = UI.FontHeavy, TextSize = 22, TextColor3 = C.Verity, Text = "2x", Parent = openButton })
	UI.label({ Size = UDim2.new(1, 0, 0, 14), Position = UDim2.fromOffset(0, 35), FontFace = UI.FontBold, TextSize = 10, TextColor3 = C.Muted, Text = "PASES", Parent = openButton })

	panel = UI.new("CanvasGroup", {
		Name = "Panel",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(420, 0),
		AutomaticSize = Enum.AutomaticSize.Y,
		BackgroundColor3 = C.Panel,
		BackgroundTransparency = 0.05,
		GroupTransparency = 1,
		Visible = false,
		Parent = gui,
	}, {
		UI.corner(18),
		UI.stroke(0.8),
		UI.padding(16),
		UI.new("UISizeConstraint", { MaxSize = Vector2.new(420, 520) }),
		UI.new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }),
	})

	local header = UI.new("Frame", { LayoutOrder = 0, Size = UDim2.new(1, 0, 0, 58), BackgroundTransparency = 1, Parent = panel })
	UI.label({ Size = UDim2.new(1, -40, 0, 14), TextXAlignment = Enum.TextXAlignment.Left, FontFace = UI.FontBold, TextSize = 11, TextColor3 = C.Muted, Text = "PROBABILIDAD DE SER VERITY", Parent = header })
	chanceLabel = UI.label({ Position = UDim2.fromOffset(0, 16), Size = UDim2.new(1, -40, 0, 30), TextXAlignment = Enum.TextXAlignment.Left, FontFace = UI.FontHeavy, TextSize = 28, TextColor3 = C.Verity, Text = "0%", Parent = header })
	boostLabel = UI.label({ Position = UDim2.fromOffset(0, 44), Size = UDim2.new(1, -40, 0, 14), TextXAlignment = Enum.TextXAlignment.Left, TextSize = 12, TextColor3 = C.Muted, Text = "", Parent = header })
	local close: TextButton = UI.new("TextButton", {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, 0, 0, 0),
		Size = UDim2.fromOffset(30, 30),
		BackgroundColor3 = C.PanelLight,
		FontFace = UI.FontBold,
		TextColor3 = C.Muted,
		TextSize = 14,
		Text = "X",
		Parent = header,
	}, { UI.corner(15) })
	close.Activated:Connect(function()
		setOpen(false)
	end)

	for i, item in items() do
		buildRow(item, panel, i)
	end

	UI.label({
		LayoutOrder = 999,
		Size = UDim2.new(1, 0, 0, 28),
		TextWrapped = true,
		TextSize = 11,
		TextColor3 = C.Muted,
		Text = "Cada ronda que no eres Verity ganas suerte extra. Los pases multiplican tu probabilidad.",
		Parent = panel,
	})

	openButton.Activated:Connect(function()
		setOpen(not isOpen)
	end)
end

local function refresh()
	local chance = (player:GetAttribute("VerityChance") :: number?) or 0
	chanceLabel.Text = `{chance}%`
	local mult = (player:GetAttribute("PassMultiplier") :: number?) or 1
	local boost = (player:GetAttribute("BoostRounds") :: number?) or 0
	local parts = {}
	if mult > 1 then
		table.insert(parts, `Pase activo: {mult}x`)
	end
	if boost > 0 then
		table.insert(parts, `Poción: {boost} ronda(s)`)
	end
	boostLabel.Text = if #parts > 0 then table.concat(parts, "  ·  ") else "Sin multiplicadores activos"

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
	for _, attr in { "VerityChance", "PassMultiplier", "BoostRounds", "Role" } do
		player:GetAttributeChangedSignal(attr):Connect(refresh)
	end
	refresh()
end

return Shop
