--!strict
-- Escondites (armarios, taquillas, ataúdes, confesionarios). Un superviviente
-- (jugador o NPC) se mete con el ProximityPrompt "Esconderse": queda quieto e
-- invisible dentro. Sale con el mismo prompt ("Salir"). Verity no ve el
-- prompt, pero si se planta delante del escondite y pulsa Q, saca a quien
-- esté dentro (Killer lo encuentra porque su raíz está ahí).

local Players = game:GetService("Players")

local Entity = require(script.Parent.Parent.Lib.Entity)

export type Spot = {
	model: Model,
	door: BasePart,
	hidePoint: BasePart,
	exitPoint: BasePart,
	prompt: ProximityPrompt,
	occupant: Instance?,
}

export type Context = {
	isSurvivor: (Instance) -> boolean,
}

local Hiding = {}

local spots: { Spot } = {}
local byOccupant: { [Instance]: Spot } = {}
local saved: { [Instance]: { [BasePart]: number } } = {}
local connections: { RBXScriptConnection } = {}
local ctx: Context? = nil

local function setVisible(character: Model, who: Instance, visible: boolean)
	if visible then
		for part, value in saved[who] or {} do
			if part.Parent then
				part.Transparency = value
			end
		end
		saved[who] = nil
		for _, inst in character:GetDescendants() do
			if inst:IsA("Decal") then
				inst.Transparency = 0
			end
		end
	else
		local list: { [BasePart]: number } = {}
		for _, inst in character:GetDescendants() do
			if inst:IsA("BasePart") then
				list[inst] = inst.Transparency
				inst.Transparency = 1
			elseif inst:IsA("Decal") then
				inst.Transparency = 1
			end
		end
		saved[who] = list
	end
	-- durante la ronda nadie lleva etiqueta de nombre (ver Round), así que
	-- tampoco se restaura al salir del escondite
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if humanoid then
		humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
	end
end

local function refreshPrompt(spot: Spot)
	spot.prompt.ActionText = if spot.occupant then "Salir" else "Esconderse"
	spot.prompt.ObjectText = if spot.occupant then "Escondido" else "Escondite"
end

function Hiding.isHidden(who: Instance): boolean
	return byOccupant[who] ~= nil
end

function Hiding.hide(who: Instance, spot: Spot): boolean
	local context = ctx
	if not context or spot.occupant or byOccupant[who] or not context.isSurvivor(who) then
		return false
	end
	local character = Entity.character(who)
	local root = Entity.root(who)
	if not (character and root) or root.Anchored then
		return false
	end
	spot.occupant = who
	byOccupant[who] = spot
	root.Anchored = true
	character:PivotTo(spot.hidePoint.CFrame)
	setVisible(character, who, false)
	character:SetAttribute("Hidden", true)
	refreshPrompt(spot)
	return true
end

-- Sale del escondite. keepAnchored: lo usa Verity al sacarte (te sujeta ella).
function Hiding.unhide(who: Instance, keepAnchored: boolean?)
	local spot = byOccupant[who]
	if not spot then
		return
	end
	byOccupant[who] = nil
	spot.occupant = nil
	refreshPrompt(spot)
	local character = Entity.character(who)
	if character then
		setVisible(character, who, true)
		character:SetAttribute("Hidden", nil)
		if not keepAnchored then
			character:PivotTo(spot.exitPoint.CFrame)
			local root = Entity.root(who)
			if root and root:GetAttribute("Grabbed") ~= true then
				root.Anchored = false
			end
		end
	end
end

-- Escondites libres (para la IA de los NPCs).
function Hiding.freeSpots(): { Spot }
	local list = {}
	for _, spot in spots do
		if not spot.occupant and spot.model.Parent then
			table.insert(list, spot)
		end
	end
	return list
end

function Hiding.start(map: Instance, context: Context)
	Hiding.stop()
	ctx = context
	for _, inst in map:GetDescendants() do
		if inst:IsA("Model") and inst:GetAttribute("HideSpot") then
			local door = inst:FindFirstChild("Door")
			local hidePoint = inst:FindFirstChild("HidePoint")
			local exitPoint = inst:FindFirstChild("ExitPoint")
			if not (door and door:IsA("BasePart") and hidePoint and hidePoint:IsA("BasePart") and exitPoint and exitPoint:IsA("BasePart")) then
				continue
			end
			local prompt = Instance.new("ProximityPrompt")
			prompt.HoldDuration = 0.35
			prompt.MaxActivationDistance = 7
			prompt.RequiresLineOfSight = false
			prompt.KeyboardKeyCode = Enum.KeyCode.R
			prompt.Parent = door
			local spot: Spot = { model = inst, door = door, hidePoint = hidePoint, exitPoint = exitPoint, prompt = prompt, occupant = nil }
			refreshPrompt(spot)
			table.insert(spots, spot)
			table.insert(connections, prompt.Triggered:Connect(function(player)
				if spot.occupant == player then
					Hiding.unhide(player)
				elseif not spot.occupant then
					Hiding.hide(player, spot)
				end
			end))
		end
	end
end

function Hiding.stop()
	for who in byOccupant do
		Hiding.unhide(who)
	end
	for _, c in connections do
		c:Disconnect()
	end
	table.clear(connections)
	table.clear(spots)
	table.clear(byOccupant)
	table.clear(saved)
	ctx = nil
end

function Hiding.init()
	Players.PlayerRemoving:Connect(function(player)
		local spot = byOccupant[player]
		if spot then
			spot.occupant = nil
			byOccupant[player] = nil
			refreshPrompt(spot)
		end
	end)
end

return Hiding
