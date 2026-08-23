import { ThemedButton } from "../Themes/index.js";
import { ThemedIcon } from "../Themes/IconComponents.js";

export interface ListTransformerToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function ListTransformerToggle({ enabled, onToggle }: ListTransformerToggleProps) {
  return (
    <ThemedButton
      aria-label="Transformer"
      style={{
        padding: "4px 8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      variant={enabled ? "primary" : "secondary"}
      onClick={onToggle}
    >
      <ThemedIcon icon="functions" style={{ fontSize: "1em", display: "block" }} />
    </ThemedButton>
  );
}
