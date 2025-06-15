
import {
  ApplicationSection,
  EntityInstance,
  EntityInstancesUuidIndex,
  JzodElement,
  JzodUnion,
  Uuid
} from "miroir-core";

export interface JzodEditorPropsRoot {
  label?: string;
  name: string;
  listKey: string;
  rootLesslistKey: string;
  rootLesslistKeyArray: string[];
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection;
  initialFormState?: any;
  rawJzodSchema: JzodElement | undefined;
  resolvedElementJzodSchema: JzodElement | undefined;
  unionInformation?:
    | {
        jzodSchema: JzodUnion;
        discriminator: string;
        discriminatorValues: string[];
      }
    | undefined;
  foreignKeyObjects: Record<string, EntityInstancesUuidIndex>; // prop drilling
  returnsEmptyElement?: boolean; // used to force the editor to return an empty element
  insideAny?: boolean;
  // handleSelectLiteralChange?: (event: any) => void;
}

// ################################################################################################
export interface JzodElementEditorProps extends JzodEditorPropsRoot {
  forceTestingMode?: boolean;
  unresolvedJzodSchema?: JzodElement | undefined;
  indentLevel?: number;
  // paramMiroirFundamentalJzodSchema?: JzodSchema; //used only for testing, trouble with using MiroirContextReactProvider
  // currentDeploymentUuid?: Uuid;
  // currentApplicationSection?: ApplicationSection;
}

// ################################################################################################
export interface JzodArrayEditorProps extends JzodEditorPropsRoot {
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection;
  // rawJzodSchema: JzodArray | JzodTuple;
  resolvedElementJzodSchema: JzodElement | undefined;
  // paramMiroirFundamentalJzodSchema?: JzodSchema; //used only for testing, trouble with using MiroirContextReactProvider
  indentLevel?: number;
  hiddenFormItems: { [k: string]: boolean };  
  setHiddenFormItems: React.Dispatch<
    React.SetStateAction<{
      [k: string]: boolean;
    }>
  >;
  // setItemsOrder: React.Dispatch<React.SetStateAction<any[]>>
  itemsOrder: any[];
}

// #################################################################################################
export interface JzodEnumEditorProps extends JzodEditorPropsRoot {
  // rawJzodSchema: JzodEnum | undefined;
  // 
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
  // visible?: boolean;
  indentLevel?: number;
}

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

