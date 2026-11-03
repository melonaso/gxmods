--!strict
-- Todos los numeros de balance en un solo lugar.
-- Ojo: el cliente puede leer este archivo; el servidor es quien valida.
local Types = require(script.Parent.Types)

local Config = {}

-- Se ve abajo a la izquierda: sirve para saber si abriste el archivo mas nuevo.
Config.Version = "v19"

-- Introduccion cinematografica al entrar (historia de Gengis Khan). false = sin intro.
Config.Intro = { Enabled = true }

Config.StartingGold = 50
Config.PlotCount = 6 -- pon MaxPlayers = 6 en Game Settings
Config.PlotRingRadius = 150
Config.DataStoreName = "GKVerityTycoon_v1"
Config.AutosaveSeconds = 120
Config.ConveyorSpeed = 24 -- studs por segundo
Config.Floor2Height = 20

Config.Verity = {
	-- Modelo (mismo que "Survive A Verity"): ServerStorage.VerityCharacter si lo
	-- importaste, si no este asset del Toolbox, si no ServerStorage.VerityFallback.
	AssetId = 107080030600115,
	Height = 18,
	TransformTime = 2.6, -- lo usa VerityAnimator si algun dia se pone TransformStart
	AttackAnimTime = 2.4, -- duracion de la animacion "levantar y aplastar"
	IntervalSeconds = 5 * 60, -- cada 5 minutos
	StudioIntervalSeconds = 5 * 60, -- igual en Studio (para probar ya: /verity en el chat)
	DurationSeconds = 180, -- si nadie lo mata, se va a los 3 minutos
	BaseHealth = 5000,
	HealthPerPlayer = 1500,
	WalkSpeed = 14, -- los jugadores corren a 16
	EnragedSpeed = 19, -- por debajo del umbral de vida ya no se le puede huir
	EnrageThreshold = 0.3,
	HitRadius = 5, -- "grosor" de Verity para calcular el alcance de las armas
	MeleeRange = 11, -- brazos larguisimos
	MeleeDamage = 45,
	MeleeCooldown = 2.8, -- debe ser >= AttackAnimTime
	ScreamCooldown = 15, -- rugido: dana a todos los que esten a la vista y cerca
	ScreamRadius = 35,
	ScreamDamage = 20,
	RewardPool = 6000, -- se reparte segun el dano que hizo cada uno
	ParticipationReward = 500,
	WallDamage = 200, -- dano por golpe a una muralla que le cierra el paso
	WarningTimes = { 120, 60, 10 },
	-- Al matarlo en una noche normal no desaparece: huye herido hacia el portal.
	FleeSpeed = 34,
	FleeTimeout = 30,
}

-- Batalla final: se desbloquea al comprar TODO el tycoon (aparece un circulo
-- dorado en el campamento). Los que se unen pelean a caballo contra la forma
-- final de Verity en un campo aparte.
Config.FinalBattle = {
	Arena = Vector3.new(0, 0, 1500), -- lejos del mapa principal
	ArenaHalfSize = 310,
	StartRadius = 140, -- los jinetes aparecen en un anillo alrededor de Verity
	LobbySeconds = 20, -- tiempo para unirse
	Duration = 360,
	Scale = 1.7, -- ~31 studs de alto
	BaseHealth = 12000,
	HealthPerPlayer = 6000,
	WalkSpeed = 30,
	EnragedSpeed = 38,
	EnrageThreshold = 0.3,
	HorseSpeed = 44, -- los caballos son mas rapidos que la forma final
	MeleeRange = 20,
	MeleeDamage = 40,
	MeleeCooldown = 2.8,
	AttackAnimTime = 2.4,
	ScreamCooldown = 10,
	ScreamRadius = 60,
	ScreamDamage = 25,
	RewardPool = 60000,
	ParticipationReward = 10000,
}

-- Arco compuesto mongol (recurvo). Espacio del mango: +Z arriba, +X hacia el
-- objetivo (asi queda con el agarre de la espada clasica y el brazo al frente).
-- El servidor marca ShotAt; cada cliente anima tensar -> soltar -> vibrar.
Config.Bow = {
	DrawTime = 0.35, -- tensar; la flecha sale al terminar
	RecoverTime = 0.45, -- cuerda vibrando, sin flecha
	DrawDistance = 2.0, -- cuanto se tensa la cuerda hacia el arquero
	StringTop = Vector3.new(-0.85, 0, 3.6), -- puntas donde se ata la cuerda
	StringBottom = Vector3.new(-0.85, 0, -3.6),
	ArrowLength = 3.4,
}

-- Renacer: tras ganar la batalla final, quien quiera reinicia su campamento
-- y su oro, y gana este extra de oro para siempre por cada renacimiento.
Config.Rebirth = {
	BonusPerRebirth = 0.5, -- +50 % por renacimiento (x1.5, x2, x2.5...)
}

-- Canto de garganta mongol (khöömei): tecla G / boton en pantalla.
Config.ThroatSing = {
	Cooldown = 25,
	Duration = 6.5, -- largo de assets/audio/khoomei.ogg
	StunRadius = 45, -- Verity a esta distancia queda aturdido
	StunSeconds = 4,
	Damage = 60,
	HealRadius = 30, -- cura a los aliados cercanos (y a ti)
	Heal = 25,
	DuckRadius = 160, -- a esta distancia del cantante se oye el canto y se ensordece lo demas
	DuckVolume = 0.2, -- volumen que queda en musica y efectos mientras suena
}

-- ===== AUDIOS PROPIOS PARA SUBIR A ROBLOX =====
-- Estan en assets/audio. Subelos (Studio > Ventana > Asset Manager > Importar,
-- o Creator Hub > Audio) y pega aqui el ID que te da Roblox a cada uno.
-- Roblox solo reproduce audio subido a su plataforma: con 0 se usa lo indicado.
Config.Uploads = {
	ThroatSing = 137028063493385, -- khoomei.ogg       canto de garganta (con 0: no suena, solo salen las ondas)
	VerityRoar = 102375748179588, -- verity_roar.ogg   rugido (con 0: alarido de Pro Sound Effects grave + bajo)
	MusicCalm = 95189348267659, -- music_calm.ogg     "Estepa": morin khuur, laud, flauta (con 0: biblioteca)
	MusicWarning = 118401977155603, -- music_warning.ogg "Presagio": ultimo minuto antes de Verity
	MusicBattle = 125761599387414, -- music_battle.ogg  "Batalla": galope de tambores y morin khuur
}

-- Musica de respaldo (biblioteca con licencia de Roblox) mientras los temas
-- tradicionales no esten subidos. No hay musica mongola en la biblioteca.
Config.Music = {
	Calm = { 93932484780481, 140722099430139 }, -- Winds of Fjords, Morning
	Warning = { 138890398994853, 98165789328752 }, -- Horror Cinematic Ambience, Beneath the Dread Moon
	Battle = { 1836963388, 1836334472 }, -- Into Battle, Sword Fight (APM)
	Volume = 0.35,
}

Config.Sounds = {
	ThroatSing = Config.Uploads.ThroatSing,
	Purchase = "rbxasset://sounds/electronicpingshort.wav",
	Collect = "rbxasset://sounds/electronicpingshort.wav",
	WeaponUnlock = "rbxasset://sounds/unsheath.wav",
	BowDraw = "rbxasset://sounds/unsheath.wav", -- muy grave: cuerda tensandose
	Slash = "rbxasset://sounds/swordslash.wav",
	Lunge = "rbxasset://sounds/swordlunge.wav",
	Bass = 12221944, -- bass.wav (Roblox): golpes, truenos, impactos
	VerityRoar = Config.Uploads.VerityRoar,
	RoarSource = 9125712561, -- Nightmare Yelling Bursts Of Distorted Scream (Pro Sound Effects)
	PlayerScream = 9043345732, -- HORROR SCREAM 07 (APM)
	Victory = 12222253, -- victory.wav (Roblox)
}

Config.Weapons = {
	Sable = { DisplayName = "Sable Mongol", Damage = 25, Range = 10, Cooldown = 0.6, Ranged = false },
	Arco = { DisplayName = "Arco Compuesto", Damage = 20, Range = 90, Cooldown = 0.9, Ranged = true },
	Lanza = { DisplayName = "Lanza del Khan", Damage = 65, Range = 14, Cooldown = 1.0, Ranged = false },
	Trueno = { DisplayName = "Trueno de Tengri", Damage = 140, Range = 70, Cooldown = 2.2, Ranged = true },
} :: { [string]: Types.WeaponDef }

-- Orden = orden de los botones en el plot. "Requires" desbloquea en cadena.
Config.Buttons = {
	{ Id = "d1", Name = "Corral de Ovejas", Cost = 25, Kind = "Dropper", Slot = 1, Value = 3, Interval = 2, OreColor = Color3.fromRGB(240, 240, 230) },
	{ Id = "w1", Name = "Sable Mongol", Cost = 120, Kind = "Weapon", WeaponId = "Sable", Requires = "d1" },
	{ Id = "d2", Name = "Rebano de Cabras", Cost = 300, Kind = "Dropper", Slot = 2, Value = 8, Interval = 2, OreColor = Color3.fromRGB(150, 110, 70), Requires = "d1" },
	{ Id = "f1", Name = "Empalizada", Cost = 500, Kind = "Decor", Requires = "d2" },
	{ Id = "d3", Name = "Manada de Caballos", Cost = 1200, Kind = "Dropper", Slot = 3, Value = 20, Interval = 2, OreColor = Color3.fromRGB(90, 60, 40), Requires = "d2" },
	{ Id = "w2", Name = "Arco Compuesto", Cost = 1800, Kind = "Weapon", WeaponId = "Arco", Requires = "d3" },
	{ Id = "u1", Name = "Ruta de la Seda (x2)", Cost = 4000, Kind = "Multiplier", Multiplier = 2, Requires = "d3" },
	{ Id = "d4", Name = "Caravana de Seda", Cost = 7500, Kind = "Dropper", Slot = 4, Value = 55, Interval = 2, OreColor = Color3.fromRGB(200, 40, 60), Requires = "u1" },
	{ Id = "s1", Name = "Gran Yurta (refugio)", Cost = 9000, Kind = "Shelter", Requires = "d3" },
	{ Id = "w3", Name = "Lanza del Khan", Cost = 16000, Kind = "Weapon", WeaponId = "Lanza", Requires = "d4" },
	{ Id = "u2", Name = "Tributo Imperial (x3)", Cost = 30000, Kind = "Multiplier", Multiplier = 3, Requires = "d4" },
	{ Id = "w4", Name = "Trueno de Tengri", Cost = 50000, Kind = "Weapon", WeaponId = "Trueno", Requires = "w3" },
	-- Murallas: los jugadores las atraviesan, Verity no. Verity las golpea hasta romperlas
	-- y se reparan solas cuando se va. Cada nivel reemplaza al anterior.
	{ Id = "m1", Name = "Muralla de Madera", Cost = 2500, Kind = "Wall", WallHP = 800, WallHeight = 14, WallColor = Color3.fromRGB(120, 80, 40), WallMaterial = Enum.Material.WoodPlanks, Requires = "d2" },
	{ Id = "m2", Name = "Muralla de Piedra", Cost = 12000, Kind = "Wall", WallHP = 2500, WallHeight = 18, WallColor = Color3.fromRGB(120, 115, 105), WallMaterial = Enum.Material.Cobblestone, Requires = "m1" },
	{ Id = "m3", Name = "Gran Muralla", Cost = 45000, Kind = "Wall", WallHP = 6000, WallHeight = 24, WallColor = Color3.fromRGB(160, 140, 110), WallMaterial = Enum.Material.Brick, Requires = "m2" },
	{ Id = "p2", Name = "Segundo Piso", Cost = 20000, Kind = "Floor", Requires = "d4" },
	-- Segundo piso (los botones aparecen arriba)
	{ Id = "d5", Name = "Rebano de Yaks", Cost = 25000, Kind = "Dropper", Floor = 2, Slot = 1, Value = 120, Interval = 2, OreColor = Color3.fromRGB(60, 45, 35), Requires = "p2" },
	{ Id = "d6", Name = "Camellos Bactrianos", Cost = 40000, Kind = "Dropper", Floor = 2, Slot = 2, Value = 200, Interval = 2, OreColor = Color3.fromRGB(190, 150, 90), Requires = "d5" },
	{ Id = "d7", Name = "Halcones de Caza", Cost = 60000, Kind = "Dropper", Floor = 2, Slot = 3, Value = 320, Interval = 2, OreColor = Color3.fromRGB(150, 120, 80), Requires = "d6" },
	{ Id = "d8", Name = "Tesoro de Karakorum", Cost = 90000, Kind = "Dropper", Floor = 2, Slot = 4, Value = 500, Interval = 2, OreColor = Color3.fromRGB(255, 210, 60), Requires = "d7" },
} :: { Types.ButtonDef }

return Config
