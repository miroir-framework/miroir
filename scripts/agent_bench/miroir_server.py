"""Starts and stops `miroir-server` on the `bench-agent` environment for the agent cost benchmark (#550)."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
ENVIRONMENT = "bench-agent"
SERVER_ENTRY = REPO_ROOT / "packages" / "miroir-server" / "release" / "index.js"
STATE_DIR = REPO_ROOT / ".miroir" / ENVIRONMENT
READY_LINE = "MCP endpoint"


def mcp_url() -> str:
    environment = json.loads((REPO_ROOT / "environments" / f"{ENVIRONMENT}.json").read_text(encoding="utf-8"))
    return environment["server"]["mcpUrl"].rstrip("/") + "/mcp"


def reset_state() -> None:
    """Every section of `bench-agent` is a copy: removing the state makes the next start copy the assets again."""
    shutil.rmtree(STATE_DIR, ignore_errors=True)


class MiroirServer:
    def __init__(self, log_file: Path, timeout_s: float = 240.0, node_env: str = "development"):
        self.log_file = log_file
        self.timeout_s = timeout_s
        # "production" serves the client built into release/client (#636 release smoke)
        self.node_env = node_env
        self.process: subprocess.Popen | None = None

    def __enter__(self) -> "MiroirServer":
        self.start()
        return self

    def __exit__(self, *exc) -> None:
        self.stop()

    def start(self) -> None:
        if not SERVER_ENTRY.exists():
            raise FileNotFoundError(f"{SERVER_ENTRY} is missing: run `npm run build:server -w miroir-server`")
        env = {**os.environ, "MIROIR_ENV": ENVIRONMENT, "NODE_ENV": self.node_env}
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
        log = self.log_file.open("w", encoding="utf-8")
        self.process = subprocess.Popen(
            ["node", str(SERVER_ENTRY), "--disable-auth"],
            cwd=REPO_ROOT,
            env=env,
            stdout=log,
            stderr=subprocess.STDOUT,
            stdin=subprocess.DEVNULL,
        )
        deadline = time.monotonic() + self.timeout_s
        while time.monotonic() < deadline:
            if self.process.poll() is not None:
                raise RuntimeError(f"miroir-server exited with {self.process.returncode}, see {self.log_file}")
            if READY_LINE in self.log_file.read_text(encoding="utf-8", errors="replace"):
                return
            time.sleep(1)
        self.stop()
        raise TimeoutError(f"miroir-server not ready after {self.timeout_s}s, see {self.log_file}")

    def stop(self) -> None:
        if self.process is None or self.process.poll() is not None:
            return
        self.process.terminate()
        try:
            self.process.wait(timeout=20)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.wait()
