--!strict
-- Todos los numeros de balance en un solo lugar.
-- Ojo: el cliente puede leer este archivo; el servidor es quien valida.
local Types = require(script.Parent.Types)

local Config = {}

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
	IntervalSeconds = 20 * 60, -- cada 20 minutos
	StudioIntervalSeconds = 90, -- en Studio llega antes para poder probar
	DurationSeconds = 180, -- si nadie lo mata, se va a los 3 minutos
	BaseHealth = 2500,
	HealthPerPlayer = 1500,
	WalkSpeed = 14, -- los jugadores corren a 16
	EnragedSpeed = 19, -- por debajo del umbral de vida ya no se le puede huir
	EnrageThreshold = 0.3,
	HitRadius = 5, -- "grosor" de Verity para calcular el alcance de las armas
	MeleeRange = 11, -- brazos larguisimos
	MeleeDamage = 45,
	MeleeCooldown = 2.8, -- debe ser >= AttackAnimTime
	ScreamCooldown = 15,
	ScreamRadius = 35,
	ScreamDamage = 20,
	RewardPool = 6000, -- se reparte segun el dano que hizo cada uno
	ParticipationReward = 500,
	WallDamage = 200, -- dano por golpe a una muralla que le cierra el paso
	WarningTimes = { 300, 60, 10 },
}

-- Canto de garganta mongol (khöömei): tecla G / boton en pantalla.
Config.ThroatSing = {
	Cooldown = 25,
	Duration = 5,
	StunRadius = 45, -- Verity a esta distancia queda aturdido
	StunSeconds = 4,
	Damage = 60,
	HealRadius = 30, -- cura a los aliados cercanos (y a ti)
	Heal = 25,
}

-- Audio con licencia para experiencias (APM / Pro Sound Effects / DistroKid /
-- Roblox), el mismo catalogo que usa "Survive A Verity".
Config.Music = {
	Calm = { 140722099430139, 9047876673, 93932484780481 }, -- Morning, Happy Adventure, Winds of Fjords
	Warning = { 138890398994853, 98165789328752 }, -- Horror Cinematic Ambience, Beneath the Dread Moon
	Battle = { 1836963388, 1845149698, 1836334472 }, -- Into Battle, Seek & Destroy, Sword Fight (APM)
	Drone = 9043360237, -- METALLIC DRONE 03 (APM): capa de tension mientras Verity esta
	Volume = 0.35,
}

Config.Sounds = {
	-- Sube assets/audio/khoomei.ogg (Studio > Asset Manager > Importar) y pega su ID aqui.
	-- Con 0 suena un sustituto: el zumbido grave de APM.
	ThroatSing = 0,
	ThroatSingFallback = 9043360237,
	Purchase = "rbxasset://sounds/electronicpingshort.wav",
	Collect = "rbxasset://sounds/electronicpingshort.wav",
	WeaponUnlock = "rbxasset://sounds/unsheath.wav",
	Slash = "rbxasset://sounds/swordslash.wav",
	Lunge = "rbxasset://sounds/swordlunge.wav",
	Bass = 12221944, -- bass.wav (Roblox): golpes, truenos, impactos
	VerityScream = 9125712561, -- Nightmare Yelling Bursts Of Distorted Scream (Pro Sound Effects)
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
