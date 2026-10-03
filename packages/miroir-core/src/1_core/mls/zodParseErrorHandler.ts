import { ZodParseError, ZodParseErrorIssue } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { mergeIfUnique, pushIfUnique } from "../tools";

// zod 4 reports the issues of each union branch in `errors`, with paths relative to the union issue: the leaves
// returned here carry absolute paths.
function branchIssues(unionIssue: ZodParseErrorIssue, branch: ZodParseErrorIssue[]): ZodParseErrorIssue[] {
  return branch.map((issue) => ({ ...issue, path: [...unionIssue.path, ...issue.path] }) as ZodParseErrorIssue);
}

function issuesFirstLeaf(issues: ZodParseErrorIssue[]): undefined | ZodParseErrorIssue {
  if (issues.length === 0) {
    return undefined;
  }

  const firstIssue = issues[0];
  if (firstIssue.code !== "invalid_union") {
    return firstIssue;
  }

  if (firstIssue.errors && firstIssue.errors.length > 0) {
    return issuesFirstLeaf(branchIssues(firstIssue, firstIssue.errors[0]));
  } else {
    return firstIssue;
  }
}

export function zodErrorFirstIssueLeaf(error: ZodParseError): undefined | ZodParseErrorIssue {
  return issuesFirstLeaf(error.issues);
}

function issuesDeepestLeaves(issues: ZodParseErrorIssue[]): { depth: number; issues: ZodParseErrorIssue[] } {
  if (issues.length === 0) {
    return { depth: 0, issues: [] };
  }

  let deepestDepth: number = 0;
  const deepestLeaves: ZodParseErrorIssue[] = [];

  for (const issue of issues) {
    if (issue.code === "invalid_union" && issue.errors && issue.errors.length > 0) {
      for (const branch of issue.errors) {
        const subLeaves = issuesDeepestLeaves(branchIssues(issue, branch));
        if (subLeaves.depth > deepestDepth) {
          deepestLeaves.length = 0; // Clear previous leaves
          mergeIfUnique(deepestLeaves, subLeaves.issues);
          deepestDepth = subLeaves.depth;
        } else if (subLeaves.depth === deepestDepth) {
          mergeIfUnique(deepestLeaves, subLeaves.issues);
        }
      }
    } else {
      if (issue.path.length > deepestDepth) {
        deepestLeaves.length = 0; // Clear previous leaves
        deepestDepth = issue.path.length;
      }
      if (issue.path.length === deepestDepth) {
        pushIfUnique(deepestLeaves, issue);
      }
    }
  }

  return { depth: deepestDepth, issues: deepestLeaves };
}

export function zodErrorDeepestIssueLeaves(error: ZodParseError): { depth: number; issues: ZodParseErrorIssue[] } {
  return issuesDeepestLeaves(error.issues);
}
