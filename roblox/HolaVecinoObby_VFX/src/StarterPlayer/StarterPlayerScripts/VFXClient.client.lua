--!strict
-- LocalScript: StarterPlayer > StarterPlayerScripts > VFXClient
-- Plays the world effect for everyone, and the screen flash + banner only for
-- the player who triggered the event.

local ContentProvider = game:GetService("ContentProvider")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local VFX = ReplicatedStorage:WaitForChild("VFX")
local Config = require(VFX:WaitForChild("Config"))
local Effects = require(VFX:WaitForChild("Effects"))
local remote = VFX:WaitForChild("VFXEvent") :: RemoteEvent

local localPlayer = Players.LocalPlayer

-- Preload textures so the first effect doesn't pop in blank. Runs again whenever
-- the server shares a converted texture id.
local function preload()
	local assets = {}
	for textureName, id in Config.Textures do
		local decal = Instance.new("Decal")
		decal.Texture = VFX:GetAttribute("Texture_" .. textureName) or id
		table.insert(assets, decal)
	end
	ContentProvider:PreloadAsync(assets)
end
task.spawn(preload)
VFX.AttributeChanged:Connect(function()
	task.spawn(preload)
end)

print("[VFX] Cliente listo.")

local function personal(eventName: string, color: Color3, strength: number)
	Effects.ScreenFlash(color, strength)
	local text = Config.Banners[eventName]
	if text then
		Effects.Banner(text, color)
	end
end

remote.OnClientEvent:Connect(function(eventName: string, player: Player, position: Vector3?)
	local isMe = player == localPlayer
	local colors = Config.Colors[eventName]
	if not colors then
		return
	end

	if eventName == "GamePass" then
		if player.Character then
			Effects.GamePass(player.Character)
		end
		if isMe then
			personal(eventName, colors[1], 0.45)
		end
		return
	end

	if not position then
		return
	end

	if eventName == "Checkpoint" then
		Effects.Checkpoint(position)
		if isMe then
			personal(eventName, colors[1], 0.2)
		end
	elseif eventName == "LobbyEnd" then
		Effects.LobbyEnd(position)
		if isMe then
			personal(eventName, colors[1], 0.3)
		end
	elseif eventName == "Finish" then
		Effects.Finish(position)
		if isMe then
			personal(eventName, colors[2], 0.5)
		end
	elseif eventName == "Death" then
		Effects.Death(position)
		if isMe then
			Effects.ScreenFlash(colors[1], 0.35)
		end
	end
end)
