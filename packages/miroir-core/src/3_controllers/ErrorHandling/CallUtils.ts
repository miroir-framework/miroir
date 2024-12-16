import {
  ActionReturnType,
  DomainElementType,
  LocalCacheAction,
  PersistenceAction,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { ErrorLogServiceInterface, MError } from "../../0_interfaces/3_controllers/ErrorLogServiceInterface.js";
import { LocalCacheInterface } from "../../0_interfaces/4-services/LocalCacheInterface.js";
import { PersistenceStoreLocalOrRemoteInterface } from "../../0_interfaces/4-services/PersistenceInterface.js";

export class CallUtils {
  constructor(
    private errorLogService: ErrorLogServiceInterface,
    private localCache: LocalCacheInterface,
    private persistenceStore: PersistenceStoreLocalOrRemoteInterface
  ) {}

  // ######################################################################################
  /**
   * convert errors to exceptions for controllers using store controllers,
   * allowing them to interrupt their control flow without testing systematically for errors
   */
  callLocalCacheAction(
    context: { [k: string]: any },
    continuation: {
      resultTransformation?: (action: ActionReturnType, context: { [k: string]: any }) => any;
      addResultToContextAsName?: string;
      expectedDomainElementType?: DomainElementType;
      expectedValue?: any;
    },
    action: LocalCacheAction
  ): Promise<Record<string, any>> {
    const result: ActionReturnType = this.localCache.handleLocalCacheAction(action);
    console.log("callLocalCacheAction received result", result);
    if (result && result["status"] == "error") {
      //ensure the proper persistence of errors in the local storage, for it to be accessible by view components.
      // Problem: what if the local storage is not accessible? => store it in a in-memory effect.
      const error: MError = { errorMessage: result.error.errorMessage };
      this.errorLogService.pushError(error);
      throw error;
    } else {
      const transformedResult = continuation.resultTransformation
        ? continuation.resultTransformation(result, context)
        : result;

      if (continuation.addResultToContextAsName) {
        return Promise.resolve({ ...context, [continuation.addResultToContextAsName]: transformedResult });
      } else {
        return Promise.resolve(context);
      }
    }
  }

  // ######################################################################################
  /**
   * convert errors to exceptions for controllers using store controllers,
   * allowing them to interrupt their control flow without testing systematically for errors
   */
  async callPersistenceAction(
    context: { [k: string]: any },
    continuation: {
      resultTransformation?: (action: ActionReturnType, context: { [k: string]: any }) => any;
      addResultToContextAsName?: string;
      expectedDomainElementType?: DomainElementType;
      expectedValue?: any;
    },
    action: PersistenceAction
  ): Promise<Record<string, any>> {
    const result: ActionReturnType = await this.persistenceStore.handlePersistenceAction(action);
    console.log("CallUtils callPersistenceAction received result", result);
    if (result["status"] == "error") {
      //ensure the proper persistence of errors in the local storage, for it to be accessible by view components.
      // Problem: what if the local storage is not accessible? => store it in a in-memory effect.
      const error: MError = { errorMessage: result.error.errorMessage };
      this.errorLogService.pushError(error);
      throw error;
    } else {
      console.log("CallUtils callPersistenceAction ok", result);
      console.log("CallUtils callPersistenceAction continuation", continuation);
      const transformedResult = continuation.resultTransformation
        ? continuation.resultTransformation(result, context)
        : result;

      if (continuation.addResultToContextAsName) {
        return { ...context, [continuation.addResultToContextAsName]: transformedResult };
      } else {
        return context;
      }
    }
  }
}
