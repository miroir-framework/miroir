"""Product SemVer helpers for release tagging (#223 D4)."""

from __future__ import annotations

import re

# X.Y.Z or X.Y.Z-<prerelease> (no leading "v")
_PRODUCT_VERSION_RE = re.compile(
    r"^(?P<core>0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)"
    r"(?:-(?P<pre>[0-9A-Za-z.-]+))?$"
)


def parse_product_version(s: str) -> str:
    """Validate and return the product version string.

    Raises ValueError if empty, not SemVer-shaped, or prefixed with ``v``.
    """
    if not isinstance(s, str) or not s.strip():
        raise ValueError("version must be a non-empty string")
    text = s.strip()
    if text.startswith("v") or text.startswith("V"):
        raise ValueError(
            f"version must not use a 'v' prefix (got {text!r}); use e.g. '0.5.0-rc.1'"
        )
    if _PRODUCT_VERSION_RE.fullmatch(text) is None:
        raise ValueError(f"invalid product version: {text!r}")
    return text


def is_prerelease(version: str) -> bool:
    """True iff the version contains a SemVer pre-release suffix (a '-')."""
    parsed = parse_product_version(version)
    return "-" in parsed
