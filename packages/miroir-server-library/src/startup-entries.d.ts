// #656: this package's own local cache entries, imported by `./startup` through the package name so that each stays a
// separate module (bundled apart, loaded only when chosen). Declared here: their built declarations need not exist
// when this package is typechecked or its declarations are built.
declare module "@miroir-framework/server/startup/redux" {
  export const localCacheModule: import("@miroir-framework/core").LocalCacheModule;
}
declare module "@miroir-framework/server/startup/zustand" {
  export const localCacheModule: import("@miroir-framework/core").LocalCacheModule;
}
