# Diseño: "Don't Blink: Survive the Snowmen"

Fecha: 2026-11-23 · Estado: borrador para aprobación

## 1. Intención y por qué

- **Objetivo principal del dueño: ganar dinero** con un juego de Roblox.
- Se eligió el nicho que el dueño conoce como jugador: **terror de persecución, rondas cortas, con amigos**
  (Pillar Chase 2, Nico's Nextbots, Baldi's, Survive in Area 51, Insane Elevator, Evade).
- Se aprovecha la **temporada navideña** (ver `notas-mercado-roblox.md`: los juegos de temporada suben
  justo antes de la fecha) y el formato en tendencia **"Survive the ___" / "Don't ___"**.
- Gancho diferenciador: **muñecos de nieve que solo se mueven cuando nadie los mira** (mecánica tipo
  SCP-173 / Weeping Angels). Obliga al grupo a coordinarse: unos hacen tareas, otros vigilan.

## 2. Metas, no-metas y anti-metas

**Metas**
- Publicar una versión jugable y monetizada **entre el 10 y el 15 de diciembre de 2026**.
- Partidas de 10–12 min, divertidas en grupo de 2–8 y jugables en solitario.
- Monetización desde el día 1 sin ser pay-to-win.
- Base de juego reutilizable: el tema navideño es una "capa" que en enero se cambia o se guarda como evento.
- Funciona en PC y móvil (gran parte del público de Roblox juega en móvil).

**No-metas (por ahora)**
- Modo asimétrico (un jugador como monstruo). Posible actualización futura.
- Muchos mapas, rankings globales, clanes, intercambio.
- Arte de alta calidad hecho a mano; se prioriza ambiente (niebla, luz, sonido) sobre modelos detallados.

**Anti-metas (fracaso aunque "funcione")**
- Pay-to-win: pagar no debe permitir ganar sin jugar en equipo.
- Lanzar después del ~20 de diciembre (el tema navideño pierde su valor).
- Que se sienta un "juego slop": copia genérica sin identidad.
- Perder datos de jugadores (monedas/compras).

## 3. Restricciones

- Tiempo del dueño: **1–3 h por día**, ~15 días de trabajo hasta el 15/12 (15–45 h). Estimación del MVP: ~20 h
  con margen.
- Desarrollo en **Roblox Studio en la PC del dueño**, con **Claude Code + MCP de Roblox Studio** (ya conectado).
  Esta sesión en la nube no puede tocar Studio.
- Límites de Roblox: audio restringido (usar sonidos de la Creator Store con licencia de Roblox), límites de
  DataStore, revisión de developer products/gamepasses.
- **Modelos gratuitos de la Creator Store pueden traer scripts maliciosos (backdoors)**: revisar o usar solo
  partes sin scripts.

## 4. Enfoques considerados

| Enfoque | Ventaja | Desventaja |
|---|---|---|
| **A. "Survive the ___" contra monstruos IA** (elegido) | El más simple de construir; funciona con pocos jugadores; formato en tendencia | Muchas copias → se resuelve con la mecánica de "no mirar" |
| B. Asimétrico 1 vs varios (tipo Pillar Chase) | Muy rejugable; skins de monstruo venden bien | Difícil de equilibrar; necesita servidores llenos que un juego nuevo no tiene |
| C. Terror + ritmo (tipo Funky Friday) | Original | Sistema de ritmo complejo; restricciones de audio; más riesgo |

Se eligió **A** por tiempo disponible y porque no depende de tener muchos jugadores al inicio.
Se consideró un tema "sin fecha"; se descartó al confirmar 1–3 h **por día**, que hace viable Navidad.

## 5. Diseño decidido por el dueño

- **Tema:** muñecos de nieve que se mueven cuando no los miras.
- **Título:** "Don't Blink: Survive the Snowmen" (cambiable después; probar miniaturas en Creator Hub).
- **Objetivo:** cumplir tareas (recoger regalos), no solo sobrevivir tiempo.
- **Etapas** con eliminación por etapa y revivir al iniciar la siguiente.
- **Monetización** según la sección 7.

### 5.1 Estructura de una partida

| Etapa | Lugar | Tarea | Muñecos |
|---|---|---|---|
| 1 | Pueblo nevado | Recoger 4 regalos y llevarlos al saco/trineo | 2, lentos |
| 2 | Bosque de pinos con niebla | Recoger 5 regalos | 3 |
| 3 | Taller de Santa (oscuro, solo linternas) | Recoger 6 regalos | 4, más rápidos |
| Final | Pista del trineo | Llegar al trineo en 30 s | Todos atacan |

- Aparición de regalos: puntos aleatorios de un conjunto por etapa (cambia cada partida).
- Recoger: `ProximityPrompt`. Se carga **un regalo a la vez**, caminando **más lento** (~80% de velocidad).
- Dentro de cada etapa la dificultad sube: tras la mitad de los regalos entregados aparece un muñeco extra.

### 5.2 Muñecos de nieve (la mecánica central)

- Un muñeco está **"observado"** si al menos un jugador vivo lo tiene dentro de su campo de visión y con
  línea de visión libre (raycast sin obstáculos). En la etapa 3 (oscuridad), además debe estar dentro del
  alcance de la linterna.
- Observado → **congelado** (inmóvil). No observado → se mueve hacia el jugador vivo más cercano
  (PathfindingService).
- Si toca a un jugador (distancia < ~3 studs) → jugador **eliminado**.
- Sonido de nieve crujiendo cuando se mueve (pista de terror y de juego).
- Cantidad y velocidad escalan con el número de jugadores (en solitario, menos muñecos).

### 5.3 Eliminación y revivir

- Eliminado → espectador el resto de la etapa.
- Al iniciar la siguiente etapa, **todos los eliminados reviven**.
- Si **todo el grupo** cae en la misma etapa → partida perdida; monedas contadas hasta la última etapa completada.
- Opcional: **revivir al instante pagando Robux** (developer product).

### 5.4 Flujo del servidor

Sala de espera (lobby) → cuenta regresiva (~20 s, arranca con ≥1 jugador listo) → Etapa 1 → 2 → 3 → Final →
pantalla de resultados con monedas → vuelta al lobby. Todo en el mismo lugar (sin teletransportes entre places).

## 6. Progresión y economía

- Monedas: **+5 por regalo entregado, +20 por etapa completada, +50 por escapar** (valores ajustables).
- Guardado persistente con DataStore (reintentos, guardado al salir y al cerrar el servidor).
- Tienda en el lobby: cosméticos con monedas (MVP: 3 gorros, 2 rastros de nieve).

## 7. Monetización

| Producto | Tipo | Precio aprox. | Efecto |
|---|---|---|---|
| Revivir al instante | Developer product (repetible) | ~15 Robux | Vuelves a la etapa actual de inmediato |
| Linterna potente | Gamepass (único) | ~99 Robux | Más alcance de luz/vigilancia; no gana sola |
| Monedas x2 | Gamepass (único) | ~149 Robux | Duplica monedas ganadas |
| Cosméticos premium | Robux | variable | Solo estética |

Toda compra y efecto se valida en el **servidor** (nunca confiar en el cliente).

## 8. MVP (lanzamiento) vs después

**MVP (antes del 15/12):** 3 etapas + final, muñecos con la mecánica, regalos, eliminación/revivir,
monedas guardadas, tienda con 5 cosméticos, 2 gamepasses + 1 developer product, ícono y miniatura,
descripción del juego, prueba en PC y móvil.

**Después:** nuevas etapas, evento/skin de enero (quitar lo navideño), tablas de clasificación, modo asimétrico,
servidores privados, más cosméticos.

## 9. Calendario orientativo

| Fechas | Hito |
|---|---|
| 23–27 nov | Proyecto base, lobby, flujo de rondas, mapa de la etapa 1 (bloques simples) |
| 28 nov–2 dic | Muñecos de nieve (observado/congelado/persecución), regalos, eliminación |
| 3–7 dic | Etapas 2, 3 y final; revivir; monedas + DataStore |
| 8–11 dic | Tienda, gamepasses, developer product, ambiente (niebla, luz, sonidos) |
| 12–15 dic | Pruebas con amigos, ajustes, ícono/miniatura, **publicación** |

## 10. Decisiones dejadas al constructor (marcadas como decisión de Claude)

- Arquitectura: ModuleScripts en `ServerScriptService`/`ReplicatedStorage`, servidor autoritativo,
  remotes validados y con límite de frecuencia.
- Cálculo de "observado" en el servidor usando la orientación del personaje/cámara reportada y raycasts,
  con validación para evitar trampas.
- Valores exactos de velocidad, distancias, tiempos y precios: se ajustan en pruebas.
- Modelado inicial con piezas simples (bloques/esferas) antes de mejorar el arte.
- Textos del juego en inglés; Roblox los traduce automáticamente a otros idiomas.

## 11. Preguntas pendientes del dueño

1. Cámara: ¿primera persona fija o el jugador elige?
2. Arte (muñecos, ícono, miniatura): ¿quién lo hace y con qué?
