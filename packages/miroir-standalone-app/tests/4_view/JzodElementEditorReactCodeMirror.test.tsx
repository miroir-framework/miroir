import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {JzodElementEditorReactCodeMirror} from "../../src/miroir-fwk/4_view/components/JzodElementEditorReactCodeMirror";

describe("JzodElementEditorReactCodeMirror", () => {
  it("renders the CodeMirror editor", () => {
    render(
      <JzodElementEditorReactCodeMirror
        // initialValue="Initial content"
        // onChange={() => {}}
      />
    );

    // Check if the CodeMirror editor is rendered
    const editor = screen.getByRole("textbox");
    expect(editor).toBeInTheDocument();
    // expect(editor).toHaveValue("Initial content");
  });

  // it("updates the value when user types", () => {
  //   const mockOnChange = vi.fn();

  //   render(
  //     <JzodElementEditorReactCodeMirror
  //       // initialValue="Initial content"
  //       // onChange={mockOnChange}
  //     />
  //   );

  //   const editor = screen.getByRole("textbox");

  //   // Simulate user typing
  //   fireEvent.change(editor, { target: { value: "Updated content" } });

  //   // Check if the onChange handler was called
  //   // expect(mockOnChange).toHaveBeenCalledTimes(1);
  //   // expect(mockOnChange).toHaveBeenCalledWith("Updated content");
  // });

  // it("handles empty initial value", () => {
  //   render(
  //     <JzodElementEditorReactCodeMirror
  //       // initialValue=""
  //       // onChange={() => {}}
  //     />
  //   );

  //   const editor = screen.getByRole("textbox");
  //   expect(editor).toBeInTheDocument();
  //   expect(editor).toHaveValue("");
  // });
});