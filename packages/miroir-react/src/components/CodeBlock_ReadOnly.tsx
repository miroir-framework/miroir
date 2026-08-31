/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React from "react";
import ReactCodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { javascript } from '@codemirror/lang-javascript';
import { LoggerInterface, MiroirLoggerFactory } from 'miroir-core';
import { useMiroirTheme } from '../contexts/MiroirThemeContext';
import { cleanLevel, packageName } from '../constants';

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "CodeBlock_ReadOnly");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI").then((logger: LoggerInterface) => { log = logger; });

// Module-level identities: @uiw/react-codemirror reconfigures the EditorView whenever
// `extensions` or `basicSetup` change by reference, which rebuilds the fold gutter DOM
// and drops the click that sits between mousedown and mouseup.
const codeMirrorExtensions = [
  javascript(),
  EditorView.lineWrapping,
  EditorView.theme({
    ".cm-foldGutter": {
      width: "1.2em",
    },
    ".cm-foldGutter .cm-gutterElement": {
      textAlign: "center",
      cursor: "pointer",
    },
  }),
];

const codeMirrorBasicSetup = {
  foldGutter: true,
  lineNumbers: true,
};

interface CodeBlockProps {
  value: string;
  copyButton?: boolean;
}

export const CodeBlock_ReadOnly: React.FC<CodeBlockProps> = ({ value, copyButton = false }) => {
  const { currentTheme } = useMiroirTheme();
  const jsonString = value;
  const lines = jsonString?.split("\n");
  const maxLineLength = lines ? Math.max(...lines.map((line) => line.length)) : 0;
  const fixedWidth = Math.min(Math.max(maxLineLength * 0.6, 1200), 1800);

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
      log.error('Failed to copy to clipboard:', err);
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
        readOnly={true}
        maxHeight="400px"
        style={{
          width: `${fixedWidth}px`,
          maxWidth: "90vw",
        }}
        value={jsonString}
        extensions={codeMirrorExtensions}
        basicSetup={codeMirrorBasicSetup}
      />
    </div>
  );
};
