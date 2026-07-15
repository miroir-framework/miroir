import React from 'react';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { expect as vitestExpect } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';


import { miroirTest_runner_library } from 'miroir-test-app_deployment-library';
import {
  ConfigurationService,
  MiroirActivityTracker,
  MiroirEventService,
  miroirCoreStartup,
  type DomainControllerInterface,
} from 'miroir-core';
import { MiroirContextReactProvider } from 'miroir-react';
import { miroirFileSystemStoreSectionStartup } from 'miroir-store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from 'miroir-store-indexedDb';
import { miroirMongoDbStoreSectionStartup } from 'miroir-store-mongodb';
import { miroirPostgresStoreSectionStartup } from 'miroir-store-postgres';

import { MiroirTestDisplay } from '../../src/miroir-fwk/4_view/components/Reports/MiroirTestDisplay.js';
import { resetIntegTestRunCoordinatorForTests } from '../../src/miroir-fwk/4-tests/integTestRunCoordinator.js';
import {
  resetUiIntegrationTestRunPreferencesForTests,
  setUiIntegrationTestRunPreferences,
} from '../../src/miroir-fwk/4-tests/uiIntegrationTestRunPreferences.js';
import {
  getLastUiIntegrationTestRunResult,
  resetLastUiIntegrationTestRunResultForTests,
} from '../../src/miroir-fwk/4-tests/uiIntegrationTestRunState.js';
import { miroirAppStartup } from '../../src/startup.js';

import { RUNNER_LIBRARY_LABEL } from '../helpers/miroirTestDisplayIntegrationLaunchMocks.js';
import '../helpers/miroirTestDisplayIntegrationLaunchMocks.js';

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
const miroirContext = {
  miroirActivityTracker,
  miroirEventService,
  extendMiroirConfigWithExtraDeploymentConfiguration: () => undefined,
};

function renderMiroirTestDisplay(renderKey = 'initial') {
  return render(
    <MiroirContextReactProvider
      miroirContext={miroirContext}
      domainController={{} as DomainControllerInterface}
    >
      <MiroirTestDisplay
        key={renderKey}
        miroirTest={miroirTest_runner_library as never}
        testLabel={RUNNER_LIBRARY_LABEL}
        gridType="glide-data-grid"
      />
    </MiroirContextReactProvider>,
  );
}

beforeAll(() => {
  miroirAppStartup();
  miroirCoreStartup();
  miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
  miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
  miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
  miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
  ConfigurationService.configurationService.registerTestImplementation({
    expect: vitestExpect as never,
  });
});

beforeEach(() => {
  resetIntegTestRunCoordinatorForTests();
  resetUiIntegrationTestRunPreferencesForTests();
  resetLastUiIntegrationTestRunResultForTests();
});

describe('MiroirTestDisplay integration launch (B6-d1)', () => {
  it('runs Return Book leaf via Run Integration Tests and shows inspector success', async () => {
    setUiIntegrationTestRunPreferences({ runTargetMode: 'pinned' });

    renderMiroirTestDisplay();

    const integrationButton = screen.getByRole('button', {
      name: `Run ${RUNNER_LIBRARY_LABEL} Integration Tests`,
    });

    expect(integrationButton).toBeEnabled();

    fireEvent.click(integrationButton);

    await waitFor(
      () => {
        const lastRun = getLastUiIntegrationTestRunResult();
        expect(lastRun?.success).toBe(true);
        expect(lastRun?.suiteKey).toBe('runner_library');
      },
      { timeout: 180_000 },
    );

    renderMiroirTestDisplay('after-run');

    const inspector = document.getElementById('integration-test-inspector');
    expect(inspector).toBeInTheDocument();
    expect(inspector).toHaveTextContent(/Result: passed/);
    expect(inspector).toHaveTextContent(/Suite: runner_library/);
    expect(inspector).toHaveTextContent(/Profile: emulatedServer-indexedDb/);
    expect(inspector).toHaveTextContent(/Run target: Library/);
    expect(inspector).toHaveTextContent(/Assertions: \d+\/\d+ passed/);
  }, 240_000);
});
