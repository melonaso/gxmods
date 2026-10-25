--!strict
-- Ensambla el modelo ServerStorage.VerityCharacter: crea los Motor6D y las
-- soldaduras a partir de los atributos que escribe tools/verity_rig.py.
-- Debe llamarse ANTES de mover el modelo (las posiciones de los pivotes
-- están en el espacio original del modelo, pies en el origen).

local CollectionService = game:GetService("CollectionService")

local VerityRig = {}

function VerityRig.assemble(model: Model): BasePart
	local root = model:FindFirstChild("HumanoidRootPart") :: BasePart
	assert(root, "VerityCharacter necesita HumanoidRootPart")

	for _, part in model:GetChildren() do
		if not part:IsA("BasePart") then
			continue
		end
		part.Anchored = false
		local parentName = part:GetAttribute("JointParent")
		local weldTo = part:GetAttribute("WeldTo")
		if typeof(parentName) == "string" then
			local parent = model:FindFirstChild(parentName) :: BasePart
			local pivot = CFrame.new(part:GetAttribute("JointPivot") :: Vector3)
			local motor = Instance.new("Motor6D")
			motor.Name = (part:GetAttribute("Motor") :: string?) or part.Name
			motor.Part0 = parent
			motor.Part1 = part
			motor.C0 = parent.CFrame:Inverse() * pivot
			motor.C1 = part.CFrame:Inverse() * pivot
			motor.Parent = part
		elseif typeof(weldTo) == "string" then
			local weld = Instance.new("WeldConstraint")
			weld.Part0 = model:FindFirstChild(weldTo) :: BasePart
			weld.Part1 = part
			weld.Parent = part
		end
	end

	model.PrimaryPart = root
	CollectionService:AddTag(model, "VerityRig")
	return root
end

return VerityRig
