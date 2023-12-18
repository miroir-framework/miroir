// ###################################################################################

import {
  LoggerInterface,
  MiroirLoggerFactory,
  defaultMiroirMetaModel,
  getLoggerName
} from "miroir-core";

import {
  IStoreController
} from "miroir-core";

import { packageName, cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"Server");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// // TODO: factorize similar function in standalone-app index.tsx?
// export async function startServer(
//   localMiroirStoreController:IStoreController,
//   localAppStoreController:IStoreController,
// ) {
//   try {
//     await localMiroirStoreController?.open();
//     await localMiroirStoreController.bootFromPersistedState(defaultMiroirMetaModel.entities, defaultMiroirMetaModel.entityDefinitions);
//   } catch(e) {
//     log.error("failed to initialize meta-model, Entity 'Entity' is likely missing from Database, or database could not be opened. Entity Entity can be (re-)created using the 'InitDb' functionality on the client. this.sqlEntities:",localMiroirStoreController.getEntityUuids(),'error',e);
//   }
  
//   try {
//     await localAppStoreController?.open();
//     await localAppStoreController.bootFromPersistedState(defaultMiroirMetaModel.entities, defaultMiroirMetaModel.entityDefinitions);
//   } catch(e) {
//     log.error("failed to initialize app, Entity 'Entity' is likely missing from Database, or database could not be opened. Entity Entity can be (re-)created using the 'InitDb' functionality on the client. this.sqlEntities:",localMiroirStoreController.getEntityUuids(),'error',e);
//   }
//   return Promise.resolve()
// }
