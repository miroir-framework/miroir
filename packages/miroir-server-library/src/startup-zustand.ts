// #656: the zustand local cache's Node entry, bundled; loaded by `./startup` when a process starts on zustand.
import type { LocalCacheModule } from "@miroir-framework/core";
import { localCacheModule as zustandLocalCacheModule } from "miroir-localcache-zustand/node";

export const localCacheModule: LocalCacheModule = zustandLocalCacheModule;
