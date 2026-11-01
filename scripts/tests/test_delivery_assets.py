"""#647 D19: the deliveries ship no devData rows.

The devData section holds measurements of the development process (bundle sizes, page loads, agent
runs), recorded in a checkout. The Electron package and the Docker image copy Miroir's assets, so
both exclude its `miroir_devData/` folder. Building either is too slow for the gate: the test reads
their copy rules.
"""

from __future__ import annotations

import fnmatch
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEV_DATA_FOLDER = "packages/miroir-app-miroir/assets/miroir_devData"


def test_electron_excludes_the_dev_data_rows():
    package = json.loads((REPO_ROOT / "packages/miroir-standalone-app-electron/package.json").read_text())
    copies = [
        resource
        for resource in package["build"]["extraResources"]
        if resource["from"].rstrip("/").endswith("miroir-app-miroir/assets")
    ]
    assert copies, "the Electron package copies Miroir's assets"
    for resource in copies:
        assert "!miroir_devData/**" in resource.get("filter", []), resource


def test_docker_context_excludes_the_dev_data_rows():
    rules = [
        line.strip()
        for line in (REPO_ROOT / ".dockerignore").read_text().splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]
    assert any(fnmatch.fnmatch(DEV_DATA_FOLDER, rule) for rule in rules if not rule.startswith("!")), rules
    assert (REPO_ROOT / DEV_DATA_FOLDER).is_dir(), "the rule matches the folder the rows are in"
