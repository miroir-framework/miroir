"""#504 (analysis #497, D10): compositeRunTestAssertion becomes a DomainEndpoint action.

Rewrites every `compositeRunTestAssertion` of the package assets from
`{actionType, actionLabel, nameGivenToResult, testAssertion}` to
`{actionType, endpoint, actionLabel, nameGivenToResult, payload}`: the assertion moves to
`payload` and `endpoint` names the DomainEndpoint. Key order is kept otherwise; files are written
back with `json.dumps(indent=2, ensure_ascii=False)`, which round-trips all of them.

Usage (from the repository root):
    python3 code-helpers/features/497-FEATURE-visual-block-editor/scripts/migrate_504_test_assertion.py
    python3 code-helpers/features/497-FEATURE-visual-block-editor/scripts/migrate_504_test_assertion.py --check
"""
import glob
import json
import sys

DOMAIN_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5"


def migrated(action: dict) -> dict:
    result = {}
    for key, value in action.items():
        if key == "testAssertion":
            result["payload"] = value
            continue
        result[key] = value
        if key == "actionType":
            result["endpoint"] = DOMAIN_ENDPOINT
    return result


def walk(value, counter):
    if isinstance(value, dict):
        if value.get("actionType") == "compositeRunTestAssertion" and "testAssertion" in value:
            counter[0] += 1
            value = migrated(value)
        return {key: walk(entry, counter) for key, entry in value.items()}
    if isinstance(value, list):
        return [walk(entry, counter) for entry in value]
    return value


def main() -> int:
    check = "--check" in sys.argv
    total, files = 0, 0
    for path in sorted(glob.glob("packages/*/assets/**/*.json", recursive=True)):
        with open(path, encoding="utf-8") as f:
            text = f.read()
        if "compositeRunTestAssertion" not in text:
            continue
        counter = [0]
        value = walk(json.loads(text), counter)
        if counter[0] == 0:
            continue
        total += counter[0]
        files += 1
        if check:
            print(f"not migrated: {path} ({counter[0]})")
            continue
        with open(path, "w", encoding="utf-8") as f:
            f.write(json.dumps(value, indent=2, ensure_ascii=False) + ("\n" if text.endswith("\n") else ""))
    print(f"{total} assertions in {files} files {'to migrate' if check else 'migrated'}")
    return 1 if check and total else 0


if __name__ == "__main__":
    sys.exit(main())
