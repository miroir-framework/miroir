import { applicationTransformerDefinitions, type TransformerDefinition } from "miroir-core";
import { transformer_metaModel_entityDefinition_extractAttributes_json } from "miroir-app-miroir";
import React, { lazy, Suspense } from "react";

// ################################################################################################
// The block view of a stored TransformerDefinition's body, for the declarative component tests
// (#498). The definition is the real one, looked up by name; its blocks have the ids of the
// instance form's cards (`transformerImplementation.definition…`). The block view loads on demand,
// as in the value editor.
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

export interface TransformerBlocksForTestProps {
  /** The `name` of a TransformerDefinition of the Miroir application. */
  transformerDefinition: string;
}

export function TransformerBlocksForTest(props: TransformerBlocksForTestProps) {
  const definition = transformerDefinitionsByName[props.transformerDefinition];
  if (!definition) {
    return <span>No TransformerDefinition named {props.transformerDefinition}</span>;
  }
  const implementation = definition.transformerImplementation as { definition?: unknown };
  return (
    <Suspense fallback={<span>Loading block editor...</span>}>
      <BlockEditorView value={implementation.definition} rootLessListKey="transformerImplementation.definition" />
    </Suspense>
  );
}
