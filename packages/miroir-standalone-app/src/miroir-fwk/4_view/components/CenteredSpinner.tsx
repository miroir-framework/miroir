import React from "react";

/**
 * Full-screen centered spinner used as a React <Suspense> fallback while lazy
 * chunks are downloading.  Intentionally has no MUI dependency so it can
 * render before MUI's theme/provider tree is set up.
 *
 * The @keyframes miroir-spin animation is defined in src/index.html so it is
 * available as soon as the first byte of HTML is parsed.
 */
export function CenteredSpinner(): React.JSX.Element {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
        zIndex: 9998,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          border: "5px solid #cccccc",
          borderTopColor: "#888888",
          borderRadius: "50%",
          animation: "miroir-spin 0.9s linear infinite",
        }}
      />
    </div>
  );
}
