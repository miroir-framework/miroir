import type { TransformerForBuildPlusRuntime, Uuid } from "miroir-core";

export type TransformerEditorFormikValueType = {
  transformerEditor_editor_selector: {
    mode?: "here" | "defined" | "none";
    transformer?: TransformerForBuildPlusRuntime;
  };
  transformerEditor_input_selector: {
    mode: "instance" | "here" | "none";
    input?: any;
  };
  transformerEditor_input: any;
  transformerEditor_editor: {
    currentTransformerDefinition: TransformerForBuildPlusRuntime;
  };
}

export interface TransformerEditorProps {
  deploymentUuid: Uuid;
  entityUuid: Uuid;
}
