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

# "voice" en script.json -> voz grabada aparte (episodes/<ep>/voice.mp3): se limpia, se acelera y
# marca el ritmo del video (tools/voice.py).
HAS_VOICE=$(python3 -c "import json;print('voice' in json.load(open('episodes/$EP/script.json')))")

if [[ "$HAS_VOICE" == "True" ]]; then
  echo "== 1/4 Voz grabada"
  python3 tools/voice.py "$EP"
elif [[ "$NARRATION" == "True" ]]; then
  echo "== 1/4 Narración"
  python3 tools/tts.py "$EP" "${TTS_ARGS[@]}"
else
  echo "== 1/4 Narración: desactivada (solo música)"
fi

echo "== 2/4 Video"
# SKIP_RENDER=1: usa out/<ep>-video.mp4 ya hecho (p. ej. con tools/render_parts.sh).
if [[ "${SKIP_RENDER:-0}" != "1" ]]; then node tools/render.mjs --ep "$EP" --out "out/$EP-video.mp4" "${RENDER_ARGS[@]}"; fi

echo "== 3/4 Música"
DUR=$(python3 -c "import json;print(json.load(open('$B/starts.json'))['duration'])")
python3 tools/music.py "$DUR" "$B/music.wav" --bpm "$BPM" $MUSIC_FLAGS
# Efectos de sonido (whoosh en los cortes, golpes...) si el episodio los pide.
python3 tools/sfx.py "$B/starts.json" "$B/sfx.wav"

echo "== 4/4 Mezcla"
python3 tools/mix.py "$EP"
echo "Listo: out/$EP.mp4"
