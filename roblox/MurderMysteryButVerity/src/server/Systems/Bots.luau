--!strict
-- NPCs supervivientes para el modo prueba. Cada uno:
--   1. huye si Verity está cerca (ya liberada),
--   2. si lleva menos oro del máximo, va por el bloque más cercano,
--   3. si lleva oro, lo deposita en la mesa más cercana,
--   4. si hay una mesa llena, craftea el tótem (se queda quieto 3 s),
--   5. si no, deambula.

local PathfindingService = game:GetService("PathfindingService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Crafting = require(script.Parent.Crafting)
local Hiding = require(script.Parent.Hiding)

export type Context = {
	parent: Instance,
	killerRoot: () -> BasePart?,
	killerReleased: () -> boolean,
	isAlive: (Model) -> boolean,
	points: { Vector3 }, -- puntos transitables del mapa para huir / deambular
}

local M = Config.Movement
local FLEE_RADIUS = 34
local REACH = 5.5

local NAMES = { "Lucas", "Sofía", "Mateo", "Valentina", "Diego", "Camila", "Tomás", "Isabella", "Martín", "Lucía", "Emma", "Leo" }

-- Animaciones R15 por defecto de Roblox (públicas, sirven en cualquier juego).
local ANIM_IDLE = "rbxassetid://507766666"
local ANIM_WALK = "rbxassetid://507777826"
local ANIM_RUN = "rbxassetid://507767714"

local Bots = {}

local running = false
local rng = Random.new()

local function randomDescription(): HumanoidDescription
	local desc = Instance.new("HumanoidDescription")
	local skin = Color3.fromHSV(rng:NextNumber(0.03, 0.1), rng:NextNumber(0.2, 0.6), rng:NextNumber(0.45, 0.95))
	desc.HeadColor = skin
	desc.LeftArmColor = skin
	desc.RightArmColor = skin
	local shirt = Color3.fromHSV(rng:NextNumber(), rng:NextNumber(0.4, 0.8), rng:NextNumber(0.5, 0.9))
	desc.TorsoColor = shirt
	local pants = Color3.fromHSV(rng:NextNumber(), rng:NextNumber(0.2, 0.5), rng:NextNumber(0.2, 0.5))
	desc.LeftLegColor = pants
	desc.RightLegColor = pants
	return desc
end

local function setupAnimations(humanoid: Humanoid)
	local animator = humanoid:FindFirstChildOfClass("Animator") or Instance.new("Animator")
	animator.Parent = humanoid
	local function load(id: string): AnimationTrack
		local anim = Instance.new("Animation")
		anim.AnimationId = id
		local track = animator:LoadAnimation(anim)
		track.Looped = true
		return track
	end
	local idle, walk, run = load(ANIM_IDLE), load(ANIM_WALK), load(ANIM_RUN)
	idle:Play()
	local currentTrack = idle
	humanoid.Running:Connect(function(speed)
		local nextTrack = if speed < 0.5 then idle elseif speed > 18 then run else walk
		if nextTrack ~= currentTrack then
			currentTrack:Stop(0.2)
			nextTrack:Play(0.2)
			currentTrack = nextTrack
		end
	end)
end

local function nearest<T>(from: Vector3, items: { T }, position: (T) -> Vector3): (T?, number)
	local best: T? = nil
	local bestDistance = math.huge
	for _, item in items do
		local d = (position(item) - from).Magnitude
		if d < bestDistance then
			best, bestDistance = item, d
		end
	end
	return best, bestDistance
end

-- Camina hacia `target` con pathfinding. Devuelve cuando llega, falla o
-- `interrupt()` devuelve true.
local function walkTo(humanoid: Humanoid, root: BasePart, target: Vector3, interrupt: () -> boolean)
	local path = PathfindingService:CreatePath({ AgentRadius = 2, AgentHeight = 5.5, AgentCanJump = false, WaypointSpacing = 6 })
	local ok = pcall(path.ComputeAsync, path, root.Position, target)
	local waypoints = if ok and path.Status == Enum.PathStatus.Success then path:GetWaypoints() else nil
	if not waypoints then
		humanoid:MoveTo(target)
		local deadline = os.clock() + 2
		while running and os.clock() < deadline and (root.Position - target).Magnitude > REACH and not interrupt() do
			task.wait(0.1)
		end
		return
	end
	for i, waypoint in waypoints do
		if i == 1 then
			continue
		end
		humanoid:MoveTo(waypoint.Position)
		local deadline = os.clock() + 1.5
		while running and os.clock() < deadline do
			if interrupt() or root.Anchored or humanoid.Health <= 0 then
				return
			end
			if ((root.Position - waypoint.Position) * Vector3.new(1, 0, 1)).Magnitude < 2.5 then
				break
			end
			task.wait(0.05)
		end
	end
end

local function think(bot: Model, ctx: Context)
	local humanoid = bot:FindFirstChildOfClass("Humanoid") :: Humanoid
	local root = bot:FindFirstChild("HumanoidRootPart") :: BasePart

	local function threatened(): boolean
		local killer = ctx.killerRoot()
		if not killer or not ctx.killerReleased() then
			return false
		end
		-- con la Capa fantasma solo la notan si está muy cerca
		local invisible = killer.Parent ~= nil and (killer.Parent :: Instance):GetAttribute("Invisible") == true
		local radius = if invisible then 10 else FLEE_RADIUS
		return (killer.Position - root.Position).Magnitude < radius
	end

	while running and bot.Parent and ctx.isAlive(bot) and humanoid.Health > 0 do
		local killer = ctx.killerRoot()
		-- escondido: espera hasta que Verity lleve un rato lejos
		if Hiding.isHidden(bot) then
			local calm = 0
			while running and bot.Parent and Hiding.isHidden(bot) and ctx.isAlive(bot) do
				local k = ctx.killerRoot()
				local far = not k or (k.Position - root.Position).Magnitude > 50
				calm = if far then calm + 0.5 else 0
				if calm >= 5 then
					Hiding.unhide(bot)
					break
				end
				task.wait(0.5)
			end
			continue
		end
		if root.Anchored then
			task.wait(0.2) -- atrapado (cepo o en manos de Verity)
			continue
		end
		if killer and threatened() and rng:NextNumber() < 0.45 then
			-- intenta llegar a un escondite que no quede hacia Verity
			local best, bestDistance = nil, 32
			for _, spot in Hiding.freeSpots() do
				local d = (spot.exitPoint.Position - root.Position).Magnitude
				local towardKiller = (spot.exitPoint.Position - killer.Position).Magnitude < (root.Position - killer.Position).Magnitude * 0.7
				if d < bestDistance and not towardKiller then
					best, bestDistance = spot, d
				end
			end
			if best then
				humanoid.WalkSpeed = M.BotFlee
				walkTo(humanoid, root, best.exitPoint.Position, function()
					return best.occupant ~= nil
				end)
				if (root.Position - best.exitPoint.Position).Magnitude < 6 and Hiding.hide(bot, best) then
					continue
				end
			end
		end
		if killer and threatened() then
			-- huir: el punto más lejano de Verity que quede "hacia afuera"
			humanoid.WalkSpeed = M.BotFlee
			local away = (root.Position - killer.Position) * Vector3.new(1, 0, 1)
			away = if away.Magnitude > 0.1 then away.Unit else Vector3.xAxis
			local best, bestScore = nil, -math.huge
			for _, p in ctx.points do
				local offset = (p - root.Position) * Vector3.new(1, 0, 1)
				if offset.Magnitude > 8 then
					local score = offset.Unit:Dot(away) * 30 + (p - killer.Position).Magnitude - offset.Magnitude * 0.3
					if score > bestScore then
						best, bestScore = p, score
					end
				end
			end
			if best then
				walkTo(humanoid, root, best, function()
					return not threatened()
				end)
			end
			continue
		end

		humanoid.WalkSpeed = M.BotWalk
		local gold = (bot:GetAttribute("Gold") :: number?) or 0
		local maxGold = Config.Crafting.MaxGoldCarried
		local fullTable = nil
		local tables = Crafting.tables()
		for _, state in tables do
			if state.gold >= Config.Crafting.GoldPerTotem then
				fullTable = state
				break
			end
		end

		if fullTable and Crafting.canCraft() then
			walkTo(humanoid, root, fullTable.top.Position, threatened)
			if (root.Position - fullTable.top.Position).Magnitude < 8 and not threatened() then
				humanoid:MoveTo(root.Position)
				local finish = os.clock() + Config.Crafting.CraftHoldDuration
				while running and os.clock() < finish and not threatened() and not root.Anchored do
					task.wait(0.1)
				end
				if os.clock() >= finish then
					Crafting.craft(bot, fullTable)
				end
			end
		elseif gold > 0 and (gold >= maxGold or #Crafting.goldBlocks() == 0) and #tables > 0 then
			local target = nearest(root.Position, tables, function(t)
				return t.top.Position
			end)
			if target then
				walkTo(humanoid, root, target.top.Position, threatened)
				if (root.Position - target.top.Position).Magnitude < 8 then
					Crafting.deposit(bot, target)
				end
			end
		else
			local block = nearest(root.Position, Crafting.goldBlocks(), function(b)
				return b.Position
			end)
			if block and gold < maxGold then
				walkTo(humanoid, root, block.Position, function()
					return threatened() or block.Parent == nil
				end)
				if block.Parent and (root.Position - block.Position).Magnitude < REACH + 1 then
					Crafting.pickup(bot, block)
				end
			elseif #ctx.points > 0 then
				walkTo(humanoid, root, ctx.points[rng:NextInteger(1, #ctx.points)], threatened)
			end
		end
		task.wait(0.1)
	end
end

function Bots.spawn(count: number, spawns: { CFrame }, ctx: Context): { Model }
	running = true
	local bots = {}
	local names = table.clone(NAMES)
	for i = 1, count do
		local ok, bot = pcall(function()
			return Players:CreateHumanoidModelFromDescription(randomDescription(), Enum.HumanoidRigType.R15)
		end)
		if not ok or not bot then
			warn(`[Bots] no se pudo crear el NPC: {bot}`)
			continue
		end
		local nameIndex = rng:NextInteger(1, #names)
		local name = table.remove(names, nameIndex) or `NPC {i}`
		bot.Name = `NPC_{name}`
		bot:SetAttribute("IsBot", true)
		game:GetService("CollectionService"):AddTag(bot, "Bot")
		bot:SetAttribute("Gold", 0)
		local humanoid = bot:FindFirstChildOfClass("Humanoid") :: Humanoid
		humanoid.DisplayName = `{name} (NPC)`
		humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None -- Verity no ve etiquetas
		humanoid.WalkSpeed = M.BotWalk
		humanoid.BreakJointsOnDeath = false
		bot:PivotTo(spawns[(i - 1) % #spawns + 1] + Vector3.new(rng:NextNumber(-2, 2), 0, rng:NextNumber(-2, 2)))
		bot.Parent = ctx.parent
		local root = bot:FindFirstChild("HumanoidRootPart") :: BasePart
		pcall(root.SetNetworkOwner, root, nil)
		setupAnimations(humanoid)
		table.insert(bots, bot)
	end
	return bots
end

function Bots.startAI(bots: { Model }, ctx: Context)
	for _, bot in bots do
		task.spawn(think, bot, ctx)
	end
end

function Bots.stop()
	running = false
end

return Bots
