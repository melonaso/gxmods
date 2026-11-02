#!/usr/bin/env python3
"""Genera la narración de cada escena y build/timing.json con la duración real del audio.

Motores, en orden de preferencia:
  1. edge-tts (voces neuronales de Microsoft, gratis, requiere internet) -> mejor calidad.
  2. piper (offline). Modelo esperado en models/<voz>/<voz>.onnx (ver README).
Forzar uno:  python3 tools/tts.py ep01-crecer --engine piper
"""
import argparse, asyncio, json, os, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def duration(path):
    out = subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)])
    return float(out.strip())


def to_wav(src, dst):
    # Normaliza a WAV 44.1 kHz mono y acorta pausas internas largas a 0.3 s máx.
    af = 'silenceremove=start_periods=1:start_threshold=-45dB,silenceremove=stop_periods=-1:stop_duration=0.3:stop_threshold=-45dB'
    subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(src), '-af', af, '-ar', '44100', '-ac', '1', str(dst)])


async def edge(text, voice, dst):
    import edge_tts
    proxy = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')
    comm = edge_tts.Communicate(text, voice, rate='+4%', proxy=proxy)
    await comm.save(str(dst))


def piper(text, voice, dst, length_scale):
    model = ROOT / 'models' / voice / f'{voice}.onnx'
    if not model.exists():
        sys.exit(f'Falta el modelo Piper: {model}  (ver README, sección Voz)')
    subprocess.run([sys.executable, '-m', 'piper', '-m', str(model), '-f', str(dst), '--length-scale', str(length_scale)],
                   input=text.encode(), check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('episode')
    ap.add_argument('--engine', choices=['auto', 'edge', 'piper'], default='auto')
    ap.add_argument('--length-scale', type=float, default=0.9, help='piper: >1 más lento, <1 más rápido')
    a = ap.parse_args()

    ep = ROOT / 'episodes' / a.episode
    script = json.loads((ep / 'script.json').read_text())
    build = ep / 'build'
    build.mkdir(exist_ok=True)
    voice = script.get('voice', {})

    engine = a.engine
    if engine == 'auto':
        try:
            asyncio.run(edge('Prueba.', voice.get('edge', 'es-MX-JorgeNeural'), build / '_probe.mp3'))
            engine = 'edge'
        except Exception as e:
            print(f'edge-tts no disponible ({type(e).__name__}); uso piper offline.')
            engine = 'piper'
        (build / '_probe.mp3').unlink(missing_ok=True)
    print('Motor de voz:', engine)

    timing = []
    for i, s in enumerate(script['scenes']):
        dst = build / f'scene_{i:02d}.wav'
        tmp = build / f'_tmp_{i:02d}.{"mp3" if engine == "edge" else "wav"}'
        if engine == 'edge':
            asyncio.run(edge(s['text'], voice.get('edge', 'es-MX-JorgeNeural'), tmp))
        else:
            piper(s['text'], voice.get('piper', 'es-mls_9972-low'), tmp, a.length_scale)
        to_wav(tmp, dst)
        tmp.unlink()
        d = duration(dst)
        timing.append({'id': s['id'], 'file': dst.name, 'duration': round(d, 3)})
        print(f'  {s["id"]:<8} {d:5.2f} s')
    (build / 'timing.json').write_text(json.dumps(timing, indent=1, ensure_ascii=False))
    print('Total narración:', round(sum(t['duration'] for t in timing), 1), 's')


if __name__ == '__main__':
    main()
