import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetupWorkerApi } from "msw/browser";
import { setupServer, SetupServerApi } from "msw/node";
import React from "react";
import { describe, expect } from 'vitest';

import Mustache from "mustache";

// import process from "process";

import {
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  author1,
  author2,
  author3,
  book1,
  book2,
  book3,
  book4,
  defaultLevels,
  DomainAction,
  DomainControllerInterface,
  entityAuthor,
  entityBook,
  EntityDefinition,
  entityDefinitionAuthor,
  entityDefinitionBook,
  EntityInstance,
  PersistenceStoreControllerInterface,
  MetaEntity,
  MiroirConfigClient,
  MiroirContext,
  miroirCoreStartup,
  MiroirLoggerFactory,
  reportBookList,
  InstanceAction,
  Report
} from "miroir-core";

import {
  addEntitiesAndInstances,
  DisplayLoadingInfo,
  loadTestConfigFiles,
  deleteAndCloseApplicationDeployments,
  resetApplicationDeployments,
  createMiroirDeploymentGetPersistenceStoreControllerDEFUNCT,
  miroirBeforeEach_resetAndInitApplicationDeployments,
  renderWithProviders
} from "miroir-standalone-app/tests/utils/tests-utils";


// import { refreshAllInstancesTest } from "./DomainController.Data.CRUD.React.functions";

import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";

import { LocalCache } from "miroir-localcache-redux";
import { TestUtilsTableComponent } from "../utils/TestUtilsTableComponent.js";

import { loglevelnext } from '../../src/loglevelnextImporter.js';
import { log } from "console";


// jest intercepts logs, only console.log will produce test output
// const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainController.Data.CRUD.React");
// let log:LoggerInterface = console as any as LoggerInterface;
// MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
//   (value: LoggerInterface) => {
//     log = value;
//   }
// );


// const env:any = (import.meta as any).env
// console.log("@@@@@@@@@@@@@@@@@@ env", env);

// const {miroirConfig, logConfig:loggerOptions} = await loadTestConfigFiles(env);

// MiroirLoggerFactory.setEffectiveLoggerFactory(
//   loglevelnext,
//   (defaultLevels as any)[loggerOptions.defaultLevel],
//   loggerOptions.defaultTemplate,
//   loggerOptions.specificLoggerOptions
// );

// console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

// miroirAppStartup();
// miroirCoreStartup();
// miroirFileSystemStoreSectionStartup();
// miroirIndexedDbStoreSectionStartup();
// miroirPostgresStoreSectionStartup();


// let localMiroirPersistenceStoreController: PersistenceStoreControllerInterface;
// let localAppPersistenceStoreController: PersistenceStoreControllerInterface;
// let localDataStoreServer: any /**SetupServerApi | undefined */;
// let localDataStoreWorker: SetupWorkerApi | undefined;
// let localCache: LocalCache;
// let domainController: DomainControllerInterface;
// let miroirContext: MiroirContext;

// beforeAll(
//   async () => {
//     // Establish requests interception layer before all tests.
//     const wrapped = await createMiroirDeploymentGetPersistenceStoreControllerDEFUNCT(
//       miroirConfig as MiroirConfigClient,
//       setupServer,
//     );
//     if (wrapped) {
//       if (wrapped.localMiroirPersistenceStoreController && wrapped.localAppPersistenceStoreController) {
//         localMiroirPersistenceStoreController = wrapped.localMiroirPersistenceStoreController;
//         localAppPersistenceStoreController = wrapped.localAppPersistenceStoreController;
//       }
//       localCache = wrapped.localCache;
//       miroirContext = wrapped.miroirContext;
//       domainController = wrapped.domainController;
//       localDataStoreWorker = wrapped.localDataStoreWorker as SetupWorkerApi;
//       localDataStoreServer = wrapped.localDataStoreServer as SetupServerApi;
//     } else {
//       throw new Error("beforeAll failed initialization!");
//     }

//     return Promise.resolve();
//   }
// )

// beforeEach(
//   async () => {
//     await miroirBeforeEach_resetAndInitApplicationDeployments(miroirConfig, domainController, localMiroirPersistenceStoreController,localAppPersistenceStoreController);
//   }
// )

// afterAll(
//   async () => {
//     await deleteAndCloseApplicationDeployments(miroirConfig, domainController, localMiroirPersistenceStoreController,localAppPersistenceStoreController,localDataStoreServer);
//   }
// )

// afterEach(
//   async () => {
//     await resetApplicationDeployments(miroirConfig, domainController, localMiroirPersistenceStoreController, localAppPersistenceStoreController);
//   }
// )

// const globalTimeOut = 10000;

describe.sequential("Mustache.unit", () => {
  // ###########################################################################################
  // it("simple template", async () => {

  //   // function nested_template(template_string: string, translate: any) {
  //   //   return function() {
  //   //     return function(text: string, render: any) {
  //   //       return Mustache.render(template_string, translate(render(text)));
  //   //     };
  //   //   };
  //   // }
  //   const transformer = "found: {{name}}"

  //   const result = Mustache.render(transformer, { name: "Joe" });
  //   expect(result).toBe("found: Joe");
  // }); //  end describe('DomainController.Data.CRUD.React',

  it("nested template", async () => {

    function nested_template(template_string: string, translate: any) {
      return function() {
        return function(text: string, render: any) {
          return Mustache.render(template_string, translate(render(text)));
        };
      };
    }
    const globalTES5Transformer = "{{#func}}{{fieldName}}{{/func}}"
    const globalTransformer = "{{#func}} for field {{tempResult}} found value: {{/func}}"
    const localTransformer = "{{fieldName}}"
    const result = Mustache.render(globalTransformer, {
      // func: (text: string) => "what? " + text,
      // func: () => (text: string, render: any) => "AAAAAAAAAAAAAAAA",
      // func: () => (text: string, render: any) => "A" + render(text),
      func: nested_template(localTransformer, (text: string) => ({ tempResult: text })),
      sourceObject: { firstName: "Joe", lastName: "Pesci" },
      fieldName: "firstName",
    });

    console.log("result", result);
    expect(result).toBe("found: Joe");
  }); //  end describe('DomainController.Data.CRUD.React',
});
