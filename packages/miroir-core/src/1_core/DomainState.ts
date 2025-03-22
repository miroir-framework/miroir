import {
  EntityInstance,
  EntityInstancesUuidIndex,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export function DomainInstanceUuidIndexToArray(instances: EntityInstancesUuidIndex): EntityInstance[] {
  return !!instances ? Object.values(instances) : [];
}

// export getEntityInstancesFromDomainState():Instance[] {
//   (state: ReduxStateWithUndoRedo) => {
//     const deployments = state?.presentModelSnapshot;
//     const domainState: EntitiesDomainState = Object.fromEntries(
//       Object.entries(deployments)
//         .filter((e) => new RegExp(deploymentUuid + "_" + section + "_").test(e[0]))
//         .map((e) => {
//           // console.log("selectInstancesFromDomainSelector miroirInstances", e);
//           // removes the e[1].ids, that is imposed by the use of Redux's EntityAdapter
//           const entityUuid = new RegExp(/_([0-9a-fA-F\-]+)$/).exec(e[0] ? e[0] : "");
//           return [entityUuid ? entityUuid[1] : "", e[1].entities];
//         })
//     ) as EntitiesDomainState;

// }
