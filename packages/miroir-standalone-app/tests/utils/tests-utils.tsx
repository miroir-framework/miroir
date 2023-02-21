import type { RenderOptions } from '@testing-library/react'
import { render } from '@testing-library/react'
import React, { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'

// import type { AppStore, RootState } from '../app/store'
// As a basic setup, import your same slice reducers
import { ReduxStoreWithUndoRedo } from 'miroir-redux'
// import userReducer from '../features/users/userSlice'
// const store:MreduxStore = new MreduxStore(entitySagas,instanceSagas);

// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  // preloadedState?: PreloadedState<RootState>
  // store?: AppStore
  // preloadedState?: PreloadedState<ReduxStateWithUndoRedo>
  store: ReduxStoreWithUndoRedo,
  loadingStateService: LoadingStateService,
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    // preloadedState = mReduxWithUndoRedoGetInitialState(),
    // // Automatically create a store instance if no store was passed in
    // store = configureStore({ reducer: { user: userReducer }, preloadedState }),
    // preloadedState,
    // Automatically create a store instance if no store was passed in
    store,
    loadingStateService,
    ...renderOptions
  }: ExtendedRenderOptions
) {
  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    // return <Provider store={store}>{children}</Provider>
    return <LoadingStateServiceReactProvider loadingStateService={loadingStateService}> <Provider store={store}>{children}</Provider> </LoadingStateServiceReactProvider>
  }

  // Return an object with the store and all of RTL's query functions
  return render(ui, { wrapper: Wrapper, ...renderOptions })
  // return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}

export class LoadingStateService {
  private loaded: boolean = false;

  constructor() {
    
  }

  public setLoaded(loaded:boolean) {
    console.log("LoadingStateService setLoaded",loaded);
    this.loaded = loaded;
  }

  public getState():boolean {
    // console.log("ErrorLogService getErrorLog() called",this.errorLog);
    return this.loaded;
  }
  
}

const loadingStateContext = React.createContext<{loadingStateService:LoadingStateService}>(undefined);

export function LoadingStateServiceReactProvider(
  props: {
    loadingStateService:LoadingStateService;
    children:
      | string
      | number
      | boolean
      | React.ReactElement<any, string | React.JSXElementConstructor<any>>
      | React.ReactFragment
      | React.ReactPortal;
  }
) {
  const value = {
    loadingStateService: props.loadingStateService || new LoadingStateService(),
  };
  return <loadingStateContext.Provider value={value}>{props.children}</loadingStateContext.Provider>;
}

export const useLoadingStateServiceHook = () => {
  // return React.useContext(miroirReactContext).miroirContext.errorLogService.errorLog;
  return React.useContext(loadingStateContext).loadingStateService.getState();
}
