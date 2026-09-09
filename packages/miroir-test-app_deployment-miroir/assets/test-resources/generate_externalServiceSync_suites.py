"""Generate Slice 6 MiroirTest suite JSON from committed OpenAPI excerpt assets."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MIROIR_TEST_DIR = ROOT.parent / "miroir_data" / "a311f363-e238-4203-bdfc-29e8c160c26b"

ENDPOINT_UUID = "0e5cb172-12ea-4467-8598-5889338ae454"
ENTITY_UUID = "56166585-b6fd-42c6-95d3-32a80c3304f7"
LIBRARY_APP = "5af03c98-fe5e-490b-b08f-e1230971c57f"
LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4"
ENTITY_ENTITY = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad"
ENDPOINT_ENTITY = "3d8da4d4-8f76-4bb4-9212-14869d81c00c"
COMPOSITE_EP = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5"
INSTANCE_EP = "ed520de4-55a9-4550-ac50-b1b713b72a89"
MODEL_EP = "7947ae40-eb34-4149-887b-15a9021e714e"
QUERY_EP = "9e404b3c-368c-40cb-be8b-e3c28550c25e"
MIROIR_APP = "360fcf1f-f0d4-4f8a-9262-07886e70fa15"


def load(name: str):
    return json.loads((ROOT / name).read_text(encoding="utf-8"))


def find_in_context(reference_path: list[str], attribute: str, value: str) -> dict:
    return {
        "transformerType": "find",
        "interpolation": "runtime",
        "referenceToOuterObject": "__element__",
        "applyTo": {
            "transformerType": "getFromContext",
            "interpolation": "runtime",
            "referencePath": reference_path,
        },
        "predicate": {
            "transformerType": "boolExpr",
            "interpolation": "runtime",
            "operator": "==",
            "left": {
                "transformerType": "getFromContext",
                "interpolation": "runtime",
                "referencePath": ["__element__", attribute],
            },
            "right": {
                "transformerType": "returnValue",
                "interpolation": "runtime",
                "value": value,
            },
        },
    }


def transformer_leaf(label: str, params: dict, *, sub_expected=None, expected=None, retain=None):
    leaf = {
        "miroirTestType": "transformerTest",
        "miroirTestLabel": label,
        "transformerName": "syncExternalServiceSchema",
        "runTestStep": "runtime",
        "transformer": {
            "transformerType": "syncExternalServiceSchema",
            "interpolation": "runtime",
        },
        "transformerParams": params,
    }
    if sub_expected is not None:
        leaf["subExpectedValue"] = sub_expected
    if expected is not None:
        leaf["expectedValue"] = expected
    if retain is not None:
        leaf["retainAttributes"] = retain
    return leaf


def main() -> None:
    excerpt = load("spotifyOpenApiExcerpt.get-playlist.json")
    endpoint = load("spotifyServiceEndpoint.sync-input.json")
    one_of = load("openapiOneOfError.excerpt.json")
    any_of = load("openapiAnyOfError.excerpt.json")

    happy_params = {
        "openApiDocument": excerpt,
        "appModel": {"endpoints": [endpoint]},
        "scope": ["get-playlist", "change-playlist-details"],
        "entityUuid": ENTITY_UUID,
        "entityVersionUuid": "1a34fdf2-67c8-411d-9be4-a9265089ac51",
        "entityName": "SpotifyPlaylist",
        "endpointUuid": ENDPOINT_UUID,
    }

    unit_suite = {
        "uuid": "f4e5dde0-3dba-493b-a208-04494dbbb2f5",
        "parentName": "MiroirTest",
        "parentUuid": "a311f363-e238-4203-bdfc-29e8c160c26b",
        "name": "externalServiceSync",
        "selfApplication": MIROIR_APP,
        "branch": "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
        "description": "Slice 6 unit transformerTest for syncExternalServiceSchema. openApiDocument is the committed Spotify get-playlist excerpt (assets/test-resources/spotifyOpenApiExcerpt.get-playlist.json), passed as transformerParams.",
        "definition": {
            "miroirTestType": "miroirTestSuite",
            "miroirTestLabel": "externalServiceSync",
            "miroirTests": [
                transformer_leaf(
                    "sync get-playlist produces compositeActionSequence with operation and SpotifyPlaylist entity",
                    happy_params,
                    sub_expected=[
                        ["actionType", "compositeActionSequence"],
                        ["payload.actionSequence.0.actionType", "updateInstance"],
                        [
                            "payload.actionSequence.0.payload.objects.0.definition.externalService.operations.0",
                            {
                                "operationId": "get-playlist",
                                "method": "GET",
                                "path": "/playlists/{playlist_id}",
                                "parameterMappings": [
                                    {"name": "playlist_id", "in": "path", "required": True},
                                    {"name": "fields", "in": "query"},
                                ],
                                "responseSchema": {
                                    "type": "object",
                                    "definition": {
                                        "id": {"type": "string"},
                                        "name": {"type": "string"},
                                        "owner": {
                                            "type": "object",
                                            "definition": {
                                                "id": {"type": "string"},
                                                "display_name": {"type": "string", "nullable": True},
                                            },
                                        },
                                        "images": {
                                            "type": "array",
                                            "definition": {
                                                "type": "object",
                                                "definition": {
                                                    "url": {"type": "string"},
                                                    "height": {"type": "number", "nullable": True},
                                                    "width": {"type": "number", "nullable": True},
                                                },
                                            },
                                        },
                                        "tracks": {
                                            "type": "object",
                                            "definition": {
                                                "total": {"type": "number"},
                                                "items": {
                                                    "type": "array",
                                                    "definition": {
                                                        "type": "object",
                                                        "definition": {
                                                            "track": {
                                                                "type": "object",
                                                                "definition": {
                                                                    "id": {"type": "string"},
                                                                    "name": {"type": "string"},
                                                                    "artists": {
                                                                        "type": "array",
                                                                        "definition": {
                                                                            "type": "object",
                                                                            "definition": {
                                                                                "id": {"type": "string"},
                                                                                "name": {"type": "string"},
                                                                            },
                                                                        },
                                                                    },
                                                                    "duration_ms": {"type": "number"},
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        ],
                        ["payload.actionSequence.1.actionType", "createEntity"],
                        ["payload.actionSequence.1.payload.entities.0.uuid", ENTITY_UUID],
                        ["payload.actionSequence.1.payload.entities.0.name", "SpotifyPlaylist"],
                        ["payload.actionSequence.1.payload.entities.0.idAttribute", "id"],
                        [
                            "payload.actionSequence.1.payload.entities.0.externalDataSource",
                            {"kind": "http", "endpoint": ENDPOINT_UUID},
                        ],
                        [
                            "payload.actionSequence.1.payload.entities.0.mlSchema.definition.name",
                            {"type": "string"},
                        ],
                        [
                            "payload.actionSequence.1.payload.entities.0.mlSchema.definition.images.definition.definition.height",
                            {"type": "number", "nullable": True},
                        ],
                        [
                            "payload.actionSequence.1.payload.entities.0.mlSchema.definition.owner.definition.display_name",
                            {"type": "string", "nullable": True},
                        ],
                    ],
                ),
                transformer_leaf(
                    "oneOf outside the bounded subset is a clear transformer error",
                    {
                        "openApiDocument": one_of,
                        "appModel": {"endpoints": [endpoint]},
                        "scope": ["get-thing"],
                    },
                    sub_expected=[
                        ["queryFailure", "FailedTransformer"],
                        [
                            "innerError.failureMessage",
                            "syncExternalServiceSchema: oneOf is outside the bounded OpenAPI subset and cannot be converted",
                        ],
                    ],
                ),
                transformer_leaf(
                    "anyOf outside the bounded subset is a clear transformer error",
                    {
                        "openApiDocument": any_of,
                        "appModel": {"endpoints": [endpoint]},
                        "scope": ["get-thing"],
                    },
                    sub_expected=[
                        ["queryFailure", "FailedTransformer"],
                        [
                            "innerError.failureMessage",
                            "syncExternalServiceSchema: anyOf is outside the bounded OpenAPI subset and cannot be converted",
                        ],
                    ],
                ),
            ],
        },
    }

    happy_subs = unit_suite["definition"]["miroirTests"][0]["subExpectedValue"]
    get_playlist_op = happy_subs[2][1]
    happy_subs.append(
        [
            "payload.actionSequence.0.payload.objects.0.definition.externalService.operations",
            [get_playlist_op],
        ]
    )

    (MIROIR_TEST_DIR / "f4e5dde0-3dba-493b-a208-04494dbbb2f5.json").write_text(
        json.dumps(unit_suite, indent=2) + "\n",
        encoding="utf-8",
    )

    created_entity = {
        "uuid": ENTITY_UUID,
        "parentName": "Entity",
        "parentUuid": ENTITY_ENTITY,
        "parentDefinitionVersionUuid": "381ab1be-337f-4198-b1d3-f686867fc1dd",
        "selfApplication": LIBRARY_APP,
        "name": "SpotifyPlaylist",
        "conceptLevel": "Model",
        "description": "External HTTP entity for get-playlist",
        "idAttribute": "id",
        "externalDataSource": {"kind": "http", "endpoint": ENDPOINT_UUID},
        "mlSchema": {
            "type": "object",
            "definition": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "owner": {
                    "type": "object",
                    "definition": {
                        "id": {"type": "string"},
                        "display_name": {"type": "string", "nullable": True},
                    },
                },
                "images": {
                    "type": "array",
                    "definition": {
                        "type": "object",
                        "definition": {
                            "url": {"type": "string"},
                            "height": {"type": "number", "nullable": True},
                            "width": {"type": "number", "nullable": True},
                        },
                    },
                },
                "tracks": {
                    "type": "object",
                    "definition": {
                        "total": {"type": "number"},
                        "items": {
                            "type": "array",
                            "definition": {
                                "type": "object",
                                "definition": {
                                    "track": {
                                        "type": "object",
                                        "definition": {
                                            "id": {"type": "string"},
                                            "name": {"type": "string"},
                                            "artists": {
                                                "type": "array",
                                                "definition": {
                                                    "type": "object",
                                                    "definition": {
                                                        "id": {"type": "string"},
                                                        "name": {"type": "string"},
                                                    },
                                                },
                                            },
                                            "duration_ms": {"type": "number"},
                                        },
                                    }
                                },
                            },
                        },
                    },
                },
            },
        },
    }

    updated_endpoint = json.loads(json.dumps(endpoint))
    updated_endpoint["definition"]["externalService"]["operations"] = [
        {
            "operationId": "get-playlist",
            "method": "GET",
            "path": "/playlists/{playlist_id}",
            "parameterMappings": [
                {"name": "playlist_id", "in": "path", "required": True},
                {"name": "fields", "in": "query"},
            ],
            "responseSchema": created_entity["mlSchema"],
        }
    ]

    integ_suite = {
        "uuid": "394242e7-6443-41b8-b061-9bf2bcf06f17",
        "parentName": "MiroirTest",
        "parentUuid": "a311f363-e238-4203-bdfc-29e8c160c26b",
        "name": "externalServiceSyncExecute",
        "selfApplication": MIROIR_APP,
        "branch": "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
        "description": "Slice 6 actionTest: execute the generated compositeActionSequence on the Library playfield. Proves landing only — no HTTP.",
        "definition": {
            "miroirTestType": "miroirTestSuite",
            "miroirTestLabel": "externalServiceSyncExecute",
            "runTarget": {
                "applicationUuid": LIBRARY_APP,
                "applicationName": "Library",
                "deploymentUuid": LIBRARY_DEPLOYMENT,
            },
            "testbedModel": {
                "applicationUuid": LIBRARY_APP,
                "applicationName": "Library",
            },
            "testbedEntitiesAndInstances": [],
            "testbedInitApplicationParameters": "libraryTestbedInitParams",
            "miroirTests": [
                {
                    "miroirTestType": "actionTest",
                    "miroirTestLabel": "executing the sync composite lands operations and SpotifyPlaylist",
                    "compositeActionSequence": {
                        "actionType": "compositeActionSequence",
                        "actionLabel": "externalServiceSyncExecute",
                        "endpoint": COMPOSITE_EP,
                        "payload": {
                            "actionSequence": [
                                {
                                    "actionType": "rollback",
                                    "actionLabel": "refreshMiroir",
                                    "endpoint": MODEL_EP,
                                    "payload": {"application": MIROIR_APP},
                                },
                                {
                                    "actionType": "rollback",
                                    "actionLabel": "refreshLibrary",
                                    "endpoint": MODEL_EP,
                                    "payload": {"application": LIBRARY_APP},
                                },
                                {
                                    "actionType": "createInstance",
                                    "actionLabel": "createSpotifyEndpoint",
                                    "endpoint": INSTANCE_EP,
                                    "payload": {
                                        "application": LIBRARY_APP,
                                        "applicationSection": "model",
                                        "objects": [endpoint],
                                    },
                                },
                                {
                                    "actionType": "updateInstance",
                                    "actionLabel": "upsertExternalServiceOperations",
                                    "endpoint": INSTANCE_EP,
                                    "payload": {
                                        "application": LIBRARY_APP,
                                        "applicationSection": "model",
                                        "objects": [updated_endpoint],
                                    },
                                },
                                {
                                    "actionType": "createEntity",
                                    "actionLabel": "createSpotifyPlaylist",
                                    "endpoint": MODEL_EP,
                                    "payload": {
                                        "application": LIBRARY_APP,
                                        "entities": [created_entity],
                                    },
                                },
                                {
                                    "actionType": "commit",
                                    "actionLabel": "commitLibrary",
                                    "endpoint": MODEL_EP,
                                    "payload": {"application": LIBRARY_APP},
                                },
                                {
                                    "actionType": "compositeRunBoxedQueryAction",
                                    "endpoint": COMPOSITE_EP,
                                    "actionLabel": "querySyncedModel",
                                    "nameGivenToResult": "syncedModel",
                                    "payload": {
                                        "actionType": "runBoxedQueryAction",
                                        "endpoint": QUERY_EP,
                                        "payload": {
                                            "application": LIBRARY_APP,
                                            "applicationSection": "model",
                                            "query": {
                                                "queryType": "boxedQueryWithExtractorCombinerTransformer",
                                                "application": LIBRARY_APP,
                                                "extractors": {
                                                    "entities": {
                                                        "extractorOrCombinerType": "extractorInstancesByEntity",
                                                        "applicationSection": "model",
                                                        "parentName": "Entity",
                                                        "parentUuid": ENTITY_ENTITY,
                                                        "orderBy": {
                                                            "attributeName": "name",
                                                            "direction": "ASC",
                                                        },
                                                    },
                                                    "endpoints": {
                                                        "extractorOrCombinerType": "extractorInstancesByEntity",
                                                        "applicationSection": "model",
                                                        "parentName": "Endpoint",
                                                        "parentUuid": ENDPOINT_ENTITY,
                                                        "orderBy": {
                                                            "attributeName": "name",
                                                            "direction": "ASC",
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            ]
                        },
                    },
                    "testCompositeActionAssertions": [
                        {
                            "actionType": "compositeRunTestAssertion",
                            "actionLabel": "spotifyPlaylistLanded",
                            "nameGivenToResult": "spotifyPlaylistLanded",
                            "testAssertion": {
                                "testType": "testAssertion",
                                "testLabel": "spotifyPlaylistLanded",
                                "definition": {
                                    "resultTransformer": find_in_context(
                                        ["syncedModel", "entities"], "uuid", ENTITY_UUID
                                    ),
                                    "resultAccessPath": [],
                                    "ignoreAttributes": [
                                        "parentName",
                                        "parentUuid",
                                        "parentDefinitionVersionUuid",
                                        "selfApplication",
                                        "conceptLevel",
                                        "description",
                                        "mlSchema",
                                    ],
                                    "expectedValue": {
                                        "uuid": ENTITY_UUID,
                                        "name": "SpotifyPlaylist",
                                        "idAttribute": "id",
                                        "externalDataSource": {
                                            "kind": "http",
                                            "endpoint": ENDPOINT_UUID,
                                        },
                                    },
                                },
                            },
                        },
                        {
                            "actionType": "compositeRunTestAssertion",
                            "actionLabel": "spotifyPlaylistHttpSource",
                            "nameGivenToResult": "spotifyPlaylistHttpSource",
                            "testAssertion": {
                                "testType": "testAssertion",
                                "testLabel": "spotifyPlaylistHttpSource",
                                "definition": {
                                    "resultTransformer": find_in_context(
                                        ["syncedModel", "entities"], "uuid", ENTITY_UUID
                                    ),
                                    "resultAccessPath": ["externalDataSource"],
                                    "expectedValue": {
                                        "kind": "http",
                                        "endpoint": ENDPOINT_UUID,
                                    },
                                },
                            },
                        },
                        {
                            "actionType": "compositeRunTestAssertion",
                            "actionLabel": "getPlaylistOperationLanded",
                            "nameGivenToResult": "getPlaylistOperationLanded",
                            "testAssertion": {
                                "testType": "testAssertion",
                                "testLabel": "getPlaylistOperationLanded",
                                "definition": {
                                    "resultTransformer": find_in_context(
                                        ["syncedModel", "endpoints"], "uuid", ENDPOINT_UUID
                                    ),
                                    "resultAccessPath": [
                                        "definition",
                                        "externalService",
                                        "operations",
                                        "0",
                                    ],
                                    "ignoreAttributes": [
                                        "parameterMappings",
                                        "responseSchema",
                                    ],
                                    "expectedValue": {
                                        "operationId": "get-playlist",
                                        "method": "GET",
                                        "path": "/playlists/{playlist_id}",
                                    },
                                },
                            },
                        },
                    ],
                }
            ],
        },
    }

    (MIROIR_TEST_DIR / "394242e7-6443-41b8-b061-9bf2bcf06f17.json").write_text(
        json.dumps(integ_suite, indent=2) + "\n",
        encoding="utf-8",
    )
    print("wrote externalServiceSync and externalServiceSyncExecute suites")


if __name__ == "__main__":
    main()
