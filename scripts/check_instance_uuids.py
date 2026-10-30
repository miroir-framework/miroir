#!/usr/bin/env python3
"""Fail when two instances of one Entity, in one deployment folder, share a uuid (#509).

Stores keyed by uuid (Postgres, IndexedDb, MongoDB, the local cache) keep only one of two instances
that share a uuid, so the other one silently disappears from the deployed application.

Scope: tracked files packages/**/<folder>/<file>.json whose <folder> name is a uuid (the Entity uuid,
in the model, data or modelVersion store of a deployment). Each folder is checked on its own, on the
`uuid` attribute. A folder is skipped when its Entity declares an `idAttribute` other than "uuid"
(composite or natural key, or none); the Entity definition of the folder's own package wins over one
found in another package. Files that are not a JSON object with a string `uuid` are ignored; a file
that is not valid JSON fails the check.

Run: python scripts/check_instance_uuids.py [--repo R]   (npm run check:uuids)
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path, PurePosixPath

UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
ENTITY_ENTITY_UUID = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad"


def tracked_instance_files(repo: Path) -> list[PurePosixPath]:
    output = subprocess.run(
        ["git", "ls-files", "-z", "--", ":(glob)packages/**/*.json"],
        cwd=repo,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    ).stdout
    paths = (PurePosixPath(path) for path in output.split("\0") if path)
    return [path for path in paths if UUID_RE.match(path.parent.name)]


def _package(path: PurePosixPath) -> str:
    return path.parts[1]


def _uuid_is_primary_key(entity: dict) -> bool:
    return entity.get("idAttribute", "uuid") == "uuid"


def find_duplicates(
    repo: Path,
) -> tuple[dict[PurePosixPath, dict[str, list[PurePosixPath]]], list[PurePosixPath]]:
    """Map each folder holding a duplicate to {uuid: files carrying it}; also list unreadable files."""
    files_by_folder: dict[PurePosixPath, list[tuple[PurePosixPath, dict]]] = defaultdict(list)
    unreadable: list[PurePosixPath] = []
    for path in tracked_instance_files(repo):
        if not (repo / path).is_file():
            continue  # deleted in the working tree
        try:
            content = json.loads((repo / path).read_text(encoding="utf-8-sig"))
        except ValueError:
            unreadable.append(path)
            continue
        if isinstance(content, dict):
            files_by_folder[path.parent].append((path, content))

    entities: dict[tuple[str, str], dict] = {}
    for folder, files in files_by_folder.items():
        if folder.name == ENTITY_ENTITY_UUID:
            for path, entity in files:
                entities[(_package(path), path.stem)] = entity
    entities_anywhere = {entity_uuid: entity for (_, entity_uuid), entity in entities.items()}

    duplicates: dict[PurePosixPath, dict[str, list[PurePosixPath]]] = {}
    for folder, files in files_by_folder.items():
        entity = entities.get((_package(folder), folder.name)) or entities_anywhere.get(folder.name, {})
        if not _uuid_is_primary_key(entity):
            continue
        by_uuid: dict[str, list[PurePosixPath]] = defaultdict(list)
        for path, instance in files:
            if isinstance(instance.get("uuid"), str):
                by_uuid[instance["uuid"]].append(path)
        shared = {uuid: sorted(paths) for uuid, paths in by_uuid.items() if len(paths) > 1}
        if shared:
            duplicates[folder] = shared
    return duplicates, sorted(unreadable)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args(argv)

    duplicates, unreadable = find_duplicates(args.repo)
    if not duplicates and not unreadable:
        print("instance-uuid guard: no duplicate instance uuid")
        return 0
    if unreadable:
        print("instance-uuid guard: files that are not valid JSON:")
        for path in unreadable:
            print(f"  {path}")
    if not duplicates:
        return 1
    print("instance-uuid guard: instances of one Entity share a uuid; a uuid-keyed store keeps only one of them:")
    for folder in sorted(duplicates):
        print(f"  {folder}")
        for uuid, paths in sorted(duplicates[folder].items()):
            print(f"    {uuid}")
            for path in paths:
                print(f"      {path}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
