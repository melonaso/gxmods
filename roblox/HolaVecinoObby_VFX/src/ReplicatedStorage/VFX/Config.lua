--!strict
-- ModuleScript: ReplicatedStorage > VFX > Config
-- Central configuration for "De izquierda a derecha hola vecino obby" special effects.
-- Particle textures were generated with ForgeGUI and published to Roblox.

local Config = {}

-- Particle textures (ForgeGUI). If a texture shows blank in-game, paste the id into
-- any ParticleEmitter.Texture field in Studio once: Studio converts a Decal id into
-- its Image id. Replace the number here with the converted one.
Config.Textures = {
	Sparkle = "rbxassetid://84408672280834",
	Glow = "rbxassetid://140554714981336",
	Splash = "rbxassetid://124800911923236",
	Spark = "rbxassetid://134074808117970",
	Ring = "rbxassetid://85856607052166",
}

-- Sound ids (optional). Leave "" to play no sound for that event.
-- Use any audio from the Creator Store, e.g. "rbxassetid://1234567890".
Config.Sounds = {
	Checkpoint = "",
	LobbyEnd = "",
	Finish = "",
	Death = "",
	GamePass = "",
}

Config.Colors = {
	Checkpoint = { Color3.fromRGB(80, 255, 170), Color3.fromRGB(80, 200, 255) },
	LobbyEnd = { Color3.fromRGB(255, 220, 90), Color3.fromRGB(255, 150, 60) },
	Finish = { Color3.fromRGB(255, 90, 90), Color3.fromRGB(255, 220, 80), Color3.fromRGB(90, 200, 255) },
	Death = { Color3.fromRGB(255, 70, 90), Color3.fromRGB(150, 60, 255) },
	GamePass = { Color3.fromRGB(255, 230, 120), Color3.fromRGB(255, 140, 255) },
}

-- How the server finds trigger parts. A part counts when it carries the
-- CollectionService tag OR lives inside the folder of the same name in Workspace.
Config.Triggers = {
	Checkpoint = { Tag = "Checkpoint", Folder = "Checkpoints" },
	LobbyEnd = { Tag = "LobbyEnd", Folder = "LobbyEnd" },
	Finish = { Tag = "Finish", Folder = "Finish" },
}

-- Show a text banner on screen for the player who triggered the event.
Config.Banners = {
	Checkpoint = "¡Checkpoint!",
	LobbyEnd = "¡Saliste del lobby!",
	Finish = "¡LLEGASTE AL FINAL!",
	GamePass = "¡Gracias por tu compra!",
}

-- Seconds before the same player can retrigger the same part (re-touching, respawning).
Config.TouchCooldown = 3

return Config
