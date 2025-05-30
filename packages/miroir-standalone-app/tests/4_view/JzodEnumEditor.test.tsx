import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import '@testing-library/jest-dom';
import { JzodEnumEditor, JzodEnumEditorProps } from "../../src/miroir-fwk/4_view/components/JzodEnumEditor";

describe("JzodEnumEditor", () => {
  const enumValues = ["value1", "value2", "value3"];
  const defaultProps: JzodEnumEditorProps = {
    name: "testName",
    listKey: "ROOT.testName",
    rootLesslistKey: "testName",
    rootLesslistKeyArray: ["testName"],
    enumValues,
    currentValue: "value2",
    onChange: vi.fn(),
    label: "Test Label",
    rawJzodSchema: {
      type: "enum",
      definition: ["value1", "value2", "value3"],
    },
    forceTestingMode: false,
    unionInformation: undefined,
  };

  it("renders label if provided", () => {
    render(<JzodEnumEditor {...defaultProps} />);
    expect(screen.getByLabelText(/Test Label/)).toBeInTheDocument();
  });

  it("does not render label if not provided", () => {
    render(<JzodEnumEditor {...defaultProps} label={undefined} />);
    expect(screen.queryByLabelText(/Test Label/)).not.toBeInTheDocument();
  });

  it("renders select with correct value", () => {
    render(<JzodEnumEditor {...defaultProps} />);
    const combobox = screen.getByRole("combobox");
    expect(combobox).toContainHTML("value2");
  });

  it("renders all enum options", () => {
    render(<JzodEnumEditor {...defaultProps} />);
    const combobox = screen.getByRole("combobox");
    fireEvent.mouseDown(combobox);
    enumValues.forEach((val) => {
      expect(screen.getByRole("option", { name: val })).toBeInTheDocument();
    });
  });

  it("calls onChange when selection changes", () => {
    const onChange = vi.fn();
    render(<JzodEnumEditor {...defaultProps} onChange={onChange} />);
    const combobox = screen.getByRole("combobox");
    fireEvent.mouseDown(combobox);
    fireEvent.click(screen.getByRole("option", { name: "value3" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    // expect(combobox).toHaveValue("value3"); // the value is not changed because the onChange function is mocked
  });

  it("sets select id and name correctly", () => {
    render(<JzodEnumEditor {...defaultProps} />);
    // 
    expect(screen.getByRole("combobox")).toHaveAttribute("id", defaultProps.listKey);
    // 
    const select = screen.getByRole(defaultProps.listKey);
    const input = select.querySelector('input');
    expect(input).toHaveAttribute("name", defaultProps.name);
  });
});