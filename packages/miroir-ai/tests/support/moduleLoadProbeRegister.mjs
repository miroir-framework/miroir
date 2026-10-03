// Loaded with `node --import` by the #409 module-load probe; see moduleLoadProbe.ts.
import { register } from "node:module";

register("./moduleLoadProbeHooks.mjs", import.meta.url, {
  data: {
    recordFile: process.env.MIROIR_PROBE_RECORD_FILE,
    stubs: JSON.parse(process.env.MIROIR_PROBE_STUBS ?? "{}"),
  },
});
