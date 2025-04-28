import { z } from "zod";

import {
  ActionError,
  ApplicationSection,
  EntityInstance,
  EntityInstanceCollection,
  QueryFailed,
} from "../1_core/preprocessor-generated/miroirFundamentalType";

export type QueryFailureType =
  | "FailedTransformer_mustache"
  | "FailedTransformer_objectEntries"
  | "FailedTransformer_constantArray"
  | "FailedTransformer_constantBigint"
  | "FailedTransformer_constantNumber"
  | "FailedTransformer_constantString"
  | "FailedTransformer_constantBoolean"
  | "FailedTransformer_constantObject"
  | "FailedTransformer_constant"
  | "FailedTransformer_listPickElement"
  | "FailedExtractor"
  | "QueryNotExecutable"
  | "DomainStateNotLoaded"
  | "IncorrectParameters"
  | "DeploymentNotFound"
  | "ApplicationSectionNotFound"
  | "EntityNotFound"
  | "InstanceNotFound"
  | "ReferenceNotFound"
  | "ReferenceFoundButUndefined"
  | "ReferenceFoundButAttributeUndefinedOnFoundObject"
;

export interface IDomain2ElementFailed {
  queryFailure: QueryFailureType;
  query?: string | undefined;
  failureOrigin?: string[] | undefined;
  failureMessage?: string | undefined;
  queryReference?: string | undefined;
  queryParameters?: string | undefined;
  queryContext?: string | undefined;
  deploymentUuid?: string | undefined;
  errorStack?: string[] | undefined;
  innerError?: QueryFailed | Domain2ElementFailed | Action2Error | Error | undefined;
  applicationSection?: ApplicationSection | undefined;
  entityUuid?: string | undefined;
  instanceUuid?: string | undefined;
}

export class Domain2ElementFailed implements IDomain2ElementFailed {
  public get elementType() {
    return "failure";
  }

  public queryFailure: QueryFailureType;
  public query?: string | undefined;
  public failureOrigin?: string[] | undefined;
  public failureMessage?: string | undefined;
  public queryReference?: string | undefined;
  public queryParameters?: string | undefined;
  public queryContext?: string | undefined;
  public deploymentUuid?: string | undefined;
  public errorStack?: string[] | undefined;
  public innerError?: QueryFailed | Domain2ElementFailed | Action2Error | Error | undefined;
  public applicationSection?: ApplicationSection | undefined;
  public entityUuid?: string | undefined;
  public instanceUuid?: string | undefined;

  // constructor(elementValue: QueryFailed | Domain2ElementFailed) {
  constructor(elementValue: IDomain2ElementFailed) {
    this.queryFailure = elementValue.queryFailure;
    this.query = elementValue.query;
    this.failureOrigin = elementValue.failureOrigin;
    this.failureMessage = elementValue.failureMessage;
    this.queryReference = elementValue.queryReference;
    this.queryParameters = elementValue.queryParameters;
    this.queryContext = elementValue.queryContext;
    this.deploymentUuid = elementValue.deploymentUuid;
    this.errorStack = elementValue.errorStack;
    this.innerError = elementValue.innerError;
    this.applicationSection = elementValue.applicationSection;
    this.entityUuid = elementValue.entityUuid;
    this.instanceUuid = elementValue.instanceUuid;
  }
  // elementValue: QueryFailed;
};

export type ActionErrorType =
| ("FailedToCreateStore" | "FailedToDeployModule")
| "FailedTestAction"
| "FailedToCloseStore"
| "FailedToCreateInstance"
| "FailedToDeleteInstance"
| "FailedToDeleteInstanceWithCascade"
| "FailedToDeleteStore"
| "FailedToGetInstance"
| "FailedToGetInstances"
| "FailedToHandleAction"
| "FailedToHandleCompositeActionTestAssertion"
| "FailedToHandleLocalCacheAction"
| "FailedToHandlePersistenceAction"
| "FailedToHandlePersistenceActionForLocalPersistenceStore"
| "FailedToLoadNewInstancesInLocalCache"
| "FailedToOpenStore"
| "FailedToResetAndInitMiroirAndApplicationDatabase"
| "FailedToResolveTemplate"
| "FailedToRunBoxedExtractorOrQueryAction"
| "FailedToUpdateInstance"
| "FailedToSetupTest"
| "FailedToTeardownTest"
;

export class Action2Error {
  public status: string = "error";

  constructor(
    public errorType: ActionErrorType,
    public errorMessage?: string | undefined,
    public errorStack?: (string | undefined)[] | undefined,
    public innerError?: Action2Error | ActionError | Domain2ElementFailed | undefined
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

  export const domain2ElementObjectZodSchema = z.record(z.any());
  // export const domain2ElementObjectZodSchema = z.object({
  //   elementType: z.string(),
  //   elementValue: z.record(z.any()),
  // })
  

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
  