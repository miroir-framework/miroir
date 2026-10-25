import { describe, expect, it } from "vitest";

import { Action2Error } from "../../../../src/0_interfaces/2_domain/DomainElement";
import { rejectInstancesNotMatchingTheirEntity } from "../../../../src/1_core/Entity/instanceSchemaGuard";
import { defaultMiroirModelEnvironment, metaModelEntities } from "../../../../src/1_core/Model";

// #558: createInstance / updateInstance refuse an object that its Entity's mlSchema rejects.
const QUERY_ENTITY = "e4320b9e-ab45-4abe-85d8-359604b3c62f";

const query = {
  uuid: "5c1e7a42-8d3b-4f60-a9e1-7b2d4c6f8a10",
  parentName: "Query",
  parentUuid: QUERY_ENTITY,
  name: "OverdueLoans",
  definition: {
    extractorTemplates: {
      loans: {
        extractorOrCombinerType: "extractorInstancesByEntity",
        applicationSection: "data",
        parentName: "LendingHistoryItem",
        parentUuid: "e81078f3-2de7-4301-bd79-d3a156aec149",
      },
    },
  },
};

function createQuery(object: Record<string, unknown>, actionType: "createInstance" | "updateInstance" = "createInstance") {
  return rejectInstancesNotMatchingTheirEntity(
    {
      actionType,
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: { application: "5af03c98-fe5e-490b-b08f-e1230971c57f", applicationSection: "model", objects: [object as any] },
    } as any,
    metaModelEntities,
    defaultMiroirModelEnvironment,
  );
}

describe("#558 instance schema guard", () => {
  it("accepts a Query that matches the Query Entity", () => {
    expect(createQuery(query)).toBeUndefined();
  });

  it("refuses a Query with an attribute its schema lacks, naming it", () => {
    const rejected = createQuery({ ...query, definition: { ...query.definition, queryParameters: { startedBefore: { type: "string" } } } });
    expect(rejected).toBeInstanceOf(Action2Error);
    expect(rejected?.errorMessage).toContain("Query instance 5c1e7a42-8d3b-4f60-a9e1-7b2d4c6f8a10");
    expect(rejected?.errorMessage).toContain("queryParameters");
  });

  it("checks updateInstance too", () => {
    expect(createQuery({ ...query, unknownAttribute: 1 }, "updateInstance")).toBeInstanceOf(Action2Error);
  });

  it("leaves objects of unknown Entities alone", () => {
    expect(createQuery({ ...query, parentUuid: "00000000-0000-0000-0000-000000000000", extra: 1 })).toBeUndefined();
  });
});
