#!/usr/bin/env python3
"""Generate domain_controller_data_crud MiroirTest JSON from library Book assets."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3] / "packages" / "miroir-test-app_deployment-library"
BOOKS_DIR = ROOT / "assets" / "library_data" / "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"

BOOK_UUIDS = {
    "book1": "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
    "book2": "e20e276b-619d-4e16-8816-b7ec37b53439",
    "book3": "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7",
    "book4": "6fefa647-7ecf-4f83-b617-69d7d5094c37",
    "book5": "c97be567-bd70-449f-843e-cd1d64ac1ddd",
    "book6": "c6852e89-3c3c-447f-b827-4b5b9d830975",
}

APP = "5af03c98-fe5e-490b-b08f-e1230971c57f"
DEP = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4"
MIROIR = "360fcf1f-f0d4-4f8a-9262-07886e70fa15"
ENTITY_BOOK = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
ENDPOINT_COMPOSITE = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5"
ENDPOINT_ROLLBACK = "7947ae40-eb34-4149-887b-15a9021e714e"
ENDPOINT_INSTANCE = "ed520de4-55a9-4550-ac50-b1b713b72a89"
ENDPOINT_QUERY = "9e404b3c-368c-40cb-be8b-e3c28550c25e"
BRANCH = "ad1ddc4e-556e-4598-9cff-706a2bde0be7"
INSTANCE_UUID = "c8e2a104-5b6d-4f91-a2c3-9d0e1f2a3b4c"


def load_book(key: str) -> dict:
    return json.loads((BOOKS_DIR / f"{BOOK_UUIDS[key]}.json").read_text(encoding="utf-8"))


def rollback_pair() -> list:
    return [
        {
            "actionType": "rollback",
            "actionLabel": "refreshMiroirLocalCache",
            "endpoint": ENDPOINT_ROLLBACK,
            "payload": {"application": MIROIR},
        },
        {
            "actionType": "rollback",
            "actionLabel": "refreshLibraryLocalCache",
            "endpoint": ENDPOINT_ROLLBACK,
            "payload": {"application": APP},
        },
    ]


def query_books() -> dict:
    return {
        "actionType": "compositeRunBoxedQueryAction",
        "endpoint": ENDPOINT_COMPOSITE,
        "actionLabel": "calculateNewEntityDefinionAndReports",
        "nameGivenToResult": "entityBookList",
        "payload": {
            "actionType": "runBoxedQueryAction",
            "endpoint": ENDPOINT_QUERY,
            "payload": {
                "application": APP,
                "applicationSection": "data",
                "query": {
                    "queryType": "boxedQueryWithExtractorCombinerTransformer",
                    "application": APP,
                    "pageParams": {"currentDeploymentUuid": DEP},
                    "extractors": {
                        "books": {
                            "extractorOrCombinerType": "extractorInstancesByEntity",
                            "applicationSection": "data",
                            "parentName": "Book",
                            "parentUuid": ENTITY_BOOK,
                            "orderBy": {"attributeName": "uuid", "direction": "ASC"},
                        }
                    },
                },
            },
        },
    }


def assertions(count: int, books: list) -> list:
    return [
        {
            "actionType": "compositeRunTestAssertion",
            "actionLabel": "checkNumberOfBooks",
            "nameGivenToResult": "checkNumberOfBooks",
            "testAssertion": {
                "testType": "testAssertion",
                "testLabel": "checkNumberOfBooks",
                "definition": {
                    "resultAccessPath": ["0"],
                    "resultTransformer": {
                        "transformerType": "aggregate",
                        "interpolation": "runtime",
                        "applyTo": {
                            "transformerType": "getFromContext",
                            "interpolation": "runtime",
                            "referencePath": ["entityBookList", "books"],
                        },
                    },
                    "expectedValue": {"aggregate": count},
                },
            },
        },
        {
            "actionType": "compositeRunTestAssertion",
            "actionLabel": "checkEntityBooks",
            "nameGivenToResult": "checkEntityBooks",
            "testAssertion": {
                "testType": "testAssertion",
                "testLabel": "checkEntityBooks",
                "definition": {
                    "resultAccessPath": ["entityBookList", "books"],
                    "ignoreAttributes": ["conceptLevel"],
                    "expectedValue": books,
                },
            },
        },
    ]


def leaf(label: str, sequence: list, count: int, books: list) -> dict:
    return {
        "miroirTestType": "actionTest",
        "miroirTestLabel": label,
        "compositeActionSequence": {
            "actionType": "compositeActionSequence",
            "actionLabel": "AddBookInstanceThenRollback",
            "endpoint": ENDPOINT_COMPOSITE,
            "payload": {"actionSequence": sequence},
        },
        "testCompositeActionAssertions": assertions(count, books),
    }


def main() -> None:
    book1, book2, book3, book4, book5, book6 = [load_book(f"book{i}") for i in range(1, 7)]
    updated_book4 = {
        **book4,
        "name": "Tthe Bride Wore Blackk",
        "author": "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17",
    }

    leaves = [
        leaf(
            "Refresh all Instances",
            rollback_pair() + [query_books()],
            5,
            [book4, book6, book5, book1, book2],
        ),
        leaf(
            "Add Book instance",
            rollback_pair()
            + [
                {
                    "actionType": "createInstance",
                    "actionLabel": "addBook3",
                    "endpoint": ENDPOINT_INSTANCE,
                    "payload": {
                        "application": APP,
                        "applicationSection": "data",
                        "objects": [book3],
                    },
                },
                query_books(),
            ],
            6,
            [book3, book4, book6, book5, book1, book2],
        ),
        leaf(
            "Add Book instance then rollback",
            rollback_pair()
            + [
                {
                    "actionType": "createInstance",
                    "actionLabel": "addBook3",
                    "endpoint": ENDPOINT_INSTANCE,
                    "payload": {
                        "application": APP,
                        "applicationSection": "data",
                        "objects": [book3],
                    },
                },
                query_books(),
            ],
            6,
            [book3, book4, book6, book5, book1, book2],
        ),
        leaf(
            "Remove Book instance",
            rollback_pair()
            + [
                {
                    "actionType": "deleteInstance",
                    "actionLabel": "deleteBook2",
                    "endpoint": ENDPOINT_INSTANCE,
                    "payload": {
                        "application": APP,
                        "applicationSection": "data",
                        "objects": [book2],
                    },
                },
                query_books(),
            ],
            4,
            [book4, book6, book5, book1],
        ),
        leaf(
            "Remove Book instance then rollback",
            rollback_pair()
            + [
                {
                    "actionType": "deleteInstance",
                    "actionLabel": "addBook3",
                    "endpoint": ENDPOINT_INSTANCE,
                    "payload": {
                        "application": APP,
                        "applicationSection": "data",
                        "objects": [book2],
                    },
                },
                {
                    "actionType": "rollback",
                    "actionLabel": "refreshLibraryLocalCache",
                    "endpoint": ENDPOINT_ROLLBACK,
                    "payload": {"application": APP},
                },
                query_books(),
            ],
            4,
            [book4, book6, book5, book1],
        ),
        leaf(
            "Update Book instance",
            rollback_pair()
            + [
                {
                    "actionType": "updateInstance",
                    "actionLabel": "updateBook2",
                    "endpoint": ENDPOINT_INSTANCE,
                    "payload": {
                        "application": APP,
                        "applicationSection": "data",
                        "objects": [updated_book4],
                    },
                },
                query_books(),
            ],
            5,
            [updated_book4, book6, book5, book1, book2],
        ),
    ]

    instance = {
        "uuid": INSTANCE_UUID,
        "parentName": "MiroirTest",
        "parentUuid": "a311f363-e238-4203-bdfc-29e8c160c26b",
        "selfApplication": APP,
        "branch": BRANCH,
        "name": "domain_controller_data_crud",
        "description": "DomainController Data CRUD action integration tests (Feature 197 Phase 2)",
        "definition": {
            "miroirTestType": "miroirTestSuite",
            "miroirTestLabel": "domainController.data.crud",
            "runTarget": {
                "applicationUuid": APP,
                "applicationName": "Library",
                "deploymentUuid": DEP,
            },
            "miroirTests": leaves,
        },
    }

    out = (
        ROOT
        / "assets"
        / "library_model"
        / "a311f363-e238-4203-bdfc-29e8c160c26b"
        / f"{INSTANCE_UUID}.json"
    )
    out.write_text(json.dumps(instance, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {out} ({len(leaves)} leaves)")


if __name__ == "__main__":
    main()
