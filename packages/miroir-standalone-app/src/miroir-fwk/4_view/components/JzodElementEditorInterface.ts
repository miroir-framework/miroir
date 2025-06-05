import { SelectChangeEvent } from "@mui/material";
import { FormikProps } from "formik";
import { ApplicationSection, EntityInstancesUuidIndex, JzodArray, JzodElement, JzodEnum, JzodSchema, JzodUnion, Uuid } from "miroir-core";
import { ChangeEvent } from "react";

export interface JzodEditorPropsRoot {
  label?: string;
  name: string;
  listKey: string;
  rootLesslistKey: string;
  rootLesslistKeyArray: string[];
  // formState: any; // TODO: replace with Formik type
  initialFormState?: any;
  formik: FormikProps<any>;
  // rawJzodSchema: JzodElement | undefined;
  // enumValues: string[];
  // onChange: (event: SelectChangeEvent<any>) => void;
  // forceTestingMode?: boolean;
  // unionInformation:
  //   | {
  //       jzodSchema: JzodUnion;
  //       discriminator: string;
  //       discriminatorValues: string[];
  //       setItemsOrder: React.Dispatch<React.SetStateAction<any[]>>;
  //     }
  //   | undefined;
}

// ################################################################################################
export interface JzodArrayEditorProps extends JzodEditorPropsRoot {
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection;
  rawJzodSchema: JzodArray;
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
  // formik: FormikProps<any>;
  handleChange: (e: ChangeEvent<any>) => Promise<void>;
  setFormState: React.Dispatch<
    React.SetStateAction<{
      [k: string]: any;
    }>
  >;

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

export interface JzodLiteralEditorProps extends JzodEditorPropsRoot {
  // label?: string;
  // name: string;
  // listKey: string;
  // rootLesslistKey: string;
  // rootLesslistKeyArray: string[];
  // value: any;
  // formState: any; // TODO: replace with Formik type
  // formik: FormikProps<any>;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

