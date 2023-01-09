import { EntityState, Update } from '@reduxjs/toolkit';
import { MEntityDefinition } from 'src/miroir-fwk/0_interfaces/1_core/Entity';
import EntitySlice, { mEntitySliceActionsCreators, mEntityAdapter, mEntitySliceInputActionNames } from 'src/miroir-fwk/4_storage/local/EntitySlice';

import entityEntity from "src/miroir-fwk/assets/entities/Entity.json";

beforeAll(() => {
})

afterAll(async () => {
})

it(
  'add one Entity definition',
  async () => {
    const initialStore: EntityState<MEntityDefinition> = mEntityAdapter.getInitialState();
    const expectedStore:any = mEntityAdapter.addOne<EntityState<MEntityDefinition>>(mEntityAdapter.getInitialState(),entityEntity);
    // instructions under test
    const modifiedStore: EntityState<MEntityDefinition> = EntitySlice.reducer(
      initialStore,
      mEntitySliceActionsCreators[mEntitySliceInputActionNames.addOne](entityEntity)
    );
    // testing result
    expect(modifiedStore).toStrictEqual(expectedStore);
  }
)

it(
  ('update one Entity definition'),
  async () => {
    const entityChanges = {description:"toto"};
    const entityUpdate:Update<MEntityDefinition> = {id:entityEntity.uuid, changes: entityChanges};
    const modifiedEntity: MEntityDefinition = Object.assign({},entityEntity,entityChanges);
    const emptyStore: EntityState<MEntityDefinition> = mEntityAdapter.getInitialState();
    const initialStore:any = mEntityAdapter.addOne<EntityState<MEntityDefinition>>(emptyStore,entityEntity);
    // console.log('initialStore',initialStore);
    const expectedStore:any = mEntityAdapter.updateOne<EntityState<MEntityDefinition>>(initialStore,entityUpdate);
    // instructions under test
    const modifiedStore: EntityState<MEntityDefinition> = EntitySlice.reducer(
      initialStore,
      mEntitySliceActionsCreators[mEntitySliceInputActionNames.updateOne](entityUpdate)
    );
    // console.log('modifiedStore',modifiedStore);
    // testing result
    expect(modifiedStore).toStrictEqual(expectedStore);
    expect(modifiedStore.entities[entityEntity.uuid]).toStrictEqual(modifiedEntity); //the two tests must be equivalent
  }
)