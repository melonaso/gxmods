--!strict
-- Tipos compartidos entre servidor y cliente.

export type Profile = {
	Gold: number,
	Owned: { [string]: boolean },
	VerityKills: number,
	Rebirths: number,
}

export type ButtonKind = "Dropper" | "Weapon" | "Multiplier" | "Shelter" | "Decor" | "Wall" | "Floor"

export type ButtonDef = {
	Id: string,
	Name: string,
	Cost: number,
	Kind: ButtonKind,
	Requires: string?,
	Floor: number?, -- 1 (planta baja, por defecto) o 2 (segundo piso)
	-- Dropper
	Slot: number?,
	Value: number?,
	Interval: number?,
	OreColor: Color3?,
	-- Weapon
	WeaponId: string?,
	-- Multiplier
	Multiplier: number?,
	-- Wall
	WallHP: number?,
	WallHeight: number?,
	WallColor: Color3?,
	WallMaterial: Enum.Material?,
}

export type WeaponDef = {
	DisplayName: string,
	Damage: number,
	Range: number,
	Cooldown: number,
	Ranged: boolean,
}

export type NotifyKind = "info" | "warning" | "danger" | "reward"

export type VerityPhase = "Waiting" | "Active" | "Fleeing" | "Final"

return nil
