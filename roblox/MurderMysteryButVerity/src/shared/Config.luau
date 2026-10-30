--!strict
-- Valores ajustables del juego. Este módulo es legible por el cliente:
-- toda validación real ocurre en el servidor.

local Config = {}

Config.Round = {
	MinPlayers = 2, -- jugadores reales para una partida sin NPCs
	MaxPlayers = 10, -- jugadores por servidor (pon lo mismo en Game Settings > Places)
	-- Partida en solitario: si hay un solo jugador en el servidor, NPCs
	-- completan la partida hasta MaxPlayers y el jugador alterna entre ser
	-- Verity y superviviente (contra una Verity NPC). Si entra alguien más
	-- durante esa ronda, los NPCs desaparecen y la ronda se cancela.
	SoloBots = true,
	IntermissionTime = 23,
	Duration = 270, -- segundos de una partida si nadie craftea tótems
	KillerReleaseDelay = 20, -- Verity es una bola sonriente durante este tiempo
	TransformTime = 2.6, -- la bola se retuerce y se convierte en el monstruo
	ResultsTime = 7,
	MinRemainingAfterTotem = 15, -- un tótem nunca deja el reloj por debajo de esto
	-- Anti-campeo: cada RevealInterval segundos (desde que Verity despierta)
	-- todos los supervivientes se resaltan en rojo para Verity durante
	-- RevealDuration segundos; ellos reciben un aviso para cambiar de sitio.
	RevealInterval = 60,
	RevealDuration = 5,
}

-- Modelo de Verity. Orden de prioridad al arrancar el servidor:
--   1. ServerStorage.VerityCharacter (importado desde el Toolbox, ver README)
--   2. InsertService:LoadAsset(AssetId) (solo si el creador del juego posee el modelo)
--   3. ServerStorage.VerityFallback (modelo de respaldo hecho con piezas)
-- Cualquier modelo se limpia de scripts, se escala a Height y se adapta.
Config.Verity = {
	AssetId = 107080030600115, -- "verity" (Toolbox, JayJay00630)
	AlternativeAssetIds = { 77078054144134, 90398340255135, 72873880902024 },
	Height = 18, -- algo más de 3 veces un jugador R15 (las puertas miden 20)
}

-- Distancia máxima a la que se puede alejar la cámara (rueda del ratón).
-- Cerca da más tensión: no se ve lo que hay detrás de las esquinas.
-- El servidor lo fija al cambiar de rol y cada cliente lo vuelve a aplicar
-- (CameraLimits), así nunca se puede alejar más de esto.
Config.Camera = {
	LobbyMaxZoom = 30,
	SurvivorMaxZoom = 22,
	VerityMaxZoom = 30, -- Verity mide 18 studs: necesita algo más de margen
}

Config.Killer = {
	Name = "Verity",
	KillRange = 12, -- distancia máxima para atrapar con Q (brazos larguísimos)
	KillConeDot = 0.1, -- el objetivo debe estar más o menos al frente (~84° a cada lado)
	KillCloseRange = 5, -- tan cerca, atrapa en cualquier dirección
	KillCooldown = 1,
}

-- Correr (Shift) es igual de rápido para todos; la diferencia es que los
-- supervivientes gastan estamina y Verity no.
local SPRINT = 40

Config.Movement = {
	SurvivorWalk = 16,
	SurvivorSprint = SPRINT, -- Shift, gasta estamina
	StaminaMax = 100,
	StaminaDrain = 15, -- por segundo corriendo (~6,7 s de carrera con la barra llena)
	StaminaRegen = 18, -- se llena en ~5,5 s
	StaminaRegenDelay = 0.6,
	VerityWalk = 26,
	VeritySprint = SPRINT, -- sin límite de estamina
	VerityCrouch = 14, -- tecla C
	BotWalk = 15,
	BotFlee = 22,
	VerityBotPatrol = 20, -- Verity NPC buscando
	VerityBotChase = 28, -- Verity NPC persiguiendo
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
	PerMap = 80,
	MaxPerRound = 40, -- bolsa llena
	PickupRadius = 4.5,
	VerityPickupRadius = 8, -- Verity es enorme
	MagnetMultiplier = 3,
	RewardWin = 150, -- al ganar, sea Verity o superviviente
	RewardSurvive = 0,
	RewardKill = 6,
	ObbyReward = 15,
	ObbyCooldown = 120,
}

-- Objetos de la tienda del lobby (se pagan con monedas). Solo los usan los
-- supervivientes, y solo durante la ronda: se reciben al empezar los
-- equipados (máx. MaxEquipped).
Config.MaxEquipped = 2
Config.Items = {
	{ Key = "SpeedCoil", Title = "Bobina de velocidad", Price = 250, Badge = "VEL", Color = Color3.fromRGB(70, 160, 255), Description = "+35% de velocidad mientras la sostienes." },
	{ Key = "GravityCoil", Title = "Bobina de gravedad", Price = 250, Badge = "GRV", Color = Color3.fromRGB(170, 90, 255), Description = "Saltos enormes: la gravedad te afecta mucho menos." },
	{ Key = "FusionCoil", Title = "Bobina de fusión", Price = 650, Badge = "FUS", Color = Color3.fromRGB(255, 120, 200), Description = "Velocidad y gravedad baja a la vez." },
	{ Key = "Medkit", Title = "Botiquín", Price = 150, Badge = "+HP", Color = Color3.fromRGB(230, 60, 70), Description = "Clic: cura 50 de vida. Recarga 20 s." },
	{ Key = "EnergyDrink", Title = "Bebida energética", Price = 200, Badge = "NRG", Color = Color3.fromRGB(120, 230, 80), Description = "Clic: estamina llena e infinita durante 6 s. Recarga 30 s." },
	{ Key = "Flare", Title = "Bengala", Price = 100, Badge = "BNG", Color = Color3.fromRGB(255, 70, 50), Description = "Clic: deja en el suelo una bengala roja que ilumina la zona 20 s. Recarga 30 s." },
	{ Key = "GhostCloak", Title = "Capa fantasma", Price = 500, Badge = "INV", Color = Color3.fromRGB(150, 220, 255), Description = "Clic: casi invisible durante 6 s. Recarga 40 s." },
	{ Key = "SoulRadar", Title = "Radar de almas", Price = 450, Badge = "RAD", Color = Color3.fromRGB(255, 80, 120), Description = "Clic: ves a Verity a través de las paredes 6 s. Recarga 30 s." },
	{ Key = "BearTrap", Title = "Cepo", Price = 350, Badge = "CPO", Color = Color3.fromRGB(150, 150, 160), Description = "Clic: coloca un cepo (máx. 2) que inmoviliza 3 s a Verity si lo pisa." },
	{ Key = "CoinMagnet", Title = "Imán de monedas", Price = 300, Badge = "IMN", Color = Color3.fromRGB(255, 200, 60), Description = "Sostenlo para recoger monedas desde el triple de distancia." },
	{ Key = "PushHammer", Title = "Martillo de empuje", Price = 400, Badge = "MRT", Color = Color3.fromRGB(200, 140, 80), Description = "Clic: empuja con fuerza a Verity si la tienes delante. Recarga 8 s." },
}

-- Skins de Verity: tinte (Highlight) y aura opcional sobre el modelo.
Config.Skins = {
	{ Key = "Classic", Title = "Clásica", Price = 0, Tint = Color3.fromRGB(214, 194, 92), Amount = 0, Description = "La Verity de siempre." },
	{ Key = "Pale", Title = "Pálida", Price = 1000, Tint = Color3.fromRGB(235, 230, 215), Amount = 0.55, Description = "Piel blanca como la cera." },
	{ Key = "Shadow", Title = "Sombra", Price = 1500, Tint = Color3.fromRGB(12, 8, 18), Amount = 0.8, Outline = Color3.fromRGB(255, 40, 60), Description = "Negra como la noche, contorno rojo." },
	{ Key = "Bloody", Title = "Sangrienta", Price = 2000, Tint = Color3.fromRGB(150, 8, 18), Amount = 0.6, Aura = Color3.fromRGB(160, 0, 12), Description = "Gotea sangre al caminar." },
	{ Key = "Toxic", Title = "Tóxica", Price = 2500, Tint = Color3.fromRGB(90, 255, 90), Amount = 0.5, Aura = Color3.fromRGB(90, 255, 90), Description = "Brillo radiactivo verde." },
	{ Key = "Golden", Title = "Dorada", Price = 3500, Tint = Color3.fromRGB(255, 200, 50), Amount = 0.6, Aura = Color3.fromRGB(255, 220, 120), Description = "Reluce como el oro." },
	{ Key = "Spectral", Title = "Espectral", Price = 4500, Tint = Color3.fromRGB(120, 220, 255), Amount = 0.45, Outline = Color3.fromRGB(180, 240, 255), Ghost = true, Description = "Semitransparente, como un fantasma." },
	{ Key = "Void", Title = "Vacío", Price = 6000, Tint = Color3.fromRGB(40, 0, 70), Amount = 0.75, Outline = Color3.fromRGB(190, 90, 255), Aura = Color3.fromRGB(150, 60, 255), Description = "Morada, con un aura del más allá." },
}

-- Música (licenciada para uso en experiencias: DistroKid / APM oficiales).
-- Encontradas con ForgeGUI (toolbox_search).
Config.Music = {
	Lobby = { 134959834418523, 1836009626, 133838630142849 }, -- Liminal Space, Halloween Horrors Waltz (APM), Scary Place
	Round = { 138890398994853, 98165789328752, 135768960171473 }, -- Horror Cinematic Ambience, Beneath the Dread Moon, Creepy Scary
	Outdoor = { 98165789328752, 1846999567, 138890398994853 }, -- Beneath the Dread Moon, Creepy Night (APM), Horror Cinematic Ambience
	Results = { 9041745502 }, -- 80s Horror Throwback Scary Creeper Bed (APM)
	Chase = 1848090337, -- Intense Chase (APM): suena cuando Verity está cerca de alguien
	Drone = 9043360237, -- METALLIC DRONE 03 (APM): capa de tensión durante la ronda (sube de volumen y tono)
	Rumble = 9112775175, -- Eerie Ambience 1 (Pro Sound Effects): retumbar grave de fondo en la ronda
	FinalMinute = 1847683499, -- Running Faster A (APM): sustituye a la música en el último minuto
	HeartbeatHit = 12221944, -- bass.wav (Roblox): golpe grave del latido cuando Verity se acerca
	DeathScream = 9043345732, -- HORROR SCREAM 07 (APM): al ser agarrado; la explosión lo corta
	Volume = 0.35,
}

-- Crujidos de huesos de la transformación. Sube assets/audio/verity_bone_cracks.ogg
-- (Studio > Asset Manager > Bulk Import) y pega aquí su ID. Con 0 se usa un
-- sustituto con sonidos internos de Roblox.
Config.Sounds = {
	BoneCracks = 0,
	-- Liberación de Verity (lo oyen todos): grito distorsionado más grave y un golpe sordo
	ReleaseScream = 9125712561, -- Nightmare Yelling Bursts Of Distorted Scream (Pro Sound Effects)
	ReleaseHit = 12221944, -- bass.wav (Roblox), muy lento: golpe grave
	ReleaseVolume = 2.2,
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
