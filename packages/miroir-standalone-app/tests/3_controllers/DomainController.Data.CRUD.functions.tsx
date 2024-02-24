import path from "path";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";


import {
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  author1,
  author2,
  author3,
  book1,
  book2,
  book3,
  book4,
  DomainAction,
  DomainControllerInterface,
  DomainDataNonTransactionalCUDAction,
  entityAuthor,
  entityBook,
  EntityDefinition,
  entityDefinitionAuthor,
  entityDefinitionBook,
  EntityInstance,
  getLoggerName,
  StoreControllerInterface,
  LoggerInterface,
  MetaEntity,
  MiroirConfigClient,
  MiroirContext,
  MiroirLoggerFactory,
  reportBookList
} from "miroir-core";
import { ReduxStore } from "miroir-localcache-redux";

import {
  DisplayLoadingInfo,
  renderWithProviders
} from "miroir-standalone-app/tests/utils/tests-utils";
import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";
import { packageName } from "../../src/constants";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainController.Data.CRUD.functions");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

export async function refreshAllInstancesTest(
  miroirConfig: MiroirConfigClient,
  localMiroirStoreController: StoreControllerInterface,
  localAppStoreController: StoreControllerInterface,
  reduxStore: ReduxStore,
  domainController: DomainControllerInterface,
  miroirContext: MiroirContext
) {
  try {
    log.info("Refresh all Instances start");
    const displayLoadingInfo = <DisplayLoadingInfo />;
    const user = userEvent.setup();

    // await localDataStore.clear();
    // await localDataStore.initModel();
    if (miroirConfig.client.emulateServer) {
      await localAppStoreController.createEntity(entityAuthor as MetaEntity, entityDefinitionAuthor as EntityDefinition);
      await localAppStoreController.createEntity(entityBook as MetaEntity, entityDefinitionBook as EntityDefinition);
      await localAppStoreController?.upsertInstance('model', reportBookList as EntityInstance);
      await localAppStoreController?.upsertInstance('data', author1 as EntityInstance);
      await localAppStoreController?.upsertInstance('data', author2 as EntityInstance);
      await localAppStoreController?.upsertInstance('data', author3 as EntityInstance);
      await localAppStoreController?.upsertInstance('data', book1 as EntityInstance);
      await localAppStoreController?.upsertInstance('data', book2 as EntityInstance);
      // await localAppStoreController?.upsertInstance('data', book3 as Instance);
      await localAppStoreController?.upsertInstance('data', book4 as EntityInstance);
    } else {
      const createAction: DomainAction = {
        actionType:"DomainTransactionalAction",
        actionName: "modelActionUpdateEntity",
        update: {
          actionName:"WrappedTransactionalModelActionEntityUpdate",
          modelEntityUpdate: {
            actionType: "modelAction",
            actionName: "createEntity",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            entities: [
              {entity:entityAuthor as MetaEntity, entityDefinition:entityDefinitionAuthor as EntityDefinition},
              {entity:entityBook as MetaEntity, entityDefinition:entityDefinitionBook as EntityDefinition},
            ],
          },
        }
      };

      await act(
        async () => {
          await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, createAction, reduxStore.currentModel(applicationDeploymentLibrary.uuid));
          await domainController.handleDomainAction(
            applicationDeploymentLibrary.uuid,
            { actionType: "modelAction", actionName: "commit", endpoint: "7947ae40-eb34-4149-887b-15a9021e714e", },
            reduxStore.currentModel(applicationDeploymentLibrary.uuid)
          );
        }
      );

      const createInstancesAction: DomainDataNonTransactionalCUDAction = {
        actionType: "DomainDataNonTransactionalCUDAction",
        actionName: "create",
        objects: [
          {
            parentName: entityAuthor.name,
            parentUuid: entityAuthor.uuid,
            applicationSection: "data",
            instances: [
              author1 as EntityInstance,
              author2 as EntityInstance,
              author3 as EntityInstance,
            ],
          },
          {
            parentName: entityBook.name,
            parentUuid: entityBook.uuid,
            applicationSection: "data",
            instances: [
              book1 as EntityInstance,
              book2 as EntityInstance,
              book4 as EntityInstance,
            ],
          },
        ],
      };

      await act(
        async () => {
          await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, createInstancesAction);
        }
      );
    }

    log.info("Refresh all Instances setup is finished.")

    // log.info(
    //   'after test preparation',
    //   await localAppStoreController?.getState()
    // );
    const {
      getByText,
      getAllByRole,
      // container
    } = renderWithProviders(
      <TestUtilsTableComponent
        entityName={entityBook.name}
        entityUuid={entityBook.uuid}
        DisplayLoadingInfo={displayLoadingInfo}
        deploymentUuid={applicationDeploymentLibrary.uuid}
      />,
      { store: reduxStore.getInnerStore() }
    );

    log.info("Refresh all Instances setup is finished.")

    await act(async () => {
      await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
        actionType: "modelAction",
        actionName: "rollback",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      });
      await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
        actionType: "modelAction",
        actionName: "rollback",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      });
    });

    log.info("Refresh all Instances start", JSON.stringify(reduxStore.getState()));
    
    await act(()=>user.click(screen.getByRole("button")));

    await waitFor(() => {
      getAllByRole(/step:1/);
    }).then(() => {
      expect(screen.queryByText(new RegExp(`${book3.uuid}`, "i"))).toBeNull(); // Et dans l'éternité je ne m'ennuierai pas
      expect(getByText(new RegExp(`${book1.uuid}`, "i"))).toBeTruthy(); // The Bride Wore Black
      expect(getByText(new RegExp(`${book2.uuid}`, "i"))).toBeTruthy(); // The Design of Everyday Things
      expect(getByText(new RegExp(`${book4.uuid}`, "i"))).toBeTruthy(); // Rear Window
    });
  } catch (error) {
    log.error("error during test", expect.getState().currentTestName, error);
    expect(false).toBeTruthy();
  }
  return Promise.resolve();
}

