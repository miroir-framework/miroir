import React from 'react';
import { ThemedButton } from '../Themes/index';
import { useSnackbar } from '../../MiroirContextReactProvider';

interface ActionButtonProps {
  onAction: () => Promise<void>;
  successMessage: string;
  label: string;
  handleAsyncAction?: (
    action: () => Promise<void>,
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
