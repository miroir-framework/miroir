import { configureStore } from '@reduxjs/toolkit'
import entitySlice, { miroirEntitiesAdapter } from '../entities/entitySlice'

// import { combineReducers } from '@reduxjs/toolkit'
// const rootReducer = combineReducers({})
// export type RootState = ReturnType<typeof entitySlice>


export const store = configureStore({
  reducer: {
    miroirEntities: entitySlice,
  },
})

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