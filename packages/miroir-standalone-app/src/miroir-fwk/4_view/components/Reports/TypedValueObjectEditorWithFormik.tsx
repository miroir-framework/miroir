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
import { ThemedOnScreenHelper } from '../Themes/index.js';
import { TypedValueObjectEditor } from './TypedValueObjectEditor.js';
import type { TypedValueObjectEditorProps } from './TypedValueObjectEditor.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TypedValueObjectEditorWithFormik"), "UI",
).then((logger: LoggerInterface) => {log = logger});

export interface TypedValueObjectEditorWithFormikProps extends TypedValueObjectEditorProps {
  initialValueObject: any,
  onSubmit: (data: any) => Promise<void>;
}

/**
 * Wrapper component that creates Formik instance and provides it via context
 * to TypedValueObjectEditor and its descendants.
 * 
 * This separates the Formik creation logic from the editor rendering logic,
 * allowing for better component composition and avoiding prop drilling.
 */
export const TypedValueObjectEditorWithFormik: React.FC<TypedValueObjectEditorWithFormikProps> = (props) => {
  const {
    initialValueObject,
    formValueMLSchema: valueObjectMMLSchema,
    onSubmit,
    readonly,
    zoomInPath,
    ...editorProps
  } = props;

  // Handle zoom functionality for initial values
  const hasZoomPath = zoomInPath && zoomInPath.trim() !== '';
  // const displayValueObject = hasZoomPath ? getValueAtPath(initialValueObject, zoomInPath) : initialValueObject;

  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialValueObject}
      onSubmit={async (values, { setSubmitting, setErrors }) => {
        if (readonly) {
          setSubmitting(false);
          return;
        }
        try {
          log.info("onSubmit formik values", values);
          
          // Handle zoom case: merge changes back into the full object for submission
          // const finalValues = hasZoomPath 
          //   ? setValueAtPath(initialValueObject, zoomInPath!, values)
          //   : values;
            
          await onSubmit(values);
        } catch (e) {
          log.error(e);
        } finally {
          setSubmitting(false);
        }
      }}
      validateOnChange={false}
      validateOnBlur={false}
    >
      {/* {(formik: FormikProps<Record<string, any>>) => ( */}
      <div>
        {/* <ThemedOnScreenHelper label="formikValuePathAsString" data={editorProps.formikValuePathAsString} />
        <ThemedOnScreenHelper label="initialValueObject" data={initialValueObject} />
        <ThemedOnScreenHelper label="valueObjectMMLSchema" data={valueObjectMMLSchema} /> */}
        <TypedValueObjectEditor
          {...editorProps}
          formValueMLSchema={valueObjectMMLSchema}
          readonly={readonly}
          zoomInPath={zoomInPath}
        />
      </div>
      {/* )} */}
    </Formik>
  );
};

// Re-export the props type for convenience
export type { TypedValueObjectEditorProps } from './TypedValueObjectEditor.js';
