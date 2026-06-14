import { describe, expect, it, vi } from "vitest";
import * as vitest from "vitest";

import type { DomainControllerInterface } from "../../src/0_interfaces/2_domain/DomainControllerInterface";
import { defaultSelfApplicationDeploymentMap } from "../../src/1_core/Deployment";
import { runMiroirTransformerIntegrationTest } from "../../src/5_tests/MiroirTransformerTestTools";
import type { MiroirTestForTransformer } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultMetaModelEnvironment } from "../../src/1_core/Model";

const TEST_APPLICATION_UUID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

describe("runMiroirTransformerIntegrationTest", () => {
  it("calls domainController.handleBoxedExtractorOrQueryAction for runtime step", async () => {
    const domainController = {
      handleBoxedExtractorOrQueryAction: vi.fn().mockResolvedValue({
        status: "ok",
        returnedDomainElement: { transformer: 42 },
      }),
    } as unknown as DomainControllerInterface;

    const applicationDeploymentMap = {
      ...defaultSelfApplicationDeploymentMap,
      [TEST_APPLICATION_UUID]: "bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    };

    const tracker = {
      getCurrentTestAssertionPath: () => [{ test: "t" }, { testAssertion: "t" }],
      setTestAssertionResult: vi.fn(),
      setTest: vi.fn(),
    };

    const leaf: MiroirTestForTransformer = {
      miroirTestType: "transformerTest",
      miroirTestLabel: "runtime plus",
      transformerName: "plus",
      runTestStep: "runtime",
      transformer: {
        transformerType: "+",
        interpolation: "runtime",
        args: [
          { transformerType: "returnValue", interpolation: "runtime", value: 1 },
          { transformerType: "returnValue", interpolation: "runtime", value: 2 },
        ],
      },
      expectedValue: 42,
    };

    const runIntegration = runMiroirTransformerIntegrationTest(
      domainController,
      applicationDeploymentMap,
      TEST_APPLICATION_UUID,
    );

    await runIntegration(
      vitest,
      ["plus"],
      undefined,
      leaf,
      defaultMetaModelEnvironment,
      tracker as any,
    );

    expect(domainController.handleBoxedExtractorOrQueryAction).toHaveBeenCalledTimes(1);
    const [action] = vi.mocked(domainController.handleBoxedExtractorOrQueryAction).mock.calls[0];
    expect(action.payload.application).toBe(TEST_APPLICATION_UUID);
  });
});
