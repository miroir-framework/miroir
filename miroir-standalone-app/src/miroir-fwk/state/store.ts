import { configureStore } from '@reduxjs/toolkit'
import entitySlice from '../entities/entitySlice'

// import { combineReducers } from '@reduxjs/toolkit'
// const rootReducer = combineReducers({})
export type RootState = ReturnType<typeof entitySlice>


export const store = configureStore({
  reducer: {
    entities: entitySlice,
  },
})

// // Infer the `RootState` and `AppDispatch` types from the store itself
// export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch