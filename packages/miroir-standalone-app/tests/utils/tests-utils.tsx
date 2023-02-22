import type { RenderOptions } from '@testing-library/react'
import { render } from '@testing-library/react'
import React, { PropsWithChildren, useState } from 'react'
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
  // loadingStateService: LoadingStateInterface,
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
    // loadingStateService,
    ...renderOptions
  }: ExtendedRenderOptions
) {
  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return <Provider store={store}>{children}</Provider>
    // return <LoadingStateServiceReactProvider loadingStateService={loadingStateService}> <Provider store={store}>{children}</Provider> </LoadingStateServiceReactProvider>
  }

  // Return an object with the store and all of RTL's query functions
  return render(ui, { wrapper: Wrapper, ...renderOptions })
  // return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}

export class LoadingStateInterface {
  loaded: boolean;
  step: number;
}
// export class LoadingStateService {
//   private loaded: boolean = false;
//   private step: number = 0;

//   private loadingStateContext = React.createContext<{loadingStateService:LoadingStateService}>(undefined);

//   constructor() {
    
//   }

//   public setLoaded(loaded:boolean) {
//     console.log("LoadingStateService setLoaded",loaded);
//     this.loaded = loaded;
//   }

//   public setStep(step:number) {
//     console.log("LoadingStateService setStep",step);
//     this.step = step;
//   }

//   public getLoaded():boolean {
//     // console.log("ErrorLogService getErrorLog() called",this.errorLog);
//     return this.loaded;
//   }
  
//   public getStep():number {
//     // console.log("ErrorLogService getErrorLog() called",this.errorLog);
//     return this.step;
//   }

//   public getLoadedState():LoadingStateInterface {
//     // console.log("ErrorLogService getErrorLog() called",this.errorLog);
//     return {loaded:this.getLoaded(),step:this.getStep()};
//   }

// }

const loadingStateContext = React.createContext<{loadingStateService:LoadingStateInterface}>(undefined);

// export const LoadingStateServiceReactProvider = (
//   props: {
//     loadingStateService:LoadingStateInterface;
//     children:
//       | string
//       | number
//       | boolean
//       | React.ReactElement<any, string | React.JSXElementConstructor<any>>
//       | React.ReactFragment
//       | React.ReactPortal;
//   }
// ) => {
//   const value = {
//     loadingStateService: props.loadingStateService || {loaded:false, step:0},
//   };
//   return <loadingStateContext.Provider value={value}>{props.children}</loadingStateContext.Provider>;
// }

export const DisplayLoadingInfo:React.FC<{}> = () => {
  const [step,setStep] = useState(0);
  const [loaded,setLoaded] = useState(false);
  return (
    <div>
      <button onClick={()=>setStep(step+1)} name='next step' role='button'></button>
      <span role={"step:" + step}>loaded step:{step}</span>
      <span>loaded:{loaded ? "finished" : "not"}</span>
    </div>
  );
}

// export const DisplayLoadingInfo:React.FC<{loadingState:LoadingStateInterface}> = ({loadingState: loadingStateService}) => {
//   return <div><span role={'step:' + loadingStateService.step}>loaded step:{loadingStateService.step}</span><span>loaded:{loadingStateService.loaded?'finished':'not'}</span></div>
// }

// export const useLoadingStateServiceHook = () => {
//   // return React.useContext(miroirReactContext).miroirContext.errorLogService.errorLog;
//   console.log('useLoadingStateServiceHook called')
//   return React.useContext(loadingStateContext).loadingStateService.getLoadedState();
// }

