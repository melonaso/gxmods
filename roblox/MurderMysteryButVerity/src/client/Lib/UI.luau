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

local TEXT_CLASSES = { TextLabel = true, TextButton = true, TextBox = true }

function UI.new(className: string, props: { [string]: any }, children: { Instance }?): any
	local inst = Instance.new(className)
	if TEXT_CLASSES[className] then
		-- los textos ya llegan traducidos por Locale.t: Roblox no debe volver a
		-- traducirlos ni capturarlos (evita entradas duplicadas en la tabla)
		(inst :: any).AutoLocalize = false
	end
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

-- Animaciones -------------------------------------------------------------
-- Todas usan UIScale y posiciones (no solo transparencias): así se ven
-- también en equipos donde Roblox ignora la transparencia de CanvasGroup.
-- UIScale escala alrededor del AnchorPoint del objeto.

-- UIScale del objeto (lo crea si no tiene).
function UI.scaleOf(inst: GuiObject): UIScale
	local scale = inst:FindFirstChildOfClass("UIScale")
	if scale then
		return scale
	end
	return UI.new("UIScale", { Parent = inst })
end

-- Latido: crece de golpe y vuelve a su tamaño con un pequeño rebote.
function UI.pulse(inst: GuiObject, amount: number?)
	local scale = UI.scaleOf(inst)
	scale.Scale = amount or 1.12
	UI.tween(scale, 0.4, { Scale = 1 }, Enum.EasingStyle.Back)
end

-- Muestra u oculta con animación: aparece con rebote y desaparece
-- encogiéndose. Se puede llamar en cada actualización: solo anima cuando el
-- estado cambia.
local shownState: { [GuiObject]: boolean } = setmetatable({}, { __mode = "k" }) :: any

function UI.show(inst: GuiObject, visible: boolean)
	local current = shownState[inst]
	if current == nil then
		current = inst.Visible
	end
	shownState[inst] = visible
	if current == visible then
		return
	end
	local scale = UI.scaleOf(inst)
	if visible then
		inst.Visible = true
		scale.Scale = 0.6
		UI.tween(scale, 0.35, { Scale = 1 }, Enum.EasingStyle.Back)
	else
		TweenService:Create(scale, TweenInfo.new(0.15, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { Scale = 0 }):Play()
		-- se oculta por tiempo, no al acabar la animación: si otra animación
		-- (un latido, el ratón encima) la interrumpe, igualmente desaparece
		task.delay(0.16, function()
			if shownState[inst] == false then
				inst.Visible = false
			end
		end)
	end
end

-- Botón vivo: crece al pasar el ratón por encima y se hunde al pulsarlo
-- (ratón o pantalla táctil).
function UI.animateButton(button: GuiButton)
	if button:GetAttribute("Animated") then
		return
	end
	button:SetAttribute("Animated", true)
	local scale = UI.scaleOf(button)
	local hovered, pressed = false, false
	local function refresh()
		local target = if pressed then 0.92 elseif hovered then 1.06 else 1
		UI.tween(scale, if pressed then 0.08 else 0.25, { Scale = target }, if pressed then Enum.EasingStyle.Quad else Enum.EasingStyle.Back)
	end
	button.InputBegan:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.MouseMovement then
			hovered = true
		elseif input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
			pressed = true
		else
			return
		end
		refresh()
	end)
	button.InputEnded:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.MouseMovement then
			hovered = false
		elseif input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
			pressed = false
		else
			return
		end
		refresh()
	end)
end

-- Anima todos los botones de `root`, también los que se creen después.
function UI.animateButtons(root: Instance)
	for _, inst in root:GetDescendants() do
		if inst:IsA("GuiButton") then
			UI.animateButton(inst)
		end
	end
	root.DescendantAdded:Connect(function(inst)
		if inst:IsA("GuiButton") then
			UI.animateButton(inst)
		end
	end)
end

return UI
