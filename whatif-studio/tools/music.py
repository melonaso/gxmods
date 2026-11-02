#!/usr/bin/env python3
"""Música de fondo procedural (libre de derechos): pad suave + arpegio ligero.
Uso: python3 tools/music.py <segundos> <salida.wav> [--bpm 96]
Progresión I–V–vi–IV en Do mayor (la base de miles de canciones pop: tónica, dominante,
relativo menor y subdominante), 2 compases por acorde.
"""
import argparse, wave
import numpy as np

SR = 44100
CHORDS = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]  # C, G, Am, F (notas MIDI)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('seconds', type=float)
    ap.add_argument('out')
    ap.add_argument('--bpm', type=float, default=96)
    a = ap.parse_args()

    n = int(a.seconds * SR)
    t = np.arange(n) / SR
    beat = 60 / a.bpm
    chord_len = beat * 8
    out = np.zeros(n)

    # Pad: cada acorde con fundido cruzado.
    for k in range(int(a.seconds / chord_len) + 1):
        notes = CHORDS[k % 4]
        s0 = k * chord_len
        i0, i1 = int(max(0, s0 - 0.5) * SR), min(n, int((s0 + chord_len + 0.5) * SR))
        if i0 >= n:
            break
        tt = t[i0:i1] - s0
        env = np.clip((tt + 0.5) / 1.0, 0, 1) * np.clip((chord_len + 0.5 - tt) / 1.0, 0, 1)
        for m in notes + [notes[0] - 12]:
            f = hz(m)
            w = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt + 0.3) + 0.12 * np.sin(2 * np.pi * 3 * f * tt)
            out[i0:i1] += 0.05 * w * env * (1 + 0.15 * np.sin(2 * np.pi * 0.2 * tt))

    # Arpegio: corcheas sobre el acorde actual, una octava arriba.
    step = beat / 2
    for j in range(int(a.seconds / step)):
        s0 = j * step
        notes = CHORDS[int(s0 / chord_len) % 4]
        m = notes[[0, 1, 2, 1][j % 4]] + 12
        i0, i1 = int(s0 * SR), min(n, int((s0 + 0.6) * SR))
        tt = t[i0:i1] - s0
        out[i0:i1] += 0.035 * np.sin(2 * np.pi * hz(m) * tt) * np.exp(-tt * 7)

    # Fade in/out y normalización suave.
    fade = int(2 * SR)
    out[:fade] *= np.linspace(0, 1, fade)
    out[-fade:] *= np.linspace(1, 0, fade)
    out = out / (np.max(np.abs(out)) + 1e-9) * 0.6
    with wave.open(a.out, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())


if __name__ == '__main__':
    main()
