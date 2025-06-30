import styled from "@emotion/styled";
import AddBox from "@mui/icons-material/AddBox";
import Clear from "@mui/icons-material/Clear";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Select from "@mui/material/Select";
import { JzodElement } from "miroir-core";

// import styled from "@emotion/styled";
// import { Select } from "@mui/material";

export const SizedButton = styled(Button)(({ theme }) => ({
  height: "1em",
  width: "auto",
  minWidth: "1em",
  padding: "0px",
}));
export const SizedAddBox = styled(AddBox)(({ theme }) => ({ height: "1em", width: "1em" }));

export const SizedIcon = styled(Icon)(({ theme }) => ({ height: "1em", width: "1em" }));

export const SmallIconButton = styled(IconButton)(({ theme }) => ({ size: "small" }));
export const LineIconButton = styled(IconButton)(({ theme }) => ({
  padding: 0,
  // boxSizing: "border-box",
  maxHeight: "1em",
  // transform: "scale(1.5)",
}));

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

const labelStyle = {
  paddingRight: "10px",
};

const StyledLabel = styled("label")(({ theme }) => ({
  ...theme,
  paddingRight: "10px",
}));

// ################################ TO MOVE ELESEWHERE ####################################
// #####################################################################################################
export function getItemsOrder(currentValue: any, jzodSchema: JzodElement | undefined) {
  return (jzodSchema?.type == "object" || jzodSchema?.type == "record") &&
    typeof currentValue == "object" &&
    currentValue !== null
    ? Object.keys(currentValue)
    : Array.isArray(currentValue)
    ? currentValue.map((e: any, k: number) => k)
    : [];
}

// #####################################################################################################
// EDITOR
// #####################################################################################################
export const LabeledEditor: React.FC<{
  labelElement: JSX.Element;
  editor: JSX.Element;
}> = (props) => {
  return (
    <span
      style={{
        display: "flex",
        flexFlow: "row",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      {props.labelElement}
      {props.editor}
    </span>
  );
};
