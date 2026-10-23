/**
 * `updateTransformerEditorState` applies each update to the latest TransformerEditor state, also
 * when it is called through a reference taken before an earlier update.
 *
 * The TransformerEditor calls it from closures that outlive a render: an effect cleanup on
 * `[context]` changes and a debounced timer. Built from the state of its own render, such a call
 * wrote back that state and dropped the updates made since: a click on "Restrict transformers to
 * the input type" right after the editor mounted was undone, so the in-app component test run
 * failed its "restriction off" steps whenever the page rendered late (unfocused or background tab).
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- transformerEditorStateUpdates
 * ```
 */
import React from "react";
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { defaultSelfApplicationDeploymentMap } from "miroir-core";
import { useMiroirContextService } from "miroir-react";

import {
  buildComponentTestWrapper,
  type ComponentTestWrapper,
} from "../../src/miroir-fwk/4-tests/componentTests/componentTestTools";

type EditorContext = ReturnType<typeof useMiroirContextService>;

describe("updateTransformerEditorState", () => {
  let wrapper: ComponentTestWrapper | undefined;
  afterEach(() => {
    wrapper?.miroirEventService.destroy();
    wrapper = undefined;
  });

  it("keeps an update made after the reference used for a later update was taken", () => {
    wrapper = buildComponentTestWrapper({
      applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
      isolateToolsPageState: true,
    });
    let latest: EditorContext | undefined;
    const Probe: React.FC = () => {
      latest = useMiroirContextService();
      return null;
    };
    const { Wrapper } = wrapper;
    render(
      <Wrapper>
        <Probe />
      </Wrapper>,
    );
    // taken before the first update, as an effect cleanup or a pending timer holds it
    const heldUpdate = latest!.updateTransformerEditorState;

    act(() => latest!.updateTransformerEditorState({ restrictTransformersToInputType: false }));
    act(() => heldUpdate({ showAllInstances: true }));

    expect(latest!.toolsPageState.transformerEditor).toMatchObject({
      restrictTransformersToInputType: false,
      showAllInstances: true,
    });
  });
});
