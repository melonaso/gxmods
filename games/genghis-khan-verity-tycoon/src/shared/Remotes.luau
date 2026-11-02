--!strict
-- Lista unica de remotes. Agregar uno = agregar una linea aqui.
-- Notify: servidor -> cliente. ThroatSing: cliente -> servidor, sin datos
-- (el servidor valida cooldown y que el jugador este vivo).
-- Las compras van por Touched y los ataques por Tool.Activated.
export type RemoteName = "Notify" | "ThroatSing"

local NAMES: { RemoteName } = { "Notify", "ThroatSing" }

return NAMES
