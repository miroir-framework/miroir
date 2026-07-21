import type { ApplicationDeploymentMap } from "miroir-core";

import deployment_Library_DO_NO_USE from "../assets/deployment/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json" with { type: "json" };
import selfApplicationLibrary from "../assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json" with { type: "json" };

/**
 * Resolves the library deployment uuid from an applicationDeploymentMap.
 * Supports legacy maps that stored `libraryDeploymentUuid` as an extra property (pre-198 configs).
 */
export function resolveLibraryDeploymentUuid(
  applicationDeploymentMap: ApplicationDeploymentMap,
): string {
  const fromApplication = applicationDeploymentMap[selfApplicationLibrary.uuid];
  if (typeof fromApplication === "string" && fromApplication.length > 0) {
    return fromApplication;
  }

  const legacyUuid = (applicationDeploymentMap as ApplicationDeploymentMap & {
    libraryDeploymentUuid?: string;
  }).libraryDeploymentUuid;
  if (typeof legacyUuid === "string" && legacyUuid.length > 0) {
    return legacyUuid;
  }

  return deployment_Library_DO_NO_USE.uuid;
}
