import { applyMiddleware, configureStore } from '@reduxjs/toolkit'
import entitySlice, { miroirEntitiesAdapter } from '../entities/entitySlice'
import createSagaMiddleware from 'redux-saga'
import rootSaga from './sagas'

// import { combineReducers } from '@reduxjs/toolkit'
// const rootReducer = combineReducers({})
// export type RootState = ReturnType<typeof entitySlice>
const sagaMiddleware = createSagaMiddleware()


export const store = configureStore(
  {
    reducer: {
      miroirEntities: entitySlice,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sagaMiddleware)
  }
)

sagaMiddleware.run(rootSaga)


export type RootState = ReturnType<typeof store.getState>

const MiroirEntitiesSelectors = miroirEntitiesAdapter.getSelectors<RootState>((state) => state.miroirEntities)

export const {
  selectAll: selectAllMiroirEntities,
  selectById: selectMiroirEntityById,
} = MiroirEntitiesSelectors

// // Infer the `RootState` and `AppDispatch` types from the store itself
// export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch