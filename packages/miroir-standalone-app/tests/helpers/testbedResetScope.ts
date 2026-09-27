type TaskLike = { id: string; name: string; suite?: TaskLike; file?: { id: string } };

/**
 * #318: name of the top-level `describe` the test belongs to, used as the scope key of a
 * `perSuite` testbed reset. A test outside any `describe` has no scope key.
 */
export function topLevelSuiteName(task: TaskLike): string | undefined {
  const fileId = task.file?.id;
  let current = task.suite;
  let topLevel: TaskLike | undefined;
  while (current && current.id !== fileId) {
    topLevel = current;
    current = current.suite;
  }
  return topLevel?.name;
}
