import { EntityState, Update } from '@reduxjs/toolkit';
import { Mentity } from 'src/miroir-fwk/core/Entity';
import EntitySlice, { mEntityActionsCreators, mEntityAdapter, mEntitySliceInputActionNames } from 'src/miroir-fwk/core/EntitySlice';

import entityEntity from "src/miroir-fwk/assets/entities/Entity.json";

beforeAll(() => {
})

afterAll(async () => {
})

it(
  'add one Entity definition',
  async () => {
    const initialStore: EntityState<Mentity> = mEntityAdapter.getInitialState();
    const expectedStore:any = mEntityAdapter.addOne<EntityState<Mentity>>(mEntityAdapter.getInitialState(),entityEntity);
    // instructions under test
    const modifiedStore: EntityState<Mentity> = EntitySlice.reducer(
      initialStore,
      mEntityActionsCreators[mEntitySliceInputActionNames.addOne](entityEntity)
    );
    // testing result
    expect(modifiedStore).toStrictEqual(expectedStore);
  }
)

it(
  ('update one Entity definition'),
  async () => {
    const entityChanges = {description:"toto"};
    const entityUpdate:Update<Mentity> = {id:entityEntity.uuid, changes: entityChanges};
    const modifiedEntity: Mentity = Object.assign({},entityEntity,entityChanges);
    const emptyStore: EntityState<Mentity> = mEntityAdapter.getInitialState();
    const initialStore:any = mEntityAdapter.addOne<EntityState<Mentity>>(emptyStore,entityEntity);
    // console.log('initialStore',initialStore);
    const expectedStore:any = mEntityAdapter.updateOne<EntityState<Mentity>>(initialStore,entityUpdate);
    // instructions under test
    const modifiedStore: EntityState<Mentity> = EntitySlice.reducer(
      initialStore,
      mEntityActionsCreators[mEntitySliceInputActionNames.updateOne](entityUpdate)
    );
    // console.log('modifiedStore',modifiedStore);
    // testing result
    expect(modifiedStore).toStrictEqual(expectedStore);
    expect(modifiedStore.entities[entityEntity.uuid]).toStrictEqual(modifiedEntity); //the two tests must be equivalent
  }
)