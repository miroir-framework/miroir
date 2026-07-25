import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import { ApplicationSection } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  CacheSegmentKind,
  isPartialLocalCacheIndex,
  LOCAL_CACHE_PARTIAL_SEGMENT_SUFFIX,
  stripLocalCacheSegmentSuffix,
} from "../1_core/localCacheSegment.js";

//#########################################################################################
export function getReduxDeploymentsStateIndex(
  deploymentUuid: Uuid,
  applicationSection: ApplicationSection,
  entityUuid: Uuid,
  segment: CacheSegmentKind = "full",
): string {
  const base = "" + deploymentUuid + "_" + applicationSection + "_" + entityUuid;
  return segment === "partial" ? base + LOCAL_CACHE_PARTIAL_SEGMENT_SUFFIX : base;
}

//#########################################################################################
export function getLocalCacheIndexEntityUuid(localCacheIndex: string): Uuid {
  const base = stripLocalCacheSegmentSuffix(localCacheIndex);
  const entityUuid = new RegExp(/\_([0-9a-fA-F\-]+)$/).exec(base);
  if (entityUuid) {
    return entityUuid[1];
  } else {
    throw new Error("unknown entity in local cache index: " + localCacheIndex);
  }
}
//#########################################################################################
export function getLocalCacheIndexDeploymentUuid(localCacheIndex: string): Uuid {
  const deploymentUuid = new RegExp(/^([0-9a-fA-F\-]+)\_/).exec(localCacheIndex);
  if (deploymentUuid) {
    return deploymentUuid[1];
  } else {
    throw new Error("unknown deployment in local cache index: " + localCacheIndex);
  }
}
//#########################################################################################
export function getLocalCacheIndexDeploymentSection(localCacheIndex: string): Uuid {
  const base = stripLocalCacheSegmentSuffix(localCacheIndex);
  const deploymentSection = new RegExp(
    /^[0-9a-fA-F\-]+_([^_]+)_[0-9a-fA-F\-]+$/
  ).exec(base);
  if (deploymentSection) {
    return deploymentSection[1];
  } else {
    throw new Error(
      "getLocalCacheIndexDeploymentSection unknown deployment section in local cache index: " +
        localCacheIndex +
        " found deploymentSection is undefined"
    );
  }
}

//#########################################################################################
export function getLocalCacheIndexSegmentKind(
  localCacheIndex: string
): CacheSegmentKind {
  return isPartialLocalCacheIndex(localCacheIndex) ? "partial" : "full";
}
