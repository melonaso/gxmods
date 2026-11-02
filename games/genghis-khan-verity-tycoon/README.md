# Genghis Khan Verity Tycoon (Roblox)

Tycoon con temática de Gengis Khan. Cada **20 minutos** llega **Verity** y todo el servidor tiene que **pelear** contra él con las armas que compró, o **esconderse** hasta que se vaya (3 minutos).

Verity usa el **mismo modelo y animaciones** del proyecto *Survive A Verity* (rama `claude/keen-galileo-at0rx6`, carpeta `roblox/MurderMysteryButVerity`):
`Lib/VerityModel.luau`, `Lib/VerityRig.luau`, `shared/VerityPose.luau`, `Controllers/VerityAnimator.luau` y `world/VerityFallback.model.json` (rig orgánico de unas 210 piezas).

## Cómo abrirlo en Studio

**Lo más fácil:** abre `GenghisKhanVerityTycoon.rbxlx` en Roblox Studio (Archivo → Abrir desde archivo). Trae todo: scripts, módulos y el modelo de Verity en `ServerStorage`.

Si cambias el código, regenera ese archivo con:

```bash
python3 tools/build_place.py
```

Opción para desarrollo con sincronización en vivo: [Rojo](https://rojo.space) (herramienta que sincroniza estos archivos `.luau` con Roblox Studio).

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
| Arco Compuesto | 1 800 | Arco recurvo mongol con animación: tensa la cuerda, suelta la flecha y la cuerda vibra (20 de daño, alcance 90) |
| Ruta de la Seda | 4 000 | Todo el oro x2 |
| Caravana de Seda | 7 500 | Dropper: 55 oro |
| Gran Yurta | 9 000 | **Refugio privado**: solo tú puedes esconderte dentro |
| Lanza del Khan | 16 000 | Arma cuerpo a cuerpo (65 de daño) |
| Tributo Imperial | 30 000 | Todo el oro x3 (reemplaza al x2) |
| Trueno de Tengri | 50 000 | Arma a distancia (140 de daño) |
| Muralla de Madera / Piedra / Gran Muralla | 2 500 / 12 000 / 45 000 | Rodea tu campamento: **los jugadores la atraviesan, Verity no**. Verity la golpea (200 por golpe) hasta romperla (800 / 2 500 / 6 000 de vida) y se repara sola cuando se va |
| Segundo Piso | 20 000 | Losa con escalera, cinta, colector y caja propios |
| Yaks / Camellos / Halcones / Tesoro de Karakorum | 25 000 – 90 000 | Droppers del segundo piso: 120 / 200 / 320 / 500 oro |

3. Los productos caen en la cinta → llegan al **colector dorado** → pisa el **cuadro verde** para cobrar.
4. **Verity** (avisos a los 5 min, 1 min y 10 s):
   - Mientras espera es la **bola sonriente** original flotando en el portal negro del norte. Al llegar la hora se retuerce y se transforma en el monstruo.
   - Persigue al jugador **visible** más cercano. Atraviesa vallas y edificios, pero no las cuevas, la Gran Yurta ni las murallas.
   - Ataca levantando y aplastando (45 de daño) y **ruge** cada 15 s (20 de daño en 35 studs).
   - Con menos del 30 % de vida se enfurece y corre más que tú.
   - Vida: 5 000 + 1 500 por cada jugador extra (`Config.Verity.BaseHealth` / `HealthPerPlayer`).
   - **Pelear:** si lo matan, se reparten 6 000 de oro según el daño de cada uno, más 500 por participar.
   - **Esconderse:** dentro de las 4 **Cuevas del Chamán** (públicas) o de tu Gran Yurta, Verity no te ve. A los 3 minutos se va.

5. **Canto de garganta (khöömei)** — tecla **G** (botón Y del mando o botón "Canto" en móvil), cada 25 s:
   - Verity a menos de 45 studs queda **aturdido** 4 s (lento y sin atacar) y recibe 60 de daño.
   - Cura 25 de vida a ti y a los jugadores a menos de 30 studs.
   - Suena el canto y salen ondas azules. Mientras dura (6,5 s), a quien esté a menos de 160 studs **se le ensordece todo lo demás** (música y efectos bajan y pierden los agudos) para que el canto se oiga claro.
6. **Música y sonido:** música tranquila mientras construyes, de tensión en el último minuto y de batalla cuando llega Verity (botón "Música" abajo a la izquierda para silenciarla). Hay efectos de compra, cobro, armas, golpes, rugidos de Verity y victoria. Todo el audio es de APM / Pro Sound Effects / DistroKid / Roblox, con licencia para experiencias.

### Subir el canto de garganta (una vez)

En la biblioteca de Roblox no hay ningún canto de garganta, así que viene sintetizado en `assets/audio/khoomei.ogg` (generado con `tools/synth_khoomei.py`). Imita una voz real: toma de aire, nota grave en Do con temblor natural del tono y del volumen, vibrato, aire de la respiración, resonancias de boca (vocal "o"), un armónico silbado que hace la melodía (Do-Re-Mi-Sol, armónicos 8-9-10-12) y eco de estepa. Para usarlo:

1. En Studio: **Ventana → Asset Manager → Importar** (o Creator Hub → Development Items → Audio → Upload) y elige `khoomei.ogg`.
2. Copia su ID y pégalo en `Config.Sounds.ThroatSing` (en `ReplicatedStorage.Shared.Config`).

Mientras sea `0` suena un sustituto: el zumbido grave de APM más una capa aguda.

### Rugido de Verity (opcional)

Verity ruge (no grita) al despertar y en su ataque de área. Sin subir nada ya suena un rugido: el alarido de Pro Sound Effects a mitad de velocidad más un golpe de bajo. Si prefieres el rugido sintetizado (`assets/audio/verity_roar.ogg`, hecho con `tools/synth_roar.py`), súbelo igual que el canto y pega su ID en `Config.Sounds.VerityRoar`.

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
