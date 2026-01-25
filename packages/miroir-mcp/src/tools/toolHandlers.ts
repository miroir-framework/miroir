import {
  DomainControllerInterface,
  InstanceAction,
  Action2VoidReturnType,
  ApplicationDeploymentMap,
  LoggerInterface,
  MiroirLoggerFactory,
} from "miroir-core";

import {
  CreateInstanceToolSchema,
  GetInstanceToolSchema,
  GetInstancesToolSchema,
  UpdateInstanceToolSchema,
  DeleteInstanceToolSchema,
  DeleteInstanceWithCascadeToolSchema,
  LoadNewInstancesInLocalCacheToolSchema,
} from "./instanceActions.js";
import type { ZodTypeAny } from "zod";
import { env } from "process";
import { createHandler, type ToolHandler } from "../mcpServer.js";

const packageName = "miroir-mcp";
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, "info", "toolHandlers")
).then((logger: LoggerInterface) => {
  log = logger;
});






// // ################################################################################################
// // Generic handler factory
// // ################################################################################################

// /**
//  * Creates a handler function for a given tool name with custom payload building logic
//  */
// function createHandler(
//   toolName: string,
//   payloadBuilder: (validatedParams: any) => any
// ): (
//   params: unknown,
//   domainController: DomainControllerInterface,
//   applicationDeploymentMap: ApplicationDeploymentMap
// ) => Promise<{ content: Array<{ type: string; text: string }> }> {
//   return async (
//     params: unknown,
//     domainController: DomainControllerInterface,
//     applicationDeploymentMap: ApplicationDeploymentMap
//   ) => {
//     const config = toolNameToHandlerMap[toolName];
//     return handleInstanceAction(
//       toolName,
//       params,
//       config.schema,
//       (p) =>
//         ({
//           ...config.actionEnvelope,
//           payload: payloadBuilder(p),
//         }) as InstanceAction,
//       domainController,
//       applicationDeploymentMap,
//     );
//   };
// }

// ################################################################################################
// Individual tool handlers
// ################################################################################################

// export const handleCreateInstance = createHandler(
//   "miroir_createInstance",
//   (p) => ({
//     application: p.applicationUuid,
//     applicationSection: p.applicationSection,
//     objects: p.instances,
//   })
// );

// export const handleGetInstance = createHandler(
//   "miroir_getInstance",
//   (p) => ({
//     application: p.application,
//     applicationSection: p.applicationSection,
//     parentUuid: p.parentUuid,
//     uuid: p.uuid,
//   })
// );

// export const handleGetInstances = createHandler(
//   "miroir_getInstances",
//   (p) => ({
//     application: p.application,
//     applicationSection: p.applicationSection,
//     parentUuid: p.parentUuid,
//   })
// );

// export const handleUpdateInstance = createHandler(
//   "miroir_updateInstance",
//   (p) => ({
//     application: p.application,
//     applicationSection: p.applicationSection,
//     objects: p.instances,
//   })
// );

// export const handleDeleteInstance = createHandler(
//   "miroir_deleteInstance",
//   (p) => ({
//     application: p.applicationUuid,
//     applicationSection: p.applicationSection,
//     objects: [
//       {
//         parentName: p.parentName,
//         parentUuid: p.parentUuid,
//         applicationSection: p.applicationSection,
//         instances: [{ uuid: p.uuid, parentUuid: p.parentUuid }],
//       },
//     ],
//   })
// );

// export const handleDeleteInstanceWithCascade = createHandler(
//   "miroir_deleteInstanceWithCascade",
//   (p) => ({
//     application: p.applicationUuid,
//     applicationSection: p.applicationSection,
//     objects: [
//       {
//         parentName: p.parentName,
//         parentUuid: p.parentUuid,
//         applicationSection: p.applicationSection,
//         instances: [{ uuid: p.uuid, parentUuid: p.parentUuid }],
//       },
//     ],
//   })
// );

// export const handleLoadNewInstancesInLocalCache = createHandler(
//   "miroir_loadNewInstancesInLocalCache",
//   (p) => ({
//     application: p.applicationUuid,
//     applicationSection: p.applicationSection,
//     objects: p.instances,
//   })
// );

