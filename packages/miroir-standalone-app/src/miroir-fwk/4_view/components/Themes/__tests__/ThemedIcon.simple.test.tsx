/** @jsxImportSource @emotion/react */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MiroirIcon } from 'miroir-core';
import { ThemedIcon } from '../IconComponents';
import { MiroirThemeProvider } from '../../../contexts/MiroirThemeContext';
import { defaultMiroirTheme } from '../defaults';

// Simple wrapper component to provide theme context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MiroirThemeProvider theme={defaultMiroirTheme}>
    {children}
  </MiroirThemeProvider>
);

describe('ThemedIcon', () => {
  describe('MiroirIcon prop support', () => {
    it('should render MUI icon from string', () => {
      render(
        <TestWrapper>
          <ThemedIcon icon="home" data-testid="test-icon" />
        </TestWrapper>
      );
      
      const icon = screen.getByTestId('test-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveTextContent('home');
      expect(icon).toHaveClass('material-symbols-outlined');
    });

    it('should render MUI icon from object', () => {
      const muiIcon: MiroirIcon = { iconType: 'mui', name: 'settings' };
      
      render(
        <TestWrapper>
          <ThemedIcon icon={muiIcon} data-testid="test-icon" />
        </TestWrapper>
      );
      
      const icon = screen.getByTestId('test-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveTextContent('settings');
      expect(icon).toHaveClass('material-symbols-outlined');
    });

    it('should render emoji from object', () => {
      const emojiIcon: MiroirIcon = { iconType: 'emoji', name: 'smile' };
      
      render(
        <TestWrapper>
          <ThemedIcon icon={emojiIcon} data-testid="test-icon" />
        </TestWrapper>
      );
      
      const icon = screen.getByTestId('test-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveTextContent('😊');
    });

    it('should show error indicator for unknown emoji', () => {
      const unknownEmoji: MiroirIcon = { iconType: 'emoji', name: 'nonexistent' };
      
      render(
        <TestWrapper>
          <ThemedIcon icon={unknownEmoji} data-testid="test-icon" />
        </TestWrapper>
      );
      
      const icon = screen.getByTestId('test-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveTextContent('❓ nonexistent');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label for MUI icons', () => {
      render(
        <TestWrapper>
          <ThemedIcon icon="home" data-testid="test-icon" />
        </TestWrapper>
      );
      
      const icon = screen.getByTestId('test-icon');
      expect(icon).toHaveAttribute('aria-label', 'Home icon');
      expect(icon).toHaveAttribute('role', 'img');
    });

    it('should use custom aria-label when provided', () => {
      render(
        <TestWrapper>
          <ThemedIcon icon="home" aria-label="Go to homepage" data-testid="test-icon" />
        </TestWrapper>
      );
      
      const icon = screen.getByTestId('test-icon');
      expect(icon).toHaveAttribute('aria-label', 'Go to homepage');
    });
  });

  describe('Size variants', () => {
    it('should support different size props', () => {
      const { rerender } = render(
        <TestWrapper>
          <ThemedIcon icon="home" size="sm" data-testid="test-icon" />
        </TestWrapper>
      );
      
      let icon = screen.getByTestId('test-icon');
      expect(icon).toBeInTheDocument();
      
      rerender(
        <TestWrapper>
          <ThemedIcon icon="home" size="lg" data-testid="test-icon" />
        </TestWrapper>
      );
      
      icon = screen.getByTestId('test-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Backward compatibility', () => {
    it('should still work with children prop (deprecated)', () => {
      // Suppress console.warn for this test
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      render(
        <TestWrapper>
          <ThemedIcon data-testid="test-icon">home</ThemedIcon>
        </TestWrapper>
      );
      
      const icon = screen.getByTestId('test-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveTextContent('home');
      
      // Restore console.warn
      console.warn = originalWarn;
    });
  });
});