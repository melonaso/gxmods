--!strict
-- Cuenta atras de Verity, barra de vida, aviso de "escondido" y notificaciones.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local Net = require(Shared.Net)

local player = Players.LocalPlayer

local COLORS = {
	info = Color3.fromRGB(240, 240, 240),
	warning = Color3.fromRGB(255, 200, 60),
	danger = Color3.fromRGB(255, 70, 70),
	reward = Color3.fromRGB(120, 255, 140),
}

local HUD = {}

local timerLabel: TextLabel
local hpFrame: Frame
local hpFill: Frame
local hpText: TextLabel
local hiddenLabel: TextLabel
local toast: TextLabel
local toastToken = 0

local function label(parent: Instance, size: UDim2, pos: UDim2, textSize: number): TextLabel
	local l = Instance.new("TextLabel")
	l.Size = size
	l.Position = pos
	l.AnchorPoint = Vector2.new(0.5, 0)
	l.BackgroundTransparency = 1
	l.Font = Enum.Font.GothamBlack
	l.TextSize = textSize
	l.TextColor3 = Color3.new(1, 1, 1)
	l.TextStrokeTransparency = 0.4
	l.TextWrapped = true
	l.Parent = parent
	return l
end

local function format(seconds: number): string
	seconds = math.max(0, math.floor(seconds))
	return string.format("%02d:%02d", seconds // 60, seconds % 60)
end

local function showToast(text: string, kind: string?)
	toastToken += 1
	local token = toastToken
	toast.Text = text
	toast.TextColor3 = COLORS[kind or "info"] or COLORS.info
	toast.TextTransparency = 0
	toast.TextStrokeTransparency = 0.4
	task.delay(4, function()
		if token == toastToken then
			TweenService:Create(toast, TweenInfo.new(0.6), { TextTransparency = 1, TextStrokeTransparency = 1 }):Play()
		end
	end)
end

function HUD.init()
	local gui = Instance.new("ScreenGui")
	gui.Name = "VerityHUD"
	gui.ResetOnSpawn = false
	gui.IgnoreGuiInset = false

	timerLabel = label(gui, UDim2.fromOffset(500, 34), UDim2.new(0.5, 0, 0, 8), 24)

	hpFrame = Instance.new("Frame")
	hpFrame.Size = UDim2.new(0.5, 0, 0, 22)
	hpFrame.Position = UDim2.new(0.5, 0, 0, 46)
	hpFrame.AnchorPoint = Vector2.new(0.5, 0)
	hpFrame.BackgroundColor3 = Color3.fromRGB(20, 0, 0)
	hpFrame.BorderSizePixel = 0
	hpFrame.Visible = false
	hpFrame.Parent = gui
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 6)
	corner.Parent = hpFrame

	hpFill = Instance.new("Frame")
	hpFill.Size = UDim2.fromScale(1, 1)
	hpFill.BackgroundColor3 = Color3.fromRGB(200, 20, 20)
	hpFill.BorderSizePixel = 0
	hpFill.Parent = hpFrame
	corner:Clone().Parent = hpFill

	hpText = label(hpFrame, UDim2.fromScale(1, 1), UDim2.fromScale(0.5, 0), 16)

	hiddenLabel = label(gui, UDim2.fromOffset(500, 30), UDim2.new(0.5, 0, 1, -130), 20)
	hiddenLabel.TextColor3 = Color3.fromRGB(140, 220, 255)
	hiddenLabel.Text = "ESCONDIDO - Verity no puede verte"
	hiddenLabel.Visible = false

	local version = Instance.new("TextLabel")
	version.Size = UDim2.fromOffset(260, 18)
	version.Position = UDim2.new(0, 16, 1, -52)
	version.AnchorPoint = Vector2.new(0, 1)
	version.BackgroundTransparency = 1
	version.Font = Enum.Font.Gotham
	version.TextSize = 13
	version.TextXAlignment = Enum.TextXAlignment.Left
	version.TextColor3 = Color3.fromRGB(200, 200, 200)
	version.TextStrokeTransparency = 0.6
	version.Text = "Genghis Khan Verity Tycoon " .. Config.Version
	version.Parent = gui

	toast = label(gui, UDim2.fromOffset(620, 60), UDim2.new(0.5, 0, 0, 80), 22)
	toast.TextTransparency = 1
	toast.TextStrokeTransparency = 1

	gui.Parent = player:WaitForChild("PlayerGui")
end

function HUD.start()
	Net.onClient("Notify", function(text: any, kind: any)
		if typeof(text) == "string" then
			showToast(text, if typeof(kind) == "string" then kind else nil)
		end
	end)

	local acc = 0
	RunService.Heartbeat:Connect(function(dt)
		acc += dt
		if acc < 0.1 then
			return
		end
		acc = 0
		local t = workspace:GetServerTimeNow()
		local phase = workspace:GetAttribute("VerityPhase")
		if phase == "Active" then
			local hp = (workspace:GetAttribute("VerityHP") :: number?) or 0
			local maxHp = math.max(1, (workspace:GetAttribute("VerityMaxHP") :: number?) or 1)
			local ends = (workspace:GetAttribute("VerityEndsAt") :: number?) or t
			timerLabel.Text = "VERITY ESTA AQUI - se ira en " .. format(ends - t)
			timerLabel.TextColor3 = COLORS.danger
			hpFrame.Visible = true
			hpFill.Size = UDim2.fromScale(math.clamp(hp / maxHp, 0, 1), 1)
			hpText.Text = string.format("VERITY  %d / %d", hp, maxHp)
			hiddenLabel.Visible = player:GetAttribute("Hidden") == true
		else
			local nextAt = (workspace:GetAttribute("VerityNextAt") :: number?) or t
			local remaining = nextAt - t
			timerLabel.Text = "Verity llega en " .. format(remaining)
			timerLabel.TextColor3 = if remaining <= 60 then COLORS.warning else COLORS.info
			hpFrame.Visible = false
			hiddenLabel.Visible = false
		end
	end)
end

return HUD
