#!/usr/bin/env python3
"""Genera brand/VIDEOS.md (todo lo necesario para publicar cada video) a partir de brand/copy.json.
Los capítulos salen de los tiempos reales del render (tools/chapters.py), así que si un episodio
se vuelve a renderizar, basta con correr esto de nuevo:  python3 brand/build_copy.py
"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
from chapters import chapters  # noqa: E402

LIMITS = {'title': 100, 'description': 5000, 'tags': 500, 'hashtags': 15}


def description(c, v, ch):
    parts = [
        v['hook'], '',
        'Las cuentas del video:', *v['math'], '',
        v['question'], '',
        '⏱️ Capítulos', *ch, '',
        f"🔔 Suscríbete: {c['youtube']}",
        f"📲 TikTok e Instagram: {c['social']}", '',
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
        f"Canal: **{c['name']}** · YouTube `{c['youtube']}` · TikTok/Instagram `{c['social']}` · Lista: «{c['playlist']}».",
        'Miniaturas (1280×720): `out/brand/thumb-ep0N.png` (`node brand/render-brand.mjs thumb ep0N`).',
        '',
        '## Ajustes al subir (iguales para todos)',
        '- **Categoría:** Educación · **Idioma:** Español (México) · **Licencia:** estándar de YouTube.',
        '- **Audiencia:** «No, no es contenido creado para niños» (es apto para todo público, pero no está dirigido a niños).',
        '- **Contenido alterado o sintético:** No (es animación claramente no realista).',
        f"- **Lista de reproducción:** «{c['playlist']}».",
        '- **Pantalla final:** «Video siguiente» + «Suscribirse», en los últimos 15 s (la tarjeta de título final deja espacio).',
        '- **Comentario fijado:** publícalo tú apenas subas el video y fíjalo (texto abajo).',
        '- **Hashtags:** YouTube muestra los 3 primeros sobre el título; con más de 15 los ignora todos.',
        '',
    ]
    for n, v in enumerate(data['videos'], 1):
        ch = chapters(v['episode'])
        desc = description(c, v, ch)
        tags = ', '.join(v['tags'])
        assert len(v['title']) <= LIMITS['title'], v['title']
        assert len(desc) <= LIMITS['description'], v['episode']
        assert len(tags) <= LIMITS['tags'], v['episode']
        assert len(v['hashtags']) <= LIMITS['hashtags'], v['episode']
        out += [
            '---', '',
            f"## Video {n} — `out/{v['episode']}.mp4`", '',
            f"**Título** ({len(v['title'])}/100):", '```', v['title'], '```', '',
            f'**Descripción** ({len(desc)}/5000):', '```', desc, '```', '',
            f'**Etiquetas** ({len(tags)}/500):', '```', tags, '```', '',
            '**Comentario fijado:**', '```', v['pinned'], '```', '',
            '**Texto para TikTok / Reels / Shorts** (si publicas un recorte vertical):', '```',
            f"{v['short']}\nVideo completo en YouTube: {c['youtube']}\n{' '.join(v['shortTags'])}", '```', '',
        ]
    (ROOT / 'brand' / 'VIDEOS.md').write_text('\n'.join(out))
    print('VIDEOS.md generado con', len(data['videos']), 'videos')


if __name__ == '__main__':
    main()
