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

Si no importas ninguno, se usa `ServerStorage/VerityFallback`: un modelo esbelto hecho con elipsoides, con costillas, clavículas, tendones y una cabeza de calavera sonriente (sin ojos: cuencas vacías, cavidad nasal y una sonrisa enorme de 30 dientes). Antes de eso, el juego intenta `InsertService:LoadAsset` (solo funciona si el creador del juego posee el modelo).

## Modo prueba (activado)
`Config.Testing.Enabled = true` en [`src/shared/Config.luau`](src/shared/Config.luau):
- Basta **1 jugador**. El primer jugador del servidor es **Verity en todas las rondas**.
- **6 NPCs** hacen de supervivientes: huyen de Verity, se esconden en armarios, recogen oro, lo depositan y craftean tótems.
- Todos empiezan con 0 monedas.

Ponlo en `false` antes de publicar.

## Ronda
1. **Intermedio de 23 s** en el lobby.
2. Cinemática de inicio: barras de cine, nombre del mapa y la cámara rodea a tu personaje.
3. Verity empieza como una **bola sonriente** (su diseño original) durante **20 s**.
4. Al liberarse, la bola **se retuerce con crujidos de huesos** y se transforma en el monstruo (2,6 s); si eres Verity, la cámara orbita la transformación.
5. Verity atrapa con `Q`: la víctima **grita** mientras la levanta y el grito se corta en seco con la explosión.

## Controles
| Tecla | Verity | Superviviente |
| --- | --- | --- |
| `Q` | Atrapar: levanta a la víctima y la aplasta | — |
| `Shift` | Correr (34, sin límite) | Correr (24, gasta estamina) |
| `C` | Agacharse (alterna) | — |
| `E` / `F` | — | Recoger / depositar oro · Craftear tótem |
| `R` | — | Esconderse en armarios, taquillas, ataúdes y confesionarios (Verity puede sacarte con `Q` si te encuentra) |
| `1`–`4` | Objetos de la tienda | Objetos de la tienda |

## Monedas y tienda
- **Monedas** repartidas por cada mapa (45). Se recogen con solo acercarse; Verity tiene más alcance. Máximo 40 por ronda.
- **Premios:** **ganar la ronda +100** (seas Verity o superviviente), atrapar +6, completar el obby del lobby +15 (cada 2 min).
- **Tienda** en el mostrador del lobby (o con el botón "Tienda"). Se pueden **equipar 4 objetos**, que aparecen en la mochila en el lobby y en las rondas:

| Objeto | Precio | Efecto |
| --- | --- | --- |
| Bobina de velocidad | 250 | +35 % de velocidad |
| Bobina de gravedad | 250 | Saltos enormes |
| Bobina de fusión | 650 | Las dos anteriores |
| Botiquín | 150 | Cura 50 (recarga 20 s) |
| Bebida energética | 200 | Estamina infinita 6 s |
| Linterna | 100 | Foco que se enciende y apaga |
| Capa fantasma | 500 | Casi invisible 6 s; los NPCs solo te notan muy de cerca |
| Radar de almas | 450 | Ves a tus objetivos a través de las paredes 6 s |
| Cepo | 350 | Trampa que inmoviliza 3 s (máx. 2) |
| Imán de monedas | 300 | Triple de alcance para recoger monedas |
| Martillo de empuje | 400 | Empuja a quien tengas delante |

- **Skins de Verity:** Clásica (gratis), Pálida (1000), Sombra (1500), Sangrienta (2000), Tóxica (2500), Dorada (3500), Espectral (4500) y Vacío (6000). Se aplican como tinte, contorno y aura sobre cualquier modelo.
- **Pases (Robux):** 2x/3x de probabilidad de ser Verity y la Poción de Verity. Pon los IDs en `Config.luau`.

## Mapas y lobby
Mapas **inspirados** en los clásicos de MM2 (construcciones propias, no copias de los originales), amplios y con escondites: **Mansión, Hospital, Oficina, Banco, Hotel, Fábrica** y **Escuela Nocturna** (habitaciones de 50–56 studs, puertas anchas y algunas paredes abiertas). Al aire libre y de noche, con setos o muros de piedra que cortan la visión, cabañas, cobertizos y arbustos donde esconderse: **Bosque Nocturno** (~470 studs, 31 escondites) y **Cementerio** (~430 studs, 24 escondites). Durante la ronda nadie muestra la etiqueta de nombre, así que no delata a quien se esconde. Están en `Workspace/Maps` para verlos en Studio; al iniciar se mueven a `ServerStorage/Maps` y cada ronda usa uno al azar.

El **lobby** tiene la estatua de Verity mirando al spawn, el puesto de la **tienda** y un **obby** sobre lava con un cofre de monedas al final.

Para regenerarlos: `python3 tools/generate_world.py`. Para un mapa propio, copia la estructura `SurvivorSpawns` / `KillerSpawn` / `GoldSpawns` / `CraftingTables`.

## Aspecto cinematográfico
- Iluminación **Future** (sombras reales de cada lámpara), corrección de color, bloom, profundidad de campo y niebla atmosférica.
- Tres ambientes: lobby al atardecer, interiores oscuros y fríos con luces que parpadean (algunas habitaciones sin luz) y exteriores de noche con luna y niebla.

## Animaciones de Verity
Procedurales, en `VerityAnimator.luau`: reposo con tics de cabeza, caminar, correr encorvada con los brazos atrás, agacharse, la pose de transformación y el ataque. Se aplican modificando `C0` localmente, por lo que ningún Animator de Roblox las pisa y funcionan con cualquier rig.

## Crujidos de huesos (paso opcional)
Roblox no tiene crujidos de huesos públicos y ForgeGUI necesita un plan de pago para generar sonidos, así que están **sintetizados** en `assets/audio/verity_bone_cracks.ogg` (`tools/synth_bone_cracks.py`). Para usarlos:
1. En Studio: **Ventana → Asset Manager → Bulk Import** y elige el `.ogg`.
2. Clic derecho en el audio subido → **Copy ID**.
3. Pégalo en `Config.Sounds.BoneCracks`.

Mientras sea `0`, el juego usa un sustituto con sonidos internos de Roblox.

## Música y efectos
- Música ambiente de terror de **DistroKid Official** y **APM Official** (licenciadas para experiencias de Roblox), distinta en lobby, interiores, exteriores y resultados, más un zumbido de fondo y una **capa de persecución** (*Intense Chase*, APM) que sube cuando Verity está cerca de alguien. Se puede silenciar con el botón ♪.
- Grito de muerte: *HORROR SCREAM 07* (APM).
- Texturas de VFX generadas con **ForgeGUI**: destello, orbe, onda, salpicadura de líquido y gota (sangre).

## Puzzle: oro y tótems
1. Recoge **bloques de oro** (máx. 2 encima).
2. Llévalos a una de las **3 mesas de crafteo**.
3. Con **3 de oro**, mantén `F` 3 s para **craftear un tótem**: **−30 s** al reloj (máx. 5 por ronda).

## Probabilidad de ser Verity (fuera del modo prueba)
Cada ronda que no eres Verity sumas +1 de suerte (máx. 10).
`peso = (1 + suerte) × multiplicador del pase × multiplicador de poción`, `probabilidad = tu peso / suma de pesos`.

## Datos
Con el juego publicado y "Enable Studio Access to API Services" activo se guardan en DataStore. En un archivo local sin publicar, todo funciona en memoria (se avisa en Output).

## Estructura
```
src/shared   → ReplicatedStorage.Shared   (Config, Net, Assets, VerityPose)
src/server   → ServerScriptService.Server (Round, Killer, VerityModel, Movement, Items, Shop, Coins, Lobby, Crafting, Bots, MapService, PlayerData, Monetization)
src/client   → StarterPlayerScripts.Client (HUD, Shop, Music, Input, VerityAnimator, WorldFX)
src/world    → Workspace (Lobby y Maps) y ServerStorage (VerityFallback)
tools/       → generate_world.py y verity_rig.py
```
Un solo `Script` y un solo `LocalScript`; cada sistema se carga protegido, así que un fallo en uno no detiene a los demás.
