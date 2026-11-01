"""#650: the rename of the published packages to @miroir-framework/* on a fixture tree: every reference context is
renamed, every kept kind stays, a second run changes nothing, and --check reports what is left."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import rename_packages as rp

SCRIPTS = Path(__file__).resolve().parents[1]

BEFORE = {
    "packages/miroir-cli/package.json": json.dumps(
        {
            "name": "miroir-cli",
            "bin": {"miroir-cli": "./dist/index.js"},
            "dependencies": {"miroir-core": "0.5.0", "miroir-app-miroir": "0.5.0"},
            "peerDependencies": {"miroir-react": "0.5.0"},
            "scripts": {"build": "npm run build -w miroir-core && tsup", "release": "ncc build x.js -e miroir-core -e pg"},
            "nx": {"implicitDependencies": ["!miroir-core"]},
        },
        indent=2,
    ),
    "package.json": '{\n  "scripts": {\n    "miroir-env": "node packages/miroir-env/dist/cli.js",\n'
    '    "test:core": "npm run test -w miroir-core"\n  }\n}\n',
    "packages/miroir-cli/src/index.ts": (
        'import { a } from "miroir-core";\n'
        "import type { B } from 'miroir-core';\n"
        'export { c } from "miroir-react";\n'
        'const d = await import("miroir-store-postgres");\n'
        'const e = require("miroir-env");\n'
        'vi.mock("miroir-core/model-validation-fs");\n'
        'const loggerName = MiroirLoggerFactory.getLoggerName("miroir-cli", "info", "x");\n'
        "export const packageName = \"miroir-core\";\n"
        "program.name('miroir-cli');\n"
        'const instances = Symbol.for("miroir-core.instances");\n'
        "// built by miroir-core, see packages/miroir-core/src/index.ts\n"
        'log("[miroir-cli] warning");\n'
        'warn("Install a single miroir-core (npm ls miroir-core).");\n'
        'const unrelated = "miroir-app-miroir";\n'
        'const done = "@miroir-framework/core";\n'
        'const ref = { module: "miroir-core/tools", export: "x" };\n'
    ),
    "packages/miroir-standalone-app/vite.config.js": (
        "export default {\n"
        '  resolve: { alias: { "miroir-core": path.resolve(root, "src/index.ts") } },\n'
        '  optimizeDeps: { exclude: ["miroir-store-postgres", "mongodb"] },\n'
        "};\n"
        'const NODE_STORE_PACKAGES = ["miroir-store-mongodb", "miroir-store-postgres"];\n'
        'export const external = ["miroir-core", "miroir-mcp/client"];\n'
    ),
    "scripts/nonreg-manifest.json": (
        '{"steps": [{"id": "unit-miroir-core", "argv": [\n  "npm",\n  "run",\n  "test",\n  "-w",\n'
        '  "miroir-core"\n]}]}\n'
    ),
    "build.sh": "npm run build -w miroir-core --workspace=miroir-react\nnpm run miroir-env -- show\nmiroir-env prune\n",
    "docs/guide.md": (
        "Install `miroir-core` and miroir-react; run `npm run test -w miroir-core`.\n"
        "The miroir-env command (`miroir-env check`) reads packages/miroir-core/src/x.ts.\n"
        "See miroir-core/src/index.ts.\n"
    ),
    "scripts/tool.py": 'CMD = ["npm", "run", "x", "-w", "miroir-core"]\n',
    "packages/miroir-app-miroir/assets/data/test.json": '{"functionRef": {"module": "miroir-core/tools"}}\n',
    "code-helpers/features/1-old/analysis.md": "Uses miroir-core.\n",
}

AFTER = {
    "packages/miroir-cli/package.json": json.dumps(
        {
            "name": "@miroir-framework/cli",
            "bin": {"miroir-cli": "./dist/index.js"},
            "dependencies": {"@miroir-framework/core": "0.5.0", "miroir-app-miroir": "0.5.0"},
            "peerDependencies": {"@miroir-framework/react": "0.5.0"},
            "scripts": {
                "build": "npm run build -w @miroir-framework/core && tsup",
                "release": "ncc build x.js -e @miroir-framework/core -e pg",
            },
            "nx": {"implicitDependencies": ["!@miroir-framework/core"]},
        },
        indent=2,
    ),
    "package.json": '{\n  "scripts": {\n    "miroir-env": "node packages/miroir-env/dist/cli.js",\n'
    '    "test:core": "npm run test -w @miroir-framework/core"\n  }\n}\n',
    "packages/miroir-cli/src/index.ts": (
        'import { a } from "@miroir-framework/core";\n'
        "import type { B } from '@miroir-framework/core';\n"
        'export { c } from "@miroir-framework/react";\n'
        'const d = await import("@miroir-framework/store-postgres");\n'
        'const e = require("@miroir-framework/env");\n'
        'vi.mock("@miroir-framework/core/model-validation-fs");\n'
        'const loggerName = MiroirLoggerFactory.getLoggerName("miroir-cli", "info", "x");\n'
        "export const packageName = \"miroir-core\";\n"
        "program.name('miroir-cli');\n"
        'const instances = Symbol.for("miroir-core.instances");\n'
        "// built by miroir-core, see packages/miroir-core/src/index.ts\n"
        'log("[miroir-cli] warning");\n'
        'warn("Install a single miroir-core (npm ls @miroir-framework/core).");\n'
        'const unrelated = "miroir-app-miroir";\n'
        'const done = "@miroir-framework/core";\n'
        'const ref = { module: "miroir-core/tools", export: "x" };\n'
    ),
    "packages/miroir-standalone-app/vite.config.js": (
        "export default {\n"
        '  resolve: { alias: { "@miroir-framework/core": path.resolve(root, "src/index.ts") } },\n'
        '  optimizeDeps: { exclude: ["@miroir-framework/store-postgres", "mongodb"] },\n'
        "};\n"
        'const NODE_STORE_PACKAGES = ["@miroir-framework/store-mongodb", "@miroir-framework/store-postgres"];\n'
        'export const external = ["@miroir-framework/core", "@miroir-framework/mcp/client"];\n'
    ),
    "scripts/nonreg-manifest.json": (
        '{"steps": [{"id": "unit-miroir-core", "argv": [\n  "npm",\n  "run",\n  "test",\n  "-w",\n'
        '  "@miroir-framework/core"\n]}]}\n'
    ),
    "build.sh": (
        "npm run build -w @miroir-framework/core --workspace=@miroir-framework/react\n"
        "npm run miroir-env -- show\nmiroir-env prune\n"
    ),
    "docs/guide.md": (
        "Install `@miroir-framework/core` and @miroir-framework/react; run `npm run test -w @miroir-framework/core`.\n"
        "The miroir-env command (`miroir-env check`) reads packages/miroir-core/src/x.ts.\n"
        "See miroir-core/src/index.ts.\n"
    ),
    "scripts/tool.py": 'CMD = ["npm", "run", "x", "-w", "@miroir-framework/core"]\n',
    "packages/miroir-app-miroir/assets/data/test.json": '{"functionRef": {"module": "miroir-core/tools"}}\n',
    "code-helpers/features/1-old/analysis.md": "Uses miroir-core.\n",
}


def make_tree(root: Path, files: dict[str, str]) -> None:
    for name, text in files.items():
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
    (root / "scripts").mkdir(exist_ok=True)
    for data in ("package-rename-map.json", "package-rename-allow.json"):
        shutil.copy(SCRIPTS / data, root / "scripts" / data)


def tree(root: Path, files: dict[str, str]) -> dict[str, str]:
    return {name: (root / name).read_text(encoding="utf-8") for name in files}


def test_apply_renames_every_reference_context_and_keeps_the_rest(tmp_path):
    make_tree(tmp_path, BEFORE)
    assert rp.main(["--apply", "--root", str(tmp_path)]) == 0
    after = tree(tmp_path, BEFORE)
    for name, expected in AFTER.items():
        assert after[name] == expected, name


def test_a_second_apply_changes_nothing(tmp_path):
    make_tree(tmp_path, BEFORE)
    rp.main(["--apply", "--root", str(tmp_path)])
    once = tree(tmp_path, BEFORE)
    rp.main(["--apply", "--root", str(tmp_path)])
    assert tree(tmp_path, BEFORE) == once


def test_check_reports_old_references_until_applied(tmp_path, capsys):
    make_tree(tmp_path, BEFORE)
    assert rp.main(["--check", "--root", str(tmp_path)]) == 1
    output = capsys.readouterr().out
    assert "packages/miroir-cli/src/index.ts:1: miroir-core" in output
    assert "scripts/nonreg-manifest.json:6: miroir-core" in output
    assert "code-helpers" not in output
    rp.main(["--apply", "--root", str(tmp_path)])
    capsys.readouterr()
    assert rp.main(["--check", "--root", str(tmp_path)]) == 0
    (tmp_path / "packages/miroir-cli/src/late.ts").write_text('import { x } from "miroir-mcp";\n', encoding="utf-8")
    assert rp.main(["--check", "--root", str(tmp_path)]) == 1
    assert "late.ts:1: miroir-mcp" in capsys.readouterr().out


def test_the_map_names_the_published_set():
    published = json.loads((SCRIPTS / "published-packages.json").read_text(encoding="utf-8"))
    mapping = rp.load_map()
    renamed_folders = {f"packages/{old}" for old in mapping}
    by_folder = {entry["folder"]: entry["publishedName"] for entry in published}
    assert {by_folder[folder] for folder in renamed_folders} == set(mapping.values())
    assert {old: by_folder[f"packages/{old}"] for old in mapping} == mapping


# ---------------------------------------------------------------------- Slice 2: name-independent scripts and guards

ROOT = SCRIPTS.parent


def test_build_scripts_select_workspaces_by_folder():
    """A folder name is not a workspace selector once names are scoped: -w takes the folder path."""
    for script in ("build-all.sh", "ci/lib/common.sh"):
        text = (ROOT / script).read_text(encoding="utf-8")
        assert 'npm run build -w "$pkg"' not in text, script
        assert 'npm run build -w "packages/$pkg"' in text, script


def test_session_setup_builds_by_folder(tmp_path):
    from agent_session_setup import BUILD_GROUPS, Environment, plan_steps

    (tmp_path / "node_modules").mkdir()
    environment = Environment(has_pytest=True, has_graphify=False, linux_x64=False)
    commands = [step.command for step in plan_steps(tmp_path, environment)]
    first = BUILD_GROUPS[0][0]
    assert any(f"-w packages/{first}" in command for command in commands), commands


def test_package_guards_still_catch_the_scoped_names():
    import importlib

    startup = importlib.import_module("test_startup_calls_boundaries")
    library = importlib.import_module("test_server_library_boundaries")
    shell = importlib.import_module("test_shell_package_boundaries")
    public_api = importlib.import_module("test_core_public_api")
    assert startup.STORE.match("@miroir-framework/store-postgres") and startup.STORE.match("miroir-store-postgres")
    for specifier in ("@miroir-framework/store-filesystem", "@miroir-framework/env", "miroir-store-mongodb"):
        assert library.FORBIDDEN.match(specifier), specifier
    assert shell.SELF_IMPORT.search('import { x } from "@miroir-framework/react";')
    assert public_api.named_imports('import { A } from "@miroir-framework/core";\n') == ({"A"}, [])
    tsup = (ROOT / "packages/miroir-server-library/tsup.config.js").read_text(encoding="utf-8")
    assert "/^(@miroir-framework\\/store-|miroir-store-)/" in tsup
    assert "/^(@miroir-framework\\/env|miroir-env)($|\\/)/" in tsup
