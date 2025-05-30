import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { ErrorBoundary, withErrorBoundary } from 'react-error-boundary';

import styled from "@emotion/styled";
import { AddBox, Clear, ExpandLess, ExpandMore } from "@mui/icons-material";
import { Button, Checkbox, Icon, IconButton, MenuItem, Select } from "@mui/material";
import { JzodEnumEditor } from "./JzodEnumEditor";

export const StyledSelect = styled(Select)(({ theme }) => ({
  // backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  // ...theme.typography.body2,
  // padding: theme.spacing(1),
  // textAlign: "left",
  // display: "flex",
  maxHeight: "1.5em",
  // height: '80vh',
  // color: theme.palette.text.secondary,
}));
