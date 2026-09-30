"""#345 Slice 5: the Docker entrypoint seeds an empty volume from the image's /seed, which carries the
`docker` environment definition, and gives an older volume the environment definitions it lacks.

The real script runs with MIROIR_SEED_DIR / MIROIR_DATA_DIR pointing at temporary directories and
`true` as the command it hands over to.
"""

from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
ENTRYPOINT = ROOT / "packages" / "miroir-server" / "docker-entrypoint.sh"

pytestmark = pytest.mark.skipif(shutil.which("sh") is None, reason="needs a POSIX shell")


def _write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


@pytest.fixture()
def seed(tmp_path: Path) -> Path:
    seed = tmp_path / "seed"
    shutil.copy(ROOT / "environments" / "docker.json", _mkdir(seed / "environments") / "docker.json")
    _write(seed / "miroir-app-admin" / "assets" / "admin_model" / "m.json", "{}")
    return seed


def _mkdir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def _run(seed: Path, data: Path) -> subprocess.CompletedProcess[str]:
    env = {**os.environ, "MIROIR_SEED_DIR": str(seed), "MIROIR_DATA_DIR": str(data)}
    return subprocess.run(["sh", str(ENTRYPOINT), "true"], env=env, capture_output=True, text=True)


def test_empty_volume_is_seeded_with_the_docker_environment(seed: Path, tmp_path: Path) -> None:
    data = _mkdir(tmp_path / "data")
    result = _run(seed, data)
    assert result.returncode == 0, result.stdout + result.stderr
    assert (data / "environments" / "docker.json").read_text() == (seed / "environments" / "docker.json").read_text()
    assert (data / "miroir-app-admin" / "assets" / "admin_model" / "m.json").exists()


def test_volume_seeded_before_environments_gets_the_definition_and_keeps_its_data(seed: Path, tmp_path: Path) -> None:
    data = _mkdir(tmp_path / "data")
    _write(data / "miroir-app-admin" / "assets" / "admin_data" / "user.json", '{"kept": true}')
    result = _run(seed, data)
    assert result.returncode == 0, result.stdout + result.stderr
    assert (data / "environments" / "docker.json").exists()
    assert (data / "miroir-app-admin" / "assets" / "admin_data" / "user.json").read_text() == '{"kept": true}'
    assert not (data / "miroir-app-admin" / "assets" / "admin_model" / "m.json").exists()


def test_existing_environment_definition_is_left_as_is(seed: Path, tmp_path: Path) -> None:
    data = _mkdir(tmp_path / "data")
    _write(data / "environments" / "docker.json", '{"edited": true}')
    result = _run(seed, data)
    assert result.returncode == 0, result.stdout + result.stderr
    assert (data / "environments" / "docker.json").read_text() == '{"edited": true}'
