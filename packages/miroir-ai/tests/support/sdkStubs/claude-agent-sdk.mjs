// Test stub for @anthropic-ai/claude-agent-sdk (#409 module-load probe). Offline, no key needed.
export function query() {
  return (async function* () {
    yield { type: "assistant", message: { content: [{ type: "text", text: "claude stub" }] } };
    yield { type: "result", subtype: "success", result: "claude stub" };
  })();
}
