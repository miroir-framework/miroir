import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getExternalService } from "../../src/0_interfaces/1_core/endpointDefinition.js";
import { TransformerFailure } from "../../src/0_interfaces/2_domain/DomainElement.js";
import { defaultMetaModelEnvironment } from "../../src/1_core/Model.js";
import {
  buildOpenApiEndpointSyncComposite,
  extractSyncedEndpointFromComposite,
} from "../../src/2_domain/buildOpenApiEndpointSyncComposite.js";

const REPO_ROOT = join(import.meta.dirname, "../../../..");

const SPOTIFY_ENDPOINT_PATH = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-spotify/assets/spotify_model",
  "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
  "0e5cb172-12ea-4467-8598-5889338ae454.json",
);

const MODEL_ENDPOINT_PATH = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data",
  "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
  "7947ae40-eb34-4149-887b-15a9021e714e.json",
);

const ENDPOINT_UUID = "0e5cb172-12ea-4467-8598-5889338ae454";

describe("buildOpenApiEndpointSyncComposite", () => {
  it("builds an updateInstance composite from the Spotify Endpoint OpenAPI document", () => {
    const endpoint = JSON.parse(readFileSync(SPOTIFY_ENDPOINT_PATH, "utf8"));
    const composite = buildOpenApiEndpointSyncComposite(endpoint, defaultMetaModelEnvironment);
    expect(composite).not.toBeInstanceOf(TransformerFailure);
    expect((composite as { actionType?: string }).actionType).toBe("compositeActionSequence");
    expect((composite as { payload?: { application?: string } }).payload?.application).toBe(
      endpoint.application,
    );

    const updated = extractSyncedEndpointFromComposite(composite) as {
      uuid?: string;
      definition?: { externalService?: { operations?: Array<{ operationId?: string }> } };
    };
    expect(updated?.uuid).toBe(ENDPOINT_UUID);
    const operationIds = (getExternalService(updated)?.operations ?? []).map(
      (operation) => operation.operationId,
    );
    expect(operationIds).toContain("get-playlist");
  });

  it("fails closed without a uuid or OpenAPI document", () => {
    const endpoint = JSON.parse(readFileSync(SPOTIFY_ENDPOINT_PATH, "utf8"));
    const missingUuid = buildOpenApiEndpointSyncComposite(
      { ...endpoint, uuid: undefined },
      defaultMetaModelEnvironment,
    );
    expect(missingUuid).toBeInstanceOf(TransformerFailure);

    const actionsEndpoint = JSON.parse(readFileSync(MODEL_ENDPOINT_PATH, "utf8"));
    const actionsResult = buildOpenApiEndpointSyncComposite(
      actionsEndpoint,
      defaultMetaModelEnvironment,
    );
    expect(actionsResult).toBeInstanceOf(TransformerFailure);
  });

  it("still builds a composite when the form value also has an actions key", () => {
    const endpoint = JSON.parse(readFileSync(SPOTIFY_ENDPOINT_PATH, "utf8"));
    endpoint.definition.actions = [];
    const composite = buildOpenApiEndpointSyncComposite(endpoint, defaultMetaModelEnvironment);
    expect(composite).not.toBeInstanceOf(TransformerFailure);
    expect((composite as { actionType?: string }).actionType).toBe("compositeActionSequence");
  });
});
