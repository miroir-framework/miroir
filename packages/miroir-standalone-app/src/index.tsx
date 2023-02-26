import { Container } from "@mui/material";
import { setupWorker } from "msw";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { v4 as uuidv4 } from 'uuid';

import {
  entityEntity,
  entityReport, miroirCoreStartup,
  reportEntityList,reportReportList
} from "miroir-core";

import entityAuthor from "assets/entities/Author.json"
import entityBook from "assets/entities/Book.json"
import reportBookList from "assets/reports/BookList.json"
import author1 from "assets/instances/Author - Cornell Woolrich.json"
import author2 from "assets/instances/Author - Don Norman.json"
import book1 from "assets/instances/Book - The Bride Wore Black.json"
import book2 from "assets/instances/Book - The Design of Everyday Things.json"
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
      miroirConfig.rootApiUrl,
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
    await mServer.localIndexedDb.putValue("Book", book1);
    await mServer.localIndexedDb.putValue("Book", book2);

    // await dataController.loadConfigurationFromRemoteDataStore();
    // domainController.handleDomainAction({
    //   actionName:'create',
    //   objects:[{entity:'Report',instances:[reportEntityList]}]
    // })
  
    // await dataController.loadConfigurationFromRemoteDataStore();
    await domainController.handleDomainAction({actionName: "replace"});
  }

  root.render(
    <Provider store={mReduxStore.getInnerStore()}>
      <div>
        <h1>Miroir standalone demo app {uuidv4()}</h1>
        {/* <h1>Miroir standalone demo app</h1> */}
        <Container maxWidth="xl">
          <MiroirContextReactProvider miroirContext={myMiroirContext}>
            {/* store={mReduxStore.getInnerStore() */}
            <MComponent 
              reportName="BookList"
              // reportName="EntityList"
          ></MComponent>
          </MiroirContextReactProvider>
        </Container>
      </div>
    </Provider>
  );
}

start();
