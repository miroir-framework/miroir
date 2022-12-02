import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import { all, takeEvery } from 'redux-saga/effects'
import entitySlice, { fetchMiroirEntitiesGen, miroirEntitiesActions } from 'src/miroir-fwk/entities/entitySlice'

const sagaMiddleware = createSagaMiddleware()


export const store = configureStore(
  {
    reducer: {
      miroirEntities: entitySlice,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sagaMiddleware)
  }
)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export function* rootSaga() {
  yield all([
    takeEvery(miroirEntitiesActions.fetchMiroirEntities, fetchMiroirEntitiesGen)
  ])
}
sagaMiddleware.run(rootSaga)
