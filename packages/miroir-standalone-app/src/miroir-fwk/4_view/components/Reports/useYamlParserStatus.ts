import { useSyncExternalStore } from "react";

import {
  ensureYamlParser,
  isYamlParserLoaded,
  MiroirLoggerFactory,
  type LoggerInterface,
} from "miroir-core";

import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "useYamlParserStatus");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI").then((logger: LoggerInterface) => {
  log = logger;
});

export type YamlParserStatus = "loading" | "loaded" | "failed";

export interface YamlParserLoader {
  isLoaded: () => boolean;
  load: () => Promise<void>;
}

export interface YamlParserStatusStore {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => YamlParserStatus;
}

/**
 * The YAML parser loads on demand in the browser (#370). Subscribing starts the load (again after a
 * failure) and notifies once it succeeds or fails, so a view can parse YAML without a `useEffect`.
 */
export function createYamlParserStatusStore(loader: YamlParserLoader): YamlParserStatusStore {
  let failed = false;
  return {
    subscribe(onChange) {
      let subscribed = true;
      loader.load().then(
        () => {
          failed = false;
          if (subscribed) onChange();
        },
        (error: unknown) => {
          failed = true;
          log.warn("useYamlParserStatus: the YAML parser did not load", error);
          if (subscribed) onChange();
        },
      );
      return () => {
        subscribed = false;
      };
    },
    getSnapshot() {
      if (loader.isLoaded()) return "loaded";
      return failed ? "failed" : "loading";
    },
  };
}

const yamlParserStatusStore = createYamlParserStatusStore({
  isLoaded: isYamlParserLoaded,
  load: ensureYamlParser,
});

export function useYamlParserStatus(store: YamlParserStatusStore = yamlParserStatusStore): YamlParserStatus {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
