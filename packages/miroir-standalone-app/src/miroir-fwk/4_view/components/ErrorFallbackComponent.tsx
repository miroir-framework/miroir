import React from "react";
import { resolvePathOnObject, LoggerInterface, MiroirLoggerFactory, unfoldJzodSchemaOnce } from "miroir-core";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ErrorFallbackComponent")
).then((logger: LoggerInterface) => {
  log = logger;
});

export interface ErrorFallbackComponentProps {
  error: Error;
  resetErrorBoundary?: () => void;
  context: {
    origin?: string; // used to identify the origin of the error, e.g., "JzodElementEditor"
    objectType: string;
    rootLessListKey: string;
    rootLessListKeyArray?: (string | number)[]; // Added this field to match the new path structure
    attributeRootLessListKeyArray?: (string | number)[];
    attributeName?: string;
    attributeListKey?: string;
    currentValue?: any;
    formikValues?: any;
    rawJzodSchema?: any;
    unfoldedJzodSchema?: any;
    localResolvedElementJzodSchemaBasedOnValue?: any;
  };
}

export const ErrorFallbackComponent: React.FC<ErrorFallbackComponentProps> = ({
  error,
  resetErrorBoundary,
  context
}) => {
  const {
    origin,
    objectType,
    rootLessListKey,
    rootLessListKeyArray,
    attributeRootLessListKeyArray,
    attributeName,
    attributeListKey,
    currentValue,
    formikValues,
    // rawJzodSchema,
    unfoldedJzodSchema,
    localResolvedElementJzodSchemaBasedOnValue
  } = context;

  log.error(
    `${objectType} errorboundary for`,
    attributeListKey || rootLessListKey,
    "currentValue",
    currentValue,
    "error",
    error
  );

  return (
    <div role="alert">
      <div style={{ color: "red" }}>
        <p>Something went wrong in {origin??"unspecified"}</p>
        <div key="1">{objectType} {rootLessListKey}</div>
        {rootLessListKeyArray && Array.isArray(rootLessListKeyArray) && (
          <div key="1a">path {rootLessListKeyArray.join(".")}</div>
        )}
        {attributeRootLessListKeyArray && Array.isArray(attributeRootLessListKeyArray) && (
          <div key="2">attribute {attributeRootLessListKeyArray.join(".")}</div>
        )}
        {/* {attributeRootLessListKeyArray && formikValues && (
          <div>
            calc attribute value{" "}
            {JSON.stringify(
              resolvePathOnObject(formikValues, attributeRootLessListKeyArray),
              null,
              2
            )}
          </div>
        )} */}
        {attributeName && (
          <div key="3">attribute name {attributeName}</div>
        )}
        {/* {attributeName && currentValue && (
          <div>
            attribute value{" "}
            <pre>{JSON.stringify(currentValue[attributeName], null, 2)}</pre>
          </div>
        )}
        {currentValue && (
          <div>
            object value <pre>{JSON.stringify(currentValue, null, 2)}</pre>
          </div>
        )}
        {rawJzodSchema && (
          <div key="5">
            {rootLessListKey} rawJzodSchema: <pre>{JSON.stringify(rawJzodSchema, null, 2)}</pre>
          </div>
        )}
        {rawJzodSchema && (
          <div key="6">
            {rootLessListKey} unfoldedJzodSchema: <pre>{JSON.stringify(unfoldedJzodSchema, null, 2)}</pre>
          </div>
        )}
        <div key="7"></div>
        {localResolvedElementJzodSchemaBasedOnValue && (
          <>
            {rootLessListKey} resolved type:{" "}
            <pre>
              {JSON.stringify(localResolvedElementJzodSchemaBasedOnValue, null, 2)}
            </pre>
          </>
        )} */}
        <div>error {error.message}</div>
      </div>
    </div>
  );
};