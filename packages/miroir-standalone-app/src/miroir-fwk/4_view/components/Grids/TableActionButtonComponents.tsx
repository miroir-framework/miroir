import { ContentCopyIcon, CreateIcon, DeleteIcon } from '../Themes/MaterialSymbolWrappers';
import { LoggerInterface, MiroirLoggerFactory } from "miroir-core";
import React from 'react';

import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { useMiroirTheme } from '../../contexts/MiroirThemeContext.js';
import { ThemedSmallIconButton } from '../Themes/index.js';
import { TableComponentRow } from './EntityInstanceGridInterface.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TableActionButtonComponents"), "UI",
).then((logger: LoggerInterface) => {log = logger});

export interface BaseActionButtonProps {
  row: TableComponentRow;
  variant?: 'ag-grid' | 'glide';
  size?: 'small' | 'medium';
  onClick?: (row: TableComponentRow, event?: any) => void;
}

// Edit Button Component
export const EditActionButton: React.FC<BaseActionButtonProps> = ({
  row,
  variant = 'glide',
  size = 'small',
  onClick,
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const handleClick = (event?: any) => {
    event?.stopPropagation?.();
    // log.info("EditActionButton clicked", { row });
    if (onClick) {
      onClick(row, event);
    }
  };

  if (variant === 'ag-grid') {
    return (
      <button
        onClick={handleClick}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
        }}
        title="Edit"
      >
        <CreateIcon style={{ fontSize: '16px', color: currentTheme.colors.text }} />
      </button>
    );
  }

  return (
    <ThemedSmallIconButton
      onClick={handleClick}
      title="Edit"
    >
      <CreateIcon />
    </ThemedSmallIconButton>
  );
};

// Duplicate Button Component
export const DuplicateActionButton: React.FC<BaseActionButtonProps> = ({
  row,
  variant = 'glide',
  size = 'small',
  onClick,
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const handleClick = (event?: any) => {
    event?.stopPropagation?.();
    // log.info("DuplicateActionButton clicked", { row });
    if (onClick) {
      onClick(row, event);
    }
  };

  if (variant === 'ag-grid') {
    return (
      <button
        onClick={handleClick}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
        }}
        title="Duplicate"
      >
        <ContentCopyIcon style={{ fontSize: '16px', color: currentTheme.colors.text }} />
      </button>
    );
  }

  return (
    <ThemedSmallIconButton
      onClick={handleClick}
      title="Duplicate"
    >
      <ContentCopyIcon />
    </ThemedSmallIconButton>
  );
};

// Delete Button Component
export const DeleteActionButton: React.FC<BaseActionButtonProps> = ({
  row,
  variant = 'glide',
  size = 'small',
  onClick,
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const handleClick = (event?: any) => {
    event?.stopPropagation?.();
    // log.info("DeleteActionButton clicked", { row });
    if (onClick) {
      onClick(row, event);
    }
  };

  if (variant === 'ag-grid') {
    return (
      <button
        onClick={handleClick}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
        }}
        title="Delete"
      >
        <DeleteIcon style={{ fontSize: '16px', color: currentTheme.colors.text }} />
      </button>
    );
  }

  return (
    <ThemedSmallIconButton
      onClick={handleClick}
      title="Delete"
    >
      <DeleteIcon />
    </ThemedSmallIconButton>
  );
};
