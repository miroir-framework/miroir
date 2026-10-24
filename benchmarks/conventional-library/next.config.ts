import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This folder is the project root, even when it sits inside another npm project (the Miroir repository).
  turbopack: { root: import.meta.dirname },
  outputFileTracingRoot: import.meta.dirname,
  // `next dev` would otherwise write Next.js rules into AGENTS.md when an AI agent runs it.
  agentRules: false,
  // The SQLite driver is a native module: load it from node_modules instead of bundling it.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
};

export default nextConfig;
