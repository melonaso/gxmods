# WhatIf Studio

Estudio automatizado para producir videos animados "¿Qué pasaría si…?" en español.
Un episodio = **un guion (`script.json`) + una escena 3D (`episode.js`)**; el resto (voz, render, música, mezcla) es automático.

Estrategia del canal: [ESTRATEGIA.md](ESTRATEGIA.md).

## Cómo funciona (pipeline)
```
script.json ──► tools/tts.py ──► narración por escena (.wav) + timing.json (duraciones reales)
                                         │
episode.js + engine/ ──► tools/render.mjs (Chromium headless, frame por frame) ──► video sin audio
                                         │
tools/music.py (música procedural) ──► tools/build.sh mezcla voz + música ──► out/<episodio>.mp4
```
- **Render determinista:** cada frame se calcula a partir del tiempo `t`, no del reloj real. Si el render va lento, el video final no salta.
- **Sincronía automática:** cada escena dura lo que dure su narración + una pausa (`gap`). Si cambias el texto, el video se reajusta solo.
- **Ducking:** la música baja de volumen automáticamente cuando hay voz (compresión *sidechain*: la voz controla el volumen de la música).

## Requisitos
- Node 18+, Python 3.10+, ffmpeg.
- `npm install` (instala three.js y la fuente Inter).
- `pip install playwright edge-tts piper-tts numpy` y `npx playwright install chromium` (si no tienes Chromium para Playwright).

### Voz
1. **edge-tts** (recomendado, requiere internet): voces neuronales gratis. Por defecto `es-MX-JorgeNeural`; otras: `es-MX-DaliaNeural`, `es-ES-AlvaroNeural` (cámbialo en `script.json → voice.edge`).
2. **Piper** (offline, respaldo): descarga el modelo y descomprímelo en `models/`:
   ```bash
   mkdir -p models && curl -L https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-es-mls_9972-low.tar.gz | tar xz -C models --one-top-level=es-mls_9972-low
   ```

## Producir un episodio
```bash
bash tools/build.sh ep01-crecer
```
Opciones: `--engine piper|edge`, `--w 1080 --h 1920` (vertical para Shorts).

Solo capturas para revisar el estilo (segundos):
```bash
node tools/render.mjs --ep ep01-crecer --preview 2,30,60,90
```
Vista previa en vivo (sin audio): sirve la carpeta y abre `engine/index.html?ep=ep01-crecer&play`.

## Crear un episodio nuevo
1. Copia `episodes/ep01-crecer/` a `episodes/ep02-<tema>/`.
2. Edita `script.json`: una entrada por escena con `text` (narración; escribe los números con letra para que la voz los lea bien) y los parámetros que use tu `episode.js` (en el piloto: `d0/d1` días, `cam`, `crowd`, `counter`, `titleCard`).
3. Edita `episode.js`:
   - `setup(C)`: construye el mundo una vez (usa `C.actors`: `createPerson`, `createCrowd`, `createHouse`, `createTree`, `createBuilding`, `createRoad`).
   - `update(C, { t, scene, local, p })`: posiciona cámara/actores para el instante `t` y devuelve la capa de texto `{ counter, chip, title }`.
4. `bash tools/build.sh ep02-<tema>`.

## Estructura
```
engine/    index.html, world.js (cielo, luces, suelo), actors.js (personajes y utilería),
           overlay.js (contador, chip, título, subtítulos), timeline.js (motor por tiempo)
episodes/  un directorio por episodio (build/ se genera y no se versiona)
tools/     tts.py, render.mjs, music.py, build.sh
out/       videos y capturas (no se versiona)
```
