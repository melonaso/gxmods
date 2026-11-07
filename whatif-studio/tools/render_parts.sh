#!/usr/bin/env bash
# Render por tramos, reanudable: parte el video en N tramos, renderiza los que falten (W a la vez)
# y los une sin volver a codificar. Si algo se interrumpe, al volver a correrlo solo hace lo que falta.
# Uso: bash tools/render_parts.sh ep08-rebote [tramos=8] [a_la_vez=2] [--w 1080 --h 1920 --page engine2d]
set -euo pipefail
cd "$(dirname "$0")/.."
EP="$1"; N="${2:-8}"; WK="${3:-2}"; shift $(( $# < 3 ? $# : 3 )); EXTRA=("$@")
B="episodes/$EP/build"; PARTS="$B/parts"; mkdir -p "$PARTS" out
node tools/render.mjs --ep "$EP" --preview 0 "${EXTRA[@]}" >/dev/null 2>&1   # escribe starts.json
TOTAL=$(python3 -c "import json,math;s=json.load(open('$B/starts.json'));f=json.load(open('episodes/$EP/script.json')).get('fps',30);print(math.ceil(s['duration']*f))")
echo "== $EP: $TOTAL fotogramas en $N tramos ($WK a la vez)"
job() { # i
  local i=$1 a=$(( TOTAL * $1 / N )) b=$(( TOTAL * ($1 + 1) / N )) f="$PARTS/part$(printf %02d $1).mp4"
  [[ -f "$f" ]] && { echo "tramo $i: ya está"; return 0; }
  node tools/render.mjs --ep "$EP" --from $a --to $b --out "$f.tmp.mp4" "${EXTRA[@]}" > "$PARTS/log$i.txt" 2>&1 && mv "$f.tmp.mp4" "$f" && echo "tramo $i listo ($a–$b)"
}
export -f job; export EP TOTAL N PARTS; export EXTRA_STR="${EXTRA[*]:-}"
seq 0 $((N - 1)) | xargs -P "$WK" -I{} bash -c 'EXTRA=($EXTRA_STR); job {}'
for i in $(seq 0 $((N - 1))); do [[ -f "$PARTS/part$(printf %02d $i).mp4" ]] || { echo "falta el tramo $i"; exit 1; }; done
( for i in $(seq 0 $((N - 1))); do echo "file '$(realpath "$PARTS/part$(printf %02d $i).mp4")'"; done ) > "$PARTS/list.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$PARTS/list.txt" -c copy "out/$EP-video.mp4"
echo "Video (sin audio) listo: out/$EP-video.mp4"
