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

## Estadísticas por video (YouTube Studio, 20 oct – 16 nov 2026)
- Total: 53,929 vistas, 0:27 de duración media, **81.4 % medio visto**, 78 suscriptores.
- **Lo que mejor funciona: temas a escala del planeta** (la Tierra, el Sol, el agua), todos con ≥ 85 % visto:
  agua del mundo 7,460 vistas · 97.5 % · **38 suscriptores (la mitad del total)**; Tierra el doble 4,570 · 85.4 %;
  Sol apagado 3,853 · 88.9 %; islas 3,481 · 91.5 %; nave al Sol 3,277 · 94.0 %.
- **Lo que menos: temas personales o del cuerpo y los más largos** (63–77 % visto, 1,300–2,600 vistas): rayo 73.9 %,
  dormir 73.9 % (los dos primeros con la estructura nueva), globos 63.4 %, contaminación (0:42) 72.4 %.
- Regla: a más % visto, más vistas. Priorizar **«¿Y si…?» de escala mundial** con un dato vital (agua, Sol, Tierra),
  de 30–36 s, buscando ≥ 85 % visto. Las horas de Shorts (267 h en el periodo) **no cuentan** para las 4,000 h.

## Lección del Short 40 (café, 18 nov 2026)
- El dueño lo dejó de ver en la palabra «adenosina»: el inicio decía demasiado, daba la respuesta («no te da energía,
  te engaña»), era largo y la voz sonaba confusa. Reglas desde ahora:
  - **Gancho = una sola pregunta corta** (≤ ~3 s) + como mucho otra pregunta de 1 s. Sin respuesta, sin anunciar el
    final, sin listas de promesas.
  - **Cero nombres científicos en la voz y en pantalla** (adenosina, hipocampo, glándula óptica…): decirlo con palabras
    de todos los días («una sustancia que da sueño», «la parte del cerebro que guarda recuerdos»). Los nombres van en la
    descripción.

## Requisitos de monetización (YouTube Studio, datos al 11 nov 2026)
- 78 / 1,000 suscriptores; **0 / 4,000 horas válidas** (365 días); **21 K / 10 M vistas de Shorts** (90 días).
- Conclusión: la vía de Shorts (10 M en 90 días ≈ 111,000 vistas diarias) está muy lejos; la vía realista son
  **videos largos de 8–15 min** (4,000 h ≈ 69,000 vistas a ~3.5 min de duración media). Los Shorts sirven para
  sumar suscriptores (~3.7 por cada 1,000 vistas) y mandar gente al largo.

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
- Originalidad (16 nov 2026): el dueño pide temas **que pocos canales estén haciendo** o preguntas que la gente
  **no sabe que se hace** (ej. lo que el cerebro te esconde, por qué no puedes hacerte cosquillas). Evitar los
  temas muy vistos (caer en Júpiter, tormenta solar, Tierra sin girar…). Si se puede, incluir una prueba que el
  espectador haga en el momento. Los Shorts 34 (Júpiter) y 35 (tormenta solar) quedaron en reserva, sin publicar.

## Método (17 nov 2026) — ver `brand/METODO.md`
Video de referencia que mandó el dueño (monetizar con IA). Reglas que se aplican desde ahora a todos los videos:
- **Retención antes que visitas.** Para monetizar se necesitan 4,000 horas de videos largos (las vistas de Shorts no
  suman a esas horas). Los Shorts consiguen suscriptores y llevan al largo; las horas salen de **largos de 8–15 min**
  con buena duración media, sobre temas ya probados.
- **Temas con datos**: outliers, temas que se repiten en varios canales y comentarios (eso lo investiga el dueño;
  desde aquí no se puede ver YouTube).
- **Guion** (fórmula fija): gancho con qué verá + por qué importa + por qué quedarse; bloques gancho → desarrollo →
  cierre; **preguntas abiertas encadenadas** (al cerrar una, abrir otra); público definido, sin tecnicismos. Antes de
  mandarlo, **pasada de «espectador aburrido»** para cortar frases que sobran.
- Sin saludos ni presentación al inicio; sin relleno para alargar.
- Algo nuevo en pantalla cada pocos segundos.
- **3 títulos y 3 miniaturas** por video para la prueba A/B; lo que promete el título se repite en los primeros segundos.
- No borrar ni abandonar videos que empiezan planos: YouTube tarda días o semanas en probarlos.

## Calidad 2D (16 nov 2026)
- Prueba de calidad en el Short 37: `engine2d/hq.js` (personajes con codos, manos, caras que parpadean,
  sombreado, sombras suaves, textura de papel, viñeta, cámara lenta) + `"scale": 1.3333334` (lienzo
  1440×2560: YouTube da mejor calidad arriba de 1080p) + `"fps": 60`. Con la optimización tarda ~3 min por Short:
  el 2D dibuja con el procesador (`--disable-accelerated-2d-canvas`, no SwiftShader), papel + viñeta van precalculados
  en una capa (`hq.finish`) y `build.sh` arma los Shorts 2D en 4 tramos a la vez (`tools/render_parts.sh`).
  Si el dueño la aprueba, usar hq.js en los Shorts nuevos.

## Producción
- `bash tools/build.sh <ep>`: voz (si hay `voice.mp3`) → video → música → efectos → mezcla
  (−14 LUFS en Shorts, −16 en largos).
- Renders largos: `tools/render_parts.sh` por tramos y en segundo plano con `setsid nohup`.
- Commits con los trailers indicados por la sesión; no crear PR sin que lo pidan.
