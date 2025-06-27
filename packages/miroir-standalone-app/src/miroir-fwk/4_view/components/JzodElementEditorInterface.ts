
import {
  ApplicationSection,
  EntityInstance,
  EntityInstancesUuidIndex,
  JzodElement,
  JzodUnion,
  Uuid
} from "miroir-core";
import { JzodArray } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export interface UnionInformation {
  jzodSchema: JzodUnion;
  objectBranches: JzodElement[];
  discriminator: string;
  discriminatorValues: string[];
}

export interface JzodEditorPropsRoot {
  // label?: string;
  label?: JSX.Element; // used to display a label in the editor
  name: string;
  listKey: string;
  rootLesslistKey: string;
  rootLesslistKeyArray: string[];
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection;
  initialFormState?: any;
  rawJzodSchema: JzodElement | undefined;
  resolvedElementJzodSchema: JzodElement | undefined;
  unionInformation?: UnionInformation | undefined; // prop drilling: for unions only
  foreignKeyObjects: Record<string, EntityInstancesUuidIndex>; // prop drilling: for uuid / objects only
  returnsEmptyElement?: boolean; // used to force the editor to return an empty element
  insideAny?: boolean;
  hidden?: boolean; // used to control visibility of the editor
  optional?: boolean; // used to control if the displayed element can be removed or not
  // displayAsCode?: boolean; // used to display the editor as a structured element, not as code editor
  // handleSelectLiteralChange?: (event: any) => void;
}

// ################################################################################################
export interface JzodElementEditorProps extends JzodEditorPropsRoot {
  forceTestingMode?: boolean;
  unresolvedJzodSchema?: JzodElement | undefined;
  indentLevel: number;
  submitButton?: JSX.Element; // used to display a submit button in the editor
}

// ################################################################################################
export interface JzodArrayEditorProps extends JzodEditorPropsRoot {
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection;
  resolvedElementJzodSchema: JzodElement | undefined;
  unfoldedRawSchema: JzodArray;
  indentLevel?: number;
  hiddenFormItems: { [k: string]: boolean };  
  setHiddenFormItems: React.Dispatch<
    React.SetStateAction<{
      [k: string]: boolean;
    }>
  >;
  // setItemsOrder: React.Dispatch<React.SetStateAction<any[]>>
  itemsOrder: any[];
  displayAsStructuredElementSwitch?: JSX.Element; // used to display switches in the editor
}

// #################################################################################################
export interface JzodEnumEditorProps extends JzodEditorPropsRoot {
  enumValues: string[];
  forceTestingMode?: boolean;
}

// #################################################################################################
export interface JzodLiteralEditorProps extends JzodEditorPropsRoot {
}

// #################################################################################################
export interface JzodAnyEditorProps extends JzodEditorPropsRoot {
  // visible?: boolean;
}

// #################################################################################################
export interface JzodObjectEditorProps extends JzodEditorPropsRoot {
  indentLevel?: number;
  displayAsStructuredElementSwitch?: JSX.Element; // used to display switches in the editor
  jzodSchemaTooltip?: JSX.Element; // used to display the actual raw jzod schema as a tooltip
}

// #####################################################################################################
export type JzodElementEditorReactCodeMirrorProps = {
  initialValue: any;
  // rawJzodSchema: JzodElement;
  // formik: any; // Formik instance
  codeMirrorValue: string;
  setCodeMirrorValue: React.Dispatch<React.SetStateAction<string>>;
  codeMirrorIsValidJson: boolean;
  setCodeMirrorIsValidJson: React.Dispatch<React.SetStateAction<boolean>>;
  rootLesslistKey: string;
  rootLesslistKeyArray: string[];
  isUnderTest?: boolean; // codemirror issue with vitest https://github.com/miroir-framework/miroir/issues/56
  hidden?: boolean; // used to control visibility of the editor 
  insideAny?: boolean; // used to control visibility of the editor
  displayAsStructuredElementSwitch?: JSX.Element;
  jzodSchemaTooltip?: JSX.Element; // used to display the actual raw jzod schema as a tooltip
  // displayAsCode?: boolean; // used to display the editor as a structured element, not as code editor  
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export const noValue = {
  uuid: "31f3a03a-f150-416d-9315-d3a752cb4eb4",
  name: "no value",
  parentUuid: "",
} as EntityInstance;

