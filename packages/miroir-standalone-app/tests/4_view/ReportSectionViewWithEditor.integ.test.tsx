import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import ReportSectionViewWithEditor from '../../src/miroir-fwk/4_view/components/Reports/ReportSectionViewWithEditor';
import { MiroirContextReactProvider } from '../../src/miroir-fwk/4_view/MiroirContextReactProvider';

// Minimal smoke test to ensure the wrapper renders and doesn't throw
describe('ReportSectionViewWithEditor non-regression', () => {
  it('renders without crashing for a simple markdown section', () => {
    const props: any = {
      applicationSection: 'application' as any,
      deploymentUuid: 'dummy' as any,
      reportData: { reportData: {} },
      fetchedDataJzodSchema: undefined,
      paramsAsdomainElements: { reportData: {} },
      reportSection: { type: 'markdownReportSection', definition: { content: 'hello', label: 'lbl' } },
      rootReport: {},
    };

    const dummyMiroirContext: any = {};
    const dummyDomainController: any = {};

    const { getAllByText } = render(
      <MiroirContextReactProvider miroirContext={dummyMiroirContext} domainController={dummyDomainController} testingDeploymentUuid={"dummy"}>
        <ReportSectionViewWithEditor {...props} />
      </MiroirContextReactProvider>
    );

    const matches = getAllByText(/hello|Inline section editor/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});
