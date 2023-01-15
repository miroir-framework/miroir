import { combineReducers, configureStore, EntityState } from '@reduxjs/toolkit';
import {
  implementPromiseAction, promiseActionFactory, promiseMiddleware
} from "@teroneko/redux-saga-promise";
import createSagaMiddleware from 'redux-saga';
import { all, call } from 'redux-saga/effects';


import { EntityDefinition } from 'src/miroir-fwk/0_interfaces/1_core/Entity';
import { Minstance } from 'src/miroir-fwk/0_interfaces/1_core/Instance';
import { LocalStoreEvent, LocalStoreEventTypeString, LocalStoreInterface } from 'src/miroir-fwk/0_interfaces/4-storage/local/LocalStoreInterface';
import { EventManager, EventMatchParameters } from 'src/miroir-fwk/1_core/utils/EventManager';
import EntitySlice from 'src/miroir-fwk/4_storage/local/EntitySlice';
import instanceSliceObject, { InstanceSliceState } from 'src/miroir-fwk/4_storage/local/InstanceSlice';
import {
  createUndoRedoReducer,
  MreduxWithUndoRedoReducer, MreduxWithUndoRedoStore
} from "src/miroir-fwk/4_storage/local/UndoRedoReducer";
import { EntitySagas } from 'src/miroir-fwk/4_storage/remote/EntitySagas';
import { instanceSagaInputActionNames, instanceSagaInputActionNamesObject, InstanceSagas } from 'src/miroir-fwk/4_storage/remote/InstanceSagas';
import { MclientI } from 'src/miroir-fwk/4_storage/remote/MClient';
import { Maction } from './Mslice';


//#########################################################################################
//# INSTANCE INTERACTOR
//#########################################################################################
/**
 * The external view of the world for the domain model
 */

export interface MDatastoreInputActionsI {
  fetchInstancesFromDatastoreForEntity(entityName:string):void;
  fetchInstancesFromDatastoreForEntityList(entities:EntityDefinition[]):void;
}

export interface MDatastoreOutputNotificationsI {
  allInstancesRefreshed():void;
}

export interface InnerStoreStateInterface {
  miroirEntities: EntityState<EntityDefinition>;
  miroirInstances: InstanceSliceState;
}
export type InnerReducerInterface = (state: InnerStoreStateInterface, action:Maction) => any;

// ###############################################################################
export function handlePromiseActionForSaga (saga, ...args) {
  return function*(action) {
    yield call(implementPromiseAction, action, saga.bind(...args,action))
  }
}

/**
 * Local store implementation using Redux.
 * 
 */
export class ReduxStore implements LocalStoreInterface {
  private store: MreduxWithUndoRedoStore;
  private staticReducers: MreduxWithUndoRedoReducer;
  private sagaMiddleware: any;
  private eventManager: EventManager<LocalStoreEvent, LocalStoreEventTypeString> = new EventManager<
    LocalStoreEvent,
    LocalStoreEventTypeString
  >();

  // ###############################################################################
  constructor(
    public client: MclientI,
    public entitySagasObject: EntitySagas,
    public instanceSagasObject: InstanceSagas
  ) {
    this.staticReducers = createUndoRedoReducer(
      combineReducers({
        miroirEntities: EntitySlice.reducer,
        miroirInstances: instanceSliceObject.reducer,
      })
    );
    this.sagaMiddleware = createSagaMiddleware();

    this.store = configureStore({
      reducer: this.staticReducers,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            // Ignore these action types
            ignoredActions: [
              ...entitySagasObject.entitySagaInputActionNames,
              ...instanceSagaInputActionNames
            ],
            // Ignore these field paths in all actions
            ignoredActionPaths: ["meta.promiseActions"],
          },
        })
          .concat(promiseMiddleware)
          .concat(this.sagaMiddleware),
    });
  } //end constructor

  // ###############################################################################
  getInnerStore() {
    return this.store;
  }

  // ###############################################################################
  observerSubscribe(takeEvery: (localStoreEvent: LocalStoreEvent) => void) {
    this.eventManager.observerSubscribe(takeEvery);
  }

  // ###############################################################################
  observerMatcherSubscribe(matchingEvents: EventMatchParameters<LocalStoreEvent, LocalStoreEventTypeString>[]) {
    this.eventManager.observerSubscribeMatcher(matchingEvents);
  }

  // ###############################################################################
  observerUnsubscribe(takeEvery: (localStoreEvent: LocalStoreEvent) => void) {
    this.eventManager.observerUnsubscribe(takeEvery);
  }

  // ###############################################################################
  public run(): void {
    this.sagaMiddleware.run(this.rootSaga.bind(this));
  }

  // ###############################################################################
  fetchFromApiAndReplaceInstancesForEntity(entityName: string): void {
    // this.dispatch(this.entitySagasObject.mEntitySagaActionsCreators.fetchMiroirEntities())
  }

  // ###############################################################################
  fetchInstancesFromDatastoreForEntityList(entities: EntityDefinition[]): Promise<EntityDefinition[]> {
    console.log("ReduxStore fetchInstancesFromDatastoreForEntityList called, entities",entities,);
    if (entities !== undefined) {
      console.log("dispatching saga fetchInstancesFromDatastoreForEntityList with entities",entities );
      return this.store.dispatch(
        this.instanceSagasObject.instanceSagaInputActionsCreators.fetchInstancesFromDatastoreForEntityList(entities)
      );
    }
  }

  // ###############################################################################
  fetchAllEntityDefinitionsFromRemoteDataStore(): Promise<EntityDefinition[]> {
    return this.store.dispatch(
      this.entitySagasObject.mEntitySagaInputActionsCreators.fetchAllEntityDefinitionsFromRemoteDatastore()
    );
  }

  // ###############################################################################
  addInstancesForEntity(entityName: string, instances: Minstance[]): void {
    this.store.dispatch(
      instanceSliceObject.actionCreators[instanceSliceObject.inputActionNames.AddInstancesForEntity]({
        instances: instances,
        entity: entityName,
      })
    );
  }

  // ###############################################################################
  modifyInstancesForEntity(entityName: string, instances: Minstance[]): void {
    this.store.dispatch(
      instanceSliceObject.actionCreators[instanceSliceObject.inputActionNames.UpdateInstancesForEntity]({
        instances: instances,
        entity: entityName,
      })
    );
  }

  // ###############################################################################
  public *rootSaga(
  ) {
    console.log("ReduxStore rootSaga running", this.entitySagasObject, this.instanceSagasObject);
    yield all([
      this.entitySagasObject.entityRootSaga.bind(this.entitySagasObject)(),
      this.instanceSagasObject.instanceRootSaga.bind(this.instanceSagasObject)(),
    ]);
  }
}

  // ###############################################################################
  export default ReduxStore;