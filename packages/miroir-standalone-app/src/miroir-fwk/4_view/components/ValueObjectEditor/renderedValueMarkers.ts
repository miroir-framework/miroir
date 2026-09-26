/**
 * DOM attributes that let a reader of the rendered editors (the component-test value extractor,
 * #305) rebuild values that have no form field of their own.
 */

/** On an array / object / record editor root whose value is empty: `"array"` or `"object"`. */
export const EMPTY_CONTAINER_ATTRIBUTE = "data-ml-empty-container";
/** The formik name of the element carrying `EMPTY_CONTAINER_ATTRIBUTE`. */
export const ML_NAME_ATTRIBUTE = "data-ml-name";
/** On an input whose value is the JSON text of a non-string value. */
export const ML_JSON_ATTRIBUTE = "data-ml-json";

export type EmptyContainerKind = "array" | "object";

export function isPlainObjectValue(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The attributes marking an empty container editor, none when the container is not empty. */
export function emptyContainerMarker(
  kind: EmptyContainerKind,
  formikName: string,
  isEmpty: boolean,
): Record<string, string> {
  return isEmpty ? { [EMPTY_CONTAINER_ATTRIBUTE]: kind, [ML_NAME_ATTRIBUTE]: formikName } : {};
}

/**
 * The props of a hidden input carrying `value` under `formikName`, for an editor that renders no
 * form field (the file `any` editor): a string as is, any other value as JSON flagged with
 * `ML_JSON_ATTRIBUTE`.
 */
export function hiddenValueInputProps(formikName: string, value: unknown): Record<string, string> {
  if (value === undefined || typeof value === "string") {
    return { name: formikName, value: value ?? "" };
  }
  return { name: formikName, value: JSON.stringify(value), [ML_JSON_ATTRIBUTE]: "true" };
}
