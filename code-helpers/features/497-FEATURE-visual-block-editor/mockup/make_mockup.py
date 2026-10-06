#!/usr/bin/env python3
"""Build the #497 block editor mockup from real miroir-app-miroir assets.

Reads two composite TransformerDefinitions, the createEntity Runner, the Endpoints and the
TransformerDefinition list, writes data.json and inlines it into template.html to give
block-editor-mockup.html. The mockup is a static reference page, not part of any build.

Run from the repository root: python code-helpers/features/497-FEATURE-visual-block-editor/mockup/make_mockup.py
"""
from __future__ import annotations

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
DATA = ROOT / "packages/miroir-app-miroir/assets/miroir_data"
TRANSFORMER_DEFINITIONS = DATA / "a557419d-a288-4fb8-8a1e-971c86c113b8"
ENDPOINTS = DATA / "3d8da4d4-8f76-4bb4-9212-14869d81c00c"
RUNNERS = DATA / "e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd"


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def parameter_names(definition: dict) -> list[str]:
    schema = definition["transformerInterface"]["transformerParameterSchema"]
    return list(schema["transformerDefinition"]["definition"].keys())


def define_example(example_id: str, uuid: str) -> dict:
    definition = load(TRANSFORMER_DEFINITIONS / f"{uuid}.json")
    return {
        "id": example_id,
        "kind": "define",
        "title": definition["name"],
        "source": f"miroir-app-miroir · TransformerDefinition {uuid[:8]}",
        "classification": definition.get("classification"),
        "params": parameter_names(definition),
        "value": definition["transformerImplementation"]["definition"],
        "description": definition.get("description"),
    }


def runner_example(example_id: str, uuid: str) -> dict:
    runner = load(RUNNERS / f"{uuid}.json")
    form = runner["definition"]["formMLSchema"]
    return {
        "id": example_id,
        "kind": "runner",
        "title": runner["defaultLabel"],
        "name": runner["name"],
        "source": f"miroir-app-miroir · Runner {uuid[:8]}",
        "formFields": list(form["mlSchema"]["definition"].keys()),
        "initialFormValues": form.get("initialFormValues"),
        "value": runner["definition"]["compositeActionSequence"],
    }


def main() -> None:
    endpoints: dict[str, str] = {}
    action_endpoint: dict[str, str] = {}
    for path in sorted(ENDPOINTS.glob("*.json")):
        endpoint = load(path)
        endpoints[endpoint["uuid"]] = endpoint["name"]
        for action in endpoint["definition"].get("actions", []):
            action_endpoint[action["actionParameters"]["actionType"].get("definition")] = endpoint["name"]
    definitions = [
        {
            "name": d["name"],
            "classification": d.get("classification"),
            "impl": d["transformerImplementation"]["transformerImplementationType"],
        }
        for d in (load(p) for p in sorted(TRANSFORMER_DEFINITIONS.glob("*.json")))
    ]
    data = {
        "endpoints": endpoints,
        "actionEndpoint": action_endpoint,
        "definitions": definitions,
        "examples": [
            define_example("spreadsheet", "e44300e8-ed02-40fb-a9ee-d83d08cb1f25"),
            define_example("extract", "1bbed895-7d5a-4541-97bd-4d5cf22b128c"),
            runner_example("runner", "82f81a25-2366-4abf-8a97-83ca5e9a9c46"),
        ],
    }
    serialized = json.dumps(data)
    (HERE / "data.json").write_text(serialized, encoding="utf-8")
    template = (HERE / "template.html").read_text(encoding="utf-8")
    page = template.replace("__DATA__", serialized.replace("</", "<\\/"))
    (HERE / "block-editor-mockup.html").write_text(page, encoding="utf-8")
    print(f"wrote {HERE / 'block-editor-mockup.html'} ({len(page)} bytes)")


if __name__ == "__main__":
    main()
