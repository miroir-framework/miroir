import { expect } from "vitest";
import { Action2ReturnType, DomainElementType, Action2Error, LoggerInterface, MiroirLoggerFactory } from "miroir-core";
import { packageName, cleanLevel } from "../../constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "vitests-utils")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export const chainVitestSteps = async (
  stepName: string,
  context: {[k:string]: any},
  functionCallingActionToTest: () => Promise<Action2ReturnType>,
  resultTransformation?: (a:Action2ReturnType,p:{[k:string]: any}) => any,
  addResultToContextAsName?: string,
  expectedDomainElementType?: DomainElementType,
  expectedValue?: any,
): Promise<{[k:string]: any}> => {
  log.info(
    "########################################### chainTestAsyncDomainCalls",
    stepName,
    "previousResult:",
    JSON.stringify(context, undefined, 2)
  );
  const domainElement = await functionCallingActionToTest();
  log.info(
    "########################################### chainTestAsyncDomainCalls",
    stepName,
    "result:",
    JSON.stringify(domainElement, undefined, 2)
  );
  let testResult
  if (!(domainElement instanceof Action2Error)) {
    testResult = resultTransformation
      ? resultTransformation(domainElement, context)
      : domainElement?.returnedDomainElement;

    log.info(
      "########################################### chainTestAsyncDomainCalls",
      stepName,
      "testResult that will be compared",
      JSON.stringify(testResult, null, 2)
    );
    if (expectedDomainElementType) {
      if (domainElement.returnedDomainElement?.elementType != expectedDomainElementType) {
        expect(
          domainElement.returnedDomainElement?.elementType,
          stepName +
            "received wrong type for result: " +
            domainElement.returnedDomainElement?.elementType +
            " expected: " +
            expectedDomainElementType
        ).toEqual(expectedDomainElementType); // fails
      } else {
        if (expectedValue) {
          expect(testResult).toEqual(expectedValue);
        } else {
          // no test to be done
        }
      }
    } else {
      if (expectedValue) {
        expect(testResult).toEqual(expectedValue);
      } else {
        // no test to be done
      }
   // no test to be done 
    //  log.info(
    //    "########################################### chainTestAsyncDomainCalls",
    //    stepName,
    //    "no test done because expectedDomainElementType is undefined",
    //    expectedDomainElementType
    //  );
    }
  } else {
    log.info(
      "########################################### chainTestAsyncDomainCalls",
      stepName,
      "error:",
      JSON.stringify(domainElement, undefined, 2)
    );
    expect(
      domainElement.status,
      domainElement.errorType ?? "no errorType" + ": " + (domainElement.errorMessage ?? "no errorMessage")
    ).toEqual("ok");
  }
  log.info(
    "########################################### chainTestAsyncDomainCalls",
    stepName,
    "testResult:",
    JSON.stringify(testResult, undefined, 2)
  );
  if (testResult && addResultToContextAsName) {
    return {...context, [addResultToContextAsName]: testResult}
  } else {
    return context
  }
}
