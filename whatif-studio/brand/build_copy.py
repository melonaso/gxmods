#!/usr/bin/env python3
"""Genera brand/VIDEOS.md (todo lo necesario para publicar cada video) a partir de brand/copy.json.
Los capítulos salen de los tiempos reales del render (tools/chapters.py), así que si un episodio
se vuelve a renderizar, basta con correr esto de nuevo:  python3 brand/build_copy.py
"""
import json, os, re, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
from chapters import chapters  # noqa: E402

LIMITS = {'title': 100, 'description': 5000, 'tags': 500, 'hashtags': 15}
SEARCH = 150  # caracteres de la descripción que se ven en la búsqueda: ahí va la idea del video


def slug(title):
    """Nombre de archivo a partir del título (sin acentos, emojis ni #Shorts)."""
    t = unicodedata.normalize('NFKD', title.replace('#Shorts', '')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def upload_files(v):
    """Deja en out/subir/ el video (y la miniatura) con el nombre del título, listos para subir.
    Son enlaces duros: no ocupan espacio extra."""
    out, name, links = ROOT / 'out' / 'subir', slug(v['title']), []
    pairs = [(ROOT / 'out' / f"{v['episode']}.mp4", out / f'{name}.mp4')]
    if not v.get('isShort'):
        pairs.append((ROOT / 'out' / 'brand' / f"thumb-{v['episode'][:4]}.png", out / f'{name}.png'))
    for src, dst in pairs:
        if src.exists():
            out.mkdir(parents=True, exist_ok=True)
            if dst.exists(): dst.unlink()
            os.link(src, dst)
        links.append(dst.name)
    return links


def description(c, v, ch):
    parts = [
        v['hook'], '',
        v.get('factsTitle', 'Las cuentas del video:'), *v['math'], '',
        v['question'], '',
        *(['⏱️ Capítulos', *ch, ''] if ch else []),
        '💡 ¿Tienes un «¿Qué pasaría si…?»? Déjalo en los comentarios: las mejores ideas se vuelven video.',
        f"🔔 Suscríbete: {c['youtube']}",
        # TikTok e Instagram solo cuando existan las cuentas ("social" en copy.json).
        *([f"📲 TikTok e Instagram: {c['social']}"] if c.get('social') else []), '',
        ' '.join(v['hashtags']),
    ]
    return '\n'.join(parts)


def main():
    data = json.loads((ROOT / 'brand' / 'copy.json').read_text())
    c = data['channel']
    out = [
        '# Publicación de los videos',
        '',
        '> Archivo generado con `python3 brand/build_copy.py` a partir de `brand/copy.json`.',
        '> No lo edites a mano: cambia `copy.json` y vuelve a generarlo.',
        '',
        f"Canal: **{c['name']}** · YouTube `{c['youtube']}`" + (f" · TikTok/Instagram `{c['social']}`" if c.get('social') else '') + f" · Lista: «{c['playlist']}».",
        'Miniaturas (1280×720): `out/brand/thumb-ep0N.png` (`node brand/render-brand.mjs thumb ep0N`).',
        '',
        '## Orden para subir cada video (ver `brand/PUBLICACION.md`)',
        '1. Sube el archivo de `out/subir/` (ya tiene el nombre del título) como **Privado**, uno o dos días antes.',
        '2. Pega título, descripción y etiquetas; sube la miniatura (videos largos).',
        '3. Agrega las listas de reproducción **antes** de publicar.',
        '4. Videos largos: revisa que salgan los capítulos de la descripción (desactiva «Capítulos automáticos») y pon la pantalla final indicada. Shorts: pon el «video relacionado» indicado.',
        '5. Publica (o programa) a la hora en que tu audiencia está conectada y quédate la primera hora: fija el comentario y responde.',
        '',
        '## Ajustes al subir (iguales para todos)',
        '- **Categoría:** Educación · **Idioma:** Español (México) · **Licencia:** estándar de YouTube.',
        '- **Audiencia:** «No, no es contenido creado para niños» (es apto para todo público, pero no está dirigido a niños).',
        '- **Contenido alterado o sintético:** No (es animación claramente no realista).',
        f"- **Lista de reproducción:** «{c['playlist']}» (Shorts: «{c.get('shortsPlaylist', c['playlist'])}»).",
        '- **Pantalla final:** el video indicado en cada ficha (continúa el tema, no el más reciente) + «Suscribirse», en los últimos 15 s.',
        '- **Comentario fijado:** publícalo tú apenas salga el video y fíjalo (texto abajo); siempre cierra con una pregunta.',
        '- **Hashtags:** YouTube muestra los 3 primeros sobre el título; con más de 15 los ignora todos.',
        '',
    ]
    nv = ns = 0
    for v in data['videos']:
        if v.get('isShort'): ns += 1
        else: nv += 1
        ch = [] if v.get('isShort') else chapters(v['episode'])  # YouTube no muestra capítulos en Shorts
        desc = description(c, v, ch)
        tags = ', '.join(v['tags'])
        assert len(v['title']) <= LIMITS['title'], v['title']
        assert len(desc) <= LIMITS['description'], v['episode']
        assert len(tags) <= LIMITS['tags'], v['episode']
        assert len(v['hashtags']) <= LIMITS['hashtags'], v['episode']
        assert len(v['hook'].split('\n')[0]) <= SEARCH, f"{v['episode']}: la primera línea pasa de {SEARCH} caracteres"
        assert '?' in v['pinned'], f"{v['episode']}: el comentario fijado debe terminar en pregunta"
        files = upload_files(v)
        byid = {x['episode']: x for x in data['videos']}
        lists = [c['shortsPlaylist'] if v.get('isShort') else c['playlist']] + [c['themePlaylists'][k]['name'] for k in v.get('themes', [])]
        nxt = byid.get(v.get('next'))
        out += [
            '---', '',
            (f"## Short {ns} — `out/{v['episode']}.mp4` (vertical)" if v.get('isShort') else f"## Video {nv} — `out/{v['episode']}.mp4`"), '',
            f"**Título** ({len(v['title'])}/100):", '```', v['title'], '```', '',
            f'**Descripción** ({len(desc)}/5000):', '```', desc, '```', '',
            f'**Etiquetas** ({len(tags)}/500):', '```', tags, '```', '',
            '**Comentario fijado:**', '```', v['pinned'], '```', '',
            '**Antes de publicar:**',
            f"- Archivo{'s' if len(files) > 1 else ''}: " + ', '.join(f'`out/subir/{f}`' for f in files),
            '- Listas: ' + ' · '.join(f'«{x}»' for x in lists),
            *([f"- {'Video relacionado (debajo del Short)' if v.get('isShort') else 'Pantalla final → «Video»'}: «{nxt['title'].replace(' #Shorts', '')}» (súbelo antes si aún no está publicado)"] if nxt else []),
            '',
        ]
        if not c.get('social'):
            pass
        elif 'short' in v:
            out += ['**Texto para TikTok / Reels / Shorts** (si publicas un recorte vertical):', '```',
                    f"{v['short']}\nVideo completo en YouTube: {c['youtube']}\n{' '.join(v['shortTags'])}", '```', '']
        else:
            out += ['**También en TikTok / Reels** (es vertical, se sube tal cual): usa la misma descripción corta y '
                    f"{' '.join(h.lower() for h in v['hashtags'] if h != '#Shorts')} #parati", '']
    (ROOT / 'brand' / 'VIDEOS.md').write_text('\n'.join(out))
    print('VIDEOS.md generado con', len(data['videos']), 'videos')


if __name__ == '__main__':
    main()
