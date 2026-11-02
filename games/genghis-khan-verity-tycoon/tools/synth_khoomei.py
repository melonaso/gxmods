#!/usr/bin/env python3
"""Sintetiza un canto de garganta mongol (khöömei, estilo sygyt) lo mas humano posible.

Que es el khöömei: la voz mantiene una nota grave fija (aqui Do3 = 130.8 Hz) que
trae muchos armonicos (2x, 3x, 4x... esa frecuencia). El cantante estrecha la
boca y mueve la lengua para que UNO de esos armonicos resuene muchisimo mas que
el resto, y salta de uno a otro haciendo una melodia silbada encima del grave.
Con Do como nota base, los armonicos 8, 9, 10 y 12 son Do, Re, Mi y Sol.

Que lo hace sonar humano (y no a sintetizador):
  - jitter y shimmer: el tono y el volumen de la voz tiemblan un poco de un
    ciclo a otro, como las cuerdas vocales reales
  - deriva lenta del tono y vibrato que aparece despues de la entrada
  - ruido de aire mezclado con la voz, pulsando con cada ciclo de la glotis
  - formantes: resonancias de la boca (vocal "o") filtrando la voz, no
    armonicos "puros"
  - fraseo: toma aire antes de cantar, entra con una subida de tono,
    y al soltar la nota cae un poco
  - eco y reverberacion de estepa abierta

Salida: assets/audio/khoomei.wav y khoomei.ogg (si hay ffmpeg).
Uso: python3 tools/synth_khoomei.py
"""

import math
import os
import subprocess
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "audio")
RATE = 44100
DURATION = 6.5
F0 = 130.8  # Do3
VOICE_ON = 0.45  # antes de esto: toma de aire
VOICE_OFF = 5.9  # empieza a soltar la nota
WHISTLE_ON = 0.9  # el silbido aparece despues del grave

# melodia silbada: (armonico, segundos). 8/9/10/12 sobre Do = Do Re Mi Sol
MELODY = [(8, 0.75), (9, 0.5), (10, 0.7), (12, 0.95), (10, 0.45), (9, 0.4), (8, 0.85), (6, 0.4)]

rng = np.random.default_rng(1206)


def smooth_noise(n, window):
    k = np.ones(window) / window
    x = np.convolve(rng.normal(0, 1, n), k, mode="same")
    return x / (np.std(x) + 1e-12)


def resonator(x, freqs, q):
    """Pasa-banda de 2 polos con frecuencia central (array o numero) variable."""
    freqs = np.broadcast_to(np.asarray(freqs, dtype=float), x.shape)
    y = np.zeros_like(x)
    y1 = y2 = 0.0
    for i in range(len(x)):
        w = 2 * math.pi * freqs[i] / RATE
        r = math.exp(-w / (2 * q))
        out = x[i] + 2 * r * math.cos(w) * y1 - r * r * y2
        y2, y1 = y1, out
        y[i] = out
    return y


def unit(x):
    return x / (np.sqrt(np.mean(x * x)) + 1e-12)


def main():
    n = int(RATE * DURATION)
    t = np.arange(n) / RATE

    # --- tono: subida de entrada, deriva, jitter, vibrato y caida final ---
    scoop = 1 - 0.08 * np.exp(-np.clip(t - VOICE_ON, 0, None) / 0.06)
    drift = 1 + 0.006 * smooth_noise(n, 9000)
    jitter = 1 + 0.004 * smooth_noise(n, 180)
    vib_amount = np.clip((t - 1.6) / 1.2, 0, 1)
    vibrato = 1 + 0.005 * vib_amount * np.sin(2 * np.pi * 5.3 * t + 0.4 * smooth_noise(n, 20000))
    fall = 1 - 0.035 * np.clip((t - VOICE_OFF) / (DURATION - VOICE_OFF), 0, 1)
    f0 = F0 * scoop * drift * jitter * vibrato * fall
    phase = 2 * np.pi * np.cumsum(f0) / RATE

    # --- fuente glotal: armonicos con voz "apretada" (poca caida) + shimmer ---
    shimmer = 1 + 0.06 * smooth_noise(n, 300)
    source = np.zeros(n)
    k_max = int(15000 // F0)
    for k in range(1, k_max + 1):
        source += (k ** -1.05) * np.sin(k * phase + 0.3 * k)
    source *= shimmer
    # aire: ruido que pulsa con cada ciclo de la glotis
    aspiration = rng.normal(0, 1, n) * (0.55 + 0.45 * np.cos(phase))
    source = unit(source) + 0.12 * unit(aspiration)

    # --- silbido: centro de la resonancia estrecha siguiendo la melodia ---
    target = np.full(n, float(MELODY[0][0]))
    pos = int(WHISTLE_ON * RATE)
    for harmonic, seconds in MELODY:
        end = min(n, pos + int(seconds * RATE))
        target[pos:end] = harmonic
        pos = end
    target[pos:] = MELODY[-1][0]
    glide = int(0.07 * RATE)  # la lengua tarda ~70 ms en moverse
    center = np.convolve(target, np.ones(glide) / glide, mode="same")
    whistle_freq = center * f0
    whistle_gain = np.clip((t - WHISTLE_ON) / 0.35, 0, 1) * np.clip((VOICE_OFF + 0.2 - t) / 0.4, 0, 1)

    # --- boca: formantes en paralelo (vocal "o") ---
    f1 = unit(resonator(source, 430.0, 4))
    f2 = unit(resonator(source, 880.0, 6))
    f3 = unit(resonator(source, 2500.0, 8))
    f4 = unit(resonator(source, 3400.0, 10))
    whistle = unit(resonator(source, whistle_freq, 38))
    body = unit(np.convolve(source, np.ones(40) / 40, mode="same"))  # pecho
    voice = 1.0 * f1 + 0.45 * f2 + 0.22 * f3 + 0.1 * f4 + 0.5 * body + 1.1 * whistle_gain * whistle

    # envolvente de la voz: entra, crece un poco y se suelta
    attack = np.clip((t - VOICE_ON) / 0.12, 0, 1)
    swell = 0.85 + 0.15 * np.clip((t - VOICE_ON) / 1.5, 0, 1)
    release = np.clip((DURATION - t) / (DURATION - VOICE_OFF), 0, 1) ** 1.3
    voice *= attack * swell * release

    # --- toma de aire antes de cantar ---
    breath_env = np.clip(t / 0.3, 0, 1) * np.clip((VOICE_ON - t) / 0.08, 0, 1)
    breath = unit(resonator(rng.normal(0, 1, n), 1400.0, 1.5)) * breath_env * 0.08

    dry = voice + breath
    dry /= np.max(np.abs(dry)) + 1e-12

    # --- estepa: reflexiones tempranas + cola de reverberacion (~1 s) ---
    ir_len = int(1.2 * RATE)
    ti = np.arange(ir_len) / RATE
    ir = rng.normal(0, 1, ir_len) * np.exp(-ti / 0.28)
    ir = np.convolve(ir, np.ones(6) / 6, mode="same")  # el aire apaga los agudos
    ir[:int(0.012 * RATE)] = 0
    for delay_s, gain in ((0.013, 0.5), (0.021, 0.35), (0.034, 0.25), (0.19, 0.18)):
        ir[int(delay_s * RATE)] += gain * np.max(np.abs(ir))
    size = 1 << int(math.ceil(math.log2(n + ir_len)))
    wet = np.fft.irfft(np.fft.rfft(dry, size) * np.fft.rfft(ir, size), size)[:n]
    wet /= np.max(np.abs(wet)) + 1e-12
    out = 0.8 * dry + 0.28 * wet
    out = np.tanh(1.2 * out) / np.tanh(1.2)  # saturacion suave, como un microfono
    out /= np.max(np.abs(out)) * 1.05
    pcm = (out * 32767).astype(np.int16)

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
