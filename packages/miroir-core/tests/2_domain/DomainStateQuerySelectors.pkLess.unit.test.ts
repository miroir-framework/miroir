/**
 * Queries on an Entity without primary key (`idAttribute: false`): filters and ordering keep every
 * row, identical rows included; key-based extractors fail explicitly.
 */
import { describe, expect, it } from "vitest";

import type {
  ApplicationDeploymentMap,
  DomainState,
  EntityInstance,
  MiroirModelEnvironment,
} from "../../src/index.js";
import { defaultMiroirModelEnvironment } from "../../src/index.js";
import { Domain2ElementFailed } from "../../src/0_interfaces/2_domain/DomainElement.js";
import {
  getDomainStateExtractorRunnerMap,
  runQueryFromDomainState,
  selectEntityInstanceUuidIndexFromDomainState,
} from "../../src/2_domain/DomainStateQuerySelectors.js";

const testApplicationUuid = "11111111-1111-4111-8111-111111111111";
const testDeploymentUuid = "22222222-2222-4222-8222-222222222222";
const entityEntityUuid = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const keylessEntityUuid = "22275459-d657-48cc-b72e-834e2ba3947c";

const applicationDeploymentMap: ApplicationDeploymentMap = {
  [testApplicationUuid]: testDeploymentUuid,
};

const keylessEntity = {
  uuid: keylessEntityUuid,
  parentUuid: entityEntityUuid,
  name: "pk_less_rows",
  conceptLevel: "External",
  externalDataSource: { schema: "test_175" },
  idAttribute: false,
  mlSchema: {
    type: "object",
    definition: {
      label: { type: "string", optional: true },
      n: { type: "number", optional: true },
    },
  },
};

const rowB = { label: "b", n: 2, parentUuid: keylessEntityUuid } as unknown as EntityInstance;
const rowA = { label: "a", n: 1, parentUuid: keylessEntityUuid } as unknown as EntityInstance;

const domainState: DomainState = {
  [testDeploymentUuid]: {
    model: { [entityEntityUuid]: { [keylessEntityUuid]: keylessEntity as any } },
    data: { [keylessEntityUuid]: { "#0": rowB, "#1": rowA, "#2": { ...rowA } } },
  },
} as DomainState;

const modelEnvironment: MiroirModelEnvironment = {
  ...defaultMiroirModelEnvironment,
  currentModel: { ...(defaultMiroirModelEnvironment.currentModel as any), entities: [keylessEntity] },
} as MiroirModelEnvironment;

function selectRows(select: Record<string, unknown>) {
  return selectEntityInstanceUuidIndexFromDomainState(
    domainState,
    applicationDeploymentMap,
    {
      extractor: {
        queryType: "boxedExtractorOrCombinerReturningObjectList",
        application: testApplicationUuid,
        contextResults: {},
        pageParams: {},
        queryParams: {},
        select: {
          extractorOrCombinerType: "extractorInstancesByEntity",
          applicationSection: "data",
          parentUuid: keylessEntityUuid,
          ...select,
        },
      },
    } as any,
    modelEnvironment,
  );
}

describe("DomainStateQuerySelectors.pkLess.unit.test", () => {
  it("orderBy keeps every row, identical rows included, under positional keys", () => {
    const result = selectRows({ orderBy: { attributeName: "label", direction: "ASC" } });
    expect(result).not.toBeInstanceOf(Domain2ElementFailed);
    expect(result).toEqual({ "#0": rowA, "#1": rowA, "#2": rowB });
  });

  it("a filter keeps every matching row, identical rows included", () => {
    const result = selectRows({ filter: { attributeName: "label", value: "a" } });
    expect(result).not.toBeInstanceOf(Domain2ElementFailed);
    expect(Object.values(result as Record<string, EntityInstance>)).toEqual([rowA, rowA]);
  });

  it("extractorByPrimaryKey on an entity without primary key is an explicit query failure", () => {
    const result = runQueryFromDomainState(
      domainState,
      applicationDeploymentMap,
      {
        extractorRunnerMap: getDomainStateExtractorRunnerMap(),
        extractor: {
          queryType: "boxedQueryWithExtractorCombinerTransformer",
          application: testApplicationUuid,
          contextResults: {},
          pageParams: {},
          queryParams: {},
          extractors: {
            row: {
              extractorOrCombinerType: "extractorByPrimaryKey",
              applicationSection: "data",
              parentUuid: keylessEntityUuid,
              instanceUuid: "#0",
            },
          },
        },
      } as any,
      modelEnvironment,
    );
    expect(result).toBeInstanceOf(Domain2ElementFailed);
    expect((result as Domain2ElementFailed).failureMessage ?? JSON.stringify(result)).toContain(
      "has no primary key",
    );
  });
});
