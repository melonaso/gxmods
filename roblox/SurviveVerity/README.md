# Survive Verity

Juego de Roblox estilo *Murder Mystery 2* (lobby → ronda → resultados) con gameplay de *Survive the Killer*: un jugador es **Verity** (la asesina) y el resto son supervivientes. No hay sheriff.

## Cómo jugar

| Rol | Objetivo |
| --- | --- |
| **Verity** | Atrapar a todos los supervivientes con el cuchillo (clic) antes de que acabe el reloj. Empieza congelada 10 s. |
| **Superviviente** | Resistir hasta que el reloj llegue a 0. Puede acortar la ronda crafteando tótems. |

### Puzzle: oro y tótems
1. Por la mansión aparecen **bloques de oro** (brillan y giran). Mantén `E` para recogerlos (máx. 2 encima).
2. Llévalos a una de las **3 mesas de crafteo** y deposítalos.
3. Con **3 de oro** en la mesa, mantén `F` 3 s para **craftear un tótem**: **−30 s** al reloj de la ronda (máx. 5 tótems; nunca baja de 15 s).
4. Si mueres llevando oro, lo sueltas en el suelo. El oro reaparece con el tiempo.

### Probabilidad de ser Verity
Sistema tipo MM2: cada ronda que **no** eres Verity sumas +1 de suerte (máx. 10); al ser elegido vuelve a 0.

`peso = (1 + suerte) × multiplicador del pase × multiplicador de poción`
`probabilidad = tu peso / suma de pesos de todos`

Ejemplo: 3 jugadores sin suerte (peso 1 cada uno) y tú con el pase **2x** (peso 2): 2 / (2+1+1) = **50 %** en vez de 33 %.

## Monetización
Configura los IDs en [`src/shared/Config.luau`](src/shared/Config.luau) (con `Id = 0` el botón muestra "Pronto"):

- **Pase 2x Probabilidad** y **Pase 3x Probabilidad** (permanentes; se aplica el más alto).
- **Poción de Verity** (producto de desarrollador): x5 en la próxima ronda. Se guarda en DataStore de forma idempotente.

## Interfaz
UI discreta construida por código: píldora superior con fase y reloj, línea de info (probabilidad / tótems / vivos), chip de oro abajo a la izquierda, avisos pequeños arriba a la derecha, tarjeta de rol al empezar, banner de resultados y un botón "Pases" que solo aparece fuera de la partida. Los supervivientes ven una viñeta roja que late cuando Verity está cerca.

Texturas de VFX generadas con **ForgeGUI** y publicadas en Roblox ([`src/shared/Assets.luau`](src/shared/Assets.luau)): destello (oro), orbe (golpe) y onda expansiva (tótem).

## Instalación (Rojo)
```bash
rojo serve        # y conecta con el plugin de Rojo en Studio
# o
rojo build -o SurviveVerity.rbxlx
```
Activa **Game Settings → Security → Enable Studio Access to API Services** para probar DataStores en Studio. Prueba con *Test → Clients and Servers* (2+ jugadores).

## Personalización
- **Modelo de Verity**: coloca un Model R15 llamado `VerityCharacter` en `ServerStorage` (con `Humanoid`, `HumanoidRootPart` y script `Animate`). Sin él, se aplica un aspecto oscuro con capucha y ojos rojos al avatar.
- **Mapas propios**: Models en `ServerStorage/Maps` con `SurvivorSpawns` (Folder), `KillerSpawn` (Part), `GoldSpawns` (Folder) y `CraftingTables` (Folder). Sin mapas, se genera una **mansión procedural** 4×4 distinta en cada ronda.
- **Lobby propio**: un Model `Lobby` en Workspace con un `SpawnLocation`.
- Todos los tiempos y números están en `Config.luau`.

## Estructura
```
src/shared   → ReplicatedStorage.Shared   (Config, Net, Assets)
src/server   → ServerScriptService.Server (Round, Killer, Crafting, MapService, PlayerData, Monetization)
src/client   → StarterPlayerScripts.Client (HUD, Shop, WorldFX)
```
Un solo `Script` y un solo `LocalScript`; el resto son ModuleScripts. Solo hay remotes servidor → cliente (el estado viaja por atributos), y todas las acciones (recoger, depositar, craftear, atacar) se validan en el servidor.
