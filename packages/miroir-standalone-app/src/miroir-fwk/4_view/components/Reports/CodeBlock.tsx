import React from "react";
import ReactCodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { javascript } from '@codemirror/lang-javascript';
import { ThemedCodeBlock } from "../Themes/ThemedComponents.js";

const codeMirrorExtensions = [javascript()];

interface CodeBlockProps {
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ value }) => {
  const jsonString = value;
  const lines = jsonString?.split("\n");
  const lineCount = lines?.length || 1;
  const maxLineLength = lines ? Math.max(...lines.map((line) => line.length)) : 0;
  const fixedWidth = Math.min(Math.max(maxLineLength * 0.6, 1200), 1800);
  
  // Calculate height based on content: lineHeight * number of lines + padding
  // Typical CodeMirror line height is around 18-20px
  const lineHeight = 20;
  const padding = 20;
  const calculatedHeight = Math.min((lineCount * lineHeight) + padding, 400);
  const heightPx = `${calculatedHeight}px`;
  
  return (
    <ThemedCodeBlock>
      <ReactCodeMirror
        editable={false}
        height={heightPx}
        style={{
          width: `${fixedWidth}px`,
          maxWidth: "90vw",
          height: heightPx,
        }}
        value={jsonString}
        extensions={[
          ...codeMirrorExtensions,
          EditorView.lineWrapping,
          EditorView.theme({
            ".cm-editor": {
              width: `${fixedWidth}px`,
              height: heightPx,
            },
            ".cm-scroller": {
              width: "100%",
              overflow: calculatedHeight >= 400 ? "auto" : "hidden",
              height: heightPx,
            },
            ".cm-content": {
              minWidth: `${fixedWidth}px`,
            },
          }),
        ]}
        basicSetup={{
          foldGutter: true,
          lineNumbers: true,
        }}
      />
    </ThemedCodeBlock>
  );
};
