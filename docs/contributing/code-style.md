# Code Style Guide

> ⚠️⚠️⚠️ This document is a placeholder and needs to be completed.

## Overview

Follow these coding conventions when contributing to Miroir Framework.

## General Guidelines

- TypeScript with strict mode
- ESM modules only
- Avoid deep nesting
- Prefer early returns

## React Conventions

- Functional components with hooks
- Avoid `useEffect` when possible
- No publish-subscribe patterns within React

## Logging

Each file has its own logger, named after the file (`DomainController.ts` → `DomainController`):

```typescript
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "DomainController")
).then((logger: LoggerInterface) => {log = logger});
```

then `log.debug(...)`, `log.info(...)`, etc. Log levels are selected with `VITE_MIROIR_LOG_CONFIG_FILENAME`, set to a preset name (`catch-all`, `scope-query`, `scope-persistence`, …, in `packages/miroir-standalone-app/config/logging/`) or a path to a config JSON; see [Logger config options](../reference/testing.md#logger-config-options). Bare `console.*` is reserved for the cases allow-listed by `scripts/check_bare_console.py`.

## Naming Conventions

(Content to be added)

## File Organization

(Content to be added)

## Documentation

(Content to be added)

## Linting and Formatting

(Content to be added)

---

**Note**: Complete style guide coming soon.
