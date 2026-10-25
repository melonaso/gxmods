--!strict
-- Un superviviente puede ser un Player o un NPC (Model). Estas funciones
-- ocultan la diferencia para Round, Crafting y Killer.

local Entity = {}

export type Entity = Instance -- Player | Model

function Entity.character(e: Entity): Model?
	if e:IsA("Player") then
		return e.Character
	end
	return if e:IsA("Model") then e else nil
end

function Entity.humanoid(e: Entity): Humanoid?
	local character = Entity.character(e)
	return character and character:FindFirstChildOfClass("Humanoid")
end

function Entity.root(e: Entity): BasePart?
	local character = Entity.character(e)
	local root = character and character:FindFirstChild("HumanoidRootPart")
	return if root and root:IsA("BasePart") then root else nil
end

function Entity.name(e: Entity): string
	if e:IsA("Player") then
		return e.DisplayName
	end
	local humanoid = Entity.humanoid(e)
	return if humanoid and humanoid.DisplayName ~= "" then humanoid.DisplayName else e.Name
end

function Entity.isPlayer(e: Entity): boolean
	return e:IsA("Player")
end

function Entity.exists(e: Entity): boolean
	return e.Parent ~= nil
end

return Entity
