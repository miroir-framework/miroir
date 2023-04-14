import { EntityAttribute } from "miroir-core";

export function getColumnDefinitions(attributes:EntityAttribute[]) {
  return attributes?.map(
    (a)=>{return {"headerName": a?.defaultLabel, "field": a?.name}}
  );
}