# Efectos especiales: "De izquierda a derecha hola vecino obby"

Sistema de VFX (brillos, splashes, chispas, anillos, destellos de pantalla y banners) con texturas de partículas generadas con **ForgeGUI** y publicadas en Roblox bajo la cuenta `@melonaso12347`.

## Eventos cubiertos

| Evento | Cómo se detecta | Efecto |
|---|---|---|
| Comprar un game pass | `MarketplaceService.PromptGamePassPurchaseFinished` | Columna de brillos sobre el jugador + anillo + glow, destello dorado y banner |
| Llegar a un checkpoint | Parte con tag `Checkpoint` o dentro de `Workspace.Checkpoints` | Anillo expansivo + chispas verdes/cian + luz (solo la primera vez por checkpoint) |
| Llegar al final del lobby | Parte con tag `LobbyEnd` o dentro de `Workspace.LobbyEnd` | Explosión dorada de brillos + anillo + banner |
| Llegar a la meta | Parte con tag `Finish` o dentro de `Workspace.Finish` | 3 fuegos artificiales escalonados + destello + banner |
| Morir | `Humanoid.Died` | Splash rojo/morado + chispas + destello rojo en pantalla |

## Texturas (ForgeGUI → Roblox)

| Nombre | Asset ID |
|---|---|
| Sparkle (estrella de 4 puntas) | `84408672280834` |
| Glow (orbe suave) | `140554714981336` |
| Splash (salpicadura) | `124800911923236` |
| Spark (chispa alargada) | `134074808117970` |
| Ring (onda expansiva) | `85856607052166` |

Las texturas son blancas para teñirlas desde `Config.Colors`.

## Instalación en Studio

1. En **ReplicatedStorage** crea un `Folder` llamado `VFX`.
2. Dentro de `VFX` crea dos **ModuleScript**: `Config` y `Effects`, y pega `src/ReplicatedStorage/VFX/Config.lua` y `Effects.lua`.
3. En **ServerScriptService** crea un **Script** `VFXServer` y pega `VFXServer.server.lua`.
4. En **StarterPlayer > StarterPlayerScripts** crea un **LocalScript** `VFXClient` y pega `VFXClient.client.lua`.
5. Marca las partes:
   - Checkpoints: si ya están en una carpeta `Workspace.Checkpoints`, no hay que hacer nada. Si no, agrégales el tag `Checkpoint` (pestaña *Tags* en Propiedades).
   - Final del lobby: tag `LobbyEnd` a la parte del final del lobby.
   - Meta: tag `Finish`.
6. Prueba con **Play**.

> Si una textura sale en blanco/cuadrada: pega su ID en el campo `Texture` de cualquier ParticleEmitter en Studio. Si Studio la cambia por otro número (conversión Decal → Image), usa ese número nuevo en `Config.Textures`.

## Sonidos

ForgeGUI bloquea la generación de sonidos en el plan actual. `Config.Sounds` está vacío; pega allí IDs de audio del Creator Store (`"rbxassetid://..."`) y se reproducirán solos.

## Disparar efectos desde otros scripts (servidor)

```lua
local PlayVFX = game:GetService("ServerScriptService"):WaitForChild("PlayVFX")
PlayVFX:Fire("GamePass", player)                      -- p. ej. tras un Developer Product
PlayVFX:Fire("Checkpoint", player, part.Position)
```
