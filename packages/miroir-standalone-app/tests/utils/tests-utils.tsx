import type { RenderOptions } from '@testing-library/react'
import { render } from '@testing-library/react'
import React, { PropsWithChildren, useState } from 'react'
import { Provider } from 'react-redux'

// As a basic setup, import your same slice reducers
import { ReduxStoreWithUndoRedo } from 'miroir-redux'
import { DataStoreInterface, DomainControllerInterface, MiroirConfig, MiroirContext, circularReplacer } from 'miroir-core'
import { RequestHandler, SetupWorkerApi } from 'msw'
import { SetupServerApi } from 'msw/lib/node'
import { createMswStore, createMwsStoreReturnType } from '../../src/miroir-fwk/createStore'

// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  store: ReduxStoreWithUndoRedo,
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    store,
    ...renderOptions
  }: ExtendedRenderOptions
) {
  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return <Provider store={store}>{children}</Provider>
  }

  // Return an object with the store and all of RTL's query functions
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

export class LoadingStateInterface {
  loaded: boolean;
  step: number;
}

const loadingStateContext = React.createContext<{loadingStateService:LoadingStateInterface}>({loadingStateService:{loaded:false,step:0}});

export const DisplayLoadingInfo:React.FC<{reportUuid?:string}> = (props:{reportUuid?:string}) => {
  const [step,setStep] = useState(0);
  const [loaded,setLoaded] = useState(false);
  return (
    <div>
      <button onClick={()=>setStep(step+1)} name={'next step '+props.reportUuid} role='button'>{'next step '+props.reportUuid}</button>
      <span role={"step:" + step}>loaded step:{step}</span>
      <span>loaded:{loaded ? "finished" : "not"}</span>
    </div>
  );
}

export async function miroirBeforeAll(
  miroirConfig: MiroirConfig,
  platformType: "browser" | "nodejs",
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
  createRestServiceFromHandlers: (...handlers: Array<RequestHandler>) => any
):Promise<createMwsStoreReturnType|undefined> {
  try {
    // const wrapped = await createMswStore(
    const {
      localDataStore,
      localDataStoreWorker,
      localDataStoreServer,
      reduxStore,
      localAndRemoteController,
      domainController,
      miroirContext,
    } = await createMswStore(
      miroirConfig as MiroirConfig,
      'nodejs',
      fetch,
      createRestServiceFromHandlers
    );

    localDataStoreServer?.listen();
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ localDataStore.open',JSON.stringify(localDataStore, circularReplacer()));
    await localDataStore.open();
    return Promise.resolve({
      localDataStore,
      localDataStoreWorker,
      localDataStoreServer,
      reduxStore,
      localAndRemoteController,
      domainController,
      miroirContext,
    });
  } catch (error) {
    console.error('Error beforeAll',error);
  }
  console.log('Done beforeAll');
  return Promise.resolve(undefined);
}

export async function miroirBeforeEach(
  localDataStore: DataStoreInterface,
) {
  try {
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ localDataStore.init');
    await localDataStore.start();
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ localDataStore.clear');
    await localDataStore.clear();
  } catch (error) {
    console.error('beforeEach',error);
  }
  console.log('Done beforeEach');
}

export async function miroirAfterEach(
  localDataStore: DataStoreInterface,
) {
  try {
    // await localDataStore?.close();
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ localDataStore.clear');
    await localDataStore.clear();
  } catch (error) {
    console.error('Error afterEach',error);
  }
  console.log('Done afterEach');
}

export async function miroirAfterAll(
  localDataStore: DataStoreInterface,
  localDataStoreServer: SetupServerApi,
) {
  try {
    await localDataStore.dropModel();
    localDataStoreServer?.close();
    localDataStore.close();
  } catch (error) {
    console.error('Error afterAll',error);
  }
  console.log('Done afterAll');
}

