import { MenuItem } from "@mui/material";
import { LoggerInterface, MiroirLoggerFactory, resolvePathOnObject } from "miroir-core";
import {
  JzodEnum
} from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import React, { FC, useMemo } from "react";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";
import { JzodEnumEditorProps } from "./JzodElementEditorInterface";
import { ThemedLabeledEditor, ThemedSelect } from "./ThemedComponents";
import { useFormikContext } from "formik";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});


export const JzodEnumEditor: FC<JzodEnumEditorProps> = ({
    name,
    labelElement,
    // rawJzodSchema,
    listKey,
    rootLessListKey,
    rootLessListKeyArray,
    forceTestingMode,
    typeCheckKeyMap,
  }: JzodEnumEditorProps) => {
    // const currentValue = resolvePathOnObject(props.formik.values, props.rootLessListKeyArray);
    const formik = useFormikContext<Record<string, any>>();

    const parentKey = rootLessListKey.includes(".")
      ? rootLessListKey.substring(0, rootLessListKey.lastIndexOf("."))
      : "";
    const parentKeyMap = typeCheckKeyMap ? typeCheckKeyMap[parentKey] : undefined;
    const currentKeyMap = typeCheckKeyMap ? typeCheckKeyMap[rootLessListKey] : undefined;
    const rawJzodSchema = currentKeyMap?.rawSchema;
    // Log only when component renders to track performance
    // log.info(
    //   `JzodEnumEditor: render for ${name}, rootLessListKey=${rootLessListKey}, rawJzodSchema=${JSON.stringify(
    //     rawJzodSchema
    //   )}`,
    // );

    const isDiscriminator =
      parentKeyMap?.discriminator &&
      parentKeyMap?.discriminatorValues &&
      name === parentKeyMap?.discriminator;

    // Memoize the menu items for better performance
    const menuItems = useMemo(() => {
      if (isDiscriminator) {
        return (parentKeyMap?.discriminatorValues??[]).map((v, index) => (
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
    }, [isDiscriminator, parentKeyMap, rawJzodSchema, rootLessListKey]);

    return (
      <ThemedLabeledEditor
        labelElement={labelElement ?? <></>}
        editor={
          isDiscriminator ? (
            <>
              <ThemedSelect
                id={rootLessListKey}
                // aria-label={rootLessListKey}
                labelId="demo-simple-select-label"
                variant="standard"
                {...formik.getFieldProps(rootLessListKey)}
                name={rootLessListKey}
              >
                {menuItems}
              </ThemedSelect>
            </>
          ) : (
            <>
              <ThemedSelect
                id={rootLessListKey}
                // aria-label={rootLessListKey}
                labelId="demo-simple-select-label"
                variant="standard"
                {...formik.getFieldProps(rootLessListKey)}
                name={rootLessListKey}
              >
                {menuItems}
              </ThemedSelect>
              {forceTestingMode ? (
                <div>enumValues={JSON.stringify((rawJzodSchema as JzodEnum).definition)}</div>
              ) : (
                <></>
              )}
            </>
          )
        }
      />
    );
  }
