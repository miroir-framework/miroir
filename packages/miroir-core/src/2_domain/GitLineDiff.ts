/**
 * #679: the line diff of the Git page, between the before and after text of one file. Instance files
 * are pretty-printed JSON, so a line diff reads well; the longest common subsequence is exact up to
 * `GIT_LINE_DIFF_CELL_LIMIT` line pairs, beyond which the whole text is shown as replaced.
 */

export type GitDiffLine = { kind: "same" | "added" | "removed"; text: string };

/** Above this many line pairs (before lines × after lines), the diff is not computed line by line. */
export const GIT_LINE_DIFF_CELL_LIMIT = 4_000_000;

function splitLines(text: string | undefined): string[] {
  if (text === undefined || text === "") {
    return [];
  }
  const lines = text.split(/\r?\n/);
  return lines[lines.length - 1] === "" ? lines.slice(0, -1) : lines;
}

/**
 * The lines of `before` and `after` in order, each one kept, removed or added. An absent text has no
 * line: a file absent before is all added, absent after all removed.
 */
export function gitLineDiff(before: string | undefined, after: string | undefined): GitDiffLine[] {
  const a = splitLines(before);
  const b = splitLines(after);
  // the common head and tail are kept as is, which leaves a small middle for most edits
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) {
    head++;
  }
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) {
    tail++;
  }
  const middleA = a.slice(head, a.length - tail);
  const middleB = b.slice(head, b.length - tail);
  const same = (text: string): GitDiffLine => ({ kind: "same", text });
  const result: GitDiffLine[] = a.slice(0, head).map(same);
  if (middleA.length * middleB.length > GIT_LINE_DIFF_CELL_LIMIT) {
    result.push(...middleA.map((text): GitDiffLine => ({ kind: "removed", text })));
    result.push(...middleB.map((text): GitDiffLine => ({ kind: "added", text })));
  } else {
    result.push(...middleDiff(middleA, middleB));
  }
  result.push(...a.slice(a.length - tail).map(same));
  return result;
}

function middleDiff(a: string[], b: string[]): GitDiffLine[] {
  const n = a.length;
  const m = b.length;
  // lengths[i][j]: longest common subsequence of a[i..] and b[j..]
  const lengths: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lengths[i][j] = a[i] === b[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
    }
  }
  const result: GitDiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      result.push({ kind: "same", text: a[i] });
      i++;
      j++;
    } else if (lengths[i + 1][j] >= lengths[i][j + 1]) {
      result.push({ kind: "removed", text: a[i] });
      i++;
    } else {
      result.push({ kind: "added", text: b[j] });
      j++;
    }
  }
  for (; i < n; i++) {
    result.push({ kind: "removed", text: a[i] });
  }
  for (; j < m; j++) {
    result.push({ kind: "added", text: b[j] });
  }
  return result;
}
