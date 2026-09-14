import { ContentCopyIcon, CreateIcon, DeleteIcon, OpenInNew } from '../Themes/MaterialSymbolWrappers';
import { LoggerInterface, MiroirLoggerFactory } from "miroir-core";
import React from 'react';

import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { useMiroirTheme } from '../../contexts/MiroirThemeContext.js';
import { ThemedSmallIconButton } from '../Themes/index.js';
import { TableComponentRow } from './EntityInstanceGridInterface.js';

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TableActionButtonComponents");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI",
).then((logger: LoggerInterface) => {log = logger});

export interface BaseActionButtonProps {
  row: TableComponentRow;
  variant?: 'ag-grid' | 'glide';
  size?: 'small' | 'medium';
  onClick?: (row: TableComponentRow, event?: any) => void;
}

export const OpenActionButton: React.FC<BaseActionButtonProps & { instanceUuid?: string }> = ({
  row,
  variant = 'glide',
  size = 'small',
  onClick,
  instanceUuid,
}) => {
  const { currentTheme } = useMiroirTheme();
  const resolvedInstanceUuid = instanceUuid ?? (row.rawValue as any)?.uuid;

  const handleClick = (event?: any) => {
    event?.stopPropagation?.();
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
        title="Open"
        data-testid="row-open-report"
        data-instance-uuid={resolvedInstanceUuid}
      >
        <OpenInNew style={{ fontSize: '16px', color: currentTheme.colors.text }} />
      </button>
    );
  }

  return (
    <ThemedSmallIconButton
      onClick={handleClick}
      title="Open"
      data-testid="row-open-report"
      data-instance-uuid={resolvedInstanceUuid}
    >
      <OpenInNew />
    </ThemedSmallIconButton>
  );
};

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
