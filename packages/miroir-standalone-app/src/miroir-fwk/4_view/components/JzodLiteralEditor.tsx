import { LoggerInterface, MiroirLoggerFactory, resolvePathOnObject } from "miroir-core";
import React from "react";
import { JzodLiteralEditorProps } from "./JzodElementEditorInterface";
import { useFormikContext } from "formik";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";
import { StyledSelect } from "./Style";
import { MenuItem } from "@mui/material";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodLiteralEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

let JzodLiteralEditorRenderCount: number = 0;
export const JzodLiteralEditor: React.FC<JzodLiteralEditorProps> = (
  // props: JzodLiteralEditorProps
  {
  name,
  listKey,
  rootLesslistKey,
  rootLesslistKeyArray,
  // formik,
  // onChange,
  unionInformation,
  handleSelectLiteralChange,
  label,
  // formState,
  }
) => {
  JzodLiteralEditorRenderCount++;
  // const currentValue = resolvePathOnObject(formik.values, rootLesslistKeyArray);
  // console.log(
  //   `JzodLiteralEditor render #${JzodLiteralEditorRenderCount}
  //   name: ${name}
  //   listKey: ${listKey}
  //   rootLesslistKey: ${rootLesslistKey}
  //   rootLesslistKeyArray: ${rootLesslistKeyArray}
  //   label: ${label}
  //   formik.values: ${JSON.stringify(formik.values, null, 2)}
  //   `
  //   // formState: ${JSON.stringify(formState, null, 2)}
  // );
  const formik = useFormikContext<Record<string, any>>();
  
  if (unionInformation) {
    log.info(
      "literal with unionInformation",
      listKey,
      "discriminator=",
      unionInformation.discriminator,
      // "subDiscriminator=",
      // props.unionInformation.subDiscriminator,
      "unionInformation=",
      unionInformation
    );
  }
  return (
    <>
      <>
        {unionInformation &&
        unionInformation.discriminator &&
        unionInformation.discriminatorValues &&
        name == unionInformation.discriminator ? (
          <>
            <StyledSelect
              variant="standard"
              labelId="demo-simple-select-label"
              id={listKey}
              value={formik.values[rootLesslistKey]}
              label={name}
              onChange={handleSelectLiteralChange}
            >
              {unionInformation.discriminatorValues.map((v) => {
                return (
                  <MenuItem key={v} value={v}>
                    {v}
                  </MenuItem>
                );
              })}
            </StyledSelect>{" "}
            literal discriminator
            {/* <div>
              discriminator: {JSON.stringify(props.unionInformation.discriminatorValues)}
            </div> */}
          </>
        ) : (
          <>
            {label && <label htmlFor={rootLesslistKey}>{label}: </label>}
            <input
              type="text"
              id={rootLesslistKey}
              aria-label={label}
              form={"form." + name}
              {...formik.getFieldProps(rootLesslistKey)}
              name={name}
            />
          </>
        )}
      </>
    </>
  );
  // return (
  //   <>
  //     {label && <label htmlFor={rootLesslistKey}>{label}: </label>}
  //     <input
  //       type="text"
  //       id={rootLesslistKey}
  //       aria-label={label}
  //       form={"form." + name}
  //       {...formik.getFieldProps(rootLesslistKey)}
  //       name={name}
  //     />
  //   </>
  // );
};
