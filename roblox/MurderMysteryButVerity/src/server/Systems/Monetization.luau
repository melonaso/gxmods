--!strict
-- Pases de juego (multiplicador permanente de probabilidad) y productos
-- consumibles (Poción de Verity).

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Net = require(ReplicatedStorage.Shared.Net)
local PlayerData = require(script.Parent.PlayerData)

local Monetization = {}

local function refreshPasses(player: Player)
	local best = 1
	for _, pass in Config.GamePasses do
		local owned = false
		if pass.Id ~= 0 then
			local ok, result = pcall(MarketplaceService.UserOwnsGamePassAsync, MarketplaceService, player.UserId, pass.Id)
			owned = ok and result == true
		end
		player:SetAttribute("Pass_" .. pass.Key, owned)
		if owned then
			best = math.max(best, pass.Multiplier)
		end
	end
	player:SetAttribute("PassMultiplier", best)
	PlayerData.setPassMultiplier(player, best)
end

local function findProduct(productId: number)
	for _, product in Config.Products do
		if product.Id == productId then
			return product
		end
	end
	return nil
end

local function processReceipt(receipt): Enum.ProductPurchaseDecision
	local player = Players:GetPlayerByUserId(receipt.PlayerId)
	local product = findProduct(receipt.ProductId)
	if not player or not product or not PlayerData.isLoaded(player) then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	if player:GetAttribute("DataUnsaved") then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	if PlayerData.grantProduct(player, receipt.PurchaseId, product.Multiplier, product.Rounds) then
		Net.get("Notify"):FireClient(player, `{product.Title} activada: x{product.Multiplier} en tus próximas {product.Rounds} ronda(s).`, "good")
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end
	return Enum.ProductPurchaseDecision.NotProcessedYet
end

function Monetization.init()
	MarketplaceService.ProcessReceipt = processReceipt

	MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, passId, purchased)
		if not purchased then
			return
		end
		for _, pass in Config.GamePasses do
			if pass.Id == passId then
				refreshPasses(player)
				Net.get("Notify"):FireClient(player, `¡{pass.Title} activado!`, "good")
				return
			end
		end
	end)

	Players.PlayerAdded:Connect(function(player)
		-- Espera a que PlayerData cargue para que el multiplicador cuente.
		local deadline = os.clock() + 30
		while player.Parent and not PlayerData.isLoaded(player) and os.clock() < deadline do
			task.wait(0.25)
		end
		if player.Parent then
			refreshPasses(player)
		end
	end)
	for _, player in Players:GetPlayers() do
		task.spawn(refreshPasses, player)
	end
end

return Monetization
