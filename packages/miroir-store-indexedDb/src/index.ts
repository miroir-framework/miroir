// #370: the store classes are not re-exported; startup.ts loads them when a factory first runs,
// so importing this package does not pull the `level` IndexedDB driver into a page.
export {
  miroirIndexedDbStoreSectionStartup
} from './startup.js';
