import React from 'react';

import { UnitTestExecutionSummary } from './UnitTestExecutionSummary.js';

export interface TransformerTestResultExecutionSummaryProps {
  resolveConditionalSchemaResultsData: any[];
  testLabel?: string;
}

/** @deprecated Use UnitTestExecutionSummary — kept for backward compatibility with TransformerTestDisplay */
export const TransformerTestResultExecutionSummary: React.FC<TransformerTestResultExecutionSummaryProps> = ({
  resolveConditionalSchemaResultsData,
  testLabel = "TransformerTest",
}) => (
  <UnitTestExecutionSummary
    testResultsData={resolveConditionalSchemaResultsData}
    testLabel={testLabel}
  />
);
