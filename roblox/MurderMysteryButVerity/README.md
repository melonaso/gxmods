# Murder Mystery but Verity

Juego de Roblox estilo *Murder Mystery 2* (lobby → ronda → resultados) con gameplay de *Survive the Killer*: un jugador es **Verity** (la criatura asesina) y el resto son supervivientes. No hay sheriff.

## Abrir y probar
1. Abre `MurderMysteryButVerity.rbxlx` en Roblox Studio.
2. **(Recomendado) Importa el modelo realista de Verity** pegando esta línea en la barra de comandos de Studio (abajo, "Ejecutar un comando") y pulsando Enter:
   ```lua
   local id=107080030600115 local m=game:GetObjects("rbxassetid://"..id)[1] local old=game.ServerStorage:FindFirstChild("VerityCharacter") if old then old:Destroy() end m.Name="VerityCharacter" m.Parent=game.ServerStorage print("Verity importado:",m:GetFullName(),#m:GetDescendants(),"objetos")
   ```
   Luego guarda (Ctrl+S). Si ese modelo no te convence, cambia `id` por otro de la lista de abajo y repite.
3. Pulsa **Play**. En Output verás `[VerityModel] usando el modelo de ...` con la fuente elegida.

### Modelos de Verity en el Toolbox
Encontrados con ForgeGUI (`toolbox_search`). El juego quita todos los scripts del modelo (los modelos gratuitos pueden traer virus), lo escala a ~16 studs y lo adapta para animarlo:

| ID | Nombre | Autor |
| --- | --- | --- |
| 107080030600115 | verity | JayJay00630 (el mejor valorado) |
| 77078054144134 | Verity rig | Plumones11c |
| 90398340255135 | verity | Cessybee |
| 72873880902024 | verity | pro123game123start |

Si no importas ninguno, se usa `ServerStorage/VerityFallback`: un modelo orgánico de ~190 piezas basado en la imagen de referencia (cuerpo esquelético con costillas, cintura de avispa, cuello con tendones, clavículas, brazos larguísimos hasta las rodillas, dedos largos, rodillas y gemelos marcados, y cabeza de huevo calva con cuencas hundidas y una sonrisa enorme de dientes grandes). Antes de eso, el juego intenta `InsertService:LoadAsset` (solo funciona si el creador del juego posee el modelo).

## Modo prueba (activado)
`Config.Testing.Enabled = true` en [`src/shared/Config.luau`](src/shared/Config.luau):
- Basta **1 jugador**. En el lobby, el botón **"Rol de prueba"** (izquierda, debajo de ♪) alterna entre **Verity** y **Superviviente** para la próxima ronda, así puedes probar los dos lados.
- Si eliges **Superviviente**, Verity la maneja la **IA**: ve con la vista (no a través de paredes), persigue al más cercano, va adonde te vio por última vez, te saca del escondite si te vio entrar, registra escondites al patrullar y usa la revelación de cada minuto. Persigue a 28; tú corres a 40 mientras te dure la estamina, así que hay que administrarla y usar escondites.
- Cada ronda tiene **10 participantes** (el máximo por servidor): tú + 9 NPCs si eres Verity, o tú + Verity NPC + 8 NPCs si eres superviviente. Los NPCs huyen, se esconden, cambian de sitio al ser revelados, recogen oro y craftean tótems.
- Si caes como superviviente frente a la Verity NPC, la ronda termina 20 s después (no hace falta esperar todo el reloj).
- Todos empiezan con 0 monedas.

Ponlo en `false` antes de publicar y pon **10 jugadores máximo** en Game Settings → Places (en Studio ya está en 10).

## Ronda
1. **Intermedio de 23 s** en el lobby.
2. Cinemática de inicio: barras de cine, nombre del mapa (5 s) y la cámara rodea a tu personaje.
3. Verity empieza como una **bola sonriente** (su diseño original) durante **20 s**.
4. Al liberarse, la bola **se retuerce con crujidos de huesos** y se transforma en el monstruo (2,6 s); si eres Verity, la cámara orbita la transformación.
5. **Verity ve en la oscuridad** (solo en su pantalla, sin filtros de color): para ella la noche se ve casi como de día, con luz ambiente alta, menos niebla y una luz suave alrededor. Los supervivientes siguen viendo la noche oscura y tienen su linterna (`F`).
6. Verity atrapa con `Q`: la víctima **grita** mientras la levanta y el grito se corta en seco con la explosión.
7. **Anti-campeo:** cada **60 s** (desde que Verity despierta) todos los supervivientes se **resaltan en rojo para Verity durante 5 s**, a través de las paredes (si estás en un escondite, se resalta el escondite). Los supervivientes reciben un pulso rojo en pantalla, tres latidos y el aviso "¡Verity puede verte! Cambia de sitio". El HUD muestra la cuenta atrás ("Revelación en 42s").

## Controles
| Tecla | Verity | Superviviente |
| --- | --- | --- |
| `Q` | Atrapar: levanta a la víctima y la aplasta | — |
| `Shift` | Correr (40, sin límite; camina a 26) | Correr (40, igual que Verity; gasta estamina: ~6,7 s seguidos, se recarga en ~5,5 s) |
| `F` | — | **Linterna** sin batería (la ven todos, también Verity) |
| `C` | Agacharse (alterna) | — |
| `E` | — | Recoger / depositar oro · Craftear tótem |
| `R` | — | Esconderse en armarios, taquillas, ataúdes, confesionarios y arbustos (Verity puede sacarte con `Q` si te encuentra) |
| `1`–`2` | — | Objetos de la tienda (solo en la ronda) |

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

El **lobby** tiene la estatua de Verity mirando al spawn, el puesto de la **tienda** y un **obby** sobre lava con un cofre de monedas al final.

Para regenerarlos: `python3 tools/generate_world.py`. Para un mapa propio, copia la estructura `SurvivorSpawns` / `KillerSpawn` / `GoldSpawns` / `CraftingTables`.

## Aspecto cinematográfico
- Iluminación **Future** (sombras reales de cada lámpara), corrección de color, bloom, profundidad de campo y niebla atmosférica.
- Lobby al atardecer y, en los mapas, una **noche de invierno cinematográfica**: sombras azul marino (se distinguen las formas, no los detalles), niebla oscura que se traga lo lejano, superficies claras atenuadas y lámparas cálidas que dejan charcos de luz anaranjada con mucho contraste y bloom. Los bordes de la pantalla se oscurecen durante la ronda. Un 10 % de habitaciones queda sin luz.

## Animaciones de Verity
Procedurales, en `VerityAnimator.luau`: reposo con tics de cabeza, caminar, correr encorvada con los brazos atrás, agacharse, la pose de transformación y el ataque. Se aplican modificando `C0` localmente, por lo que ningún Animator de Roblox las pisa y funcionan con cualquier rig.

## Crujidos de huesos (paso opcional)
Roblox no tiene crujidos de huesos públicos y ForgeGUI necesita un plan de pago para generar sonidos, así que están **sintetizados** en `assets/audio/verity_bone_cracks.ogg` (`tools/synth_bone_cracks.py`). Para usarlos:
1. En Studio: **Ventana → Asset Manager → Bulk Import** y elige el `.ogg`.
2. Clic derecho en el audio subido → **Copy ID**.
3. Pégalo en `Config.Sounds.BoneCracks`.

Mientras sea `0`, el juego usa un sustituto con sonidos internos de Roblox.

## Música y efectos
- Música de terror por capas (pistas oficiales de **DistroKid**, **APM** y **Pro Sound Effects**, licenciadas para experiencias de Roblox), pensada para que la tensión no baje:
  - pista principal distinta en lobby, interiores, exteriores y resultados;
  - en la ronda, un **zumbido metálico** y un **retumbar grave** de fondo; el zumbido sube de volumen y de tono con la tensión (Verity cerca, los segundos antes de que despierte, la revelación de cada minuto);
  - **persecución** (*Intense Chase*, APM) que sube cuando Verity está cerca de alguien, mientras la música principal se agacha;
  - **latido** grave para los supervivientes cuando Verity está a menos de ~55 studs, cada vez más rápido;
  - en el **último minuto**, la música cambia a una pista más urgente (*Running Faster*, APM).
  - Se puede silenciar todo con el botón ♪.
- Grito de muerte: *HORROR SCREAM 07* (APM).
- Texturas de VFX generadas con **ForgeGUI**: destello, orbe, onda, salpicadura de líquido y gota (sangre).

## Puzzle: oro y tótems
1. Recoge **bloques de oro** (máx. 2 encima).
2. Llévalos a una de las **3 mesas de crafteo**.
3. Con **3 de oro**, mantén `E` 3 s para **craftear un tótem**: **−30 s** al reloj (máx. 5 por ronda).

## Probabilidad de ser Verity (fuera del modo prueba)
Cada ronda que no eres Verity sumas +1 de suerte (máx. 10).
`peso = (1 + suerte) × multiplicador del pase × multiplicador de poción`, `probabilidad = tu peso / suma de pesos`.

## Traducción a todos los idiomas
El juego está escrito en **español** y todos los textos (HUD, tienda, avisos, carteles, mesas de crafteo, escondites, nombres de mapas y objetos) pasan por [`Locale.luau`](src/shared/Locale.luau), que los traduce con el `Translator` de cada jugador. Los textos con números o nombres usan parámetros (`"Verity atrapó a {name}"`), así una sola entrada sirve para cualquier valor.

- `tools/extract_strings.py` reúne los 156 textos en [`src/localization/GameStrings.csv`](src/localization/GameStrings.csv), que va dentro del place como `LocalizationService.GameStrings` (idioma de origen `es-es`). Incluye ya el **inglés** (`tools/translations/en.json`).
- Para que **Roblox traduzca automáticamente a todos los demás idiomas** (portugués, francés, alemán, italiano, ruso, turco, japonés, coreano, chino, indonesio, tailandés, vietnamita, polaco, árabe...):
  1. Publica el juego.
  2. En el **Creator Dashboard** → tu experiencia → **Localization**: pon el **idioma de origen en Español**, activa **Automatic Text Capture** y **Automatic Translation** para todos los idiomas.
  3. En la tabla de traducciones de esa misma página, **importa** `GameStrings.csv` (así entran todas las frases, también las que aún no han salido en una partida).
- Para probar en Studio: pestaña **Test → Language / Player Emulator** y elige *English*.
- Si añades textos nuevos, escríbelos como `T("...")` y vuelve a ejecutar `python3 tools/extract_strings.py`.

## Datos
Con el juego publicado y "Enable Studio Access to API Services" activo se guardan en DataStore. En un archivo local sin publicar, todo funciona en memoria (se avisa en Output).

## Estructura
```
src/shared   → ReplicatedStorage.Shared   (Config, Net, Assets, VerityPose, Locale)
src/server   → ServerScriptService.Server (Round, Killer, VerityBot, VerityModel, Movement, Items, Shop, Coins, Lobby, Crafting, Bots, Hiding, MapService, PlayerData, Monetization)
src/client   → StarterPlayerScripts.Client (HUD, Shop, Music, Input, VerityAnimator, BallFX, Cinematics, WorldFX)
src/world    → Workspace (Lobby y Maps) y ServerStorage (VerityFallback, VerityBall)
src/localization → LocalizationService.GameStrings (tabla de traducción)
tools/       → generate_world.py, verity_rig.py, extract_strings.py, synth_bone_cracks.py
```
Un solo `Script` y un solo `LocalScript`; cada sistema se carga protegido, así que un fallo en uno no detiene a los demás.
