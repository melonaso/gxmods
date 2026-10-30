# Survive A Verity

Juego de Roblox estilo *Murder Mystery 2* (lobby → ronda → resultados) con gameplay de *Survive the Killer*: un jugador es **Verity** (la criatura asesina) y el resto son supervivientes. No hay sheriff.

## Abrir y probar
1. Abre `SurviveAVerity.rbxlx` en Roblox Studio.
2. **(Recomendado) Importa el modelo realista de Verity** pegando esta línea en la barra de comandos de Studio (abajo, "Ejecutar un comando") y pulsando Enter:
   ```lua
   local id=107080030600115 local m=game:GetObjects("rbxassetid://"..id)[1] local old=game.ServerStorage:FindFirstChild("VerityCharacter") if old then old:Destroy() end m.Name="VerityCharacter" m.Parent=game.ServerStorage print("Verity importado:",m:GetFullName(),#m:GetDescendants(),"objetos")
   ```
   Luego guarda (Ctrl+S). Si ese modelo no te convence, cambia `id` por otro de la lista de abajo y repite.
3. Pulsa **Play**. En Output verás `[VerityModel] usando el modelo de ...` con la fuente elegida.

### Modelos de Verity en el Toolbox
Encontrados con ForgeGUI (`toolbox_search`). El juego quita todos los scripts del modelo (los modelos gratuitos pueden traer virus), lo escala a ~18 studs (`Config.Verity.Height`; las puertas miden 20) y lo adapta para animarlo:

| ID | Nombre | Autor |
| --- | --- | --- |
| 107080030600115 | verity | JayJay00630 (el mejor valorado) |
| 77078054144134 | Verity rig | Plumones11c |
| 90398340255135 | verity | Cessybee |
| 72873880902024 | verity | pro123game123start |

Si no importas ninguno, se usa `ServerStorage/VerityFallback`: un modelo orgánico de ~190 piezas basado en la imagen de referencia (cuerpo esquelético con costillas, cintura de avispa, cuello con tendones, clavículas, brazos larguísimos hasta las rodillas, dedos largos, rodillas y gemelos marcados, y cabeza de huevo calva con cuencas hundidas y una sonrisa enorme de dientes grandes). Antes de eso, el juego intenta `InsertService:LoadAsset` (solo funciona si el creador del juego posee el modelo).

## Partida en solitario (NPCs)
`Config.Round.SoloBots = true` en [`src/shared/Config.luau`](src/shared/Config.luau):
- Si estás **solo en el servidor**, la ronda se completa con NPCs hasta **10 participantes**: tú + 9 NPCs si eres Verity, o tú + Verity NPC + 8 NPCs si eres superviviente. Los NPCs huyen, se esconden, cambian de sitio al ser revelados, recogen oro y craftean tótems.
- En solitario **alternas**: una ronda eres Verity y la siguiente superviviente. El lobby muestra "Próxima ronda: Verity / Superviviente".
- La **Verity NPC** ve con la vista (no a través de paredes), persigue al más cercano, va adonde te vio por última vez, te saca del escondite si te vio entrar, registra escondites al patrullar y usa la revelación de cada minuto. Persigue a 28; tú corres a 40 mientras te dure la estamina.
- Si caes como superviviente frente a la Verity NPC, la ronda termina 20 s después.
- **Si entra otro jugador**, los NPCs desaparecen al instante y esa ronda se cancela, sin premios. La siguiente ronda ya es entre jugadores reales, sin NPCs (mínimo 2).

## Ronda
1. **Intermedio de 23 s** en el lobby.
2. Cinemática de inicio: barras de cine, nombre del mapa (5 s) y la cámara rodea a tu personaje.
3. Verity empieza como una **bola sonriente** (su diseño original) durante **20 s**.
4. Al liberarse, la bola **se retuerce con crujidos de huesos** y se transforma en el monstruo (2,6 s); si eres Verity, la cámara orbita la transformación. Cuando queda libre, **todo el mapa oye un alarido distorsionado y grave** sobre dos golpes sordos (*Nightmare Yelling*, Pro Sound Effects), con temblor de cámara y destello rojo.
5. **Verity ve en la oscuridad** (solo en su pantalla, sin filtros de color): para ella la noche se ve casi como de día, con luz ambiente alta, menos niebla y una luz suave alrededor. Los supervivientes siguen viendo la noche oscura y tienen su linterna (`F`).
6. Verity atrapa con `Q`: la víctima **grita** mientras la levanta y el grito se corta en seco con la explosión.
7. **Anti-campeo:** cada **60 s** (desde que Verity despierta) todos los supervivientes se **resaltan en rojo para Verity durante 5 s**, a través de las paredes (si estás en un escondite, se resalta el escondite). Los supervivientes reciben un pulso rojo en pantalla, tres latidos y el aviso "¡Verity puede verte! Cambia de sitio". El HUD muestra la cuenta atrás ("Revelación en 42s").

## Cámara
La cámara se aleja muy poco del personaje para que no se vea detrás de las esquinas: 22 studs como superviviente, 30 como Verity (es mucho más alta) y 30 en el lobby (`Config.Camera`). Lo fija el servidor y cada cliente lo vuelve a aplicar (`CameraLimits.luau`).

## Controles
| Tecla | Verity | Superviviente |
| --- | --- | --- |
| `Q` | Atrapar (hasta 12 studs al frente, 5 en cualquier dirección): levanta a la víctima y la aplasta | — |
| `Shift` | Correr (40, sin límite; camina a 26) | Correr (40, igual que Verity; gasta estamina: ~6,7 s seguidos, se recarga en ~5,5 s) |
| `F` | — | **Linterna** sin batería (la ven todos, también Verity) |
| `C` | Agacharse (alterna) | — |
| `E` | — | Recoger / depositar oro · Craftear tótem |
| `R` | — | Esconderse en armarios, taquillas, ataúdes, confesionarios y arbustos (Verity puede sacarte con `Q` si te encuentra) |
| `1`–`2` | — | Objetos de la tienda (solo en la ronda) |

**Ajustes (⚙, junto al botón de música):** ver hitboxes (tu propia caja y, cuando Verity está a menos de 40 studs, la suya con su alcance real: anillo de 12 studs, cono frontal y círculo de 5; tenue, tapado por las paredes y nunca marca a otros supervivientes ni a nadie escondido, para que no dé ventaja), calidad baja (sin sombras, partículas ni efectos), volumen de música y de efectos, y **modo AFK** (no entras en las rondas hasta quitarlo; el modo solitario con NPCs no cuenta a los AFK). Los ajustes se guardan con tus datos; el modo AFK dura la sesión.

**Espectar:** si estás en el lobby (esperando o eliminado) mientras se juega una ronda, el botón **👁 Espectar** (abajo al centro) te deja mirar la partida. `◀` `▶` (o las flechas del teclado) cambian entre supervivientes, NPCs y Verity, y **Salir** vuelve a tu personaje. Mientras espectas ves la luz del mapa, no la del lobby.

## Monedas y tienda
- **Monedas** repartidas por cada mapa (45). Se recogen con solo acercarse; Verity tiene más alcance. Máximo 40 por ronda.
- **Premios:** **ganar la ronda +150** (seas Verity o superviviente), atrapar +6, completar el obby del lobby +15 (cada 2 min).
- **Tienda** en el mostrador del lobby (o con el botón "Tienda"). Se pueden **equipar 2 objetos**. Solo los usan los **supervivientes** y **solo durante la ronda**: aparecen en la mochila al empezar y se pierden al morir o al volver al lobby. Verity no recibe objetos.

| Objeto | Precio | Efecto |
| --- | --- | --- |
| Bobina de velocidad | 250 | +35 % de velocidad |
| Bobina de gravedad | 250 | Saltos enormes |
| Bobina de fusión | 650 | Las dos anteriores |
| Botiquín | 150 | Cura 50 (recarga 20 s) |
| Bebida energética | 200 | Estamina infinita 6 s |
| Bengala | 100 | Bengala roja en el suelo que ilumina la zona 20 s |
| Capa fantasma | 500 | Casi invisible 6 s; los NPCs solo te notan muy de cerca |
| Radar de almas | 450 | Ves a Verity a través de las paredes 6 s |
| Cepo | 350 | Trampa que inmoviliza 3 s a Verity (máx. 2) |
| Imán de monedas | 300 | Triple de alcance para recoger monedas |
| Martillo de empuje | 400 | Empuja a Verity si la tienes delante |

- **Skins de Verity:** Clásica (gratis), Pálida (1000), Sombra (1500), Sangrienta (2000), Tóxica (2500), Dorada (3500), Espectral (4500) y Vacío (6000). Se aplican como tinte, contorno y aura sobre cualquier modelo.
- **Pases (Robux):** 2x/3x de probabilidad de ser Verity y la Poción de Verity. Pon los IDs en `Config.luau`.

## Mapas y lobby
Mapas **inspirados** en los clásicos de MM2 (construcciones propias, no copias de los originales), grandes y con escondites:
- **Interiores de dos plantas:** **Mansión, Hospital, Oficina, Banco, Hotel, Fábrica** y **Escuela Nocturna**, de 6×5 a 7×4 habitaciones por planta (50–56 studs cada una, puertas anchas y algunas paredes abiertas). Dos escaleras por mapa, en habitaciones alejadas, con barandilla alrededor del hueco; 27–36 escondites; oro, monedas, mesas de crafteo y apariciones en las dos plantas.
- **Exteriores de noche:** **Bosque Nocturno** (~600 studs, 49 escondites) y **Cementerio** (~540 studs, 41 escondites), con setos o muros de piedra que cortan la visión, cabañas, cobertizos, arbustos y **dos edificios de dos plantas** (refugios / mausoleos) con escalera interior, escondites arriba y un ventanal para vigilar (y saltar si hace falta).

Durante la ronda nadie muestra la etiqueta de nombre, así que no delata a quien se esconde. Están en `Workspace/Maps` para verlos en Studio; al iniciar se mueven a `ServerStorage/Maps` y cada ronda usa uno al azar.

El **lobby** tiene una plaza con bancos, el puesto de la **tienda**, un rincón de **casino** y un **obby** sobre lava con un cofre de monedas al final. Lo iluminan apliques fijos en las paredes (encima de las ventanas, simétricos) y una lámpara de araña colgada del techo con una cadena.
- **Sentarse:** los tableros de los bancos y los taburetes del casino son asientos (`Seat`): te sientas al tocarlos y te levantas saltando.
- **Casino** (al fondo a la izquierda, entre la tienda y la plaza, a la vista desde el spawn): 8 tragamonedas de palanca en dos filas mirando a la plaza (`E` cerca de la máquina). Tres rodillos, palanca animada, sonidos y luces de colores con jackpot. Símbolos, pesos y probabilidad de jackpot en `Config.Slots` (servidor: `Slots.luau`, animación: `Casino.luau`).
- **Martillo de fuerza** (2 máquinas en el lado del casino que da a la tienda): pulsa `E` y aparece una aguja que va y viene; golpea (botón, `E` o `Espacio`) en el momento justo. El disco sube por la torre hasta tu fuerza y, si llega a 95 o más, suena la campana. Encima se ve el récord del servidor (`Config.Striker`, servidor: `Arcade.luau`, cliente: `Striker.luau`).
- Las máquinas son **solo por diversión:** no se apuesta nada ni se ganan monedas; así no entran en las reglas de Roblox sobre juegos de azar ni suben la clasificación de edad.
- **Obby grande:** empieza dentro, junto a la plaza, sube por la lava interior y **sale por una puerta de la pared derecha** a un recorrido largo al aire libre sobre un lago de lava, con una viga, 3 plataformas de cristal que parpadean, una barra de lava lenta que gira y una isla final con el cofre y farolas. Dificultad normal (plataformas de 3,5-4 studs, huecos de 4-6). Caer a la lava o tocar la barra te devuelve al inicio. Tiempos y velocidad en `Config.Obby`.

Para regenerarlos: `python3 tools/generate_world.py`. Para un mapa propio, copia la estructura `SurvivorSpawns` / `KillerSpawn` / `GoldSpawns` / `CraftingTables`.

## Aspecto cinematográfico
- Iluminación **Future** (sombras reales de cada lámpara), corrección de color, bloom, profundidad de campo y niebla atmosférica.
- Lobby al atardecer y, en los mapas, una **noche de invierno cinematográfica**: penumbra azul marino en la que se distinguen paredes, suelo y muebles (como en Survive the Killer), niebla que suaviza lo lejano, superficies claras atenuadas y lámparas cálidas que dejan charcos de luz anaranjada con mucho contraste y bloom. Los bordes de la pantalla se oscurecen durante la ronda. Un 10 % de habitaciones queda sin luz.
- **El lobby nunca se oscurece:** la iluminación de Roblox es una sola para todo el servidor, así que quien está en el lobby durante una ronda (esperando o eliminado) recupera en su pantalla la luz cálida del lobby, sin viñeta ni barras de cine (`LobbyAtmosphere.luau`). Los ambientes están en [`src/shared/Atmosphere.luau`](src/shared/Atmosphere.luau).

## Animaciones de Verity
Procedurales, en `VerityAnimator.luau`, con andares de monstruo:
- **Reposo:** encorvada, con la cabeza muy ladeada como con el cuello roto (cambia de lado de golpe cada 5–11 s), respiración pesada, brazos colgando y espasmos bruscos de todo el cuerpo.
- **Caminar (acechar):** zancadas largas y lentas con las rodillas dobladas, cadera que se mece y gira, brazos que cuelgan y se balancean con retraso como peso muerto (uno más flojo que el otro) y la cabeza ladeada cabeceando a cada paso.
- **Correr:** se lanza hacia delante casi a cuatro patas, con el torso muy inclinado y la cabeza levantada mirando a la presa. Lleva los brazos abiertos y estirados hacia delante, agarrando el aire con los dedos crispados, y da zancadas enormes con las rodillas altas. Todo el cuerpo tiembla de forma nerviosa. Se activa al esprintar con Shift; la Verity NPC lo usa al perseguir.
- Además: agacharse, la pose de transformación y el ataque.

Se aplican modificando `C0` localmente, por lo que ningún Animator de Roblox las pisa y funcionan con cualquier rig.

## Crujidos de huesos (paso opcional)
Roblox no tiene crujidos de huesos públicos y ForgeGUI necesita un plan de pago para generar sonidos, así que están **sintetizados** en `assets/audio/verity_bone_cracks.ogg` (`tools/synth_bone_cracks.py`). Para usarlos:
1. En Studio: **Ventana → Asset Manager → Bulk Import** y elige el `.ogg`.
2. Clic derecho en el audio subido → **Copy ID**.
3. Pégalo en `Config.Sounds.BoneCracks`.

Mientras sea `0`, el juego usa un sustituto con sonidos internos de Roblox.

## Música y efectos
- Audio de terror (pistas oficiales de **DistroKid**, **APM** y **Pro Sound Effects**, licenciadas para experiencias de Roblox):
  - **la música solo suena en el lobby** (las pistas de partida); en el mapa no hay música;
  - en la ronda, un **zumbido metálico** y un **retumbar grave** de ambiente; el zumbido sube de volumen y de tono con la tensión (Verity cerca, los segundos antes de que despierte, la revelación de cada minuto, el último minuto);
  - **persecución industrial** cuando Verity está cerca de alguien, montada por capas en el cliente: el zumbido metálico (*METALLIC DRONE 03*, APM) acelerado, distorsionado y con temblor mecánico, **golpes de prensa hidráulica** distorsionados que se aceleran al acercarse y **chirridos de metal** al azar;
  - **latido** grave para los supervivientes cuando Verity está a menos de ~55 studs, cada vez más rápido;
  - se puede silenciar todo con el botón ♪, y el volumen de música y efectos está en Ajustes.
- Grito de muerte: *HORROR SCREAM 07* (APM).
- Texturas de VFX generadas con **ForgeGUI**: destello, orbe, onda, salpicadura de líquido y gota (sangre).

## Puzzle: oro y tótems
1. Recoge **bloques de oro** (máx. 2 encima).
2. Llévalos a una de las **3 mesas de crafteo**.
3. Con **3 de oro**, mantén `E` 3 s para **craftear un tótem**: **−30 s** al reloj (máx. 5 por ronda).

## Quién es Verity
**Rotación como en Survive the Killer:** nadie repite hasta que todos los del servidor hayan sido Verity una vez. Con 10 jugadores, en 10 rondas todos lo han sido; después empieza otra rotación. Si entra alguien nuevo, se suma a los que faltan, y salir y volver no reinicia tu turno. El HUD del lobby muestra "Rotación: 4/10 ya fueron Verity" o "Ya fuiste Verity en esta rotación".

Entre los que aún no lo han sido, el orden lo deciden la suerte y los pases. Cada ronda que no eres Verity sumas +1 de suerte (máx. 10).
`peso = (1 + suerte) × multiplicador del pase × multiplicador de poción`, `probabilidad = tu peso / suma de pesos de los que faltan` (0 % si ya lo fuiste en esta rotación).

## Traducción a todos los idiomas
El juego está escrito en **español** y todos los textos (HUD, tienda, avisos, carteles, mesas de crafteo, escondites, nombres de mapas y objetos) pasan por [`Locale.luau`](src/shared/Locale.luau), que los traduce con el `Translator` de cada jugador. Los textos con números o nombres usan parámetros (`"Verity atrapó a {name}"`), así una sola entrada sirve para cualquier valor.

- `tools/extract_strings.py` reúne los 191 textos en [`src/localization/GameStrings.csv`](src/localization/GameStrings.csv), que va dentro del place como `LocalizationService.GameStrings` (idioma de origen `es-es`).
- **16 idiomas ya traducidos** dentro del juego (funcionan sin configurar nada, también en Studio): español, inglés, portugués, francés, alemán, italiano, ruso, turco, polaco, indonesio, vietnamita, tailandés, japonés, coreano, chino simplificado y árabe (`tools/translations/<idioma>.json`). Cada jugador ve el juego en el idioma de su cuenta de Roblox.
- Para el resto de idiomas (chino tradicional, filipino...), Roblox puede traducir automáticamente:
  1. Publica el juego.
  2. En el **Creator Dashboard** → tu experiencia → **Localization**: pon el **idioma de origen en Español**, activa **Automatic Text Capture** y **Automatic Translation**.
  3. En la tabla de traducciones de esa misma página, **importa** `GameStrings.csv` (así entran todas las frases con sus traducciones).
- Para probar en Studio: pestaña **Test → Language / Player Emulator** y elige el idioma.
- Si añades textos nuevos, escríbelos como `T("...")` y vuelve a ejecutar `python3 tools/extract_strings.py`.

## Datos guardados
Se guardan por jugador en DataStore: **monedas, victorias**, objetos y skins comprados, objetos equipados, suerte y pociones.
- **Cuándo:** al terminar cada ronda, cada 60 s (autoguardado), al salir del juego y al cerrarse el servidor.
- **Bloqueo de sesión:** solo un servidor escribe los datos de un jugador a la vez. Si cambia de servidor muy rápido, el nuevo espera a que el anterior termine de guardar (si tarda más de ~30 s, le pide volver a entrar). Así no se pierden ni se duplican monedas.
- Si el DataStore falla al cargar, el jugador puede jugar pero esa sesión no se guarda, para no borrar sus datos reales.
- En el juego publicado funciona solo. Para que también guarde al probar en Studio: Game Settings → Security → **Enable Studio Access to API Services**. En un archivo local sin publicar, todo funciona en memoria (se avisa en Output).

## Publicar en Roblox
1. Abre `SurviveAVerity.rbxlx` en Roblox Studio → **File → Publish to Roblox** → *Create new experience*: nombre **Survive A Verity**, descripción, género **Horror** y dispositivos.
2. **Game Settings** (pestaña Home):
   - **Places → Max Players: 10.**
   - **Avatar → R15** (Verity y los NPCs son R15).
   - **Security → Enable Studio Access to API Services** (solo para probar el guardado en Studio).
3. En el **Creator Hub** (create.roblox.com → Creations → tu experiencia):
   - Rellena el **cuestionario de madurez** (*Maturity & Compliance*). Es obligatorio para hacerlo público.
   - Configura **Localization** como se explica arriba.
   - Sube icono y miniaturas.
   - Opcional: crea los **pases** 2x y 3x y la **Poción de Verity**, y pon sus IDs en `Config.GamePasses` / `Config.Products`. Con `Id = 0` aparecen como no disponibles.
4. Pruébalo primero en privado (**Audience/Privacy → Private**) y luego cámbialo a **Public**.
5. Si algún sonido no suena en el juego publicado, es que el audio del Toolbox no permite su uso en tu experiencia: cambia su ID en `Config.Music` / `Config.Sounds`.
6. Para actualizar: vuelve a generar el `.rbxlx` (o abre el place desde Studio), haz los cambios y **File → Publish to Roblox** de nuevo.

## Estructura
```
src/shared   → ReplicatedStorage.Shared   (Config, Net, Assets, VerityPose, Locale)
src/server   → ServerScriptService.Server (Round, Killer, VerityBot, VerityModel, Movement, Items, Shop, Coins, Lobby, Crafting, Bots, Hiding, MapService, PlayerData, Monetization)
src/client   → StarterPlayerScripts.Client (HUD, Shop, Music, Input, VerityAnimator, BallFX, Cinematics, WorldFX, NightVision, CameraLimits)
src/world    → Workspace (Lobby y Maps) y ServerStorage (VerityFallback, VerityBall)
src/localization → LocalizationService.GameStrings (tabla de traducción)
tools/       → generate_world.py, verity_rig.py, extract_strings.py, synth_bone_cracks.py
```
Un solo `Script` y un solo `LocalScript`; cada sistema se carga protegido, así que un fallo en uno no detiene a los demás.
