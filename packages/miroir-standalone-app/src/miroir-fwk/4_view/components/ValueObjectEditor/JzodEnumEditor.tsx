import {
  adminConfigurationDeploymentMiroir,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  JzodElement,
  JzodEnum,
  JzodLiteral,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  resolvePathOnObject
} from "miroir-core";
import React, { FC, useMemo, useCallback } from "react";
import { useFormikContext } from "formik";
import { useMiroirContextService } from "../../MiroirContextReactProvider";
import { useCurrentModel } from "../../ReduxHooks";
import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import { 
  ThemedSelect,
  ThemedLabeledEditor,
  ThemedDisplayValue
} from "../Themes/ThemedComponents";
import { JzodEnumEditorProps } from "./JzodElementEditorInterface";
import { handleDiscriminatorChange } from "./JzodDiscriminatorUtils";

// Common function to handle discriminator changes
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
  currentDeploymentUuid,
  readOnly,
}: JzodEnumEditorProps) => {
  // const currentValue = resolvePathOnObject(props.formik.values, props.rootLessListKeyArray);

  const formik = useFormikContext<Record<string, any>>();
  const context = useMiroirContextService();
  const currentModel = useCurrentModel(currentDeploymentUuid);
  const miroirMetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  const currentMiroirFundamentalJzodSchema = context.miroirFundamentalJzodSchema;

  const parentKey = rootLessListKey.includes(".")
    ? rootLessListKey.substring(0, rootLessListKey.lastIndexOf("."))
    : "";
  const parentKeyMap = typeCheckKeyMap ? typeCheckKeyMap[parentKey] : undefined;
  const currentKeyMap = typeCheckKeyMap ? typeCheckKeyMap[rootLessListKey] : undefined;
  const rawJzodSchema = currentKeyMap?.rawSchema;
  const currentEnumSchema: JzodElement | undefined = currentKeyMap?.resolvedSchema;
  // const possibleEnumValues = (currentKeyMap?.resolvedSchema).;
  // Log only when component renders to track performance
  // log.info(
  //   "JzodEnumEditor: render for",
  //     name,
  //     "rootLessListKey=",rootLessListKey,
  //     "rawJzodSchema=", rawJzodSchema,
  // );

  const isDiscriminator =
    parentKeyMap?.discriminator &&
    parentKeyMap?.discriminatorValues;

  const discriminatorIndex: number = !parentKeyMap?.discriminator
    ? -1
    : typeof parentKeyMap?.discriminator == "string"
    ? 0
    : parentKeyMap?.discriminator?.findIndex((d: string) => d === name);
  if (isDiscriminator && discriminatorIndex === -1) {
    throw new Error(
      `JzodLiteralEditor: isDiscriminator is true but could not find discriminator index for name "${name}" in parentKeyMap.discriminator ${parentKeyMap?.discriminator}`
    );
  }

  // Handler for discriminator select change (using common function)
  const handleSelectEnumChange = useCallback((event: any) => {
    handleDiscriminatorChange(
      event.target.value,
      "enum",
      parentKeyMap,
      rootLessListKey,
      rootLessListKeyArray,
      currentDeploymentUuid,
      currentMiroirFundamentalJzodSchema,
      currentModel,
      miroirMetaModel,
      formik,
      log
    );
  }, [parentKeyMap, rootLessListKey, rootLessListKeyArray, currentDeploymentUuid, currentMiroirFundamentalJzodSchema, currentModel, miroirMetaModel, formik]);

    const currentDiscriminatorValues =
      parentKeyMap?.discriminatorValues && discriminatorIndex !== -1
        ? parentKeyMap.discriminatorValues[discriminatorIndex]
        : [];

  // Memoize the menu items for better performance
  const menuItems = useMemo(() => {
    if (isDiscriminator && parentKeyMap?.discriminatorValues) {
      return currentDiscriminatorValues.sort().map((v, index) => (
        <option key={v} value={v} aria-label={rootLessListKey + "." + index}>
          {v}
        </option>
      ));
    } else {
      return (currentEnumSchema?.type == "enum"?currentEnumSchema.definition:[]).map((v, index) => (
        <option key={v} value={v} aria-label={rootLessListKey + "." + index}>
          {v}
        </option>
      ));
    }
  }, [isDiscriminator, parentKeyMap, rawJzodSchema, rootLessListKey]);

  const editor = useMemo(() => {
    if (readOnly) {
      const currentValue = formik.getFieldProps(rootLessListKey).value;
      return <ThemedDisplayValue value={currentValue} type="enum" />;
    }
    
    if (currentEnumSchema?.type === "enum") {
      return (
        <div>
          {isDiscriminator ? (
            <>
              <ThemedSelect
                id={rootLessListKey}
                aria-label={rootLessListKey}
                variant="standard"
                {...formik.getFieldProps(rootLessListKey)}
                name={rootLessListKey}
                onChange={handleSelectEnumChange}
              >
                {menuItems}
              </ThemedSelect>
              (enum discriminator)
            </>
          ) : (
            <ThemedSelect
              id={rootLessListKey}
              aria-label={rootLessListKey}
              variant="standard"
              {...formik.getFieldProps(rootLessListKey)}
              name={rootLessListKey}
            >
              {menuItems}
            </ThemedSelect>
          )}
          {forceTestingMode ? (
            <div>enumValues={JSON.stringify((rawJzodSchema as JzodEnum).definition)}</div>
          ) : (
            <></>
          )}
        </div>
      );
    } else {
      return (<div>error on enum {rootLessListKey}: schema is not an enum {JSON.stringify(currentEnumSchema, undefined, 2)}</div>)
    }
  }, [readOnly, currentEnumSchema, rootLessListKey, menuItems, formik, forceTestingMode, isDiscriminator, handleSelectEnumChange]);
  return (
    <ThemedLabeledEditor
      labelElement={labelElement ?? <></>}
      editor={editor}
    />
  );
};
