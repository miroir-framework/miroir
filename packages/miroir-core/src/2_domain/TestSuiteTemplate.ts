import { compositeAction, MetaModel, TestCompositeAction, TestCompositeActionSuite, TestCompositeActionTemplate, TestCompositeActionTemplateSuite } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/LoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { resolveCompositeActionTemplate } from "./ResolveCompositeActionTemplate";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TestSuiteTemplate")
).then((logger: LoggerInterface) => {log = logger});

export function resolveTestCompositeActionTemplate(
  testCompositeActionTemplate: TestCompositeActionTemplate,
  actionParamValues: Record<string, any>,
  currentModel: MetaModel
): {
  resolvedTestCompositeActionDefinition: TestCompositeAction,
  resolvedCompositeActionTemplates: Record<string,any>
} {
  const compositeActionTemplateResolved = resolveCompositeActionTemplate(
    testCompositeActionTemplate.compositeActionTemplate,
    actionParamValues,
    currentModel,
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
        actionParamValues,
        currentModel,
      ).resolvedCompositeActionDefinition: undefined,
      beforeTestSetupAction: testCompositeActionTemplate.beforeTestSetupAction?resolveCompositeActionTemplate(
        testCompositeActionTemplate.beforeTestSetupAction,
        actionParamValues,
        currentModel,
      ).resolvedCompositeActionDefinition: undefined,
      testCompositeActionAssertions: testCompositeActionTemplate.testCompositeActionAssertions,
      compositeAction: compositeActionTemplateResolved.resolvedCompositeActionDefinition,
    },
    resolvedCompositeActionTemplates: {}
  }
  
}

// #################################################################################################
export function resolveTestCompositeActionTemplateSuite(
  compositeActionTemplate: TestCompositeActionTemplateSuite,
  actionParamValues: Record<string, any>,
  currentModel: MetaModel
): {
  resolvedTestCompositeActionDefinition: TestCompositeActionSuite,
  resolvedCompositeActionTemplates: Record<string,any>
} {

  const beforeAllResolved = compositeActionTemplate.beforeAll?resolveCompositeActionTemplate(
    compositeActionTemplate.beforeAll,
    actionParamValues,
    currentModel,
  ): undefined;
  
  const beforeEachResolved = compositeActionTemplate.beforeEach?resolveCompositeActionTemplate(
    compositeActionTemplate.beforeEach,
    actionParamValues,
    currentModel,
  ): undefined;

  const afterEachResolved = compositeActionTemplate.afterEach?resolveCompositeActionTemplate(
    compositeActionTemplate.afterEach,
    actionParamValues,
    currentModel,
  ): undefined;

  const afterAllResolved = compositeActionTemplate.afterAll?resolveCompositeActionTemplate(
    compositeActionTemplate.afterAll,
    actionParamValues,
    currentModel,
  ): undefined;

  const compositeActionResolved: {[k: string]: TestCompositeAction} = Object.fromEntries(
    Object.entries(compositeActionTemplate.testCompositeActions).map(([key, value]):[string, TestCompositeAction] => {
      return [
        key,
        resolveTestCompositeActionTemplate(value, actionParamValues, currentModel)
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