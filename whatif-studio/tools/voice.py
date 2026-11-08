#!/usr/bin/env python3
"""Voz grabada por ti (o generada en otra app) para un episodio: la limpia, la acelera y la sincroniza.

Uso: python3 tools/voice.py <episodio>
Lee episodes/<ep>/script.json:
  "voice": {"file": "voice.mp3", "tempo": 1.15, "semitones": 2, "pause": 0.12, "comma": 0.05, "lead": 0.06}
  y en cada escena "say": [...] con el texto hablado de cada subtítulo (mismo orden que "caps").

Pasos:
 1. Detecta los tramos de voz (todo lo que pasa de -38 dB) y los silencios entre ellos.
 2. Agrupa en oraciones: un silencio de 0.6 s o más marca el final de una oración. El número de
    oraciones debe coincidir con el del texto "say" (así se sabe qué tramo es de qué escena).
 3. Quita el espacio muerto: entre oraciones deja "pause" s y en las comas "comma" s (más un margen
    fijo para no cortar consonantes).
 4. Acelera (tempo) y sube el tono (semitones, con los formantes intactos para que no suene a
    «ardilla»), ecualiza y comprime la voz.
 5. Calcula cuándo empieza cada subtítulo: reparte el tiempo de habla según los caracteres del texto
    hablado y lo ajusta a la pausa real más cercana.
Escribe episodes/<ep>/build/voice/NN-<id>.wav y build/timing.json (lo usan el motor y build.sh).
"""
import itertools, json, re, subprocess, sys, wave
from pathlib import Path
import numpy as np

SR = 48000
PRE, POST = 0.03, 0.07          # margen alrededor de cada tramo de voz (s)
SENT_GAP = 0.6                  # silencio que separa oraciones (s)


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def segments(x, thr_db=-38, min_sil=0.12):
    """Tramos de voz [(inicio, fin)] en segundos: energía en ventanas de 10 ms."""
    hop = SR // 100
    n = len(x) // hop
    rms = np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)
    on = 20 * np.log10(rms) > thr_db
    segs, i = [], 0
    while i < n:
        if not on[i]:
            i += 1; continue
        j = i
        while j < n and on[j]:
            j += 1
        segs.append([i / 100, j / 100])
        i = j
    merged = []
    for s in segs:  # une tramos separados por silencios más cortos que min_sil
        if merged and s[0] - merged[-1][1] < min_sil:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return [s for s in merged if s[1] - s[0] > 0.05]


def sentences(text):
    return [s for s in re.split(r'(?<=[.!?…])\s+(?=[¿¡«A-ZÁÉÍÓÚÑ])', text.strip()) if s]


def match_sentences(scenes, groups):
    """Cuántos grupos de audio (separados por silencios largos) le tocan a cada escena.

    Las oraciones (. ? !) siempre llevan pausa larga. Los puntos suspensivos («…») y los dos puntos
    («:», «;») a veces sí y a veces no, según la voz: si el audio tiene más pausas largas que
    oraciones, se prueba en cuáles de esos signos hubo pausa y se elige la combinación cuyo reparto
    de texto se parece más al de los tiempos.
    """
    units = []  # (escena, caracteres, ¿la pausa siguiente es opcional?)
    for k, sc in enumerate(scenes):
        for sent in sentences(' '.join(sc['say'])):
            parts = re.split(r'(?<=[…:;])\s+', sent)
            for j, part in enumerate(parts):
                units.append((k, len(re.sub(r'[^\wáéíóúñü]', '', part, flags=re.I)), j < len(parts) - 1))
    strong = sum(1 for u in units if not u[2])
    opt = [i for i, u in enumerate(units) if u[2]]
    extra = len(groups) - strong
    if extra < 0 or extra > len(opt):
        sys.exit(f'El audio tiene {len(groups)} pausas largas y el texto {strong} oraciones: revisa "say" o el audio.')
    durs = [sum(b - a for a, b in g) for g in groups]
    cum_d = np.cumsum(durs) / sum(durs)
    best = None
    for keep in itertools.combinations(opt, extra):
        sents, cur = [], [None, 0]
        for i, (k, n, o) in enumerate(units):
            cur = [k, cur[1] + n]
            if not o or i in keep:
                sents.append(cur); cur = [None, 0]
        cum_c = np.cumsum([c for _, c in sents]) / sum(c for _, c in sents)
        cost = float(np.sum((cum_c - cum_d) ** 2))
        if best is None or cost < best[0]:
            best = (cost, sents)
    per_scene = [0] * len(scenes)
    for k, _ in best[1]:
        per_scene[k] += 1
    if extra:
        print(f'  ({extra} pausa(s) larga(s) en «…» o «:»: se reparten por escena {per_scene})')
    return per_scene


def process(clip, tempo, semis, out):
    """Acelera + sube el tono + ecualiza/comprime. Devuelve la duración real de salida."""
    pitch = 2 ** (semis / 12)
    chain = ','.join([
        f'rubberband=tempo={tempo}:pitch={pitch:.5f}:formant=preserved:pitchq=quality:transients=mixed',
        'highpass=f=90',
        'equalizer=f=280:t=q:w=1.0:g=-2.5',    # menos «caja» en los medios graves
        'equalizer=f=3200:t=q:w=1.2:g=3.5',    # presencia: la voz se entiende sobre la música
        'treble=g=2:f=9000',                   # aire
        'acompressor=threshold=-22dB:ratio=3.5:attack=4:release=90:makeup=3',
        'deesser=i=0.35',
        'alimiter=limit=0.89:level=false',
    ])
    tmp = out.with_suffix('.in.wav')
    write_wav(tmp, clip)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(tmp), '-af', chain, '-ar', str(SR), '-ac', '1', str(out)], check=True)
    tmp.unlink()
    with wave.open(str(out)) as w:
        return w.getnframes() / w.getframerate()


def write_wav(path, x):
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


def main():
    ep = sys.argv[1]
    root = Path(__file__).resolve().parent.parent / 'episodes' / ep
    script = json.loads((root / 'script.json').read_text())
    cfg = script['voice']
    tempo, semis = cfg.get('tempo', 1.0), cfg.get('semitones', 0)
    pause, comma, lead = cfg.get('pause', 0.12), cfg.get('comma', 0.05), cfg.get('lead', 0.06)
    x = decode(root / cfg.get('file', 'voice.mp3'))
    segs = segments(x)

    # Oraciones del audio (por silencios largos) y del texto (por puntuación).
    groups = [[segs[0]]]
    for a, b in zip(segs, segs[1:]):
        (groups.append([b]) if b[0] - a[1] >= SENT_GAP else groups[-1].append(b))
    per_scene = match_sentences(script['scenes'], groups)

    out_dir = root / 'build' / 'voice'
    out_dir.mkdir(parents=True, exist_ok=True)
    timing, gi = [], 0
    fade = int(0.006 * SR)
    for k, (sc, ns) in enumerate(zip(script['scenes'], per_scene)):
        sgroups = groups[gi: gi + ns]; gi += ns
        parts, starts, speech, sent = [np.zeros(int(lead * SR))], [], [], []
        pos = lead
        for gj, g in enumerate(sgroups):
            for si, (a, b) in enumerate(g):
                piece = x[int(max(0, a - PRE) * SR): int((b + POST) * SR)].copy()
                piece[:fade] *= np.linspace(0, 1, fade); piece[-fade:] *= np.linspace(1, 0, fade)
                starts.append(pos + PRE); speech.append(b - a); sent.append(si == 0)
                parts.append(piece); pos += len(piece) / SR
                last = gj == len(sgroups) - 1 and si == len(g) - 1
                if not last:
                    gap = comma if si < len(g) - 1 else pause
                    parts.append(np.zeros(int(gap * SR))); pos += gap
        parts.append(np.zeros(int(0.05 * SR)))
        clip = np.concatenate(parts)
        name = f'{k + 1:02d}-{sc["id"]}.wav'
        dur_in = len(clip) / SR
        dur = process(clip, tempo, semis, out_dir / name)
        f = dur / dur_in  # factor de tiempo real (≈ 1/tempo)
        starts_out = [s * f for s in starts]
        # Inicio de cada subtítulo: proporción de caracteres hablados → tiempo de habla → pausa real.
        # Si la frase anterior termina oración (. ? !), el subtítulo empieza en la oración siguiente;
        # si termina en coma, dos puntos o «…», en la pausa más cercana; si no, donde caiga la proporción.
        chars = [len(re.sub(r'[^\wáéíóúñü]', '', s, flags=re.I)) for s in sc['say']]
        total_sp = sum(speech)
        cue_starts = [0.0]
        for i in range(1, len(chars)):
            target = sum(chars[:i]) / sum(chars) * total_sp
            acc, est = 0.0, None
            for st, sp in zip(starts_out, speech):
                if acc + sp >= target:
                    est = st + (target - acc) * f; break
                acc += sp
            est = est if est is not None else starts_out[-1]
            prev = sc['say'][i - 1].rstrip()
            if re.search(r'[.!?]»?$', prev) and not prev.endswith('…'):
                cand = [st for st, sn in zip(starts_out, sent) if sn and st > 0.2]
                t0 = min(cand, key=lambda s: abs(s - est)) if cand else est
            elif re.search(r'[,;:…]$', prev):
                near = min(starts_out, key=lambda s: abs(s - est))
                t0 = near if abs(near - est) < 0.45 else est
            else:
                t0 = est
            cue_starts.append(max(t0, cue_starts[-1] + 0.35))
        cues = [[round(a, 3), round(b, 3)] for a, b in zip(cue_starts, cue_starts[1:] + [dur])]
        timing.append({'id': sc['id'], 'file': f'voice/{name}', 'dur': round(dur, 3), 'cues': cues})
        print(f'{sc["id"]:>8}: {dur_in:5.2f} s → {dur:5.2f} s  subtítulos en {[c[0] for c in cues]}')
    (root / 'build' / 'timing.json').write_text(json.dumps(timing, ensure_ascii=False, indent=1))
    print(f'Voz total: {len(x) / SR:.1f} s originales → {sum(t["dur"] for t in timing):.1f} s')


if __name__ == '__main__':
    main()
