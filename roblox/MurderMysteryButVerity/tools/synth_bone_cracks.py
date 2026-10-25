#!/usr/bin/env python3
"""Sintetiza el sonido de huesos crujiendo para la transformación de Verity.

Uso:  python3 tools/synth_bone_cracks.py
Salida: assets/audio/verity_bone_cracks.wav (y .ogg/.mp3 si hay ffmpeg)

Capas: chasquidos secos que se aceleran (ruido filtrado con resonadores de
1-4 kHz), tres roturas grandes con un golpe grave y un "crunch" granular,
y un poco de sonido húmedo. Todo determinista (semilla fija).
"""

import math
import random
import shutil
import struct
import subprocess
import wave
from pathlib import Path

RATE = 44100
DURATION = 2.8
OUT = Path(__file__).resolve().parent.parent / "assets" / "audio"

rng = random.Random(1337)
buffer = [0.0] * int(RATE * DURATION)


def resonator(signal, freq, q):
    """Paso banda de 2 polos (biquad RBJ)."""
    w0 = 2 * math.pi * freq / RATE
    alpha = math.sin(w0) / (2 * q)
    b0, b2 = alpha, -alpha
    a0, a1, a2 = 1 + alpha, -2 * math.cos(w0), 1 - alpha
    out = []
    x1 = x2 = y1 = y2 = 0.0
    for x in signal:
        y = (b0 * x + b2 * x2 - a1 * y1 - a2 * y2) / a0
        out.append(y)
        x2, x1 = x1, x
        y2, y1 = y1, y
    return out


def lowpass(signal, cutoff):
    a = math.exp(-2 * math.pi * cutoff / RATE)
    y = 0.0
    out = []
    for x in signal:
        y = (1 - a) * x + a * y
        out.append(y)
    return out


def mix(at, signal, gain):
    start = int(at * RATE)
    for i, v in enumerate(signal):
        j = start + i
        if 0 <= j < len(buffer):
            buffer[j] += v * gain


def crack(at, gain=1.0):
    length = int(RATE * rng.uniform(0.006, 0.02))
    tau = RATE * rng.uniform(0.0015, 0.004)
    burst = [rng.uniform(-1, 1) * math.exp(-i / tau) for i in range(length)]
    layered = [0.0] * length
    for _ in range(2):
        band = resonator(burst, rng.uniform(1100, 4200), rng.uniform(4, 9))
        layered = [a + b for a, b in zip(layered, band)]
    click = [v * 0.35 for v in burst]
    mix(at, [a + b for a, b in zip(layered, click)], gain)


def crunch(at, length_s, gain):
    """Granos de ruido muy cortos: el 'crac-crac' de un hueso que se astilla."""
    length = int(RATE * length_s)
    signal = [0.0] * length
    t = 0
    while t < length:
        grain = int(RATE * rng.uniform(0.001, 0.004))
        amp = rng.uniform(0.3, 1.0) * (1 - t / length)
        for i in range(grain):
            if t + i < length:
                signal[t + i] += rng.uniform(-1, 1) * amp * math.exp(-i / (grain / 3))
        t += int(RATE * rng.uniform(0.002, 0.012))
    signal = resonator(signal, rng.uniform(1500, 2600), 2.5)
    mix(at, signal, gain)


def thump(at, gain):
    freq = rng.uniform(85, 130)
    length = int(RATE * 0.18)
    signal = [math.sin(2 * math.pi * freq * i / RATE * (1 - i / length * 0.4)) * math.exp(-i / (RATE * 0.05)) for i in range(length)]
    mix(at, signal, gain)


def squelch(at, gain):
    length = int(RATE * rng.uniform(0.08, 0.16))
    noise = [rng.uniform(-1, 1) for _ in range(length)]
    env = [math.sin(math.pi * i / length) ** 2 for i in range(length)]
    signal = resonator([n * e for n, e in zip(noise, env)], rng.uniform(350, 700), 3)
    mix(at, lowpass(signal, 1500), gain)


# Chasquidos que se aceleran a lo largo de la transformación.
t = 0.05
while t < DURATION - 0.25:
    progress = t / DURATION
    crack(t, rng.uniform(0.7, 1.3) * (0.7 + progress))
    if rng.random() < 0.35:
        crack(t + rng.uniform(0.01, 0.03), rng.uniform(0.2, 0.5))
    if rng.random() < 0.15:
        squelch(t, 0.25)
    t += rng.uniform(0.05, 0.22) * (1.1 - progress * 0.75)

# Tres roturas grandes.
for at, gain in ((0.85, 1.0), (1.6, 1.15), (2.35, 1.4)):
    thump(at, gain * 0.35)
    crack(at, gain * 1.6)
    crack(at + 0.012, gain)
    crunch(at + 0.01, 0.12, gain * 0.9)
    squelch(at + 0.02, gain * 0.4)

# Reverberación corta de habitación (retardos con realimentación).
wet = buffer[:]
for delay_ms, decay in ((23, 0.28), (37, 0.2), (53, 0.14)):
    d = int(RATE * delay_ms / 1000)
    for i in range(d, len(wet)):
        wet[i] += wet[i - d] * decay
signal = [0.75 * a + 0.25 * b for a, b in zip(buffer, wet)]

# compresión suave para que los chasquidos pequeños se oigan junto a los grandes
peak = max(abs(v) for v in signal) or 1
signal = [math.tanh(3.5 * v / peak) for v in signal]
peak = max(abs(v) for v in signal) or 1
signal = [v / peak * 0.89 for v in signal]
fade = int(RATE * 0.05)
for i in range(fade):
    signal[-1 - i] *= i / fade

OUT.mkdir(parents=True, exist_ok=True)
wav_path = OUT / "verity_bone_cracks.wav"
with wave.open(str(wav_path), "wb") as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(RATE)
    f.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, v)) * 32767)) for v in signal))
print("WAV:", wav_path)

if shutil.which("ffmpeg"):
    for ext, codec in (("ogg", ["-c:a", "libvorbis", "-q:a", "6"]), ("mp3", ["-c:a", "libmp3lame", "-b:a", "192k"])):
        target = OUT / f"verity_bone_cracks.{ext}"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(wav_path), *codec, str(target)], check=True)
        print(ext.upper() + ":", target)
