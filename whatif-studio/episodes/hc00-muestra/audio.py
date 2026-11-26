"""Audio de la muestra del documental (hardcore / hardstyle / uptempo): todos los sonidos se generan aquí, desde cero
(sin samples ni música con derechos). Lee build/starts.json para empatar cada escena y deja build/audio.wav.

Kicks (el golpe grave del bombo):
- «909»: como el de una caja de ritmos de los 80: un tono que baja rápido de agudo a grave y se apaga.
- gabber: el mismo kick con muchísima ganancia hasta que se rompe (distorsión): suena áspero y casi con nota.
- hardstyle: golpe corto + «cola» distorsionada con nota, y entre kick y kick el bajo invertido (crece y se corta).
- uptempo: kick aún más distorsionado y más rápido (más de 200 golpes por minuto).
"""
import json, sys, wave
from pathlib import Path
import numpy as np

SR = 48000
ROOT = Path(__file__).resolve().parent


def env_exp(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


def sweep(n, f0, f1, tau, phase=0.0):
    """Seno cuya frecuencia baja de f0 a f1 con constante tau (s)."""
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / tau)
    return np.sin(phase + 2 * np.pi * np.cumsum(f) / SR)


def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x):
        s = (1 - a) * v + a * s; y[i] = s
    return y


def noise(n, seed=0):
    return np.random.default_rng(seed).uniform(-1, 1, n)


def kick909(dur=0.42):
    n = int(dur * SR)
    body = sweep(n, 230, 52, 0.028) * env_exp(n, 0.22)
    click = noise(n, 1) * env_exp(n, 0.0025) * 0.35
    return (body + click) * 0.9


def kick_gabber(dur=0.33):
    k = kick909(dur)
    d = np.tanh(k * 14.0)                      # se «rompe» el sonido: distorsión
    d = d * (0.75 + 0.25 * env_exp(len(d), 0.15))
    return onepole_lp(d, 5200) * 0.85


def kick_hardstyle(dur=0.36, note=55.0):
    n = int(dur * SR)
    punch = sweep(n, 420, note * 1.6, 0.012) * env_exp(n, 0.05)
    tail = sweep(n, note * 1.5, note, 0.06, phase=0.4)
    tail_env = np.clip(np.arange(n) / (0.012 * SR), 0, 1) * env_exp(n, 0.5)
    tail_env[int(0.82 * n):] *= np.linspace(1, 0, n - int(0.82 * n))
    x = punch * 1.2 + np.tanh(tail * tail_env * 6.0) * 0.8
    click = noise(n, 2) * env_exp(n, 0.002) * 0.4
    return onepole_lp(np.tanh((x + click) * 1.6), 6500) * 0.8


def reverse_bass(dur, note=55.0):
    """Bajo «al revés»: crece desde silencio y se corta en seco antes del siguiente kick."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * note * t) + 0.35 * np.sin(2 * np.pi * note * 2 * t)
    e = (np.arange(n) / n) ** 2.2
    e[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
    return onepole_lp(np.tanh(tone * e * 4.0), 2500) * 0.55


def kick_uptempo(dur=0.25):
    n = int(dur * SR)
    body = sweep(n, 600, 60, 0.008) * env_exp(n, 0.12)
    x = np.tanh(body * 22.0)
    x = x * (0.8 + 0.2 * np.sin(2 * np.pi * 17 * np.arange(n) / SR))   # áspero, con «rasposo»
    return onepole_lp(x, 7500) * 0.8


def hat(dur=0.05, seed=3):
    n = int(dur * SR)
    x = noise(n, seed); x = x - np.concatenate([[0], x[:-1]])  # quita graves (pasa-altos simple)
    return x * env_exp(n, 0.012) * 0.18


def impact(dur=2.5):
    n = int(dur * SR)
    boom = sweep(n, 90, 38, 0.2) * env_exp(n, 0.7)
    hiss = onepole_lp(noise(n, 4), 3000) * env_exp(n, 0.25) * 0.5
    return np.tanh((boom + hiss) * 1.5) * 0.9


def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / n
    return onepole_lp(noise(n, 5), 1200) * (t ** 2) * 0.35 + np.sin(2 * np.pi * 41 * np.arange(n) / SR) * 0.18 * np.minimum(1, t * 3)


def place(buf, x, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(x)); buf[i:j] += x[: j - i] * gain


def pattern(buf, t0, t1, bpm, kick, offbeat=None, hats=True, gain=1.0):
    step = 60.0 / bpm; t = t0
    while t < t1 - 0.05:
        place(buf, kick, t, gain)
        if hats: place(buf, hat(), t + step / 2, gain)
        if offbeat is not None: place(buf, offbeat, t + step * 0.5, gain)
        t += step


def main(ep_dir: Path):
    st = json.load(open(ep_dir / 'build' / 'starts.json'))
    S = {s['id']: s['start'] for s in st['starts']}
    ends = {a['id']: b['start'] for a, b in zip(st['starts'], st['starts'][1:])}
    ends[st['starts'][-1]['id']] = st['duration']
    buf = np.zeros(int((st['duration'] + 0.5) * SR))
    # 1) Intro: zumbido que sube y golpe al aparecer el título.
    place(buf, riser(S['tr909'] - 0.2), 0.0, 0.8)
    place(buf, impact(), 0.55, 1.0)
    # 2) La caja de ritmos: kick limpio a 140 por minuto… y a la mitad se distorsiona (nace el gabber).
    cues = {x['id']: x.get('cues', [0]) for x in st['starts']}
    mid = S['tr909'] + (cues['tr909'][1] if len(cues['tr909']) > 1 else (ends['tr909'] - S['tr909']) * 0.5)
    pattern(buf, S['tr909'], mid, 140, kick909(), hats=False)
    pattern(buf, mid, ends['tr909'], 140, kick_gabber(), hats=False)
    # 3) Gabber en Rotterdam: 180 por minuto, con platillos.
    pattern(buf, S['gabber'], ends['gabber'], 180, kick_gabber())
    # 4) Hardstyle: 150 por minuto con bajo invertido entre kicks.
    step = 60 / 150
    pattern(buf, S['hardstyle'], ends['hardstyle'], 150, kick_hardstyle(), offbeat=reverse_bass(step * 0.5 - 0.005), hats=False)
    # 5) Uptempo: 210 por minuto.
    pattern(buf, S['uptempo'], ends['uptempo'] - 0.3, 210, kick_uptempo(), gain=0.95)
    # 6) Cierre: un último golpe y silencio.
    place(buf, impact(3.0), S['cierre'] + 0.05, 0.9)
    buf = np.tanh(buf * 0.9)
    out = ep_dir / 'build' / 'audio.wav'
    with wave.open(str(out), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(buf, -1, 1) * 32000).astype(np.int16).tobytes())
    print('audio listo:', out, f'{len(buf) / SR:.1f} s')


if __name__ == '__main__':
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT)
