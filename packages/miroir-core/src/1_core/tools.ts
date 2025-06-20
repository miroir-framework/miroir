import equal from "fast-deep-equal"

export function pushIfUnique<T>(array: T[], item: T): void {
  // if (!array.includes(item)) {
  const isUnique = !array.some(existingItem => equal(existingItem, item));
  if (isUnique) {
    array.push(item);
  }
}

export function mergeIfUnique<T>(array: T[], items: T[]): void {
  // if (!array.includes(item)) {
  items.forEach(item => {
    pushIfUnique(array, item);
  });
}