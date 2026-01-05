import {
  DomainElementType,
  LocalCacheAction,
  PersistenceAction,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { Action2Error, Action2ReturnType } from "../../0_interfaces/2_domain/DomainElement";
import { ErrorLogServiceInterface, MError } from "../../0_interfaces/3_controllers/ErrorLogServiceInterface";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { PersistenceStoreLocalOrRemoteInterface } from "../../0_interfaces/4-services/PersistenceInterface";
import type { ApplicationDeploymentMap } from "../../1_core/Deployment";
import { MiroirLoggerFactory } from "../../4_services/MiroirLoggerFactory";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "CallUtils")
).then((logger: LoggerInterface) => {log = logger});

export class CallUtils {
  constructor(
    // private errorLogService: ErrorLogServiceInterface,
    // private localCache: LocalCacheInterface,
    private persistenceStoreLocalOrRemote: PersistenceStoreLocalOrRemoteInterface
  ) {}

  // ######################################################################################
  /**
   * convert errors to exceptions for controllers using store controllers,
   * allowing them to interrupt their control flow without testing systematically for errors
   */
  callLocalCacheAction(
    context: { [k: string]: any },
    continuation: {
      resultTransformation?: (action: Action2ReturnType, context: { [k: string]: any }) => any;
      addResultToContextAsName?: string;
      expectedDomainElementType?: DomainElementType;
      expectedValue?: any;
    },
    applicationDeploymentMap: ApplicationDeploymentMap,
    action: LocalCacheAction
  ): Promise<Record<string, any>> {
    // asynchronous although it is not necessary, only to keep the same signature as callPersistenceAction
    const result: Action2ReturnType = this.persistenceStoreLocalOrRemote.handleLocalCacheAction(action, applicationDeploymentMap);
    
    // log.info("callLocalCacheAction received result", result);
    if (result && result["status"] == "error") {
      //ensure the proper persistence of errors in the local storage, for it to be accessible by view components.
      // Problem: what if the local storage is not accessible? => store it in a in-memory effect.
      const error: MError = { errorMessage: result.errorMessage };
      // this.errorLogService.pushError(error);
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
      resultTransformation?: (action: Action2ReturnType, context: { [k: string]: any }) => any;
      addResultToContextAsName?: string;
      expectedDomainElementType?: DomainElementType;
      expectedValue?: any;
    },
    applicationDeploymentMap: ApplicationDeploymentMap,
    action: PersistenceAction
  ): Promise<Record<string, any> | Action2Error> {
    // if (action.actionType !== "initModel") {
    //   log.info("CallUtils callPersistenceAction called with",
    //     "action",
    //     JSON.stringify(action, null, 2)
    //   );
    // } 
    // // else {
    // //   log.info("CallUtils callPersistenceAction called with",
    // //     "action",
    // //     action.actionType,
    // //   );
    // // }
    const result: Action2ReturnType =
      await this.persistenceStoreLocalOrRemote.handlePersistenceAction(
        action,
        applicationDeploymentMap
      );
    // log.info("CallUtils callPersistenceAction received result", JSON.stringify(result, null, 2));
    log.info("CallUtils callPersistenceAction received result", result, null, 2);
    if (result["status"] == "error") {
      //ensure the proper persistence of errors in the local storage, for it to be accessible by view components.
      // Problem: what if the local storage is not accessible? => store it in a in-memory effect.
      const error: MError = { errorMessage: JSON.stringify(result) };
      // this.errorLogService.pushError(error);
      // throw error;
      return Promise.resolve(
        new Action2Error(
          "FailedToHandlePersistenceAction",
          "could not handle action " + ((action as any).actionLabel ?? action.actionType),
          [],
          result
        )
      );
    } else {
      // log.info("CallUtils callPersistenceAction ok", result);
      // log.info("CallUtils callPersistenceAction continuation", continuation);
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
