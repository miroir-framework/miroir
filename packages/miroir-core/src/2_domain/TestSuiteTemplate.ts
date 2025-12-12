import { compositeActionSequence, MetaModel, TestCompositeAction, TestCompositeActionSuite, TestCompositeActionTemplate, TestCompositeActionTemplateSuite } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { resolveCompositeActionTemplate } from "./ResolveCompositeActionTemplate";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TestSuiteTemplate")
).then((logger: LoggerInterface) => {log = logger});

export function resolveTestCompositeActionTemplate(
  testCompositeActionTemplate: TestCompositeActionTemplate,
  currentModelEnvironment: MiroirModelEnvironment,
  actionParamValues: Record<string, any>,
): {
  resolvedTestCompositeActionDefinition: TestCompositeAction,
  resolvedCompositeActionTemplates: Record<string,any>
} {
  const compositeActionTemplateResolved = resolveCompositeActionTemplate(
    testCompositeActionTemplate.compositeActionTemplate,
    currentModelEnvironment,
    actionParamValues,
  );
  log.info(
    "resolveTestCompositeActionTemplate compositeActionTemplateResolved",
    JSON.stringify(compositeActionTemplateResolved, null, 2)
  );
  return {
    resolvedTestCompositeActionDefinition: {
      testLabel: testCompositeActionTemplate.testLabel,
      testType: "testCompositeAction",
      afterTestCleanupAction: testCompositeActionTemplate.afterTestCleanupAction?resolveCompositeActionTemplate(
        testCompositeActionTemplate.afterTestCleanupAction,
        currentModelEnvironment,
        actionParamValues,
      ).resolvedCompositeActionDefinition: undefined,
      beforeTestSetupAction: testCompositeActionTemplate.beforeTestSetupAction?resolveCompositeActionTemplate(
        testCompositeActionTemplate.beforeTestSetupAction,
        currentModelEnvironment,
        actionParamValues,
      ).resolvedCompositeActionDefinition: undefined,
      testCompositeActionAssertions: testCompositeActionTemplate.testCompositeActionAssertions,
      compositeActionSequence: compositeActionTemplateResolved.resolvedCompositeActionDefinition,
    },
    resolvedCompositeActionTemplates: {}
  }
  
}

// #################################################################################################
export function resolveTestCompositeActionTemplateSuite(
  compositeActionTemplate: TestCompositeActionTemplateSuite,
  currentModelEnvironment: MiroirModelEnvironment,
  actionParamValues: Record<string, any>,
): {
  resolvedTestCompositeActionDefinition: TestCompositeActionSuite,
  resolvedCompositeActionTemplates: Record<string,any>
} {

  const beforeAllResolved = compositeActionTemplate.beforeAll?resolveCompositeActionTemplate(
    compositeActionTemplate.beforeAll,
    currentModelEnvironment,
    actionParamValues,
  ): undefined;
  
  const beforeEachResolved = compositeActionTemplate.beforeEach?resolveCompositeActionTemplate(
    compositeActionTemplate.beforeEach,
    currentModelEnvironment,
    actionParamValues,
  ): undefined;

  const afterEachResolved = compositeActionTemplate.afterEach?resolveCompositeActionTemplate(
    compositeActionTemplate.afterEach,
    currentModelEnvironment,
    actionParamValues,
  ): undefined;

  const afterAllResolved = compositeActionTemplate.afterAll?resolveCompositeActionTemplate(
    compositeActionTemplate.afterAll,
    currentModelEnvironment,
    actionParamValues,
  ): undefined;

  const compositeActionResolved: {[k: string]: TestCompositeAction} = Object.fromEntries(
    Object.entries(compositeActionTemplate.testCompositeActions).map(([key, value]):[string, TestCompositeAction] => {
      return [
        key,
        resolveTestCompositeActionTemplate(value, currentModelEnvironment, actionParamValues, )
          .resolvedTestCompositeActionDefinition,
      ];
    }
  ));
  // compositeActionTemplate.afterAll?resolveCompositeActionTemplate(
  //   compositeActionTemplate.testCompositeActions,
  //   actionParamValues,
  //   currentModel,
  // ): undefined;

  return {
    resolvedTestCompositeActionDefinition: {
      // ...compositeActionTemplate,
      testLabel: compositeActionTemplate.testLabel,
      testType: "testCompositeActionSuite",
      beforeAll: beforeAllResolved?.resolvedCompositeActionDefinition,
      beforeEach: beforeEachResolved?.resolvedCompositeActionDefinition,
      afterEach: afterEachResolved?.resolvedCompositeActionDefinition,
      afterAll: afterAllResolved?.resolvedCompositeActionDefinition,
      testCompositeActions: compositeActionResolved,
    },
    resolvedCompositeActionTemplates: {}
  }
}