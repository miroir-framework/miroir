/**
 * Static host map of TestConfiguration instances for UI/CLI integ (#252).
 * Lives in standalone-app so miroir-core does not import library/appForTest packages.
 */
import type { TestConfigurationPlayfield } from "miroir-core";
import { testConfiguration_libraryDocumentSeed } from "miroir-test-app_deployment-library";

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
};

export function getTestConfigurationFromIndex(
  uuid: string,
): TestConfigurationPlayfield | undefined {
  return TEST_CONFIGURATION_INSTANCE_INDEX[uuid];
}
