#!/usr/bin/env python3
"""Sintetiza un canto de garganta mongol (khöömei / sygyt) de ~6 s.

Como funciona el khöömei: la voz mantiene una nota grave fija (el "drone",
aqui La1 = 110 Hz) que contiene muchos armonicos (220, 330, 440 Hz...). El
cantante da forma a la boca para que UNO de esos armonicos resuene muchisimo
mas que el resto, y lo cambia de uno a otro para hacer una melodia silbada
por encima del grave.

Aqui se hace igual: suma de armonicos de 110 Hz, un filtro de vocal ancho
(formante en ~500 Hz) y un filtro muy estrecho cuyo centro salta entre los
armonicos 8, 9, 10, 12... (880-1320 Hz), que es la melodia.

Salida: assets/audio/khoomei.wav y khoomei.ogg (si hay ffmpeg).
Uso: python3 tools/synth_khoomei.py
"""

import os
import subprocess
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "audio")
RATE = 44100
DURATION = 6.0
F0 = 110.0  # nota grave (La1)
HARMONICS = 40

# melodia de armonicos silbados: (numero de armonico, segundos)
MELODY = [(8, 0.9), (9, 0.6), (10, 0.9), (12, 0.7), (10, 0.5), (9, 0.6), (8, 0.8), (6, 1.0)]


def main():
    n = int(RATE * DURATION)
    t = np.arange(n) / RATE

    # vibrato lento y leve, como una voz real
    vibrato = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.clip(t / 1.5, 0, 1)
    phase = 2 * np.pi * F0 * np.cumsum(vibrato) / RATE

    # centro del filtro estrecho (en numero de armonico), con transiciones suaves
    target = np.zeros(n)
    pos = 0
    for harmonic, seconds in MELODY:
        end = min(n, pos + int(seconds * RATE))
        target[pos:end] = harmonic
        pos = end
    target[pos:] = MELODY[-1][0]
    kernel = np.ones(int(0.08 * RATE)) / int(0.08 * RATE)  # 80 ms de deslizamiento
    center = np.convolve(target, kernel, mode="same")

    signal = np.zeros(n)
    for k in range(1, HARMONICS + 1):
        freq = F0 * k
        glottal = 1.0 / k  # fuente de voz: los armonicos altos pesan menos
        vowel = np.exp(-((freq - 500.0) / 450.0) ** 2) * 0.9 + 0.15  # formante ancho "o"
        whistle = 9.0 * np.exp(-((k - center) / 0.35) ** 2)  # resonancia estrecha: la melodia
        amp = glottal * (vowel + whistle)
        signal += amp * np.sin(k * phase)

    # aire / aspereza de garganta
    rng = np.random.default_rng(1206)
    breath = rng.normal(0, 1, n)
    breath = np.convolve(breath, np.ones(30) / 30, mode="same")
    signal += 0.04 * breath * (1 + 0.5 * np.sin(phase))

    # envolvente: entra en 0.35 s, sale en 0.6 s
    env = np.clip(t / 0.35, 0, 1) * np.clip((DURATION - t) / 0.6, 0, 1)
    signal *= env

    # eco corto, como al aire libre en la estepa
    delay = int(0.21 * RATE)
    echo = np.zeros(n)
    echo[delay:] = signal[:-delay] * 0.25
    signal += echo

    signal /= np.max(np.abs(signal)) * 1.05
    pcm = (signal * 32767).astype(np.int16)

    os.makedirs(OUT_DIR, exist_ok=True)
    wav_path = os.path.join(OUT_DIR, "khoomei.wav")
    with wave.open(wav_path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(pcm.tobytes())
    print("OK", wav_path)

    ogg_path = os.path.join(OUT_DIR, "khoomei.ogg")
    try:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav_path, "-c:a", "libvorbis", "-q:a", "6", ogg_path], check=True)
        print("OK", ogg_path)
    except (OSError, subprocess.CalledProcessError) as err:
        print("sin ffmpeg, solo WAV:", err)


if __name__ == "__main__":
    main()
