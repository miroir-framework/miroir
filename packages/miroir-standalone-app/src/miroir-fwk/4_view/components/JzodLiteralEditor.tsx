import { resolvePathOnObject } from "miroir-core";
import React from "react";
import { JzodLiteralEditorProps } from "./JzodElementEditorInterface";
import { J } from "vitest/dist/chunks/reporters.D7Jzd9GS";
import { useFormikContext } from "formik";

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
  
        // if (props.unionInformation) {
        //   log.info(
        //     "literal with unionInformation",
        //     props.listKey,
        //     "discriminator=",
        //     props.unionInformation.discriminator,
        //     // "subDiscriminator=",
        //     // props.unionInformation.subDiscriminator,
        //     "unionInformation=",
        //     props.unionInformation
        //   );
        // }
        // return (
        //   <>
        //     {/* <label htmlFor={props.listKey}>{displayedLabel}: </label> */}
        //     {/* {props.unionInformation ? ( */}
        //       // <>
        //       //   {props.unionInformation.discriminator &&
        //       //   props.unionInformation.discriminatorValues &&
        //       //   props.name == props.unionInformation.discriminator ? (
        //       //     <>
        //       //       <StyledSelect
        //       //         variant="standard"
        //       //         labelId="demo-simple-select-label"
        //       //         id={props.listKey}
        //       //         value={currentValue}
        //       //         label={props.name}
        //       //         onChange={handleSelectLiteralChange}
        //       //       >
        //       //         {props.unionInformation.discriminatorValues.map((v) => {
        //       //           return (
        //       //             <MenuItem key={v} value={v}>
        //       //               {v}
        //       //             </MenuItem>
        //       //           );
        //       //         })}
        //       //       </StyledSelect>{" "}
        //       //       literal discriminator
        //       //       {/* <div>
        //       //           discriminator: {JSON.stringify(props.unionInformation.discriminatorValues)}
        //       //         </div> */}
        //       //     </>
        //       //   ) : (
        //       //     <>
        //       //       <input
        //       //         id={props.listKey}
        //       //         form={"form." + props.name}
        //       //         name={props.name}
        //       //         {...props.formik.getFieldProps(props.rootLesslistKey)}
        //       //         onChange={props.handleChange}
        //       //       />{" "}
        //       //       {JSON.stringify(unfoldedRawSchema)} literal
        //       //     </>
        //       //   )}
        //       // </>
        //     {/* ) : (
        //       <>
        //         <input
        //           id={props.listKey}
        //           form={"form." + props.name}
        //           name={props.name}
        //           {...props.formik.getFieldProps(props.rootLesslistKey)}
        //         />{" "}
        //         {JSON.stringify(unfoldedRawSchema)}
        //       </>
        //     )} */}
        //   </>
        // );
  return (
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
  );
};
