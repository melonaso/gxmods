# Genghis Khan Verity Tycoon (Roblox)

Tycoon con temática de Gengis Khan. Cada **5 minutos** llega **Verity** y todo el servidor tiene que **pelear** contra él con las armas que compró, o **esconderse** hasta que se vaya (3 minutos).

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

### Guardado del progreso

El juego guarda en un DataStore de Roblox el oro, las compras, las muertes de Verity y los renacimientos de cada jugador (al salir, cada 2 minutos, al renacer y al cerrar el servidor). Roblox **solo** permite guardar si:

1. El lugar está **publicado**: *Archivo → Publicar en Roblox*.
2. En *Inicio → Game Settings → Security* está activado **Enable Studio Access to API Services** (para que también guarde al probar en Studio).

Abajo a la izquierda el juego dice **"Progreso: se guarda"** (verde) o **"Progreso: NO se guarda"** (rojo) para que sepas si funciona.

## Cómo se juega

1. Al entrar ves una **introducción**: año 1206, el kurultai junto al río Onón te proclama Gengis Khan ante el estandarte blanco de nueve colas... y los chamanes hablan de la sonrisa amarilla que despierta cada noche en el círculo de piedras negras (se puede saltar; `Config.Intro.Enabled = false` la quita).
   Apareces en el **spawn del centro**. Caminos con **flechas** salen de la plaza hacia los 6 campamentos (azules = libre, grises = con dueño); aparecen al terminar la introducción y desaparecen de tu pantalla cuando reclamas tu campamento y, mientras no tengas campamento, un **haz azul** te señala el círculo libre más cercano. Elige un **campamento** libre (6 alrededor del estandarte) pisando su círculo azul **RECLAMAR CAMPAMENTO**; en cuanto tienes uno, los círculos azules de las demás bases desaparecen de tu pantalla. El contador de Verity no aparece hasta que reclamas tu campamento (y el ciclo empieza con el primer campamento del servidor).
2. Pisa los **botones rojos** para comprar. Cada compra desbloquea la siguiente:

| Botón | Costo | Qué hace |
| --- | --- | --- |
| Corral de Ovejas | 25 | Dropper: 3 oro cada 2 s |
| Sable Mongol | 120 | Sable de hoja curva, guarda de bronce y empuñadura de cuero (25 de daño) |
| Rebaño de Cabras | 300 | Dropper: 8 oro |
| Empalizada | 500 | Valla decorativa |
| Manada de Caballos | 1 200 | Dropper: 20 oro |
| Arco Compuesto | 1 800 | Arco recurvo mongol con animación: tensa la cuerda, suelta la flecha y la cuerda vibra (20 de daño, alcance 90) |
| Ruta de la Seda | 4 000 | Todo el oro x2 |
| Caravana de Seda | 7 500 | Dropper: 55 oro |
| Gran Yurta | 9 000 | **Refugio privado**: solo tú puedes esconderte dentro |
| Lanza del Khan | 16 000 | Lanza con punta de hoja de acero y borla de crin roja, con animación: baja la lanza a horizontal y lanza una estocada al frente (65 de daño, alcance 14) |
| Tributo Imperial | 30 000 | Todo el oro x3 (reemplaza al x2) |
| Trueno de Tengri | 50 000 | Báculo con anillos de oro y un orbe que brilla, con animación: lo alza sobre la cabeza y al bajarlo cae un **rayo en zigzag** sobre Verity (o al suelo delante si no está a tiro) y el orbe destella (140 de daño, alcance 70) |
| Muralla de Madera / Piedra / Gran Muralla | 2 500 / 12 000 / 45 000 | Rodea tu campamento: **los jugadores la atraviesan, Verity no**. Verity la golpea (200 por golpe) hasta romperla (800 / 2 500 / 6 000 de vida) y se repara sola cuando se va. La de madera es una empalizada de troncos afilados; las de piedra tienen zócalo, cornisa, almenas, contrafuertes y bastiones en las esquinas. La puerta tiene pilares rojos, tejadillo y placa con el nombre |
| Torres de la Puerta | 15 000 | Dos torres de piedra a los lados de la puerta (30 de alto) con escalera de mano, almenas, tejado rojo con estandarte de crines y una **balista** arriba. Siéntate en su banco, apunta con el ratón (o toca la pantalla / R2 con mando) y dispara virotes: 90 de daño, alcance 180, recarga 1,6 s |
| Segundo Piso | 20 000 | Losa con escalera, cinta, colector y caja propios |
| Yaks / Camellos / Halcones / Tesoro de Karakorum | 25 000 – 90 000 | Droppers del segundo piso: 120 / 200 / 320 / 500 oro |
| Maza de Hierro (2.º piso) | 35 000 | Shestopior (maza de seis alas) con animación: la alza y la baja de golpe con una onda en el suelo; **aturde** a Verity 0,8 s (110 de daño, alcance 12) |
| Bomba de Pólvora (2.º piso) | 75 000 | Tetsuhau (bomba de cerámica mongola) con la mecha encendida: la lanzas en arco y **explota** al caer (230 de daño en 14 studs, alcance 60, recarga 3 s). La explosión es solo visual: no empuja ni hiere a jugadores |

   - La cinta y los animales están al fondo del campamento; en el centro está la **Armería del Khan**: cada arma que compras (las 6) aparece tumbada sobre la mesa.
   - Cada **dropper** es un pórtico de madera lacada (rojo abajo, azul en el segundo piso) con tejadillo y cumbrera dorada, tolva en embudo con la mercancía asomando, farol y letrero tallado; detrás, un corral con su animal: ovejas, cabras, un caballo, un camello con fardos de seda, un yak, camellos bactrianos, halcones en sus perchas y el cofre del tesoro. La lana cae en bolas y el tesoro en monedas de oro.
3. Los productos caen en la cinta → llegan al **colector dorado** → pisa el **cuadro verde** para cobrar.
   - Las **murallas** son sólidas, con una **puerta** al frente que se abre sola cuando te acercas. Los jugadores siempre pasan por la puerta; Verity no (la golpea como al resto). Encima de la puerta hay una **barra de vida** de la muralla.
4. **Verity** (avisos a los 5 min, 1 min y 10 s):
   - Mientras espera es la **bola sonriente** original flotando en el portal negro del norte. Al llegar la hora se retuerce y se transforma en el monstruo.
   - Persigue al jugador **visible** más cercano. Atraviesa vallas y edificios, pero no las cuevas, la Gran Yurta ni las murallas.
   - Ataca levantando y aplastando (45 de daño) y **ruge** cada 15 s (20 de daño en 35 studs).
   - Con menos del 30 % de vida se enfurece y corre más que tú.
   - Vida: 5 000 + 1 500 por cada jugador extra (`Config.Verity.BaseHealth` / `HealthPerPlayer`).
   - **Pelear:** si lo matan, se reparten 6 000 de oro según el daño de cada uno, más 500 por participar. Verity **no muere**: herido, huye corriendo hacia la oscuridad del portal y la bola vuelve a aparecer.
   - **Esconderse:** dentro de las 4 **Cuevas del Chamán** (públicas) o de tu Gran Yurta, Verity no te ve. A los 3 minutos se va. Las cuevas son un pedregal de rocas con la entrada entre dos peñas, una cuerda con khadag (pañuelos de seda azul de las ofrendas), braseros y un ovoo; dentro hay una fogata con círculo de piedras, un tambor chamánico, pieles de oveja y telas colgadas.

5. **Canto de garganta (khöömei)** — tecla **G** (botón Y del mando o botón "Canto" en móvil), cada 25 s:
   - Verity a menos de 45 studs queda **aturdido** 4 s (lento y sin atacar) y recibe 60 de daño.
   - Cura 25 de vida a ti y a los jugadores a menos de 30 studs.
   - Suena el canto y salen ondas azules. Mientras dura (6,5 s), a quien esté a menos de 160 studs **se le ensordece todo lo demás** (música y efectos bajan y pierden los agudos) para que el canto se oiga claro.
6. **Música y sonido:** tres temas **tradicionales mongoles** compuestos para el juego (`tools/compose_music.py`), en La pentatónica, la misma escala que el canto de garganta:
   - **Estepa** (mientras construyes): morin khuur (violín de cabeza de caballo) con una canción larga lenta, laúd tovshuur, flauta limbe, bordón grave y viento.
   - **Presagio** (último minuto antes de Verity): bordón muy grave, morin khuur en trémolo, latidos de tambor y viento aullando.
   - **Batalla** (Verity, su huida y la batalla final): galope DUM-ta-ta de tambores y laúd, morin khuur imitando el galope y luego una melodía épica, sobre bordón de garganta.

   Botón "Música" abajo a la izquierda para silenciarla. Efectos de compra, cobro, armas, golpes, rugidos de Verity y victoria (audio con licencia de APM / Pro Sound Effects / Roblox).

### Subir los audios propios (una vez)

Roblox solo reproduce audio subido a su plataforma, así que estos archivos de `assets/audio` hay que subirlos una vez:

| Archivo | Qué es | Sin subirlo |
| --- | --- | --- |
| `khoomei.ogg` | Canto de garganta (voz sintetizada: nota grave en Do, armónico silbado Do-Re-Mi-Sol, respiración, vibrato) | El canto no suena (solo salen las ondas) |
| `verity_roar.ogg` | Rugido de Verity | Alarido de Pro Sound Effects grave + golpe de bajo |
| `music_calm.ogg` | Tema "Estepa" | Música de respaldo de la biblioteca de Roblox |
| `music_warning.ogg` | Tema "Presagio" | Música de respaldo |
| `music_battle.ogg` | Tema "Batalla" | Música de respaldo |

1. En Studio: **Ventana → Asset Manager → Importar** (puedes elegir los 5 a la vez), o Creator Hub → Development Items → Audio → Upload.
2. Copia el ID de cada uno y pégalo en **`Config.Uploads`** (al principio de `ReplicatedStorage.Shared.Config`).

**Batalla final:** cuando alguien compra **todo** su tycoon aparece un círculo dorado "BATALLA FINAL" en su campamento.
- Al pisarlo convoca la batalla: todos ven durante 20 s un botón **"Unirse a la batalla final"** (las noches normales se pausan).
- Los que se unen viajan al **Campo de la Batalla Final** montados a **caballo** (con galope animado).
- Allí despierta la **forma final de Verity**: 1,7 veces más grande, con aura de fuego y **más rápida que los caballos** (48 contra 44; 56 enfurecida), con rugidos de 60 studs. Vida: 12 000 + 6 000 por jinete extra. Tienen 6 minutos. Elige entre tres ataques según la distancia:
  - **Golpe** (cerca): levanta los brazos y aplasta (40 de daño); la **onda** del impacto daña también a los jinetes a 18 studs.
  - **Patada** (muy cerca): recoge la rodilla y patea (30 de daño) y **lanza por los aires** al jinete.
  - **Lanzamiento de rocas** (de 28 a 170 studs, cada 5 s): se agacha, arranca una roca del suelo, la sube por detrás de la cabeza y la lanza en arco apuntando por delante del jinete. Un **círculo rojo** marca dónde va a caer: muévete para esquivarla (35 de daño en 13 studs, con empujón).
- Si la matan, se retuerce y se hunde en la tierra: 60 000 de oro repartidos por daño + 10 000 a cada participante. Si caen todos o se acaba el tiempo, resiste. Al terminar, todos vuelven a su campamento.
- **Renacer (si quieres):** si ganan, a cada jinete le aparece una ventana "¿Renacer?". Renacer reinicia tu campamento y tu oro desde cero, pero ganas **+50 % de oro para siempre** por cada renacimiento (x1.5, x2, x2.5...). Si eliges "Ahora no", queda un botón "Renacer..." abajo a la izquierda mientras sigas en el servidor. Tus muertes de Verity y tus renacimientos (columna "Renacer" en la tabla) se conservan.

**El mundo:** el **pasto natural** del terreno de Roblox (hojas largas que se mueven con el viento, `Terrain.Decoration` con `GrassLength = 1`; se ve con calidad gráfica media o alta), colinas y montañas nevadas solo en el horizonte (lejos de todo edificio), el **río Onón** al sur (se puede cruzar nadando), plaza empedrada con yurtas nómadas y una fogata, caminos de tierra hacia los campamentos, **ovoos** (altares de piedras con seda azul), **caballos salvajes** pastando, atmósfera con bruma, nubes, rayos de sol y bloom. En la noche de Verity la atmósfera y las nubes se oscurecen; en la batalla final se tiñen de rojo.

Prueba rápida: Verity llega cada **5 minutos** (`Config.Verity.IntervalSeconds`, también en Studio) y el comando de chat `/verity` lo invoca al instante y `/final` convoca la batalla final sin tener el tycoon completo (solo en Studio o para el creador del juego). Abajo a la izquierda se ve la versión (`Config.Version`) para comprobar que abriste el archivo más nuevo.

## Estructura

```text
src/
├── shared/   Config (todos los números), Types, Net/Remotes, VerityPose
├── server/   init.server.luau + Systems/
│   ├── PlayerData.luau   oro, compras, muertes de Verity (DataStore)
│   ├── World.luau        estepa, cuevas-refugio, portal
│   ├── Tycoon.luau       plots, botones, droppers, colector, murallas, torres
│   ├── Weapons.luau      armas (daño validado en el servidor)
│   ├── Ballista.luau     balistas de las torres (disparo validado en el servidor)
│   └── Verity.luau       ciclo de 5 min, IA, ataques, recompensas
│   Lib/  Build, Props (animales y tesoro), Horse, VerityModel, VerityRig
├── client/   init.client.luau + Controllers/ (HUD, VerityFX, VerityAnimator,
│             WeaponAnimator, BowAnimator, Ballista, ...)
└── world/    VerityFallback.model.json
```

Seguridad: las compras van por `Touched` en el servidor y los ataques por `Tool.Activated`, con alcance y cooldown comprobados allí. Los únicos remotes del cliente son ThroatSing, FinalJoin y Rebirth (sin datos) y TowerFire (solo un punto `Vector3`: el servidor comprueba que estés sentado en una balista, la recarga y el alcance, y decide él si el virote da a Verity).
