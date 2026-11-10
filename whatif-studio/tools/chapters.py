#!/usr/bin/env python3
"""Capítulos de YouTube para un episodio, a partir de build/starts.json y del campo "chapter" de cada escena.
Reglas de YouTube: el primero en 0:00, al menos 3 capítulos y cada uno de 10 s o más.
Elige qué escenas llevan capítulo propio (un capítulo puede retrasarse hasta 2.5 s para cumplir el mínimo);
las demás se unen al capítulo anterior (con el texto de "chapterJoin" o su nombre; sin nombre, en silencio).
Uso: python3 tools/chapters.py ep01-crecer
"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIN = 10.0
SHIFT = 2.5   # segundos que un capítulo puede retrasarse para cumplir el mínimo


def plan(starts, end, allowed=None):
    """Elige qué escenas llevan capítulo propio: el máximo de capítulos válidos y, a igualdad,
    el menor retraso total. Programación dinámica sobre (última escena con capítulo, su segundo):
    el segundo de cada capítulo depende solo del anterior, así que basta guardar la mejor cadena
    que termina en cada estado (antes se probaban las 2^(n-1) combinaciones)."""
    n = len(starts)
    allowed = set(range(n)) if allowed is None else set(allowed) | {0}
    dp = {(0, 0): ((1, 0.0), [0], [0])}   # (escena, segundo) → (puntaje, escenas, segundos)
    for i in range(1, n):
        if i not in allowed:
            continue
        for (j, tj), (score, keep, times) in list(dp.items()):
            if j >= i:
                continue
            t = max(int(starts[i]), tj + int(MIN))
            if t - starts[i] > SHIFT or (i + 1 < n and t >= starts[i + 1]):
                continue
            cand = ((score[0] + 1, score[1] - (t - starts[i])), keep + [i], times + [t])
            if (i, t) not in dp or cand[0] > dp[(i, t)][0]:
                dp[(i, t)] = cand
    best = None
    for (_, t), (score, keep, times) in dp.items():
        if end - t < MIN or len(keep) < 3:
            continue
        if best is None or score > best[0]:
            best = (score, keep, times)
    return best


def chapters(ep):
    script = json.loads((ROOT / 'episodes' / ep / 'script.json').read_text())
    st = json.loads((ROOT / 'episodes' / ep / 'build' / 'starts.json').read_text())
    meta = {s['id']: s for s in script['scenes']}
    ids = [s['id'] for s in st['starts']]
    starts = [float(s['start']) for s in st['starts']]
    # Solo las escenas con "chapter" pueden abrir capítulo; las demás se unen al anterior.
    best = plan(starts, float(st['duration']), [i for i, x in enumerate(ids) if 'chapter' in meta[x]])
    if best is None:
        raise SystemExit(f'{ep}: no hay forma de tener 3 capítulos de 10 s o más')
    _, keep, times = best
    out = []
    for j, i in enumerate(keep):
        name = meta[ids[i]].get('chapter', ids[i])
        # Escenas sin capítulo propio: se añaden al nombre del capítulo que las contiene.
        nxt = keep[j + 1] if j + 1 < len(keep) else len(ids)
        for k in range(i + 1, nxt):
            extra = meta[ids[k]].get('chapterJoin') or meta[ids[k]].get('chapter')
            if extra:
                name += ' · ' + extra
        out.append(f'{times[j] // 60}:{times[j] % 60:02d} {name}')
    return out


if __name__ == '__main__':
    for ep in sys.argv[1:]:
        print('\n'.join(chapters(ep)))
        print()
