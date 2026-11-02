#!/usr/bin/env python3
"""Sintetiza un rugido de monstruo para Verity (~3.5 s).

Como se arma un rugido:
  - fuente: pulsos de "garganta" a ~80 Hz que suben y luego caen a ~55 Hz,
    con temblor aleatorio del tono (jitter) y un subarmonico a la mitad del
    tono (eso da la aspereza de "gruñido")
  - traqueteo: la amplitud se modula a ~28 Hz (las cuerdas vocales vibran
    desordenadas, como el ronquido de un leon)
  - formantes: tres filtros resonantes que hacen de "boca" abierta (vocal A
    que se cierra hacia O al final)
  - saturacion (tanh) y ecos cortos para que suene enorme

Salida: assets/audio/verity_roar.wav y .ogg (si hay ffmpeg).
Uso: python3 tools/synth_roar.py
"""

import math
import os
import subprocess
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "audio")
RATE = 44100
DURATION = 3.5


def resonator(x, freqs, q):
    """Filtro pasa-banda de 2 polos con frecuencia central variable en el tiempo."""
    y = np.zeros_like(x)
    y1 = y2 = 0.0
    for i in range(len(x)):
        w = 2 * math.pi * freqs[i] / RATE
        r = math.exp(-w / (2 * q))
        a1 = -2 * r * math.cos(w)
        a2 = r * r
        out = (1 - r) * x[i] - a1 * y1 - a2 * y2
        y2, y1 = y1, out
        y[i] = out
    return y


def main():
    n = int(RATE * DURATION)
    t = np.arange(n) / RATE
    rng = np.random.default_rng(666)

    # contorno del tono: sube en el ataque, se sostiene y cae al final
    f0 = 62 + 30 * np.sin(np.pi * np.clip(t / 1.4, 0, 1)) * np.clip((DURATION - t) / 2.0, 0.35, 1)
    jitter = np.convolve(rng.normal(0, 1, n), np.ones(400) / 400, mode="same") * 40
    f0 = f0 * (1 + 0.06 * jitter)
    phase = 2 * np.pi * np.cumsum(f0) / RATE

    # pulsos de garganta (diente de sierra suavizado) + subarmonico
    saw = 2 * ((phase / (2 * np.pi)) % 1.0) - 1
    sub = np.sign(np.sin(phase / 2)) * 0.6
    noise = rng.normal(0, 1, n) * 0.5
    source = saw + sub + noise

    # traqueteo del gruñido
    rattle = 0.55 + 0.45 * np.sin(2 * np.pi * (26 + 6 * np.sin(2 * np.pi * 0.7 * t)) * t)
    source *= rattle

    # boca: vocal A abierta que se cierra hacia O
    close = np.clip((t - 1.6) / 1.6, 0, 1)
    f1 = 700 - 300 * close
    f2 = 1150 - 350 * close
    f3 = np.full(n, 2400.0)
    voiced = resonator(source, f1, 4) * 1.0 + resonator(source, f2, 5) * 0.7 + resonator(source, f3, 6) * 0.35
    voiced += resonator(source, np.full(n, 140.0), 2) * 0.8  # pecho

    # envolvente y saturacion
    env = np.clip(t / 0.25, 0, 1) * np.clip((DURATION - t) / 1.2, 0, 1) ** 1.5
    signal = np.tanh(2.5 * voiced / (np.max(np.abs(voiced)) + 1e-9)) * env

    # ecos (estepa abierta, muy grande)
    out = signal.copy()
    for delay_s, gain in ((0.11, 0.35), (0.23, 0.22), (0.41, 0.12)):
        d = int(delay_s * RATE)
        out[d:] += signal[:-d] * gain
    out /= np.max(np.abs(out)) * 1.05
    pcm = (out * 32767).astype(np.int16)

    os.makedirs(OUT_DIR, exist_ok=True)
    wav_path = os.path.join(OUT_DIR, "verity_roar.wav")
    with wave.open(wav_path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(pcm.tobytes())
    print("OK", wav_path)
    ogg_path = os.path.join(OUT_DIR, "verity_roar.ogg")
    try:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav_path, "-c:a", "libvorbis", "-q:a", "6", ogg_path], check=True)
        print("OK", ogg_path)
    except (OSError, subprocess.CalledProcessError) as err:
        print("sin ffmpeg, solo WAV:", err)


if __name__ == "__main__":
    main()
