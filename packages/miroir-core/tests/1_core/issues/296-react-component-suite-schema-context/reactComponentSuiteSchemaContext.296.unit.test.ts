/**
 * Issue #296: the MiroirTest instance editor could not type-check a `reactComponentTestSuite`.
 *
 * The editor (`TypedValueObjectEditor`) calls `jzodTypeCheck` on the displayed instance with the
 * flattened MiroirTest mlSchema (`entityWithResolvedMLSchema`) and an empty relative context, then
 * renders each node from the flat `keyMap`. `JzodObjectEditor` re-resolves a keyMap entry whose
 * `rawSchema` is a `schemaReference` with `resolveJzodSchemaReferenceInContext(rawSchema,
 * rawSchema.context ?? {}, ...)`. The MiroirTest context lives on an ancestor
 * (`mlSchema.definition.definition.context`), so a bare relative reference reached below it (the
 * `reactComponentTestSuite.miroirTests` items, `steps` items, `target`, `name`, ...) could not be
 * resolved from its keyMap entry:
 * `resolveJzodSchemaReferenceInContext could not resolve reference
 * {"relativePath":"miroirTestForReactComponent"} ... relativeReferenceJzodContext keys {}`.
 * References inside a union (e.g. `miroirTestSuite.miroirTests` items) were not affected: their
 * keyMap entry holds the union, not the reference.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-core -- 296-react-component-suite-schema-context
 * ```
 */
import { describe, expect, it } from "vitest";

import {
  entityMiroirTest,
  miroirTest_JzodAnyEditor_ComponentTestSuite,
} from "miroir-test-app_deployment-miroir";

import {
  defaultMiroirModelEnvironment,
  entityWithResolvedMLSchema,
  getInnermostTypeCheckError,
  jzodTypeCheck,
  resolveJzodSchemaReferenceInContext,
  type Entity,
  type JzodElement,
  type MiroirModelEnvironment,
  type ResolvedJzodSchemaReturnType,
} from "miroir-core";

// ################################################################################################
const miroirTestMlSchema: JzodElement = entityWithResolvedMLSchema(entityMiroirTest as Entity)
  .mlSchema as JzodElement;

/** Type-checks `instance` the way `TypedValueObjectEditor` does. */
function typeCheckLikeTheEditor(instance: any): ResolvedJzodSchemaReturnType {
  return jzodTypeCheck(
    miroirTestMlSchema,
    instance,
    [],
    [],
    defaultMiroirModelEnvironment as MiroirModelEnvironment,
    {}, // relativeReferenceJzodContext
    instance, // currentDefaultValue
    {} as any, // reduxDeploymentsState: truthy, UI path
    undefined,
    instance, // rootObject
  );
}

function expectOk(result: ResolvedJzodSchemaReturnType) {
  if (result.status !== "ok") {
    console.error(
      "#296 jzodTypeCheck failed:",
      JSON.stringify(getInnermostTypeCheckError(result as any), null, 2),
    );
  }
  expect(result.status).toBe("ok");
}

/**
 * The keyMap contract the editor relies on (`JzodObjectEditor`): a `schemaReference` rawSchema can
 * be resolved from the entry alone. Returns the keys that cannot.
 */
function unresolvableSchemaReferenceKeys(result: ResolvedJzodSchemaReturnType): string[] {
  if (result.status !== "ok") return ["<type check failed>"];
  const failures: string[] = [];
  for (const [key, entry] of Object.entries(result.keyMap ?? {})) {
    if (entry.rawSchema?.type !== "schemaReference") continue;
    try {
      resolveJzodSchemaReferenceInContext(
        entry.rawSchema as any,
        (entry.rawSchema as any).context ?? {},
        defaultMiroirModelEnvironment as MiroirModelEnvironment,
      );
    } catch (e) {
      failures.push(`${key}: ${String((e as Error).message ?? e).slice(0, 110)}`);
    }
  }
  return failures;
}

const leafWithSteps = (label: string) => ({
  miroirTestType: "reactComponentTest",
  miroirTestLabel: label,
  componentProps: { initialFormState: "hello" },
  steps: [
    {
      step: "expectElement",
      label: "star",
      target: { widget: "unionTypeStar", field: "testField" },
    },
    {
      step: "expectElement",
      label: "text",
      target: { byText: { regex: "hel+o" } },
      parentContains: { byRole: "button", name: "ok" },
    },
    { step: "toggleUnionTypeSelector", label: "open", field: "testField" },
  ],
});

const reactComponentSuite = (label: string) => ({
  miroirTestType: "reactComponentTestSuite",
  miroirTestLabel: label,
  component: "JzodElementEditor",
  componentProps: { rawJzodSchema: { type: "any" } },
  miroirTests: [leafWithSteps(label + " leaf 1"), leafWithSteps(label + " leaf 2")],
});

const instanceWith = (definition: any) => ({
  ...(miroirTest_JzodAnyEditor_ComponentTestSuite as any),
  definition,
});

// ################################################################################################
describe("issue 296: MiroirTest editor type-check of a reactComponentTestSuite", () => {
  it("type-checks the real JzodAnyEditor_ComponentTestSuite instance, leaves and steps resolved", () => {
    const instance: any = miroirTest_JzodAnyEditor_ComponentTestSuite;
    const result = typeCheckLikeTheEditor(instance);
    expectOk(result);
    if (result.status !== "ok") return;

    const keyMap = result.keyMap ?? {};
    const leaves: any[] = instance.definition.miroirTests[0].miroirTests;
    expect(leaves.length).toBeGreaterThan(0);
    leaves.forEach((leaf, i) => {
      const leafKey = `definition.miroirTests.0.miroirTests.${i}`;
      expect(keyMap[leafKey]?.resolvedSchema?.type, leafKey).toBe("object");
      expect(
        (keyMap[leafKey]?.resolvedSchema as any)?.definition?.miroirTestType?.definition,
        leafKey,
      ).toBe("reactComponentTest");
      (leaf.steps as any[]).forEach((_step, j) => {
        const stepKey = `${leafKey}.steps.${j}`;
        expect(keyMap[stepKey]?.resolvedSchema?.type, stepKey).toBe("object");
      });
    });
    expect(unresolvableSchemaReferenceKeys(result)).toEqual([]);
  });

  it("type-checks a reactComponentTestSuite nested in a miroirTestSuite nested in the root suite", () => {
    const result = typeCheckLikeTheEditor(
      instanceWith({
        miroirTestType: "miroirTestSuite",
        miroirTestLabel: "root",
        miroirTests: [
          {
            miroirTestType: "miroirTestSuite",
            miroirTestLabel: "nested",
            miroirTests: [reactComponentSuite("deep")],
          },
          reactComponentSuite("shallow"),
        ],
      }),
    );
    expectOk(result);
    if (result.status !== "ok") return;
    const keyMap = result.keyMap ?? {};
    for (const leafKey of [
      "definition.miroirTests.0.miroirTests.0.miroirTests.0",
      "definition.miroirTests.0.miroirTests.0.miroirTests.1",
      "definition.miroirTests.1.miroirTests.0",
      "definition.miroirTests.1.miroirTests.1",
    ]) {
      expect(keyMap[leafKey]?.resolvedSchema?.type, leafKey).toBe("object");
      expect(keyMap[`${leafKey}.steps.0.target`]?.resolvedSchema?.type, leafKey).toBe("object");
      expect(keyMap[`${leafKey}.steps.1.target.byText`]?.resolvedSchema?.type, leafKey).toBe("object");
    }
    expect(unresolvableSchemaReferenceKeys(result)).toEqual([]);
  });

  it("rejects a reactComponentTest leaf with an invalid step (the leaf schema is really applied)", () => {
    const badSuite: any = reactComponentSuite("bad");
    badSuite.miroirTests[0].steps = [{ step: "notAStep", label: "x" }];
    const result = typeCheckLikeTheEditor(
      instanceWith({
        miroirTestType: "miroirTestSuite",
        miroirTestLabel: "root",
        miroirTests: [badSuite],
      }),
    );
    expect(result.status).toBe("error");
    expect(JSON.stringify(result)).not.toContain("could not resolve reference");
  });
});
