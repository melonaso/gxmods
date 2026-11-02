#!/usr/bin/env python3
"""Compone y sintetiza la musica del juego al estilo tradicional mongol.

Tres piezas que combinan entre si (todas en La pentatonica menor: La Do Re Mi
Sol, la escala de cinco notas tipica de la musica de la estepa, y en la misma
tonalidad que el canto de garganta del juego):

  music_calm.ogg    "Estepa"   (60 bpm, ~64 s) mientras construyes
  music_warning.ogg "Presagio" (50 bpm, ~48 s) el ultimo minuto antes de Verity
  music_battle.ogg  "Batalla"  (132 bpm, ~58 s) Verity, su huida y la batalla final

Instrumentos (todos sintetizados aqui, sin muestras externas):
  - morin khuur (violin de cabeza de caballo): onda de diente de sierra (como un
    arco frotando la cuerda) con vibrato que entra tarde, deslizamientos entre
    notas, ruido de arco y la resonancia de la caja (ecualizador de formantes)
  - tovshuur (laud de dos cuerdas): cuerda punteada con Karplus-Strong (un
    pulso de ruido que recorre un bucle y se va apagando, como una cuerda real)
  - limbe (flauta): seno con armonicos suaves y aire
  - tambores: golpe grave con caida de tono y "slap" de cuero; el ritmo de
    galope DUM-ta-ta (como los cascos de un caballo) en la batalla
  - bordon de garganta: nota grave fija con resonancias de boca, como el canto
  - viento de la estepa y reverberacion de espacio abierto

Uso: python3 tools/compose_music.py   (necesita numpy; ffmpeg para .ogg)
"""

import math
import os
import subprocess
import tempfile
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "audio")
SR = 44100
rng = np.random.default_rng(1206)

NOTE = {
    "A1": 55.0, "E2": 82.41, "G2": 98.0, "A2": 110.0, "B2": 123.47, "C3": 130.81, "D3": 146.83,
    "E3": 164.81, "F3": 174.61, "G3": 196.0, "A3": 220.0, "C4": 261.63, "D4": 293.66, "E4": 329.63,
    "G4": 392.0, "A4": 440.0, "C5": 523.25, "D5": 587.33, "E5": 659.25,
}
FIFTH = {"A2": "E3", "D3": "A3", "G2": "D3", "C3": "G3", "E3": "B3"}
NOTE["B3"] = 246.94


# ---------- utilidades ----------

def smooth_noise(n, window):
    x = np.convolve(rng.normal(0, 1, n), np.ones(window) / window, mode="same")
    return x / (np.std(x) + 1e-12)


def eq(x, peaks, lowcut=60.0, highcut=8000.0):
    """Ecualizador estatico por FFT: picos gaussianos (frecuencia, ancho, ganancia)."""
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    gain = np.ones_like(f)
    for freq, width, g in peaks:
        gain += g * np.exp(-((f - freq) / width) ** 2)
    gain *= 1 / (1 + (lowcut / np.maximum(f, 1)) ** 4)  # quita retumbe
    gain *= 1 / (1 + (f / highcut) ** 2)  # suaviza agudos
    return np.fft.irfft(spec * gain, len(x))


def reverb(x, seconds, wet):
    ir_len = int(seconds * SR)
    t = np.arange(ir_len) / SR
    ir = rng.normal(0, 1, ir_len) * np.exp(-t / (seconds / 6.9))
    ir = np.convolve(ir, np.ones(8) / 8, mode="same")  # el aire apaga los agudos
    ir[: int(0.015 * SR)] = 0
    ir /= np.sqrt(np.sum(ir**2)) + 1e-12
    size = 1 << int(math.ceil(math.log2(len(x) + ir_len)))
    w = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    w *= np.sqrt(np.mean(x**2)) / (np.sqrt(np.mean(w**2)) + 1e-12)
    return (1 - wet) * x + wet * w


def unit(x):
    return x / (np.max(np.abs(x)) + 1e-12)


def events(seq, bpm, start_beat=0.0, transpose=1.0):
    """[(nota|None, pulsos)] -> [(inicio s, duracion s, frecuencia)]"""
    out, beat, b = [], 60.0 / bpm, start_beat
    for note, beats in seq:
        if note:
            out.append((b * beat, beats * beat, NOTE[note] * transpose))
        b += beats
    return out


# ---------- instrumentos ----------

def morin_khuur(evs, total, glide=0.06, vib=0.006, tremolo=0.0, detached=False):
    """Violin de cabeza de caballo: arco sobre cuerda de crin."""
    n = int(total * SR)
    t = np.arange(n) / SR
    freq = np.zeros(n)
    env = np.zeros(n)
    vib_on = np.zeros(n)
    prev = None
    for start, dur, f in evs:
        a, b = int(start * SR), min(n, int((start + dur) * SR))
        if b <= a:
            continue
        seg = np.arange(b - a) / SR
        fr = np.full(b - a, f)
        if prev and glide > 0:
            fr = prev * (f / prev) ** np.clip(seg / glide, 0, 1)
        freq[a:b] = fr
        attack = 0.025 if detached else 0.08
        release = min(0.12, dur * 0.4) if detached else 0.15
        e = np.clip(seg / attack, 0, 1) * np.clip((dur - seg) / release, 0, 1)
        if not detached:
            e *= 0.85 + 0.15 * np.sin(np.pi * np.clip(seg / dur, 0, 1))  # el arco "respira"
        env[a:b] = np.maximum(env[a:b], e)
        vib_on[a:b] = np.clip((seg - 0.25) / 0.3, 0, 1)
        prev = f
    # mantiene la fase continua en los silencios
    idx = np.where(freq > 0, np.arange(n), 0)
    idx = np.maximum.accumulate(idx)
    freq = freq[idx]
    freq[freq == 0] = evs[0][2]
    freq *= 1 + vib * vib_on * np.sin(2 * np.pi * 5.5 * t + 0.5 * smooth_noise(n, 30000))
    freq *= 1 + 0.002 * smooth_noise(n, 400)  # afinacion humana
    phase = 2 * np.pi * np.cumsum(freq) / SR
    saw = np.zeros(n)
    for k in range(1, 26):
        saw += (np.sin(k * phase) / k) * (k * freq < 12000)
    if tremolo > 0:
        env = env * (1 - tremolo * (0.5 + 0.5 * np.sin(2 * np.pi * 11 * t)))
    bow = rng.normal(0, 1, n) * 0.06
    sig = (unit(saw) + bow) * env
    # caja del morin khuur: madera y piel de caballo
    return unit(eq(sig, [(280, 80, 1.2), (560, 120, 0.6), (1100, 250, 0.9), (2600, 600, 0.4)], 70, 5000))


def tovshuur(plucks, total):
    """Laud punteado (Karplus-Strong). plucks: [(t, freq, amp)]"""
    n = int(total * SR)
    out = np.zeros(n)
    for start, f, amp in plucks:
        a = int(start * SR)
        period = max(2, int(SR / f))
        length = min(int(1.8 * SR), n - a)
        if length <= period + 1:
            continue
        y = np.zeros(length)
        y[:period] = np.convolve(rng.uniform(-1, 1, period), [0.5, 0.5], mode="same")
        decay = 0.995
        p = period
        while p < length:
            m = min(period, length - p)
            prev = y[p - period : p - period + m]
            prev2 = y[p - period - 1 : p - period - 1 + m] if p - period - 1 >= 0 else np.concatenate(([0.0], y[: m - 1]))
            y[p : p + m] = decay * 0.5 * (prev + prev2)
            p += m
        out[a : a + length] += amp * y
    return unit(eq(out, [(220, 70, 0.8), (900, 200, 0.5), (2500, 500, 0.3)], 80, 7000))


def drums(hits, total):
    """hits: [(t, 'low'|'slap', amp)]"""
    n = int(total * SR)
    out = np.zeros(n)
    tl = np.arange(int(0.6 * SR)) / SR
    f_low = 48 + 47 * np.exp(-tl / 0.05)
    low = np.sin(2 * np.pi * np.cumsum(f_low) / SR) * np.exp(-tl / 0.2) + rng.normal(0, 1, len(tl)) * np.exp(-tl / 0.012) * 0.25
    ts = np.arange(int(0.25 * SR)) / SR
    f_slap = 120 + 70 * np.exp(-ts / 0.02)
    slap = np.sin(2 * np.pi * np.cumsum(f_slap) / SR) * np.exp(-ts / 0.07) * 0.7 + rng.normal(0, 1, len(ts)) * np.exp(-ts / 0.02) * 0.45
    for start, kind, amp in hits:
        tpl = low if kind == "low" else slap
        a = int(start * SR)
        m = min(len(tpl), n - a)
        if m > 0:
            out[a : a + m] += amp * tpl[:m]
    return unit(eq(out, [(90, 40, 0.8), (250, 100, 0.3)], 35, 6000))


def limbe(evs, total):
    """Flauta traversa de la estepa."""
    n = int(total * SR)
    t = np.arange(n) / SR
    freq = np.zeros(n)
    env = np.zeros(n)
    for start, dur, f in evs:
        a, b = int(start * SR), min(n, int((start + dur) * SR))
        seg = np.arange(b - a) / SR
        freq[a:b] = f
        env[a:b] = np.clip(seg / 0.06, 0, 1) * np.clip((dur - seg) / 0.2, 0, 1)
    idx = np.maximum.accumulate(np.where(freq > 0, np.arange(n), 0))
    freq = freq[idx]
    freq[freq == 0] = evs[0][2]
    freq *= 1 + 0.004 * np.sin(2 * np.pi * 5 * t)
    ph = 2 * np.pi * np.cumsum(freq) / SR
    tone = np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.05 * np.sin(3 * ph)
    breath = eq(rng.normal(0, 1, n), [(2000, 800, 2.0)], 800, 9000) * 0.15
    return unit((tone + breath) * env)


def throat_drone(f, total, rattle=0.0):
    """Bordon grave con resonancias de boca (como el canto de garganta)."""
    n = int(total * SR)
    t = np.arange(n) / SR
    freq = f * (1 + 0.003 * smooth_noise(n, 8000))
    ph = 2 * np.pi * np.cumsum(freq) / SR
    sig = np.zeros(n)
    for k in range(1, 40):
        sig += (k**-1.1) * np.sin(k * ph + 0.3 * k) * (k * f < 9000)
    if rattle > 0:  # aspereza de garganta (kargyraa)
        sig *= 1 - rattle * (0.5 + 0.5 * np.sin(ph / 2))
    sig *= 0.75 + 0.25 * np.sin(2 * np.pi * t / 8.0)  # respiraciones largas
    return unit(eq(sig, [(450, 120, 1.5), (850, 180, 0.8), (2400, 400, 0.4)], 40, 4000))


def wind(total, howl=0.5):
    n = int(total * SR)
    gust = 0.5 + 0.5 * np.tanh(smooth_noise(n, 60000) * (1 + howl))
    noise = eq(rng.normal(0, 1, n), [(500, 250, 3.0), (1200, 400, 1.0 + howl)], 150, 2500)
    return unit(noise * gust)


def fade(x, fin=0.6, fout=1.5):
    n = len(x)
    t = np.arange(n) / SR
    return x * np.clip(t / fin, 0, 1) * np.clip((n / SR - t) / fout, 0, 1)


def mix(parts):
    out = sum(gain * sig for sig, gain in parts)
    out = np.tanh(1.1 * unit(out)) / np.tanh(1.1)
    return unit(out) * 0.89  # ~ -1 dBFS


# ---------- piezas ----------

def piece_calm():
    bpm = 60
    beat = 60 / bpm
    phrase1 = [("E4", 2), ("D4", 1), ("C4", 1), ("A3", 3), ("C4", 1),
               ("D4", 2), ("E4", 1), ("G4", 1), ("E4", 2), ("D4", 2),
               ("C4", 2), ("A3", 1), ("C4", 1), ("D4", 3), ("E4", 1),
               ("A3", 6), (None, 2)]
    phrase2 = [("A4", 2), ("G4", 1), ("E4", 1), ("G4", 3), ("A4", 1),
               ("C5", 2), ("A4", 1), ("G4", 1), ("E4", 2), ("D4", 2),
               ("E4", 2), ("G4", 1), ("E4", 1), ("D4", 2), ("C4", 2),
               ("A3", 6), (None, 2)]
    total = 64 * beat + 2.5
    fiddle = morin_khuur(events(phrase1 + phrase2, bpm), total)
    # la flauta responde en el segundo verso, una octava arriba y muy suave
    flute = limbe(events(phrase2, bpm, 32, 2.0), total)
    roots = ["A2", "D3", "A2", "A2", "A2", "G2", "D3", "A2"]
    plucks = []
    for i in range(64):
        root = roots[i // 8]
        pattern = [root, FIFTH[root], root, FIFTH[root]]
        name = pattern[i % 4]
        f = NOTE[name] * (2 if i % 4 == 2 else 1)
        plucks.append((i * beat, f, 0.9 if i % 4 == 0 else 0.6))
    lute = tovshuur(plucks, total)
    drum = drums([(b * beat, "low", 0.5) for b in range(0, 64, 4)], total)
    out = mix([(fiddle, 1.0), (flute, 0.22), (lute, 0.45), (drum, 0.25),
               (throat_drone(110.0, total), 0.22), (wind(total, 0.3), 0.12)])
    return fade(reverb(out, 2.8, 0.35))


def piece_warning():
    bpm = 50
    beat = 60 / bpm
    line = [("E3", 4), ("F3", 4), ("E3", 4), ("D3", 4), ("C3", 6), ("B2", 2), ("A2", 8), (None, 2), ("E3", 3), ("F3", 3)]
    total = 40 * beat + 2.5
    fiddle = morin_khuur(events(line, bpm), total, glide=0.12, vib=0.003, tremolo=0.7)
    heart = []
    for b in range(40):
        heart.append((b * beat, "low", 0.8))
        heart.append((b * beat + 0.28 * beat, "low", 0.5))
    out = mix([(fiddle, 0.8), (drums(heart, total), 0.55), (throat_drone(55.0, total, 0.4), 0.45),
               (throat_drone(110.0, total), 0.2), (wind(total, 1.2), 0.3)])
    return fade(reverb(out, 3.5, 0.45))


def piece_battle():
    bpm = 132
    beat = 60 / bpm
    riffs = {
        "A": ["A3", "A3", "C4", "A3"],
        "B": ["D4", "C4", "A3", "G3"],
        "C": ["A3", "C4", "D4", "E4"],
        "D": ["G4", "E4", "D4", "C4"],
    }

    def gallop_riff(order, octave=1.0):
        seq = []
        for r in order:
            for note in riffs[r]:
                seq += [(note, 0.5), (note, 0.25), (note, 0.25)]  # DUM-ta-ta
        return [(n, b) for n, b in seq], octave

    melody_b = [("E4", 2), ("G4", 2), ("A4", 4), ("G4", 2), ("E4", 2), ("D4", 4),
                ("E4", 2), ("G4", 2), ("A4", 2), ("C5", 2), ("A4", 6), (None, 2)]
    melody_d = [("A4", 2), ("C5", 2), ("D5", 4), ("C5", 2), ("A4", 2), ("G4", 4),
                ("E4", 2), ("G4", 2), ("A4", 2), ("G4", 2), ("A4", 8)]
    riff_a, _ = gallop_riff(["A", "B", "A", "C", "A", "B", "D", "A"])
    total = 128 * beat + 2.0
    fiddle_riffs = morin_khuur(events(riff_a, bpm, 0) + events(riff_a, bpm, 64), total, glide=0.015, vib=0.002, detached=True)
    fiddle_song = morin_khuur(events(melody_b, bpm, 32) + events(melody_d, bpm, 96), total, glide=0.07, vib=0.007)

    bars = ["A2", "A2", "G2", "A2", "A2", "A2", "D3", "E3"]
    plucks, hits = [], []
    for b in range(128):
        t0 = b * beat
        root = bars[(b // 4) % 8]
        fifth = FIFTH.get(root, "E3")
        accent = b % 4 == 0
        hits += [(t0, "low", 1.0 if accent else 0.7), (t0 + 0.5 * beat, "slap", 0.5), (t0 + 0.75 * beat, "slap", 0.6)]
        plucks += [(t0, NOTE[root], 0.9), (t0 + 0.5 * beat, NOTE[fifth], 0.55), (t0 + 0.75 * beat, NOTE[root] * 2, 0.6)]
        if b % 16 == 15:  # redoble al final de cada frase
            hits += [(t0 + k * beat / 4, "slap", 0.45 + 0.1 * k) for k in range(4)]
    out = mix([(fiddle_riffs, 0.8), (fiddle_song, 1.0), (tovshuur(plucks, total), 0.5), (drums(hits, total), 0.75),
               (throat_drone(110.0, total, 0.35), 0.3), (wind(total, 0.2), 0.04)])
    return fade(reverb(out, 1.8, 0.22), 0.3, 1.2)


def write(name, signal):
    pcm = (np.clip(signal, -1, 1) * 32767).astype(np.int16)
    os.makedirs(OUT_DIR, exist_ok=True)
    ogg_path = os.path.join(OUT_DIR, name + ".ogg")
    with tempfile.TemporaryDirectory() as tmp:
        wav_path = os.path.join(tmp, name + ".wav")
        with wave.open(wav_path, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav_path, "-c:a", "libvorbis", "-q:a", "5", ogg_path], check=True)
    print(f"OK {ogg_path} ({len(signal) / SR:.1f} s)")


def main():
    write("music_calm", piece_calm())
    write("music_warning", piece_warning())
    write("music_battle", piece_battle())


if __name__ == "__main__":
    main()
