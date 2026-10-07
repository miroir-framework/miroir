# TDD implementation plan, #507: presentation hints for blocks

Part of #497 (analysis.md: G10, round 1 Q5, D3, D11, §6.1). Branch `claude/507-block-editor-presentation-hints`, PR into `_integration`.

## What a hint is

An optional `presentation` object, stored with what a block is computed from:
- a TransformerDefinition: top-level attribute next to `classification` (not in `transformerInterface`, which is the interface contract spread into the fundamental schema);
- an Endpoint action: next to `autocommitFromUI` (not in `actionParameters`, whose keys are the action's attributes and the block's rows).

```
presentation?: {
  labelTemplate?: string,              // "map [applyTo] with [elementTransformer]"
  icon?: string,                       // a ThemedIcon name, as Entity.icon and menu items use
  category?: string,                   // a key of Theme components.blockEditor.categoryColors: the block's color
  colorByTheme?: Record<string, string> // a color per Theme id, for a block no category fits
}
```

D11: no raw color. A hint names a category resolved through the Theme, or a color per Theme (light and dark differ).

Label template: words, and `[name]` for an attribute of the block. A `[name]` that is not an attribute of the block stays as text, so a typo shows instead of vanishing. Without a template, the header keeps the transformer type (or action type) as today.

## Slice 1 — the schemas (AC 1)

RED: `fn.blockModel` "presentation hints": the TransformerDefinition and Endpoint Entity schemas accept a `presentation`, and every existing TransformerDefinition and Endpoint asset is still valid (the asset sweep stays green).
GREEN: `presentation` in the Entity files of TransformerDefinition and Endpoint (`action`) and their EntityVersion copies; `npm run build -w miroir-app-miroir`, `npm run devBuild -w miroir-core` (types: `TransformerDefinition.presentation`, `Action.presentation`, a shared `blockPresentation` schema).

**Realization (✅):** the hints schema is `blockPresentationHints` in the fundamental ML schema (`getMiroirFundamentalMlSchema.ts`), and the four Entity files (TransformerDefinition, Endpoint, and their EntityVersion copies) hold a `schemaReference` to it. Written inline in each, it added about 12 kB to the page and put `miroir-app-miroir` over its eager cap (3405031 bytes against 3400000); the reference keeps it under (bundle check: 0 violations). Types: `BlockPresentationHints`, `TransformerDefinition.presentation`, `Action.presentation`. No `fn.*` case parses an instance with a schema, so the RED is the platform test `BlockPresentationHints.unit.test.ts`: every TransformerDefinition asset and every Endpoint action of the Endpoint assets parses; mapList and an Endpoint action take hints; a raw `color` is refused (the hints object is strict). One asset failed before #507: spreadSheetToMlSchema, whose `mergeIntoObject.definition` is a transformer where the schema takes an object. It is filed as #525 and listed as known invalid; the test checks that it still fails, so its fix asks for the entry to go.

## Slice 2 — the block model

RED: `fn.blockModel` cases on `transformerBlock` / `actionBlock` and the outline:
- a template gives `title` segments: text, and attribute segments naming a row or a header parameter;
- an unknown `[name]` stays text; no template gives no `title`;
- `presentation.category` gives `colorCategory`, the palette group keeps `classification`;
- `icon` and `colorByTheme` are carried;
- an action's hint is read from its registry entry;
- `blockOutline` prints the title when there is one.
GREEN: `blockTitleSegments(template, attributes)` and the fields in `TransformerBlockModel.ts` and its interface.

**Realization (✅):** `BlockPresentation` (`title`, `icon`, `colorCategory`, `colorByTheme`) on `TransformerBlock` and `ActionBlock`, read from `definition.presentation` (cached with the type info) or from the action of the Endpoint action registry entry. The attributes a template may name: the declared attributes of the transformer; for an action, the keys of its `actionParameters` and of its payload schema. The outline is unchanged: a title in `headerOf` would rewrite every outline case with one of the four transformers, so the cases read `presentation` from `transformerBlockTree` instead. No case gives an action hints: the registry comes from the model environment, which a `fn` case cannot hand over, and no Endpoint action asset has hints. `fn.blockModel` "presentation hints": 6 cases (template segments, an unknown name, plain text, every hint carried with the classification kept, an icon only, mapList's own template).

## Slice 3 — rendering and the four templates (AC 2)

RED: `ui.blockEditing` "presentation hints": a mapList block's header reads "map [applyTo] with [elementTransformer]" (`block-title:<id>` with `data-title`); a block with a `colorByTheme` for the current Theme gets that color.
GREEN (as planned): `TransformerBlockView` / `ActionBlockView` render the title (text, then a chip per attribute; the type stays in the tooltip), the icon (`ThemedIcon`), and the color from `colorByTheme[theme id]`, else `colorCategory`, else `category`. Templates on mapList ("map [applyTo] with [elementTransformer]"), filterList ("keep from [applyTo] where [predicate]"), ifThenElse ("if [if] then [then] else [else]"), dataflowObject ("compute [definition] and return [target]").

## Slice 4 — docs, nonreg, PR

`docs/reference/transformers.md` (presentation hints); nonreg filesystem shared runner; PR with `Closes #507`.

**Realization of slice 3 (✅):** `BlockTitle` renders the icon (`ThemedIcon`, `block-icon:<id>`) and the title (`block-title:<id>`, `data-title` with `[attribute]` per chip, the type name as tooltip); a chip (`block-title-attribute:<id>:<name>`, `data-value`) shows a header parameter's value, else the attribute's name. Without a template, `block-title` holds the type name. `blockColor` takes `colorByTheme[theme id]`, else the Theme color of `colorCategory`, else of the category; `BlockColors` gets `themeId` (the Theme definition's `id`). The four templates are in the assets: mapList "map [applyTo] with [elementTransformer]", filterList "keep from [applyTo] where [predicate]", ifThenElse "if [if] then [then] else [else]", dataflowObject "compute [definition] and return [target]". The AC asks for a `ui.blockEditor` case; it is in `ui.blockEditing`, off the page, as #500 decided for the cases of #501-#507 (`ui.blockEditor` is on the page, at the cap). Two suites: "presentation hints" (entityDefinition_extractAttributes: the filterList sentence, its tooltip, the predicate chip, a boolExpr without template) and "presentation hints of a dataflow" (spreadSheetToMlSchema: the `target` chip shows `schema`). `ui.blockEditing` 56/56, `ui.blockEditor` 18/18, leaf count 203.
