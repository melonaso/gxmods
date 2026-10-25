--!strict
-- Valores ajustables del juego. Este módulo es legible por el cliente:
-- toda validación real ocurre en el servidor.

local Config = {}

Config.Round = {
	MinPlayers = 2,
	IntermissionTime = 25,
	Duration = 240, -- segundos de una partida si nadie craftea tótems
	KillerReleaseDelay = 10, -- ventaja inicial de los supervivientes
	ResultsTime = 7,
	MinRemainingAfterTotem = 15, -- un tótem nunca deja el reloj por debajo de esto
}

-- MODO PRUEBA: permite jugar solo. El primer jugador del servidor es
-- Verity en todas las rondas y NPCs ocupan el lugar de los supervivientes.
-- Ponlo en false antes de publicar el juego.
Config.Testing = {
	Enabled = true,
	Bots = 5,
	IntermissionTime = 8,
	StartingCoins = 1500, -- para probar la tienda sin farmear
}

-- Modelo de Verity. Orden de prioridad al arrancar el servidor:
--   1. ServerStorage.VerityCharacter (importado desde el Toolbox, ver README)
--   2. InsertService:LoadAsset(AssetId) (solo si el creador del juego posee el modelo)
--   3. ServerStorage.VerityFallback (modelo de respaldo hecho con piezas)
-- Cualquier modelo se limpia de scripts, se escala a Height y se adapta.
Config.Verity = {
	AssetId = 107080030600115, -- "verity" (Toolbox, JayJay00630)
	AlternativeAssetIds = { 77078054144134, 90398340255135, 72873880902024 },
	Height = 16, -- ~3 veces un jugador R15
}

Config.Killer = {
	Name = "Verity",
	KillRange = 9, -- distancia máxima para atrapar con Q
	KillConeDot = 0.2, -- el objetivo debe estar más o menos al frente
	KillCooldown = 1,
}

Config.Movement = {
	SurvivorWalk = 16,
	SurvivorSprint = 24, -- Shift
	StaminaMax = 100,
	StaminaDrain = 22, -- por segundo corriendo
	StaminaRegen = 14,
	StaminaRegenDelay = 0.8,
	VerityWalk = 18,
	VeritySprint = 28, -- más rápida que el sprint de los supervivientes
	VerityCrouch = 9, -- tecla C
	BotWalk = 15,
	BotFlee = 21,
}

Config.Crafting = {
	TableCount = 3,
	GoldPerTotem = 3, -- bloques de oro que necesita una mesa para craftear
	MaxGoldCarried = 2,
	TimeReductionPerTotem = 30, -- segundos que resta cada tótem
	MaxTotemsPerRound = 5,
	CraftHoldDuration = 3,
	PickupHoldDuration = 0.35,
	GoldRespawnDelay = 18,
	GoldMinBlocks = 6,
	GoldMaxBlocks = 18,
	GoldPerSurvivor = 3,
}

-- Probabilidad de ser Verity estilo MM2: cada ronda que no eres elegido
-- sumas +1 de "suerte"; al ser elegido vuelve a 0.
-- peso = (1 + suerte) * multiplicadorPase * multiplicadorPoción
Config.Chance = {
	LuckPerRound = 1,
	MaxLuck = 10,
}

-- Monedas repartidas por el mapa en cada ronda (las recogen los jugadores,
-- también Verity, con solo acercarse).
Config.Coins = {
	PerMap = 45,
	MaxPerRound = 40, -- bolsa llena
	PickupRadius = 4.5,
	VerityPickupRadius = 8, -- Verity es enorme
	MagnetMultiplier = 3,
	RewardWin = 25,
	RewardSurvive = 15,
	RewardKill = 6,
	ObbyReward = 15,
	ObbyCooldown = 120,
}

-- Objetos de la tienda del lobby (se pagan con monedas). Se llevan a las
-- rondas los equipados (máx. MaxEquipped).
Config.MaxEquipped = 4
Config.Items = {
	{ Key = "SpeedCoil", Title = "Bobina de velocidad", Price = 250, Badge = "VEL", Color = Color3.fromRGB(70, 160, 255), Description = "+35% de velocidad mientras la sostienes." },
	{ Key = "GravityCoil", Title = "Bobina de gravedad", Price = 250, Badge = "GRV", Color = Color3.fromRGB(170, 90, 255), Description = "Saltos enormes: la gravedad te afecta mucho menos." },
	{ Key = "FusionCoil", Title = "Bobina de fusión", Price = 650, Badge = "FUS", Color = Color3.fromRGB(255, 120, 200), Description = "Velocidad y gravedad baja a la vez." },
	{ Key = "Medkit", Title = "Botiquín", Price = 150, Badge = "+HP", Color = Color3.fromRGB(230, 60, 70), Description = "Clic: cura 50 de vida. Recarga 20 s." },
	{ Key = "EnergyDrink", Title = "Bebida energética", Price = 200, Badge = "NRG", Color = Color3.fromRGB(120, 230, 80), Description = "Clic: estamina llena e infinita durante 6 s. Recarga 30 s." },
	{ Key = "Flashlight", Title = "Linterna", Price = 100, Badge = "LUZ", Color = Color3.fromRGB(255, 220, 120), Description = "Clic: enciende o apaga un foco potente." },
	{ Key = "GhostCloak", Title = "Capa fantasma", Price = 500, Badge = "INV", Color = Color3.fromRGB(150, 220, 255), Description = "Clic: casi invisible durante 6 s. Recarga 40 s." },
	{ Key = "SoulRadar", Title = "Radar de almas", Price = 450, Badge = "RAD", Color = Color3.fromRGB(255, 80, 120), Description = "Clic: ves a tus objetivos a través de las paredes 6 s. Recarga 30 s." },
	{ Key = "BearTrap", Title = "Cepo", Price = 350, Badge = "CPO", Color = Color3.fromRGB(150, 150, 160), Description = "Clic: coloca un cepo (máx. 2) que atrapa 3 s a quien lo pise." },
	{ Key = "CoinMagnet", Title = "Imán de monedas", Price = 300, Badge = "IMN", Color = Color3.fromRGB(255, 200, 60), Description = "Sostenlo para recoger monedas desde el triple de distancia." },
	{ Key = "PushHammer", Title = "Martillo de empuje", Price = 400, Badge = "MRT", Color = Color3.fromRGB(200, 140, 80), Description = "Clic: empuja con fuerza a quien tengas delante. Recarga 8 s." },
}

-- Skins de Verity: tinte (Highlight) y aura opcional sobre el modelo.
Config.Skins = {
	{ Key = "Classic", Title = "Clásica", Price = 0, Tint = Color3.fromRGB(214, 194, 92), Amount = 0, Description = "La Verity de siempre." },
	{ Key = "Pale", Title = "Pálida", Price = 300, Tint = Color3.fromRGB(235, 230, 215), Amount = 0.55, Description = "Piel blanca como la cera." },
	{ Key = "Shadow", Title = "Sombra", Price = 600, Tint = Color3.fromRGB(12, 8, 18), Amount = 0.8, Outline = Color3.fromRGB(255, 40, 60), Description = "Negra como la noche, contorno rojo." },
	{ Key = "Bloody", Title = "Sangrienta", Price = 800, Tint = Color3.fromRGB(150, 8, 18), Amount = 0.6, Aura = Color3.fromRGB(160, 0, 12), Description = "Gotea sangre al caminar." },
	{ Key = "Toxic", Title = "Tóxica", Price = 900, Tint = Color3.fromRGB(90, 255, 90), Amount = 0.5, Aura = Color3.fromRGB(90, 255, 90), Description = "Brillo radiactivo verde." },
	{ Key = "Golden", Title = "Dorada", Price = 1200, Tint = Color3.fromRGB(255, 200, 50), Amount = 0.6, Aura = Color3.fromRGB(255, 220, 120), Description = "Reluce como el oro." },
	{ Key = "Spectral", Title = "Espectral", Price = 1500, Tint = Color3.fromRGB(120, 220, 255), Amount = 0.45, Outline = Color3.fromRGB(180, 240, 255), Ghost = true, Description = "Semitransparente, como un fantasma." },
	{ Key = "Void", Title = "Vacío", Price = 2500, Tint = Color3.fromRGB(40, 0, 70), Amount = 0.75, Outline = Color3.fromRGB(190, 90, 255), Aura = Color3.fromRGB(150, 60, 255), Description = "Morada, con un aura del más allá." },
}

-- Música (licenciada para uso en experiencias: DistroKid / APM oficiales).
Config.Music = {
	Lobby = { 134959834418523, 133838630142849 }, -- Liminal Space Creepy Music, Scary Place
	Round = { 138890398994853, 135768960171473, 98165789328752 }, -- Horror Cinematic Ambience, Creepy Scary, Beneath the Dread Moon
	Results = { 9041745502 }, -- 80s Horror Throwback Scary Creeper Bed (APM)
	Volume = 0.35,
}

-- Reemplaza Id = 0 por los IDs reales creados en el Creator Hub.
-- Si un jugador tiene varios pases se aplica el multiplicador más alto.
Config.GamePasses = {
	{ Key = "Chance2x", Id = 0, Multiplier = 2, Title = "2x Probabilidad", Description = "Doble probabilidad de ser Verity en cada ronda." },
	{ Key = "Chance3x", Id = 0, Multiplier = 3, Title = "3x Probabilidad", Description = "Triple probabilidad de ser Verity en cada ronda." },
}

-- Producto de desarrollador consumible: multiplica la probabilidad en las
-- próximas rondas (se acumulan rondas, no el multiplicador).
Config.Products = {
	{ Key = "VerityPotion", Id = 0, Multiplier = 5, Rounds = 1, Title = "Poción de Verity", Description = "x5 de probabilidad en tu próxima ronda." },
}

return Config
