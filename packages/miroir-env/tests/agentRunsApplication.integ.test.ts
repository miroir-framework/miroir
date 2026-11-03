// #671: the agent cost benchmark records of #550 are an application of their own, AgentRuns, kept as
// JSON files in code-helpers/features/550-FEATURE-agent-cost-measurement/assets and installed by the
// dev environment through an application packagesDirectory. The dev environment opens it like a
// package application, with its Entity, its Reports and its runs.
// vitest, not MiroirTest: this is boot wiring on a real DomainController and filesystem stores, and
// MiroirTest discovery only knows applications under packages/ (analysis D7).
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import {
  checkModelValidationInstance,
  ConfigurationService,
  defaultMiroirModelEnvironment,
  ENTITY_ADMIN_APPLICATION_UUID,
  miroirCoreStartup,
  type MlElement,
} from "@miroir-framework/core";
import { miroirFileSystemStoreSectionStartup } from "@miroir-framework/store-filesystem";

import { boot, contentHashes, readRows, temporaryCheckout } from "./bootTestSupport";

const AGENT_RUNS_FOLDER = "code-helpers/features/550-FEATURE-agent-cost-measurement";
const AGENT_RUNS_APPLICATION = "7f2c40ba-04e4-4204-9cb2-2cc5ca63593c";
const AGENT_RUNS_DEPLOYMENT = "969b6e42-2023-4650-b3bc-4fe9d67f1cbb";
const ENTITY_ENTITY = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const ENTITY_REPORT = "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916";
const ENTITY_AGENT_RUN_MEASUREMENT = "954de789-6350-4f54-a809-5f2b8b91d067";
const REPORT_AGENT_RUN_HISTORY = "7a695632-338e-4c33-8b39-dba7f6d4c988";
const REPORT_AGENT_RUN_MEASUREMENT_DETAILS = "49a3c09a-c7cd-4438-9730-c691c70741af";
/** The pilot runs tracked on 2026-11-01 (#550), moved from Miroir's devData: recording adds runs. */
const PILOT_RUNS = "001d9c4f-3589-4c00-a2f2-705800d685ac 059a6dfa-5176-4837-8fb3-f1d838097423 1f8818d7-cebd-4756-a315-7faa7ec50f93 25330ff4-9765-438e-9e6d-a7237c53e57a 2631e019-dc7c-4f36-b6ec-26b02aab2cd6 4b315479-3a81-4171-9fac-7c340e595e2f 50a30266-c429-4f87-b1f3-4180aff0a38b 587a7192-a159-41b3-aecb-c81029aaeb2c 5bf75438-9ff1-464f-8592-69b18e72f8c3 672275a8-6ac4-4096-a993-7677cd632f43 6a5503f1-1692-4334-8c15-9975a930f5f8 6e63687d-9d51-48bc-a9d8-6f98ee3146bd 7c3fda97-493f-428d-abae-291bbad9b4e6 8673fac9-bf94-4d9f-9f76-1e067f22b1bc 8794a892-47ce-4a31-a920-b6db593c2c53 8af7d763-62bf-40df-b871-b164ff035940 a28ea77d-a021-48b6-b5d9-f7e58ce8cf24 a9376d13-062b-4e4b-910e-6bae7ad290cc ab2d126b-f9bd-45e7-b2e2-88fb1ad87856 c627612d-cf0b-45bb-abf8-d7e2c47bceaf ceb640ad-db41-42ac-bb70-dd31a8d120fc d779aca1-e246-476c-8601-52a650373160 ee2b2ee6-bbf8-4b7c-aecd-dcba39014769 fa7a88db-8406-4460-b2c2-737d2d88d4a8".split(" ");

describe("AgentRuns application in the dev environment (#671)", () => {
  let root: string;
  let folderBefore: Record<string, string>;
  let booted: Awaited<ReturnType<typeof boot>>;

  beforeAll(async () => {
    miroirCoreStartup();
    miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
    root = temporaryCheckout();
    folderBefore = contentHashes(path.join(root, AGENT_RUNS_FOLDER));
    booted = await boot(root);
  }, 120000);

  it("installs AgentRuns live on its folder under code-helpers", () => {
    const agentRuns = booted.resolved.deployments.find((d) => d.applicationKey === "agentRuns")!;
    expect(agentRuns).toMatchObject({ deployment: AGENT_RUNS_DEPLOYMENT, selfApplication: AGENT_RUNS_APPLICATION });
    expect(agentRuns.configuration.model).toEqual({
      emulatedServerType: "filesystem",
      directory: `${AGENT_RUNS_FOLDER}/assets/agentRuns_model`,
    });
    expect(agentRuns.configuration.data).toEqual({
      emulatedServerType: "filesystem",
      directory: `${AGENT_RUNS_FOLDER}/assets/agentRuns_data`,
    });
  });

  it("opens its deployment without warning, named after its SelfApplication", () => {
    expect(booted.reconciliation.warnings).toEqual([]);
    expect(booted.reconciliation.opened).toContain(AGENT_RUNS_DEPLOYMENT);
    const applications = readRows(path.join(root, ".miroir/dev/admin/data", ENTITY_ADMIN_APPLICATION_UUID));
    expect(applications[AGENT_RUNS_APPLICATION]).toMatchObject({ name: "AgentRuns" });
  });

  it("holds the AgentRunMeasurement Entity and its two Reports in its model, and the 24 pilot runs, valid, in its data", async () => {
    const store = booted.persistenceStoreControllerManager.getPersistenceStoreController(AGENT_RUNS_DEPLOYMENT)!;

    const entities = (await store.getInstances("model", ENTITY_ENTITY)) as any;
    expect(entities.returnedDomainElement.instances.map((e: any) => e.uuid)).toEqual([ENTITY_AGENT_RUN_MEASUREMENT]);
    const entity = entities.returnedDomainElement.instances[0];

    const reports = await store.getInstances("model", ENTITY_REPORT);
    expect((reports as any).returnedDomainElement.instances.map((r: any) => r.uuid).sort()).toEqual(
      [REPORT_AGENT_RUN_HISTORY, REPORT_AGENT_RUN_MEASUREMENT_DETAILS].sort(),
    );

    const runs = (await store.getInstances("data", ENTITY_AGENT_RUN_MEASUREMENT)) as any;
    const instances = runs.returnedDomainElement.instances;
    expect(instances.map((run: any) => run.uuid)).toEqual(expect.arrayContaining(PILOT_RUNS));
    expect(PILOT_RUNS).toHaveLength(24);
    for (const run of instances) {
      const check = checkModelValidationInstance(entity.mlSchema as MlElement, run, run.uuid, defaultMiroirModelEnvironment);
      expect(check.status === "ok" ? "ok" : check.innermostError, run.uuid).toBe("ok");
    }
    expect(new Set(instances.map((run: any) => run.arm))).toEqual(new Set(["conventional", "miroir-files", "miroir-mcp"]));
  });

  it("leaves its folder unchanged", () => {
    expect(contentHashes(path.join(root, AGENT_RUNS_FOLDER))).toEqual(folderBefore);
  });
});
