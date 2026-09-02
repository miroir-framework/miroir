import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { Formik } from "formik";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it, vi } from "vitest";

import {
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
  entityBook,
  book1,
  reportBookList,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import { getReduxDeploymentsStateIndex } from "miroir-core";
import {
  LocalCacheProvider,
  reduxStoreWithUndoRedoGetInitialState,
  type LocalCacheSliceState,
  type ReduxStateWithUndoRedo,
} from "miroir-react";

import { ReportSectionListDisplay } from "../../src/miroir-fwk/4_view/components/Reports/ReportSectionListDisplay.js";
import { LIST_TRANSFORMER_PAGE_SIZE } from "../../src/miroir-fwk/4_view/components/Reports/listDisplayByTransformer.js";
import { TableComponentTypeSchema } from "../../src/miroir-fwk/4_view/components/Grids/EntityInstanceGridInterface.js";
import { MiroirThemeProvider } from "../../src/miroir-fwk/4_view/contexts/MiroirThemeContext.js";
import { defaultStoredMiroirTheme } from "miroir-test-app_deployment-miroir";

vi.mock("../../src/miroir-fwk/4_view/components/Grids/EntityInstanceGrid.js", () => ({
  EntityInstanceGrid: (props: Record<string, unknown>) => {
    (globalThis as any).__lastEntityInstanceGridProps = props;
    return <div data-testid="entity-instance-grid-stub" />;
  },
}));

vi.mock("../../src/miroir-fwk/4_view/components/JsonObjectEditFormDialog.js", () => ({
  JsonObjectEditFormDialog: () => null,
}));

vi.mock("../../src/miroir-fwk/4_view/components/Reports/TypedValueObjectEditor.js", async () => {
  const { useFormikContext } = await import("formik");
  const {
    annotationPathKey,
    parseMlSchemaAnnotationLabel,
    TransformerNamedBindings,
    TransformerTitleSignature,
  } = await import(
    "../../src/miroir-fwk/4_view/components/Reports/TransformerTypeAnnotation.js"
  );

  return {
  TypedValueObjectEditor: ({
    formikValuePathAsString,
    showMlSchemaTypes,
    mlSchemaTypeAnnotations,
    environmentAnnotations,
    compatibilityWarnings,
  }: {
    formikValuePathAsString: string;
    showMlSchemaTypes?: boolean;
    mlSchemaTypeAnnotations?: { path: (string | number)[]; label: string }[];
    environmentAnnotations?: {
      path: (string | number)[];
      label: string;
      contextNames?: string[];
      parameterNames?: string[];
      transformerType?: string;
    }[];
    compatibilityWarnings?: { path: (string | number)[]; title: string }[];
  }) => {
    const formik = useFormikContext<Record<string, unknown>>();
    const pathsEqual = (
      left: (string | number)[],
      right: (string | number)[],
    ) =>
      left.length === right.length &&
      left.every((segment, index) => String(segment) === String(right[index]));

    return (
      <div data-testid={`tvo-editor-${formikValuePathAsString}`}>
        <button
          type="button"
          data-testid="set-return-value-42"
          onClick={() =>
            formik.setFieldValue(formikValuePathAsString, {
              interpolation: "runtime",
              transformerType: "returnValue",
              value: 42,
            })
          }
        >
          Set returnValue 42
        </button>
        <button
          type="button"
          data-testid="set-failing-transformer"
          onClick={() =>
            formik.setFieldValue(formikValuePathAsString, {
              interpolation: "runtime",
              transformerType: "getFromContext",
              referenceName: "missingRef",
            })
          }
        >
          Set failing transformer
        </button>
        <button
          type="button"
          data-testid="set-menu-addItem-transformer"
          onClick={() =>
            formik.setFieldValue(formikValuePathAsString, {
              interpolation: "runtime",
              transformerType: "transformer_menu_addItem",
            })
          }
        >
          Set transformer_menu_addItem
        </button>
        <button
          type="button"
          data-testid="set-numericOp-transformer"
          onClick={() =>
            formik.setFieldValue(formikValuePathAsString, {
              interpolation: "runtime",
              transformerType: "numericOp",
              op: "*",
              args: [
                { interpolation: "runtime", transformerType: "returnValue", value: 2 },
                { interpolation: "runtime", transformerType: "returnValue", value: 3 },
              ],
            })
          }
        >
          Set numericOp
        </button>
        <button
          type="button"
          data-testid="set-mustache-transformer"
          onClick={() =>
            formik.setFieldValue(formikValuePathAsString, {
              interpolation: "runtime",
              transformerType: "mustacheStringTemplate",
              definition: "Hello {{name}}",
            })
          }
        >
          Set mustache
        </button>
        <button
          type="button"
          data-testid="set-mapList-mustache-transformer"
          onClick={() =>
            formik.setFieldValue(formikValuePathAsString, {
              interpolation: "runtime",
              transformerType: "mapList",
              applyTo: {
                interpolation: "runtime",
                transformerType: "returnValue",
                mlSchema: {
                  type: "array",
                  definition: entityBook.mlSchema ?? {
                    type: "object",
                    definition: { name: { type: "string" } },
                  },
                },
                value: [],
              },
              elementTransformer: {
                interpolation: "runtime",
                transformerType: "mustacheStringTemplate",
                definition: "{{x}}",
              },
            })
          }
        >
          Set mapList mustache
        </button>
        <button
          type="button"
          data-testid="set-name-override-transformer"
          onClick={() =>
            formik.setFieldValue(formikValuePathAsString, {
              interpolation: "runtime",
              transformerType: "mergeIntoObject",
              applyTo: {
                interpolation: "runtime",
                transformerType: "getFromContext",
                referenceName: "row",
              },
              definition: {
                interpolation: "runtime",
                transformerType: "createObject",
                definition: {
                  name: {
                    interpolation: "runtime",
                    transformerType: "returnValue",
                    value: "Overridden Title",
                  },
                },
              },
            })
          }
        >
          Set name override
        </button>
        {showMlSchemaTypes
          ? (mlSchemaTypeAnnotations ?? [])
              .filter((annotation) => annotation.path.length > 0)
              .map((annotation) => {
                const { inLabel, outLabel } = parseMlSchemaAnnotationLabel(annotation.label);
                const pathKey = annotationPathKey(annotation.path);
                const warning = (compatibilityWarnings ?? []).find((item) =>
                  pathsEqual(item.path, annotation.path),
                );
                return (
                  <TransformerTitleSignature
                    key={`mlschema-${pathKey}`}
                    inLabel={inLabel}
                    outLabel={outLabel}
                    inadequate={!!warning}
                    title={warning?.title ?? `${inLabel} → ${outLabel}`}
                    data-testid={`list-transformer-mlschema-node-${pathKey}`}
                  />
                );
              })
          : null}
        {(environmentAnnotations ?? [])
          .filter(
            (annotation) =>
              annotation.path.length > 0 && annotation.transformerType !== undefined,
          )
          .map((annotation) => {
            const pathKey = annotationPathKey(annotation.path);
            return (
              <TransformerNamedBindings
                key={`env-${pathKey}`}
                kind="context"
                names={annotation.contextNames}
                title={annotation.label}
                data-testid={`list-transformer-environment-node-${pathKey}`}
              />
            );
          })}
      </div>
    );
  },
  };
});

vi.mock("../../src/miroir-fwk/4_view/components/Reports/TypedValueObjectEditorWithFormik.js", () => ({
  TypedValueObjectEditorWithFormik: ({
    initialValueObject,
    formValueMLSchema,
  }: {
    initialValueObject: { transformationResult?: unknown };
    formValueMLSchema?: { type?: string };
  }) => (
    <div
      data-testid="list-transformer-result-viewer"
      data-schema-type={formValueMLSchema?.type ?? "missing"}
    >
      {JSON.stringify(initialValueObject.transformationResult)}
    </div>
  ),
}));

vi.mock("miroir-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("miroir-react")>();
  return {
    ...actual,
    JsonDisplayHelper: () => null,
    useMiroirContextService: () => ({
      showPerformanceDisplay: false,
      showDebugInfo: false,
      ensureSchemaForDeployment: vi.fn(),
      deploymentUuidToReportsEntitiesMapping: {
        [deployment_Library_DO_NO_USE.uuid]: {
          data: {
            entities: defaultLibraryAppModel.entities,
            entityVersions: [],
            availableReports: defaultLibraryAppModel.reports,
          },
        },
      },
      schemasPerDeployment: {},
    }),
    useSnackbar: () => ({
      handleAsyncAction: vi.fn(async (action: () => Promise<unknown>) => action()),
      isActionRunning: false,
    }),
    ThemedOnScreenHelper: ({ label, data }: { label: string; data: unknown }) => (
      <div data-testid="list-transformer-failure" data-label={label}>
        {JSON.stringify(data)}
      </div>
    ),
    useDomainControllerService: () => ({
      handleActionFromUI: vi.fn(),
    }),
    useMiroirContextInnerFormOutput: () => [undefined, vi.fn()] as const,
  };
});

function createLibraryBookListStore() {
  const mockLocalCacheSliceState: LocalCacheSliceState = {
    loading: {},
    current: {
      [getReduxDeploymentsStateIndex(deployment_Library_DO_NO_USE.uuid, "model", entityBook.uuid)]: {
        entities: {
          [entityBook.uuid]: entityBook as any,
        },
        ids: [entityBook.uuid],
      },
      [getReduxDeploymentsStateIndex(deployment_Library_DO_NO_USE.uuid, "data", entityBook.uuid)]: {
        entities: {
          [book1.uuid]: book1 as any,
        },
        ids: [book1.uuid],
      },
    },
    status: {
      initialLoadDone: true,
    },
  };

  const mockState: ReduxStateWithUndoRedo =
    reduxStoreWithUndoRedoGetInitialState(() => mockLocalCacheSliceState);
  mockState.presentModelSnapshot = mockLocalCacheSliceState;

  return configureStore({
    reducer: {
      presentModelSnapshot: (state = mockState.presentModelSnapshot) => state,
      currentTransaction: (state = mockState.currentTransaction) => state,
      previousModelSnapshot: (state = mockState.previousModelSnapshot) => state,
      pastModelPatches: (state = mockState.pastModelPatches) => state,
      futureModelPatches: (state = mockState.futureModelPatches) => state,
      queriesResultsCache: (state = mockState.queriesResultsCache) => state,
    },
    preloadedState: mockState,
  });
}

const reportSectionPath = ["definition", "section", "definition", 0] as const;

const testThemeOptions = [
  {
    id: "default",
    name: "Default Theme",
    description: "Test theme",
    theme: defaultStoredMiroirTheme.definition,
  },
];

function renderBookListSection(pageParams: Record<string, unknown> = {}) {
  const store = createLibraryBookListStore();
  const formikInitialValues = {
    [reportBookList.name]: reportBookList,
    books: {
      [book1.uuid]: book1,
    },
  };

  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MiroirThemeProvider currentThemeOptions={testThemeOptions}>
        <LocalCacheProvider store={store}>
          <Formik initialValues={formikInitialValues} onSubmit={vi.fn()}>
            <ReportSectionListDisplay
              label="Books"
              paramsAsdomainElements={pageParams}
              applicationDeploymentMap={{
                [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
              }}
              formikReportDefinitionPathString={reportBookList.name}
              reportSectionPath={[...reportSectionPath]}
              formikValuePath={[...reportSectionPath]}
              tableComponentReportType={TableComponentTypeSchema.enum.EntityInstance}
              chosenApplicationSection="data"
              application={selfApplicationLibrary.uuid}
              deploymentUuid={deployment_Library_DO_NO_USE.uuid}
            />
          </Formik>
        </LocalCacheProvider>
      </MiroirThemeProvider>
    </MemoryRouter>,
  );
}

describe("ListTransformerPanel — list section integration", () => {
  const getTransformerToggle = () => screen.getByRole("button", { name: /functions/i });

  it("shows transformer toggle in the header; panel hidden by default", () => {
    renderBookListSection();

    expect(getTransformerToggle()).toBeInTheDocument();
    expect(screen.queryByTestId("list-transformer-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("entity-instance-grid-stub")).toBeInTheDocument();
  });

  it("mounts the panel below the grid and shows identity-transformed rows", () => {
    renderBookListSection();

    fireEvent.click(getTransformerToggle());

    expect(screen.getByTestId("entity-instance-grid-stub")).toBeInTheDocument();
    expect(screen.getByTestId("list-transformer-panel")).toBeInTheDocument();
    expect(screen.getByTestId("list-transformer-environment-node-root")).toBeInTheDocument();
    expect(screen.getByTestId("list-transformer-result")).toBeInTheDocument();
    const resultViewer = screen.getByTestId("list-transformer-result-viewer");
    const resultText = resultViewer.textContent ?? "";
    expect(resultText).toContain(book1.uuid);
    expect(resultText).toContain(book1.name);
    // Declared schema must not be `any` (that keeps orange union stars).
    expect(resultViewer.getAttribute("data-schema-type")).toBe("array");
  });

  it("recomputes the result when the transformer is edited (returnValue)", () => {
    renderBookListSection();

    fireEvent.click(getTransformerToggle());
    fireEvent.click(screen.getByTestId("set-return-value-42"));

    const resultText = screen.getByTestId("list-transformer-result-viewer").textContent ?? "";
    expect(resultText).toContain("42");
    expect(resultText).not.toContain(book1.uuid);
    expect(screen.getByTestId("entity-instance-grid-stub")).toBeInTheDocument();
  });

  it("overrides one row attribute on every row and keeps the other fields", () => {
    renderBookListSection();

    fireEvent.click(getTransformerToggle());
    fireEvent.click(screen.getByTestId("set-name-override-transformer"));

    const resultText = screen.getByTestId("list-transformer-result-viewer").textContent ?? "";
    expect(resultText).toContain("Overridden Title");
    expect(resultText).toContain(book1.uuid);
    expect(resultText).not.toContain(book1.name);
  });

  it("surfaces transformer failure inline and keeps the grid rendered", () => {
    renderBookListSection();

    fireEvent.click(getTransformerToggle());
    fireEvent.click(screen.getByTestId("set-failing-transformer"));

    expect(screen.getByTestId("list-transformer-failure")).toBeInTheDocument();
    expect(screen.getByTestId("list-transformer-failure").textContent).toContain("ReferenceNotFound");
    expect(screen.queryByTestId("list-transformer-result")).not.toBeInTheDocument();
    expect(screen.getByTestId("entity-instance-grid-stub")).toBeInTheDocument();
  });

  it("switches the grid to pageSize 10 while enabled and restores default paging when disabled", () => {
    renderBookListSection();

    expect((globalThis as any).__lastEntityInstanceGridProps?.pageSize).toBe(50);

    fireEvent.click(getTransformerToggle());
    expect((globalThis as any).__lastEntityInstanceGridProps?.pageSize).toBe(
      LIST_TRANSFORMER_PAGE_SIZE,
    );
    expect(
      (globalThis as any).__lastEntityInstanceGridProps?.onDisplayedPageRowsChange,
    ).toBeTypeOf("function");

    fireEvent.click(getTransformerToggle());
    expect((globalThis as any).__lastEntityInstanceGridProps?.pageSize).toBe(50);
    expect(
      (globalThis as any).__lastEntityInstanceGridProps?.onDisplayedPageRowsChange,
    ).toBeUndefined();
  });

  const expectOrangeBorder = (editor: HTMLElement, inadequate: boolean) => {
    expect(editor.getAttribute("data-transformer-inadequate")).toBe(inadequate ? "true" : "false");
    const borderColor = editor.style.borderColor;
    if (inadequate) {
      expect(borderColor === "#ff9800" || borderColor === "rgb(255, 152, 0)").toBe(true);
    } else {
      expect(borderColor === "#ff9800" || borderColor === "rgb(255, 152, 0)").toBe(false);
    }
  };

  it("offers an output-type chooser defaulting to the row entity (Book)", () => {
    renderBookListSection();

    fireEvent.click(getTransformerToggle());

    expect(screen.getByTestId("list-transformer-given-input-type")).toHaveTextContent(
      entityBook.name,
    );
    expect(
      screen.getByTestId("list-transformer-given-input-type").querySelector("a"),
    ).toBeTruthy();
    const chooser = screen.getByTestId(
      "list-transformer-expected-output-type",
    ) as HTMLSelectElement;
    expect(chooser.value).toBe(entityBook.uuid);
    // base types and entity options are both present
    expect(
      Array.from(chooser.options).map((o) => o.value),
    ).toEqual(expect.arrayContaining(["any", "object", "array", entityBook.uuid]));
  });

  it("shows no inadequacy border for the default identity transformer", () => {
    renderBookListSection();

    fireEvent.click(getTransformerToggle());

    expectOrangeBorder(screen.getByTestId("list-transformer-editor"), false);
  });

  it("borders the editor orange when expected output type does not match inferred actual output", () => {
    renderBookListSection();

    fireEvent.click(getTransformerToggle());
    fireEvent.change(screen.getByTestId("list-transformer-expected-output-type"), {
      target: { value: "array" },
    });

    expectOrangeBorder(screen.getByTestId("list-transformer-editor"), true);
  });

  it("borders the editor orange when expected output entity differs from row entity", () => {
    renderBookListSection();

    fireEvent.click(getTransformerToggle());
    fireEvent.change(screen.getByTestId("list-transformer-expected-output-type"), {
      target: { value: "ca794e28-b2dc-45b3-8137-00151557eea8" },
    });

    expectOrangeBorder(screen.getByTestId("list-transformer-editor"), true);
  });

  it("borders the editor orange when the transformer input does not accept the row entity", () => {
    renderBookListSection();

    fireEvent.click(getTransformerToggle());
    // transformer_menu_addItem declares input = Menu entity uuid, Book rows are not Menus
    fireEvent.click(screen.getByTestId("set-menu-addItem-transformer"));

    expectOrangeBorder(screen.getByTestId("list-transformer-editor"), true);
  });

  it("resolves the inadequacy when the chooser is aligned with the declared output", () => {
    renderBookListSection();

    fireEvent.click(getTransformerToggle());
    // numericOp: input any (ok), output number — but default expected output is Book entity uuid
    fireEvent.click(screen.getByTestId("set-numericOp-transformer"));
    expectOrangeBorder(screen.getByTestId("list-transformer-editor"), true);

    fireEvent.change(screen.getByTestId("list-transformer-expected-output-type"), {
      target: { value: "number" },
    });
    expectOrangeBorder(screen.getByTestId("list-transformer-editor"), false);
  });

  it("keeps the #249 inputOutput path while the mlSchema switch is off", () => {
    renderBookListSection();
    fireEvent.click(getTransformerToggle());

    expect(screen.getByTestId("list-transformer-mlschema-switch")).not.toBeChecked();
    expect(screen.queryByTestId("list-transformer-mlschema-node-root")).not.toBeInTheDocument();
    expect(screen.queryByTestId("list-transformer-mlschema-nodes")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("set-menu-addItem-transformer"));
    expectOrangeBorder(screen.getByTestId("list-transformer-editor"), true);
  });

  it("when mlSchema types are on, shows per-node types and borders mustache against Book rows", () => {
    renderBookListSection();
    fireEvent.click(getTransformerToggle());
    fireEvent.click(screen.getByTestId("list-transformer-mlschema-switch"));

    expect(screen.getByTestId("list-transformer-mlschema-node-root")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("set-mustache-transformer"));
    expectOrangeBorder(screen.getByTestId("list-transformer-editor"), true);
    expect(screen.getByTestId("list-transformer-mlschema-node-root")).toHaveAttribute(
      "data-transformer-inadequate",
      "true",
    );
  });

  it("when mlSchema types are on, identity against Book stays compatible", () => {
    renderBookListSection();
    fireEvent.click(getTransformerToggle());
    fireEvent.click(screen.getByTestId("list-transformer-mlschema-switch"));

    expectOrangeBorder(screen.getByTestId("list-transformer-editor"), false);
    expect(screen.getByTestId("list-transformer-mlschema-node-root")).toHaveAttribute(
      "data-transformer-inadequate",
      "false",
    );
    expect(screen.getByTestId("list-transformer-mlschema-node-root")).toHaveTextContent("Book");
    expect(screen.getByTestId("list-transformer-mlschema-node-root")).toHaveAttribute(
      "title",
      expect.stringMatching(/Book\{uuid/),
    );
    expect(screen.getByTestId("list-transformer-mlschema-node-definition")).toHaveTextContent(
      "undefined",
    );
    expect(screen.getByTestId("list-transformer-mlschema-node-definition")).not.toHaveTextContent(
      "Book{",
    );
  });

  it("when mlSchema types are on, flags a nested mapList.elementTransformer mismatch", () => {
    renderBookListSection();
    fireEvent.click(getTransformerToggle());
    fireEvent.click(screen.getByTestId("list-transformer-mlschema-switch"));
    fireEvent.click(screen.getByTestId("set-mapList-mustache-transformer"));

    expect(
      screen.getByTestId("list-transformer-editor").getAttribute("data-inadequate-paths") ?? "",
    ).toContain("elementTransformer");
    expect(screen.getByTestId("list-transformer-mlschema-node-elementTransformer")).toHaveAttribute(
      "data-transformer-inadequate",
      "true",
    );
  });

  it("lists getFromContext and getFromParameters names per node", () => {
    renderBookListSection({ pageSize: 10 });
    fireEvent.click(getTransformerToggle());

    const root = screen.getByTestId("list-transformer-environment-node-root");
    expect(root).toHaveTextContent("defaultInput, row");
    expect(root).not.toHaveTextContent("pageSize");
    expect(screen.getByTestId("list-transformer-parameters")).toHaveTextContent("pageSize");
    expect(screen.getByTestId("list-transformer-environment-node-applyTo")).toHaveTextContent(
      "defaultInput, row",
    );
    expect(screen.getByTestId("list-transformer-environment-node-applyTo")).not.toHaveTextContent(
      "pageSize",
    );
    expect(screen.getByTestId("list-transformer-environment-node-definition")).toHaveTextContent(
      "defaultInput, row",
    );
  });
});
