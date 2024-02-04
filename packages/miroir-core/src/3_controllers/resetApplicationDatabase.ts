import { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";
import { defaultMiroirMetaModel } from '../1_core/Model';
import { applicationDeploymentLibrary } from "../ApplicationDeploymentLibrary";

import applicationDeploymentMiroir from '../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json';
import applicationStoreBasedConfigurationMiroir from '../assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json';
import applicationMiroir from '../assets/miroir_data/a659d350-dd97-4da9-91de-524fa01745dc/21840247-b5b1-4344-baec-f818f4797d92.json';
import applicationVersionInitialMiroirVersion from '../assets/miroir_data/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/695826c2-aefa-4f5f-a131-dee46fe21c1.json';
import applicationModelBranchMiroirMasterBranch from '../assets/miroir_data/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json';

import applicationStoreBasedConfigurationLibrary from "../assets/library_model/7990c0c9-86c3-40a1-a121-036c91b55ed7/2e5b7948-ff33-4917-acac-6ae6e1ef364f.json";
import applicationLibrary from "../assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json";
import applicationVersionLibraryInitialVersion from "../assets/library_model/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/419773b4-a73c-46ca-8913-0ee27fb2ce0a.json";
import applicationModelBranchLibraryMasterBranch from "../assets/library_model/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"resetApplicationDatabases");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

export async function resetMiroirAndApplicationDatabases(
  domainController: DomainControllerInterface
) {
  await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
    actionType: "DomainTransactionalAction",
    actionName: "resetModel",
  });
  await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
    actionType: "DomainTransactionalAction",
    actionName: "resetModel",
  });
}

export async function resetAndInitMiroirAndApplicationDatabase(
  domainController: DomainControllerInterface
) {
  await resetMiroirAndApplicationDatabases(domainController)
  await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
    actionType: "modelAction",
    actionName: "initModel",
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    params: {
      dataStoreType: "miroir",
      metaModel: defaultMiroirMetaModel,
      application: applicationMiroir,
      applicationDeploymentConfiguration: applicationDeploymentMiroir,
      applicationModelBranch: applicationModelBranchMiroirMasterBranch,
      applicationStoreBasedConfiguration: applicationStoreBasedConfigurationMiroir,
      applicationVersion: applicationVersionInitialMiroirVersion,
    },
  });
  await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
    actionType: "modelAction",
    actionName: "initModel",
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    params: {
      dataStoreType: "app",
      metaModel: defaultMiroirMetaModel,
      application: applicationLibrary,
      applicationDeploymentConfiguration: applicationDeploymentLibrary,
      applicationModelBranch: applicationModelBranchLibraryMasterBranch,
      applicationStoreBasedConfiguration: applicationStoreBasedConfigurationLibrary,
      applicationVersion: applicationVersionLibraryInitialVersion,
    },
  });

  log.info(
    "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ resetAndInitMiroirAndApplicationDatabase APPLICATION DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
  );
  await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
    actionType: "DomainTransactionalAction",
    actionName: "rollback",
  });
  await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
    actionType: "DomainTransactionalAction",
    actionName: "rollback",
  });
}