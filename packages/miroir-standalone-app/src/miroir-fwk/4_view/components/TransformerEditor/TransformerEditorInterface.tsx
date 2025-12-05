import type { EntityInstance, TransformerForBuildPlusRuntime, Uuid } from "miroir-core";

// TODO: remove formikPath_EntityInstanceSelectorPanel from this file, it belongs with EntityInstanceSelectorPanel 
export const formikPath_EntityInstanceSelectorPanel = "entityInstanceSelector"

export type TransformerEditorFormikValueType = {
  transformerEditor_transformer_selector: {
    mode?: "here" | "defined" | "none";
    transformer?: TransformerForBuildPlusRuntime;
  };
  [formikPath_TransformerEditorInputModeSelector]: {
    mode: "instance" | "here" | "none";
    input?: any;
  };
  [formikPath_EntityInstanceSelectorPanel]: {
    // selectedApplicationUuid?: Uuid;
    application?: Uuid;
    // selectedEntityInstanceUuid?: Uuid;
    // showAllInstances: boolean;
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

export const formikPath_TransformerEditorInputModeSelector = "transformerEditor_inputModeSelector"
