#!/usr/bin/env python3
"""Mezcla final de un episodio: video + voz (si hay) + música + efectos de sonido.
Uso: python3 tools/mix.py <episodio>   (lo llama tools/build.sh)

- Voz: cada escena tiene su archivo (build/timing.json) y se coloca en el inicio real de su escena
  (build/starts.json). La música baja sola cuando hay voz (compresión sidechain: la voz controla el
  volumen de la música).
- Volumen final en dos pasadas de loudnorm (primero se mide, luego se corrige con esos datos), para
  llegar al nivel exacto: -14 LUFS en Shorts, -16 en videos largos (LUFS = volumen percibido).
"""
import json, os, re, subprocess, sys

ep = sys.argv[1]
b = f'episodes/{ep}/build'
script = json.load(open(f'episodes/{ep}/script.json'))
st = json.load(open(f'{b}/starts.json'))
dur = st['duration']
short = script.get('type') == '2d'
voice = 'voice' in script or script.get('narration', True)
target = -14 if short else -16

inputs, filt, n = ['-i', f'out/{ep}-video.mp4'], [], 1
if voice:
    tm = json.load(open(f'{b}/timing.json'))
    labels = []
    for s, t in zip(st['starts'], tm):
        inputs += ['-i', f'{b}/{t["file"]}']
        ms = int(round(s['start'] * 1000))
        filt.append(f'[{n}:a]aresample=48000,adelay={ms}|{ms},apad[v{n}]')
        labels.append(f'[v{n}]'); n += 1
    filt.append(f'{"".join(labels)}amix=inputs={len(labels)}:normalize=0:duration=longest,atrim=0:{dur},asplit[voz][key]')
inputs += ['-i', f'{b}/music.wav']
filt.append(f'[{n}:a]aresample=48000,volume={0.45 if voice else 0.7}[mus]'); n += 1
mix = ['[voz]', '[duck]'] if voice else ['[mus]']
if voice:
    filt.append('[mus][key]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=300[duck]')
if os.path.exists(f'{b}/sfx.wav'):
    inputs += ['-i', f'{b}/sfx.wav']
    filt.append(f'[{n}:a]aresample=48000,volume={0.55 if voice else 1.0}[fx]'); n += 1
    mix.append('[fx]')
graph = ';'.join(filt + [f'{"".join(mix)}amix=inputs={len(mix)}:normalize=0:duration=first,atrim=0:{dur}[pre]'])

# Pasada 1: medir.
r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', *inputs, '-filter_complex',
                    graph + f';[pre]loudnorm=I={target}:TP=-1.5:LRA=11:print_format=json[aout]',
                    '-map', '[aout]', '-f', 'null', '-'], capture_output=True, text=True, check=True)
m = json.loads(re.findall(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr)[-1])
# Pasada 2: corregir con lo medido (lineal: sube o baja todo por igual, sin "bombear").
ln = (f'loudnorm=I={target}:TP=-1.5:LRA=11:measured_I={m["input_i"]}:measured_TP={m["input_tp"]}:'
      f'measured_LRA={m["input_lra"]}:measured_thresh={m["input_thresh"]}:offset={m["target_offset"]}:linear=true')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', graph + f';[pre]{ln},aresample=48000[aout]',
                '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
                '-shortest', f'out/{ep}.mp4'], check=True)
print(f'Mezcla: {"voz + " if voice else ""}música{" + efectos" if "[fx]" in mix else ""} → {target} LUFS')
