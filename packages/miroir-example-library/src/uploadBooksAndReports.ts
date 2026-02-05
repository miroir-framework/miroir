import type { EntityInstance, EntityInstanceCollection } from "miroir-core";
import entityPublisher from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a027c379-8468-43a5-ba4d-bf618be25cab.json" assert { type: "json" };
import entityCountry from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d3139a6d-0486-4ec8-bded-2a83a3c3cee4.json" assert { type: "json" };
import entityAuthor from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json" assert { type: "json" };
import entityBook from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json" assert { type: "json" };

import folio from "../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json" assert { type: "json" };
import penguin from "../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json" assert { type: "json" };
import springer from "../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json" assert { type: "json" };

// Library Data - Authors
import author1 from "../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json" assert { type: "json" };
import author2 from "../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json" assert { type: "json" };
import author3 from "../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json" assert { type: "json" };
import author4 from "../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/e4376314-d197-457c-aa5e-d2da5f8d5977.json" assert { type: "json" };

// Library Data - Books
import book3 from "../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/4cb917b3-3c53-4f9b-b000-b0e4c07a81f7.json" assert { type: "json" };
import book4 from "../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json" assert { type: "json" };
import book6 from "../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c6852e89-3c3c-447f-b827-4b5b9d830975.json" assert { type: "json" };
import book5 from "../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c97be567-bd70-449f-843e-cd1d64ac1ddd.json" assert { type: "json" };
import book1 from "../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json" assert { type: "json" };
import book2 from "../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json" assert { type: "json" };

// Library Data - Countries
import Country1 from "../assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/2eda1207-4dcc-4af9-a3ba-ef75e7f12c11.json" assert { type: "json" };
import Country2 from "../assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/30b8e7c6-b75d-4db0-906f-fa81fa5c4cc0.json" assert { type: "json" };
import Country3 from "../assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b62fc20b-dcf5-4e3b-a247-62d0475cf60f.json" assert { type: "json" };
import Country4 from "../assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b6ddfb89-4301-48bf-9ed9-4ed6ee9261fe.json" assert { type: "json" };

// Library Data - Users

export const libraryApplicationInstances: EntityInstanceCollection[] = [
  {
    parentName: entityPublisher.name,
    parentUuid: entityPublisher.uuid,
    applicationSection: "data",
    instances: [folio as EntityInstance, penguin as EntityInstance, springer as EntityInstance],
  },
  {
    parentName: entityAuthor.name,
    parentUuid: entityAuthor.uuid,
    applicationSection: "data",
    instances: [
      author1 as EntityInstance,
      author2 as EntityInstance,
      author3 as EntityInstance,
      author4 as EntityInstance,
    ],
  },
  {
    parentName: entityBook.name,
    parentUuid: entityBook.uuid,
    applicationSection: "data",
    instances: [
      book1 as EntityInstance,
      book2 as EntityInstance,
      book3 as EntityInstance,
      book4 as EntityInstance,
      book5 as EntityInstance,
      book6 as EntityInstance,
    ],
  },
  {
    parentName: entityCountry.name,
    parentUuid: entityCountry.uuid,
    applicationSection: "data",
    instances: [
      Country1 as EntityInstance,
      Country2 as EntityInstance,
      Country3 as EntityInstance,
      Country4 as EntityInstance,
    ],
  },
];
// // ###################################################################################
// export async function uploadBooksAndReports(
//   domainController: DomainControllerInterface,
//   currentModel?: MiroirModelEnvironment
// ) {
//   await domainController.handleAction(
//     {
//       actionType: "createEntity",
//       application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
//       endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
//       payload: {
//         deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
//         entities: [
//           { entity: entityAuthor as Entity, entityDefinition: entityDefinitionAuthor as EntityDefinition },
//           { entity: entityBook as Entity, entityDefinition: entityDefinitionBook as EntityDefinition },
//           { entity: entityCountry as Entity, entityDefinition: entityDefinitionCountry as EntityDefinition },
//           { entity: entityPublisher as Entity, entityDefinition: entityDefinitionPublisher as EntityDefinition },
//           // { entity: entityTest as Entity, entityDefinition: entityDefinitionTest as EntityDefinition },
//         ],
//       }
//     },
//     currentModel
//   );

//   await domainController.handleAction(
//     {
//       actionType: "commit",
//       application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
//       endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
//       payload: {
//         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
//       }
//     },
//     // { actionName: "commit", actionType: "modelAction", endpoint: "7947ae40-eb34-4149-887b-15a9021e714e", label: "Adding Author and Book entities" },
//     currentModel
//   );

//   await domainController.handleAction(
//     {
//       actionType: "transactionalInstanceAction",
//       application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
//       endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
//       payload: {
//         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
//         instanceAction: {
//           // actionType: "instanceAction",
//           actionType: "createInstance",
//           application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
//           endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
//           payload: {
//             deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
//             applicationSection: "model",
//             objects: [
//               {
//                 parentName: entityReport.name,
//                 parentUuid: entityReport.uuid,
//                 applicationSection: "model",
//                 instances: [
//                   reportAuthorDetails as EntityInstance,
//                   reportAuthorList as EntityInstance,
//                   reportBookDetails as EntityInstance,
//                   reportBookList as EntityInstance,
//                   reportCountryList as EntityInstance,
//                   reportPublisherList as EntityInstance,
//                   // reportTestList as EntityInstance,
//                 ],
//               },
//             ],
//           },
//         },
//       },
//     },
//     currentModel
//   );

//   await domainController.handleAction(
//     {
//       actionType: "commit",
//       application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
//       endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
//       payload: {
//         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
//       }
//     },
//     // { actionName: "commit", actionType: "modelAction", endpoint: "7947ae40-eb34-4149-887b-15a9021e714e", label: "Adding Author and Book entities" },
//     currentModel
//   );

//   await domainController.handleAction({
//     // actionType: "instanceAction",
//     actionType: "createInstance",
//     application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
//     endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
//     payload: {
//       deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
//       applicationSection: "data",
//       objects: libraryApplicationInstances,
//     },
//   });
// }
