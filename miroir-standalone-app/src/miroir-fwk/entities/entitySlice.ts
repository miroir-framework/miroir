import { createSlice } from '@reduxjs/toolkit'
// import type { PayloadAction } from '@reduxjs/toolkit'
import report from "../assets/entities/Report.json"
import entity from "../assets/entities/Entity.json"

export interface EntityAttribute {
  "id": number,
  "name": string,
  "display": string,
  "type": string,
  "required": boolean,
  "editable": boolean,
  "attributeFormat"?: {
    "name": string,
    "display": string,
  }[],
};


export interface Entity {
  "uuid": number,
  "entity": string,
  "name":string,
  "attributes"?: EntityAttribute[],
};

export type Entities=Entity[];

const initialState: Entities  = [report,entity]

export const entitiesSlice = createSlice({
  name: 'entities',
  initialState,
  reducers: {
    nothing:(state) => {
      console.log(state);
    }
  },
})

// Action creators are generated for each case reducer function
export const {  } = entitiesSlice.actions

export default entitiesSlice.reducer