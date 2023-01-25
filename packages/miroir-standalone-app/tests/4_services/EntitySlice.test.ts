import { EntityState, Update } from '@reduxjs/toolkit';
import { EntityDefinition } from 'miroir-core';
import { EntitySlice, entitySliceActionsCreators, mEntityAdapter, entitySliceInputActionNamesObject } from 'miroir-standalone-app/src/miroir-fwk/4_services/localStore/EntitySlice';
// import EntitySlice, { entitySliceActionsCreators, mEntityAdapter, entitySliceInputActionNamesObject } from '';

import {entityEntity} from "miroir-core";

beforeAll(() => {
})

afterAll(async () => {
})

it.skip(
  'add one Entity definition',
  async () => {
    const initialStore: EntityState<EntityDefinition> = mEntityAdapter.getInitialState();
    const expectedStore:any = mEntityAdapter.addOne<EntityState<EntityDefinition>>(mEntityAdapter.getInitialState(),entityEntity);
    // instructions under test
    const modifiedStore: EntityState<EntityDefinition> = EntitySlice.reducer(
      initialStore,
      entitySliceActionsCreators[entitySliceInputActionNamesObject.addOne](entityEntity)
    );
    // testing result
    expect(modifiedStore).toStrictEqual(expectedStore);
  }
)

it.skip(
  ('update one Entity definition'),
  async () => {
    const entityChanges = {description:"toto"};
    const entityUpdate:Update<EntityDefinition> = {id:entityEntity.uuid, changes: entityChanges};
    const modifiedEntity: EntityDefinition = Object.assign({},entityEntity,entityChanges);
    const emptyStore: EntityState<EntityDefinition> = mEntityAdapter.getInitialState();
    const initialStore:any = mEntityAdapter.addOne<EntityState<EntityDefinition>>(emptyStore,entityEntity);
    // console.log('initialStore',initialStore);
    const expectedStore:any = mEntityAdapter.updateOne<EntityState<EntityDefinition>>(initialStore,entityUpdate);
    // instructions under test
    const modifiedStore: EntityState<EntityDefinition> = EntitySlice.reducer(
      initialStore,
      entitySliceActionsCreators[entitySliceInputActionNamesObject.updateOne](entityUpdate)
    );
    // console.log('modifiedStore',modifiedStore);
    // testing result
    expect(modifiedStore).toStrictEqual(expectedStore);
    expect(modifiedStore.entities[entityEntity.uuid]).toStrictEqual(modifiedEntity); //the two tests must be equivalent
  }
)