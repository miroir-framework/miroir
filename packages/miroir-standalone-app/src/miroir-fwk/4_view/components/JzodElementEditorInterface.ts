
import {
  ApplicationSection,
  EntityInstance,
  EntityInstancesUuidIndex,
  JzodElement,
  JzodUnion,
  JzodUnion_RecursivelyUnfold_ReturnType,
  JzodUnion_RecursivelyUnfold_ReturnTypeOK,
  KeyMapEntry,
  Uuid
} from "miroir-core";
import { JzodArray } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export interface UnionInformation {
  unfoldedRawSchema: JzodUnion;
  resolvedElementJzodSchema: JzodElement | undefined;
  objectBranches: JzodElement[];
  discriminator: string;
  discriminatorValues: string[];
}

export interface JzodEditorPropsRoot {
  labelElement?: JSX.Element; // used to display a label in the editor
  name: string;
  listKey: string;
  rootLessListKey: string;
  rootLessListKeyArray: (string | number)[];
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection;
  initialFormState?: any;
  // rawJzodSchema: JzodElement | undefined;
  resolvedElementJzodSchema: JzodElement | undefined;
  typeCheckKeyMap: Record<string, KeyMapEntry> | undefined;
  // objects
  foreignKeyObjects: Record<string, EntityInstancesUuidIndex>; // prop drilling: for uuid / objects only
  returnsEmptyElement?: boolean; // used to force the editor to return an empty element
  // any
  insideAny?: boolean;
  hidden?: boolean; // used to control visibility of the editor
  optional?: boolean; // used to control if the displayed element can be removed or not
  // parentType?: string; // used to control the parent type of the element, used for record elements. TODO: accept real type enum
  deleteButtonElement?: JSX.Element; // used to display a delete button in the editor
  hasTypeError?: boolean; // used to control if the editor has a type error or not
}

// ################################################################################################
export interface JzodElementEditorProps extends JzodEditorPropsRoot {
  forceTestingMode?: boolean;
  unresolvedJzodSchema?: JzodElement | undefined;
  indentLevel: number;
  submitButton?: JSX.Element; // used to display a submit button in the editor
  foldedObjectAttributeOrArrayItems: { [k: string]: boolean };  
  setFoldedObjectAttributeOrArrayItems: React.Dispatch<
    React.SetStateAction<{
      [k: string]: boolean;
    }>
  >;
}

// ################################################################################################
export interface JzodArrayEditorProps extends JzodEditorPropsRoot {
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection;
  resolvedElementJzodSchema: JzodElement | undefined;
  // unfoldedRawSchema: JzodArray;
  indentLevel?: number;
  foldedObjectAttributeOrArrayItems: { [k: string]: boolean };  
  setFoldedObjectAttributeOrArrayItems: React.Dispatch<
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
  deleteButtonElement?: JSX.Element; // used to display a delete button in the editor
  displayAsStructuredElementSwitch?: JSX.Element; // used to display switches in the editor
  jzodSchemaTooltip?: JSX.Element; // used to display the actual raw jzod schema as a tooltip
  foldedObjectAttributeOrArrayItems: { [k: string]: boolean };  
  setFoldedObjectAttributeOrArrayItems: React.Dispatch<
    React.SetStateAction<{
      [k: string]: boolean;
    }>
  >;
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
  rootLessListKey: string;
  rootLessListKeyArray: (string | number)[];
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

