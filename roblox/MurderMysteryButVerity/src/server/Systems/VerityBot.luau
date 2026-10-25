--!strict
-- Verity controlada por la IA (modo prueba, cuando el jugador elige ser
-- superviviente). Juega con las mismas reglas que una Verity humana:
--   - solo ve lo que tiene delante (raycast) y a quien está cerca; a quien
--     lleva la Capa fantasma solo lo nota a muy poca distancia
--   - persigue al superviviente visible más cercano y lo atrapa con el mismo
--     ataque (Killer.tryKill)
--   - si lo pierde de vista, va a donde lo vio por última vez; si se metió en
--     un escondite delante de ella, lo saca
--   - durante la revelación de cada minuto conoce la posición de todos
--   - si no ve a nadie, patrulla y de vez en cuando registra un escondite
-- Corre algo menos que una Verity humana esprintando, para que se le pueda
-- escapar con buena estamina y escondites.

local PathfindingService = game:GetService("PathfindingService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Entity = require(script.Parent.Parent.Lib.Entity)
local Hiding = require(script.Parent.Hiding)
local Killer = require(script.Parent.Killer)

export type Context = {
	survivors: () -> { Instance },
	points: { Vector3 }, -- puntos transitables del mapa para patrullar
}

local K = Config.Killer
local SIGHT = 95 -- distancia máxima de visión
local NOTICE = 14 -- a esta distancia nota a cualquiera, aunque no lo vea
local CLOAK_NOTICE = 9
local MEMORY = 7 -- segundos que recuerda dónde vio a alguien

local VerityBot = {}

local running = false
local rng = Random.new()

type Sighting = { position: Vector3, time: number, hidden: boolean }

local function now(): number
	return Workspace:GetServerTimeNow()
end

local function flat(v: Vector3): Vector3
	return Vector3.new(v.X, 0, v.Z)
end

local function run(model: Model, ctx: Context)
	local humanoid = model:FindFirstChildOfClass("Humanoid") :: Humanoid
	local root = (model.PrimaryPart or model:FindFirstChild("HumanoidRootPart")) :: BasePart?
	if not (humanoid and root) then
		return
	end
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	params.FilterDescendantsInstances = { model }
	local seen: { [Instance]: Sighting } = {}
	local path = PathfindingService:CreatePath({ AgentRadius = 3, AgentHeight = 16, AgentCanJump = false, WaypointSpacing = 8 })
	local waypoints: { PathWaypoint } = {}
	local waypointIndex = 0
	local pathGoal: Vector3? = nil
	local pathAt = 0
	local lastPosition = root.Position
	local stuckSince = os.clock()
	local patrolGoal: Vector3? = nil
	local checkSpotAt = 0

	local function eye(): Vector3
		return root.Position + Vector3.new(0, 5, 0)
	end

	local function canSee(target: Instance, targetRoot: BasePart): boolean
		local character = Entity.character(target)
		if not character or character:GetAttribute("Hidden") then
			return false
		end
		local offset = targetRoot.Position - root.Position
		local distance = offset.Magnitude
		if character:GetAttribute("Invisible") then
			return distance < CLOAK_NOTICE
		end
		if distance < NOTICE then
			return true
		end
		-- con la linterna encendida se le ve desde mucho más lejos
		if distance > (if character:GetAttribute("Flashlight") then SIGHT * 1.5 else SIGHT) then
			return false
		end
		-- campo de visión amplio (unos 220°): no ve lo que tiene justo detrás
		local forward = flat(root.CFrame.LookVector)
		if forward.Magnitude > 0.01 and flat(offset).Magnitude > 0.01 and flat(offset).Unit:Dot(forward.Unit) < -0.35 then
			return false
		end
		local hit = Workspace:Raycast(eye(), targetRoot.Position - eye(), params)
		return hit == nil or hit.Instance:IsDescendantOf(character)
	end

	local function moveTo(goal: Vector3)
		local t = os.clock()
		-- recalcula como mucho cada 0,8 s (o cada 2,5 s si el destino apenas se movió)
		local following = pathGoal ~= nil and waypointIndex <= #waypoints
		local sameGoal = pathGoal ~= nil and (pathGoal - goal).Magnitude < 6
		if following and (t - pathAt < 0.8 or (sameGoal and t - pathAt < 2.5)) then
			return
		end
		pathGoal = goal
		pathAt = t
		local feet = root.Position - Vector3.new(0, humanoid.HipHeight + root.Size.Y / 2 - 1, 0)
		local ok = pcall(path.ComputeAsync, path, feet, goal)
		if ok and path.Status == Enum.PathStatus.Success then
			waypoints = path:GetWaypoints()
			waypointIndex = 2
		else
			waypoints = {}
			waypointIndex = 1
			humanoid:MoveTo(goal)
		end
	end

	local function followPath()
		local waypoint = waypoints[waypointIndex]
		if not waypoint then
			return
		end
		-- la raíz va ~8 studs sobre el suelo: se compara en planta y con margen vertical (escaleras)
		if (flat(root.Position) - flat(waypoint.Position)).Magnitude < 4 and math.abs(root.Position.Y - waypoint.Position.Y) < 14 then
			waypointIndex += 1
			waypoint = waypoints[waypointIndex]
		end
		if waypoint then
			humanoid:MoveTo(waypoint.Position)
		end
	end

	local function face(position: Vector3)
		local look = flat(position - root.Position)
		if look.Magnitude > 0.1 then
			root.CFrame = CFrame.lookAt(root.Position, root.Position + look)
		end
	end

	local function attack(target: Vector3)
		face(target)
		Killer.tryKill(model)
	end

	while running and model.Parent and humanoid.Health > 0 do
		task.wait(0.15)
		if not model:GetAttribute("Released") or Killer.isKilling() then
			continue
		end
		-- el servidor simula a la Verity NPC (al anclarla para el ataque,
		-- Roblox puede volver a dar la física a un jugador cercano)
		if not root.Anchored and root:GetNetworkOwnershipAuto() then
			pcall(root.SetNetworkOwner, root, nil)
		end
		local t = now()

		-- ¿a quién ve o conoce ahora mismo?
		local best: Instance? = nil
		local bestRoot: BasePart? = nil
		local bestDistance = math.huge
		for _, survivor in ctx.survivors() do
			local targetRoot = Entity.root(survivor)
			local character = Entity.character(survivor)
			if not (targetRoot and character) or targetRoot:GetAttribute("Grabbed") then
				continue
			end
			local revealed = ((character:GetAttribute("RevealedUntil") :: number?) or 0) > t
			local visible = canSee(survivor, targetRoot)
			if visible or revealed then
				seen[survivor] = { position = targetRoot.Position, time = t, hidden = Hiding.isHidden(survivor) }
				local distance = (targetRoot.Position - root.Position).Magnitude
				if distance < bestDistance then
					best, bestRoot, bestDistance = survivor, targetRoot, distance
				end
			elseif seen[survivor] and Hiding.isHidden(survivor) and t - seen[survivor].time < 2.5 then
				-- se escondió justo delante de ella: sabe dónde está
				seen[survivor].hidden = true
			end
		end

		if best and bestRoot then
			-- persecución
			patrolGoal = nil
			humanoid.WalkSpeed = Config.Movement.VerityBotChase
			if bestDistance <= K.KillRange - 1.5 then
				humanoid:MoveTo(bestRoot.Position)
				attack(bestRoot.Position)
			elseif bestDistance < 28 and canSee(best, bestRoot) then
				humanoid:MoveTo(bestRoot.Position)
				waypoints = {}
			else
				moveTo(bestRoot.Position)
				followPath()
			end
		else
			-- ¿recuerda a alguien reciente?
			local memory: Sighting? = nil
			local who: Instance? = nil
			for survivor, sighting in seen do
				if t - sighting.time < MEMORY and (not memory or sighting.time > memory.time) then
					memory, who = sighting, survivor
				end
			end
			if memory and who then
				humanoid.WalkSpeed = Config.Movement.VerityBotChase
				local goal = memory.position
				local hiddenRoot = if memory.hidden and Hiding.isHidden(who) then Entity.root(who) else nil
				if hiddenRoot then
					goal = hiddenRoot.Position
				end
				if (flat(goal) - flat(root.Position)).Magnitude <= K.KillRange - 2 then
					if hiddenRoot then
						attack(hiddenRoot.Position) -- lo saca del escondite
					else
						seen[who] = nil -- llegó y no hay nadie
					end
				else
					moveTo(goal)
					followPath()
				end
			else
				-- patrulla
				humanoid.WalkSpeed = Config.Movement.VerityBotPatrol
				if not patrolGoal or (flat(patrolGoal) - flat(root.Position)).Magnitude < 8 then
					patrolGoal = if #ctx.points > 0 then ctx.points[rng:NextInteger(1, #ctx.points)] else nil
					-- a veces registra el escondite más cercano por si hay alguien dentro
					if os.clock() > checkSpotAt and rng:NextNumber() < 0.3 then
						checkSpotAt = os.clock() + 10
						local nearest, nearestDistance = nil, 40
						for _, spot in Hiding.allSpots() do
							local d = (spot.exitPoint.Position - root.Position).Magnitude
							if d < nearestDistance then
								nearest, nearestDistance = spot, d
							end
						end
						if nearest then
							patrolGoal = nearest.exitPoint.Position
							local occupant = nearest.occupant
							if occupant then
								seen[occupant] = { position = nearest.hidePoint.Position, time = t, hidden = true }
							end
						end
					end
				end
				if patrolGoal then
					moveTo(patrolGoal)
					followPath()
				end
			end
		end

		-- atascada contra algo: nuevo destino
		if (root.Position - lastPosition).Magnitude > 1.5 then
			lastPosition = root.Position
			stuckSince = os.clock()
		elseif os.clock() - stuckSince > 2.5 then
			stuckSince = os.clock()
			patrolGoal = nil
			pathGoal = nil
			humanoid.Jump = true
		end
	end
end

function VerityBot.start(model: Model, ctx: Context)
	running = true
	task.spawn(run, model, ctx)
end

function VerityBot.stop()
	running = false
end

return VerityBot
