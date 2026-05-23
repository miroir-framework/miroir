/**
 * PageDispatcher — re-exports the shared dispatcher from miroir-standalone-app.
 *
 * The implementation lives in @miroir-app/miroir-fwk/4_view/PageDispatcher so
 * that both the standalone/electron app and this demo app share the exact same
 * routing logic.  Navigation uses `?page=<pageName>` query params throughout,
 * which works correctly with the hash router used in this demo app.
 */
export { PageDispatcher } from "@miroir-app/miroir-fwk/4_view/PageDispatcher.js";
