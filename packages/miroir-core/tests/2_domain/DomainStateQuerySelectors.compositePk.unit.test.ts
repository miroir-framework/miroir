import { describe, expect, it } from "vitest";

import type {
  ApplicationDeploymentMap,
  DomainState,
  EntityInstance,
} from "../../src/index.js";
import { Domain2ElementFailed } from "../../src/0_interfaces/2_domain/DomainElement.js";
import { selectEntityInstanceUuidIndexFromDomainState } from "../../src/2_domain/DomainStateQuerySelectors.js";

const testApplicationUuid = "11111111-1111-1111-1111-111111111111";
const testDeploymentUuid = "22222222-2222-2222-2222-222222222222";
const testEntityUuid = "44691d2c-d7c1-48e0-8363-71c51195e104";

const applicationDeploymentMap: ApplicationDeploymentMap = {
  [testApplicationUuid]: testDeploymentUuid,
};

describe("DomainStateQuerySelectors.compositePk.unit.test", () => {
  it("preserves composite PK keys when orderBy is applied", () => {
    const inst1: EntityInstance = {
      region: "EU",
      code: "A1",
      parentUuid: testEntityUuid,
      name: "EU-A1 item",
    } as EntityInstance;
    const inst2: EntityInstance = {
      region: "EU",
      code: "B2",
      parentUuid: testEntityUuid,
      name: "EU-B2 item",
    } as EntityInstance;
    const inst3: EntityInstance = {
      region: "US",
      code: "A1",
      parentUuid: testEntityUuid,
      name: "US-A1 item",
    } as EntityInstance;

    const domainState: DomainState = {
      [testDeploymentUuid]: {
        data: {
          [testEntityUuid]: {
            "EU|A1": inst1,
            "EU|B2": inst2,
            "US|A1": inst3,
          },
        },
      },
    } as DomainState;

    const result = selectEntityInstanceUuidIndexFromDomainState(
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
            parentUuid: testEntityUuid,
            orderBy: { attributeName: "name", direction: "ASC" },
          },
        },
      } as any,
    );

    expect(result).not.toBeInstanceOf(Domain2ElementFailed);
    const index = result as Record<string, EntityInstance>;
    expect(Object.keys(index)).toEqual(["EU|A1", "EU|B2", "US|A1"]);
    expect(Object.values(index).map((i) => i.name)).toEqual([
      "EU-A1 item",
      "EU-B2 item",
      "US-A1 item",
    ]);
  });
});
