--!strict
-- Puzzle de oro: los supervivientes recogen bloques de oro, los depositan
-- en mesas de crafteo y, con una mesa llena, craftean un tótem que resta
-- tiempo a la partida.

local CollectionService = game:GetService("CollectionService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Assets = require(ReplicatedStorage.Shared.Assets)
local Config = require(ReplicatedStorage.Shared.Config)
local Net = require(ReplicatedStorage.Shared.Net)

export type Context = {
	parent: Instance,
	goldSpawns: { Vector3 },
	tableSpots: { CFrame },
	survivorCount: number,
	isSurvivor: (Player) -> boolean,
	onTotem: (Player) -> boolean, -- devuelve false si no se pudo aplicar
	totemsCrafted: () -> number,
}

type TableState = {
	model: Model,
	top: BasePart,
	gold: number,
	label: TextLabel,
	deposit: ProximityPrompt,
	craft: ProximityPrompt,
}

local CFG = Config.Crafting
local GOLD_COLOR = Color3.fromRGB(255, 196, 46)

local Crafting = {}

local ctx: Context? = nil
local folder: Folder? = nil
local occupied: { [number]: BasePart } = {} -- índice de goldSpawn -> bloque
local tables: { TableState } = {}
local connections: { RBXScriptConnection } = {}
local active = false
local rng = Random.new()

local function setGold(player: Player, amount: number)
	player:SetAttribute("Gold", amount)
end

local function getGold(player: Player): number
	return (player:GetAttribute("Gold") :: number?) or 0
end

local function notify(player: Player, text: string, kind: string?)
	Net.get("Notify"):FireClient(player, text, kind or "info")
end

local spawnGoldAt: (index: number?, position: Vector3?) -> ()

local function freeSpawnIndex(): number?
	local context = ctx
	if not context then
		return nil
	end
	local free = {}
	for i = 1, #context.goldSpawns do
		if not occupied[i] then
			table.insert(free, i)
		end
	end
	if #free == 0 then
		return nil
	end
	return free[rng:NextInteger(1, #free)]
end

local function scheduleRespawn()
	task.delay(CFG.GoldRespawnDelay, function()
		local context = ctx
		if active and context and context.totemsCrafted() < CFG.MaxTotemsPerRound then
			spawnGoldAt(freeSpawnIndex(), nil)
		end
	end)
end

spawnGoldAt = function(index: number?, position: Vector3?)
	local context = ctx
	local parent = folder
	if not context or not parent then
		return
	end
	local pos = position or (index and context.goldSpawns[index])
	if not pos then
		return
	end

	local block = Instance.new("Part")
	block.Name = "GoldBlock"
	block.Size = Vector3.new(1.6, 1.6, 1.6)
	block.Anchored = true
	block.CanCollide = false
	block.Color = GOLD_COLOR
	block.Material = Enum.Material.Foil
	block.Reflectance = 0.15
	block.CFrame = CFrame.new(pos)

	local light = Instance.new("PointLight")
	light.Color = GOLD_COLOR
	light.Range = 9
	light.Brightness = 1.2
	light.Parent = block

	local sparkles = Instance.new("ParticleEmitter")
	if Assets.Sparkle ~= "" then
		sparkles.Texture = Assets.Sparkle
	end
	sparkles.Color = ColorSequence.new(Color3.fromRGB(255, 230, 140))
	sparkles.LightEmission = 1
	sparkles.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.3, 0.45), NumberSequenceKeypoint.new(1, 0) })
	sparkles.Lifetime = NumberRange.new(0.6, 1)
	sparkles.Rate = 4
	sparkles.Speed = NumberRange.new(0.5, 1.2)
	sparkles.SpreadAngle = Vector2.new(180, 180)
	sparkles.Parent = block

	local prompt = Instance.new("ProximityPrompt")
	prompt.ActionText = "Recoger oro"
	prompt.ObjectText = "Bloque de oro"
	prompt.HoldDuration = CFG.PickupHoldDuration
	prompt.MaxActivationDistance = 9
	prompt.RequiresLineOfSight = false
	prompt.Parent = block

	if index then
		occupied[index] = block
	end
	CollectionService:AddTag(block, "GoldBlock")
	block.Parent = parent

	table.insert(connections, prompt.Triggered:Connect(function(player)
		if not active or not block.Parent or not context.isSurvivor(player) then
			return
		end
		local carried = getGold(player)
		if carried >= CFG.MaxGoldCarried then
			notify(player, `Solo puedes llevar {CFG.MaxGoldCarried} bloques. ¡Llévalos a una mesa!`, "warn")
			return
		end
		setGold(player, carried + 1)
		if index then
			occupied[index] = nil
		end
		Net.get("Effect"):FireClient(player, "Pickup", block.Position)
		block:Destroy()
		scheduleRespawn()
	end))
end

local function refreshTable(state: TableState)
	local full = state.gold >= CFG.GoldPerTotem
	state.label.Text = if full then "¡Listo para craftear!" else `Oro {state.gold}/{CFG.GoldPerTotem}`
	state.label.TextColor3 = if full then Color3.fromRGB(120, 255, 200) else Color3.fromRGB(255, 220, 120)
	state.deposit.Enabled = not full
	state.craft.Enabled = full
end

local function buildTable(spot: CFrame, parent: Instance): TableState
	local model = Instance.new("Model")
	model.Name = "CraftingTable"

	local function piece(name: string, size: Vector3, offset: CFrame, color: Color3, material: Enum.Material): Part
		local p = Instance.new("Part")
		p.Name = name
		p.Anchored = true
		p.Size = size
		p.CFrame = spot * offset
		p.Color = color
		p.Material = material
		p.TopSurface = Enum.SurfaceType.Smooth
		p.Parent = model
		return p
	end

	local top = piece("Top", Vector3.new(6, 0.6, 4), CFrame.new(0, 3.2, 0), Color3.fromRGB(120, 82, 52), Enum.Material.WoodPlanks)
	for _, x in { -2.6, 2.6 } do
		for _, z in { -1.6, 1.6 } do
			piece("Leg", Vector3.new(0.6, 2.9, 0.6), CFrame.new(x, 1.45, z), Color3.fromRGB(80, 54, 36), Enum.Material.Wood)
		end
	end
	piece("Anvil", Vector3.new(2, 0.8, 1.2), CFrame.new(0, 3.9, 0), Color3.fromRGB(60, 62, 70), Enum.Material.Metal)
	local rune = piece("Rune", Vector3.new(5.4, 0.05, 3.4), CFrame.new(0, 3.53, 0), Color3.fromRGB(90, 220, 255), Enum.Material.Neon)
	rune.Transparency = 0.75
	model.PrimaryPart = top

	local light = Instance.new("PointLight")
	light.Color = Color3.fromRGB(110, 220, 255)
	light.Range = 14
	light.Brightness = 1.4
	light.Parent = top

	local billboard = Instance.new("BillboardGui")
	billboard.Size = UDim2.fromOffset(180, 34)
	billboard.StudsOffset = Vector3.new(0, 3.6, 0)
	billboard.MaxDistance = 70
	billboard.AlwaysOnTop = true
	billboard.Parent = top
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundColor3 = Color3.fromRGB(14, 12, 20)
	label.BackgroundTransparency = 0.3
	label.Font = Enum.Font.GothamBold
	label.TextScaled = true
	label.Parent = billboard
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0.5, 0)
	corner.Parent = label
	local padding = Instance.new("UIPadding")
	padding.PaddingTop = UDim.new(0, 6)
	padding.PaddingBottom = UDim.new(0, 6)
	padding.Parent = label

	local deposit = Instance.new("ProximityPrompt")
	deposit.ActionText = "Depositar oro"
	deposit.ObjectText = "Mesa de crafteo"
	deposit.HoldDuration = 0.4
	deposit.MaxActivationDistance = 10
	deposit.RequiresLineOfSight = false
	deposit.Parent = top

	local craft = Instance.new("ProximityPrompt")
	craft.ActionText = "Craftear tótem"
	craft.ObjectText = "Mesa de crafteo"
	craft.HoldDuration = CFG.CraftHoldDuration
	craft.MaxActivationDistance = 10
	craft.RequiresLineOfSight = false
	craft.KeyboardKeyCode = Enum.KeyCode.F
	craft.Parent = top

	model.Parent = parent
	local state: TableState = { model = model, top = top, gold = 0, label = label, deposit = deposit, craft = craft }
	refreshTable(state)
	return state
end

local function spawnTotemVisual(state: TableState)
	local totem = Instance.new("Part")
	totem.Name = "Totem"
	totem.Anchored = true
	totem.CanCollide = false
	totem.Size = Vector3.new(1.1, 2.4, 1.1)
	totem.Color = GOLD_COLOR
	totem.Material = Enum.Material.Foil
	totem.CFrame = state.top.CFrame * CFrame.new(rng:NextNumber(-2.2, 2.2), 1.5, rng:NextNumber(-1.2, 1.2))
	local eye = Instance.new("Part")
	eye.Anchored = true
	eye.CanCollide = false
	eye.Size = Vector3.new(0.7, 0.25, 0.1)
	eye.Material = Enum.Material.Neon
	eye.Color = Color3.fromRGB(90, 230, 255)
	eye.CFrame = totem.CFrame * CFrame.new(0, 0.6, -0.56)
	eye.Parent = totem
	totem.Parent = state.model
end

local function connectTable(state: TableState)
	local context = ctx :: Context
	table.insert(connections, state.deposit.Triggered:Connect(function(player)
		if not active or not context.isSurvivor(player) then
			return
		end
		local carried = getGold(player)
		if carried <= 0 then
			notify(player, "Necesitas bloques de oro. ¡Búscalos por la mansión!", "warn")
			return
		end
		local moved = math.min(carried, CFG.GoldPerTotem - state.gold)
		if moved <= 0 then
			return
		end
		state.gold += moved
		setGold(player, carried - moved)
		refreshTable(state)
	end))

	table.insert(connections, state.craft.Triggered:Connect(function(player)
		if not active or not context.isSurvivor(player) or state.gold < CFG.GoldPerTotem then
			return
		end
		if context.totemsCrafted() >= CFG.MaxTotemsPerRound then
			notify(player, "El reloj ya no puede acelerarse más esta ronda.", "warn")
			return
		end
		if not context.onTotem(player) then
			notify(player, "¡Ya casi amanece! El tótem no tendría efecto.", "warn")
			return
		end
		state.gold = 0
		refreshTable(state)
		spawnTotemVisual(state)
		Net.get("Effect"):FireAllClients("Totem", state.top.Position)
	end))
end

-- Suelta el oro que llevaba un superviviente al morir.
function Crafting.dropGold(player: Player, position: Vector3)
	local carried = getGold(player)
	setGold(player, 0)
	if not active then
		return
	end
	for i = 1, carried do
		local angle = (i / math.max(carried, 1)) * math.pi * 2
		spawnGoldAt(nil, position + Vector3.new(math.cos(angle) * 2, 0, math.sin(angle) * 2))
	end
end

function Crafting.start(context: Context)
	ctx = context
	active = true
	local f = Instance.new("Folder")
	f.Name = "Crafting"
	f.Parent = context.parent
	folder = f

	for _, spot in context.tableSpots do
		local state = buildTable(spot, f)
		table.insert(tables, state)
		connectTable(state)
	end

	local count = math.clamp(context.survivorCount * CFG.GoldPerSurvivor, CFG.GoldMinBlocks, CFG.GoldMaxBlocks)
	for _ = 1, math.min(count, #context.goldSpawns) do
		spawnGoldAt(freeSpawnIndex(), nil)
	end
end

function Crafting.stop()
	active = false
	for _, c in connections do
		c:Disconnect()
	end
	table.clear(connections)
	table.clear(tables)
	table.clear(occupied)
	if folder then
		folder:Destroy()
		folder = nil
	end
	ctx = nil
end

return Crafting
