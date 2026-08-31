/**
 * Feedback loop for CodeMirror "Fold line" gutter clicks.
 * Mirrors CodeBlock_ReadOnly: javascript() + foldGutter + EditorView.editable.of(false).
 */
import { afterEach, describe, expect, it } from "vitest";
import { EditorState, StateEffect } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import {
  foldable,
  foldedRanges,
  foldEffect,
  foldGutter,
  forceParsing,
} from "@codemirror/language";

const FOLDABLE_JSON = `{
  "definition": {
    "absolutePath": "/tmp/a",
    "relativePath": "a"
  }
}
`;

function collectFolded(view: EditorView): { from: number; to: number }[] {
  const ranges: { from: number; to: number }[] = [];
  foldedRanges(view.state).between(0, view.state.doc.length, (from, to) => {
    ranges.push({ from, to });
  });
  return ranges;
}

function mountEditor(options: {
  doc?: string;
  editable: boolean;
  readOnly?: boolean;
  heightPx?: number;
}): { view: EditorView; parent: HTMLDivElement } {
  const parent = document.createElement("div");
  parent.style.width = "800px";
  parent.style.height = `${options.heightPx ?? 200}px`;
  document.body.appendChild(parent);

  const extensions: any[] = [
    javascript(),
    EditorView.lineWrapping,
    foldGutter(),
    EditorView.theme({
      "&": { height: `${options.heightPx ?? 200}px` },
      "& .cm-scroller": { height: "100% !important" },
    }),
  ];
  if (options.editable === false) {
    extensions.push(EditorView.editable.of(false));
  }
  if (options.readOnly) {
    extensions.push(EditorState.readOnly.of(true));
  }

  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: options.doc ?? FOLDABLE_JSON,
      extensions,
    }),
  });
  forceParsing(view, view.state.doc.length, Infinity);
  view.measure();
  return { view, parent };
}

function clickFirstFoldMarker(parent: HTMLElement): boolean {
  const marker = parent.querySelector('.cm-foldGutter span[title="Fold line"]') as HTMLElement | null;
  if (!marker) {
    return false;
  }
  marker.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true, view: window })
  );
  return true;
}

const mounted: { view: EditorView; parent: HTMLDivElement }[] = [];

afterEach(() => {
  for (const { view, parent } of mounted) {
    view.destroy();
    parent.remove();
  }
  mounted.length = 0;
});

describe("CodeMirror fold gutter (CodeBlock_ReadOnly setup)", () => {
  it("detects a foldable range on the first JSON object line", () => {
    const mountedEditor = mountEditor({ editable: false });
    mounted.push(mountedEditor);
    const line = mountedEditor.view.state.doc.line(1);
    const range = foldable(mountedEditor.view.state, line.from, line.to);
    expect(range, "first line should be foldable").toBeTruthy();
  });

  it("folds when foldEffect is dispatched with editable=false", () => {
    const mountedEditor = mountEditor({ editable: false });
    mounted.push(mountedEditor);
    const line = mountedEditor.view.state.doc.line(1);
    const range = foldable(mountedEditor.view.state, line.from, line.to);
    expect(range).toBeTruthy();
    mountedEditor.view.dispatch({ effects: foldEffect.of(range!) });
    expect(collectFolded(mountedEditor.view).length).toBeGreaterThan(0);
  });

  it("folds when the Fold line gutter marker is clicked (editable=false)", () => {
    const mountedEditor = mountEditor({ editable: false });
    mounted.push(mountedEditor);
    const clicked = clickFirstFoldMarker(mountedEditor.parent);
    expect(clicked, "expected a Fold line gutter marker").toBe(true);
    expect(
      collectFolded(mountedEditor.view).length,
      "clicking Fold line should create a folded range"
    ).toBeGreaterThan(0);
  });

  it("folds when the Fold line gutter marker is clicked (readOnly, editable)", () => {
    const mountedEditor = mountEditor({ editable: true, readOnly: true });
    mounted.push(mountedEditor);
    const clicked = clickFirstFoldMarker(mountedEditor.parent);
    expect(clicked, "expected a Fold line gutter marker").toBe(true);
    expect(collectFolded(mountedEditor.view).length).toBeGreaterThan(0);
  });

  it("keeps folds after reconfigure when extension identity is stable", () => {
    const parent = document.createElement("div");
    document.body.appendChild(parent);
    const stableExtensions = [
      javascript(),
      EditorView.lineWrapping,
      foldGutter(),
      EditorView.editable.of(false),
    ];
    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: FOLDABLE_JSON,
        extensions: stableExtensions,
      }),
    });
    mounted.push({ view, parent });
    forceParsing(view, view.state.doc.length, Infinity);
    const line = view.state.doc.line(1);
    const range = foldable(view.state, line.from, line.to);
    view.dispatch({ effects: foldEffect.of(range!) });
    expect(collectFolded(view).length).toBeGreaterThan(0);

    view.dispatch({ effects: StateEffect.reconfigure.of(stableExtensions) });
    expect(
      collectFolded(view).length,
      "stable extensions should not wipe fold state on reconfigure"
    ).toBeGreaterThan(0);
  });

  it("keeps folds after reconfigure even when the extensions array is a new instance", () => {
    const parent = document.createElement("div");
    document.body.appendChild(parent);
    const makeExtensions = () => [
      javascript(),
      EditorView.lineWrapping,
      foldGutter(),
      EditorState.readOnly.of(true),
    ];
    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: FOLDABLE_JSON,
        extensions: makeExtensions(),
      }),
    });
    mounted.push({ view, parent });
    forceParsing(view, view.state.doc.length, Infinity);
    const line = view.state.doc.line(1);
    const range = foldable(view.state, line.from, line.to);
    view.dispatch({ effects: foldEffect.of(range!) });
    expect(collectFolded(view).length).toBeGreaterThan(0);

    view.dispatch({ effects: StateEffect.reconfigure.of(makeExtensions()) });
    expect(collectFolded(view).length).toBeGreaterThan(0);
  });
});
