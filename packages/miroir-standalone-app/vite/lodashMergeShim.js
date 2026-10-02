/**
 * Stands in for bare `lodash` in the web build and dev server (#370). Its only importer is
 * @teroneko/redux-saga-promise, which does `require("lodash")` and calls `merge`; the CommonJS
 * lodash build it would bring is about 29 kB gzipped on the page. App code imports lodash-es.
 */
import merge from "lodash-es/merge.js";

export { merge };
export default { merge };
