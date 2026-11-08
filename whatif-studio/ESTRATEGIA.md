# Estrategia del canal — "¿Qué pasaría si…?"

## 1. El nicho (qué funciona y por qué)
Referencia observada: canales en inglés del formato *"What If You Kept ___ and Couldn't Stop?"* (ej. All Answers: 6.3 K suscriptores, 18 videos, uno con 469 K vistas en 3 días).

Patrones que explican su rendimiento:
| Patrón | Por qué funciona |
|---|---|
| **Premisa simple + escalada sin freno** ("y no pudieras parar") | Crea curiosidad (*curiosity gap*: la diferencia entre lo que sabes y lo que quieres saber); el espectador se queda para ver "el final". |
| **Un número grande en pantalla** que sube todo el video | Da sensación de progreso constante; es la "barra de nivel" del video. |
| **Animación 3D low-poly simple** | Barata de producir, legible en móvil, estética reconocible. |
| **Miniatura = número gigante + personaje + una palabra** | Se entiende en < 1 segundo en el feed. |
| **Duración ~8 min** | Supera el umbral de 8 min que habilita anuncios a mitad de video (*mid-rolls*). |

Ventaja para nosotros: **en español el formato está casi vacío**, y el pipeline es automatizado (un episodio = un `script.json` + un `episode.js`).

## 2. Identidad propuesta
- **Nombre:** *¿Y Si No Paras?* (alternativas: *Escala Infinita*, *Qué Pasaría Sí*).
- **Promesa:** "Llevamos una idea simple hasta el extremo… con matemáticas reales."
- **Diferenciador:** cada video explica el cálculo detrás (ej. 365 × 1 cm = 3.65 m), no solo muestra el número. Eso da valor educativo, aumenta retención y comentarios ("¡hice la cuenta y…!").
- **Estilo visual:** mundo low-poly brillante, contador amarillo arriba a la izquierda, chip de tiempo (DÍA / AÑO) arriba a la derecha.

## 3. Formato estándar de episodio
1. **Gancho (0–5 s):** la pregunta en pantalla + primer número.
2. **Día 1 (5–30 s):** lo trivial ("nadie lo nota").
3. **Primera consecuencia (30 s–2 min):** problemas cotidianos.
4. **La física/matemática (2–4 min):** el dato que nadie esperaba (ley cuadrado-cubo, energía, etc.).
5. **Escalada extrema (4–7 min):** comparaciones con cosas conocidas (edificios, montañas, planetas).
6. **Cierre (7–8 min):** número final + pregunta a los comentarios.

## 4. 15 ideas de episodios
1. ¿Y si crecieras 1 cm cada día? *(piloto)*
2. ¿Y si cada vez que parpadeas ganaras $1?
3. ¿Y si tu sombra creciera 10 cm cada hora?
4. ¿Y si cada día pesaras 1 kg menos… para siempre? (llegar a "flotar")
5. ¿Y si todo lo que tocas se duplicara?
6. ¿Y si cada paso te hiciera 1 % más rápido?
7. ¿Y si tu voz se volviera 1 decibel más fuerte cada día?
8. ¿Y si cada hora apareciera 1 persona más siguiéndote?
9. ¿Y si cavaras 1 metro diario hacia el centro de la Tierra?
10. ¿Y si cada día el sol se acercara 1 km?
11. ¿Y si cada mentira te encogiera 1 cm?
12. ¿Y si cada vez que comes, la comida se duplicara en el mundo?
13. ¿Y si cada noche durmieras 1 minuto menos?
14. ¿Y si tu casa creciera un cuarto nuevo cada día?
15. ¿Y si cada día la gravedad bajara 1 %?

## 5. Cadencia y metas
- **Mes 1:** 3 videos/semana de 2–4 min para probar temas (rápidos de producir); medir CTR (*click-through rate*: % de gente que hace clic al ver la miniatura) y retención.
- **Mes 2+:** duplicar los temas ganadores en formato de 8 min; 2 videos/semana.
- **Shorts:** cortar el momento más extremo de cada video en vertical (9:16) — el motor ya acepta `--w 1080 --h 1920`.
- Meta de monetización YouTube: 1,000 suscriptores + 4,000 h de visualización (o 10 M vistas de Shorts en 90 días).

## 6. SEO y miniatura
- **Orden de publicación** (título, miniatura, listas, capítulos y pantalla final listos antes de publicar; primera hora respondiendo): ver `brand/PUBLICACION.md`.
- **Título:** `¿Qué pasaría si [acción] y no pudieras parar?` (+ variante con número).
- **Descripción:** las cuentas del video en texto (aparecen en búsquedas).
- **Miniatura:** 1 número gigante (amarillo, borde negro) + personaje + 1 palabra de impacto. Se puede generar con el mismo motor (`--preview` en el segundo más dramático).

## 7. Mejoras pendientes de producción (prioridad)
1. **Voz:** la voz offline actual (Piper, 16 kHz) es funcional pero robótica. En tu PC, `edge-tts` (gratis) da voces neuronales mucho mejores; ElevenLabs es la opción premium.
2. Efectos de sonido (pasos, multitud, "whoosh" en saltos de tiempo).
3. Más actores/props reutilizables (vehículos, animales, planetas) para nuevas ideas.
