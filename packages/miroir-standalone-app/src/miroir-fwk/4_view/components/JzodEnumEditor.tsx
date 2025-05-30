import React from "react";
import { StyledSelect } from "./Style";
import { JzodElement, JzodEnum, JzodUnion } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { MenuItem, SelectChangeEvent } from "@mui/material";
import { LoggerInterface, MiroirLoggerFactory } from "miroir-core";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

export interface JzodEnumEditorProps {
  name: string;
  listKey: string;
  rootLesslistKey: string;
  rootLesslistKeyArray: string[];
  enumValues: string[];
  currentValue: any;
  forceTestingMode?: boolean;
  // rawJzodSchema: JzodEnum | JzodUnion;
  rawJzodSchema: JzodElement | undefined;
  onChange: (event: SelectChangeEvent<any>) => void;
  // onChange: (event: React.ChangeEvent) => void;
  label?: string;
  unionInformation:
    | {
        jzodSchema: JzodUnion;
        discriminator: string;
        discriminatorValues: string[];
        setItemsOrder: React.Dispatch<React.SetStateAction<any[]>>;
      }
    | undefined;
}

export const JzodEnumEditor: React.FC<JzodEnumEditorProps> = ({
  name,
  listKey,
  rootLesslistKey,
  enumValues, // TODO: use enumValues instead of rawJzodSchema.definition?
  // value,
  onChange,
  label,
  unionInformation,
  currentValue,
  forceTestingMode,
  rawJzodSchema,

}) => {
  // log.info("JzodEnumEditor render",
  //   "name",
  //   name,
  //   "listKey",
  //   listKey,
  //   "rootLesslistKey",
  //   rootLesslistKey,
  //   "enumValues",
  //   enumValues,
  //   "value",
  //   value,
  //   "currentValue",
  //   currentValue,
  //   "rawJzodSchema",
  //   rawJzodSchema,
  //   "unionInformation",
  //   unionInformation,
  // )
  return (
    <>
      {unionInformation?.discriminator &&
      unionInformation?.discriminatorValues &&
      name == unionInformation?.discriminator ? ( // NOT USED, unionInformation is null!!
        <>
          <StyledSelect
            variant="standard"
            labelId="demo-simple-select-label"
            id={listKey}
            value={currentValue}
            // label={name}
            name={name}
            aria-label={label}
            // onChange={handleSelectEnumChange}
            onChange={onChange}
          >
            {unionInformation?.discriminatorValues.map((v) => {
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
          {/* {label && <label htmlFor={listKey}>{label}: </label>} */}
          <StyledSelect
            variant="standard"
            labelId="demo-simple-select-label"
            id={listKey}
            role={listKey}
            value={currentValue}
            name={name}
            aria-label={label}
            onChange={onChange}
          >
            {(rawJzodSchema as JzodEnum).definition.map((v) => {
              return (
                <MenuItem key={v} value={v}>
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
