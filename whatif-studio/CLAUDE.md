# Cuentas Locas — reglas del proyecto

Canal de YouTube en español: animaciones «¿Qué pasaría si…?» con cuentas reales.
Responder al dueño del canal en español, de forma breve, directa y formal; explicar el proceso de
las cuentas, y entre paréntesis, de forma breve, cualquier concepto técnico que se mencione.

## Formatos
- **Videos largos 3D** (`episodes/epNN-*`, motor `engine/`): **sin voz**. Subtítulos, música y
  efectos de sonido. Pulir modelos, texturas y física; revisar con `tools/qa.mjs` (choques y parpadeo).
- **Shorts 2D** (`episodes/shortNN-*`, motor `engine2d/`): **con la voz del dueño**. Primero se le
  mandan los guiones (campo `say` de `script.json`, números escritos con palabras); él graba en
  lovevoice.ai y manda los mp3. Se guardan como `episodes/<ep>/voice.mp3` y `tools/voice.py`
  quita silencios, acelera (×1.15), sube el tono (+2 semitonos) y sincroniza.
  Si mandan varios mp3 sin decir cuál es cuál, identificarlos por número de pausas y duración.
- Ideas de suscriptores: dar crédito en pantalla («IDEA DE @usuario») y en la descripción.

## Publicación (ver `brand/PUBLICACION.md`)
- Textos de cada video en `brand/copy.json` → `python3 brand/build_copy.py` → `brand/VIDEOS.md`.
- **No mencionar TikTok ni Instagram** hasta que existan (se activan con `"social"` en `copy.json`).
- Primera línea de la descripción ≤ 150 caracteres (lo que sale en la búsqueda).
- Comentario fijado: un dato + **una pregunta** al final.
- Cada video lleva: listas temáticas (`themes`), siguiente video para pantalla final o video
  relacionado (`next`), y nombre de archivo con el título (`out/subir/`).
- Videos largos: capítulos a mano desde los tiempos reales (`tools/chapters.py`).

## Lo que dicen las estadísticas (primeros 3 días, al 7 nov 2026)
- Shorts: ~1,470 vistas de promedio, ninguno bajo ~900; el mejor fue «¿Y si el Sol se apagara?»
  (2,967). Temas de espacio y catástrofe universal funcionan mejor: priorizarlos.
- Vistos vs. deslizados: 62.5 % (meta: más de 70 %). Me gusta ≈ 3.5 % de las vistas; +36
  suscriptores (≈ 4.3 por cada 1,000 vistas); 96.7 % del tráfico viene del feed de Shorts.
- Por eso cada Short nuevo arranca con: la pregunta en grande arriba desde el fotograma 1
  (`hookTitle`), movimiento inmediato (`hookZoom`), sin fundido desde negro (`fadeIn: 0`) y la imagen
  más impactante primero, sin introducción ni fondos quietos.
- Videos largos: ~7 vistas de promedio. Formato intermedio (1:30–2:45) y temas distintos a los
  Shorts. Siguiente paso: videos largos de 6–10 min que amplíen los Shorts ganadores (ej. «el Sol
  se apaga, minuto a minuto») y enlazarlos como «video relacionado» desde esos Shorts.

## Producción
- `bash tools/build.sh <ep>`: voz (si hay `voice.mp3`) → video → música → efectos → mezcla
  (−14 LUFS en Shorts, −16 en largos).
- Renders largos: `tools/render_parts.sh` por tramos y en segundo plano con `setsid nohup`.
- Commits con los trailers indicados por la sesión; no crear PR sin que lo pidan.
