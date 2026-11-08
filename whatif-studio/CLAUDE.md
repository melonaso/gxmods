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

## Producción
- `bash tools/build.sh <ep>`: voz (si hay `voice.mp3`) → video → música → efectos → mezcla
  (−14 LUFS en Shorts, −16 en largos).
- Renders largos: `tools/render_parts.sh` por tramos y en segundo plano con `setsid nohup`.
- Commits con los trailers indicados por la sesión; no crear PR sin que lo pidan.
