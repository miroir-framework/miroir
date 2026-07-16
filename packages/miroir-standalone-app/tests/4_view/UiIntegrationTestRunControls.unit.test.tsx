import '@testing-library/jest-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { UiIntegrationTestRunControls } from '../../src/miroir-fwk/4_view/components/Reports/UiIntegrationTestRunControls.js';
import {
  getUiIntegrationTestRunPreferences,
  resetUiIntegrationTestRunPreferencesForTests,
} from '../../src/miroir-fwk/4-tests/uiIntegrationTestRunPreferences.js';

afterEach(() => {
  resetUiIntegrationTestRunPreferencesForTests();
});

describe('UiIntegrationTestRunControls profile picker', () => {
  it.each(['realServer-sql', 'realServer-indexedDb', 'realServer-filesystem', 'realServer-mongodb'])(
    'selects launchable %s without the gated warning (B6-c)',
    (profileName) => {
      render(<UiIntegrationTestRunControls />);

      const select = screen.getByLabelText('Profile') as HTMLSelectElement;
      expect(select.value).toBe('emulatedServer-indexedDb');

      fireEvent.change(select, { target: { value: profileName } });

      expect(select.value).toBe(profileName);
      expect(getUiIntegrationTestRunPreferences().profileName).toBe(profileName);
      expect(
        screen.queryByText(/Selected profile is not launchable yet/),
      ).not.toBeInTheDocument();
    },
  );
});
