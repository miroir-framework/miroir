#!/usr/bin/env python3
"""Encrypt a plaintext the same way Miroir wraps ``MiroirSecret.ciphertext``.

Matches ``encryptSecret`` in ``packages/miroir-core/src/4_services/SecretsService.ts``:

- wrapping key = SHA-256(UTF-8 ``MIROIR_SECRETS_MASTER_KEY``)
- AES-256-GCM, 12-byte IV, 16-byte tag, no AAD
- output ``aes-256-gcm$<iv>$<ciphertext>$<tag>`` (base64url, no padding)

Usage::

    export MIROIR_SECRETS_MASTER_KEY='<wrapping-key>'
    python scripts/encrypt_miroir_secret.py 'the secret to protect'
    python scripts/encrypt_miroir_secret.py --stdin   # plaintext on stdin (no argv leak)

Needs the ``cryptography`` package::

    pip install cryptography
    # or: uv run --with cryptography python scripts/encrypt_miroir_secret.py '…'
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import os
import secrets
import sys

ALGORITHM = "aes-256-gcm"
GCM_IV_LENGTH = 12
GCM_TAG_LENGTH = 16


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def wrapping_key_bytes(wrapping_key: str) -> bytes:
    return hashlib.sha256(wrapping_key.encode("utf-8")).digest()


def encrypt_secret(wrapping_key: str, plaintext: str) -> str:
    if not wrapping_key:
        raise ValueError("Wrapping key is required")
    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    except ImportError as exc:
        raise SystemExit(
            "This script needs the 'cryptography' package.\n"
            "  pip install cryptography\n"
            "  # or: uv run --with cryptography python scripts/encrypt_miroir_secret.py …"
        ) from exc
    iv = secrets.token_bytes(GCM_IV_LENGTH)
    sealed = AESGCM(wrapping_key_bytes(wrapping_key)).encrypt(
        iv, plaintext.encode("utf-8"), None
    )
    data, tag = sealed[:-GCM_TAG_LENGTH], sealed[-GCM_TAG_LENGTH:]
    return "$".join((ALGORITHM, _b64url(iv), _b64url(data), _b64url(tag)))


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Encrypt a secret with MIROIR_SECRETS_MASTER_KEY using Miroir's "
            "aes-256-gcm wrapping format."
        )
    )
    parser.add_argument(
        "plaintext",
        nargs="?",
        help="Secret to encrypt. Omit when using --stdin.",
    )
    parser.add_argument(
        "--stdin",
        action="store_true",
        help="Read plaintext from stdin instead of the positional argument.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    wrapping_key = os.environ.get("MIROIR_SECRETS_MASTER_KEY", "")
    if not wrapping_key:
        print("Set MIROIR_SECRETS_MASTER_KEY in the environment.", file=sys.stderr)
        return 2
    if args.stdin:
        plaintext = sys.stdin.read()
        if plaintext.endswith("\n"):
            plaintext = plaintext[:-1]
    elif args.plaintext is not None:
        plaintext = args.plaintext
    else:
        print("Pass a plaintext argument, or --stdin.", file=sys.stderr)
        return 2
    print(encrypt_secret(wrapping_key, plaintext))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
