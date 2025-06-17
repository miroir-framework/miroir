import { MenuItem } from "@mui/material";
import { LoggerInterface, MiroirLoggerFactory, resolvePathOnObject } from "miroir-core";
import {
  JzodEnum
} from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import React from "react";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";
import { JzodEnumEditorProps } from "./JzodElementEditorInterface";
import { StyledSelect } from "./Style";
import { useFormikContext } from "formik";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});


export const JzodEnumEditor: React.FC<JzodEnumEditorProps> = (
  // props: JzodEnumEditorProps
  {
    name,
    label,
    rawJzodSchema,
    listKey,
    rootLesslistKey,
    rootLesslistKeyArray,
    forceTestingMode,
    unionInformation
  }
) => {
  
  // const currentValue = resolvePathOnObject(props.formik.values, props.rootLesslistKeyArray);
  const formik = useFormikContext<Record<string, any>>();
  log.info(
    `JzodEnumEditor: render for ${name}, rootLesslistKey=${rootLesslistKey}, rawJzodSchema=${JSON.stringify(rawJzodSchema)}`,
    `unionInformation=${JSON.stringify(unionInformation)}`
  );
  return (
    <>
      {unionInformation?.discriminator &&
      unionInformation?.discriminatorValues &&
      name == unionInformation?.discriminator ? ( // NOT USED, unionInformation is null!!
        <>
          <StyledSelect
            id={rootLesslistKey}
            aria-label={rootLesslistKey}
            labelId="demo-simple-select-label"
            variant="standard"
            {...formik.getFieldProps(rootLesslistKey)}
            name={rootLesslistKey}
          >
            {unionInformation?.discriminatorValues.map((v, index) => {
              return (
                <MenuItem key={v} value={v} aria-label={rootLesslistKey + "." + index}>
                  {v}
                </MenuItem>
              );
            })}
          </StyledSelect>
          enum
        </>
      ) : (
        <>
          <StyledSelect
            id={listKey}
            aria-label={rootLesslistKey}
            labelId="demo-simple-select-label"
            variant="standard"
            {...formik.getFieldProps(rootLesslistKey)}
            name={rootLesslistKey}
          >
            {(rawJzodSchema as JzodEnum).definition.map((v, index) => {
              return (
                <MenuItem key={v} value={v} aria-label={rootLesslistKey + "." + index}>
                  {v}
                </MenuItem>
              );
            })}
          </StyledSelect>
        </>
      )}
      {forceTestingMode ? (
        <div>enumValues={JSON.stringify((rawJzodSchema as JzodEnum).definition)}</div>
      ) : (
        <></>
      )}
    </>
  );
};
