/**
 * #9 C4: the Git side of an install and of a migration run, for a `versioned-git` application (analysis D6,
 * D8). A version is a tag; the model of a following deployment is its clone's checkout of that tag, so the
 * jump of a run is a checkout of the tag `to`, and the Migration is read in the commit of that tag, which the
 * checkout at `from` does not hold yet.
 */
import {
  Action2Error,
  type ApplicationDeploymentMap,
  type DomainControllerActionHost,
  getApplicationSection,
  GIT_ENDPOINT_UUID,
  type GitCheckoutAction,
  type GitLogAction,
  type GitLogResult,
  resolveVersioningMode,
} from "@miroir-framework/core";
import { entityMigration } from "@miroir-framework/core/meta-model";

import { refusal } from "./deploymentRole.js";
import { type MigrationRow, tagRef } from "./migrationGeneration.js";
import type { ModelState } from "./modelStates.js";

/** Whether the live model says the application keeps its versions as Git tags. */
export function isGitVersioned(live: ModelState, application: string): boolean {
  const selfApplication = live.applications.find((row) => row.uuid === application);
  return selfApplication !== undefined && resolveVersioningMode(selfApplication) === "versioned-git";
}

/** The log of the deployment's repository at `ref` (one commit), with its branches, tags and HEAD. */
async function gitLog(
  host: DomainControllerActionHost,
  application: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
  ref?: string,
): Promise<GitLogResult | Action2Error> {
  const action: GitLogAction = {
    actionType: "gitAction_log",
    endpoint: GIT_ENDPOINT_UUID,
    payload: { application, depth: 1, ...(ref ? { ref } : {}) },
  };
  const result = await host.handleGitAction(action, applicationDeploymentMap);
  return result instanceof Action2Error ? result : ((result as { returnedDomainElement?: unknown }).returnedDomainElement as GitLogResult);
}

/**
 * The commit of the tag `version` when the deployment's clone has it checked out; a refusal
 * (`versionNotCheckedOut`) when HEAD is elsewhere. `label` names the action in the messages.
 */
export async function checkedOutVersion(
  host: DomainControllerActionHost,
  application: string,
  version: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
  label: string,
): Promise<string | Action2Error> {
  // the tag, not a branch of the same name
  const log = await gitLog(host, application, applicationDeploymentMap, tagRef(version));
  if (log instanceof Action2Error) {
    return new Action2Error("FailedToHandleAction", `${label}: could not read the tag ${version} in the repository of ${application}`, [], log);
  }
  const commit = log.commits[0]?.oid;
  if (!commit || commit !== log.branches.head) {
    return refusal(
      `${label}: the clone of ${application} is at ${log.branches.head ?? "no commit"}, not at the tag ${version} (${commit}); check the tag out first`,
      "versionNotCheckedOut",
      { version, head: log.branches.head, commit },
    );
  }
  return commit;
}

/**
 * The Migration `migrationUuid` as the commit of its `to` tag holds it, read without a checkout, or
 * `undefined` when no tag of the repository holds it as its `to`.
 */
export async function migrationAtItsTag(
  host: DomainControllerActionHost,
  application: string,
  migrationUuid: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<MigrationRow | undefined | Action2Error> {
  const log = await gitLog(host, application, applicationDeploymentMap);
  if (log instanceof Action2Error) {
    return new Action2Error("FailedToHandleAction", `runMigration could not read the Git tags of ${application}`, [], log);
  }
  const read = await host.readGitModelFiles(application, log.branches.tags.map(tagRef), applicationDeploymentMap);
  if (read instanceof Action2Error) {
    return new Action2Error("FailedToHandleAction", `runMigration could not read the Git commits of ${application}`, [], read);
  }
  const folder = read.sectionFolders[getApplicationSection(application, entityMigration.uuid)];
  if (folder === undefined) {
    return undefined;
  }
  const path = `${folder === "" ? "" : `${folder}/`}${entityMigration.uuid}/${migrationUuid}.json`;
  for (const tag of log.branches.tags) {
    const text = read.commits[tagRef(tag)]?.files[path];
    if (text === undefined) {
      continue;
    }
    let row: MigrationRow;
    try {
      row = JSON.parse(text) as MigrationRow;
    } catch {
      return new Action2Error("FailedToHandleAction", `runMigration: ${path} at the tag ${tag} is not JSON`);
    }
    if (row.to === tag) {
      return row;
    }
  }
  return undefined;
}

/**
 * The jump of a run on a `versioned-git` deployment: the checkout of the tag `to`, named `refs/tags/<to>` as
 * the generation names it; its commit.
 */
export async function checkoutVersion(
  host: DomainControllerActionHost,
  application: string,
  to: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<string | Action2Error> {
  const action: GitCheckoutAction = { actionType: "gitAction_checkout", endpoint: GIT_ENDPOINT_UUID, payload: { application, ref: tagRef(to) } };
  const checkedOut = await host.handleGitAction(action, applicationDeploymentMap);
  if (checkedOut instanceof Action2Error) {
    return checkedOut;
  }
  return checkedOutVersion(host, application, to, applicationDeploymentMap, "runMigration");
}
