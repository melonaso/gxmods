--!strict
-- Ayudas mínimas para construir UI por código con un estilo consistente.

local TweenService = game:GetService("TweenService")

local UI = {}

UI.Colors = {
	Panel = Color3.fromRGB(16, 13, 22),
	PanelLight = Color3.fromRGB(30, 25, 40),
	Stroke = Color3.fromRGB(255, 255, 255),
	Text = Color3.fromRGB(240, 236, 245),
	Muted = Color3.fromRGB(165, 156, 178),
	Verity = Color3.fromRGB(255, 59, 78),
	Survivor = Color3.fromRGB(70, 220, 190),
	Gold = Color3.fromRGB(255, 200, 60),
	Good = Color3.fromRGB(110, 230, 160),
	Warn = Color3.fromRGB(255, 190, 90),
}

UI.Font = Font.new("rbxasset://fonts/families/GothamSSm.json", Enum.FontWeight.Medium)
UI.FontBold = Font.new("rbxasset://fonts/families/GothamSSm.json", Enum.FontWeight.Bold)
UI.FontHeavy = Font.new("rbxasset://fonts/families/GothamSSm.json", Enum.FontWeight.Heavy)

function UI.new(className: string, props: { [string]: any }, children: { Instance }?): any
	local inst = Instance.new(className)
	local parent = props.Parent
	for k, v in props do
		if k ~= "Parent" then
			(inst :: any)[k] = v
		end
	end
	if children then
		for _, child in children do
			child.Parent = inst
		end
	end
	if parent then
		inst.Parent = parent
	end
	return inst
end

function UI.corner(radius: number?): UICorner
	return UI.new("UICorner", { CornerRadius = UDim.new(0, radius or 10) })
end

function UI.stroke(transparency: number?, color: Color3?): UIStroke
	return UI.new("UIStroke", {
		Color = color or UI.Colors.Stroke,
		Transparency = transparency or 0.88,
		Thickness = 1,
		ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
	})
end

function UI.padding(px: number): UIPadding
	local u = UDim.new(0, px)
	return UI.new("UIPadding", { PaddingTop = u, PaddingBottom = u, PaddingLeft = u, PaddingRight = u })
end

function UI.label(props: { [string]: any }): TextLabel
	local defaults = {
		BackgroundTransparency = 1,
		FontFace = UI.Font,
		TextColor3 = UI.Colors.Text,
		TextSize = 16,
		Text = "", -- evita el "Label" por defecto de Roblox
	}
	for k, v in props do
		defaults[k] = v
	end
	return UI.new("TextLabel", defaults)
end

function UI.tween(inst: Instance, time: number, goal: { [string]: any }, style: Enum.EasingStyle?): Tween
	local tween = TweenService:Create(inst, TweenInfo.new(time, style or Enum.EasingStyle.Quint, Enum.EasingDirection.Out), goal)
	tween:Play()
	return tween
end

return UI
