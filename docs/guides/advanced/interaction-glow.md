# Interaction glow

The interaction glow is a short yellow halo around the control that was just focused, clicked, activated with the keyboard (Enter or Space) or committed (a `change` event, an option chosen in a list). It shows which control received the input. It is off by default.

## Turning it on

- **Whole app.** The AppBar button "Interaction glow" (highlight icon) switches it on or off. The choice is stored in the browser's `localStorage` under `miroirFeedbackGlow`, so it survives a reload or a browser restart.
- **Component Test Sandbox.** The glow is always on inside the sandbox panel of the Miroir Tests page, so each step of a displayed test run shows the control it acted on. The runner's `fireEvent` / `userEvent` events trigger it like real ones.
- **Vitest component runs.** Off. `MIROIR_FEEDBACK_GLOW=1` turns it on for the sandbox element of `miroir-component-tests.unit.test.tsx`, to measure its cost with the render-performance suite.

## In code (`miroir-react`)

```tsx
import { FeedbackGlowBoundary } from "miroir-react";

<FeedbackGlowBoundary enabled>            {/* on for this subtree */}
  <MyForm />
  <FeedbackGlowBoundary enabled={false}>  {/* off for this part */}
    <NoisyGrid />
  </FeedbackGlowBoundary>
</FeedbackGlowBoundary>
```

- `enabled`: `true`, `false` or `"inherit"`. The innermost boundary with `true` or `false` decides.
- `target="document"`: the document element is the boundary (used by the global switch, so that option lists portalled to `document.body` glow too). A scoped boundary does not see portals rendered outside it.
- `color`, `durationMs`, `intensity`: override the theme values.
- `attachFeedbackGlow(element, options)` does the same for a DOM element outside React and returns the function that detaches it.
- A control under an element with `data-miroir-no-glow` never glows.

Glowing controls: `button`, `input`, `select`, `textarea`, and elements with role `button`, `option`, `checkbox`, `tab`, `menuitem` or a non-negative `tabindex`, found from the event target with `closest()`. Typing in a text field does not glow; Enter in a single-line field does (it commits, e.g. the option chosen in a filtered select), Enter in a textarea does not.

## Theme

`components.feedbackGlow` in a Theme sets `color` (default `#ffd54f`), `durationMs` (default `1000`, clamped to 100-3000) and `intensity` (default `2.5`, clamped to 0.5-5). The intensity scales the halo's blur radii: at 1 they are 1, 3 and 6 px. The glow stays at full strength for the first 40% of the duration, then fades. The halo is a `filter: drop-shadow(...)`, so it shows on top of a control's own focus ring or elevation, including focus `box-shadow`s declared `!important`. With `prefers-reduced-motion: reduce`, the halo stays static for the same duration instead of fading.

## Cost

When no boundary is enabled, nothing is attached: no listener, no stylesheet (the stylesheet is removed when the last boundary detaches). An enabled boundary adds four capture-phase listeners (`focusin`, `click`, `change`, `keydown`) on its element; each interaction adds a CSS class and a timer. No React state is involved, so the glow never re-renders a component. Only the boundary reads the theme.
