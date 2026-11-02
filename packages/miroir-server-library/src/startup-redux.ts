// #656: the redux local cache's Node entry, bundled; loaded by `./startup` when a process starts on redux.
import type { LocalCacheModule } from "@miroir-framework/core";
import { localCacheModule as reduxLocalCacheModule } from "miroir-localcache-redux/node";

export const localCacheModule: LocalCacheModule = reduxLocalCacheModule;
