import React from "react";

export interface JzodLiteralEditorProps {
  name: string;
  listKey: string;
  rootLesslistKey: string;
  value: any;
  formik: any; // Replace with appropriate type for formik
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
}

export const JzodLiteralEditor: React.FC<JzodLiteralEditorProps> = ({
  name,
  listKey,
  rootLesslistKey,
  formik,
  value,
  onChange,
  label,
}) => {
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
        {...formik.getFieldProps(rootLesslistKey)}
        onChange={onChange}
      />
    </>
  );
};
