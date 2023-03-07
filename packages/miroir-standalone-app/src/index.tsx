import { Container } from "@mui/material";
import { setupWorker } from "msw";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { v4 as uuidv4 } from 'uuid';

import {
  DomainAction,
  DomainControllerInterface,
  entityEntity,
  entityReport, Instance, MiroirConfig, miroirCoreStartup,
  reportEntityList, reportReportList
} from "miroir-core";

import entityAuthor from "assets/entities/Author.json";
import entityBook from "assets/entities/Book.json";
import author1 from "assets/instances/Author - Cornell Woolrich.json";
import author2 from "assets/instances/Author - Don Norman.json";
import author3 from "assets/instances/Author - Paul Veyne.json";
import book3 from "assets/instances/Book - Et dans l'éternité.json";
import book4 from "assets/instances/Book - Rear Window.json";
import book1 from "assets/instances/Book - The Bride Wore Black.json";
import book2 from "assets/instances/Book - The Design of Everyday Things.json";
import miroirConfig from "assets/miroirConfig.json";
import reportAuthorList from "assets/reports/AuthorList.json";
import reportBookList from "assets/reports/BookList.json";
import { MComponent } from "miroir-fwk/4_view/MComponent";
import { MiroirContextReactProvider } from "miroir-fwk/4_view/MiroirContextReactProvider";
import { createMswStore } from "miroir-fwk/createStore";
import { miroirAppStartup } from "startup";

console.log("entityEntity", JSON.stringify(entityEntity));
const container = document.getElementById("root");
const root = createRoot(container);

async function uploadConfiguration(domainController:DomainControllerInterface) {
  const updateEntitiesAction: DomainAction = {
    actionName: "create",
    objects: [
      {
        entity: "Entity",
        instances: [
          entityEntity as Instance,
          entityReport as Instance,
          // entityAuthor as Instance,
          // entityBook as Instance
        ],
      },
      {
        entity: "Report",
        instances: [
          reportEntityList as Instance,
          reportReportList as Instance,
        ],
      },
    ],
  };
  await domainController.handleDomainAction(updateEntitiesAction);
  await domainController.handleDomainAction({actionName: "commit"});
}

async function uploadBooksAndReports(domainController:DomainControllerInterface) {
  const updateEntitiesAction: DomainAction = {
    actionName: "create",
    objects: [
      {
        entity: "Entity",
        instances: [
          entityAuthor as Instance,
          entityBook as Instance
        ],
      },
    ],
  };
  await domainController.handleDomainAction(updateEntitiesAction);
  await domainController.handleDomainAction({actionName: "commit"});
  const updateInstancesAction: DomainAction = {
    actionName: "create",
    objects: [
      {
        entity: "Author",
        instances: [
          author1 as Instance,
          author2 as Instance,
          author3 as Instance,
        ],
      },
      {
        entity: "Book",
        instances: [
          book1 as Instance,
          book2 as Instance,
          book3 as Instance,
          book4 as Instance,
        ],
      },
      {
        entity: "Report",
        instances: [
          reportAuthorList as Instance,
          reportBookList as Instance,
        ],
      },
    ],
  };
  await domainController.handleDomainAction(updateInstancesAction);
  // await domainController.handleDomainAction({actionName: "commit"});
}

async function start() {
  // Start our mock API server
  // const mServer: IndexedDbObjectStore = new IndexedDbObjectStore(miroirConfig.rootApiUrl);

  miroirAppStartup();
  miroirCoreStartup();

  if (process.env.NODE_ENV === "development") {

    const {
      mServer,
      worker,
      reduxStore: mReduxStore,
      dataController,
      domainController,
      miroirContext: myMiroirContext,
    } = createMswStore(miroirConfig as MiroirConfig, window.fetch.bind(window), setupWorker);

    // const mswWorker = setupWorker(...mServer.handlers);
    if (!!worker) {
      console.log('##############################################');
      worker.printHandlers(); // Optional: nice for debugging to see all available route handlers that will be intercepted
      console.log('##############################################');
      await worker.start();
    }
    if (!!mServer) {
      await mServer.createObjectStore(["Entity", "Report"]);
      await mServer.clearObjectStore();
      await mServer.localIndexedDb.putValue("Entity", entityEntity);
      await mServer.localIndexedDb.putValue("Entity", entityReport);
      await mServer.localIndexedDb.putValue("Report", reportEntityList);
      await mServer.localIndexedDb.putValue("Report", reportReportList);
    }

    // load Miroir Configuration
    // await domainController.handleDomainAction({actionName: "replace"});

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
              <p/>
              <span><button onClick={async() => {await uploadConfiguration(domainController)}}>upload Miroir configuration to database</button></span>
              <p/>
              <span><button onClick={async() => {await uploadBooksAndReports(domainController)}}>upload App configuration to database</button></span>
              <p/>
              <span><button onClick={async() => {await domainController.handleDomainAction({actionName: "replace"})}}>fetch Miroir & App configurations from database</button></span>
              <p/>
              <MComponent 
                // reportName="AuthorList"
                // reportName="BookList"
                reportName="EntityList"
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