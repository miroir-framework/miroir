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
  it('selects launchable realServer-sql without the gated warning (B6-c)', () => {
    render(<UiIntegrationTestRunControls />);

    const select = screen.getByLabelText('Profile') as HTMLSelectElement;
    expect(select.value).toBe('emulatedServer-indexedDb');

    fireEvent.change(select, { target: { value: 'realServer-sql' } });

    expect(select.value).toBe('realServer-sql');
    expect(getUiIntegrationTestRunPreferences().profileName).toBe('realServer-sql');
    expect(
      screen.queryByText(/Selected profile is not launchable yet/),
    ).not.toBeInTheDocument();
  });

  it('shows gated warning for realServer profiles without bundled assets', () => {
    render(<UiIntegrationTestRunControls />);

    const select = screen.getByLabelText('Profile') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'realServer-indexedDb' } });

    expect(select.value).toBe('realServer-indexedDb');
    expect(
      screen.getByText(/Selected profile is not launchable yet — real-server requires miroir-server/),
    ).toBeInTheDocument();
  });
});
