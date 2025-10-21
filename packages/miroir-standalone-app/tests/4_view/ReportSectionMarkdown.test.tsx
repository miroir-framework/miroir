import { describe, it, expect, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from 'react';

import '@testing-library/jest-dom';

import {
  ApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory,
} from "miroir-core";

import { MiroirThemeProvider } from "../../src/miroir-fwk/4_view/contexts/MiroirThemeContext";
import { ReportSectionMarkdown } from "../../src/miroir-fwk/4_view/components/Reports/ReportSectionMarkdown";
import { packageName } from "../../src/constants";
import { cleanLevel } from "../../src/miroir-fwk/4_view/constants";

// Setup logger
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportSectionMarkdown.test")
).then((logger: LoggerInterface) => {log = logger});

// Helper function to render component with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <MiroirThemeProvider>
      {component}
    </MiroirThemeProvider>
  );
};

describe('ReportSectionMarkdown Integration Tests', () => {
  const defaultProps = {
    applicationSection: "data" as ApplicationSection,
    deploymentUuid: "test-deployment-uuid",
    markdownContent: "",
  };

  describe('Task 4.4: Simple Markdown Rendering', () => {
    it('renders simple markdown content with headings, paragraphs, and lists', () => {
      const markdownContent = `# Heading 1
## Heading 2

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2
- List item 3

1. Ordered item 1
2. Ordered item 2
`;

      renderWithTheme(
        <ReportSectionMarkdown
          {...defaultProps}
          markdownContent={markdownContent}
        />
      );

      // Check for heading
      expect(screen.getByText('Heading 1')).toBeInTheDocument();
      expect(screen.getByText('Heading 2')).toBeInTheDocument();
      
      // Check for paragraph content
      expect(screen.getByText(/This is a paragraph/)).toBeInTheDocument();
      
      // Check for list items
      expect(screen.getByText('List item 1')).toBeInTheDocument();
      expect(screen.getByText('List item 2')).toBeInTheDocument();
      expect(screen.getByText('Ordered item 1')).toBeInTheDocument();
    });
  });

  describe('Task 4.5: GFM Features', () => {
    it('renders GitHub Flavored Markdown features (tables, code blocks, strikethrough)', () => {
      const markdownContent = `
## Table Example

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

## Code Block

\`\`\`javascript
function hello() {
  console.log("Hello World");
}
\`\`\`

## Strikethrough

This is ~~strikethrough~~ text.

## Task List

- [x] Completed task
- [ ] Incomplete task
`;

      renderWithTheme(
        <ReportSectionMarkdown
          {...defaultProps}
          markdownContent={markdownContent}
        />
      );

      // Check for table content
      expect(screen.getByText('Column 1')).toBeInTheDocument();
      expect(screen.getByText('Cell 1')).toBeInTheDocument();
      
      // Check for code block
      expect(screen.getByText(/function hello/)).toBeInTheDocument();
      
      // Check for strikethrough
      expect(screen.getByText(/strikethrough/)).toBeInTheDocument();
      
      // Check for task list items
      expect(screen.getByText(/Completed task/)).toBeInTheDocument();
      expect(screen.getByText(/Incomplete task/)).toBeInTheDocument();
    });
  });

  describe('Task 4.6: XSS Prevention', () => {
    it('sanitizes dangerous HTML and script tags', () => {
      const dangerousMarkdown = `
# Safe Heading

<script>alert('XSS')</script>

<img src=x onerror=alert('XSS')>

<iframe src="malicious.com"></iframe>

Normal text content.
`;

      const { container } = renderWithTheme(
        <ReportSectionMarkdown
          {...defaultProps}
          markdownContent={dangerousMarkdown}
        />
      );

      // Check that heading is rendered
      expect(screen.getByText('Safe Heading')).toBeInTheDocument();
      expect(screen.getByText('Normal text content.')).toBeInTheDocument();
      
      // Verify dangerous elements are NOT in the document
      expect(container.querySelector('script')).not.toBeInTheDocument();
      expect(container.querySelector('iframe')).not.toBeInTheDocument();
      
      // Verify img tag with onerror is sanitized (should exist but without onerror)
      const imgs = container.querySelectorAll('img');
      imgs.forEach(img => {
        expect(img.getAttribute('onerror')).toBeNull();
      });
    });
  });

  describe('Task 4.7: Edit Icon with Callback', () => {
    it('displays edit icon when onEdit callback is provided', () => {
      const mockOnEdit = () => {};

      renderWithTheme(
        <ReportSectionMarkdown
          {...defaultProps}
          markdownContent="# Test Content"
          onEdit={mockOnEdit}
        />
      );

      // Look for edit button/icon (it should be present)
      const editButtons = screen.queryAllByRole('button');
      expect(editButtons.length).toBeGreaterThan(0);
      
      // Check for Edit icon via tooltip or aria-label
      const editButton = editButtons.find(btn => 
        btn.getAttribute('aria-label')?.includes('Edit') ||
        btn.title?.includes('Edit')
      );
      expect(editButton).toBeTruthy();
    });

    it('edit icon is clickable when onEdit callback provided', () => {
      let clicked = false;
      const mockOnEdit = () => { clicked = true; };

      renderWithTheme(
        <ReportSectionMarkdown
          {...defaultProps}
          markdownContent="# Test Content"
          onEdit={mockOnEdit}
        />
      );

      const editButtons = screen.queryAllByRole('button');
      const editButton = editButtons.find(btn => 
        btn.getAttribute('aria-label')?.includes('Edit') ||
        btn.title?.includes('Edit')
      );
      
      if (editButton) {
        fireEvent.click(editButton);
        expect(clicked).toBe(true);
      }
    });
  });

  describe('Task 4.8: No Edit Icon in Read-Only Mode', () => {
    it('does not display edit icon when onEdit callback is omitted', () => {
      renderWithTheme(
        <ReportSectionMarkdown
          {...defaultProps}
          markdownContent="# Test Content"
          // No onEdit prop
        />
      );

      // Check that no edit button is present
      const buttons = screen.queryAllByRole('button');
      const editButton = buttons.find(btn => 
        btn.getAttribute('aria-label')?.includes('Edit') ||
        btn.title?.includes('Edit')
      );
      expect(editButton).toBeUndefined();
    });
  });

  describe('Task 4.9: Optional Label Display', () => {
    it('displays optional label when provided', () => {
      const labelText = "My Markdown Section Label";

      renderWithTheme(
        <ReportSectionMarkdown
          {...defaultProps}
          markdownContent="# Content"
          label={labelText}
        />
      );

      expect(screen.getByText(labelText)).toBeInTheDocument();
    });

    it('does not display label when not provided', () => {
      const { container } = renderWithTheme(
        <ReportSectionMarkdown
          {...defaultProps}
          markdownContent="# Content"
          // No label prop
        />
      );

      // The content heading should be present
      expect(screen.getByText('Content')).toBeInTheDocument();
      
      // But there should be no separate label element
      // This is a bit tricky to test directly, but we can verify
      // that there's no extra heading or label element
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      // Should only have the one heading from markdown content
      expect(headings.length).toBe(1);
    });
  });

  describe('Additional Edge Cases', () => {
    it('handles empty markdown content gracefully', () => {
      const { container } = renderWithTheme(
        <ReportSectionMarkdown
          {...defaultProps}
          markdownContent=""
        />
      );

      // Should render without errors
      expect(container).toBeInTheDocument();
    });

    it('handles very long markdown content', () => {
      const longContent = Array(100).fill("This is line of content.\n\n").join('');

      const { container } = renderWithTheme(
        <ReportSectionMarkdown
          {...defaultProps}
          markdownContent={longContent}
        />
      );

      // Should render without errors
      expect(container).toBeInTheDocument();
      const matches = screen.getAllByText(/This is line of content/);
      expect(matches.length).toBeGreaterThan(0);
    });

    it('handles markdown with inline HTML (should be sanitized)', () => {
      const markdownWithHTML = `
# Title

<div style="color: red;">This is HTML content</div>

Normal **markdown** content.
`;

      renderWithTheme(
        <ReportSectionMarkdown
          {...defaultProps}
          markdownContent={markdownWithHTML}
        />
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText(/Normal/)).toBeInTheDocument();
      expect(screen.getByText(/markdown/)).toBeInTheDocument();
    });
  });
});
