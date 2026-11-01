// #636: imports a store on purpose. Built only by the boundary test (MIROIR_SERVER_LIBRARY_PROBE), whose
// build must fail; never part of the library.
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";

export const probe = miroirFileSystemStoreSectionStartup;
