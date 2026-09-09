"""Clone Library deployment config entries into Spotify (fd47d115-…) across Miroir JSON configs."""
from __future__ import annotations

import json
from pathlib import Path

LIBRARY = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4"
SPOTIFY = "fd47d115-67e2-4870-8339-1c26665d1d15"
REPLACEMENTS = (
    ("library", "spotify"),
    ("Library", "Spotify"),
)

ROOT = Path(__file__).resolve().parents[3]


def rewrite_value(value):
    if isinstance(value, dict):
        return {k: rewrite_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [rewrite_value(v) for v in value]
    if isinstance(value, str):
        out = value
        for old, new in REPLACEMENTS:
            out = out.replace(old, new)
        return out
    return value


def add_spotify(config: dict) -> bool:
    changed = False
    for container_key in ("deploymentStorageConfig", "storeSectionConfiguration"):
        containers = []
        client = config.get("client")
        if isinstance(client, dict) and isinstance(client.get(container_key), dict):
            containers.append(client[container_key])
        server = client.get("serverConfig") if isinstance(client, dict) else None
        if isinstance(server, dict) and isinstance(server.get(container_key), dict):
            containers.append(server[container_key])
        for container in containers:
            if LIBRARY not in container or SPOTIFY in container:
                continue
            container[SPOTIFY] = rewrite_value(container[LIBRARY])
            changed = True
    return changed


def main() -> None:
    updated = []
    for path in ROOT.rglob("*.json"):
        if "node_modules" in path.parts or "dist" in path.parts:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        if LIBRARY not in text:
            continue
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            continue
        if not isinstance(data, dict):
            continue
        if add_spotify(data):
            path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
            updated.append(str(path.relative_to(ROOT)))
    print(f"updated {len(updated)} configs:")
    for name in updated:
        print(f"  {name}")


if __name__ == "__main__":
    main()
