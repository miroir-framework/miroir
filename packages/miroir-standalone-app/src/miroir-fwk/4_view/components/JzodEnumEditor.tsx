import { MenuItem } from "@mui/material";
import { LoggerInterface, MiroirLoggerFactory, resolvePathOnObject } from "miroir-core";
import {
  JzodEnum
} from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import React, { useMemo } from "react";
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


export const JzodEnumEditor = React.memo(
  function JzodEnumEditorComponent({
    name,
    labelElement: label,
    rawJzodSchema,
    listKey,
    rootLesslistKey,
    rootLesslistKeyArray,
    forceTestingMode,
    unionInformation,
  }: JzodEnumEditorProps) {
    // const currentValue = resolvePathOnObject(props.formik.values, props.rootLesslistKeyArray);
    const formik = useFormikContext<Record<string, any>>();

    // Log only when component renders to track performance
    // log.info(
    //   `JzodEnumEditor: render for ${name}, rootLesslistKey=${rootLesslistKey}, rawJzodSchema=${JSON.stringify(
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
          <MenuItem key={v} value={v} aria-label={rootLesslistKey + "." + index}>
            {v}
          </MenuItem>
        ));
      } else {
        return (rawJzodSchema as JzodEnum).definition.map((v, index) => (
          <MenuItem key={v} value={v} aria-label={rootLesslistKey + "." + index}>
            {v}
          </MenuItem>
        ));
      }
    }, [isDiscriminator, unionInformation, rawJzodSchema, rootLesslistKey]);

    return (
      <>
        {isDiscriminator ? (
          <>
            <StyledSelect
              id={rootLesslistKey}
              // aria-label={rootLesslistKey}
              labelId="demo-simple-select-label"
              variant="standard"
              {...formik.getFieldProps(rootLesslistKey)}
              name={rootLesslistKey}
            >
              {menuItems}
            </StyledSelect>
            enum
          </>
        ) : (
          <>
            <StyledSelect
              id={rootLesslistKey}
              // aria-label={rootLesslistKey}
              labelId="demo-simple-select-label"
              variant="standard"
              {...formik.getFieldProps(rootLesslistKey)}
              name={rootLesslistKey}
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
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for React.memo
    return (
      prevProps.rootLesslistKey === nextProps.rootLesslistKey &&
      prevProps.name === nextProps.name &&
      JSON.stringify(prevProps.rawJzodSchema) === JSON.stringify(nextProps.rawJzodSchema) &&
      JSON.stringify(prevProps.unionInformation) === JSON.stringify(nextProps.unionInformation)
    );
  }
);
