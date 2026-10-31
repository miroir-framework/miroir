"""#633 slice 6 tracer check: the sandbox build serves each shell page without an error boundary.

Serves packages/miroir-sandbox/dist with `vite preview`, opens each page with the repository's `playwright-core`
(resolved from the repository root, as the coverage tour does) and reports, per page, whether the root rendered
and whether an error boundary or a page error showed.

    npm run build -w miroir-sandbox
    npx playwright-core install chromium        # once, unless --browser / MIROIR_TOUR_BROWSER names a Chromium
    python code-helpers/features/633-REFACTOR-app-shell-to-react/sandbox_page_smoke.py [--browser <path>]
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
PORT = 4319
PAGES = ["home", "settings", "search", "runners", "events", "check", "transformerBuilder", "model"]

DRIVER = r"""
const { createRequire } = require('module');
(async () => {
  const [root, base, pages, executablePath] = [process.argv[2], process.argv[3], JSON.parse(process.argv[4]), process.argv[5]];
  // The driver lives in a temporary directory: resolve the browser package from the repository root.
  const { chromium } = createRequire(root + '/package.json')('playwright-core');
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const results = [];
  for (const page of pages) {
    const tab = await browser.newPage();
    const errors = [];
    tab.on('pageerror', (e) => errors.push(String(e.message).slice(0, 200)));
    await tab.goto(`${base}/#/?page=${page}`, { waitUntil: 'networkidle', timeout: 60000 });
    await tab.waitForTimeout(3000);
    const text = await tab.evaluate(() => document.body.innerText);
    const rootChildren = await tab.evaluate(() => document.getElementById('root')?.childElementCount ?? 0);
    const boundary = /Unexpected Application Error|Something went wrong|Fatal startup error/i.test(text);
    results.push({ page, rendered: rootChildren > 0, boundary, errors });
    await tab.close();
  }
  await browser.close();
  console.log(JSON.stringify(results));
})();
"""


def wait_for(url: str, seconds: int = 60) -> None:
    deadline = time.time() + seconds
    while time.time() < deadline:
        try:
            urllib.request.urlopen(url, timeout=2)
            return
        except OSError:
            time.sleep(0.5)
    raise RuntimeError(f"{url} did not answer")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--browser", default=os.environ.get("MIROIR_TOUR_BROWSER", ""), help="Chromium executable")
    browser = parser.parse_args().browser
    preview = subprocess.Popen(
        ["npx", "vite", "preview", "--port", str(PORT), "--strictPort"],
        cwd=ROOT / "packages/miroir-sandbox",
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        base = f"http://localhost:{PORT}"
        wait_for(base)
        with tempfile.TemporaryDirectory() as tmp:
            driver = Path(tmp) / "driver.cjs"
            driver.write_text(DRIVER, encoding="utf-8")
            run = subprocess.run(
                ["node", str(driver), str(ROOT), base, json.dumps(PAGES), browser], capture_output=True, text=True, cwd=ROOT
            )
            if run.returncode != 0:
                # Typically no Chromium for playwright-core: install it or pass --browser.
                print(run.stderr.strip(), file=sys.stderr)
                return 2
            out = run.stdout
        results = json.loads(out.strip().splitlines()[-1])
    finally:
        preview.terminate()
    failed = False
    for r in results:
        ok = r["rendered"] and not r["boundary"] and not r["errors"]
        failed |= not ok
        print(f"{'OK  ' if ok else 'FAIL'} {r['page']:<20} rendered={r['rendered']} boundary={r['boundary']} errors={r['errors']}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
