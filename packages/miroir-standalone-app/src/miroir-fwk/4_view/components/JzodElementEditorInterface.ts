import { SelectChangeEvent } from "@mui/material";
import { FormikProps } from "formik";
import { ApplicationSection, EntityInstancesUuidIndex, JzodArray, JzodElement, JzodEnum, JzodObject, JzodSchema, JzodTuple, JzodUnion, Uuid } from "miroir-core";
import { ChangeEvent } from "react";

export interface JzodEditorPropsRoot {
  label?: string;
  name: string;
  listKey: string;
  rootLesslistKey: string;
  rootLesslistKeyArray: string[];
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection;
  initialFormState?: any;
  resolvedElementJzodSchema: JzodElement | undefined;
  unionInformation?:
    | {
        jzodSchema: JzodUnion;
        discriminator: string;
        discriminatorValues: string[];
      }
    | undefined;
  // handleSelectLiteralChange?: (event: any) => void;
}

// ################################################################################################
export interface JzodElementEditorProps extends JzodEditorPropsRoot {
  forceTestingMode?: boolean;
  indentLevel?: number;
  rawJzodSchema: JzodElement | undefined;
  unresolvedJzodSchema?: JzodElement | undefined;
  paramMiroirFundamentalJzodSchema?: JzodSchema; //used only for testing, trouble with using MiroirContextReactProvider
  foreignKeyObjects: Record<string, EntityInstancesUuidIndex>;
  currentDeploymentUuid?: Uuid;
  currentApplicationSection?: ApplicationSection;
}

// ################################################################################################
export interface JzodArrayEditorProps extends JzodEditorPropsRoot {
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection;
  rawJzodSchema: JzodArray | JzodTuple;
  resolvedElementJzodSchema: JzodElement | undefined;
  paramMiroirFundamentalJzodSchema?: JzodSchema; //used only for testing, trouble with using MiroirContextReactProvider
  foreignKeyObjects: Record<string, EntityInstancesUuidIndex>;
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
  rawJzodSchema: JzodEnum | undefined;
  // 
  enumValues: string[];
  forceTestingMode?: boolean;
}

// #################################################################################################
export interface JzodLiteralEditorProps extends JzodEditorPropsRoot {
}

