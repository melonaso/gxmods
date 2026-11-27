"""Prepara el material real (Wikimedia Commons, licencias libres) de la muestra:

1. Recorta cada clip de video (sin su audio: la música que suena de fondo en esas grabaciones tiene dueño) a
   assets/clips/<nombre>.mp4 y lo pasa a cuadros JPG en build/clips/<nombre>/ para que el motor los dibuje uno por uno.
2. Recorta cada canción a assets/music/<escena>.ogg (lo usa audio.py).
3. Escribe build/clips/index.json con los cuadros de cada clip y los créditos que salen en pantalla.

Uso: python3 episodes/hc00-muestra/prep_media.py [carpeta_con_descargas]
Sin carpeta, rehace los cuadros a partir de assets/ (lo que ya está guardado en el repositorio).
"""
import json, subprocess, sys
from pathlib import Path

EP = Path(__file__).resolve().parent
FPS = 30

# nombre: (archivo descargado, inicio s, duración s, crédito en pantalla)
CLIPS = {
    'gabber': ('clip_gabber.webm', 2.0, 12.0, 'VIDEO: CHRISTIAN GLAAB · CC BY 3.0'),
    'te2007': ('clip_te2007_talla.ogv', 2.0, 12.0, 'VIDEO: GZEN92 · CC BY-SA 4.0'),
    'rave': ('clip_ravetheplanet.webm', 0.5, 12.0, 'VIDEO: ROY ZUO · CC BY-SA 4.0'),
}
# escena: (archivo que manda el dueño, segundo del drop en la canción, crédito en pantalla). Canciones comerciales:
# se usan solo extractos cortos; antes de publicar, ver brand/ o CREDITOS.md (Content ID puede reclamarlas).
SONGS = {
    'gabber': ('gabber.mp3', 94.0, 'RODOX TRADING — NOBODY DIED'),
    'hardstyle': ('hardstyle.mp3', 113.0, 'NOISECONTROLLERS — ATTACK AGAIN'),
    'uptempo': ('uptempo.mp3', 135.0, 'TRESPASSED — NO JOKE'),
}
PRE, POST = 8.0, 10.0   # segundos antes y después del drop que se guardan


def run(*a):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *a], check=True)


def main(src):
    (EP / 'assets' / 'clips').mkdir(parents=True, exist_ok=True)
    (EP / 'assets' / 'music').mkdir(parents=True, exist_ok=True)
    out = EP / 'build' / 'clips'; out.mkdir(parents=True, exist_ok=True)
    index = {'clips': {}, 'credits': {'clips': {}, 'songs': {}}}
    for name, (f, t0, dur, credit) in CLIPS.items():
        mp4 = EP / 'assets' / 'clips' / f'{name}.mp4'
        if src and (src / f).exists():
            run('-ss', str(t0), '-t', str(dur), '-i', str(src / f), '-an', '-vf', f'scale=1280:-2,fps={FPS}', '-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-pix_fmt', 'yuv420p', str(mp4))
        if not mp4.exists():
            print('falta el clip', name); continue
        d = out / name; d.mkdir(exist_ok=True)
        for old in d.glob('f_*.jpg'): old.unlink()
        run('-i', str(mp4), '-q:v', '3', str(d / 'f_%04d.jpg'))
        n = len(list(d.glob('f_*.jpg')))
        index['clips'][name] = {'fps': FPS, 'n': n}; index['credits']['clips'][name] = credit
        print(f'clip {name}: {n} cuadros')
    index['drops'] = {}
    for scene, (f, drop, credit) in SONGS.items():
        # Canciones comerciales: el extracto se queda en build/ (no se sube al repositorio).
        ogg = EP / 'build' / 'music' / f'{scene}.ogg'; ogg.parent.mkdir(parents=True, exist_ok=True)
        if src and (src / f).exists():
            run('-ss', str(max(0.0, drop - PRE)), '-t', str(PRE + POST), '-i', str(src / f), '-ac', '2', '-ar', '48000', '-c:a', 'libvorbis', '-q:a', '6', str(ogg))
        if ogg.exists():
            index['credits']['songs'][scene] = credit; index['drops'][scene] = min(PRE, drop); print('canción', scene, 'lista')
        else:
            print('falta la canción', scene)
    (out / 'index.json').write_text(json.dumps(index, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else None)
