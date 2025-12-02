import React from 'react';
import { ThemedButton } from '../Themes/index';
import { useSnackbar } from '../../MiroirContextReactProvider';
import type { Action2VoidReturnType } from 'miroir-core';

interface ActionButtonProps {
  onAction: () => Promise<Action2VoidReturnType>;
  successMessage: string;
  label: string;
  handleAsyncAction?: (
    action: () => Promise<Action2VoidReturnType>,
    successMessage: string,
    actionName: string
  ) => void;
  actionName: string;
  [key: string]: any; // for passing extra props to ThemedButton
}

/**
 * ActionButton - wraps handleAsyncAction and ThemedButton for async actions with feedback
 */
export const ActionButton: React.FC<ActionButtonProps> = ({
  onAction,
  successMessage,
  label,
  handleAsyncAction,
  actionName,
  ...buttonProps
}) => {
  const {
    // snackbarOpen,
    // snackbarMessage,
    // snackbarSeverity,
    // showSnackbar,
    // handleSnackbarClose,
    handleAsyncAction: _handleAsyncAction,
  } = useSnackbar();
  
  const actualHandleAsyncAction = handleAsyncAction || _handleAsyncAction;
  return (
    <ThemedButton
      onClick={() => actualHandleAsyncAction?actualHandleAsyncAction(onAction, successMessage, actionName):undefined}
      {...buttonProps}
    >
      {label}
    </ThemedButton>
  );
};
