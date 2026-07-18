// Mocks must load before MiroirTestListDisplay / catalog imports.
import '../helpers/miroirTestListIntegrationLaunchMocks.js';

import React from 'react';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { expect as vitestExpect } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  ConfigurationService,
  MiroirActivityTracker,
  MiroirEventService,
  miroirCoreStartup,
  type DomainControllerInterface,
  type MiroirTestDefinition,
} from 'miroir-core';
import { MiroirContextReactProvider } from 'miroir-react';
import { miroirTest_miroirCoreTransformers } from 'miroir-test-app_deployment-miroir';
import { miroirFileSystemStoreSectionStartup } from 'miroir-store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from 'miroir-store-indexedDb';
import { miroirMongoDbStoreSectionStartup } from 'miroir-store-mongodb';
import { miroirPostgresStoreSectionStartup } from 'miroir-store-postgres';

import { MiroirTestListDisplay } from '../../src/miroir-fwk/4_view/components/Reports/MiroirTestListDisplay.js';
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

import {
  capturedUiIntegrationRunResults,
  resetCapturedUiIntegrationRunResults,
} from '../helpers/miroirTestListIntegrationLaunchCapture.js';
import { TRANSFORMER_SUITE_KEY } from '../helpers/uiIntegrationTestLaunchFilterHelpers.js';


const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
const miroirContext = {
  miroirActivityTracker,
  miroirEventService,
  extendMiroirConfigWithExtraDeploymentConfiguration: () => undefined,
};

function asMiroirTest(instance: unknown): MiroirTestDefinition {
  return instance as MiroirTestDefinition;
}

function renderMiroirTestListDisplay(renderKey = 'initial') {
  return render(
    <MiroirContextReactProvider
      miroirContext={miroirContext}
      domainController={{} as DomainControllerInterface}
    >
      <MiroirTestListDisplay
        key={renderKey}
        miroirTests={[asMiroirTest(miroirTest_miroirCoreTransformers)]}
        gridType="glide-data-grid"
        useSnackBar={true}
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
  resetCapturedUiIntegrationRunResults();
  // Keep UI on browser-launchable default; Node env mock loads emulatedServer-sql.
  setUiIntegrationTestRunPreferences({
    runTargetMode: 'pinned',
  });
});

describe('MiroirTestListDisplay integration launch (T5)', () => {
  it('runs one miroirCoreTransformers integ leaf via Run All Integration Tests', async () => {
    renderMiroirTestListDisplay();

    const integrationButton = screen.getByRole('button', {
      name: 'Run All Integration Tests',
    });
    expect(integrationButton).toBeEnabled();

    fireEvent.click(integrationButton);

    await waitFor(
      () => {
        expect(capturedUiIntegrationRunResults.length).toBeGreaterThan(0);
        const lastCaptured = capturedUiIntegrationRunResults.at(-1);
        expect(lastCaptured?.success).toBe(true);
        expect(lastCaptured?.suiteKey).toBe(TRANSFORMER_SUITE_KEY);
        expect(lastCaptured?.sessionKind).toBe('transformer');
      },
      { timeout: 180_000 },
    );

    const lastRun = getLastUiIntegrationTestRunResult();
    expect(lastRun?.success).toBe(true);
    expect(lastRun?.suiteKey).toBe(TRANSFORMER_SUITE_KEY);
    expect(lastRun?.sessionKind).toBe('transformer');

    renderMiroirTestListDisplay('after-run');

    const inspector = document.getElementById('integration-test-inspector');
    expect(inspector).toBeInTheDocument();
    expect(inspector).toHaveTextContent(/Result: passed/);
    expect(inspector).toHaveTextContent(/Suite: miroirCoreTransformers/);
    expect(inspector).toHaveTextContent(/Session: transformer/);
    expect(inspector).toHaveTextContent(/Profile: emulatedServer-indexedDb/);
  }, 240_000);
});
