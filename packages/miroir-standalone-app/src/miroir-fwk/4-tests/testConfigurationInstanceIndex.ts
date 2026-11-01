/**
 * Static host map of TestConfiguration instances for UI/CLI integ (#252).
 * Lives in standalone-app so miroir-core does not import the application packages.
 */
import type { TestConfigurationPlayfield } from "miroir-core";
import {
  testConfiguration_libraryBookDetailsSeed,
  testConfiguration_libraryDocumentSeed,
} from "miroir-example-library";
import { testConfiguration_libraryPublisherAndCountry } from "miroir-app-miroir";
import { testConfiguration_githubModel } from "miroir-example-github";
import {
  testConfiguration_devDataBundleSizeSeed,
  testConfiguration_devDataPageLoadSeed,
} from "./devDataTestSeeds.js";

function playfieldFromInstance(instance: {
  uuid: string;
  testbedModel: TestConfigurationPlayfield["testbedModel"];
  testbedEntitiesAndInstances: TestConfigurationPlayfield["testbedEntitiesAndInstances"];
}): TestConfigurationPlayfield {
  return {
    uuid: instance.uuid,
    testbedModel: instance.testbedModel,
    testbedEntitiesAndInstances: instance.testbedEntitiesAndInstances,
  };
}

export const TEST_CONFIGURATION_INSTANCE_INDEX: Record<string, TestConfigurationPlayfield> = {
  [testConfiguration_libraryDocumentSeed.uuid]: playfieldFromInstance(
    testConfiguration_libraryDocumentSeed,
  ),
  [testConfiguration_libraryPublisherAndCountry.uuid]: playfieldFromInstance(
    testConfiguration_libraryPublisherAndCountry,
  ),
  // #330: libraryDocumentSeed plus the Reports under test
  [testConfiguration_libraryBookDetailsSeed.uuid]: playfieldFromInstance(
    testConfiguration_libraryBookDetailsSeed,
  ),
  // #472: the GitHub model, for the GitHub report MiroirTests
  [testConfiguration_githubModel.uuid]: playfieldFromInstance(testConfiguration_githubModel as any),
  // #473, #550, #647: fixed bundle size measurements and agent runs in Library's devData section
  [testConfiguration_devDataBundleSizeSeed.uuid]: playfieldFromInstance(testConfiguration_devDataBundleSizeSeed as any),
  // #580, #647: fixed page load measurements in Library's devData section
  [testConfiguration_devDataPageLoadSeed.uuid]: playfieldFromInstance(testConfiguration_devDataPageLoadSeed as any),
};

export function getTestConfigurationFromIndex(
  uuid: string,
): TestConfigurationPlayfield | undefined {
  return TEST_CONFIGURATION_INSTANCE_INDEX[uuid];
}
