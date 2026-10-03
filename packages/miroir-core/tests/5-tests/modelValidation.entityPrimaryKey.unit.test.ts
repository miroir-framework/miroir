/**
 * Model validation rejects Entity primary key declarations the Entity schema admits but Miroir
 * can not honour: `idAttribute: true`, and `idAttribute: false` outside External SQL / HTTP entities.
 */
import { describe, expect, it } from "vitest";

import {
  checkModelValidationInstance,
  defaultMiroirModelEnvironment,
  entityDefinitionsByEntityName,
} from "../../src/index.js";
import { defaultMiroirMetaModel } from "../../../miroir-app-miroir/src/Model.js";

const entitySchema = entityDefinitionsByEntityName(defaultMiroirMetaModel).Entity?.mlSchema as any;

function entityRow(fields: Record<string, unknown>) {
  return {
    uuid: "22275459-d657-48cc-b72e-834e2ba3947c",
    parentName: "Entity",
    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
    selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
    name: "pk_less_rows",
    mlSchema: { type: "object", definition: { label: { type: "string", optional: true } } },
    ...fields,
  };
}

function check(fields: Record<string, unknown>) {
  return checkModelValidationInstance(entitySchema, entityRow(fields), "pk_less_rows", defaultMiroirModelEnvironment);
}

describe("model validation of Entity idAttribute", () => {
  it("accepts idAttribute false on an External SQL entity", () => {
    const result = check({ conceptLevel: "External", externalDataSource: { schema: "pg_catalog" }, idAttribute: false });
    expect(result.status, JSON.stringify(result.innermostError)).toBe("ok");
  });

  it("accepts idAttribute false on an HTTP entity", () => {
    const result = check({
      conceptLevel: "External",
      externalDataSource: { kind: "http", endpoint: "3d8da4d4-8f76-4bb4-9212-14869d81c00c" },
      idAttribute: false,
    });
    expect(result.status, JSON.stringify(result.innermostError)).toBe("ok");
  });

  it("rejects idAttribute false on an entity Miroir stores", () => {
    const result = check({ conceptLevel: "Model", idAttribute: false });
    expect(result.status).toBe("error");
    expect(result.innermostError).toEqual([
      "Entity pk_less_rows: idAttribute false (no primary key) is only allowed on External SQL and HTTP entities",
    ]);
  });

  it("rejects idAttribute true", () => {
    const result = check({ conceptLevel: "External", externalDataSource: { schema: "pg_catalog" }, idAttribute: true });
    expect(result.status).toBe("error");
    expect(result.innermostError).toEqual([
      "Entity pk_less_rows: idAttribute true is not allowed, use false for an entity without primary key",
    ]);
  });

  it("keeps accepting a composite idAttribute", () => {
    const result = check({ conceptLevel: "Model", idAttribute: ["a", "b"] });
    expect(result.status, JSON.stringify(result.innermostError)).toBe("ok");
  });
});
