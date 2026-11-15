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

## Retención (14 nov 2026)
- Problema: la gente se va a la mitad (~67 % visto). Causas probables: sin pregunta abierta, el dato
  fuerte sale pronto y el cierre «Deja tu ¿Y si…? abajo» avisa que ya terminó (deslizan).
- Prueba en curso: Short 26 (gota que se duplica) **sin voz**, ~27 s, con una pregunta fija arriba que
  se contesta al final (~85 % del video), números que escalan cada ~3 s y final en **bucle**
  (`"fadeOut": 0`; el último cuadro empata con el primero). El llamado a comentar va en el comentario
  fijado, no al final del video.
- Comparar su % visto contra los Shorts con voz antes de decidir el formato.
- Opinión del dueño sobre el Short 26: lo habría deslizado en 4 s (no se entendía qué se llenaba,
  sin cortes de escena, demasiados números). Reglas para Shorts desde ahora:
  - Temas **más entretenidos que informativos**: preguntas que se haría un niño de 7 años.
  - **Nada de ecuaciones** en pantalla; frases cortas que se lean en 1–2 s; cero números si se puede.
  - Contexto claro desde el fotograma 1 (objetos reconocibles) y **un lugar distinto en cada escena**
    (cortes cada ~3 s); chistes visuales y una sorpresa al final.
  - Las cuentas, si las hay, van en la descripción, no en el video.
  - Ejemplo: Short 27 «¿Y si fueras invisible?» (sin voz, 27 s, lista «Preguntas locas»).
- Opinión sobre el Short 27: ya se entendía, pero faltaba explicar (¿qué se tomó?, ¿cómo supo el perro?)
  y era demasiado infantil. Ajuste: temas de curiosidad adulta y **cada escena = lo que pasa + por qué**
  (una frase corta cada cosa), sin elementos mágicos sin explicar. Ej.: Short 28 «¿Y si salieras al
  espacio sin traje?» (mito que se cae + caso real de la NASA, 1966).
- Los Shorts 26–28 fueron **pruebas** (no se suben). Los que se publican siguen con la voz del dueño, pero
  con la estructura nueva: pregunta abierta al inicio y respuesta casi al final, lo que pasa + por qué,
  un lugar distinto por escena, sin ecuaciones en pantalla y **sin «Deja tu ¿Y si…? abajo»** al cierre
  (termina con una sorpresa). Primeros: Shorts 29 (rayo) y 30 (sin dormir).

## Producción
- `bash tools/build.sh <ep>`: voz (si hay `voice.mp3`) → video → música → efectos → mezcla
  (−14 LUFS en Shorts, −16 en largos).
- Renders largos: `tools/render_parts.sh` por tramos y en segundo plano con `setsid nohup`.
- Commits con los trailers indicados por la sesión; no crear PR sin que lo pidan.
