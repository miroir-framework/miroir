
import type {
  ApplicationDeploymentMap,
  LoggerInterface
} from "miroir-core";
import {
  defaultSelfApplicationDeploymentMap,
  MiroirLoggerFactory
} from "miroir-core";
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { StoredRunnerView } from "./RunnerView.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Runner_CreateEntity"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export interface CreateEntityToolProps {
  // application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
}


// // ################################################################################################
// export function getCreateEntityActionTemplate(
//   actionName: string,
//   actionLabel: string
// ): CompositeActionTemplate {
//   return {
//     actionType: "compositeActionSequence",
//     actionLabel,
//     endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
//     payload: {
//       actionSequence: [
//         // // Step 1: Query to get the deployment UUID from the selected application
//         // {
//         //   actionType: "compositeRunBoxedQueryAction",
//         //   actionLabel: "getDeploymentForApplication",
//         //   nameGivenToResult: "deploymentInfo",
//         //   endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
//         //   payload: {
//         //     actionType: "runBoxedQueryAction",
//         //     endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
//         //     payload: {
//         //       application: adminSelfApplication.uuid,
//         //       applicationSection: "data",
//         //       query: {
//         //         queryType: "boxedQueryWithExtractorCombinerTransformer",
//         //         application: adminSelfApplication.uuid,
//         //         pageParams: {},
//         //         queryParams: {},
//         //         contextResults: {},
//         //         extractors: {
//         //           deployments: {
//         //             label: "deployments of the application",
//         //             extractorOrCombinerType: "extractorByEntityReturningObjectList",
//         //             parentUuid: entityDeployment.uuid,
//         //             parentName: entityDeployment.name,
//         //             applicationSection: "data",
//         //             filter: {
//         //               attributeName: "selfApplication",
//         //               value: {
//         //                 transformerType: "mustacheStringTemplate",
//         //                 definition: "{{createEntity.application}}",
//         //               },
//         //             },
//         //           },
//         //         },
//         //       },
//         //     },
//         //   },
//         // },
//         // createEntity action
//         {
//           actionType: "createEntity",
//           actionLabel,
//           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
//           payload: {
//             application: {
//               transformerType: "mustacheStringTemplate",
//               definition: "{{createEntity.application}}",
//             } as any,
//             entities: [
//               {
//                 entity: {
//                   transformerType: "getFromParameters",
//                   referencePath: [actionName, "entity"],
//                 } as any,
//                 entityDefinition: {
//                   transformerType: "getFromParameters",
//                   referencePath: [actionName, "entityDefinition"],
//                 } as any,
//               },
//             ],
//           } as any,
//         },
//         {
//           actionType: "commit",
//           actionLabel: "commit",
//           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
//           payload: {
//             application: {
//               transformerType: "mustacheStringTemplate",
//               definition: "{{createEntity.application}}",
//             } as any,
//           },
//         },
//       ],
//     },
//   } as any;
// }


// ################################################################################################
export const Runner_CreateEntity: React.FC<CreateEntityToolProps> = ({
  applicationDeploymentMap,
}) => {
  return (
    <StoredRunnerView
      applicationUuid={selfApplicationMiroir.uuid}
      applicationDeploymentMap={applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap}
      runnerUuid="82f81a25-2366-4abf-8a97-83ca5e9a9c46"
    />
  );
};
