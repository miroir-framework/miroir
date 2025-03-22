import { EntityInstance } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType"
import { TestSuiteContext } from "./TestSuiteContext"

// ################################################################################################
export function ignorePostgresExtraAttributesOnRecord(instances: Record<string, EntityInstance>, furtherIgnore: string[] = []){
  return Object.fromEntries(Object.entries(instances).map(i => [i[0], ignorePostgresExtraAttributesOnObject(i[1], furtherIgnore)]))
}

// ################################################################################################
export function ignorePostgresExtraAttributesOnList(instances: EntityInstance[], furtherIgnore: string[] = []){
  // return instances.map(i => ignorePostgresExtraAttributesOnObject(i, furtherIgnore))
  return instances.map(i => ignorePostgresExtraAttributes(i, furtherIgnore))
}

// ################################################################################################
export function ignorePostgresExtraAttributesOnObject(instance: EntityInstance, furtherIgnore: string[] = []){
  const ignore = ["createdAt", "updatedAt", ...furtherIgnore]
  return Object.fromEntries(Object.entries(instance).filter(e=>!ignore.includes(e[0])))
}

// ################################################################################################
export function ignorePostgresExtraAttributes(instance: any, furtherIgnore: string[] = []):any{
  const ignore = ["createdAt", "updatedAt", ...furtherIgnore]
  // return Object.fromEntries(Object.entries(instance).filter(e=>!ignore.includes(e[0])))
  return typeof instance == "object" && instance !== null
    ? Array.isArray(instance)
      ? ignorePostgresExtraAttributesOnList(instance, ignore)
      : ignorePostgresExtraAttributesOnObject(instance, ignore)
    : instance;
}


// ################################################################################################
export function displayTestSuiteResults(
  expect: any, // vitest.expect
  currentTestSuiteName: string) {
  console.log("============ results of testSuite: ", currentTestSuiteName);
  // const currentTestSuiteName = currentTestSuiteName;
  const globalTestSuiteResults = TestSuiteContext.getTestSuiteResult(currentTestSuiteName);
  // console.log("globalTestSuiteResults", JSON.stringify(globalTestSuiteResults, null, 2));
  // console.log("============ results of testSuite: ", currentTestSuiteName);
  for (const testResult of Object.values(globalTestSuiteResults[currentTestSuiteName])) {
    if (testResult.testResult !== "ok") {
      for (const [testAssertionLabel, testAssertionResult] of Object.entries(testResult.testAssertionsResults)) {
        if (testAssertionResult.assertionResult !== "ok") {
          console.log("  testAssertionResult", JSON.stringify(testAssertionResult, null, 2));
          expect(
            testAssertionResult.assertionActualValue,
            `${currentTestSuiteName} > ${testResult.testLabel} > ${testAssertionLabel} failed!`
          ).toEqual(testAssertionResult.assertionExpectedValue);
        }
      }
    } else {
      // console.log("testResult", JSON.stringify(testResult, null, 2));
      expect(testResult.testResult, `${currentTestSuiteName} > ${testResult.testLabel} failed!`).toBe("ok");
      console.log(" ",testResult.testLabel, ": ok");
    }
  }
  // console.log("============ end of results of testSuite", currentTestSuiteName);
}

// ################################################################################################
export function displayTestSuiteResultsDetails(
  expect: any, // vitest.expect
  currentTestSuiteName: string) {
  console.log("============ detailed results of testSuite: ", currentTestSuiteName);
  const globalTestSuiteResults = TestSuiteContext.getTestSuiteResult(currentTestSuiteName);
  for (const testResult of Object.values(globalTestSuiteResults[currentTestSuiteName])) {
    console.log(`Test: ${testResult.testLabel}`);
    for (const [testAssertionLabel, testAssertionResult] of Object.entries(testResult.testAssertionsResults)) {
      console.log(`  Assertion: ${testAssertionLabel} ${testAssertionResult.assertionResult}`);
      // console.log(`    Expected: ${testAssertionResult.assertionExpectedValue}`);
      // console.log(`    Actual: ${testAssertionResult.assertionActualValue}`);
      // console.log(`    Result: ${testAssertionResult.assertionResult}`);
      if (testAssertionResult.assertionResult !== "ok") {
        expect(
          testAssertionResult.assertionActualValue,
          `${currentTestSuiteName} > ${testResult.testLabel} > ${testAssertionLabel} failed!`
        ).toBe(testAssertionResult.assertionExpectedValue);
      }
    }
    if (testResult.testResult !== "ok") {
      expect(testResult.testResult, `${currentTestSuiteName} > ${testResult.testLabel} failed!`).toBe("ok");
    }
  }
  console.log("============ end of results of testSuite");
}
