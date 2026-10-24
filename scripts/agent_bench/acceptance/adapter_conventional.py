"""Acceptance adapter of the conventional arm (#550): runs the scenarios over HTTP against the run's Next.js app.

The app is copied out of the workspace, its database rebuilt from its own migrations and seed (`npm run db:reset`),
built with `next build` and served with `next start` on a free port.
"""

from __future__ import annotations

import json
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

from agent_bench.acceptance import scenarios

REPO_ROOT = Path(__file__).resolve().parents[3]
BASELINE_APP = REPO_ROOT / "benchmarks" / "conventional-library"
COPY_IGNORED = (".next", "node_modules", "*.tsbuildinfo", "dev.db", "dev.db-journal")
TEST_SUFFIXES = (".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx")


def copy_app(source: Path, target: Path) -> None:
    """Copies the app; `node_modules` is hard-linked (same filesystem), not copied (about 900 MB).

    The copy gets the Library data in `prisma/library-data/` when it has none: outside the repository the seed
    finds no other.
    """
    shutil.copytree(source, target, ignore=shutil.ignore_patterns(*COPY_IGNORED), symlinks=True)
    if (source / "node_modules").exists():
        subprocess.run(["cp", "-al", str(source / "node_modules"), str(target / "node_modules")], check=True)
    if not (target / "prisma" / "library-data").exists():
        shutil.copytree(scenarios.LIBRARY_DATA, target / "prisma" / "library-data")


def apply_overlay(source: Path, target: Path) -> list[Path]:
    """Copies every file of `source` over `target`, keeping relative paths."""
    written = []
    for file in sorted(path for path in source.rglob("*") if path.is_file()):
        destination = target / file.relative_to(source)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(file, destination)
        written.append(destination)
    return written


def test_files(app: Path) -> dict[str, str]:
    """Test file contents by path relative to the app, outside `node_modules`."""
    return {
        str(path.relative_to(app)): path.read_text(encoding="utf-8", errors="replace")
        for path in app.rglob("*")
        if path.is_file() and path.name.endswith(TEST_SUFFIXES) and "node_modules" not in path.parts
    }


def free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


class ConventionalApp:
    """Context manager: builds and serves a copy of the app; `build_log` says why a build failed.

    The copy goes in a temporary folder next to the baseline's `node_modules` (hard links need the same
    filesystem); only the log goes in `scratch`.
    """

    def __init__(self, workspace: Path, scratch: Path, timeout_s: float = 600.0):
        self.workspace = workspace
        self.app = Path(tempfile.mkdtemp(prefix="agent-bench-acceptance-app-", dir="/tmp")) / "app"
        self.log = scratch / "app.log"
        self.timeout_s = timeout_s
        self.process: subprocess.Popen | None = None
        self.port = free_port()
        self.built = False
        self.build_detail = ""

    def __enter__(self) -> "ConventionalApp":
        shutil.rmtree(self.app, ignore_errors=True)
        copy_app(self.workspace, self.app)
        with self.log.open("w", encoding="utf-8") as log:
            for step in (["npm", "run", "db:reset"], ["npx", "next", "build"]):
                done = subprocess.run(step, cwd=self.app, stdout=log, stderr=subprocess.STDOUT, check=False, timeout=self.timeout_s)
                if done.returncode != 0:
                    self.build_detail = f"`{' '.join(step)}` exited with {done.returncode}, see {self.log}"
                    return self
        self.built = True
        self.build_detail = "db:reset and next build passed"
        log = self.log.open("a", encoding="utf-8")
        self.process = subprocess.Popen(
            ["npx", "next", "start", "-p", str(self.port)], cwd=self.app, stdout=log, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL
        )
        deadline = time.monotonic() + 120
        while time.monotonic() < deadline:
            try:
                self.get("/api/loans")
                return self
            except (urllib.error.URLError, ConnectionError):
                time.sleep(1)
        raise TimeoutError(f"next start not answering on port {self.port}, see {self.log}")

    def __exit__(self, *exc) -> None:
        if self.process is not None and self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=20)
            except subprocess.TimeoutExpired:
                self.process.kill()
        shutil.rmtree(self.app.parent, ignore_errors=True)

    def request(self, method: str, path: str, body: dict | None = None) -> tuple[int, str]:
        data = json.dumps(body).encode() if body is not None else None
        request = urllib.request.Request(
            f"http://127.0.0.1:{self.port}{path}", data=data, method=method, headers={"content-type": "application/json"}
        )
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        try:
            with opener.open(request, timeout=60) as response:
                return response.status, response.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as error:
            return error.code, error.read().decode("utf-8", errors="replace")

    def get(self, path: str):
        status, text = self.request("GET", path)
        if status != 200:
            raise RuntimeError(f"GET {path} answered {status}: {text[:500]}")
        return json.loads(text)


class ConventionalAdapter:
    def __init__(self, app: ConventionalApp):
        self.app = app

    def model_check(self) -> tuple[bool, str]:
        return self.app.built, self.app.build_detail

    def overdue(self, started_before: str) -> set[str]:
        return {loan["uuid"] for loan in self.app.get(f"/api/loans/overdue?startedBefore={started_before}")}

    def view_shows_overdue(self, started_before: str) -> tuple[bool, str]:
        status, html = self.app.request("GET", f"/loans/overdue?startedBefore={started_before}")
        names = scenarios.user_names()
        holders = {loan.user for loan in scenarios.loans() if loan.uuid in scenarios.overdue_loans(started_before)}
        missing = [names[user] for user in holders if names[user] not in html]
        return status == 200 and not missing, f"status {status}, Users with overdue loans not shown: {missing}"

    def new_tests_naming(self, needle: str) -> list[str]:
        baseline = test_files(BASELINE_APP)
        return [
            path
            for path, text in test_files(self.app.workspace).items()
            if baseline.get(path) != text and needle.lower() in text.lower()
        ]

    def loans_of(self, user: str) -> list[dict]:
        return [loan for loan in self.app.get("/api/loans") if loan.get("user") == user]

    def lend(self, user: str, book: str, start_date: str) -> bool:
        status, text = self.app.request("POST", "/api/loans", {"user": user, "book": book, "startDate": start_date})
        if status not in (201, 409):
            raise RuntimeError(f"POST /api/loans answered {status}: {text[:500]}")
        return status == 201
