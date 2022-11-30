import * as React from "react";
import { useSelector } from "react-redux"
import { MiroirEntities } from "../entities/entitySlice";
import { selectAllMiroirEntities } from "../state/store";

export const MiroirComponent = () => {
  const miroirEntities:MiroirEntities = useSelector(selectAllMiroirEntities)
  return (
    <h3>
      {JSON.stringify(miroirEntities)}
    </h3>
  )
}