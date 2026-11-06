#!/usr/bin/env python3
"""Efectos de sonido sintetizados (libres de derechos) para los Shorts.
Lee la lista "sfx" de episodes/<ep>/build/starts.json ([{t, type}], la escribe tools/render.mjs)
y genera una pista con cada efecto en su lugar.
Uso: python3 tools/sfx.py <starts.json> <salida.wav>
Tipos: whoosh (corte de escena), boom (golpe grave), click (interruptor), pop (algo que desaparece),
       splash (algo que cae al agua), crack (algo que se rompe).
"""
import json, sys, wave
import numpy as np

SR = 44100
rng = np.random.default_rng(11)


def lowpass_var(x, a):
    """Filtro de un polo con coeficiente variable en el tiempo (a[i] cerca de 1 = más grave)."""
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = a[i] * acc + (1 - a[i]) * v
        y[i] = acc
    return y


def env(n, attack, decay):
    tt = np.arange(n) / SR
    return np.clip(tt / attack, 0, 1) * np.exp(-np.maximum(0, tt - attack) * decay)


def whoosh():
    n = int(0.42 * SR)
    tt = np.arange(n) / SR
    x = rng.standard_normal(n)
    # El filtro se abre y se cierra: suena como algo que pasa rápido frente a ti.
    sweep = np.sin(np.pi * np.clip(tt / 0.42, 0, 1))
    y = lowpass_var(x, 0.985 - 0.2 * sweep)
    return y * sweep ** 1.5 * 6.0


def boom():
    n = int(1.1 * SR)
    tt = np.arange(n) / SR
    tone = np.sin(2 * np.pi * (34 * tt + (70 / 7) * (1 - np.exp(-7 * tt)))) * np.exp(-tt * 3.2)
    x = rng.standard_normal(n)
    rumble = lowpass_var(x, np.full(n, 0.995)) * np.exp(-tt * 4) * 9
    return 0.9 * tone + rumble


def click():
    n = int(0.08 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt * 120) + 0.5 * np.sin(2 * np.pi * 420 * tt) * np.exp(-tt * 60)


def pop():
    n = int(0.12 * SR)
    tt = np.arange(n) / SR
    f = 500 + 1400 * tt / 0.12
    return 0.7 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 35)


def splash():
    n = int(0.9 * SR)
    tt = np.arange(n) / SR
    x = rng.standard_normal(n)
    y = lowpass_var(x, 0.9 + 0.08 * np.clip(tt / 0.9, 0, 1))
    return y * env(n, 0.01, 5) * 3.5


def crack():
    n = int(0.5 * SR)
    tt = np.arange(n) / SR
    x = rng.standard_normal(n)
    y = (x - lowpass_var(x, np.full(n, 0.7))) * np.exp(-tt * 14)
    return y * 0.9 + 0.5 * np.sin(2 * np.pi * 90 * tt) * np.exp(-tt * 10)


KINDS = {'whoosh': (whoosh, 0.55), 'boom': (boom, 0.9), 'click': (click, 0.6), 'pop': (pop, 0.35),
         'splash': (splash, 0.7), 'crack': (crack, 0.7)}


def main():
    st = json.load(open(sys.argv[1]))
    n = int(st['duration'] * SR) + SR
    out = np.zeros(n)
    cache = {}
    for ev in st.get('sfx', []):
        fn, gain = KINDS[ev['type']]
        if ev['type'] not in cache:
            s = fn()
            cache[ev['type']] = s / (np.max(np.abs(s)) + 1e-9)
        s = cache[ev['type']]
        # El whoosh se adelanta para que su punto más fuerte coincida con el corte.
        i0 = max(0, int((ev['t'] - (0.21 if ev['type'] == 'whoosh' else 0)) * SR))
        i1 = min(n, i0 + len(s))
        out[i0:i1] += gain * s[: i1 - i0]
    out = out[: int(st['duration'] * SR)]
    out = np.clip(out, -1, 1) * 0.8
    with wave.open(sys.argv[2], 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())
    print(f"{len(st.get('sfx', []))} efectos -> {sys.argv[2]}")


if __name__ == '__main__':
    main()
