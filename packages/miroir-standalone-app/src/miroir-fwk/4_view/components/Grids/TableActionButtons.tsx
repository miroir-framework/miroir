import { styled } from '@mui/material/styles';
import { LoggerInterface, MiroirLoggerFactory } from "miroir-core";
import React, { memo } from 'react';

import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { TableComponentRow } from './EntityInstanceGridInterface.js';
import {
  DeleteActionButton,
  DuplicateActionButton,
  EditActionButton
} from './TableActionButtonComponents.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TableActionButtons")
).then((logger: LoggerInterface) => {log = logger});

const ActionButtonsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
}));

export interface TableActionButtonsProps {
  row: TableComponentRow;
  onEdit?: (row: TableComponentRow) => void;
  onDuplicate?: (row: TableComponentRow) => void;
  onDelete?: (row: TableComponentRow) => void;
  size?: 'small' | 'medium';
  variant?: 'ag-grid' | 'glide';
}

export const TableActionButtons: React.FC<TableActionButtonsProps> = memo(({
  row,
  onEdit,
  onDuplicate,
  onDelete,
  size = 'small',
  variant = 'glide',
}) => {
  if (variant === 'ag-grid') {
    // For AG-Grid, use simple container
    return (
      <span style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
        {onEdit && (
          <EditActionButton
            row={row}
            onClick={onEdit}
            variant="ag-grid"
            size={size}
          />
        )}
        {onDuplicate && (
          <DuplicateActionButton
            row={row}
            onClick={onDuplicate}
            variant="ag-grid"
            size={size}
          />
        )}
        {onDelete && (
          <DeleteActionButton
            row={row}
            onClick={onDelete}
            variant="ag-grid"
            size={size}
          />
        )}
      </span>
    );
  }

  // For Glide and other cases, use styled MUI components
  return (
    <ActionButtonsContainer>
      {onEdit && (
        <EditActionButton
          row={row}
          onClick={onEdit}
          variant="glide"
          size={size}
        />
      )}
      {onDuplicate && (
        <DuplicateActionButton
          row={row}
          onClick={onDuplicate}
          variant="glide"
          size={size}
        />
      )}
      {onDelete && (
        <DeleteActionButton
          row={row}
          onClick={onDelete}
          variant="glide"
          size={size}
        />
      )}
    </ActionButtonsContainer>
  );
});

TableActionButtons.displayName = 'TableActionButtons';
