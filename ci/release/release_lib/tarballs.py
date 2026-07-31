"""Layered build, npm pack, hashing, and clean-consumer validation."""

from __future__ import annotations

import hashlib
import json
import shutil
import tempfile
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from release_lib.common import ReleaseError, dump_json, executable, load_json, log_step, run
from release_lib.plan import ReleasePlan
from release_lib.workspace import workspace_packages


@dataclass(frozen=True)
class TarballInfo:
    package: str
    layer: int
    path: str
    sha256: str
    distributeable: bool


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def build_selected_packages(repo_root: Path, plan: ReleasePlan) -> None:
    """Build selected packages in P0...Pn runtime order."""
    packages = workspace_packages(repo_root)
    total = sum(len(layer) for layer in plan.layers)
    done = 0
    for layer_index, layer in enumerate(plan.layers):
        log_step(f"[P{layer_index}] building {len(layer)} package(s): {', '.join(layer)}")
        for name in layer:
            done += 1
            workspace = packages[name]
            if not workspace.has_build:
                log_step(f"  ({done}/{total}) {name}: no build script, skipping")
                continue
            log_step(f"  ({done}/{total}) [P{layer_index}] npm run build -w {name} ...")
            started = time.monotonic()
            result = run(
                [executable("npm"), "run", "build", "-w", name],
                cwd=repo_root,
                check=False,
            )
            elapsed = time.monotonic() - started
            if result.returncode != 0:
                raise ReleaseError(
                    f"build failed for P{layer_index} package {name}:\n"
                    + (result.stderr or result.stdout or "")
                )
            log_step(f"  ({done}/{total}) {name}: built in {elapsed:.1f}s")


def pack_layer(
    repo_root: Path,
    plan: ReleasePlan,
    *,
    tarball_root: Path,
) -> list[TarballInfo]:
    """npm pack every selected package into release-tarballs/Pn/."""
    packages = workspace_packages(repo_root)
    distributeable = set(plan.distributeable)
    infos: list[TarballInfo] = []
    tarball_root.mkdir(parents=True, exist_ok=True)

    for layer_index, layer in enumerate(plan.layers):
        layer_dir = tarball_root / f"P{layer_index}"
        layer_dir.mkdir(parents=True, exist_ok=True)
        log_step(f"[P{layer_index}] packing {len(layer)} package(s) into {layer_dir}")
        for name in layer:
            workspace = packages[name]
            package_dir = workspace.path.parent
            result = run(
                [executable("npm"), "pack", "--json"],
                cwd=package_dir,
                check=False,
            )
            if result.returncode != 0:
                raise ReleaseError(
                    f"npm pack failed for {name}:\n"
                    + (result.stderr or result.stdout or "")
                )
            # npm pack --json prints an array; the tarball is also written next to cwd.
            try:
                packed = json.loads(result.stdout[result.stdout.find("[") :])
            except json.JSONDecodeError as exc:
                raise ReleaseError(f"cannot parse npm pack output for {name}: {exc}") from exc
            if not packed or not isinstance(packed, list):
                raise ReleaseError(f"npm pack returned no artefacts for {name}")
            filename = packed[0].get("filename")
            if not isinstance(filename, str):
                raise ReleaseError(f"npm pack missing filename for {name}")
            source = package_dir / filename
            if not source.is_file():
                # Some npm versions write to the repo root.
                alt = repo_root / filename
                if alt.is_file():
                    source = alt
                else:
                    raise ReleaseError(f"packed tarball not found for {name}: {filename}")
            destination = layer_dir / filename
            shutil.move(str(source), str(destination))
            log_step(f"  [P{layer_index}] packed {name} -> {destination.name}")
            infos.append(
                TarballInfo(
                    package=name,
                    layer=layer_index,
                    path=str(destination.relative_to(repo_root)).replace("\\", "/"),
                    sha256=sha256_file(destination),
                    distributeable=name in distributeable,
                )
            )
    dump_json(
        tarball_root / "manifest.json",
        {"product_version": plan.product_version, "tarballs": [asdict(i) for i in infos]},
    )
    return infos


def _tarballs_through_layer(infos: list[TarballInfo], layer: int) -> list[TarballInfo]:
    return [info for info in infos if info.layer <= layer]


def validate_layer_consumer(
    repo_root: Path,
    plan: ReleasePlan,
    infos: list[TarballInfo],
    *,
    through_layer: int,
) -> None:
    """Install P0...Pn tarballs into a clean consumer and ensure no workspace resolution."""
    layer_infos = _tarballs_through_layer(infos, through_layer)
    if not layer_infos:
        return
    distributeable = [info for info in layer_infos if info.distributeable]
    if not distributeable:
        # Bundle-only layers still pack, but have no standalone consumer contract.
        log_step(
            f"[P{through_layer}] no distributeable package through this layer "
            "(bundle-only); skipping clean-consumer install check"
        )
        return

    log_step(
        f"[P{through_layer}] clean-consumer install check: {len(distributeable)} "
        f"distributeable package(s) via file: deps ({', '.join(i.package for i in distributeable)})"
    )
    with tempfile.TemporaryDirectory(prefix="miroir-release-consumer-") as tmp:
        consumer = Path(tmp)
        dump_json(
            consumer / "package.json",
            {
                "name": "miroir-release-consumer",
                "version": "0.0.0",
                "private": True,
                "dependencies": {
                    info.package: f"file:{(repo_root / info.path).resolve().as_posix()}"
                    for info in layer_infos
                },
            },
        )
        result = run(
            [executable("npm"), "install", "--ignore-scripts"],
            cwd=consumer,
            check=False,
        )
        if result.returncode != 0:
            raise ReleaseError(
                f"clean-consumer install failed through P{through_layer}:\n"
                + (result.stderr or result.stdout or "")
            )

        # Ensure installed packages resolve to the packed versions, not registry/`*`.
        for info in distributeable:
            installed = consumer / "node_modules" / info.package / "package.json"
            if not installed.is_file():
                raise ReleaseError(
                    f"clean consumer missing installed package {info.package} "
                    f"(through P{through_layer})"
                )
            data = load_json(installed)
            if data.get("version") != plan.product_version:
                raise ReleaseError(
                    f"consumer installed {info.package}@"
                    f"{data.get('version')}, expected {plan.product_version}"
                )


def build_pack_and_validate(
    repo_root: Path,
    plan: ReleasePlan,
    *,
    tarball_dir: Path | None = None,
) -> list[TarballInfo]:
    out = tarball_dir or (repo_root / "release-tarballs")
    if out.exists():
        shutil.rmtree(out)
    build_selected_packages(repo_root, plan)
    infos = pack_layer(repo_root, plan, tarball_root=out)
    for layer_index in range(len(plan.layers)):
        validate_layer_consumer(repo_root, plan, infos, through_layer=layer_index)
    return infos
