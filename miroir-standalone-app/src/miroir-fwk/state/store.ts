import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { ToolkitStore } from '@reduxjs/toolkit/dist/configureStore'
import createSagaMiddleware from 'redux-saga'
import { all } from 'redux-saga/effects'
import entitySlice, { entityRootSaga } from 'src/miroir-fwk/entities/entitySlice'
import instanceSlice, { instanceRootSaga } from '../entities/instanceSlice'
import asyncDispatchMiddleware from './asyncDispatchMiddleware'

const sagaMiddleware = createSagaMiddleware()
const staticReducers = combineReducers(
  {
    miroirEntities: entitySlice,
    miroirInstances: instanceSlice,
  }
)

interface MiroirStore extends ToolkitStore {
}
export const store:MiroirStore = <MiroirStore>configureStore(
  {
    reducer: staticReducers,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(asyncDispatchMiddleware).concat(sagaMiddleware)
  }
)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export function* rootSaga() {
  yield all([
    entityRootSaga(),
    instanceRootSaga(),
  ])
}
sagaMiddleware.run(rootSaga)
