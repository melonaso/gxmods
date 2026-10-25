--!strict
-- Objetos de la tienda (Tools). Cada jugador recibe los objetos que tiene
-- equipados al aparecer (lobby y rondas, también como Verity). Todo el
-- efecto ocurre en el servidor; el cliente solo dibuja efectos.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Net = require(ReplicatedStorage.Shared.Net)
local Movement = require(script.Parent.Movement)
local PlayerData = require(script.Parent.PlayerData)

local Items = {}

type ItemDef = { Key: string, Title: string, Description: string, Color: Color3 }

local defs: { [string]: ItemDef } = {}
for _, item in Config.Items do
	defs[item.Key] = item :: any
end

local cooldowns: { [Player]: { [string]: number } } = {}
local traps: { [Player]: { BasePart } } = {}
local trapFolder: Folder? = nil

local function notify(player: Player, text: string, kind: string?)
	Net.get("Notify"):FireClient(player, text, kind or "info")
end

local function ready(player: Player, key: string, seconds: number): boolean
	local list = cooldowns[player]
	if not list then
		list = {}
		cooldowns[player] = list
	end
	local now = os.clock()
	local readyAt = list[key] or 0
	if now < readyAt then
		notify(player, `Recargando... {math.ceil(readyAt - now)} s`, "warn")
		return false
	end
	list[key] = now + seconds
	return true
end

local function characterParts(character: Model): { BasePart }
	local list = {}
	for _, inst in character:GetDescendants() do
		if inst:IsA("BasePart") and inst.Name ~= "HumanoidRootPart" then
			table.insert(list, inst)
		end
	end
	return list
end

local function inRound(): boolean
	return Workspace:GetAttribute("Phase") == "Playing"
end

-- ¿Es `model` un superviviente vivo (jugador o NPC)?
local function isSurvivorCharacter(model: Model): boolean
	local humanoid = model:FindFirstChildOfClass("Humanoid")
	if not humanoid or humanoid.Health <= 0 then
		return false
	end
	if model:GetAttribute("IsBot") then
		return true
	end
	local player = Players:GetPlayerFromCharacter(model)
	return player ~= nil and player:GetAttribute("Role") == "Survivor"
end

local function survivorCharacters(): { Model }
	local list = {}
	for _, player in Players:GetPlayers() do
		if player:GetAttribute("Role") == "Survivor" and player.Character then
			table.insert(list, player.Character)
		end
	end
	for _, inst in Workspace:GetDescendants() do
		if inst:IsA("Model") and inst:GetAttribute("IsBot") and isSurvivorCharacter(inst) then
			table.insert(list, inst)
		end
	end
	return list
end

-- Construcción de la herramienta ------------------------------------------

local function makeHandle(def: ItemDef): Part
	local handle = Instance.new("Part")
	handle.Name = "Handle"
	handle.Size = Vector3.new(0.7, 0.7, 1.6)
	handle.Color = def.Color
	handle.Material = Enum.Material.Metal
	handle.CanCollide = false
	handle.Massless = true
	local function decor(size: Vector3, offset: CFrame, color: Color3, material: Enum.Material)
		local p = Instance.new("Part")
		p.Size = size
		p.Color = color
		p.Material = material
		p.CanCollide = false
		p.Massless = true
		p.CFrame = handle.CFrame * offset
		local weld = Instance.new("WeldConstraint")
		weld.Part0 = handle
		weld.Part1 = p
		weld.Parent = p
		p.Parent = handle
	end
	local key = def.Key
	if key == "SpeedCoil" or key == "GravityCoil" or key == "FusionCoil" then
		-- bobina: anillos de neón alrededor de un núcleo
		handle.Size = Vector3.new(0.5, 0.5, 1.8)
		for i = -2, 2 do
			decor(Vector3.new(0.25, 1.1, 1.1), CFrame.new(0, 0, i * 0.35) * CFrame.Angles(0, math.rad(90), 0), def.Color, Enum.Material.Neon)
		end
	elseif key == "Medkit" then
		handle.Size = Vector3.new(1.4, 1, 0.6)
		handle.Color = Color3.fromRGB(240, 240, 240)
		decor(Vector3.new(0.9, 0.25, 0.65), CFrame.new(), Color3.fromRGB(220, 30, 40), Enum.Material.SmoothPlastic)
		decor(Vector3.new(0.25, 0.9, 0.65), CFrame.new(), Color3.fromRGB(220, 30, 40), Enum.Material.SmoothPlastic)
	elseif key == "EnergyDrink" then
		handle.Shape = Enum.PartType.Cylinder
		handle.Size = Vector3.new(1.2, 0.6, 0.6)
		handle.Material = Enum.Material.Foil
	elseif key == "Flashlight" then
		handle.Size = Vector3.new(0.45, 0.45, 1.8)
		handle.Color = Color3.fromRGB(40, 40, 45)
		decor(Vector3.new(0.6, 0.6, 0.2), CFrame.new(0, 0, -0.9), def.Color, Enum.Material.Neon)
		local light = Instance.new("SpotLight")
		light.Name = "Beam"
		light.Face = Enum.NormalId.Front
		light.Range = 50
		light.Angle = 50
		light.Brightness = 3
		light.Color = Color3.fromRGB(255, 240, 210)
		light.Enabled = false
		light.Shadows = true
		light.Parent = handle
	elseif key == "BearTrap" then
		handle.Size = Vector3.new(1.4, 0.3, 1.4)
		decor(Vector3.new(1.4, 0.4, 0.15), CFrame.new(0, 0.3, 0.55), Color3.fromRGB(180, 180, 190), Enum.Material.Metal)
		decor(Vector3.new(1.4, 0.4, 0.15), CFrame.new(0, 0.3, -0.55), Color3.fromRGB(180, 180, 190), Enum.Material.Metal)
	elseif key == "PushHammer" then
		handle.Size = Vector3.new(0.3, 0.3, 3)
		handle.Color = Color3.fromRGB(110, 75, 45)
		handle.Material = Enum.Material.Wood
		decor(Vector3.new(1.4, 1, 1), CFrame.new(0, 0, -1.4), def.Color, Enum.Material.Metal)
	else
		decor(Vector3.new(0.5, 0.5, 0.5), CFrame.new(0, 0, -0.9), def.Color, Enum.Material.Neon)
	end
	return handle
end

local function setGravity(character: Model, factor: number?)
	local root = character:FindFirstChild("HumanoidRootPart")
	if not (root and root:IsA("BasePart")) then
		return
	end
	local existing = root:FindFirstChild("CoilLift")
	if existing then
		existing:Destroy()
	end
	local attachment = root:FindFirstChild("CoilAttachment") :: Attachment?
	if factor then
		if not attachment then
			local a = Instance.new("Attachment")
			a.Name = "CoilAttachment"
			a.Parent = root
			attachment = a
		end
		local force = Instance.new("VectorForce")
		force.Name = "CoilLift"
		force.Attachment0 = attachment
		force.RelativeTo = Enum.ActuatorRelativeTo.World
		force.ApplyAtCenterOfMass = true
		force.Force = Vector3.new(0, root.AssemblyMass * Workspace.Gravity * (1 - factor), 0)
		force.Parent = root
	end
end

local function ghost(character: Model, seconds: number)
	local saved: { [BasePart]: number } = {}
	for _, part in characterParts(character) do
		saved[part] = part.Transparency
		part.Transparency = math.max(part.Transparency, 0.9)
	end
	local skin = character:FindFirstChild("VeritySkin")
	if skin and skin:IsA("Highlight") then
		skin.Enabled = false
	end
	character:SetAttribute("Invisible", true)
	task.delay(seconds, function()
		for part, value in saved do
			if part.Parent then
				part.Transparency = value
			end
		end
		if skin and skin:IsA("Highlight") and skin.Parent then
			skin.Enabled = true
		end
		character:SetAttribute("Invisible", nil)
	end)
end

local function placeTrap(player: Player, character: Model)
	local root = character:FindFirstChild("HumanoidRootPart") :: BasePart?
	if not root then
		return
	end
	if not inRound() then
		notify(player, "Los cepos solo funcionan durante la ronda.", "warn")
		return
	end
	local list = traps[player] or {}
	traps[player] = list
	for i = #list, 1, -1 do
		if not list[i].Parent then
			table.remove(list, i)
		end
	end
	if #list >= 2 then
		notify(player, "Ya tienes 2 cepos colocados.", "warn")
		return
	end
	local params = RaycastParams.new()
	params.FilterDescendantsInstances = { character }
	local hit = Workspace:Raycast(root.Position, Vector3.new(0, -40, 0), params)
	if not hit then
		return
	end
	local folder = trapFolder
	if not folder then
		local f = Instance.new("Folder")
		f.Name = "Traps"
		f.Parent = Workspace
		trapFolder = f
		folder = f
	end
	local trap = Instance.new("Part")
	trap.Name = "BearTrap"
	trap.Anchored = true
	trap.CanCollide = false
	trap.Size = Vector3.new(3, 0.3, 3)
	trap.Color = Color3.fromRGB(120, 120, 130)
	trap.Material = Enum.Material.Metal
	trap.CFrame = CFrame.new(hit.Position + Vector3.new(0, 0.15, 0))
	for _, z in { -1.2, 1.2 } do
		local jaw = Instance.new("Part")
		jaw.Anchored = true
		jaw.CanCollide = false
		jaw.CanTouch = false
		jaw.Size = Vector3.new(3, 0.5, 0.15)
		jaw.Color = Color3.fromRGB(190, 190, 200)
		jaw.Material = Enum.Material.Metal
		jaw.CFrame = trap.CFrame * CFrame.new(0, 0.3, z)
		jaw.Parent = trap
	end
	trap.Parent = folder
	table.insert(list, trap)

	local sprung = false
	trap.Touched:Connect(function(other)
		if sprung then
			return
		end
		local model = other:FindFirstAncestorOfClass("Model")
		if not model or model == character or not isSurvivorCharacter(model) then
			return
		end
		local victimRoot = model:FindFirstChild("HumanoidRootPart") :: BasePart?
		if not victimRoot or victimRoot.Anchored then
			return
		end
		sprung = true
		victimRoot.Anchored = true
		Net.get("Effect"):FireAllClients("Trap", trap.Position)
		task.delay(3, function()
			if victimRoot.Parent and victimRoot:GetAttribute("Grabbed") ~= true then
				victimRoot.Anchored = false
			end
			trap:Destroy()
		end)
	end)
	notify(player, "Cepo colocado.", "good")
end

local function push(player: Player, character: Model)
	local root = character:FindFirstChild("HumanoidRootPart") :: BasePart?
	if not root then
		return
	end
	local forward = root.CFrame.LookVector * Vector3.new(1, 0, 1)
	forward = if forward.Magnitude > 0 then forward.Unit else Vector3.zAxis
	local function hit(model: Model)
		local targetRoot = model:FindFirstChild("HumanoidRootPart") :: BasePart?
		if not targetRoot or targetRoot.Anchored then
			return
		end
		local offset = (targetRoot.Position - root.Position) * Vector3.new(1, 0, 1)
		if offset.Magnitude > 12 or offset.Magnitude < 0.01 or offset.Unit:Dot(forward) < 0.3 then
			return
		end
		local velocity = forward * 90 + Vector3.new(0, 35, 0)
		local owner = Players:GetPlayerFromCharacter(model)
		if owner then
			-- el personaje lo simula su cliente: le pedimos que aplique el empujón
			Net.get("Effect"):FireClient(owner, "Knockback", velocity)
		else
			targetRoot.AssemblyLinearVelocity = velocity
		end
	end
	for _, other in Players:GetPlayers() do
		if other ~= player and other.Character then
			hit(other.Character)
		end
	end
	for _, inst in Workspace:GetDescendants() do
		if inst:IsA("Model") and inst:GetAttribute("IsBot") then
			hit(inst)
		end
	end
	Net.get("Effect"):FireAllClients("Push", root.Position + forward * 4)
end

local function radar(player: Player, character: Model)
	local targets: { Model } = {}
	if player:GetAttribute("Role") == "Verity" then
		targets = survivorCharacters()
	else
		for _, other in Players:GetPlayers() do
			if other:GetAttribute("Role") == "Verity" and other.Character then
				table.insert(targets, other.Character)
			end
		end
	end
	if #targets == 0 then
		notify(player, "El radar no detecta a nadie.", "info")
		return
	end
	Net.get("Effect"):FireClient(player, "Radar", targets)
end

local function build(player: Player, key: string): Tool?
	local def = defs[key]
	if not def then
		return nil
	end
	local tool = Instance.new("Tool")
	tool.Name = def.Title
	tool.ToolTip = def.Description
	tool.CanBeDropped = false
	tool:SetAttribute("ShopItem", key)
	makeHandle(def).Parent = tool

	local function character(): Model?
		local parent = tool.Parent
		return if parent and parent:IsA("Model") then parent else nil
	end

	tool.Equipped:Connect(function()
		local c = character()
		if not c then
			return
		end
		if key == "SpeedCoil" or key == "FusionCoil" then
			c:SetAttribute("SpeedMult", 1.35)
		end
		if key == "GravityCoil" or key == "FusionCoil" then
			setGravity(c, 0.3)
		end
		if key == "CoinMagnet" then
			c:SetAttribute("CoinMagnet", true)
		end
	end)
	tool.Unequipped:Connect(function()
		-- al desequipar, el Tool ya volvió a la mochila: usamos el personaje del jugador
		local c = player.Character
		if not c then
			return
		end
		if key == "SpeedCoil" or key == "FusionCoil" then
			c:SetAttribute("SpeedMult", nil)
		end
		if key == "GravityCoil" or key == "FusionCoil" then
			setGravity(c, nil)
		end
		if key == "CoinMagnet" then
			c:SetAttribute("CoinMagnet", nil)
		end
		if key == "Flashlight" then
			local beam = tool.Handle:FindFirstChild("Beam")
			if beam and beam:IsA("SpotLight") then
				beam.Enabled = false
			end
		end
	end)
	tool.Activated:Connect(function()
		local c = character()
		if not c then
			return
		end
		local humanoid = c:FindFirstChildOfClass("Humanoid")
		if key == "Medkit" and humanoid and ready(player, key, 20) then
			humanoid.Health = math.min(humanoid.MaxHealth, humanoid.Health + 50)
			Net.get("Effect"):FireClient(player, "Heal", (c:GetPivot()).Position)
		elseif key == "EnergyDrink" and ready(player, key, 30) then
			Movement.energize(player, 6)
			Net.get("Effect"):FireClient(player, "Heal", (c:GetPivot()).Position)
			notify(player, "¡Estamina infinita durante 6 s!", "good")
		elseif key == "Flashlight" then
			local beam = tool.Handle:FindFirstChild("Beam")
			if beam and beam:IsA("SpotLight") then
				beam.Enabled = not beam.Enabled
			end
		elseif key == "GhostCloak" and ready(player, key, 40) then
			ghost(c, 6)
		elseif key == "SoulRadar" and ready(player, key, 30) then
			radar(player, c)
		elseif key == "BearTrap" and ready(player, key, 2) then
			placeTrap(player, c)
		elseif key == "PushHammer" and ready(player, key, 8) then
			push(player, c)
		end
	end)
	return tool
end

-- Da al jugador los objetos que tiene equipados (sin duplicar).
function Items.give(player: Player)
	local data = PlayerData.get(player)
	local character = player.Character
	local backpack = player:FindFirstChildOfClass("Backpack")
	if not (data and character and backpack) then
		return
	end
	for _, container in { backpack, character } do
		for _, child in container:GetChildren() do
			if child:IsA("Tool") and child:GetAttribute("ShopItem") then
				child:Destroy()
			end
		end
	end
	character:SetAttribute("SpeedMult", nil)
	character:SetAttribute("CoinMagnet", nil)
	setGravity(character, nil)
	for _, key in data.equipped do
		if table.find(data.items, key) then
			local tool = build(player, key)
			if tool then
				tool.Parent = backpack
			end
		end
	end
end

function Items.cleanup()
	if trapFolder then
		trapFolder:Destroy()
		trapFolder = nil
	end
	table.clear(traps)
end

function Items.init()
	local function watch(player: Player)
		player.CharacterAdded:Connect(function()
			-- espera a que la mochila exista y a que los datos estén cargados
			task.wait(0.5)
			local deadline = os.clock() + 20
			while player.Parent and not PlayerData.isLoaded(player) and os.clock() < deadline do
				task.wait(0.5)
			end
			Items.give(player)
		end)
	end
	Players.PlayerAdded:Connect(watch)
	for _, player in Players:GetPlayers() do
		watch(player)
	end
	Players.PlayerRemoving:Connect(function(player)
		cooldowns[player] = nil
		traps[player] = nil
	end)
end

return Items
