"""#664: what is checked before a tarball can be published, and the publish itself.

`publish_handoff` is the only code of the repository that runs `npm publish` without `--dry-run`, and only when
called with `execute=True` (`ci/release/publish.py --yes`). A guard in scripts/tests keeps it that way.
"""

from __future__ import annotations

import base64
import hashlib
import json
import tarfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from release_lib.common import ReleaseError, executable, log_step, run

NPMJS = "https://registry.npmjs.org/"
SCOPE = "@miroir-framework/"


def dist_tag(version: str) -> str:
    """#664 D5: a prerelease (any `-`, as docs/contributing/release-process.md defines it) must not become what
    `npm install` gives by default."""
    return "next" if "-" in version else "latest"


def npm(args: list[str], *, cwd: Path | None = None, registry: str | None = None):
    command = [executable("npm"), *args]
    if registry:
        command += ["--registry", registry]
    return run(command, cwd=cwd, check=False)


def tarball_manifest(tarball: Path) -> dict[str, Any]:
    with tarfile.open(tarball, "r:gz") as archive:
        member = archive.extractfile("package/package.json")
        if member is None:
            raise ReleaseError(f"{tarball.name}: no package/package.json")
        return json.loads(member.read().decode("utf-8"))


def tarball_integrity(tarball: Path) -> str:
    """The `dist.integrity` the registry records for this exact file."""
    return "sha512-" + base64.b64encode(hashlib.sha512(tarball.read_bytes()).digest()).decode("ascii")


def manifest_problems(manifest: dict[str, Any], *, version: str, internal: set[str]) -> list[str]:
    """What the registry would refuse, or what would publish something other than the reviewed release. A tarball
    publish does not apply `private` or `publishConfig` from the manifest the way a folder publish does, so they
    are checked here, on the file that goes out."""
    problems: list[str] = []
    name = manifest.get("name", "")
    if manifest.get("private"):
        problems.append("is marked private")
    if not name.startswith(SCOPE):
        problems.append(f"name {name!r} is outside {SCOPE}")
    if manifest.get("version") != version:
        problems.append(f"version {manifest.get('version')!r}, expected {version!r}")
    if manifest.get("publishConfig", {}).get("access") != "public":
        problems.append("publishConfig.access is not public")
    for section in ("dependencies", "peerDependencies", "optionalDependencies"):
        for dependency, value in manifest.get(section, {}).items():
            if dependency in internal and value != version:
                problems.append(f"{section}.{dependency} is {value!r}, expected the exact {version!r}")
    return problems


def check_publishable(tarball: Path, *, version: str, internal: set[str], registry: str | None = None) -> None:
    """#664 D4 check 1: the manifest rules above, then `npm publish --dry-run`, which validates the tarball the
    way a publish reads it, without credentials."""
    manifest = tarball_manifest(tarball)
    problems = manifest_problems(manifest, version=version, internal=internal)
    if problems:
        raise ReleaseError(f"{manifest.get('name', tarball.name)} cannot be published: " + "; ".join(problems))
    result = npm(
        ["publish", str(tarball), "--dry-run", "--access", "public", "--tag", dist_tag(version)],
        cwd=tarball.parent,
        registry=registry,
    )
    if result.returncode != 0:
        raise ReleaseError(
            f"npm publish --dry-run refused {manifest['name']}:\n" + (result.stderr or result.stdout or "")
        )


def published_integrity(name: str, version: str, *, registry: str | None = None) -> str | None:
    """#664 D4 check 2: the registry's integrity for name@version, or None when that version does not exist."""
    result = npm(["view", f"{name}@{version}", "dist.integrity", "--json"], registry=registry)
    text = (result.stdout or "").strip()
    if result.returncode == 0:
        if not text:
            return None  # npm prints nothing for a known package without this version on some versions
        value = json.loads(text)
        return value if isinstance(value, str) else None
    try:
        error = json.loads(text).get("error", {})
    except (json.JSONDecodeError, AttributeError):
        error = {}
    if error.get("code") == "E404":
        return None
    raise ReleaseError(f"cannot ask the registry for {name}@{version}:\n" + (result.stderr or text))


def assert_version_free(name: str, version: str, *, registry: str | None = None) -> None:
    if published_integrity(name, version, registry=registry) is not None:
        raise ReleaseError(f"{name}@{version} is already on the registry; a release needs a new version")


@dataclass(frozen=True)
class PublishEntry:
    layer: int
    package: str
    tarball: str
    tag: str

    def command(self, *, provenance: bool, dry_run: bool, registry: str | None = None) -> list[str]:
        command = ["npm", "publish", self.tarball, "--access", "public", "--tag", self.tag]
        if provenance:
            command.append("--provenance")
        if registry:
            command += ["--registry", registry]
        if dry_run:
            command.append("--dry-run")
        return command
