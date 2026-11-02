--!strict
-- Lista unica de remotes. Agregar uno = agregar una linea aqui.
-- Solo hay remotes servidor -> cliente: el cliente no puede pedirle nada al
-- servidor (las compras van por Touched y los ataques por Tool.Activated).
export type RemoteName = "Notify"

local NAMES: { RemoteName } = { "Notify" }

return NAMES
