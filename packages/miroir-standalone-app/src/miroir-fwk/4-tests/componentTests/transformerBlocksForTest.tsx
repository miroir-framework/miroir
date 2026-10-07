import { applicationTransformerDefinitions, type BlockEditorBuildMarking, type TransformerDefinition } from "miroir-core";
import {
  RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
  transformer_metaModel_entityDefinition_extractAttributes_json,
} from "miroir-app-miroir";
import React, { lazy, Suspense, useCallback, useState } from "react";

import { BlockEditorDisplayContext } from "../../4_view/components/BlockEditor/BlockEditorDisplay.js";

// ################################################################################################
// The block view of a stored TransformerDefinition's body, for the declarative component tests
// (#498). The definition is the real one, looked up by name; its blocks have the ids of the
// instance form's cards (`transformerImplementation.definition…`). The block view loads on demand,
// as in the value editor. `buildMarking` stands for the ViewParams setting of the same name.
// #504: with `runner`, the block view of a Miroir Runner's composite action sequence instead,
// read-only, its blocks with the ids of the Runner form's cards (`definition.compositeActionSequence…`).
// #505: with `editable`, the block view edits a copy of the value, with a tray; the edited value is
// the `data-value` of `block-value`.
// ################################################################################################

const BlockEditorView = lazy(async () => ({
  default: (await import("../../4_view/components/BlockEditor/BlockEditorView.js")).BlockEditorView,
}));

const transformerDefinitionsByName: Record<string, TransformerDefinition> = Object.fromEntries(
  [
    ...Object.values(applicationTransformerDefinitions),
    transformer_metaModel_entityDefinition_extractAttributes_json as TransformerDefinition,
  ].map((definition) => [definition.name, definition]),
);

const runnersByName: Record<string, unknown> = Object.fromEntries(
  Object.values(RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY as Record<string, { name: string }>).map((runner) => [
    runner.name,
    runner,
  ]),
);

export interface TransformerBlocksForTestProps {
  /** The `name` of a TransformerDefinition of the Miroir application. */
  transformerDefinition?: string;
  /** The `name` of a Miroir Runner: its composite action sequence is shown instead (#504). */
  runner?: string;
  /** How build transformers are marked; absent: as the ViewParams say (dashed outline by default). */
  buildMarking?: BlockEditorBuildMarking;
  /** #505: the block view edits the value; edits act at once, as under an undo history. */
  editable?: boolean;
}

/** The value shown and the path of its blocks, or why there is none. */
function shownValue(props: TransformerBlocksForTestProps): { value: unknown; rootLessListKey: string } | string {
  if (props.runner !== undefined) {
    const runner = runnersByName[props.runner] as { definition?: { compositeActionSequence?: unknown } } | undefined;
    return runner?.definition?.compositeActionSequence !== undefined
      ? { value: runner.definition.compositeActionSequence, rootLessListKey: "definition.compositeActionSequence" }
      : `No Runner named ${props.runner} with a composite action sequence`;
  }
  const definition = transformerDefinitionsByName[props.transformerDefinition ?? ""];
  if (!definition) {
    return `No TransformerDefinition named ${props.transformerDefinition}`;
  }
  const implementation = definition.transformerImplementation as { definition?: unknown };
  return { value: implementation.definition, rootLessListKey: "transformerImplementation.definition" };
}

export function TransformerBlocksForTest(props: TransformerBlocksForTestProps) {
  const shown = shownValue(props);
  if (typeof shown === "string") {
    return <span>{shown}</span>;
  }
  const view = (
    <Suspense fallback={<span>Loading block editor...</span>}>
      {props.editable ? (
        <EditableBlocks value={shown.value} rootLessListKey={shown.rootLessListKey} />
      ) : (
        <BlockEditorView value={shown.value} rootLessListKey={shown.rootLessListKey} />
      )}
    </Suspense>
  );
  return props.buildMarking ? (
    <BlockEditorDisplayContext.Provider value={{ buildMarking: props.buildMarking }}>{view}</BlockEditorDisplayContext.Provider>
  ) : (
    view
  );
}

function EditableBlocks(props: { value: unknown; rootLessListKey: string }) {
  const [value, setValue] = useState(props.value);
  const [tray, setTray] = useState<unknown[]>([]);
  const changeTray = useCallback((update: (current: unknown[]) => unknown[]) => setTray(update), []);
  return (
    <>
      <span data-testid="block-value" data-value={JSON.stringify(value)} hidden />
      <BlockEditorView
        value={value}
        rootLessListKey={props.rootLessListKey}
        onCommit={setValue}
        undoable
        tray={tray}
        onTrayChange={changeTray}
      />
    </>
  );
}
