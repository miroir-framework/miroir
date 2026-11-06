import { lazy } from "react";

/** #679: `GitPageView`, in its own chunk: it is not on the eager bundle of the hosts. */
export const LazyGitPageView = lazy(async () => ({ default: (await import("./GitPageView.js")).GitPageView }));

/** #683: `GitClonePanel`, in its own chunk too. */
export const LazyGitClonePanel = lazy(async () => ({ default: (await import("./GitClonePanel.js")).GitClonePanel }));
