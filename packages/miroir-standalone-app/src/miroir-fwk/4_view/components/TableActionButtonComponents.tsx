import React from 'react';
import { IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import CreateIcon from '@mui/icons-material/Create';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { LoggerInterface, MiroirLoggerFactory } from "miroir-core";

import { packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';
import { TableComponentRow } from './MTableComponentInterface.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TableActionButtonComponents")
).then((logger: LoggerInterface) => {log = logger});

const ActionButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.5),
  fontSize: '16px',
  '& .MuiIcon-root': {
    fontSize: '16px',
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

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
  const handleClick = (event?: any) => {
    event?.stopPropagation?.();
    log.info("EditActionButton clicked", { row });
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
        <CreateIcon style={{ fontSize: '16px' }} />
      </button>
    );
  }

  return (
    <ActionButton
      onClick={handleClick}
      size={size}
      title="Edit"
    >
      <CreateIcon />
    </ActionButton>
  );
};

// Duplicate Button Component
export const DuplicateActionButton: React.FC<BaseActionButtonProps> = ({
  row,
  variant = 'glide',
  size = 'small',
  onClick,
}) => {
  const handleClick = (event?: any) => {
    event?.stopPropagation?.();
    log.info("DuplicateActionButton clicked", { row });
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
        <ContentCopyIcon style={{ fontSize: '16px' }} />
      </button>
    );
  }

  return (
    <ActionButton
      onClick={handleClick}
      size={size}
      title="Duplicate"
    >
      <ContentCopyIcon />
    </ActionButton>
  );
};

// Delete Button Component
export const DeleteActionButton: React.FC<BaseActionButtonProps> = ({
  row,
  variant = 'glide',
  size = 'small',
  onClick,
}) => {
  const handleClick = (event?: any) => {
    event?.stopPropagation?.();
    log.info("DeleteActionButton clicked", { row });
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
        <DeleteIcon style={{ fontSize: '16px' }} />
      </button>
    );
  }

  return (
    <ActionButton
      onClick={handleClick}
      size={size}
      title="Delete"
    >
      <DeleteIcon />
    </ActionButton>
  );
};
