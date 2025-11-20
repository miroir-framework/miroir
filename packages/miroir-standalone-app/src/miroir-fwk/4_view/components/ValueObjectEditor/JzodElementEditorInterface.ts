
import { FormikProps } from "formik";
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
  reportSectionPathAsString: string;
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection;
  initialFormState?: any;
  resolvedElementJzodSchemaDEFUNCT: JzodElement | undefined; // TODO: remove (?) this is included in typeCheckKeyMap
  typeCheckKeyMap: Record<string, KeyMapEntry> | undefined;
  // objects
  foreignKeyObjects: Record<string, EntityInstancesUuidIndex>; // prop drilling: for uuid / objects only
  returnsEmptyElement?: boolean; // used to force the editor to return an empty element
  // any
  isTopLevel?: boolean; // used to control if the editor is an inner editor (used for any type)
  insideAny?: boolean;
  hidden?: boolean; // used to control visibility of the editor
  optional?: boolean; // used to control if the displayed element can be removed or not
  // parentType?: string; // used to control the parent type of the element, used for record elements. TODO: accept real type enum
  deleteButtonElement?: JSX.Element; // used to display a delete button in the editor
  hasTypeError?: boolean; // used to control if the editor has a type error or not
  readOnly?: boolean; // used to switch between editable and read-only display modes
  // error highlighting
  displayError?: {
    errorPath: string[]; // Path to element that should be highlighted with red border due to error
    errorMessage: string; // Error message to display as tooltip or title
  };
  // external field change observation
  onChangeVector?: Record<string, (value: any, rootLessListKey: string) => void>; // callbacks indexed by rootLessListKey for selective field observation
}

// ################################################################################################
export interface JzodElementEditorProps extends JzodEditorPropsRoot {
  forceTestingMode?: boolean;
  unresolvedJzodSchema?: JzodElement | undefined;
  indentLevel: number;
  submitButton?: JSX.Element; // used to display a submit button in the editor
  extraToolsButtons?: JSX.Element; // used to display extra tool buttons on the title line
  maxRenderDepth?: number; // Optional max depth for initial rendering, default 1
}

// ################################################################################################
export interface JzodArrayEditorProps extends JzodEditorPropsRoot {
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection;
  resolvedElementJzodSchemaDEFUNCT: JzodElement | undefined;
  // unfoldedRawSchema: JzodArray;
  indentLevel?: number;
  itemsOrder: any[];
  displayAsStructuredElementSwitch?: JSX.Element; // used to display switches in the editor
  maxRenderDepth?: number; // Optional max depth for initial rendering, default 1
}

// #################################################################################################
export interface JzodEnumEditorProps extends JzodEditorPropsRoot {
  enumValues: string[];
  forceTestingMode?: boolean;
}

// #################################################################################################
export interface JzodLiteralEditorProps extends JzodEditorPropsRoot {
  hasPathError?: boolean;
}

// #################################################################################################
export interface JzodAnyEditorProps extends JzodEditorPropsRoot {
  // visible?: boolean;
}

// #################################################################################################
/**
 * @interface JzodObjectEditorProps
 * Props for the JzodObjectEditor component.
 * @extends JzodEditorPropsRoot
 * @property {number} [indentLevel] - Optional indent level for nested objects.
 * @property {JSX.Element} [deleteButtonElement] - Optional delete button element to display in the editor.
 * @property {JSX.Element} [displayAsStructuredElementSwitch] - Optional switch element to toggle structured display.
 * @property {JSX.Element} [jzodSchemaTooltip] - Optional tooltip element to display the raw Jzod schema.
 * @property {number} [maxRenderDepth] - Optional max depth for initial rendering, default is 1.
 * @property {JSX.Element} [extraToolsButtons] - Optional extra tool buttons to display on the title line.
 */
export interface JzodObjectEditorProps extends JzodEditorPropsRoot {
  indentLevel?: number;
  deleteButtonElement?: JSX.Element; // used to display a delete button in the editor
  displayAsStructuredElementSwitch?: JSX.Element; // used to display switches in the editor
  jzodSchemaTooltip?: JSX.Element; // used to display the actual raw jzod schema as a tooltip
  maxRenderDepth?: number; // Optional max depth for initial rendering, default 1
  extraToolsButtons?: JSX.Element; // used to display extra tool buttons on the title line
}

// #####################################################################################################
export type JzodElementEditorReactCodeMirrorProps = {
  initialValue: any;
  // rawJzodSchema: JzodElement;
  // formik: any; // Formik instance
  formikRootLessListKey: string;
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
  readOnly?: boolean; // NEW: if true, display as read-only code block
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

