// #652 (analysis D4): the Node startup call of a Miroir process (CLI, MCP host, server), from the local cache's
// entry without React. Bundled here, so a process importing `@miroir-framework/server/startup` needs no private
// package and holds one local cache. A second entry of the server library: importing it loads no Express code.

export {
  startMiroirNode,
  startMiroirPlatform,
  type MiroirEmulatedServer,
  type MiroirNodeOptions,
  type MiroirPlatform,
  type MiroirPlatformOptions,
} from "miroir-localcache-redux/node";
