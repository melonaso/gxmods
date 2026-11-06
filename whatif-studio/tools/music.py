#!/usr/bin/env python3
"""Música de fondo procedural (libre de derechos): pad suave + arpegio ligero.
Uso: python3 tools/music.py <segundos> <salida.wav> [--bpm 96] [--drums] [--minor]
Progresión I–V–vi–IV en Do mayor (la base de miles de canciones pop: tónica, dominante,
relativo menor y subdominante), 2 compases por acorde.
--minor: la misma progresión empezando en La menor (vi–IV–I–V), que suena más dramática.
--drums: batería y bajo para Shorts (bombo en cada tiempo, palmada en 2 y 4, platillo en contratiempo)
         y un compás por acorde, para que la música avance más rápido.
"""
import argparse, wave
import numpy as np

SR = 44100
MAJOR = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]  # C, G, Am, F (notas MIDI)
MINOR = [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]]  # Am, F, C, G


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lowpass(x, a):
    """Filtro de un polo (suaviza): a cerca de 1 = más grave."""
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = a * acc + (1 - a) * v
        y[i] = acc
    return y


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('seconds', type=float)
    ap.add_argument('out')
    ap.add_argument('--bpm', type=float, default=96)
    ap.add_argument('--drums', action='store_true')
    ap.add_argument('--minor', action='store_true')
    a = ap.parse_args()

    chords = MINOR if a.minor else MAJOR
    n = int(a.seconds * SR)
    t = np.arange(n) / SR
    beat = 60 / a.bpm
    chord_len = beat * (4 if a.drums else 8)
    out = np.zeros(n)
    rng = np.random.default_rng(7)

    # Pad: cada acorde con fundido cruzado.
    for k in range(int(a.seconds / chord_len) + 1):
        notes = chords[k % 4]
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

    # Arpegio: corcheas (o semicorcheas con batería) sobre el acorde actual, una octava arriba.
    step = beat / (4 if a.drums else 2)
    for j in range(int(a.seconds / step)):
        s0 = j * step
        notes = chords[int(s0 / chord_len) % 4]
        m = notes[[0, 1, 2, 1][j % 4]] + 12
        i0, i1 = int(s0 * SR), min(n, int((s0 + 0.6) * SR))
        tt = t[i0:i1] - s0
        out[i0:i1] += 0.035 * np.sin(2 * np.pi * hz(m) * tt) * np.exp(-tt * (12 if a.drums else 7))

    if a.drums:
        # "Bombeo": el resto de la mezcla baja un instante con cada bombo (sidechain, típico del pop).
        pump = 1 - 0.45 * np.exp(-((t % beat) / 0.09))
        out *= pump
        drums = np.zeros(n)
        nbeats = int(a.seconds / beat) + 1
        kick_t = np.arange(int(0.35 * SR)) / SR
        kick = np.sin(2 * np.pi * (45 * kick_t + (110 / 18) * (1 - np.exp(-18 * kick_t)))) * np.exp(-kick_t * 9)
        noise = rng.standard_normal(int(0.25 * SR))
        clap_t = np.arange(len(noise)) / SR
        clap = (noise - lowpass(noise, 0.6)) * np.exp(-clap_t * 22) + 0.4 * np.sin(2 * np.pi * 190 * clap_t) * np.exp(-clap_t * 30)
        hn = rng.standard_normal(int(0.06 * SR))
        hat = (hn - lowpass(hn, 0.3)) * np.exp(-np.arange(len(hn)) / SR * 70)

        def put(sig, s0, g):
            i0 = int(s0 * SR)
            if i0 >= n:
                return
            i1 = min(n, i0 + len(sig))
            drums[i0:i1] += g * sig[: i1 - i0]

        for b in range(nbeats):
            s0 = b * beat
            put(kick, s0, 0.9)
            if b % 2 == 1:
                put(clap, s0, 0.32)
            put(hat, s0 + beat / 2, 0.16)
            put(hat, s0 + beat / 4, 0.05)
            put(hat, s0 + 3 * beat / 4, 0.05)
        # Bajo: la nota grave del acorde en corcheas, cortita.
        for j in range(int(a.seconds / (beat / 2))):
            s0 = j * beat / 2
            root = chords[int(s0 / chord_len) % 4][0] - 24
            i0, i1 = int(s0 * SR), min(n, int((s0 + beat / 2) * SR))
            tt = t[i0:i1] - s0
            f = hz(root)
            wv = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * 2 * f * tt) + 0.15 * np.sin(2 * np.pi * 3 * f * tt)
            out[i0:i1] += 0.11 * wv * np.exp(-tt * 6) * np.clip(tt / 0.005, 0, 1)
        out = out + drums * 0.5

    # Fade in/out y normalización suave (con batería, entrada casi inmediata: el Short empieza ya).
    fade_in = int((0.15 if a.drums else 2) * SR)
    fade_out = int((1.2 if a.drums else 2) * SR)
    out[:fade_in] *= np.linspace(0, 1, fade_in)
    out[-fade_out:] *= np.linspace(1, 0, fade_out)
    out = out / (np.max(np.abs(out)) + 1e-9) * 0.6
    with wave.open(a.out, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())


if __name__ == '__main__':
    main()
