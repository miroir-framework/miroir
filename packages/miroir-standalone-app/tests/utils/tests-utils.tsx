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
  store: ReduxStoreWithUndoRedo
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
    ...renderOptions
  }: ExtendedRenderOptions
) {
  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return <Provider store={store}>{children}</Provider>
  }

  // Return an object with the store and all of RTL's query functions
  return render(ui, { wrapper: Wrapper, ...renderOptions })
  // return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}