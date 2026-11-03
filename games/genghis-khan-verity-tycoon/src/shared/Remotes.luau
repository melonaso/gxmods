--!strict
-- Lista unica de remotes. Agregar uno = agregar una linea aqui.
-- Notify: servidor -> cliente. ThroatSing: cliente -> servidor, sin datos
-- (el servidor valida cooldown y que el jugador este vivo).
-- FinalJoin: cliente -> servidor, sin datos (solo vale durante la convocatoria).
-- Rebirth: cliente -> servidor, sin datos (solo si el jugador tiene CanRebirth).
-- TowerFire: cliente -> servidor, Vector3 (punto al que apunta). El servidor
-- comprueba que este sentado en una balista, el tiempo de recarga y el
-- alcance, y decide el solo si el virote da a Verity.
-- Las compras van por Touched y los ataques por Tool.Activated.
export type RemoteName = "Notify" | "ThroatSing" | "FinalJoin" | "Rebirth" | "TowerFire"

local NAMES: { RemoteName } = { "Notify", "ThroatSing", "FinalJoin", "Rebirth", "TowerFire" }

return NAMES
