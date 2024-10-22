import { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";
import { defaultMiroirMetaModel } from '../1_core/Model';

import adminConfigurationDeploymentMiroir from "../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json";
import selfApplicationStoreBasedConfigurationMiroir from '../assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json';
import selfApplicationMiroir from '../assets/miroir_data/a659d350-dd97-4da9-91de-524fa01745dc/21840247-b5b1-4344-baec-f818f4797d92.json';
import selfApplicationVersionInitialMiroirVersion from '../assets/miroir_data/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/695826c2-aefa-4f5f-a131-dee46fe21c1.json';
import selfApplicationModelBranchMiroirMasterBranch from '../assets/miroir_data/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json';

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

export async function resetAndInitMiroirAndApplicationDatabase(
  domainController: DomainControllerInterface,
  deployments: any[] // TODO: use Deployment Entity Type!
) {
  // const deployments = [adminConfigurationDeploymentLibrary, adminConfigurationDeploymentMiroir];

  for (const d of deployments) {
    await domainController.handleAction({
      actionType: "modelAction",
      actionName: "resetModel",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: d.uuid,
    });
  }
  for (const d of deployments) {
    await domainController.handleAction({
      actionType: "modelAction",
      actionName: "initModel",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: d.uuid,
      params: {
        dataStoreType: d.uuid == adminConfigurationDeploymentMiroir.uuid?"miroir":"app",
        metaModel: defaultMiroirMetaModel,
        application: selfApplicationMiroir,
        applicationDeploymentConfiguration: d,
        applicationModelBranch: selfApplicationModelBranchMiroirMasterBranch,
        applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationMiroir,
        applicationVersion: selfApplicationVersionInitialMiroirVersion,
      },
    });
  }
  log.info(
    "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ resetAndInitMiroirAndApplicationDatabase APPLICATION DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
  );
  for (const d of deployments) {
    await domainController.handleAction({
      actionType: "modelAction",
      actionName: "rollback",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: d.uuid,
    });
  }
}