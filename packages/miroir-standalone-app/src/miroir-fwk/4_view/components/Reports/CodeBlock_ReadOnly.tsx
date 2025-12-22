/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React from "react";
import ReactCodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { javascript } from '@codemirror/lang-javascript';
import { ThemedCodeBlock } from "../Themes/index.js";
import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";

const codeMirrorExtensions = [javascript()];

interface CodeBlockProps {
  value: string;
  copyButton?: boolean;
}

export const CodeBlock_ReadOnly: React.FC<CodeBlockProps> = ({ value, copyButton = false }) => {
  const { currentTheme } = useMiroirTheme();
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

  const containerStyles = css({
    position: 'relative',
    display: 'inline-block',
    width: `${fixedWidth}px`,
    maxWidth: "90vw",
  });

  const copyButtonStyles = css({
    position: 'absolute',
    top: currentTheme.spacing.sm,
    right: currentTheme.spacing.sm,
    padding: `${currentTheme.spacing.xs || '4px'} ${currentTheme.spacing.sm}`,
    backgroundColor: currentTheme.colors.primary,
    color: currentTheme.colors.surface,
    border: 'none',
    borderRadius: currentTheme.borderRadius.sm,
    cursor: 'pointer',
    fontSize: currentTheme.typography.fontSize.sm,
    fontFamily: currentTheme.typography.fontFamily,
    zIndex: 10,
    '&:hover': {
      backgroundColor: currentTheme.colors.primaryDark,
    },
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };
  
  return (
    <div css={containerStyles}>
      {copyButton && (
        <button css={copyButtonStyles} onClick={handleCopy}>
          Copy
        </button>
      )}
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
        // EditorView.theme({
        //   ".cm-editor": {
        //     width: `${fixedWidth}px`,
        //     height: heightPx,
        //   },
        //   ".cm-scroller": {
        //     width: "100%",
        //     overflow: calculatedHeight >= 400 ? "auto" : "hidden",
        //     height: heightPx,
        //   },
        //   ".cm-content": {
        //     minWidth: `${fixedWidth}px`,
        //   },
        // }),
      ]}
      basicSetup={{
        foldGutter: true,
        lineNumbers: true,
      }}
    />
    </div>
  );
};
