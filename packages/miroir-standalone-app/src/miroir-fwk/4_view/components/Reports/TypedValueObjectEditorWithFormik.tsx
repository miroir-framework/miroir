import { Formik, FormikProps } from 'formik';
import {
  LoggerInterface,
  MiroirLoggerFactory,
  setValueAtPath,
  getValueAtPath,
  getSchemaAtPath,
} from "miroir-core";

import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { FormikValueObjectContext } from './FormikValueObjectContext.js';
import { TypedValueObjectEditor } from './TypedValueObjectEditor.js';
import type { TypedValueObjectEditorProps } from './TypedValueObjectEditor.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TypedValueObjectEditorWithFormik"), "UI",
).then((logger: LoggerInterface) => {log = logger});

/**
 * Wrapper component that creates Formik instance and provides it via context
 * to TypedValueObjectEditor and its descendants.
 * 
 * This separates the Formik creation logic from the editor rendering logic,
 * allowing for better component composition and avoiding prop drilling.
 */
export const TypedValueObjectEditorWithFormik: React.FC<TypedValueObjectEditorProps> = (props) => {
  const {
    valueObject,
    valueObjectMMLSchema,
    onSubmit,
    readonly,
    zoomInPath,
    ...editorProps
  } = props;

  // Handle zoom functionality for initial values
  const hasZoomPath = zoomInPath && zoomInPath.trim() !== '';
  const displayValueObject = hasZoomPath ? getValueAtPath(valueObject, zoomInPath) : valueObject;

  return (
    <Formik
      enableReinitialize={true}
      initialValues={displayValueObject}
      onSubmit={async (values, { setSubmitting, setErrors }) => {
        if (readonly) {
          setSubmitting(false);
          return;
        }
        try {
          log.info("onSubmit formik values", values);
          
          // Handle zoom case: merge changes back into the full object for submission
          const finalValues = hasZoomPath 
            ? setValueAtPath(valueObject, zoomInPath!, values)
            : values;
            
          await onSubmit(finalValues);
        } catch (e) {
          log.error(e);
        } finally {
          setSubmitting(false);
        }
      }}
      validateOnChange={false}
      validateOnBlur={false}
    >
      {(formik: FormikProps<Record<string, any>>) => (
        <FormikValueObjectContext.Provider value={formik}>
          <TypedValueObjectEditor
            {...editorProps}
            valueObject={valueObject}
            valueObjectMMLSchema={valueObjectMMLSchema}
            onSubmit={onSubmit}
            readonly={readonly}
            zoomInPath={zoomInPath}
          />
        </FormikValueObjectContext.Provider>
      )}
    </Formik>
  );
};

// Re-export the props type for convenience
export type { TypedValueObjectEditorProps } from './TypedValueObjectEditor.js';
