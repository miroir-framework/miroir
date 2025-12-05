import type { EntityInstance, TransformerForBuildPlusRuntime, Uuid } from "miroir-core";

export type TransformerEditorFormikValueType = {
  transformerEditor_transformer_selector: {
    mode?: "here" | "defined" | "none";
    transformer?: TransformerForBuildPlusRuntime;
  };
  transformerEditor_input_selector: {
    mode: "instance" | "here" | "none";
    input?: any;
  };
  // 
  transformerEditor_input: any;
  selectedEntityInstance: EntityInstance | undefined;
  entityInstances: EntityInstance[];
  deploymentUuid: Uuid;
  // 
  transformerEditor_editor: {
    currentTransformerDefinition: TransformerForBuildPlusRuntime;
  };
}

export interface TransformerEditorProps {
  deploymentUuid: Uuid;
  entityUuid: Uuid;
}
