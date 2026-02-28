import React from "react";

// ################################################################################################
/**
 * Shared component to display field-level validation errors.
 * Used by JzodElementEditor (and transitively by all element-type editors).
 * Matches the form-level validation error style from TypedValueObjectEditor for visual consistency.
 */
export const FieldValidationError: React.FC<{ error: string | undefined }> = ({ error }) => {
  if (!error) return null;
  return (
    <div
      style={{
        padding: "4px 8px",
        marginTop: "4px",
        marginBottom: "4px",
        border: "1px solid #f44336",
        borderRadius: "4px",
        backgroundColor: "#ffebee",
        color: "#c62828",
        fontSize: "0.85em",
      }}
    >
      {error}
    </div>
  );
};
