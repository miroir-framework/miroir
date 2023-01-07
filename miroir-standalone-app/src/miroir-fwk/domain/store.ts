import { combineReducers, configureStore, EntityState } from '@reduxjs/toolkit'
import createSagaMiddleware, { Channel, channel } from 'redux-saga'
import { all, call } from 'redux-saga/effects'
import { Mentity } from '../core/Entity'
import { EntitySagas } from '../core/EntitySagas'
import EntitySlice, { MEntitySlice } from '../core/EntitySlice'
import { Minstance } from '../core/Instance'
import { InstanceSagas } from '../core/InstanceSagas'
import InstanceSlice, { MinstanceSliceState } from '../core/InstanceSlice'
import { Maction } from '../core/Mslice'
import { createUndoableReducer, MreduxWithUndoRedoReducer, MreduxWithUndoRedoStore } from './undoableReducer'


//#########################################################################################
//# INSTANCE INTERACTOR
//#########################################################################################
/**
 * The external view of the world for the domain model
 */
export interface MdomainInstanceInputActionsI {
  addInstancesForEntity(entityName:string,instances:Minstance[]):void;
  modifyInstancesForEntity(entityName:string,instances:Minstance[]):void;
  replaceInstancesForEntity(entityName:string,instances:Minstance[]):void;
}

export interface MStoreInstanceInputActionsI {
  addInstancesForEntity(entityName:string,instances:Minstance[]):void;
  modifyInstancesForEntity(entityName:string,instances:Minstance[]):void;
  replaceInstancesForEntity(entityName:string,instances:Minstance[]):void;
}

export interface MdomainEntityInputActionsI {
  // addInstancesForEntity(entityName:string,instances:Minstance[]):void;
  // modifyInstancesForEntity(entityName:string,instances:Minstance[]):void;
  replaceEntities(entities:Mentity[]):void;
  
}

export interface MdatastoreInputActionsI {
  fetchInstancesFromDatastoreForEntity(entityName:string):void;
  fetchInstancesFromDatastoreForAllEntities(entities:Mentity[]):void;
}

export interface MdatastoreOutputNotificationsI {
  allInstancesRefreshed():void;
}



/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
declare interface MreduxStoreI {
  entitySagasObject: EntitySagas,
  instanceSagasObject: InstanceSagas,
}
// const persistedState = loadFromLocalStorage();

export interface InnerStoreStateInterface {
  miroirEntities: EntityState<Mentity>;
  miroirInstances: MinstanceSliceState;
}
export type InnerReducerInterface = (state: InnerStoreStateInterface, action:Maction) => any;

export class MreduxStore implements MreduxStoreI{
  public store:MreduxWithUndoRedoStore;
  public staticReducers:MreduxWithUndoRedoReducer;
  public sagaMiddleware:any;
  public dispatch: typeof this.store.dispatch;
  public asyncDispatchMiddleware:any;//TODO: set proper type
  public entitySlice: MEntitySlice = new MEntitySlice(this); 

  constructor(
    public entitySagasObject: EntitySagas,
    public instanceSagasObject: InstanceSagas,
  ) {

    this.staticReducers = createUndoableReducer(
      combineReducers(
        {
          miroirEntities: EntitySlice.reducer,
          miroirInstances: InstanceSlice.reducer,
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
        _this.entitySagasObject.entityRootSaga(_this.entitySagasObject, sliceChannel),
        _this.instanceSagasObject.instanceRootSaga(_this.instanceSagasObject, sliceChannel),
      ]
    );
  }
}