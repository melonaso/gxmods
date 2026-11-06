#!/usr/bin/env bash
# Produce un episodio completo: voz -> video -> música -> mezcla final.
# Uso: bash tools/build.sh ep01-crecer [--engine piper] [--w 1280 --h 720]
set -euo pipefail
cd "$(dirname "$0")/.."

EP="${1:-ep01-crecer}"; shift || true
TTS_ARGS=(); RENDER_ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --engine|--length-scale) TTS_ARGS+=("$1" "$2"); shift 2 ;;
    *) RENDER_ARGS+=("$1"); shift ;;
  esac
done

B="episodes/$EP/build"
# Episodios 2D (Shorts verticales): "type": "2d" en script.json.
if [[ "$(python3 -c "import json;print(json.load(open('episodes/$EP/script.json')).get('type','3d'))")" == "2d" ]]; then
  RENDER_ARGS+=(--page engine2d --w 1080 --h 1920)
fi
BPM=$(python3 -c "import json;print(json.load(open('episodes/$EP/script.json')).get('music',{}).get('bpm',96))")
# Opciones de música del guion: "music": {"bpm": 128, "drums": true, "minor": true}
MUSIC_FLAGS=$(python3 -c "import json;m=json.load(open('episodes/$EP/script.json')).get('music',{});print(' '.join(f for f,k in (('--drums','drums'),('--minor','minor')) if m.get(k)))")
mkdir -p out "$B"

# "narration": false en script.json -> video solo con música y textos en pantalla.
NARRATION=$(python3 -c "import json;print(json.load(open('episodes/$EP/script.json')).get('narration', True))")

if [[ "$NARRATION" == "True" ]]; then
  echo "== 1/4 Narración"
  python3 tools/tts.py "$EP" "${TTS_ARGS[@]}"
else
  echo "== 1/4 Narración: desactivada (solo música)"
fi

echo "== 2/4 Video"
node tools/render.mjs --ep "$EP" --out "out/$EP-video.mp4" "${RENDER_ARGS[@]}"

echo "== 3/4 Música"
DUR=$(python3 -c "import json;print(json.load(open('$B/starts.json'))['duration'])")
python3 tools/music.py "$DUR" "$B/music.wav" --bpm "$BPM" $MUSIC_FLAGS
# Efectos de sonido (whoosh en los cortes, golpes...) si el episodio los pide.
python3 tools/sfx.py "$B/starts.json" "$B/sfx.wav"

echo "== 4/4 Mezcla"
# Cada escena se retrasa (adelay) hasta su inicio; la música baja de volumen cuando hay voz (sidechain).
python3 - "$EP" "$NARRATION" <<'PY'
import json, subprocess, sys
ep = sys.argv[1]; b = f'episodes/{ep}/build'
st = json.load(open(f'{b}/starts.json'))
if sys.argv[2] != 'True':
    # Sin voz: música + efectos, normalizados a volumen estándar (los Shorts, un poco más fuertes).
    short = json.load(open(f'episodes/{ep}/script.json')).get('type') == '2d'
    lufs = -14 if short else -16
    subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'out/{ep}-video.mp4', '-i', f'{b}/music.wav', '-i', f'{b}/sfx.wav',
        '-filter_complex', f'[1:a]volume=0.7[m];[m][2:a]amix=inputs=2:normalize=0:duration=first,loudnorm=I={lufs}:TP=-1.5[aout]', '-map', '0:v', '-map', '[aout]',
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-shortest', f'out/{ep}.mp4'])
    sys.exit(0)
tm = json.load(open(f'{b}/timing.json'))
inputs, filt, labels = [], [], []
for i, (s, t) in enumerate(zip(st['starts'], tm)):
    inputs += ['-i', f'{b}/{t["file"]}']
    ms = int(s['start'] * 1000)
    filt.append(f'[{i+1}:a]adelay={ms}|{ms},apad[v{i}]')
    labels.append(f'[v{i}]')
n = len(labels)
filt.append(f'{"".join(labels)}amix=inputs={n}:normalize=0:duration=longest,atrim=0:{st["duration"]},asplit[voz][key]')
filt.append(f'[{n+1}:a]volume=0.55[mus]')
filt.append('[mus][key]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[duck]')
filt.append('[voz][duck]amix=inputs=2:normalize=0,loudnorm=I=-15:TP=-1.5[aout]')
cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-i', f'out/{ep}-video.mp4', *inputs, '-i', f'{b}/music.wav',
       '-filter_complex', ';'.join(filt), '-map', '0:v', '-map', '[aout]',
       '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', f'out/{ep}.mp4']
subprocess.check_call(cmd)
PY
echo "Listo: out/$EP.mp4"
