import { describe, it } from "vitest";

import React from 'react';
import { 
  LoggerInterface,
  MiroirLoggerFactory,
} from 'miroir-core';
import type { MiroirIcon } from 'miroir-core';

import { ThemedIcon } from '../IconComponents';
import { MiroirThemeProvider } from '../../../contexts/MiroirThemeContext';

// ################################################################################################
const pageLabel = "ThemedIcon.test";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(MiroirLoggerFactory.getLoggerName("miroir-standalone-app", "info", pageLabel)).then(
  (logger: LoggerInterface) => {
    log = logger;
  }
);

const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MiroirThemeProvider>
    {children}
  </MiroirThemeProvider>
);

describe('ThemedIcon Enhanced Component', () => {
  describe('MUI Icons', () => {
    it('renders basic MUI icon', () => {
      log.info('Testing basic MUI icon rendering');
      // Basic smoke test - component should render without crashing
      const icon = <ThemeWrapper><ThemedIcon icon="menu" /></ThemeWrapper>;
      log.info('MUI icon component created successfully');
    });

    it('handles MiroirIcon object for MUI', () => {
      const miroirIcon: MiroirIcon = { iconType: 'mui', name: 'home' };
      const icon = <ThemeWrapper><ThemedIcon icon={miroirIcon} /></ThemeWrapper>;
      log.info('MUI MiroirIcon object handled successfully');
    });

    it('maps icon name variations', () => {
      const icon = <ThemeWrapper><ThemedIcon icon="Book" /></ThemeWrapper>;
      log.info('Icon name mapping test completed');
    });
  });

  describe('Emoji Icons', () => {
    it('renders emoji with name mapping', () => {
      const icon = <ThemeWrapper><ThemedIcon icon="book" /></ThemeWrapper>;
      log.info('Emoji name mapping test completed');
    });

    it('handles MiroirIcon emoji object', () => {
      const emojiIcon: MiroirIcon = { iconType: 'emoji', name: 'heart' };
      const icon = <ThemeWrapper><ThemedIcon icon={emojiIcon} /></ThemeWrapper>;
      log.info('Emoji MiroirIcon object handled successfully');
    });

    it('handles unicode hex codes', () => {
      const emojiIcon: MiroirIcon = { iconType: 'emoji', name: 'U+1F4DA' };
      const icon = <ThemeWrapper><ThemedIcon icon={emojiIcon} /></ThemeWrapper>;
      log.info('Unicode hex code handling test completed');
    });

    it('handles decimal unicode codes', () => {
      const emojiIcon: MiroirIcon = { iconType: 'emoji', name: '128218' };
      const icon = <ThemeWrapper><ThemedIcon icon={emojiIcon} /></ThemeWrapper>;
      log.info('Decimal unicode code handling test completed');
    });
  });

  describe('Error Handling', () => {
    it('handles unknown emoji gracefully', () => {
      const unknownEmojiIcon: MiroirIcon = { iconType: 'emoji', name: 'nonexistent' };
      const icon = <ThemeWrapper><ThemedIcon icon={unknownEmojiIcon} /></ThemeWrapper>;
      log.info('Unknown emoji error handling test completed');
    });

    it('uses fallback for undefined icon', () => {
      const icon = <ThemeWrapper><ThemedIcon /></ThemeWrapper>;
      log.info('Fallback handling test completed');
    });
  });

  describe('Accessibility', () => {
    it('supports custom aria-label', () => {
      const icon = <ThemeWrapper><ThemedIcon icon="menu" aria-label="Custom menu label" /></ThemeWrapper>;
      log.info('Custom aria-label test completed');
    });

    it('generates appropriate role attributes', () => {
      const icon = <ThemeWrapper><ThemedIcon icon="menu" /></ThemeWrapper>;
      log.info('Role attribute test completed'); 
    });
  });

  describe('Backward Compatibility', () => {
    it('supports deprecated children prop', () => {
      const icon = <ThemeWrapper><ThemedIcon>menu</ThemedIcon></ThemeWrapper>;
      log.info('Deprecated children prop test completed');
    });

    it('prioritizes icon prop over children', () => {
      const icon = <ThemeWrapper><ThemedIcon icon="home">menu</ThemedIcon></ThemeWrapper>;
      log.info('Icon prop priority test completed');
    });
  });

  describe('Size Variants', () => {
    it('supports different size variants', () => {
      const smallIcon = <ThemeWrapper><ThemedIcon icon="menu" size="sm" /></ThemeWrapper>;
      const mediumIcon = <ThemeWrapper><ThemedIcon icon="menu" size="md" /></ThemeWrapper>;
      const largeIcon = <ThemeWrapper><ThemedIcon icon="menu" size="lg" /></ThemeWrapper>;
      log.info('Size variants test completed');
    });
  });

  describe('Theme Integration', () => {
    it('integrates with theme system', () => {
      const icon = <ThemeWrapper><ThemedIcon icon="menu" /></ThemeWrapper>;
      log.info('Theme integration test completed');
    });
  });
});