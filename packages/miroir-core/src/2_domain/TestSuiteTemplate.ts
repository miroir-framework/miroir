import { compositeActionSequence, MetaModel, TestCompositeAction, TestCompositeActionSuite, TestCompositeActionTemplate, TestCompositeActionTemplateSuite } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { TransformerFailure } from "../0_interfaces/2_domain/DomainElement";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { resolveCompositeActionTemplate } from "./ResolveCompositeActionTemplate";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TestSuiteTemplate")
).then((logger: LoggerInterface) => {log = logger});

// #################################################################################################
export function resolveTestCompositeActionTemplate(
  testCompositeActionTemplate: TestCompositeActionTemplate,
  currentModelEnvironment: MiroirModelEnvironment,
  actionParamValues: Record<string, any>,
): {
  resolvedTestCompositeActionDefinition: TestCompositeAction,
  resolvedCompositeActionTemplates: Record<string,any>
} {
  // TODO: take transformer failures in template into account
  const compositeActionTemplateResolved = resolveCompositeActionTemplate(
    testCompositeActionTemplate.compositeActionTemplate,
    currentModelEnvironment,
    actionParamValues,
  );
  log.info(
    "resolveTestCompositeActionTemplate compositeActionTemplateResolved",
    JSON.stringify(compositeActionTemplateResolved, null, 2)
  );
  if (compositeActionTemplateResolved instanceof TransformerFailure) {
    throw new Error("resolveTestCompositeActionTemplate compositeActionTemplate resolution failed: " + compositeActionTemplateResolved);
  }

  const afterTestCleanupAction = testCompositeActionTemplate.afterTestCleanupAction?resolveCompositeActionTemplate(
        testCompositeActionTemplate.afterTestCleanupAction,
        currentModelEnvironment,
        actionParamValues,
      ): undefined;
  if (afterTestCleanupAction instanceof TransformerFailure) {
    throw new Error("resolveTestCompositeActionTemplate afterTestCleanupAction resolution failed: " + afterTestCleanupAction);
  }

  const beforeTestSetupAction = testCompositeActionTemplate.beforeTestSetupAction?resolveCompositeActionTemplate(
        testCompositeActionTemplate.beforeTestSetupAction,
        currentModelEnvironment,
        actionParamValues,
      ): undefined;
  if (beforeTestSetupAction instanceof TransformerFailure) {
    throw new Error("resolveTestCompositeActionTemplate beforeTestSetupAction resolution failed: " + beforeTestSetupAction);
  }
  return {
    resolvedTestCompositeActionDefinition: {
      testLabel: testCompositeActionTemplate.testLabel,
      testType: "testCompositeAction",
      ...(afterTestCleanupAction?.resolvedCompositeActionDefinition?{afterTestCleanupAction: afterTestCleanupAction?.resolvedCompositeActionDefinition}: {}),
      ...(beforeTestSetupAction?.resolvedCompositeActionDefinition?{beforeTestSetupAction: beforeTestSetupAction?.resolvedCompositeActionDefinition}: {}),
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
  
  if (beforeAllResolved instanceof TransformerFailure) {
    throw new Error("resolveTestCompositeActionTemplateSuite beforeAll resolution failed: " + beforeAllResolved);
  }

  const beforeEachResolved = compositeActionTemplate.beforeEach?resolveCompositeActionTemplate(
    compositeActionTemplate.beforeEach,
    currentModelEnvironment,
    actionParamValues,
  ): undefined;

  if (beforeEachResolved instanceof TransformerFailure) {
    throw new Error("resolveTestCompositeActionTemplateSuite beforeEach resolution failed: " + beforeEachResolved);
  }
  const afterEachResolved = compositeActionTemplate.afterEach?resolveCompositeActionTemplate(
    compositeActionTemplate.afterEach,
    currentModelEnvironment,
    actionParamValues,
  ): undefined;

  if (afterEachResolved instanceof TransformerFailure) {
    throw new Error("resolveTestCompositeActionTemplateSuite afterEach resolution failed: " + afterEachResolved);
  }

  const afterAllResolved = compositeActionTemplate.afterAll?resolveCompositeActionTemplate(
    compositeActionTemplate.afterAll,
    currentModelEnvironment,
    actionParamValues,
  ): undefined;

  if (afterAllResolved instanceof TransformerFailure) {
    throw new Error("resolveTestCompositeActionTemplateSuite afterAll resolution failed: " + afterAllResolved);
  }

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
      ...(beforeAllResolved?.resolvedCompositeActionDefinition?{beforeAll: beforeAllResolved?.resolvedCompositeActionDefinition}: {}),
      ...(beforeEachResolved?.resolvedCompositeActionDefinition?{beforeEach: beforeEachResolved?.resolvedCompositeActionDefinition}: {}),
      ...(afterEachResolved?.resolvedCompositeActionDefinition?{afterEach: afterEachResolved?.resolvedCompositeActionDefinition}: {}),
      ...(afterAllResolved?.resolvedCompositeActionDefinition?{afterAll: afterAllResolved?.resolvedCompositeActionDefinition}: {}),
      testCompositeActions: compositeActionResolved,
    },
    resolvedCompositeActionTemplates: {}
  }
}