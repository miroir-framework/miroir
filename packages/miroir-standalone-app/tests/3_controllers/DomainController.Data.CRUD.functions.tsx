/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost/"}
 */
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer, SetupServerApi } from "msw/node";
import React from "react";
import { SetupWorkerApi } from "msw";

const fetch = require("node-fetch");

import { TextDecoder, TextEncoder } from "util";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

import {
  applicationDeploymentMiroir,
  StoreControllerInterface,
  DomainControllerInterface,
  DomainDataAction,
  EntityDefinition,
  EntityInstance,
  LocalAndRemoteControllerInterface,
  MetaEntity,
  MiroirConfig,
  MiroirContext,
  miroirCoreStartup,
} from "miroir-core";
import { ReduxStore } from "miroir-redux";

import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import {
  applicationDeploymentLibrary,
  DisplayLoadingInfo,
  miroirAfterAll,
  miroirAfterEach,
  miroirBeforeAll,
  miroirBeforeEach,
  renderWithProviders,
} from "miroir-standalone-app/tests/utils/tests-utils";
import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";

import entityAuthor from "miroir-standalone-app/src/assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json";
import entityBook from "miroir-standalone-app/src/assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";
import reportBookList from "miroir-standalone-app/src/assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/74b010b6-afee-44e7-8590-5f0849e4a5c9.json";
import entityDefinitionBook from "miroir-standalone-app/src/assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json";
import entityDefinitionAuthor from "miroir-standalone-app/src/assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json";
import config from "miroir-standalone-app/tests/miroirConfig.test.json";
import author1 from "../../src/assets/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json";
import author2 from "../../src/assets/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json";
import author3 from "../../src/assets/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json";
import book3 from "../../src/assets/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/4cb917b3-3c53-4f9b-b000-b0e4c07a81f7.json";
import book4 from "../../src/assets/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json";
import book1 from "../../src/assets/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json";
import book2 from "../../src/assets/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json";
import { createReduxStoreAndRestClient } from "../../src/miroir-fwk/createMswRestServer";

export async function refreshAllInstancesTest(
  localMiroirStoreController: StoreControllerInterface,
  localAppStoreController: StoreControllerInterface,
  reduxStore: ReduxStore,
  domainController: DomainControllerInterface,
  miroirContext: MiroirContext
) {
  try {
    console.log("Refresh all Instances start");
    const displayLoadingInfo = <DisplayLoadingInfo />;
    const user = userEvent.setup();

    // await localDataStore.dropModelAndData();
    // await localDataStore.initModel();

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

    // console.log(
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

    await act(async () => {
      await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
        actionType: "DomainModelAction",
        actionName: "rollback",
      });
      await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
        actionType: "DomainModelAction",
        actionName: "rollback",
      });
    });

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      getAllByRole(/step:1/);
    }).then(() => {
      expect(screen.queryByText(new RegExp(`${book3.uuid}`, "i"))).toBeNull(); // Et dans l'éternité je ne m'ennuierai pas
      expect(getByText(new RegExp(`${book1.uuid}`, "i"))).toBeTruthy(); // The Bride Wore Black
      expect(getByText(new RegExp(`${book2.uuid}`, "i"))).toBeTruthy(); // The Design of Everyday Things
      expect(getByText(new RegExp(`${book4.uuid}`, "i"))).toBeTruthy(); // Rear Window
    });
  } catch (error) {
    console.error("error during test", expect.getState().currentTestName, error);
    expect(false).toBeTruthy();
  }
  return Promise.resolve();
}
