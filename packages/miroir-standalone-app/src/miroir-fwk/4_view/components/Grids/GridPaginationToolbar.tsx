import React from "react";

import type { ClientPaginationState } from "./gridPagination.js";

type GridPaginationToolbarProps = {
  pagination: ClientPaginationState;
  theme?: {
    colors?: {
      primary?: string;
      border?: string;
      text?: string;
      textSecondary?: string;
    };
    typography?: {
      fontSize?: string;
    };
  };
};

export const GridPaginationToolbar: React.FC<GridPaginationToolbarProps> = ({
  pagination,
  theme,
}) => {
  if (pagination.pageCount <= 1) {
    return null;
  }

  const primary = theme?.colors?.primary ?? "#1976d2";
  const border = theme?.colors?.border ?? "rgba(0, 0, 0, 0.2)";
  const text = theme?.colors?.text ?? "#1a1a1a";
  const textSecondary = theme?.colors?.textSecondary ?? "#666666";
  const fontSize = theme?.typography?.fontSize ?? "13px";

  const buttonStyle: React.CSSProperties = {
    padding: "4px 12px",
    fontSize,
    border: `1px solid ${border}`,
    borderRadius: "4px",
    backgroundColor: "#ffffff",
    color: text,
    cursor: "pointer",
  };

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    opacity: 0.45,
    cursor: "not-allowed",
  };

  return (
    <div
      data-testid="grid-pagination-toolbar"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "8px 0",
        fontSize,
        color: textSecondary,
      }}
    >
      <span data-testid="grid-pagination-range">
        Showing {pagination.from}–{pagination.to} of {pagination.total}
      </span>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          data-testid="grid-pagination-prev"
          style={pagination.canPrev ? buttonStyle : disabledButtonStyle}
          disabled={!pagination.canPrev}
          onClick={pagination.prev}
        >
          Previous
        </button>
        <button
          type="button"
          data-testid="grid-pagination-next"
          style={
            pagination.canNext
              ? { ...buttonStyle, borderColor: primary, color: primary }
              : disabledButtonStyle
          }
          disabled={!pagination.canNext}
          onClick={pagination.next}
        >
          Next
        </button>
      </div>
    </div>
  );
};
