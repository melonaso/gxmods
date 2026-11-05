#!/usr/bin/env python3
"""Capítulos de YouTube para un episodio, a partir de build/starts.json y del campo "chapter" de cada escena.
Reglas de YouTube: el primero en 0:00, al menos 3 capítulos y cada uno de 10 s o más.
Elige qué escenas llevan capítulo propio (un capítulo puede retrasarse hasta 2.5 s para cumplir el mínimo);
las demás se unen al capítulo anterior (con el texto de "chapterJoin" o su nombre).
Uso: python3 tools/chapters.py ep01-crecer
"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIN = 10.0
SHIFT = 2.5   # segundos que un capítulo puede retrasarse para cumplir el mínimo


def plan(starts, end):
    """Prueba todas las combinaciones de escenas con capítulo propio (n ≤ ~12) y elige la que
    conserva más capítulos válidos; a igualdad, la de menor retraso total."""
    n, best = len(starts), None
    for mask in range(1 << (n - 1)):
        keep = [0] + [i for i in range(1, n) if mask >> (i - 1) & 1]
        times, ok, shift = [0], True, 0.0
        for i in keep[1:]:
            t = max(int(starts[i]), times[-1] + int(MIN))
            if t - starts[i] > SHIFT or (i + 1 < n and t >= starts[i + 1]):
                ok = False; break
            times.append(t); shift += t - starts[i]
        if not ok or end - times[-1] < MIN or len(keep) < 3:
            continue
        score = (len(keep), -shift)
        if best is None or score > best[0]:
            best = (score, keep, times)
    return best


def chapters(ep):
    script = json.loads((ROOT / 'episodes' / ep / 'script.json').read_text())
    st = json.loads((ROOT / 'episodes' / ep / 'build' / 'starts.json').read_text())
    meta = {s['id']: s for s in script['scenes']}
    ids = [s['id'] for s in st['starts']]
    starts = [float(s['start']) for s in st['starts']]
    best = plan(starts, float(st['duration']))
    if best is None:
        raise SystemExit(f'{ep}: no hay forma de tener 3 capítulos de 10 s o más')
    _, keep, times = best
    out = []
    for j, i in enumerate(keep):
        name = meta[ids[i]].get('chapter', ids[i])
        # Escenas sin capítulo propio: se añaden al nombre del capítulo que las contiene.
        nxt = keep[j + 1] if j + 1 < len(keep) else len(ids)
        for k in range(i + 1, nxt):
            name += ' · ' + (meta[ids[k]].get('chapterJoin') or meta[ids[k]].get('chapter', ids[k]))
        out.append(f'{times[j] // 60}:{times[j] % 60:02d} {name}')
    return out


if __name__ == '__main__':
    for ep in sys.argv[1:]:
        print('\n'.join(chapters(ep)))
        print()
