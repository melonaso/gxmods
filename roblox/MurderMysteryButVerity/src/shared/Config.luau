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
