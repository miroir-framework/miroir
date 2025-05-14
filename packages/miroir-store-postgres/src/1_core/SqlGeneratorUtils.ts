export const tokenStringQuote = "'";
export const tokenNameQuote = '"';
export const tokenComma = ",";
export const tokenSeparatorForTableColumn = ".";
export const tokenSeparatorForJsonAttributeAccess = " -> ";
export const tokenSeparatorForTestingJsonAttributeAccess = " ? ";
export const tokenSeparatorForSelect = tokenComma + " ";
export const tokenSeparatorForWith = tokenComma + " ";
export const tokenSeparatorForWithRtn = tokenSeparatorForWith + "\n";

export function protectedSqlAccessForPath(
  resultAccessPath: (string | number)[],
  quoted: boolean = false
): string {
  if (resultAccessPath.length === 0) return "";

  // Build the JSON access path
  const pathParts = quoted?resultAccessPath.map(e=>`${e}`):resultAccessPath.map(
    (e, index) =>
      index === 0
        ? `${tokenNameQuote}${e}${tokenNameQuote}`
        : `${tokenStringQuote}${e}${tokenStringQuote}`
  );

  console.log("pathParts", pathParts);
  // Build the CASE WHEN expression to check each step
  let expr = pathParts[0];
  let checks: string[] = [];
  let resultExpression = expr;
  let checkExpression = expr;

  for (let i = 1; i < pathParts.length; i++) {
    // SIDE EFFECTS!!
    checkExpression = `${resultExpression}${tokenSeparatorForTestingJsonAttributeAccess}${pathParts[i]}`;
    resultExpression = `${resultExpression}${tokenSeparatorForJsonAttributeAccess}${pathParts[i]}`;
    // Check if the current step is null
    // checks.push(`(${resultExpression}) IS NULL`);
    checks.push(`NOT (${checkExpression})`);
  }

  const caseWhen =
    checks.length > 0
      ? `CASE WHEN ${checks.join(" OR ")} THEN '{"queryFailure": "FailedTransformer_contextReference"}'::jsonb ELSE ${resultExpression} END`
      : resultExpression;

  return caseWhen;
}