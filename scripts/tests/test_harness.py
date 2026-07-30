"""Pytest harness for release_tag_lib (#223 Phase 0)."""

from __future__ import annotations


def test_release_tag_lib_is_importable() -> None:
    import release_tag_lib

    assert release_tag_lib.__doc__
