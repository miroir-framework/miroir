import { ActionReturnType, DomainElementType } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { ErrorLogServiceInterface, MError } from "../../0_interfaces/3_controllers/ErrorLogServiceInterface";
import { LocalCacheInterface } from "../../0_interfaces/4-services/LocalCacheInterface";
import { RemoteStoreInterface } from "../../0_interfaces/4-services/RemoteStoreInterface";

export default {}
export type AsyncCalls = "handleRemoteStoreModelAction" | "handleRemoteStoreRestCRUDAction";
export type SyncCalls =
  | "handleLocalCacheTransactionalInstanceAction"
  | "handleUndoRedoAction"
  | "handleInstanceAction"
  | "handleModelAction"
;


export class CallUtils {
  private asyncCallsMap: {[k in AsyncCalls]: (...args: any) => Promise<ActionReturnType>}
  private syncCallsMap: {[k in SyncCalls]: (...args: any) => ActionReturnType}

  constructor (
    private errorLogService: ErrorLogServiceInterface,
    private localCache: LocalCacheInterface,
    private remoteStore: RemoteStoreInterface,
  ) {
    this.asyncCallsMap = {
      "handleRemoteStoreModelAction": remoteStore.handleRemoteStoreModelAction,
      "handleRemoteStoreRestCRUDAction": remoteStore.handleRemoteStoreRestCRUDAction,
    }
    this.syncCallsMap = {
      "handleInstanceAction": localCache.handleInstanceAction,
      "handleLocalCacheTransactionalInstanceAction": localCache.handleLocalCacheTransactionalInstanceAction,
      "handleUndoRedoAction": localCache.handleUndoRedoAction,
      "handleModelAction": localCache.handleModelAction,
    }
  }
  
  // ######################################################################################
  /**
   * convert errors to exceptions for controllers using store controllers, 
   * allowing them to interrupt their control flow without testing systematically for errors
   */ 
  callLocalCacheAction(
    context: {[k:string]: any},
    continuation: {
      resultTransformation?: (action:ActionReturnType,context:{[k:string]: any}) => any,
      addResultToContextAsName?: string,
      expectedDomainElementType?: DomainElementType,
      expectedValue?: any,
    },
    fName: SyncCalls,
    ...args: any[]
  ): Promise<Record<string, any>> {
    const functionToCall = this.syncCallsMap[fName].bind(this.localCache);
    const result: ActionReturnType = functionToCall(...args);
    console.log("callSyncAction received result", result)
    if (result && result['status'] == "error") {
      //ensure the proper persistence of errors in the local storage, for it to be accessible by view components.
      // Problem: what if the local storage is not accessible? => store it in a in-memory effect.
      const error: MError = { errorMessage: result.error.errorMessage };
      this.errorLogService.pushError(error);
      throw error;
    } else {
      const transformedResult = continuation.resultTransformation? continuation.resultTransformation(result, context): result;
  
      if (continuation.addResultToContextAsName) {
        return Promise.resolve({...context, [continuation.addResultToContextAsName]: transformedResult})
      } else {
        return Promise.resolve(context)
      }
    }
  }



  // ######################################################################################
/**
 * convert errors to exceptions for controllers using store controllers, 
 * allowing them to interrupt their control flow without testing systematically for errors
 */ 
  async callRemoteAction(
    context: {[k:string]: any},
    continuation: {
      resultTransformation?: (action:ActionReturnType,context:{[k:string]: any}) => any,
      addResultToContextAsName?: string,
      expectedDomainElementType?: DomainElementType,
      expectedValue?: any,
    },
    fName: AsyncCalls,
    ...args: any[]
  ): Promise<Record<string, any>> {
    const functionToCall = this.asyncCallsMap[fName].bind(this.remoteStore);
    const result: ActionReturnType = await functionToCall(...args);
    console.log("callAsyncAction received result", result)
    if (result['status'] == "error") {
      //ensure the proper persistence of errors in the local storage, for it to be accessible by view components.
      // Problem: what if the local storage is not accessible? => store it in a in-memory effect.
      const error: MError = { errorMessage: result.error.errorMessage };
      // errorLogService.pushError(error);
      throw error;
    } else {
      // console.log("callAsyncAction ok", result);
      const transformedResult = continuation.resultTransformation? continuation.resultTransformation(result, context): result;

      if (continuation.addResultToContextAsName) {
        return {...context, [continuation.addResultToContextAsName]: transformedResult}
      } else {
        return context
      }
    }
  }

}