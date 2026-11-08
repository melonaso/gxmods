# Cómo publicar cada video (lista fija)

Basado en la guía «How to Upload Videos on YouTube (Correct Sequence)». Idea central: **YouTube
prueba el video con un público pequeño en el momento en que se hace público**; lo que vea en ese
instante (título, miniatura, descripción, listas) es su primera impresión y no se puede repetir.
Por eso, todo se deja listo **antes** de publicar.

## 1. Antes de publicar (todo cerrado, nada «lo arreglo luego»)

| Paso | Por qué |
|---|---|
| Subir el archivo 1–2 días antes como **Privado** | Da tiempo a procesarlo en HD y a revisar todo sin prisa. Subir temprano está bien; publicar a medias, no. |
| Archivo con el nombre del título (`out/subir/…`) | Cuesta 5 segundos y no estorba (lo genera `brand/build_copy.py`). |
| **Título** definitivo | Es la señal principal de qué trata el video y a quién mostrárselo. |
| **Miniatura** definitiva (videos largos) | Si se publica con la automática, la prueba inicial se hace con ella y el dato queda registrado. |
| **Descripción** completa | YouTube la usa para entender el tema. Los **primeros 150 caracteres** salen en la búsqueda: ahí va la idea del video (`build_copy.py` lo verifica). |
| **Listas de reproducción** agregadas | Le dicen a YouTube qué videos van juntos; agregarlas después pierde esa primera ventana. |
| **Capítulos** escritos a mano (videos largos) | Los automáticos ponen nombres vacíos («Discusión»). Los nuestros salen de los tiempos reales del render y Google los indexa. Desactivar «Capítulos automáticos». |
| **Pantalla final** elegida a propósito | No el video más reciente, sino el que **continúa el tema** (está indicado en cada ficha de `VIDEOS.md`). Así se encadena una sesión de varios videos. |
| **Video relacionado** en Shorts | Lleva del Short a un video largo del mismo tema. |

## 2. Al publicar

- **Horario:** al inicio, publicar cada semana importa más que el día fijo. Cuando haya datos
  (tras unos 5–10 videos), usar *YouTube Studio → Estadísticas → Público → «Cuándo están en
  YouTube tus usuarios»* y publicar 1–2 h antes del pico. Mientras tanto: 18:00–20:00 (hora del
  centro de México), entre semana.
- **Programar está bien**, pero con una alarma en el teléfono para estar conectado cuando salga.

## 3. La primera hora (lo que más pesa en un canal de menos de 50,000 suscriptores)

- **Fijar el comentario** del video (siempre termina en **pregunta**: invita a responder).
- **Responder todos los comentarios.** Likes, comentarios y compartidos en la primera hora le
  dicen a YouTube que el video provoca una reacción, no solo vistas.
- Si un comentario trae una idea de video, responder y anotarla (las mejores se vuelven Shorts
  con crédito al suscriptor).

## 4. Qué mide YouTube en esa prueba

- **CTR** (*click-through rate*: de cada 100 personas que ven la miniatura, cuántas hacen clic).
  Alto → amplía la prueba; bajo → frena el video.
- **Retención:** dónde abandonan los primeros espectadores. Si todos se van en el mismo segundo,
  YouTube supone que todos lo harán. Por eso los videos empiezan con la pregunta y el primer
  número en los primeros 3 segundos.
- **Qué hacen al terminar:** si abren otro video del canal es una señal fuerte (para eso sirven la
  pantalla final y el video relacionado).

## 5. Valores predeterminados de subida (se configuran una sola vez)

*YouTube Studio → Configuración → Valores predeterminados de subida.* Los textos están en
`brand/CANAL.md` («Valores predeterminados de subida»).
