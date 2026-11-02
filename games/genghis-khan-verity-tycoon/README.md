# Genghis Khan Verity Tycoon (Roblox)

Tycoon con temática de Gengis Khan. Cada **20 minutos** llega **Verity** y todo el servidor tiene que **pelear** contra él con las armas que compró, o **esconderse** hasta que se vaya (3 minutos).

Verity usa el **mismo modelo y animaciones** del proyecto *Survive A Verity* (rama `claude/keen-galileo-at0rx6`, carpeta `roblox/MurderMysteryButVerity`):
`Lib/VerityModel.luau`, `Lib/VerityRig.luau`, `shared/VerityPose.luau`, `Controllers/VerityAnimator.luau` y `world/VerityFallback.model.json` (rig orgánico de unas 210 piezas).

## Cómo abrirlo en Studio

Se necesita [Rojo](https://rojo.space) (herramienta que sincroniza estos archivos `.luau` con Roblox Studio).

```bash
cd games/genghis-khan-verity-tycoon
```

```bash
rojo serve
```

En Studio: plugin de Rojo → **Connect**. O, para generar un archivo de lugar:

```bash
rojo build -o GenghisKhanVerityTycoon.rbxlx
```

**Recomendado: importar el modelo realista de Verity del Toolbox.** Es el mismo paso que en *Survive A Verity*: pega esto en la barra de comandos de Studio y pulsa Enter.

```lua
local id=107080030600115 local m=game:GetObjects("rbxassetid://"..id)[1] local old=game.ServerStorage:FindFirstChild("VerityCharacter") if old then old:Destroy() end m.Name="VerityCharacter" m.Parent=game.ServerStorage print("Verity importado:",m:GetFullName(),#m:GetDescendants(),"objetos")
```

El juego busca el modelo en este orden: `ServerStorage.VerityCharacter` → asset `Config.Verity.AssetId` → `ServerStorage.VerityFallback`. A cualquiera de los tres le quita los scripts (los modelos gratuitos pueden traer virus), lo escala a 18 studs y lo deja listo para animarlo. En Output aparece `[VerityModel] usando el modelo de ...`.

Para el guardado: *Game Settings → Security → Enable Studio Access to API Services*. Sin eso se juega igual, pero no se guarda nada.

## Cómo se juega

1. Al entrar se te asigna un **campamento** (6 plots alrededor del estandarte del Khan).
2. Pisa los **botones rojos** para comprar. Cada compra desbloquea la siguiente:

| Botón | Costo | Qué hace |
| --- | --- | --- |
| Corral de Ovejas | 25 | Dropper: 3 oro cada 2 s |
| Sable Mongol | 120 | Arma cuerpo a cuerpo (25 de daño) |
| Rebaño de Cabras | 300 | Dropper: 8 oro |
| Empalizada | 500 | Valla decorativa |
| Manada de Caballos | 1 200 | Dropper: 20 oro |
| Arco Compuesto | 1 800 | Arma a distancia (20 de daño, alcance 90) |
| Ruta de la Seda | 4 000 | Todo el oro x2 |
| Caravana de Seda | 7 500 | Dropper: 55 oro |
| Gran Yurta | 9 000 | **Refugio privado**: solo tú puedes esconderte dentro |
| Lanza del Khan | 16 000 | Arma cuerpo a cuerpo (65 de daño) |
| Tributo Imperial | 30 000 | Todo el oro x3 (reemplaza al x2) |
| Trueno de Tengri | 50 000 | Arma a distancia (140 de daño) |

3. Los productos caen en la cinta → llegan al **colector dorado** → pisa el **cuadro verde** para cobrar.
4. **Verity** (avisos a los 5 min, 1 min y 10 s):
   - Sale del portal negro del norte, atraviesa paredes y persigue al jugador **visible** más cercano.
   - Ataca levantando y aplastando (45 de daño) y **grita** cada 15 s (20 de daño en 35 studs).
   - Con menos del 30 % de vida se enfurece y corre más que tú.
   - Vida: 2 500 + 1 500 por cada jugador extra.
   - **Pelear:** si lo matan, se reparten 6 000 de oro según el daño de cada uno, más 500 por participar.
   - **Esconderse:** dentro de las 4 **Cuevas del Chamán** (públicas) o de tu Gran Yurta, Verity no te ve. A los 3 minutos se va.

Prueba rápida: en Studio Verity llega cada **90 s** (`Config.Verity.StudioIntervalSeconds`) y el comando de chat `/verity` lo invoca al instante (solo en Studio o para el creador del juego).

## Estructura

```text
src/
├── shared/   Config (todos los números), Types, Net/Remotes, VerityPose
├── server/   init.server.luau + Systems/
│   ├── PlayerData.luau   oro, compras, muertes de Verity (DataStore)
│   ├── World.luau        estepa, cuevas-refugio, portal
│   ├── Tycoon.luau       plots, botones, droppers, colector
│   ├── Weapons.luau      armas (daño validado en el servidor)
│   └── Verity.luau       ciclo de 20 min, IA, ataques, recompensas
│   Lib/  Build, VerityModel, VerityRig
├── client/   init.client.luau + Controllers/ (HUD, VerityFX, VerityAnimator)
└── world/    VerityFallback.model.json
```

Seguridad: el cliente no tiene ningún remote para pedirle cosas al servidor. Las compras van por `Touched` en el servidor y los ataques por `Tool.Activated`, con alcance y cooldown comprobados allí.
