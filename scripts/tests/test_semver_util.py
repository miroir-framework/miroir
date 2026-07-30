"""Phase 1 — product SemVer parse / pre-release classify (#223)."""

from __future__ import annotations

import pytest

from release_tag_lib.semver_util import is_prerelease, parse_product_version


def test_accepts_rc_prerelease_version() -> None:
    assert parse_product_version("0.5.0-rc.2") == "0.5.0-rc.2"


def test_accepts_release_version() -> None:
    assert parse_product_version("0.5.0") == "0.5.0"


@pytest.mark.parametrize(
    "bad",
    ["", "   ", "0.5", "rc.1", "not-a-version", "0.5.0.1"],
)
def test_rejects_empty_or_garbage(bad: str) -> None:
    with pytest.raises(ValueError):
        parse_product_version(bad)


@pytest.mark.parametrize("bad", ["v0.5.0", "v0.5.0-rc.1", "V0.5.0"])
def test_rejects_leading_v_prefix(bad: str) -> None:
    with pytest.raises(ValueError, match="v' prefix"):
        parse_product_version(bad)


def test_is_prerelease_true_when_hyphen_present() -> None:
    assert is_prerelease("0.5.0-rc.1") is True


def test_is_prerelease_false_for_plain_release() -> None:
    assert is_prerelease("0.5.0") is False
