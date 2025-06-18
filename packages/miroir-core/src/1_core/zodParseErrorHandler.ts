import { ZodParseError, ZodParseErrorIssue } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export function zodErrorFirstIssueLeaf(error:ZodParseError): undefined | ZodParseErrorIssue {
  if (error.issues.length === 0) {
    return undefined;
  }

  const firstIssue = error.issues[0];
  if (firstIssue.code !== "invalid_union") {
    return firstIssue;
  }

  if (firstIssue.unionErrors && firstIssue.unionErrors.length > 0) {
    return zodErrorFirstIssueLeaf(firstIssue.unionErrors[0]);
  } else {
    return firstIssue;
  }
}

export function zodErrorDeepestIssueLeaves(error: ZodParseError): {depth: number, issues:ZodParseErrorIssue[]} {
  if (error.issues.length === 0) {
    return { depth: 0, issues: [] };
  }

  const issues = error.issues;
  let deepestDepth: number = 0;
  const deepestLeaves: ZodParseErrorIssue[] = [];

  for (const issue of issues) {
    if (issue.code === "invalid_union" && issue.unionErrors && issue.unionErrors.length > 0) {
      for (const unionError of issue.unionErrors) {
        const subLeaves = zodErrorDeepestIssueLeaves(unionError);
        if (subLeaves.depth > deepestDepth) {
          deepestLeaves.length = 0; // Clear previous leaves
          deepestLeaves.push(...subLeaves.issues);
          deepestDepth = subLeaves.depth;
        } else if (subLeaves.depth === deepestDepth) {
          deepestLeaves.push(...subLeaves.issues);
        }
      }
    } else {
      if (issue.path.length > deepestDepth) {
        deepestLeaves.length = 0; // Clear previous leaves
        deepestDepth = issue.path.length;
      }
      if (issue.path.length === deepestDepth) {
        deepestLeaves.push(issue);
      }
    }
  }

  return { depth: deepestDepth, issues: deepestLeaves };
}