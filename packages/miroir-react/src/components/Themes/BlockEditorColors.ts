import type { MiroirThemeFull } from "miroir-core";

// ################################################################################################
// #498 (analysis #497, D3 and D11): block colors of the block editor, by category. A category is
// the `classification` of a TransformerDefinition. Every color carries white text at 4.5:1 or
// more, on the light and the dark themes alike.
// ################################################################################################

export type BlockEditorColors = MiroirThemeFull["definition"]["components"]["blockEditor"];

export const defaultBlockEditorColors: { categoryColors: Record<string, string>; fallbackColor: string } = {
  categoryColors: {
    list: "#2f6fd6",
    object: "#6a4fc9",
    control: "#a8640a",
    value: "#23824a",
    variable: "#c04f15",
    operator: "#bf3c78",
    MLS: "#0d7a84",
    admin: "#556070",
    spreadsheet: "#5e7410",
    metaModel: "#94389a",
  },
  fallbackColor: "#5c6370",
};

/** The color of a block of `category`, or the fallback color when the theme has none for it. */
export function blockCategoryColor(blockEditor: BlockEditorColors | undefined, category: string): string {
  return (
    blockEditor?.categoryColors?.[category] ??
    defaultBlockEditorColors.categoryColors[category] ??
    blockEditor?.fallbackColor ??
    defaultBlockEditorColors.fallbackColor
  );
}
