/** @jsxImportSource @emotion/react */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { MiroirIcon } from 'miroir-core';
import { defaultStoredMiroirTheme } from 'miroir-test-app_deployment-miroir';

import { ThemedIcon } from '../../src/miroir-fwk/4_view/components/Themes/IconComponents';
import { MiroirThemeProvider } from '../../src/miroir-fwk/4_view/contexts/MiroirThemeContext';

const testThemeOptions = [
  {
    id: 'default',
    name: 'Default Theme',
    description: 'Test theme',
    theme: defaultStoredMiroirTheme.definition,
  },
];

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MiroirThemeProvider currentThemeOptions={testThemeOptions}>
    {children}
  </MiroirThemeProvider>
);

describe('ThemedIcon svg icons', () => {
  it('renders svg from object', () => {
    const svgIcon: MiroirIcon = {
      iconType: 'svg',
      name: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" /></svg>',
    };

    render(
      <TestWrapper>
        <ThemedIcon icon={svgIcon} data-testid="test-icon" />
      </TestWrapper>,
    );

    const icon = screen.getByTestId('test-icon');
    expect(icon).toBeInTheDocument();
    expect(icon.querySelector('svg')).toBeTruthy();
    expect(icon.querySelector('circle')).toBeTruthy();
  });

  it('renders svg with color and superimposed letter', () => {
    const svgIcon: MiroirIcon = {
      iconType: 'svg',
      name: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" /></svg>',
      color: '#336699',
      superImpose: { letter: 'T', color: '#ff0000' },
    };

    render(
      <TestWrapper>
        <ThemedIcon icon={svgIcon} data-testid="test-icon" />
      </TestWrapper>,
    );

    const icon = screen.getByRole('img', { name: 'Custom svg icon' });
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveTextContent('T');
    expect(icon.querySelector('rect')).toBeTruthy();
  });

  it('has proper ARIA label for svg icons', () => {
    const svgIcon: MiroirIcon = {
      iconType: 'svg',
      name: '<svg viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7z" /></svg>',
    };

    render(
      <TestWrapper>
        <ThemedIcon icon={svgIcon} data-testid="test-icon" />
      </TestWrapper>,
    );

    const icon = screen.getByTestId('test-icon');
    expect(icon).toHaveAttribute('aria-label', 'Custom svg icon');
    expect(icon).toHaveAttribute('role', 'img');
  });
});
