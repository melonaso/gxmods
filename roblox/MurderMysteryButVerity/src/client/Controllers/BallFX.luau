--!strict
-- Animación local de la bola sonriente (diseño original de Verity):
--   - espera: flota, se balancea y da tics como si mirara a su alrededor
--   - transformación (TransformStart): se retuerce cada vez más rápido,
--     tiembla, se eleva hasta el pecho del monstruo y se hunde en él
-- El servidor solo coloca la bola y marca TransformStart; todo el movimiento
-- es local (las piezas están ancladas).

local CollectionService = game:GetService("CollectionService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local Assets = require(ReplicatedStorage.Shared.Assets)
local Config = require(ReplicatedStorage.Shared.Config)

type Ball = {
	model: Model,
	base: CFrame,
	twitchAt: number,
	twitch: CFrame,
	goo: ParticleEmitter?,
}

local BallFX = {}

local balls: { [Model]: Ball } = {}

local function track(inst: Instance)
	if not inst:IsA("Model") or balls[inst] then
		return
	end
	local core = inst:WaitForChild("Core", 5)
	if not core then
		return
	end
	balls[inst] = { model = inst, base = inst:GetPivot(), twitchAt = os.clock() + 1, twitch = CFrame.identity }
end

local function gooEmitter(ball: Ball): ParticleEmitter?
	if ball.goo then
		return ball.goo
	end
	local core = ball.model:FindFirstChild("Core")
	if not (core and core:IsA("BasePart")) then
		return nil
	end
	local emitter = Instance.new("ParticleEmitter")
	emitter.Texture = if Assets.Splash ~= "" then Assets.Splash else Assets.GlowOrb
	emitter.Color = ColorSequence.new(Color3.fromRGB(240, 210, 70), Color3.fromRGB(150, 110, 20))
	emitter.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.8), NumberSequenceKeypoint.new(1, 0.1) })
	emitter.Transparency = NumberSequence.new(0, 1)
	emitter.Lifetime = NumberRange.new(0.4, 0.8)
	emitter.Speed = NumberRange.new(6, 14)
	emitter.SpreadAngle = Vector2.new(180, 180)
	emitter.Acceleration = Vector3.new(0, -40, 0)
	emitter.Rotation = NumberRange.new(0, 360)
	emitter.Rate = 0
	emitter.Parent = core
	ball.goo = emitter
	return emitter
end

local function update(ball: Ball)
	local model = ball.model
	local clock = os.clock()
	local transformStart = model:GetAttribute("TransformStart") :: number?

	if not transformStart then
		if clock >= ball.twitchAt then
			ball.twitchAt = clock + 1.2 + math.random() * 2.5
			ball.twitch = CFrame.Angles((math.random() - 0.5) * 0.4, (math.random() - 0.5) * 1.2, (math.random() - 0.5) * 0.5)
		end
		local float = CFrame.new(0, math.sin(clock * 1.6) * 0.35, 0)
		local sway = CFrame.Angles(0, math.sin(clock * 0.5) * 0.3, math.sin(clock * 1.1) * 0.06)
		model:PivotTo(ball.base * float * sway * ball.twitch)
		local breathe = 1 + math.sin(clock * 2) * 0.025
		if math.abs(model:GetScale() - breathe) > 0.001 then
			model:ScaleTo(breathe)
		end
		return
	end

	local p = math.clamp((Workspace:GetServerTimeNow() - transformStart) / Config.Round.TransformTime, 0, 1)
	local twist = math.clamp(p / 0.45, 0, 1)
	local rise = math.clamp((p - 0.45) / 0.35, 0, 1)
	local implode = math.clamp((p - 0.8) / 0.2, 0, 1)

	local spin = (twist ^ 2) * 9 + rise * 14 + implode * 10
	local shake = 0.45 * twist * (1 - implode)
	local offset = Vector3.new((math.random() - 0.5) * shake, (math.random() - 0.5) * shake, (math.random() - 0.5) * shake)
	local wobble = math.sin(clock * 28) * 0.35 * twist
	local height = rise * rise * 7.5
	local scale = (1 + 0.22 * math.sin(clock * 32) * twist) * (1 - 0.4 * rise) * (1 - 0.95 * implode)

	model:PivotTo(ball.base * CFrame.new(offset + Vector3.new(0, height, 0)) * CFrame.Angles(wobble, spin, wobble * 0.6))
	model:ScaleTo(math.max(0.05, scale))

	local goo = gooEmitter(ball)
	if goo then
		goo.Rate = if p < 0.85 then 30 + 120 * twist else 0
	end
end

function BallFX.start()
	for _, inst in CollectionService:GetTagged("VerityBall") do
		task.spawn(track, inst)
	end
	CollectionService:GetInstanceAddedSignal("VerityBall"):Connect(function(inst)
		task.spawn(track, inst)
	end)
	CollectionService:GetInstanceRemovedSignal("VerityBall"):Connect(function(inst)
		balls[inst :: Model] = nil
	end)
	RunService.RenderStepped:Connect(function()
		for model, ball in balls do
			if model.Parent then
				update(ball)
			else
				balls[model] = nil
			end
		end
	end)
end

return BallFX
