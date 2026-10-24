"""Acceptance adapter of the Miroir arms (#550): runs the scenarios through Miroir's MCP tools on a fresh server.

The server reads the run's store (`.miroir/bench-agent/`) when it starts, so edits made through MCP and edits made
to the deployment files are both seen.
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from agent_bench import miroir_server
from agent_bench.acceptance import scenarios
from agent_bench.acceptance.mcp_client import McpClient, result_json

LIBRARY = "5af03c98-fe5e-490b-b08f-e1230971c57f"
QUERY_ENTITY = "e4320b9e-ab45-4abe-85d8-359604b3c62f"
REPORT_ENTITY = "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916"
LOAN_ENTITY = "e81078f3-2de7-4301-bd79-d3a156aec149"
MIROIR_TEST_ENTITY = "a311f363-e238-4203-bdfc-29e8c160c26b"
LIBRARY_STORE = miroir_server.STATE_DIR / "library"
BASELINE_MODEL = miroir_server.REPO_ROOT / "packages" / "miroir-example-library" / "assets" / "library_model"


def materialize_store(log_file: Path) -> None:
    """A fresh copy of every section, as the agent starts from."""
    miroir_server.reset_state()
    with miroir_server.MiroirServer(log_file):
        pass


LIBRARY_SECTIONS = ("model", "data")


def store_from_workspace(library: Path, baseline: Path, target: Path) -> None:
    """`target` becomes the baseline store with its model and data replaced by the workspace's `library/` folders.

    The baseline's sections are never copied: removing then recreating a folder fails on the shared FUSE folder.
    """
    shutil.copytree(baseline, target, ignore=lambda folder, names: [n for n in names if Path(folder) == baseline and n in LIBRARY_SECTIONS])
    for section in LIBRARY_SECTIONS:
        shutil.copytree(library / section, target / section)


def apply_files(source: Path, target: Path = LIBRARY_STORE) -> list[Path]:
    """Copies `source/{model,data}/<entity>/<uuid>.json` into the store; returns the files written."""
    written = []
    for file in sorted(source.rglob("*.json")):
        destination = target / file.relative_to(source)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(file, destination)
        written.append(destination)
    return written


class MiroirAdapter:
    def __init__(self, client: McpClient):
        self.client = client

    def instances(self, entity: str, section: str) -> list[dict]:
        answer = result_json(
            self.client.call("Miroir_getInstances", {"application": LIBRARY, "applicationSection": section, "parentUuid": entity})
        )
        return _instance_list(answer)

    def model_element(self, entity: str, name: str) -> dict | None:
        return next((item for item in self.instances(entity, "model") if item.get("name") == name), None)

    def run_query(self, name: str, params: dict) -> dict:
        query = self.model_element(QUERY_ENTITY, name)
        if query is None:
            raise LookupError(f"no Query named {name}")
        return self.run_definition(query["definition"], params)

    def run_definition(self, definition: dict, params: dict) -> dict:
        """Runs the extractors, combiners and transformers of a Query or Report definition with `params`.

        The parameters go in `queryParams` and in `pageParams`: a Report gets its parameters from the page.
        """
        templates = "extractorTemplates" in definition or "combinerTemplates" in definition
        parts = ("extractorTemplates", "combinerTemplates") if templates else ("extractors", "combiners")
        boxed = {
            "application": LIBRARY,
            "queryType": "boxedQueryTemplateWithExtractorCombinerTransformer" if templates else "boxedQueryWithExtractorCombinerTransformer",
            "pageParams": dict(params),
            "queryParams": dict(params),
            "contextResults": {},
            **{part: definition[part] for part in (*parts, "runtimeTransformers") if part in definition},
        }
        tool = "Miroir_runBoxedQueryTemplateAction" if templates else "Miroir_runBoxedQueryAction"
        result = self.client.call(tool, {"application": LIBRARY, "applicationSection": "data", "query": boxed})
        answer = result_json(result)
        if result.get("isError") or (isinstance(answer, dict) and answer.get("status") == "error"):
            raise RuntimeError(f"query failed: {str(answer)[:2000]}")
        return answer

    def overdue(self, started_before: str) -> set[str]:
        answer = self.run_query("OverdueLoans", {"startedBefore": started_before})
        return {loan["uuid"] for loan in _instance_list(_entry(answer, "overdueLoans"))}

    def report_exists(self, name: str) -> bool:
        return self.model_element(REPORT_ENTITY, name) is not None

    def report_loan_sets(self, name: str, params: dict) -> list[set[str]]:
        """The loans of each entry of the Report's data, run with `params`: its own query parts, then its stored Queries."""
        report = self.model_element(REPORT_ENTITY, name)
        if report is None:
            raise LookupError(f"no Report named {name}")
        definition = report.get("definition", {})
        answers = []
        if any(part in definition for part in ("extractorTemplates", "extractors", "runtimeTransformers")):
            answers.append(self.run_definition(definition, params))
        queries = {query["uuid"]: query for query in self.instances(QUERY_ENTITY, "model")}
        for stored in definition.get("runStoredQueries") or []:
            query = queries.get(stored.get("storedQuery"))
            if query is not None:
                answers.append(self.run_definition(query["definition"], params))
        sets = []
        for answer in answers:
            entries = answer.get("result", answer) if isinstance(answer, dict) else {}
            for value in (entries.values() if isinstance(entries, dict) else []):
                sets.append(_loan_uuids(value))
        return sets

    def new_tests_naming(self, needle: str) -> list[str]:
        """Names of the MiroirTests added to the Library or changed, that name `needle` in any case."""
        baseline = baseline_instances(MIROIR_TEST_ENTITY)
        return [
            test.get("name", test.get("uuid"))
            for test in self.instances(MIROIR_TEST_ENTITY, "model")
            if baseline.get(test.get("uuid")) != test and needle.lower() in json.dumps(test).lower()
        ]

    def view_shows_overdue(self, started_before: str) -> tuple[bool, str]:
        expected = scenarios.overdue_loans(started_before)
        sets = self.report_loan_sets("OverdueLoansPerUser", {"startedBefore": started_before})
        return expected in sets, f"loan counts per data entry of the Report: {[len(found) for found in sets]}, {len(expected)} expected"

    def lend(self, user: str, book: str, start_date: str) -> bool:
        """True when the loan was accepted."""
        result = self.client.call("Library_lendDocument", {"user": user, "book": book, "startDate": start_date})
        answer = result_json(result)
        return not result.get("isError") and not (isinstance(answer, dict) and answer.get("status") == "error")

    def loans_of(self, user: str) -> list[dict]:
        return [loan for loan in self.instances(LOAN_ENTITY, "data") if loan.get("user") == user]


def baseline_instances(entity: str) -> dict[str, dict]:
    """The Library's own model instances of `entity` by uuid, as the agent found them."""
    return {path.stem: json.loads(path.read_text(encoding="utf-8")) for path in (BASELINE_MODEL / entity).glob("*.json")}


def _loan_uuids(value) -> set[str]:
    """The uuids of the LendingHistoryItem instances anywhere in `value` (a list, or a grouping of lists)."""
    if isinstance(value, dict):
        if value.get("parentUuid") == LOAN_ENTITY and "uuid" in value:
            return {value["uuid"]}
        return set().union(*(_loan_uuids(item) for item in value.values())) if value else set()
    if isinstance(value, list):
        return set().union(*(_loan_uuids(item) for item in value)) if value else set()
    return set()


def _entry(answer, name: str):
    """Finds the `name` entry in a query answer, whatever envelope the tool wraps it in."""
    if isinstance(answer, dict):
        if name in answer:
            return answer[name]
        for value in answer.values():
            found = _entry(value, name)
            if found is not None:
                return found
    return None


def _instance_list(value) -> list[dict]:
    """The instances of a query entry; a transformer failure in its place raises, with its message (#559)."""
    if isinstance(value, dict) and "queryFailure" in value:
        raise RuntimeError(f"the entry is a failure: {json.dumps(value)[-1000:]}")
    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]
    if isinstance(value, dict):
        for key in ("result", "instances", "returnedDomainElement", "payload"):
            if key in value:
                return _instance_list(value[key])
        if all(isinstance(item, dict) and "uuid" in item for item in value.values()) and value:
            return list(value.values())
    return []
