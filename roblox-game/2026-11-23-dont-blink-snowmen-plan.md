# Don't Blink: Survive the Snowmen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir y publicar antes del 15/12/2026 un juego de terror cooperativo en primera persona donde los jugadores recogen regalos en 3 etapas + final mientras muñecos de nieve solo se mueven cuando nadie los mira.

**Architecture:** Un solo place de Roblox. Lógica pura (configuración, visión, recompensas, máquina de estados de la ronda, datos de jugador) en ModuleScripts sin dependencias de `Players`, probada con un runner propio. Servicios de servidor (autoritativos) consumen esa lógica; el cliente solo muestra UI y envía intenciones validadas. Mapa y modelos construidos por Claude en Studio con piezas simples y etiquetas de `CollectionService`.

**Tech Stack:** Roblox Studio, Luau (`--!strict` en módulos nuevos), Claude Code en la PC del dueño con el MCP de Roblox Studio (crear/editar instancias y scripts, ejecutar Luau en Studio, leer la Salida, iniciar/detener Play). Sin Rojo: la fuente de verdad es el place (historial de versiones de Roblox como respaldo; publicar/guardar al final de cada tarea).

**Spec:** `roblox-game/2026-11-23-dont-blink-snowmen-design.md`

## Global Constraints

- Título del juego: `Don't Blink: Survive the Snowmen`. Todos los textos visibles en **inglés** (traducción automática de Roblox activada).
- Cámara: **primera persona fija** (`StarterPlayer.CameraMode = Enum.CameraMode.LockFirstPerson`).
- Servidor autoritativo: el cliente nunca decide monedas, eliminaciones, compras ni entregas. Todo `RemoteEvent` se valida (tipo de argumentos, estado del jugador, distancia) y tiene límite de frecuencia.
- 1–8 jugadores por servidor (`Players.MaxPlayers = 8`); debe ser jugable en solitario.
- Recompensas: **+5 por regalo entregado, +20 por etapa completada, +50 por escapar**; gamepass Monedas x2 duplica el total.
- Etapas: 1 = Pueblo, 4 regalos, 2 muñecos · 2 = Bosque con niebla, 5 regalos, 3 muñecos · 3 = Taller oscuro, 6 regalos, 4 muñecos (más rápidos) · Final = 30 s para llegar al trineo, todos los muñecos activos.
- Al entregar la mitad (redondeo hacia arriba) de los regalos de una etapa aparece **1 muñeco extra**.
- Cargando un regalo: velocidad al **80%**; solo **un regalo a la vez**.
- Eliminación: espectador el resto de la etapa; todos reviven al iniciar la siguiente; si todos caen en la misma etapa la partida se pierde y se pagan monedas hasta la última etapa completada.
- Productos: Revivir al instante (developer product, ~15 R$), Linterna potente (gamepass, ~99 R$), Monedas x2 (gamepass, ~149 R$).
- Tienda MVP: 3 gorros y 2 rastros de nieve comprables con monedas.
- No usar modelos gratuitos con scripts. Modelos hechos con Parts/MeshParts básicas.
- Lobby → cuenta regresiva 20 s (arranca con ≥1 jugador) → etapas → resultados → lobby, todo en el mismo place.

## Review Focus

1. **Un jugador sale a mitad de partida** (cargando un regalo, o siendo el último vivo): el regalo vuelve a su punto, la comprobación de "todos eliminados" se recalcula, y sus datos se guardan.
2. **Jugador que entra con una partida en curso**: espera en el lobby como espectador hasta la próxima partida (decisión de Claude: no entra a mitad de etapa).
3. **Compra de revivir duplicada o con el jugador ya fuera del servidor**: `ProcessReceipt` es idempotente y devuelve `NotProcessedYet` si no puede conceder.
4. **"Mirar a través de paredes"**: un muñeco detrás de un muro no cuenta como observado (raycast obligatorio).
5. **Partida en solitario**: la cantidad de muñecos escala hacia abajo sin quedar en 0.

---

### Task 1: Estructura del place, ajustes y runner de pruebas

**Files (instancias en Studio):**
- Create: `ReplicatedStorage/Shared` (Folder), `ReplicatedStorage/Remotes` (Folder)
- Create: `ServerScriptService/Services` (Folder), `ServerScriptService/Main` (Script)
- Create: `StarterPlayer/StarterPlayerScripts/ClientMain` (LocalScript)
- Create: `ServerStorage/Tests` (Folder), `ServerStorage/Tests/RunTests` (ModuleScript)
- Create: `ServerStorage/Tests/Sanity.spec` (ModuleScript)

**Interfaces:**
- Produces: convención de pruebas — cada `*.spec` es un ModuleScript que retorna `{[string]: () -> ()}`; un test falla si lanza error. `RunTests()` → `(passed: number, failed: number)` y imprime `PASS <spec>/<name>` o `FAIL <spec>/<name>: <err>`.
- Produces: helper `ServerStorage/Tests/Assert` con `eq(a, b, msg?)`, `truthy(v, msg?)`, `near(a, b, eps, msg?)`.

- [ ] **Step 1:** Configurar `StarterPlayer.CameraMode = LockFirstPerson`, `Players.MaxPlayers = 8` (en Game Settings), `CharacterAutoLoads = true`. Crear las carpetas y scripts vacíos de arriba.
- [ ] **Step 2:** Escribir `Sanity.spec` con un test `"one equals one"` (`Assert.eq(1, 1)`) y otro `"fails on purpose"` (`Assert.eq(1, 2)`).
- [ ] **Step 3:** Implementar `RunTests` (recorre `ServerStorage.Tests` buscando nombres que terminan en `.spec`, `pcall` por test) y `Assert`.
- [ ] **Step 4:** Ejecutar con la herramienta de código de Studio: `print(require(game.ServerStorage.Tests.RunTests)())`. Esperado: `PASS Sanity.spec/one equals one`, `FAIL Sanity.spec/fails on purpose`, salida `1 1`.
- [ ] **Step 5:** Borrar el test `"fails on purpose"`, re-ejecutar: `1 0`. Guardar el place (File → Save to Roblox).

### Task 2: Configuración del juego (`GameConfig`)

**Files:** Create `ReplicatedStorage/Shared/GameConfig` · Test `ServerStorage/Tests/GameConfig.spec`

**Interfaces:**
- Produces:
```lua
export type StageConfig = { id: number, name: string, presents: number, snowmen: number, snowmanSpeed: number, dark: boolean, fog: boolean }
GameConfig.Stages: { StageConfig } -- índices 1..3
GameConfig.Final = { durationSeconds = 30, snowmanSpeed = 18 }
GameConfig.Rewards = { perPresent = 5, perStage = 20, escape = 50 }
GameConfig.PlayerWalkSpeed = 16
GameConfig.CarrySpeedMultiplier = 0.8
GameConfig.CatchDistance = 3
GameConfig.Vision = { halfAngleDeg = 40, maxDistance = 150, flashlightRange = 40, strongFlashlightRange = 70 }
GameConfig.LobbyCountdownSeconds = 20
GameConfig.MaxPlayers = 8
GameConfig.ProductIds = { InstantRevive = 0, StrongFlashlightPass = 0, DoubleCoinsPass = 0 } -- reemplazar en Task 12
```
- Velocidades iniciales de muñecos: etapa 1 = 10, etapa 2 = 12, etapa 3 = 15 (ajustables en pruebas).

- [ ] **Step 1:** Test `"stages match spec"`: `#Stages == 3`; presents `{4,5,6}`; snowmen `{2,3,4}`; `Stages[2].fog == true`; `Stages[3].dark == true`; `Rewards.perPresent == 5`, `perStage == 20`, `escape == 50`; `Final.durationSeconds == 30`.
- [ ] **Step 2:** Ejecutar runner → FAIL (módulo inexistente).
- [ ] **Step 3:** Implementar `GameConfig` con los valores de Interfaces (tabla congelada con `table.freeze`).
- [ ] **Step 4:** Runner → PASS. Guardar.

### Task 3: Lógica de visión (`Vision`)

**Files:** Create `ReplicatedStorage/Shared/Vision` · Test `ServerStorage/Tests/Vision.spec`

**Interfaces:**
- Produces:
```lua
Vision.isInViewCone(eyePos: Vector3, lookVector: Vector3, targetPos: Vector3, halfAngleDeg: number, maxDistance: number): boolean
Vision.snowmenCountFor(baseCount: number, playerCount: number): number
```
- `isInViewCone` usa solo el plano horizontal (ignora Y de `lookVector` y de la dirección al objetivo), porque el servidor solo conoce la orientación horizontal del personaje.
- `snowmenCountFor`: 1 jugador → `max(1, baseCount - 1)`; 2–4 → `baseCount`; 5–8 → `baseCount + 1`.

- [ ] **Step 1:** Tests: `"target straight ahead is visible"` (eye `(0,5,0)`, look `(0,0,-1)`, target `(0,5,-20)`, 40°, 150 → true); `"target behind is not visible"` (target `(0,5,20)` → false); `"target at 50 degrees is not visible"`; `"target beyond max distance is not visible"` (`(0,5,-200)` → false); `"height difference does not matter"` (target `(0,40,-20)` → true); `"solo player still gets one snowman"` (`snowmenCountFor(1,1) == 1`); `snowmenCountFor(2,1) == 1`, `snowmenCountFor(3,4) == 3`, `snowmenCountFor(3,6) == 4`.
- [ ] **Step 2:** Runner → FAIL.
- [ ] **Step 3:** Implementar ambas funciones.
- [ ] **Step 4:** Runner → PASS. Guardar.

### Task 4: Recompensas (`Rewards`)

**Files:** Create `ReplicatedStorage/Shared/Rewards` · Test `ServerStorage/Tests/Rewards.spec`

**Interfaces:**
- Produces: `Rewards.compute(presentsDelivered: number, stagesCompleted: number, escaped: boolean, doubleCoins: boolean): number`
- `presentsDelivered` son los regalos que entregó **ese jugador**.

- [ ] **Step 1:** Tests: `compute(0,0,false,false) == 0`; `compute(3,1,false,false) == 35`; `compute(6,3,true,false) == 140`; `compute(6,3,true,true) == 280`; `"negative input clamps to zero"`: `compute(-2,-1,false,false) == 0`.
- [ ] **Step 2:** Runner → FAIL.
- [ ] **Step 3:** Implementar usando `GameConfig.Rewards`.
- [ ] **Step 4:** Runner → PASS. Guardar.

### Task 5: Máquina de estados de la ronda (`RoundState`)

**Files:** Create `ReplicatedStorage/Shared/RoundState` · Test `ServerStorage/Tests/RoundState.spec`

**Interfaces:**
- Produces:
```lua
export type Phase = "Lobby" | "Countdown" | "Stage" | "Final" | "Results"
export type State = { phase: Phase, stage: number, stagesCompleted: number, won: boolean? }
RoundState.new(): State                         -- { phase = "Lobby", stage = 0, stagesCompleted = 0 }
RoundState.next(s: State, event: string): State -- puro, retorna un estado nuevo
```
- Eventos y transiciones:
  - `Lobby` + `"playersReady"` → `Countdown`
  - `Countdown` + `"countdownDone"` → `Stage` (stage 1)
  - `Countdown` + `"allLeft"` → `Lobby`
  - `Stage n` + `"stageCleared"` → `Stage n+1` (stagesCompleted = n); si n == 3 → `Final` (stagesCompleted = 3)
  - `Stage`/`Final` + `"allEliminated"` → `Results` con `won = false`
  - `Final` + `"escaped"` → `Results` con `won = true`
  - `Final` + `"timeUp"` → `Results` con `won = false`
  - `Results` + `"resultsDone"` → `Lobby` (reinicia contadores)
  - Cualquier otro par → error `"invalid transition <phase>+<event>"`.

- [ ] **Step 1:** Tests: recorrido completo ganador (Lobby→…→Stage 3→Final→Results won=true→Lobby); `"wipe on stage 2 keeps stagesCompleted 1"`; `"final timeout loses"`; `"invalid transition errors"` (`pcall(RoundState.next, RoundState.new(), "escaped")` → false).
- [ ] **Step 2:** Runner → FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Runner → PASS. Guardar.

### Task 6: Datos de jugador (`PlayerData` + `DataService`)

**Files:** Create `ReplicatedStorage/Shared/PlayerDataSchema` · Create `ServerScriptService/Services/DataService` · Test `ServerStorage/Tests/PlayerDataSchema.spec`

**Interfaces:**
- Produces:
```lua
export type Profile = { version: number, coins: number, owned: { [string]: boolean }, equippedHat: string?, equippedTrail: string? }
PlayerDataSchema.default(): Profile               -- version 1, coins 0, owned {}
PlayerDataSchema.reconcile(raw: any): Profile     -- rellena campos faltantes, descarta tipos inválidos
DataService.get(player: Player): Profile?
DataService.addCoins(player: Player, amount: number): ()
DataService.spendCoins(player: Player, amount: number): boolean
DataService.grantItem(player: Player, itemId: string): ()
DataService.Loaded: BindableEvent  -- (player)
```
- DataStore `"PlayerData_v1"`, clave `"u_" .. userId`. `UpdateAsync` con 3 reintentos y espera exponencial (1, 2, 4 s). Guardar en `PlayerRemoving`, autoguardado cada 120 s y en `game:BindToClose`. Si la carga falla tras reintentos: expulsar al jugador con mensaje `"Data failed to load, please rejoin."` (evita sobrescribir datos con un perfil vacío). Crear `leaderstats.Coins` reflejando `coins`.

- [ ] **Step 1:** Tests de `reconcile`: `nil` → default; `{coins = "x"}` → coins 0; `{coins = 50, owned = {Hat_Santa = true}}` conserva ambos; campos desconocidos se descartan.
- [ ] **Step 2:** Runner → FAIL. **Step 3:** Implementar `PlayerDataSchema`. **Step 4:** Runner → PASS.
- [ ] **Step 5:** Implementar `DataService` y llamarlo desde `Main`. Activar "Enable Studio Access to API Services" en Game Settings → Security.
- [ ] **Step 6:** Verificación en Play: ejecutar en la consola del servidor `require(game.ServerScriptService.Services.DataService).addCoins(game.Players:GetPlayers()[1], 25)`, detener, volver a Play → `leaderstats.Coins == 25`. Guardar.

### Task 7: Mapa y modelos

**Files (instancias):** `Workspace/Lobby`, `Workspace/Stages/Stage1`, `Stage2`, `Stage3`, `Workspace/Stages/Final`; `ServerStorage/Templates/Snowman`, `ServerStorage/Templates/Present`; `ServerStorage/Cosmetics/Hats/{Hat_Santa, Hat_Elf, Hat_Reindeer}`, `ServerStorage/Cosmetics/Trails/{Trail_Snow, Trail_Candy}`.

**Interfaces:**
- Produces (etiquetas de `CollectionService` y atributos que usan las tareas siguientes):
  - Por etapa, una Part `PlayerSpawn` (tag `StageSpawn`, atributo `Stage: number`; Final usa `Stage = 4`).
  - 10–12 Parts invisibles con tag `PresentSpawn` y atributo `Stage` por etapa.
  - 1 Part `DeliveryPoint` (tag `DeliveryPoint`, atributo `Stage`) con forma de saco/trineo.
  - 4–6 Parts con tag `SnowmanSpawn` y atributo `Stage`.
  - Final: Part `SleighZone` (tag `EscapeZone`).
  - Lobby: Part `LobbySpawn` (SpawnLocation) y Part `ShopStand` (tag `ShopStand`).
  - `Snowman`: Model con `PrimaryPart = HumanoidRootPart` (Humanoid para pathfinding), 3 esferas blancas, ojos negros, sonrisa de carbón inquietante, nariz de zanahoria; ~7 studs de alto.
  - `Present`: Model con PrimaryPart `Box` (caja de color con lazo).
- Las etapas están separadas físicamente (cada una en su zona, a ≥500 studs) para que los muñecos de una no persigan a jugadores de otra.

- [ ] **Step 1:** Construir el Lobby (plataforma, cartel con el título, `ShopStand`).
- [ ] **Step 2:** Construir Stage1 (pueblo: casas de bloques, faroles, calles), Stage2 (bosque: pinos de conos, zona amplia), Stage3 (taller: interior con pasillos, mesas, cintas), Final (pista recta con obstáculos y el trineo al final). Con tags y atributos.
- [ ] **Step 3:** Construir `Snowman`, `Present` y los 5 cosméticos (gorros como Accessory, rastros como Trail con dos Attachments).
- [ ] **Step 4:** Verificación: ejecutar en Studio un conteo por tag/atributo; esperado por etapa: 1 `StageSpawn`, ≥ (regalos+4) `PresentSpawn`, 1 `DeliveryPoint`, ≥ (muñecos+2) `SnowmanSpawn`; 1 `EscapeZone`. Ningún modelo contiene `Script`/`LocalScript` salvo los nuestros. Guardar.

### Task 8: Regalos (`PresentService`)

**Files:** Create `ServerScriptService/Services/PresentService`

**Interfaces:**
- Consumes: `GameConfig`, tags `PresentSpawn`/`DeliveryPoint`.
- Produces:
```lua
PresentService.startStage(stage: number, count: number): ()   -- elige `count` PresentSpawn al azar sin repetir
PresentService.stopStage(): ()                                 -- destruye regalos, suelta los cargados
PresentService.dropCarried(player: Player): ()                 -- el regalo vuelve a su punto original
PresentService.isCarrying(player: Player): boolean
PresentService.Delivered: BindableEvent   -- (player, deliveredSoFar: number, total: number)
PresentService.AllDelivered: BindableEvent
PresentService.deliveredBy(player: Player): number             -- acumulado de la partida, para Rewards
PresentService.resetMatch(): ()
```
- Recoger con `ProximityPrompt` (`HoldDuration = 0.5`, distancia 8) solo si el jugador está vivo y no carga otro; cargado se suelda a la mano/frente de la cámara; `WalkSpeed = 16 * 0.8`. Entregar con `ProximityPrompt` en el `DeliveryPoint`. Llamar `dropCarried` en eliminación y en `PlayerRemoving`.

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** Verificación en Play (servidor): `startStage(1, 4)` → aparecen 4 regalos; recoger uno → velocidad 12.8 y no se puede recoger un segundo; entregarlo → Salida muestra `Delivered 1/4`; salir de la partida con uno cargado (Players → quitar jugador en prueba local con 2 jugadores) → el regalo reaparece. Guardar.

### Task 9: Vida, espectador y fin por eliminación (`AliveService`)

**Files:** Create `ServerScriptService/Services/AliveService`; Create `StarterPlayer/StarterPlayerScripts/SpectateController` (LocalScript)

**Interfaces:**
- Produces:
```lua
AliveService.setParticipants(players: { Player }): ()
AliveService.isAlive(player: Player): boolean
AliveService.eliminate(player: Player): ()     -- dropCarried, oculta personaje, notifica al cliente
AliveService.reviveAll(spawnCFrames: { CFrame }): ()
AliveService.aliveCount(): number
AliveService.AllEliminated: BindableEvent
AliveService.reviveOne(player: Player): ()     -- usado por la compra de revivir
```
- Remote `Remotes/SpectateState` (servidor → cliente: `isSpectating: boolean`). El cliente en espectador sigue con la cámara a un jugador vivo y cambia con clic/toque.
- `PlayerRemoving` de un participante lo quita y recalcula `AllEliminated` (Review Focus 1). Participantes con 0 vivos → `AllEliminated`.

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** Verificación en Play con 2 jugadores locales (Test → Clients and Servers, 2), eliminando desde la consola del servidor con `AliveService.eliminate`: A eliminado → A es espectador viendo a B; B eliminado → `AllEliminated` se dispara una sola vez. Repetir saliendo B estando A eliminado → `AllEliminated`. Guardar.

### Task 10: Muñecos de nieve (`SnowmanService`)

**Files:** Create `ServerScriptService/Services/SnowmanService`

**Interfaces:**
- Consumes: `Vision`, `GameConfig`, tag `SnowmanSpawn`, plantilla `Snowman`, `AliveService.isAlive` (Task 9).
- Produces:
```lua
SnowmanService.spawn(stage: number, count: number, speed: number): ()
SnowmanService.addOne(): ()                    -- muñeco extra a mitad de etapa
SnowmanService.clear(): ()
SnowmanService.setSpeed(speed: number): ()
SnowmanService.Caught: BindableEvent           -- (player)
SnowmanService.isObserved(snowman: Model): boolean
```
- Bucle a 10 Hz (`task.wait(0.1)`): un muñeco está observado si **algún jugador vivo** cumple `Vision.isInViewCone(cabeza, HumanoidRootPart.CFrame.LookVector, posición del muñeco, 40, 150)` **y** un raycast desde la cabeza hacia el centro del muñeco (excluyendo personajes) golpea el propio muñeco. En etapas con `dark = true`, además la distancia debe ser ≤ `flashlightRange` (o `strongFlashlightRange` si el jugador tiene el gamepass — atributo `HasStrongFlashlight` del jugador, puesto por Task 12).
- Observado → `Humanoid:MoveTo(posición actual)` y anclar; no observado → desanclar y seguir al jugador vivo más cercano con `PathfindingService` (recalcular ruta cada 0.5 s; si falla, `MoveTo` directo).
- Si la distancia a un jugador vivo ≤ `CatchDistance` y el muñeco **no** está observado → disparar `Caught(player)`.
- Sonido de nieve crujiendo en bucle mientras se mueve.

- [ ] **Step 1:** Implementar y conectar `SnowmanService.Caught → AliveService.eliminate` en `Main`.
- [ ] **Step 2:** Verificación en Play con 1 jugador en Stage1: mirando al muñeco → no se mueve; dándole la espalda → se acerca y te atrapa (Salida `Caught <name>`); con un muro entre ambos aunque "mires" en su dirección → se mueve (Review Focus 4). Medir que el bucle no supere ~1 ms de servidor en el MicroProfiler con 5 muñecos. Guardar.

### Task 11: Orquestación de la partida (`RoundService`) y HUD

**Files:** Create `ServerScriptService/Services/RoundService`; Create `StarterGui/HUD` (ScreenGui) + `StarterPlayer/StarterPlayerScripts/HudController`

**Interfaces:**
- Consumes: `RoundState`, `PresentService`, `SnowmanService`, `AliveService`, `DataService`, `Rewards`, `GameConfig`.
- Produces: Remote `Remotes/RoundInfo` (servidor → todos): `{ phase: string, stage: number, delivered: number, total: number, timeLeft: number?, aliveCount: number }`; Remote `Remotes/Results` (servidor → jugador): `{ won: boolean, coins: number, stagesCompleted: number }`.
- Flujo: lobby espera ≥1 jugador → cuenta 20 s (si todos salen → lobby) → participantes = jugadores presentes al terminar la cuenta; los que entren después esperan en el lobby (Review Focus 2) → por etapa: teletransportar vivos+revividos al `StageSpawn`, `PresentService.startStage`, `SnowmanService.spawn(stage, Vision.snowmenCountFor(base, #participantes), speed)`; al `Delivered` con `deliveredSoFar == math.ceil(total/2)` → `SnowmanService.addOne()`; `AllDelivered` → `stageCleared` → Final: 30 s, todos los muñecos activos a `Final.snowmanSpeed`; tocar `EscapeZone` vivo marca escapado; el Final termina cuando todos los vivos escaparon (`escaped`) o al agotarse el tiempo (`timeUp`, se pierde para quienes no subieron). En `Final`, cada jugador que escapó cobra `escape`.
- Resultados 8 s → `DataService.addCoins(player, Rewards.compute(PresentService.deliveredBy(p), stagesCompleted, escaped(p), owns x2))` → volver al lobby.
- HUD (inglés): `Stage 2/3 — Presents 3/5`, temporizador en el Final, `Players alive: 3`, banner `YOU WERE CAUGHT — Spectating` y pantalla `ESCAPED! +140 coins` / `THE SNOWMEN GOT YOU +35 coins`.

- [ ] **Step 1:** Implementar `RoundService` con las transiciones de `RoundState` (nunca cambiar fase sin pasar por `RoundState.next`).
- [ ] **Step 2:** Implementar HUD.
- [ ] **Step 3:** Verificación en Play solitario: partida completa ganando → coins = 6+5+4 regalos ×5 + 60 + 50 = 185 (sin x2) y vuelve al lobby; partida perdiendo en etapa 2 tras entregar 4+2 regalos → 6×5 + 20 = 50. Revisar que no haya errores en la Salida. Guardar.

### Task 12: Monetización

**Files:** Create `ServerScriptService/Services/MonetizationService`; Modify `ReplicatedStorage/Shared/GameConfig` (ProductIds)

**Interfaces:**
- Consumes: `AliveService.reviveOne`, `RoundService` (fase actual).
- Produces: atributos de jugador `HasStrongFlashlight: boolean`, `HasDoubleCoins: boolean`; Remote `Remotes/RequestRevive` (cliente → servidor, sin argumentos) que solo llama `MarketplaceService:PromptProductPurchase` si el jugador está eliminado y la fase es `Stage` o `Final`.
- `ProcessReceipt`: registrar `PurchaseId` en DataStore `"Receipts_v1"` antes de conceder; si ya existe → `PurchaseGranted`; si el jugador no está en el servidor o no está eliminado → `NotProcessedYet` (Review Focus 3). Gamepasses: comprobar con `UserOwnsGamePassAsync` al entrar y en `PromptGamePassPurchaseFinished`.

- [ ] **Step 1:** El dueño crea en Creator Hub el developer product "Instant Revive" (15 R$) y los gamepasses "Strong Flashlight" (99 R$) y "Double Coins" (149 R$); copiar los IDs a `GameConfig.ProductIds`.
- [ ] **Step 2:** Implementar `MonetizationService` y el botón `REVIVE NOW (R$15)` en el banner de espectador.
- [ ] **Step 3:** Verificación en Studio (compras de prueba, sin cargo): comprar revivir estando eliminado → reaparece en la etapa actual; repetir el mismo recibo (invocar `ProcessReceipt` dos veces con el mismo `PurchaseId` desde la consola) → se concede una sola vez; comprar gamepasses → atributos en `true`, linterna llega a 70 en etapa 3, monedas duplicadas en resultados. Guardar.

### Task 13: Tienda de cosméticos

**Files:** Create `ReplicatedStorage/Shared/ShopCatalog`, `ServerScriptService/Services/ShopService`, `StarterGui/Shop` + `StarterPlayer/StarterPlayerScripts/ShopController` · Test `ServerStorage/Tests/ShopCatalog.spec`

**Interfaces:**
- Produces: `ShopCatalog.Items: { [string]: { kind: "Hat" | "Trail", price: number, displayName: string } }` con `Hat_Santa` 100, `Hat_Elf` 150, `Hat_Reindeer` 250, `Trail_Snow` 200, `Trail_Candy` 300 (monedas; ajustables). Remotes `Remotes/BuyItem(itemId: string)` y `Remotes/EquipItem(itemId: string)`; el servidor valida que `itemId` exista, el precio con `DataService.spendCoins`, y equipa clonando desde `ServerStorage/Cosmetics` al reaparecer.

- [ ] **Step 1:** Test: los 5 ids existen, `kind` válido, precios > 0. **Step 2:** FAIL. **Step 3:** Implementar catálogo. **Step 4:** PASS.
- [ ] **Step 5:** Implementar servicio y UI (se abre con el `ShopStand`).
- [ ] **Step 6:** Verificación: con 99 monedas no se puede comprar `Hat_Santa`; con 100 sí, quedan 0 y el gorro persiste tras salir y volver; `BuyItem("Fake")` desde la consola del cliente no hace nada. Guardar.

### Task 14: Ambiente y sonido

**Files:** Modify `Lighting` (y `Atmosphere`); Create `ServerScriptService/Services/AmbienceService`

**Interfaces:**
- Consumes: fase/etapa de `RoundService`. Produces: `AmbienceService.apply(stage: number | "Lobby" | "Final")`.
- Noche permanente (`ClockTime = 0`), nieve con `ParticleEmitter` alrededor de la cámara (cliente), niebla densa en Stage2, oscuridad casi total en Stage3 con linterna (`SpotLight` en la cabeza, alcance según atributo), música/ambiente y efectos de la Creator Store con licencia de Roblox.

- [ ] **Step 1:** Implementar y probar cada etapa en Play.
- [ ] **Step 2:** Verificación: en Stage3 sin gamepass, un muñeco a 50 studs no se ve ni cuenta como observado; con gamepass sí. Medir FPS en el emulador de dispositivo móvil de Studio (≥ 30 FPS). Guardar.

### Task 15: Pruebas con amigos y publicación

- [ ] **Step 1:** Ejecutar el runner de pruebas: todo PASS.
- [ ] **Step 2:** Partida de prueba en Studio con 3 clientes recorriendo los 5 casos de Review Focus.
- [ ] **Step 3:** Publicar como privado, probar con 2–4 amigos en PC y móvil; anotar ajustes de velocidad/dificultad y aplicarlos en `GameConfig`.
- [ ] **Step 4:** El dueño sube ícono y miniatura; título `Don't Blink: Survive the Snowmen`; descripción en inglés; género Horror; cuestionario de madurez; activar traducción automática.
- [ ] **Step 5:** Hacer público (meta: 10–15/12/2026).
