import { combineReducers, configureStore, Store } from '@reduxjs/toolkit'
import createSagaMiddleware, { Channel, channel } from 'redux-saga'
import { all, call } from 'redux-saga/effects'
import entitySlice, { EntitySlice } from '../entities/entitySlice'
// import entitySlice, { EntitySlice } from 'src/miroir-fwk/entities/entitySlice'
import instanceSlice, { InstanceSlice } from '../entities/instanceSlice'
import { createUndoableReducer } from './undoableReducer'

// const sagaMiddleware = createSagaMiddleware()
// const staticReducers = createUndoableReducer(
//   combineReducers(
//     {
//       miroirEntities: entitySlice,
//       miroirInstances: instanceSlice,
//     }
//   )
// );

// interface MiroirStore extends Store {

// }
// export const store:MiroirStore = <MiroirStore>configureStore(
//   {
//     reducer: staticReducers,
//     middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(asyncDispatchMiddleware).concat(sagaMiddleware)
//   }
// )

// export type RootState = ReturnType<typeof store.getState>
// export type AppDispatch = typeof store.dispatch

// export function* rootSaga() {
//   yield all([
//     entityRootSaga(),
//     instanceRootSaga(),
//   ])
// }
// sagaMiddleware.run(rootSaga)


// const monitorReducerEnhancer =
//   createStore => (reducer, initialState, enhancer) => {
//     const monitoredReducer = (state, action) => {
//       const start = performance.now()
//       const newState = reducer(state, action)
//       const end = performance.now()
//       const diff = round(end - start)

//       console.log('reducer process time:', diff)

//       return newState
//     }

//     return createStore(monitoredReducer, initialState, enhancer)
//   }

// const bindMiddleware = (middlewares: Middleware[]) => {
//   if (process.env.NODE_ENV !== 'production') {
//     const { composeWithDevTools } = require('redux-devtools-extension')
//     return composeWithDevTools(applyMiddleware(...middlewares))
//   }
//   return applyMiddleware(...middlewares)
// }


// function saveToLocalStorage(state = {}) {
//   try {
//     const data = JSON.stringify(_omit(state, ['department', 'category', 'product', 'attribute', 'order', 'customer.error' ]));
//     const serializedData = btoa(`turing:${data}`);
//     localStorage.setItem('state', serializedData);
//   } catch (e) {}
// }

// // loads state from local storage
// function loadFromLocalStorage() {
//   try {
//     const serializedState = localStorage.getItem('state');
//     if (serializedState === null) {
//       return undefined;
//     }
//     const state = atob(serializedState).replace(/^turing:/, '');
    
//     return JSON.parse(state);
//   } catch (e) {
//     try { localStorage.removeItem('state'); } catch (err) {}
//     return undefined;
//   }
// }

/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
declare interface MstoreI {
  entitySliceObject: EntitySlice,
  instanceSliceObject: InstanceSlice,
}

export class Mstore implements MstoreI{
  public store:Store;
  public staticReducers:any;
  public sagaMiddleware:any;
  public dispatch: typeof this.store.dispatch;
  public asyncDispatchMiddleware:any;//TODO: set proper type

  constructor(
    public entitySliceObject: EntitySlice,
    public instanceSliceObject: InstanceSlice,
  ) {

    this.staticReducers = createUndoableReducer(
      combineReducers(
        {
          miroirEntities: entitySlice,
          miroirInstances: instanceSlice,
        }
      )
    );
    this.sagaMiddleware = createSagaMiddleware()

    this.store = configureStore(
      {
        reducer: this.staticReducers,
        middleware: (getDefaultMiddleware) => (
          getDefaultMiddleware()
          .concat(this.sagaMiddleware)
        )
      }
    );
    this.dispatch = this.store.dispatch;
  } //end constructor

  public *rootSaga(_this:Mstore):any {
    console.log("Mstore rootSaga");
    const sliceChannel:Channel<any> = yield call(channel);
    yield all(
      [
        _this.entitySliceObject.entityRootSaga(_this.entitySliceObject, sliceChannel),
        _this.instanceSliceObject.instanceRootSaga(_this.instanceSliceObject, sliceChannel),
      ]
    );
  }
}