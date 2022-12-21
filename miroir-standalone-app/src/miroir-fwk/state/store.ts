import { combineReducers, configureStore, Store } from '@reduxjs/toolkit'
import createSagaMiddleware, { Channel, channel } from 'redux-saga'
import { all, call } from 'redux-saga/effects'
import { EntitySlice } from '../entities/entitySlice'
// import entitySlice, { EntitySlice } from 'src/miroir-fwk/entities/entitySlice'
import { InstanceSlice } from '../entities/instanceSlice'
import { createUndoableReducer } from './undoableReducer'
import { omit as _omit } from 'lodash';

// function saveToLocalStorage(state = {}) {
//   try {
//     // const data = JSON.stringify(_omit(state, ['department', 'category', 'product', 'attribute', 'order', 'customer.error' ]));
//     const data = JSON.stringify(state);
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
declare interface MreduxStoreI {
  entitySliceObject: EntitySlice,
  instanceSliceObject: InstanceSlice,
}
// const persistedState = loadFromLocalStorage();


export class MreduxStore implements MreduxStoreI{
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
          miroirEntities: entitySliceObject.mEntitiesSlice.reducer,
          miroirInstances: instanceSliceObject.mInstanceSlice.reducer,
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

    // create indexedDb local storage, in the case the DB accessed through REST runs in a distinct process.
    // if REST API accesses the indexedDb local storage itself, then the Redux store systematically invalidates
    // any data found in it, and thus re-calls the Rest API for any access. The Redux store is then not used,
    // at least not as a store.

  } //end constructor

  public *rootSaga(_this:MreduxStore):any {
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