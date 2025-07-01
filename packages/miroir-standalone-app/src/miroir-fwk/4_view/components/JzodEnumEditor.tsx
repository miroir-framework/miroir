import { MenuItem } from "@mui/material";
import { LoggerInterface, MiroirLoggerFactory, resolvePathOnObject } from "miroir-core";
import {
  JzodEnum
} from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import React, { useMemo } from "react";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";
import { JzodEnumEditorProps } from "./JzodElementEditorInterface";
import { LabeledEditor, StyledSelect } from "./Style";
import { useFormikContext } from "formik";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});


export const JzodEnumEditor = React.memo(
  function JzodEnumEditorComponent({
    name,
    labelElement,
    rawJzodSchema,
    listKey,
    rootLessListKey,
    rootLessListKeyArray,
    forceTestingMode,
    unionInformation,
  }: JzodEnumEditorProps) {
    // const currentValue = resolvePathOnObject(props.formik.values, props.rootLessListKeyArray);
    const formik = useFormikContext<Record<string, any>>();

    // Log only when component renders to track performance
    // log.info(
    //   `JzodEnumEditor: render for ${name}, rootLessListKey=${rootLessListKey}, rawJzodSchema=${JSON.stringify(
    //     rawJzodSchema
    //   )}`,
    //   `unionInformation=${JSON.stringify(unionInformation)}`
    // );

    // Memoize the discrimination case check
    const isDiscriminator = useMemo(
      () =>
        unionInformation?.discriminator &&
        unionInformation?.discriminatorValues &&
        name === unionInformation?.discriminator,
      [unionInformation, name]
    );

    // Memoize the menu items for better performance
    const menuItems = useMemo(() => {
      if (isDiscriminator) {
        return unionInformation?.discriminatorValues.map((v, index) => (
          <MenuItem key={v} value={v} aria-label={rootLessListKey + "." + index}>
            {v}
          </MenuItem>
        ));
      } else {
        return (rawJzodSchema as JzodEnum).definition.map((v, index) => (
          <MenuItem key={v} value={v} aria-label={rootLessListKey + "." + index}>
            {v}
          </MenuItem>
        ));
      }
    }, [isDiscriminator, unionInformation, rawJzodSchema, rootLessListKey]);

    return LabeledEditor({
      labelElement: labelElement ?? <></>,
      editor: isDiscriminator ? (
        <>
          <StyledSelect
            id={rootLessListKey}
            // aria-label={rootLessListKey}
            labelId="demo-simple-select-label"
            variant="standard"
            {...formik.getFieldProps(rootLessListKey)}
            name={rootLessListKey}
          >
            {menuItems}
          </StyledSelect>
          enum
        </>
      ) : (
        <>
          <StyledSelect
            id={rootLessListKey}
            // aria-label={rootLessListKey}
            labelId="demo-simple-select-label"
            variant="standard"
            {...formik.getFieldProps(rootLessListKey)}
            name={rootLessListKey}
          >
            {menuItems}
          </StyledSelect>
          {forceTestingMode ? (
            <div>enumValues={JSON.stringify((rawJzodSchema as JzodEnum).definition)}</div>
          ) : (
            <></>
          )}
        </>
      ),
    });
    return (
      <span>
        {labelElement}
        {isDiscriminator ? (
          <>
            <StyledSelect
              id={rootLessListKey}
              // aria-label={rootLessListKey}
              labelId="demo-simple-select-label"
              variant="standard"
              {...formik.getFieldProps(rootLessListKey)}
              name={rootLessListKey}
            >
              {menuItems}
            </StyledSelect>
            enum
          </>
        ) : (
          <>
            <StyledSelect
              id={rootLessListKey}
              // aria-label={rootLessListKey}
              labelId="demo-simple-select-label"
              variant="standard"
              {...formik.getFieldProps(rootLessListKey)}
              name={rootLessListKey}
            >
              {menuItems}
            </StyledSelect>
          </>
        )}
        {forceTestingMode ? (
          <div>enumValues={JSON.stringify((rawJzodSchema as JzodEnum).definition)}</div>
        ) : (
          <></>
        )}
      </span>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for React.memo
    return (
      prevProps.rootLessListKey === nextProps.rootLessListKey &&
      prevProps.name === nextProps.name &&
      JSON.stringify(prevProps.rawJzodSchema) === JSON.stringify(nextProps.rawJzodSchema) &&
      JSON.stringify(prevProps.unionInformation) === JSON.stringify(nextProps.unionInformation)
    );
  }
);
