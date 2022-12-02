import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import { all, takeEvery } from 'redux-saga/effects'
import entitySlice, { fetchMiroirEntitiesGen, miroirEntityActions } from 'src/miroir-fwk/entities/entitySlice'
import reportSlice, { fetchMiroirReportsGen, miroirReportsActions as miroirReportActions } from '../entities/reportSlice'

const sagaMiddleware = createSagaMiddleware()


export const store = configureStore(
  {
    reducer: {
      miroirEntities: entitySlice,
      miroirReports: reportSlice,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sagaMiddleware)
  }
)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export function* rootSaga() {
  yield all([
    takeEvery(miroirEntityActions.fetchMiroirEntities, fetchMiroirEntitiesGen),
    takeEvery(miroirReportActions.fetchMiroirReports, fetchMiroirReportsGen),
  ])
}
sagaMiddleware.run(rootSaga)
