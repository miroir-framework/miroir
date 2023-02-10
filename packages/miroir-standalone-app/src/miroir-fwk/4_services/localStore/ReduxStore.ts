import { combineReducers, configureStore, EntityState } from '@reduxjs/toolkit';
import {
  promiseMiddleware
} from "@teroneko/redux-saga-promise";
import sagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';

import {
  DomainAction,
  EntityDefinition, LocalStoreInterface, RemoteDataStoreInterface, RemoteStoreAction, RemoteStoreActionReturnType
} from "miroir-core";
import {
  EntitySlice, entitySliceInputActionNamesObject,
  entitySliceInputFullActionNames
} from "miroir-fwk/4_services/localStore/EntityReduxSlice";
import {
  InstanceSlice,
  instanceSliceGeneratedActionNames, instanceSliceInputActionNamesObject,
  InstanceSliceState
} from "miroir-fwk/4_services/localStore/InstanceReduxSlice";
import {
  createUndoRedoReducer,
  ReduxReducerWithUndoRedo, ReduxStoreWithUndoRedo
} from "miroir-fwk/4_services/localStore/UndoRedoReducer";
import {
  InstanceRemoteAccessReduxSaga, instanceSagaGeneratedActionNames,
  instanceSagaInputActionNamesArray
} from "miroir-fwk/4_services/remoteStore/InstanceRemoteAccessReduxSaga";
import { Maction } from './Mslice';


//#########################################################################################
//# INSTANCE INTERACTOR
//#########################################################################################
/**
 * The external view of the world for the domain model
 */

export interface DatastoreInputActionsInterface {
  fetchInstancesFromDatastoreForEntity(entityName:string):void;
  fetchInstancesFromDatastoreForEntityList(entities:EntityDefinition[]):void;
}

export interface DatastoreOutputNotificationsInterface {
  allInstancesRefreshed():void;
}

export interface InnerStoreStateInterface {
  miroirEntities: EntityState<EntityDefinition>;
  miroirInstances: InstanceSliceState;
}
export type InnerReducerInterface = (state: InnerStoreStateInterface, action:Maction) => any;


// ###############################################################################
/**
 * Local store implementation using Redux.
 * 
 */
export class ReduxStore implements LocalStoreInterface, RemoteDataStoreInterface {
  private innerReduxStore: ReduxStoreWithUndoRedo;
  private staticReducers: ReduxReducerWithUndoRedo;
  private sagaMiddleware: any;

  // ###############################################################################
  constructor(
    // public entityRemoteAccessReduxSaga: EntityRemoteAccessReduxSaga,
    public instanceRemoteAccessReduxSaga: InstanceRemoteAccessReduxSaga
  ) {
    this.staticReducers = createUndoRedoReducer(
      combineReducers(
        {
          miroirEntities: EntitySlice.reducer,
          miroirInstances: InstanceSlice.reducer,
        }
      )
    );

    this.sagaMiddleware = sagaMiddleware();

    const ignoredActionsList = [
      // ...entityRemoteAccessReduxSaga.entitySagaInputActionNames,
      // ...entityRemoteAccessReduxSaga.entitySagaGeneratedActionNames,
      ...entitySliceInputFullActionNames,
      ...instanceSagaInputActionNamesArray,
      ...instanceSagaGeneratedActionNames,
      ...instanceSliceGeneratedActionNames,
    ];

    console.log('ReduxStore ignoredActionsList',ignoredActionsList);
    this.innerReduxStore = configureStore({
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
    return this.innerReduxStore;
  }

  // ###############################################################################
  public run(): void {
    this.sagaMiddleware.run(this.rootSaga.bind(this));
  }

  // ###############################################################################
  handleRemoteStoreAction(action: RemoteStoreAction): Promise<RemoteStoreActionReturnType> {
    // switch (action.entityName) {
    //   case 'Entity': 
    //     return this.innerReduxStore.dispatch(
    //       // this.entityRemoteAccessReduxSaga.entitySagaInputActionsCreators.handleAction(action),
    //       this.entityRemoteAccessReduxSaga.entitySagaInputActionsCreators.handleRemoteStoreAction(action),
    //     );
    //   // case 'Instance':
    //   default:
        return this.innerReduxStore.dispatch(
          this.instanceRemoteAccessReduxSaga.instanceSagaInputPromiseActions.handleRemoteStoreAction.creator(action)
        )
    // }
  }

  // ###############################################################################
  handleLocalCacheAction(action:DomainAction) {
    switch (action.entityName) {
      case 'Entity': 
        this.innerReduxStore.dispatch(
          // this.entityRemoteAccessReduxSaga.entitySagaInputActionsCreators.handleAction(action),
          EntitySlice.actionCreators[entitySliceInputActionNamesObject.replaceAllEntityDefinitions](action.objects)
        );
        break;
      case 'Instance':
        this.innerReduxStore.dispatch(
          InstanceSlice.actionCreators[instanceSliceInputActionNamesObject.ReplaceAllInstances](action.objects)
        )
    }
  }

  // // ###############################################################################
  // replaceAllEntityDefinitions(entityDefinitions:EntityDefinition[]):Promise<RemoteStoreActionReturnType> {
  //   // clears all entities before putting the given ones in the store
  //   console.log("ReduxStore replaceAllEntityDefinitions called entityDefinitions",entityDefinitions,);
  //   return this.innerReduxStore.dispatch(entitySlicePromiseAction(entityDefinitions))
  // }

  // // ###############################################################################
  // fetchInstancesForEntityListFromRemoteDatastore(entities: EntityDefinition[]): Promise<RemoteStoreActionReturnType> {
  //   console.log("ReduxStore fetchInstancesForEntityListFromRemoteDatastore called, entities",entities,);
  //   if (entities !== undefined) {
  //     console.log("dispatching saga fetchInstancesForEntityListFromRemoteDatastore with entities",entities );
  //     return this.innerReduxStore.dispatch(
  //       this.instanceRemoteAccessReduxSaga.instanceSagaInputActionsCreators.fetchInstancesForEntityListFromRemoteDatastore(entities)
  //     );
  //   }
  // }

  // ###############################################################################
  public *rootSaga(
  ) {
    console.log("ReduxStore rootSaga running", this.instanceRemoteAccessReduxSaga);
    yield all([
      // this.entityRemoteAccessReduxSaga.entityRootSaga.bind(this.entityRemoteAccessReduxSaga)(),
      this.instanceRemoteAccessReduxSaga.instanceRootSaga.bind(this.instanceRemoteAccessReduxSaga)(),
    ]);
  }
}

  // ###############################################################################
  export default {};