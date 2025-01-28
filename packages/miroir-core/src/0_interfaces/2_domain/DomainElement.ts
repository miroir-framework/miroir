import { z } from "zod";

import {
  ActionError,
  EntityInstance,
  EntityInstanceCollection,
  QueryFailed,
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";

export class Domain2ElementFailed {
  public get elementType () {
    return "failure";
  };

  constructor(
    public elementValue: QueryFailed) {}
    // elementValue: QueryFailed;
};

export type errorType =
| ("FailedToCreateStore" | "FailedToDeployModule")
| "FailedToDeleteStore"
| "FailedToResetAndInitMiroirAndApplicationDatabase"
| "FailedToOpenStore"
| "FailedToCloseStore"
| "FailedToCreateInstance"
| "FailedToDeleteInstance"
| "FailedToDeleteInstanceWithCascade"
| "FailedToUpdateInstance"
| "FailedToLoadNewInstancesInLocalCache"
| "FailedToGetInstance"
| "FailedToGetInstances"
| "FailedToResolveTemplate";

export class Action2Error {
  public status: string = "error";

  constructor(
    public errorType: errorType,
    public errorMessage?: string | undefined,
    public errorStack?: (string | undefined)[] | undefined,
    public innerError?: ActionError | undefined
  ){};
}


export type Domain2QueryReturnType<T> =
  T
  | Domain2ElementFailed
  // | DomainElementVoid
  // | DomainElementAny
  // | Domain2QueryReturnType<DomainElementObject>
  // | Domain2QueryReturnType<DomainElementInstanceUuidIndex>
  // | DomainElementEntityInstanceCollectionOrFailed
  // | DomainElementInstanceArrayOrFailed
  // | DomainElementEntityInstanceOrFailed
  // | {
  //     elementType: "instanceUuid";
  //     elementValue: EntityInstanceUuid;
  //   }
  // | {
  //     elementType: "instanceUuidIndexUuidIndex";
  //     elementValue: EntityInstancesUuidIndex;
  //   }
  // | {
  //     elementType: "string";
  //     elementValue: string;
  //   }
  // | {
  //     elementType: "number";
  //     elementValue: number;
  //   }
  // | {
  //     elementType: "array";
  //     elementValue: DomainElement[];
  //   };

  // export type Domain2Element = DomainElementSuccess | Domain2ElementFailed;
  export type Domain2Element = Domain2QueryReturnType<any>;

  export const domain2ElementObjectZodSchema = z.object({
    elementType: z.string(),
    elementValue: z.record(z.any()),
  })
  

  export type Action2EntityInstanceSuccess = {
      status: "ok";
      returnedDomainElement: Domain2QueryReturnType<EntityInstance>;
      // returnedDomainElement: DomainElementEntityInstance;
  };

  export type Action2EntityInstanceCollection = {
    status: "ok";
    returnedDomainElement: Domain2QueryReturnType<EntityInstanceCollection>;
  };

  export type Action2VoidSuccess = {
    status: "ok";
    returnedDomainElement: Domain2QueryReturnType<void>;
  };


  export type Action2EntityInstanceCollectionOrFailure =
    | Action2Error
    // | Action2EntityInstanceSuccess
    | Action2EntityInstanceCollection;

  export type Action2EntityInstanceReturnType =
    | Action2Error
    | Action2EntityInstanceSuccess;
    // | Action2EntityInstanceCollection;
    
  // export type Action2EntityInstanceReturnType =
  //   | Action2Error
  //   | Action2EntityInstanceSuccess
  //   | Action2EntityInstanceCollection;
  
  export type Action2Success = {
      status: "ok";
      returnedDomainElement: Domain2Element;
  };

  export type Action2VoidReturnType = Action2Error | Action2VoidSuccess;

  export type Action2ReturnType = Action2Error | Action2Success;
  