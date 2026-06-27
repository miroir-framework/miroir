import type { Runner } from "miroir-core";
import { defaultLibraryAppModel } from "./Library.js";
import book1 from "../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json" assert { type: "json" };
import user1 from "../assets/library_data/ca794e28-b2dc-45b3-8137-00151557eea8/04c371ed-702d-4dd9-a06d-8a04eda5d24f.json" assert { type: "json" };
import deployment_Library_DO_NO_USE from "../assets/deployment/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json" assert { type: "json" };
import entityLendingHistoryItem from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e81078f3-2de7-4301-bd79-d3a156aec149.json" assert { type: "json" };
import lendDocument from "../assets/library_model/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/cc853632-f158-43fa-b9ed-437c9c25f539.json" assert { type: "json" };
import returnDocument from "../assets/library_model/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/98a38a84-e702-4540-a056-c7676a193a2b.json" assert { type: "json" };
import selfApplicationLibrary from "../assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json" assert { type: "json" };

export type LibraryTestIdentifiers = {
  testApplicationUuid: string;
  testApplicationDeploymentUuid: string;
  testApplicationName: string;
  installTestApplicationUuid: string;
  installTestApplicationDeploymentUuid: string;
  installTestApplicationName: string;
};

export const libraryTestIdentifiers: LibraryTestIdentifiers = {
  testApplicationUuid: selfApplicationLibrary.uuid,
  testApplicationDeploymentUuid: deployment_Library_DO_NO_USE.uuid,
  testApplicationName: selfApplicationLibrary.name,
  installTestApplicationUuid: selfApplicationLibrary.uuid,
  installTestApplicationDeploymentUuid: deployment_Library_DO_NO_USE.uuid,
  installTestApplicationName: selfApplicationLibrary.name,
};

export type RunnerTestEnvironmentSeed = {
  testParams: Record<string, unknown>;
};

const LEND_START_DATE = new Date("2024-01-01").toISOString();

const RUNNER_REF_MAP: Record<string, Runner> = {
  lendDocument: lendDocument as unknown as Runner,
  returnDocument: returnDocument as unknown as Runner,
};

/** Interim global param bank for runner.library — R6 moves to suite JSON. */
export const RUNNER_TEST_ENVIRONMENT_REFS: RunnerTestEnvironmentSeed = {
  testParams: {
    defaultLibraryAppModel,
    user1Uuid: user1.uuid,
    book1Uuid: book1.uuid,
    lendStartDate: LEND_START_DATE,
    lendEndDate: LEND_START_DATE,
    testApplicationUuid: libraryTestIdentifiers.testApplicationUuid,
    testApplicationDeploymentUuid: libraryTestIdentifiers.testApplicationDeploymentUuid,
    lendingHistoryItemEntityUuid: entityLendingHistoryItem.uuid,
    lendingHistoryItemEntityName: entityLendingHistoryItem.name,
  },
};

export const RUNNER_TEST_DEPLOYMENT_REFS: Record<string, LibraryTestIdentifiers> = {
  libraryTestIdentifiers,
};

export function resolveRunnerRef(runnerRef: string): Runner {
  const runner = RUNNER_REF_MAP[runnerRef];
  if (!runner) {
    throw new Error(`Unknown runnerRef: ${runnerRef}`);
  }
  return runner;
}

export function resolveRunnerTestDeploymentRef(
  deploymentRef: string | undefined,
): LibraryTestIdentifiers {
  const key = deploymentRef ?? "libraryTestIdentifiers";
  const identifiers = RUNNER_TEST_DEPLOYMENT_REFS[key];
  if (!identifiers) {
    throw new Error(`Unknown deploymentRef: ${key}`);
  }
  return identifiers;
}
