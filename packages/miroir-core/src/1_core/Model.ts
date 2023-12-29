import { MiroirApplicationModel } from "../0_interfaces/1_core/Model";
import entityEntity from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entityApplicationDeployment from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/35c5608a-7678-4f07-a4ec-76fc5bc35424.json';
import entityEntityDefinition from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import EntityJzodSchema from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/5e81e1b9-38be-487c-b3e5-53796c57fccf.json';
import entityApplication from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a659d350-dd97-4da9-91de-524fa01745dc.json';
import entityApplicationVersion from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';
import entityApplicationModelBranch from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/cdb0aec6-b848-43ac-a058-fe2dbe5811f1.json';
// import entityModelVersion from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';
import entityReport from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json';
import entityStoreBasedConfiguration from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7990c0c9-86c3-40a1-a121-036c91b55ed7.json';

import entityDefinitionApplication from '../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/9460420b-f176-4918-bd45-894ab195ffe9.json';
import entityDefinitionApplicationDeployment from '../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bd303ae8-6bce-4b44-a63c-815b9ebf728b.json';
import entityDefinitionApplicationModelBranch from '../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/69bf7c03-a1df-4d1c-88c1-44363feeea87.json';
import entityDefinitionApplicationVersion from '../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json';
import entityDefinitionEntity from '../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json';
import entityDefinitionEntityDefinition from '../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json';
import entityDefinitionJzodSchema from '../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/15407b85-f2c8-4a34-bfa7-89f044ba2407.json';
import entityDefinitionReport from '../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json';
// import entityDefinitionModelVersion from '../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json';
import entityDefinitionStoreBasedConfiguration from '../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/f93af951-ea13-4815-a2e3-ec0cab1fadd2.json';

import reportApplicationVersionList from '../assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/0810de28-fdab-4baf-8935-7e04a8f779a9.json';
import reportApplicationList from '../assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/0e4cf674-3a26-422a-8618-09e32302ac0c.json';
import reportReportList from '../assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855.json';
import reportConfigurationList from '../assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/43f04807-8f96-43f9-876f-9a0210f7b99c.json';
import reportApplicationModelBranchList from '../assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/60648b22-e2c6-4b74-8031-53884f597d63.json';
import reportJzodSchemaList from '../assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/8b22e84e-9374-4121-b2a7-d13d947a0ba2.json';
import reportEntityList from '../assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c9ea3359-690c-4620-9603-b5b402e4a2b9.json';
import reportApplicationDeploymentList from '../assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/df0a9a8f-e0f6-4f9f-8635-c8460e638e1b.json';
import reportEntityDefinitionList from '../assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/f9aff35d-8636-4519-8361-c7648e0ddc68.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionEntity from '../assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/17adb534-1dcb-4874-a4ef-6c1e03b31c4e.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionEntityDefinition from '../assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/48644159-66d4-426d-b38d-d083fd455e7b.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationModelBranch from '../assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/4aaba993-f0a1-4a26-b1ea-13b0ad532685.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationVersion from '../assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/9086f49a-0e81-4902-81f3-560186dee334.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionStoreBasedConfiguration from '../assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/ba38669e-ac6f-40ea-af14-bb200db251d8.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionApplication from '../assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/dc47438c-166a-4d19-aeba-ad70281afdf4.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionReport from '../assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/ede7e794-5ae7-48a8-81c9-d1f82df11829.json';
import applicationVersionInitialMiroirVersion from '../assets/miroir_data/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/695826c2-aefa-4f5f-a131-dee46fe21c1.json';
import jzodSchemajzodMiroirBootstrapSchema from "../assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json";

import { MetaEntity } from "../0_interfaces/1_core/EntityDefinition.js";
import instanceConfigurationReference from '../assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json';

// import { Report, } from "../0_interfaces/1_core/Report.js";
import { JzodSchemaDefinition } from "../0_interfaces/1_core/JzodSchemaDefinition.js";
import { Report } from "../0_interfaces/1_core/preprocessor-generated/server-generated";
import { EntityDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// TODO: define current configuration!
export const defaultMiroirMetaModel:MiroirApplicationModel = {
  configuration: [instanceConfigurationReference],
  entities: [
    entityApplication as MetaEntity,
    entityApplicationDeployment as MetaEntity,
    entityApplicationModelBranch as MetaEntity,
    entityApplicationVersion as MetaEntity,
    entityEntity as MetaEntity,
    entityEntityDefinition as MetaEntity,
    EntityJzodSchema as MetaEntity,
    entityReport as MetaEntity,
    entityStoreBasedConfiguration as MetaEntity,
    // entityApplicationVersion as MetaEntity,
  ],
  entityDefinitions: [
    entityDefinitionApplication as EntityDefinition,
    entityDefinitionApplicationDeployment as EntityDefinition,
    entityDefinitionApplicationModelBranch as EntityDefinition,
    entityDefinitionApplicationVersion as EntityDefinition,
    entityDefinitionEntity as EntityDefinition,
    entityDefinitionEntityDefinition as EntityDefinition,
    entityDefinitionJzodSchema as EntityDefinition,
    entityDefinitionReport as EntityDefinition,
    entityDefinitionStoreBasedConfiguration as EntityDefinition,
  ],
  jzodSchemas: [
    jzodSchemajzodMiroirBootstrapSchema as JzodSchemaDefinition,
  ],
  applicationVersions:[
    applicationVersionInitialMiroirVersion
  ],
  reports: [
    reportApplicationDeploymentList as Report,
    reportApplicationList as Report,
    reportApplicationModelBranchList as Report,
    reportApplicationVersionList as Report,
    reportConfigurationList as Report,
    reportEntityDefinitionList as Report,
    reportEntityList as Report,
    reportJzodSchemaList as Report,
    reportReportList as Report,
  ],
  applicationVersionCrossEntityDefinition: [
    applicationVersionInitialMiroirVersionCrossEntityDefinitionApplication,
    applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationModelBranch,
    applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationVersion,
    applicationVersionInitialMiroirVersionCrossEntityDefinitionEntity,
    applicationVersionInitialMiroirVersionCrossEntityDefinitionEntityDefinition,
    applicationVersionInitialMiroirVersionCrossEntityDefinitionReport,
    applicationVersionInitialMiroirVersionCrossEntityDefinitionStoreBasedConfiguration,
  ]
}

// export const nodeConfigurationMetaModel:MiroirApplicationModel = {
//   applicationVersions:[
//     applicationVersionInitialMiroirVersion
//   ],
//   configuration: [instanceConfigurationReference],
//   entities: [
//     entityApplication as MetaEntity,
//     entityApplicationDeployment as MetaEntity,
//     entityApplicationModelBranch as MetaEntity,
//     entityApplicationVersion as MetaEntity,
//     entityEntity as MetaEntity,
//     entityEntityDefinition as MetaEntity,
//     entityReport as MetaEntity,
//     entityStoreBasedConfiguration as MetaEntity,
//     // entityApplicationVersion as MetaEntity,
//   ],
//   entityDefinitions: [
//     entityDefinitionApplication as EntityDefinition,
//     entityDefinitionApplicationDeployment as EntityDefinition,
//     entityDefinitionApplicationModelBranch as EntityDefinition,
//     entityDefinitionApplicationVersion as EntityDefinition,
//     entityDefinitionEntity as EntityDefinition,
//     entityDefinitionEntityDefinition as EntityDefinition,
//     entityDefinitionStoreBasedConfiguration as EntityDefinition,
//     entityDefinitionReport as EntityDefinition,
//   ],
//   jzodSchemas: [

//   ],
//   reports: [
//     reportApplicationDeploymentList as Report,
//     reportApplicationList as Report,
//     reportApplicationModelBranchList as Report,
//     reportApplicationVersionList as Report,
//     reportConfigurationList as Report,
//     reportEntityDefinitionList as Report,
//     reportEntityList as Report,
//     reportReportList as Report,
//   ],
//   applicationVersionCrossEntityDefinition: [
//     applicationVersionInitialMiroirVersionCrossEntityDefinitionApplication,
//     applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationModelBranch,
//     applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationVersion,
//     applicationVersionInitialMiroirVersionCrossEntityDefinitionEntity,
//     applicationVersionInitialMiroirVersionCrossEntityDefinitionEntityDefinition,
//     applicationVersionInitialMiroirVersionCrossEntityDefinitionReport,
//     applicationVersionInitialMiroirVersionCrossEntityDefinitionStoreBasedConfiguration,
//   ]
// }


export function getCurrentEntityDefinition(metaModel:MiroirApplicationModel,applicationUuid:string,entityUuid:string): EntityDefinition | undefined{
  const currentApplicationVersionUuid:string = metaModel.configuration[0].definition.currentApplicationVersion;
  const currentApplicationVersion = metaModel.applicationVersions.find(av=>av.uuid == currentApplicationVersionUuid);
  const currentApplicationVersionCrossEntityDefinitions = metaModel.applicationVersionCrossEntityDefinition.filter(e=>e.applicationVersion == currentApplicationVersionUuid);
  const currentEntityDefinitions = currentApplicationVersionCrossEntityDefinitions.map(e=>metaModel.entityDefinitions.find(x=>x.uuid == e.uuid));
  return currentEntityDefinitions.find(e=>e?.entityUuid == entityUuid);
}