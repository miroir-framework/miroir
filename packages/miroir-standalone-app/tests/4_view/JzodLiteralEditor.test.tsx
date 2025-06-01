import React, { ChangeEvent, useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import '@testing-library/jest-dom';
import { JzodLiteralEditor, JzodLiteralEditorProps } from "../../src/miroir-fwk/4_view/components/JzodLiteralEditor";
import { Formik } from "formik";

const pageLabel = "JzodLiteralEditor.test";

const initialFormState = "";

interface LocalLiteralEditorProps {
  name: string;
  listKey: string;
  rootLesslistKey: string;
  value: any;
  // formik: any; // Replace with appropriate type for formik
  // onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
}

describe("JzodLiteralEditor", () => {
  const LocalLiteralEditor: React.FC<LocalLiteralEditorProps> = ({
    name,
    listKey,
    rootLesslistKey,
    value,
    // formik,
    // onChange,
    label,
  }) => {
    // const [value, setValue] = React.useState("test-value");
    // const [formState,setFormState] = useState<any>(initialFormState);
    const [formState,setFormState] = useState<any>(value);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // setValue(e.target.value);
      console.info("handleChange formik values ###########################################", e.target.value);
      setFormState(e.target.value);
    };
    
    const onSubmit = (values: any) => {
      console.info("onSubmit formik values ###########################################", values);
      setFormState(values);
    };

    return (
      <Formik
        enableReinitialize={true}
        initialValues={formState}
        onSubmit={onSubmit}
        handleChange={
          (e: ChangeEvent<any>) => {
          console.info("onChange formik values ###########################################", e.target.value);
          setFormState(e.target.value);
        }
      }
      >
        {(formik) => (
          <>
            <form id={"form." + pageLabel} onSubmit={formik.handleSubmit}>
              <JzodLiteralEditor
                name={name}
                listKey={listKey}
                rootLesslistKey={rootLesslistKey}
                value={formState}
                // formik={{ getFieldProps: () => ({ name: "fieldName", value, onChange: handleChange }) }}
                formik={{ getFieldProps: () => ({ name: "fieldName", value: formState, onChange: handleChange }) }}
                onChange={handleChange}
                label={label}
              />
            </form>
          </>
        )}
      </Formik>
    );
  }

  // ##############################################################################################
  it("renders input with label when label prop is provided", () => {
    render(
      <LocalLiteralEditor
        name="fieldName"
        listKey="listKey"
        rootLesslistKey="rootLesslistKey"
        value="test-value"
        // formik={mockFormik}
        // onChange={vi.fn()}
        label="Test Label"
      />
    );
    expect(screen.getByLabelText(/Test Label/)).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("name", "fieldName");
  });

  // ##############################################################################################
  it("renders input without label when label prop is not provided", () => {
    render(
      <LocalLiteralEditor
        name="fieldName"
        listKey="listKey"
        rootLesslistKey="rootLesslistKey"
        value="test-value"
        // formik={mockFormik}
        // onChange={vi.fn()}
      />
    );
    expect(screen.queryByLabelText(/Test Label/)).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  // ##############################################################################################
  it("calls onChange when input value changes", () => {
    const handleChange = vi.fn();
    render(
      <LocalLiteralEditor
        name="fieldName"
        listKey="listKey"
        rootLesslistKey="rootLesslistKey"
        value="test-value"
        // formik={mockFormik}
        // onChange={handleChange}
        label="Test Label"
      />
    );
    expect(screen.getByDisplayValue("test-value")).toBeInTheDocument();
    const input = screen.getByDisplayValue("test-value");
    fireEvent.change(input, { target: { value: "new value" } });
    expect(screen.getByDisplayValue(/new value/)).toBeInTheDocument();
  });

  it("passes correct props to input", () => {
    render(
      <LocalLiteralEditor
        name="fieldName"
        listKey="listKey"
        rootLesslistKey="rootLesslistKey"
        value="test-value"
        // formik={mockFormik}
        // onChange={vi.fn()}
        label="Test Label"
      />
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("id", "listKey");
    expect(input).toHaveAttribute("form", "form.fieldName");
    expect(input).toHaveAttribute("name", "fieldName");
    expect(input).toHaveAttribute("type", "text");
  });
});