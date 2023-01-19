import { combineReducers, configureStore, EntityState } from '@reduxjs/toolkit';
import {
  implementPromiseAction, promiseMiddleware
} from "@teroneko/redux-saga-promise";
import createSagaMiddleware from 'redux-saga';
import { all, call } from 'redux-saga/effects';


import { EntityDefinition } from 'src/miroir-fwk/0_interfaces/1_core/Entity';
import { Instance, InstanceCollection } from 'src/miroir-fwk/0_interfaces/1_core/Instance';
import { LocalStoreInterface, StoreReturnType } from 'src/miroir-fwk/0_interfaces/4-services/localStore/LocalStoreInterface';
import { RemoteDataStoreInterface } from 'src/miroir-fwk/0_interfaces/4-services/remoteStore/RemoteDataStoreInterface';
import entitySliceObject, { entitySliceInputFullActionNames, entitySlicePromiseAction } from 'src/miroir-fwk/4_services/localStore/EntitySlice';
import instanceSliceObject, { instanceSliceGeneratedActionNames, InstanceSliceState } from 'src/miroir-fwk/4_services/localStore/InstanceSlice';
import {
  createUndoRedoReducer,
  MreduxWithUndoRedoReducer, MreduxWithUndoRedoStore
} from "src/miroir-fwk/4_services/localStore/UndoRedoReducer";
import { EntitySagas } from 'src/miroir-fwk/4_services/remoteStore/EntitySagas';
import { instanceSagaGeneratedActionNames, instanceSagaInputActionNames, InstanceSagas } from 'src/miroir-fwk/4_services/remoteStore/InstanceSagas';
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
    if (args.length > 0) {
      yield call(implementPromiseAction, action, saga.bind(...args,action))
    } else {
      yield call(implementPromiseAction, action, saga.bind(undefined,action))
    }
  }
}

// ###############################################################################
/**
 * Local store implementation using Redux.
 * 
 */
export class ReduxStore implements LocalStoreInterface, RemoteDataStoreInterface {
  private store: MreduxWithUndoRedoStore;
  private staticReducers: MreduxWithUndoRedoReducer;
  private sagaMiddleware: any;

  // ###############################################################################
  constructor(
    public entitySagasObject: EntitySagas,
    public instanceSagasObject: InstanceSagas
  ) {
    this.staticReducers = createUndoRedoReducer(
      combineReducers(
        {
          miroirEntities: entitySliceObject.reducer,
          miroirInstances: instanceSliceObject.reducer,
        }
      )
    );
    this.sagaMiddleware = createSagaMiddleware();

    const ignoredActionsList = [
      ...entitySagasObject.entitySagaInputActionNames,
      ...entitySagasObject.entitySagaGeneratedActionNames,
      ...entitySliceInputFullActionNames,
      ...instanceSagaInputActionNames,
      ...instanceSagaGeneratedActionNames,
      ...instanceSliceGeneratedActionNames,
    ];

    console.log('ReduxStore ignoredActionsList',ignoredActionsList);
    this.store = configureStore({
      reducer: this.staticReducers,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            // Ignore these action types
            ignoredActions: ignoredActionsList,
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
  public run(): void {
    this.sagaMiddleware.run(this.rootSaga.bind(this));
  }

  // ###############################################################################
  fetchAllEntityDefinitionsFromRemoteDataStore(): Promise<StoreReturnType> {
    return this.store.dispatch(
      this.entitySagasObject.entitySagaInputActionsCreators.fetchAllEntityDefinitionsFromRemoteDatastore()
    );
  }

  // ###############################################################################
  replaceAllEntityDefinitions(entityDefinitions:EntityDefinition[]):Promise<StoreReturnType> {
    // clears all entities before putting the given ones in the store
    console.log("ReduxStore replaceAllEntityDefinitions called entityDefinitions",entityDefinitions,);
    return this.store.dispatch(entitySlicePromiseAction(entityDefinitions))
  }

  // ###############################################################################
  // addEntityDefinitions(entities: EntityDefinition[]): Promise<void> {
  //   // returns an exception if at least one of the entities already exists.
  //   return this.store.dispatch(
  //     entitySliceObject.actionCreators[entitySliceObject.inputActionNames.replaceEntities](entities)
  //   );
  // }

  // ###############################################################################
  // modifyEntityDefinitions(entityDefinitions: EntityDefinition[]): void {
  //   this.store.dispatch(
  //     instanceSliceObject.actionCreators[instanceSliceObject.inputActionNames.UpdateInstancesForEntity]({
  //       instances: instances,
  //       entity: entityName,
  //     })
  //   );
  // }

  // ###############################################################################
  fetchInstancesForEntityListFromRemoteDatastore(entities: EntityDefinition[]): Promise<StoreReturnType> {
    console.log("ReduxStore fetchInstancesForEntityListFromRemoteDatastore called, entities",entities,);
    if (entities !== undefined) {
      console.log("dispatching saga fetchInstancesForEntityListFromRemoteDatastore with entities",entities );
      return this.store.dispatch(
        this.instanceSagasObject.instanceSagaInputActionsCreators.fetchInstancesForEntityListFromRemoteDatastore(entities)
      );
    }
  }

  // ###############################################################################
  replaceAllInstances(instances:InstanceCollection[]):Promise<void> {
    return this.store.dispatch(
      this.instanceSagasObject.instanceSliceInputPromiseActions.ReplaceAllInstances.creator(instances)
    );
  }

  // ###############################################################################
  addInstancesForEntity(entityName: string, instances: Instance[]): void {
    // this.store.dispatch(
    //   instanceSliceObject.actionCreators[instanceSliceObject.inputActionNames.AddInstancesForEntity]({
    //     instances: instances,
    //     entity: entityName,
    //   })
    // );
  }

  // ###############################################################################
  modifyInstancesForEntity(entityName: string, instances: Instance[]): void {
    // this.store.dispatch(
    //   instanceSliceObject.actionCreators[instanceSliceObject.inputActionNames.UpdateInstancesForEntity]({
    //     instances: instances,
    //     entity: entityName,
    //   })
    // );
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