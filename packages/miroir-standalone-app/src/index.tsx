import { Container } from "@mui/material";
import { setupWorker } from "msw";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { v4 as uuidv4 } from 'uuid';

import {
  DomainAction,
  entityEntity,
  entityReport, Instance, MiroirConfig, miroirCoreStartup,
  reportEntityList,reportReportList
} from "miroir-core";

import entityAuthor from "assets/entities/Author.json"
import entityBook from "assets/entities/Book.json"
import reportBookList from "assets/reports/BookList.json"
import author1 from "assets/instances/Author - Cornell Woolrich.json"
import author2 from "assets/instances/Author - Don Norman.json"
import author3 from "assets/instances/Author - Paul Veyne.json"
import book1 from "assets/instances/Book - The Bride Wore Black.json"
import book2 from "assets/instances/Book - The Design of Everyday Things.json"
import book3 from "assets/instances/Book - Et dans l'éternité.json"
import book4 from "assets/instances/Book - Rear Window.json"
import { MComponent } from "miroir-fwk/4_view/MComponent";
import { MiroirContextReactProvider } from "miroir-fwk/4_view/MiroirContextReactProvider";
import miroirConfig from "assets/miroirConfig.json";
import { createMswStore } from "miroir-fwk/createStore";
import { miroirAppStartup } from "startup";

console.log("entityEntity", JSON.stringify(entityEntity));
const container = document.getElementById("root");
const root = createRoot(container);

async function start() {
  // Start our mock API server
  // const mServer: IndexedDbObjectStore = new IndexedDbObjectStore(miroirConfig.rootApiUrl);


  miroirAppStartup();
  miroirCoreStartup();

  let mReduxStore,myMiroirContext;
  if (process.env.NODE_ENV === "development") {

    const { mServer, worker, reduxStore, dataController, domainController, miroirContext } = createMswStore(
      miroirConfig as MiroirConfig,
      window.fetch.bind(window),
      setupWorker
    );
    mReduxStore = reduxStore;
    myMiroirContext = miroirContext;

    // const mswWorker = setupWorker(...mServer.handlers);
    console.log('##############################################');
    worker.printHandlers(); // Optional: nice for debugging to see all available route handlers that will be intercepted
    console.log('##############################################');
    await worker.start();
    await mServer.createObjectStore(["Entity", "Instance", "Report", "Author", "Book"]);
    await mServer.clearObjectStore();
    await mServer.localIndexedDb.putValue("Entity", entityEntity);
    await mServer.localIndexedDb.putValue("Entity", entityReport);
    await mServer.localIndexedDb.putValue("Report", reportEntityList);
    await mServer.localIndexedDb.putValue("Report", reportReportList);
    await mServer.localIndexedDb.putValue("Entity", entityAuthor);
    await mServer.localIndexedDb.putValue("Entity", entityBook);
    await mServer.localIndexedDb.putValue("Report", reportBookList);
    await mServer.localIndexedDb.putValue("Author", author1);
    await mServer.localIndexedDb.putValue("Author", author2);
    await mServer.localIndexedDb.putValue("Author", author3);
    await mServer.localIndexedDb.putValue("Book", book1);
    await mServer.localIndexedDb.putValue("Book", book2);
    await mServer.localIndexedDb.putValue("Book", book3);
    await mServer.localIndexedDb.putValue("Book", book4);

    // await dataController.loadConfigurationFromRemoteDataStore();
    // domainController.handleDomainAction({
    //   actionName:'create',
    //   objects:[{entity:'Report',instances:[reportEntityList]}]
    // })
    const updateAction: DomainAction = {
      actionName: "update",
      objects: [
        {
          entity: "Report",
          instances: [
            {
              "uuid": "74b010b6-afee-44e7-8590-5f0849e4a5c9",
              "entity":"Report",
              "name":"BookList",
              "defaultLabel": "List of Books 2",
              "type": "list",
              "definition": {
                "entity": "Book"
              }
            } as Instance,
          ],
        },
      ],
    };
    await domainController.handleDomainAction(updateAction);

    // await dataController.loadConfigurationFromRemoteDataStore();
    await domainController.handleDomainAction({actionName: "replace"});
    root.render(
      <Provider store={mReduxStore.getInnerStore()}>
        <div>
          <h1>Miroir standalone demo app {uuidv4()}</h1>
          {/* <h1>Miroir standalone demo app</h1> */}
          <Container maxWidth="xl">
            <MiroirContextReactProvider miroirContext={myMiroirContext}>
              {/* store={mReduxStore.getInnerStore() */}
              <span>transactions: {JSON.stringify(domainController.currentTransaction())}</span>
              <p/>
              <span>cache size: {JSON.stringify(domainController.currentLocalCacheInfo())}</span>
              <MComponent 
                reportName="BookList"
                // reportName="EntityList"
            ></MComponent>
            </MiroirContextReactProvider>
          </Container>
        </div>
      </Provider>
    );
  } else {
    root.render(
      <span>Production mode not implemented yet!</span>
    )
  }

}

start();