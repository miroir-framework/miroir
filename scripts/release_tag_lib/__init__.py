"""Product (pre-)release tagging helpers for Miroir (#223)."""

from release_tag_lib.semver_util import is_prerelease, parse_product_version

__all__ = [
    "is_prerelease",
    "parse_product_version",
]
