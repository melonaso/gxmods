"""Genera la tabla de traducción del juego (src/localization/GameStrings.csv,
que Rojo convierte en LocalizationService.GameStrings).

Recoge todos los textos visibles:
  - llamadas T("...") / Locale.t("...") / Locale.mark("...") del código Luau
  - Title, Description y Badge de Config.luau (objetos, skins, pases)
  - nombres de los mapas (src/world/Maps)
  - textos del mundo (atributo LocaleSource y ProximityPrompts en src/world/*.json)

El idioma de origen es el español (columna Source). Las traducciones de
tools/translations/<idioma>.json se añaden como columnas; el resto de idiomas
los traduce Roblox automáticamente al subir esta tabla (ver README).

Uso: python3 tools/extract_strings.py
"""

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "localization" / "GameStrings.csv"
TRANSLATIONS = ROOT / "tools" / "translations"

CALL = re.compile(r'\b(?:T|Locale\.t|Locale\.mark|mark)\(\s*"((?:[^"\\]|\\.)*)"')
CONFIG_FIELD = re.compile(r'\b(Title|Description|Badge)\s*=\s*"((?:[^"\\]|\\.)*)"')


def unescape(text):
    return text.encode("utf-8").decode("unicode_escape").encode("latin-1").decode("utf-8")


def strip_comment(line):
    """Quita el comentario `--` de una línea de Luau (fuera de cadenas)."""
    quote = None
    i = 0
    while i < len(line):
        ch = line[i]
        if quote:
            if ch == "\\":
                i += 1
            elif ch == quote:
                quote = None
        elif ch in "\"'`":
            quote = ch
        elif line.startswith("--", i):
            return line[:i]
        i += 1
    return line


def collect():
    found = {}

    def add(text, where):
        if text and text.strip():
            found.setdefault(text, where)

    for path in sorted((ROOT / "src").rglob("*.luau")):
        source = "\n".join(strip_comment(line) for line in path.read_text(encoding="utf-8").splitlines())
        rel = path.relative_to(ROOT).as_posix()
        for m in CALL.finditer(source):
            add(unescape(m.group(1)), rel)
        if path.name == "Config.luau":
            for m in CONFIG_FIELD.finditer(source):
                add(unescape(m.group(2)), rel)
    for path in sorted((ROOT / "src" / "world" / "Maps").glob("*.model.json")):
        add(path.name[: -len(".model.json")], "map")

    def walk(node, rel):
        attrs = node.get("attributes") or {}
        if isinstance(attrs.get("LocaleSource"), str):
            add(attrs["LocaleSource"], rel)
        if node.get("className") == "ProximityPrompt":
            for prop in ("ActionText", "ObjectText"):
                add(node.get("properties", {}).get(prop, ""), rel)
        for child in node.get("children", []):
            walk(child, rel)

    for path in sorted((ROOT / "src" / "world").glob("*.model.json")):
        walk(json.loads(path.read_text(encoding="utf-8")), path.relative_to(ROOT).as_posix())
    return found


def main():
    found = collect()
    languages = {}
    for path in sorted(TRANSLATIONS.glob("*.json")):
        languages[path.stem] = json.loads(path.read_text(encoding="utf-8"))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Key", "Source", "Context", "Example", *languages])
        for text, where in sorted(found.items(), key=lambda kv: kv[0].lower()):
            row = [text, text, "", where]
            row += [languages[lang].get(text, "") for lang in languages]
            writer.writerow(row)
    missing = {lang: [t for t in found if t not in table] for lang, table in languages.items()}
    print(f"{len(found)} textos -> {OUT.relative_to(ROOT)}")
    for lang, items in missing.items():
        if items:
            print(f"  {lang}: faltan {len(items)}")
            for t in items:
                print("    ", json.dumps(t, ensure_ascii=False))


if __name__ == "__main__":
    main()
