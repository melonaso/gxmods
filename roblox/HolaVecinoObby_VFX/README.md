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

## Instalación en Studio (automática, recomendada)

1. Abre el place en Studio (modo edición, **sin** darle a Play).
2. Menú **View → Command Bar** (aparece una barra abajo).
3. Abre [`Installer.lua`](Installer.lua) en GitHub, botón **Raw**, selecciona todo (Ctrl+A), copia (Ctrl+C).
4. Pega en la Command Bar y pulsa **Enter**. En **View → Output** debe salir `[VFX] Instalado.`
5. **File → Save** (o publica) para que los scripts queden guardados en el place.
6. Dale a **Play**. En el Output deben salir:
   - `[VFX] Listo. Checkpoints: N | Final del lobby: N | Meta: N`
   - `[VFX] Cliente listo.`

Prueba rápida: dentro del Play, pulsa **Esc → Reset Character**. Debe salir el efecto de muerte (splash y destello rojo).

### Detección automática de partes

- **Checkpoints:** toda `SpawnLocation`, toda parte cuyo nombre empiece por `Checkpoint`, las partes con el tag `Checkpoint` y lo que esté dentro de `Workspace.Checkpoints`.
- **Final del lobby:** parte llamada `LobbyEnd…` o `FinLobby…`, con el tag `LobbyEnd` o dentro de `Workspace.LobbyEnd`.
- **Meta:** parte llamada `Finish…`, `Meta` o `Win`, con el tag `Finish` o dentro de `Workspace.Finish`.

Si el Output muestra un aviso amarillo de que no encontró el final del lobby o la meta, renombra esa parte o ponle el tag (pestaña *Tags* en Propiedades).

> Las imágenes subidas a Roblox llegan como IDs de **Decal**; el servidor las convierte solas al ID de **Image** que necesitan las partículas.

### Instalación manual (alternativa)

Crea a mano: `ReplicatedStorage/VFX` (Folder) con los ModuleScripts `Config` y `Effects`, el Script `ServerScriptService/VFXServer` y el LocalScript `StarterPlayer/StarterPlayerScripts/VFXClient`, pegando en cada uno el archivo de `src/` con el mismo nombre.

Si cambias algo en `src/`, regenera el instalador con `python3 build_installer.py`.

## Sonidos

ForgeGUI bloquea la generación de sonidos en el plan actual. `Config.Sounds` está vacío; pega allí IDs de audio del Creator Store (`"rbxassetid://..."`) y se reproducirán solos.

## Disparar efectos desde otros scripts (servidor)

```lua
local PlayVFX = game:GetService("ServerScriptService"):WaitForChild("PlayVFX")
PlayVFX:Fire("GamePass", player)                      -- p. ej. tras un Developer Product
PlayVFX:Fire("Checkpoint", player, part.Position)
```
