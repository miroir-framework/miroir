import { resolvePathOnObject } from "miroir-core";
import React from "react";

export interface JzodLiteralEditorProps {
  name: string;
  listKey: string;
  rootLesslistKey: string;
  rootLesslistKeyArray: string[];
  value: any;
  formState: any; // TODO: replace with Formik type
  // formik: any; // Replace with appropriate type for formik
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
}

export const JzodLiteralEditor: React.FC<JzodLiteralEditorProps> = (
  // props: JzodLiteralEditorProps
  {
  name,
  listKey,
  rootLesslistKey,
  rootLesslistKeyArray,
  // formik,
  formState,
  value,
  onChange,
  label,
  }
) => {
  // console.log(
  //   `JzodLiteralEditor render
  //   name: ${name}
  //   listKey: ${listKey}
  //   rootLesslistKey: ${rootLesslistKey}
  //   value: ${value}
  //   label: ${label}
  //   formState: ${JSON.stringify(formState, null, 2)}
  //   `
  // );
  const currentValue = resolvePathOnObject(formState, rootLesslistKeyArray);
  
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
      {label && <label htmlFor={listKey}>{label}: </label>}
      <input
        type="text"
        id={listKey}
        aria-label={label}
        // id={rootLesslistKey}
        form={"form." + name}
        name={name}
        value={currentValue}
        onChange={onChange}
        />
        {/* {...formik.getFieldProps(rootLesslistKey)} */}
    </>
  );
};
