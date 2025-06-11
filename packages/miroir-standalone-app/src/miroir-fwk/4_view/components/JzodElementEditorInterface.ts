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
  // formState: any; // TODO: replace with Formik type
  initialFormState?: any;
  // rawJzodSchema: JzodElement | undefined;
  // enumValues: string[];
  // onChange: (event: SelectChangeEvent<any>) => void;
  // forceTestingMode?: boolean;
  unionInformation?:
    | {
        jzodSchema: JzodUnion;
        discriminator: string;
        discriminatorValues: string[];
        setItemsOrder: React.Dispatch<React.SetStateAction<any[]>>;
      }
    | undefined;
  handleSelectLiteralChange?: (event: any) => void;
}

// ################################################################################################
export interface JzodElementEditorProps extends JzodEditorPropsRoot {
  forceTestingMode?: boolean;
  // label?: string;
  // name: string;
  // listKey: string;
  // rootLesslistKey: string;
  // rootLesslistKeyArray: string[];
  indentLevel?: number;
  rawJzodSchema: JzodElement | undefined;
  resolvedElementJzodSchema: JzodElement | undefined;
  unresolvedJzodSchema?: JzodElement | undefined;
  paramMiroirFundamentalJzodSchema?: JzodSchema; //used only for testing, trouble with using MiroirContextReactProvider
  unionInformation?:
    | {
        jzodSchema: JzodUnion;
        objectBranches: JzodElement[];
        discriminator: string;
        discriminatorValues: string[];
        // subDiscriminator?: string,
        // subDiscriminatorValues?: string[],
        setItemsOrder: React.Dispatch<React.SetStateAction<any[]>>;
      }
    | undefined;
  foreignKeyObjects: Record<string, EntityInstancesUuidIndex>;
  currentDeploymentUuid?: Uuid;
  currentApplicationSection?: ApplicationSection;
  // setFormState: (e: ChangeEvent<Record<string, any>>) => void;
  parentObjectSetItemsOrder?: React.Dispatch<React.SetStateAction<any[]>>;
  parentObjectItemsOrder?: any[];
}

// ################################################################################################
export interface JzodArrayEditorProps extends JzodEditorPropsRoot {
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection;
  rawJzodSchema: JzodArray | JzodTuple;
  resolvedElementJzodSchema: JzodElement | undefined;
  paramMiroirFundamentalJzodSchema?: JzodSchema; //used only for testing, trouble with using MiroirContextReactProvider
  foreignKeyObjects: Record<string, EntityInstancesUuidIndex>;
  // value: any;
  // 
  // 
  indentLevel?: number;
  hiddenFormItems: { [k: string]: boolean };  
  // setHiddenFormItems: any,
  setHiddenFormItems: React.Dispatch<
    React.SetStateAction<{
      [k: string]: boolean;
    }>
  >;
  setItemsOrder: React.Dispatch<React.SetStateAction<any[]>>
  itemsOrder: any[];
  // setFormState: (e: ChangeEvent<Record<string, any>>) => void;
}

// #################################################################################################
export interface JzodEnumEditorProps extends JzodEditorPropsRoot {
  // onChange: (event: SelectChangeEvent<any>) => void;
  rawJzodSchema: JzodEnum | undefined;
  // 
  enumValues: string[];
  forceTestingMode?: boolean;
  unionInformation:
    | {
        jzodSchema: JzodUnion;
        discriminator: string;
        discriminatorValues: string[];
        setItemsOrder: React.Dispatch<React.SetStateAction<any[]>>;
      }
    | undefined;
}

// #################################################################################################
export interface JzodLiteralEditorProps extends JzodEditorPropsRoot {
  // unionInformation:
  //   | {
  //       jzodSchema: JzodUnion;
  //       discriminator: string;
  //       discriminatorValues: string[];
  //       setItemsOrder: React.Dispatch<React.SetStateAction<any[]>>;
  //     }
  //   | undefined;
  // handleSelectLiteralChange: (event: any) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

