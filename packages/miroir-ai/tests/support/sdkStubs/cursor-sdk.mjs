// Test stub for @cursor/sdk (#409 module-load probe). Offline, no key needed.
export const Agent = {
  create: async () => ({
    send: async () => ({
      stream: async function* () {
        yield { type: "assistant", message: { content: [{ type: "text", text: "cursor stub" }] } };
      },
      wait: async () => ({ status: "finished" }),
    }),
    async [Symbol.asyncDispose]() {},
  }),
};
