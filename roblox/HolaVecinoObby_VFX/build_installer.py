"""Builds Installer.lua: one snippet for Studio's Command Bar that creates every
VFX script in the open place. Run: python3 build_installer.py"""

from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"

# (class, name, parent expression, source file)
SCRIPTS = [
    ("ModuleScript", "Config", "vfx", "ReplicatedStorage/VFX/Config.lua"),
    ("ModuleScript", "Effects", "vfx", "ReplicatedStorage/VFX/Effects.lua"),
    ("Script", "VFXServer", 'game:GetService("ServerScriptService")', "ServerScriptService/VFXServer.server.lua"),
    (
        "LocalScript",
        "VFXClient",
        'game:GetService("StarterPlayer"):WaitForChild("StarterPlayerScripts")',
        "StarterPlayer/StarterPlayerScripts/VFXClient.client.lua",
    ),
]


def long_string(text: str) -> str:
    level = 1
    while f"]{'=' * level}]" in text:
        level += 1
    eq = "=" * level
    return f"[{eq}[\n{text}]{eq}]"


def main() -> None:
    parts = [
        "-- Hola Vecino obby VFX installer.",
        "-- Paste ALL of this into Studio: View > Command Bar, then press Enter.",
        "-- Re-running it replaces the previous VFX scripts.",
        'local ChangeHistoryService = game:GetService("ChangeHistoryService")',
        'local ReplicatedStorage = game:GetService("ReplicatedStorage")',
        'local vfx = ReplicatedStorage:FindFirstChild("VFX")',
        "if not vfx then",
        '\tvfx = Instance.new("Folder")',
        '\tvfx.Name = "VFX"',
        "\tvfx.Parent = ReplicatedStorage",
        "end",
        "local function install(className, name, parent, source)",
        "\tlocal old = parent:FindFirstChild(name)",
        "\tif old then old:Destroy() end",
        "\tlocal script = Instance.new(className)",
        "\tscript.Name = name",
        "\tscript.Source = source",
        "\tscript.Parent = parent",
        "end",
    ]
    for class_name, name, parent, path in SCRIPTS:
        source = (SRC / path).read_text(encoding="utf-8")
        parts.append(f'install("{class_name}", "{name}", {parent}, {long_string(source)})')
    parts += [
        'ChangeHistoryService:SetWaypoint("Install Hola Vecino VFX")',
        'print("[VFX] Instalado. Dale a Play y revisa el Output.")',
    ]
    (ROOT / "Installer.lua").write_text("\n".join(parts) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
