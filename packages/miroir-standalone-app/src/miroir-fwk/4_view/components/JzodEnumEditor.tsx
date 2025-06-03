import { MenuItem, SelectChangeEvent } from "@mui/material";
import { LoggerInterface, MiroirLoggerFactory, resolvePathOnObject } from "miroir-core";
import {
  JzodEnum,
  JzodUnion
} from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import React, { useMemo } from "react";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";
import { StyledSelect } from "./Style";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

export interface JzodEnumEditorProps {
  label?: string;
  name: string;
  listKey: string;
  rootLesslistKey: string;
  rootLesslistKeyArray: string[];
  enumValues: string[];
  formState: any; // TODO: replace with Formik type
  forceTestingMode?: boolean;
  rawJzodSchema: JzodEnum | undefined;
  onChange: (event: SelectChangeEvent<any>) => void;
  unionInformation:
    | {
        jzodSchema: JzodUnion;
        discriminator: string;
        discriminatorValues: string[];
        setItemsOrder: React.Dispatch<React.SetStateAction<any[]>>;
      }
    | undefined;
}

export const JzodEnumEditor: React.FC<JzodEnumEditorProps> = (
  props: JzodEnumEditorProps
) => {
  
//   log.info(`JzodEnumEditor render
// name: ${props.name}
// formState: ${JSON.stringify(props.formState, null, 2)}
// listKey: ${props.listKey}
// rootLesslistKey: ${props.rootLesslistKey}
// rootLesslistKeyArray: ${props.rootLesslistKeyArray}
// enumValues: ${props.enumValues}
// rawJzodSchema: ${JSON.stringify(props.rawJzodSchema)}
// unionInformation: ${JSON.stringify(props.unionInformation)}
// onChange: ${props.onChange}
// `)
// onChange: ${JSON.stringify(props.onChange, null, 2)}
  const currentValue = resolvePathOnObject(props.formState, props.rootLesslistKeyArray);
  // const currentValue = useMemo(
  //   () => resolvePathOnObject(props.formState, props.rootLesslistKeyArray),
  //   [props.formState, props.rootLesslistKeyArray]
  // );

  return (
    <>
      {props.unionInformation?.discriminator &&
      props.unionInformation?.discriminatorValues &&
      props.name == props.unionInformation?.discriminator ? ( // NOT USED, unionInformation is null!!
        <>
          <StyledSelect
            variant="standard"
            labelId="demo-simple-select-label"
            id={props.listKey}
            value={currentValue}
            name={props.name}
            aria-label={props.label}
            onChange={props.onChange}
          >
            {props.unionInformation?.discriminatorValues.map((v) => {
              return (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              );
            })}
          </StyledSelect>{" "}
          enum
        </>
      ) : (
        <>
          <StyledSelect
            variant="standard"
            labelId="demo-simple-select-label"
            id={props.listKey}
            role={props.listKey}
            value={currentValue}
            name={props.name}
            aria-label={props.label}
            onChange={props.onChange}
          >
            {(props.rawJzodSchema as JzodEnum).definition.map((v) => {
              return (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              );
            })}
          </StyledSelect>
        </>
      )}
      {props.forceTestingMode ? (
        <div>enumValues={JSON.stringify((props.rawJzodSchema as JzodEnum).definition)}</div>
      ) : (
        <></>
      )}
    </>
  );
};
