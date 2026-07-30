"""Phase 3 — build_release_plan refuses runtime cycles (#223 D6)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from release_tag_lib.allowlist import BPLUS_PACKAGE_NAMES
from release_tag_lib.plan import ReleasePlanError, build_release_plan


def _minimal_bplus_workspace(
    root: Path,
    *,
    extra_runtime_cycle: bool = False,
    extra_dev_cycle: bool = False,
) -> None:
    (root / "package.json").write_text(
        json.dumps({"name": "miroir-framework", "version": "0.5.0-rc.1"}, indent=2)
        + "\n",
        encoding="utf-8",
    )
    for name in sorted(BPLUS_PACKAGE_NAMES):
        pkg = root / "packages" / name / "package.json"
        pkg.parent.mkdir(parents=True, exist_ok=True)
        pkg.write_text(
            json.dumps({"name": name, "version": "1.0.0"}, indent=2) + "\n",
            encoding="utf-8",
        )

    if extra_runtime_cycle:
        a = root / "packages" / "cycle-a" / "package.json"
        b = root / "packages" / "cycle-b" / "package.json"
        a.parent.mkdir(parents=True, exist_ok=True)
        b.parent.mkdir(parents=True, exist_ok=True)
        a.write_text(
            json.dumps(
                {"name": "cycle-a", "version": "0.0.0", "dependencies": {"cycle-b": "*"}},
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
        b.write_text(
            json.dumps(
                {"name": "cycle-b", "version": "0.0.0", "dependencies": {"cycle-a": "*"}},
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )

    if extra_dev_cycle:
        a = root / "packages" / "dev-a" / "package.json"
        b = root / "packages" / "dev-b" / "package.json"
        a.parent.mkdir(parents=True, exist_ok=True)
        b.parent.mkdir(parents=True, exist_ok=True)
        a.write_text(
            json.dumps(
                {
                    "name": "dev-a",
                    "version": "0.0.0",
                    "devDependencies": {"dev-b": "*"},
                },
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
        b.write_text(
            json.dumps(
                {
                    "name": "dev-b",
                    "version": "0.0.0",
                    "dependencies": {"dev-a": "*"},
                },
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )


def test_build_release_plan_raises_on_runtime_cycle(tmp_path: Path) -> None:
    _minimal_bplus_workspace(tmp_path, extra_runtime_cycle=True)
    with pytest.raises(ReleasePlanError, match="runtime dependency cycle"):
        build_release_plan(tmp_path, "0.5.0-rc.2")


def test_build_release_plan_allows_dev_only_cycles(tmp_path: Path) -> None:
    _minimal_bplus_workspace(tmp_path, extra_dev_cycle=True)
    plan = build_release_plan(tmp_path, "0.5.0-rc.2")
    assert plan.version == "0.5.0-rc.2"
    assert plan.runtime_cycles == []
