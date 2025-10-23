import { FormikContextType } from 'formik';
import { createContext, useContext } from 'react';

/**
 * Context to provide Formik instance for value object editing without prop drilling.
 * This allows TypedValueObjectEditor and its children to access formik methods and values.
 */
export const FormikValueObjectContext = createContext<FormikContextType<Record<string, any>> | null>(null);

/**
 * Hook to access Formik context within TypedValueObjectEditor and its descendants.
 * @throws Error if used outside of FormikValueObjectContext.Provider
 */
export const useFormikValueObject = () => {
  const context = useContext(FormikValueObjectContext);
  if (!context) {
    throw new Error('useFormikValueObject must be used within a FormikValueObjectContext.Provider');
  }
  return context;
};
