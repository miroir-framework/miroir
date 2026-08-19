import { describe, expect, it } from "vitest";

import {
  buildTransformerEditorPersistedUpdate,
  formikPath_TransformerEditorInputModeSelector,
  transformerEditorPersistedUpdateMatchesPersistedState,
  type TransformerEditorFormikValueType,
} from "../../src/miroir-fwk/4_view/components/TransformerEditor/TransformerEditorInterface.js";

describe("transformerEditorPersistedUpdateMatchesPersistedState", () => {
  const sampleValues: TransformerEditorFormikValueType = {
    transformerEditor_transformer_selector: {
      mode: "here",
      transformer: {
        transformerType: "returnValue",
        mlSchema: { type: "string" },
        value: "hello",
      },
    },
    [formikPath_TransformerEditorInputModeSelector]: {
      mode: "here",
      input: { placeholder: "put your input here..." },
    },
    transformerEditor_input: {},
    selectedEntityInstance: undefined,
    entityInstances: [],
    deploymentUuid: "00000000-0000-0000-0000-000000000001",
    transformerEditor_editor: {
      currentTransformerDefinition: {
        transformerType: "returnValue",
        mlSchema: { type: "string" },
        value: "hello",
      },
    },
  } as TransformerEditorFormikValueType;

  it("returns true when persisted slice already matches form values", () => {
    const update = buildTransformerEditorPersistedUpdate(sampleValues);
    expect(update).not.toBeNull();
    expect(
      transformerEditorPersistedUpdateMatchesPersistedState(update!, {
        ...update,
        showAllInstances: false,
      }),
    ).toBe(true);
  });

  it("returns false when transformer value differs", () => {
    const update = buildTransformerEditorPersistedUpdate(sampleValues);
    expect(update).not.toBeNull();
    expect(
      transformerEditorPersistedUpdateMatchesPersistedState(update!, {
        ...update,
        currentTransformerDefinition: {
          transformerType: "returnValue",
          mlSchema: { type: "string" },
          value: "changed",
        },
      }),
    ).toBe(false);
  });
});
