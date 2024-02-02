import { ActionReturnType, DomainElementType } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { ErrorLogServiceInterface, MError } from "../../0_interfaces/3_controllers/ErrorLogServiceInterface";
import { LocalCacheInterface } from "../../0_interfaces/4-services/LocalCacheInterface";
import { RemoteStoreInterface } from "../../0_interfaces/4-services/RemoteStoreInterface";

export default {}

export class CallUtils {
  constructor (
    private errorLogService: ErrorLogServiceInterface,
    private localCache: LocalCacheInterface,
    private remoteStore: RemoteStoreInterface,
  ) {

  }
  
  // ##############################################################################################
  callSyncActionOLD(
    context: {[k:string]: any},
    continuation: {
      resultTransformation?: (action:ActionReturnType,context:{[k:string]: any}) => any,
      addResultToContextAsName?: string,
      expectedDomainElementType?: DomainElementType,
      expectedValue?: any,
    },
    f: (...args: any) => ActionReturnType,
    _this: LocalCacheInterface,
    ...args: any[]
  ): Promise<ActionReturnType> {
    const functionToCall = f.bind(_this);
    const result: ActionReturnType = functionToCall(...args);
    console.log("callSyncAction received result", result)
    if (result && result['status'] == "error") {
      //ensure the proper persistence of errors in the local storage, for it to be accessible by view components.
      // Problem: what if the local storage is not accessible? => store it in a in-memory effect.
      const error: MError = { errorMessage: result.error.errorMessage };
      this.errorLogService.pushError(error);
      throw error;
    } else {
      // console.log("callAsyncAction ok", result);
      return Promise.resolve(result);
    }
  }

  // ######################################################################################
  /**
   * convert errors to exceptions for controllers using store controllers, 
   * allowing them to interrupt their control flow without testing systematically for errors
   */ 
  callSyncAction(
    context: {[k:string]: any},
    continuation: {
      resultTransformation?: (action:ActionReturnType,context:{[k:string]: any}) => any,
      addResultToContextAsName?: string,
      expectedDomainElementType?: DomainElementType,
      expectedValue?: any,
    },
    f: (...args: any) => ActionReturnType,
    _this: LocalCacheInterface,
    ...args: any[]
  ): Promise<Record<string, any>> {
    const functionToCall = f.bind(_this);
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
  async callAsyncAction(
    context: {[k:string]: any},
    continuation: {
      resultTransformation?: (action:ActionReturnType,context:{[k:string]: any}) => any,
      addResultToContextAsName?: string,
      expectedDomainElementType?: DomainElementType,
      expectedValue?: any,
    },
    f: (...args: any) => Promise<ActionReturnType>,
    _this: RemoteStoreInterface,
    ...args: any[]
  ): Promise<Record<string, any>> {
    const functionToCall = f.bind(_this);
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

  async callAsyncActionOLD(
    context: {[k:string]: any},
    continuation: {
      resultTransformation?: (action:ActionReturnType,context:{[k:string]: any}) => any,
      addResultToContextAsName?: string,
      expectedDomainElementType?: DomainElementType,
      expectedValue?: any,
    },
    // errorLogService: ErrorLogServiceInterface,
    f: (...args: any) => Promise<ActionReturnType>,
    _this: RemoteStoreInterface,
    ...args: any[]
  // ): Promise<RemoteStoreActionReturnType> {
  ): Promise<ActionReturnType> {
    const functionToCall = f.bind(_this);
    const result: ActionReturnType = await functionToCall(...args);
    console.log("callAction received result", result)
    if (result && result['status'] == "error") {
      //ensure the proper persistence of errors in the local storage, for it to be accessible by view components.
      // Problem: what if the local storage is not accessible? => store it in a in-memory effect.
      const error: MError = { errorMessage: result.error.errorMessage };
      this.errorLogService.pushError(error);
      throw error;
    } else {
      // console.log("callAction ok", result);
      return Promise.resolve(result);
    }
  }
}