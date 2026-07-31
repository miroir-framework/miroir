"""Product SemVer helpers."""

from __future__ import annotations

import re

from release_lib.common import ReleaseError

SEMVER = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$")


def parse_semver(version: str) -> str:
    if not isinstance(version, str) or not SEMVER.fullmatch(version):
        raise ReleaseError(f"invalid SemVer version: {version!r}")
    return version


def increment(version: str, bump: str) -> str:
    parse_semver(version)
    core, separator, _pre_release = version.partition("-")
    major, minor, patch = (int(part) for part in core.split("."))
    if bump == "major":
        return f"{major + 1}.0.0"
    if bump == "minor":
        return f"{major}.{minor + 1}.0"
    if bump == "patch":
        if separator:
            return core
        return f"{major}.{minor}.{patch + 1}"
    raise ReleaseError(f"unsupported bump: {bump}")
