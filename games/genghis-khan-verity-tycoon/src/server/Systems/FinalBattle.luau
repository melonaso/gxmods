--!strict
-- Batalla final contra la forma final de Verity.
--   1. Quien compro TODO su tycoon pisa el circulo dorado de su campamento
--      (Tycoon.luau) y convoca la batalla: Idle -> Lobby.
--   2. Durante LobbySeconds todos ven un boton "Unirse" (remote FinalJoin).
--      Las noches normales se pausan (Verity.setHold).
--   3. Lobby -> Battle: los que se unieron viajan al campo, montados a
--      caballo, y aparece la forma final (Verity.spawnFinal).
--   4. Si un jinete muere o se va, sale de la batalla. Si no queda nadie,
--      Verity resiste (Verity.abortFinal).
--   5. Verity.FinalEnded -> Ending: anuncio y, a los pocos segundos, todos
--      vuelven a su campamento a pie (LoadCharacter).
-- Atributos para el HUD: workspace.FinalPhase ("Lobby"/"Battle"/"Ending"),
-- FinalStartsAt (fin de la convocatoria) y FinalCaller (quien convoco).
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local Net = require(Shared.Net)

local Horse = require(script.Parent.Parent.Lib.Horse)
local PlayerData = require(script.Parent.PlayerData)
local Verity = require(script.Parent.Verity)

local F = Config.FinalBattle

type State = "Idle" | "Lobby" | "Battle" | "Ending"

local FinalBattle = {}

local state: State = "Idle"
local joined: { [Player]: boolean } = {}
local riders: { Player } = {} -- todos los que empezaron la batalla (para ofrecer renacer)
local deathConns: { RBXScriptConnection } = {}

local function now(): number
	return workspace:GetServerTimeNow()
end

local function setPhase(value: string?)
	workspace:SetAttribute("FinalPhase", value)
end

-- Compro todos los botones de su tycoon.
function FinalBattle.isUnlocked(player: Player): boolean
	for _, def in Config.Buttons do
		if not PlayerData.owns(player, def.Id) then
			return false
		end
	end
	return true
end

local function clearDeathConns()
	for _, c in deathConns do
		c:Disconnect()
	end
	deathConns = {}
end

local function reset()
	clearDeathConns()
	joined = {}
	state = "Idle"
	setPhase(nil)
	workspace:SetAttribute("FinalCaller", nil)
	Verity.setHold(false)
end

local function leave(player: Player)
	joined[player] = nil
	Verity.removeParticipant(player)
end

local function begin()
	if state ~= "Lobby" then
		return
	end
	riders = {}
	for player in joined do
		if player.Parent and player.Character then
			table.insert(riders, player)
		end
	end
	if #riders == 0 or Verity.getPhase() ~= "Waiting" then
		Net.fireAll("Notify", "La batalla final se cancelo.", "warning")
		reset()
		return
	end

	state = "Battle"
	setPhase("Battle")
	-- jinetes en un anillo alrededor del centro, mirando a Verity
	for i, player in riders do
		local character = player.Character :: Model
		local angle = (i - 1) / #riders * math.pi * 2
		local pos = F.Arena + Vector3.new(math.cos(angle), 0, math.sin(angle)) * F.StartRadius + Vector3.new(0, 9, 0)
		character:PivotTo(CFrame.lookAt(pos, F.Arena + Vector3.new(0, 9, 0)))
		Horse.mount(character, F.HorseSpeed)
		local humanoid = character:FindFirstChildOfClass("Humanoid")
		if humanoid then
			table.insert(deathConns, humanoid.Died:Connect(function()
				leave(player)
				Net.fireClient(player, "Notify", "Caiste en la batalla final. Vuelves a tu campamento.", "danger")
			end))
		end
		Net.fireClient(player, "Notify", "A CABALLO, KHAN. Derrota a la forma final de Verity.", "danger")
	end

	if not Verity.spawnFinal(F.Arena, riders) then
		for _, player in riders do
			player:LoadCharacter()
		end
		Net.fireAll("Notify", "La batalla final se cancelo.", "warning")
		reset()
		return
	end

	-- si ya no queda ningun jinete vivo en el campo, Verity resiste
	task.spawn(function()
		while state == "Battle" do
			task.wait(1)
			local alive = 0
			for player in joined do
				local character = player.Character
				local root = character and character:FindFirstChild("HumanoidRootPart")
				local humanoid = character and character:FindFirstChildOfClass("Humanoid")
				if root and root:IsA("BasePart") and humanoid and humanoid.Health > 0 and (root.Position - F.Arena).Magnitude < F.ArenaHalfSize * 2 then
					alive += 1
				else
					leave(player)
				end
			end
			if alive == 0 and state == "Battle" then
				Verity.abortFinal()
			end
		end
	end)
end

-- Convocar (o unirse si ya hay una convocatoria).
function FinalBattle.request(player: Player, force: boolean?)
	if state == "Lobby" then
		FinalBattle.join(player)
		return
	end
	if state ~= "Idle" then
		Net.fireClient(player, "Notify", "Ya hay una batalla final en curso.", "info")
		return
	end
	if not force and not FinalBattle.isUnlocked(player) then
		return
	end
	if Verity.getPhase() ~= "Waiting" then
		Net.fireClient(player, "Notify", "Espera a que termine la noche de Verity.", "warning")
		return
	end
	state = "Lobby"
	joined = { [player] = true }
	Verity.setHold(true)
	workspace:SetAttribute("FinalCaller", player.DisplayName)
	workspace:SetAttribute("FinalStartsAt", now() + F.LobbySeconds)
	setPhase("Lobby")
	Net.fireAll("Notify", string.format("%s CONVOCA LA BATALLA FINAL contra Verity. Unete en %d s.", player.DisplayName, F.LobbySeconds), "danger")
	task.delay(F.LobbySeconds, begin)
end

function FinalBattle.join(player: Player)
	if state == "Lobby" and not joined[player] and player.Character then
		joined[player] = true
		Net.fireClient(player, "Notify", "Te uniste a la batalla final. Prepara tus armas.", "reward")
	end
end

local function onEnded(victory: boolean)
	if state ~= "Battle" then
		return
	end
	state = "Ending"
	setPhase("Ending")
	workspace:SetAttribute("FinalVictory", victory)
	clearDeathConns()
	if victory then
		-- cada jinete que empezo la batalla puede renacer si quiere (HUD le pregunta)
		for _, player in riders do
			if player.Parent then
				player:SetAttribute("CanRebirth", true)
			end
		end
	end
	task.delay(8, function()
		-- todos de vuelta a su campamento, a pie (Tycoon los lleva a casa al reaparecer)
		for player in joined do
			if player.Parent then
				player:LoadCharacter()
			end
		end
		reset()
	end)
end

function FinalBattle.init()
	setPhase(nil)
	Net.onServer("FinalJoin", function(player: Player)
		FinalBattle.join(player)
	end)
	Verity.FinalEnded:Connect(onEnded)
	Players.PlayerRemoving:Connect(leave)

	-- Comando de prueba: "/final" convoca sin tener el tycoon completo (Studio o creador)
	local function allowed(player: Player?): boolean
		return player ~= nil and (RunService:IsStudio() or player.UserId == game.CreatorId)
	end
	pcall(function()
		local command = Instance.new("TextChatCommand")
		command.Name = "FinalCommand"
		command.PrimaryAlias = "/final"
		command.Triggered:Connect(function(source: TextSource)
			local player = Players:GetPlayerByUserId(source.UserId)
			if player and allowed(player) then
				FinalBattle.request(player, true)
			end
		end)
		command.Parent = game:GetService("TextChatService")
	end)
	local function hook(player: Player)
		player.Chatted:Connect(function(message)
			if message:lower() == "/final" and allowed(player) then
				FinalBattle.request(player, true)
			end
		end)
	end
	Players.PlayerAdded:Connect(hook)
	for _, player in Players:GetPlayers() do
		hook(player)
	end
end

return FinalBattle
