import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

// ################################################################################################
/**
 * Context for collecting field-level validation errors from individual editors.
 *
 * TypedValueObjectEditor provides this context and reads the collected errors
 * to disable the submit button and show a combined error banner.
 *
 * Each field editor (via useFieldValidation) registers its validation error
 * into this context so that form-level logic can take field-level errors
 * into account without prop drilling.
 */
export interface FieldValidationContextValue {
  /** Current map of field-level validation errors (key = rootLessListKey, value = error message) */
  fieldErrors: Record<string, string>;
  /** Register or clear a field-level validation error. Pass undefined to clear. */
  setFieldError: (key: string, error: string | undefined) => void;
}

const defaultFieldValidationContextValue: FieldValidationContextValue = {
  fieldErrors: {},
  setFieldError: () => {},
};

export const FieldValidationContext = createContext<FieldValidationContextValue>(
  defaultFieldValidationContextValue
);

// ################################################################################################
/**
 * Hook to consume field validation context (for reading errors at form level).
 */
export function useFieldValidationContext(): FieldValidationContextValue {
  return useContext(FieldValidationContext);
}

// ################################################################################################
/**
 * Provider component for TypedValueObjectEditor.
 * Maintains a mutable ref for field errors and re-renders only when the error set changes.
 */
export const FieldValidationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use a ref for the mutable error map to avoid cascading re-renders on every field change.
  // A separate state counter triggers re-renders only when the set of errors actually changes.
  const errorsRef = useRef<Record<string, string>>({});
  const [, setVersion] = useState(0);

  const setFieldError = useCallback((key: string, error: string | undefined) => {
    const prev = errorsRef.current;
    if (error) {
      if (prev[key] === error) return; // no change
      errorsRef.current = { ...prev, [key]: error };
    } else {
      if (!(key in prev)) return; // no change
      const { [key]: _, ...rest } = prev;
      errorsRef.current = rest;
    }
    setVersion((v) => v + 1); // trigger re-render of consumers
  }, []);

  const contextValue = useMemo<FieldValidationContextValue>(
    () => ({
      fieldErrors: errorsRef.current,
      setFieldError,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- errorsRef.current changes tracked by version counter
    [setFieldError, errorsRef.current],
  );

  return (
    <FieldValidationContext.Provider value={contextValue}>
      {children}
    </FieldValidationContext.Provider>
  );
};
