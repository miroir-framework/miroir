// ################################################################################################
// Feedback glow (#438).
//
// A short glow on the control that was just focused, clicked, activated with the keyboard or
// committed, so that the user (or the viewer of a displayed test run) sees which control was used.
//
// `attachFeedbackGlow(element)` makes `element` an enabled boundary: it sets
// `data-miroir-feedback-glow="on"` and adds one capture-phase listener per event type. The
// handler adds the `miroir-feedback-glow` class to the target control and removes it after the
// glow duration. Nothing is attached while no boundary is enabled, and the glow never touches
// React state, so it causes no re-render.
//
// Boundaries nest: a handler acts only when the event target's nearest boundary (any element
// carrying the attribute, `on` or `off`) is its own element, so the innermost boundary decides.
// ################################################################################################

export const feedbackGlowAttribute = "data-miroir-feedback-glow";
export const feedbackGlowClass = "miroir-feedback-glow";
export const feedbackGlowOptOutAttribute = "data-miroir-no-glow";
export const feedbackGlowStylesAttribute = "data-miroir-feedback-glow-styles";
export const feedbackGlowColorProperty = "--miroir-feedback-glow-color";
export const feedbackGlowDurationProperty = "--miroir-feedback-glow-duration";

/** The controls that glow: the event target's nearest match inside the boundary. */
export const feedbackGlowTargetSelector = [
  "button",
  "input",
  "select",
  "textarea",
  "[role=button]",
  "[role=option]",
  "[role=checkbox]",
  "[role=tab]",
  "[role=menuitem]",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export interface FeedbackGlowOptions {
  color?: string;
  durationMs?: number;
}

export const defaultFeedbackGlow: Required<FeedbackGlowOptions> = {
  color: "#ffd54f",
  durationMs: 400,
};

const glowEventTypes = ["focusin", "click", "change", "keydown"] as const;

/** `input` types that take text: Enter and Space there are typing, not activation. */
const nonTextInputTypes = new Set(["checkbox", "radio", "button", "submit", "reset", "file", "color", "range", "image"]);

function isTextEntry(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  if (tagName === "textarea") {
    return true;
  }
  if (tagName === "input") {
    return !nonTextInputTypes.has(((element as HTMLInputElement).type || "text").toLowerCase());
  }
  return (element as HTMLElement).isContentEditable === true;
}

function isMultiLineTextEntry(element: Element): boolean {
  return element.tagName.toLowerCase() === "textarea" || (element as HTMLElement).isContentEditable === true;
}

function isElement(target: EventTarget | null): target is Element {
  return !!target && typeof (target as Element).closest === "function";
}

// ################################################################################################
// The halo is a `filter: drop-shadow(...)`, not a `box-shadow`: themed inputs set their focus
// `box-shadow` with `!important`, which would hide an animated `box-shadow`, and a filter leaves a
// control's own shadow (MUI elevation, focus ring) visible under the halo.
const glowFilter = (color: string) => `drop-shadow(0 0 2px ${color}) drop-shadow(0 0 6px ${color})`;
const glowColor = `var(${feedbackGlowColorProperty}, ${defaultFeedbackGlow.color})`;

const feedbackGlowStyles = (selector: string) => `
@keyframes miroir-feedback-glow-fade {
  from { filter: ${glowFilter(glowColor)}; }
  to { filter: ${glowFilter("transparent")}; }
}
${selector} {
  animation: miroir-feedback-glow-fade var(${feedbackGlowDurationProperty}, ${defaultFeedbackGlow.durationMs}ms) ease-out forwards;
}
@media (prefers-reduced-motion: reduce) {
  ${selector} {
    animation: none;
    filter: ${glowFilter(glowColor)};
  }
}
`;

/** Per document: the glow stylesheet and the number of enabled boundaries using it. */
const stylesByDocument = new WeakMap<Document, { style: HTMLStyleElement; users: number }>();

/**
 * Adds the glow stylesheet to `document.head` for one more enabled boundary. Returns the release:
 * the stylesheet is removed when the last boundary of the document releases it.
 */
export function acquireFeedbackGlowStyles(document: Document): () => void {
  let entry = stylesByDocument.get(document);
  if (!entry) {
    const style =
      document.head.querySelector<HTMLStyleElement>(`style[${feedbackGlowStylesAttribute}]`) ?? // hot reload
      document.createElement("style");
    style.setAttribute(feedbackGlowStylesAttribute, "");
    style.textContent = feedbackGlowStyles(`[${feedbackGlowAttribute}="on"] .${feedbackGlowClass}`);
    document.head.appendChild(style);
    entry = { style, users: 0 };
    stylesByDocument.set(document, entry);
  }
  entry.users += 1;
  let released = false;
  return () => {
    if (released || !entry) {
      return;
    }
    released = true;
    entry.users -= 1;
    if (entry.users === 0) {
      entry.style.remove();
      stylesByDocument.delete(document);
    }
  };
}

/** Durations outside these bounds (e.g. a Theme value of 0) are clamped. */
export const feedbackGlowDurationBoundsMs = { min: 100, max: 3000 };

// ################################################################################################
/**
 * Makes `element` an enabled feedback glow boundary. Returns the function that detaches it:
 * listeners, attribute and custom properties are removed; a glow in progress ends on its timer.
 */
export function attachFeedbackGlow(element: HTMLElement, options: FeedbackGlowOptions = {}): () => void {
  const color = options.color ?? defaultFeedbackGlow.color;
  const durationMs = Math.min(
    feedbackGlowDurationBoundsMs.max,
    Math.max(feedbackGlowDurationBoundsMs.min, options.durationMs ?? defaultFeedbackGlow.durationMs),
  );
  const releaseStyles = acquireFeedbackGlowStyles(element.ownerDocument);
  element.setAttribute(feedbackGlowAttribute, "on");
  element.style.setProperty(feedbackGlowColorProperty, color);
  element.style.setProperty(feedbackGlowDurationProperty, `${durationMs}ms`);

  const flash = (control: Element) => {
    if (control.classList.contains(feedbackGlowClass)) {
      return; // no restart: a click that also moves focus glows once
    }
    control.classList.add(feedbackGlowClass);
    setTimeout(() => control.classList.remove(feedbackGlowClass), durationMs);
  };

  const handle = (event: Event) => {
    const target = event.target;
    if (!isElement(target) || target.closest(`[${feedbackGlowAttribute}]`) !== element) {
      return;
    }
    if (event.type === "keydown") {
      // Space types in a text field; Enter commits there (e.g. the option chosen in a filtered
      // select), except in multi-line fields.
      const key = (event as KeyboardEvent).key;
      if (key === " " ? isTextEntry(target) : key !== "Enter" || isMultiLineTextEntry(target)) {
        return;
      }
    }
    const control = target.closest(feedbackGlowTargetSelector);
    if (!control || !element.contains(control)) {
      return;
    }
    const optOut = control.closest(`[${feedbackGlowOptOutAttribute}]`);
    if (optOut && element.contains(optOut)) {
      return;
    }
    flash(control);
  };

  for (const type of glowEventTypes) {
    element.addEventListener(type, handle, { capture: true, passive: true });
  }

  return () => {
    for (const type of glowEventTypes) {
      element.removeEventListener(type, handle, { capture: true });
    }
    element.removeAttribute(feedbackGlowAttribute);
    element.style.removeProperty(feedbackGlowColorProperty);
    element.style.removeProperty(feedbackGlowDurationProperty);
    releaseStyles();
  };
}
