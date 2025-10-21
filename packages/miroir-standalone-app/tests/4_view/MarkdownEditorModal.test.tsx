import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarkdownEditorModal } from '../../src/miroir-fwk/4_view/components/Reports/MarkdownEditorModal.js';

describe('MarkdownEditorModal Integration Tests', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();
  const defaultProps = {
    deploymentUuid: 'test-deployment-uuid' as any,
    applicationSection: 'data' as any,
    isOpen: false,
    initialContent: '# Test Content\n\nThis is a test.',
    onSave: mockOnSave,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    mockOnSave.mockClear();
    mockOnCancel.mockClear();
  });

  // Task 6.3: Test modal opening and visibility
  describe('Task 6.3: Modal Visibility', () => {
    it('does not render modal content when isOpen is false', () => {
      render(<MarkdownEditorModal {...defaultProps} isOpen={false} />);
      
      // Modal should not be in the document
      const modal = screen.queryByText('Edit Markdown');
      expect(modal).toBeNull();
    });

    it('renders modal content when isOpen is true', () => {
      render(<MarkdownEditorModal {...defaultProps} isOpen={true} />);
      
      // Check that DraggableContainer title is rendered
      const modalTitle = screen.getByText('Edit Markdown');
      expect(modalTitle).toBeTruthy();
      
      // Check for Save and Cancel buttons
      const saveButton = screen.getByRole('button', { name: /save/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(saveButton).toBeTruthy();
      expect(cancelButton).toBeTruthy();
    });
  });

  // Task 6.4: Test live preview functionality
  describe('Task 6.4: Live Preview', () => {
    it('displays initial content in textarea', () => {
      const initialContent = '# Hello World\n\nThis is **bold** text.';
      render(<MarkdownEditorModal {...defaultProps} isOpen={true} initialContent={initialContent} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe(initialContent);
    });

    it('updates preview panel in real-time when textarea changes', async () => {
      render(<MarkdownEditorModal {...defaultProps} isOpen={true} initialContent='# Initial' />);
      
      const textarea = screen.getByRole('textbox');
      
      // Change the content
      fireEvent.change(textarea, { target: { value: '# New Heading\n\n**Bold text**' } });
      
      // Wait for preview to update
      await waitFor(() => {
        // Check that preview contains the rendered markdown
        const heading = screen.getByText('New Heading');
        expect(heading).toBeTruthy();
        expect(heading.tagName).toBe('H1');
      });
      
      // Check for bold text in preview
      const boldText = screen.getByText('Bold text');
      expect(boldText).toBeTruthy();
      expect(boldText.tagName).toBe('STRONG');
    });

    it('renders GFM features in preview (tables, code blocks)', async () => {
      const markdownWithTable = `
| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |

\`\`\`javascript
const x = 10;
\`\`\`
`;
      render(<MarkdownEditorModal {...defaultProps} isOpen={true} initialContent='' />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: markdownWithTable } });
      
      await waitFor(() => {
        // Check for table
        const table = screen.getByRole('table');
        expect(table).toBeTruthy();
        
        // Check for code block - use getAllByText since it appears in both textarea and preview
        const codeBlocks = screen.getAllByText(/const x = 10/);
        expect(codeBlocks.length).toBeGreaterThan(0);
        // Verify it's in a code element in the preview
        const codeElement = codeBlocks.find((el) => el.tagName === 'CODE');
        expect(codeElement).toBeTruthy();
      });
    });
  });

  // Task 6.5: Test Save button functionality
  describe('Task 6.5: Save Button', () => {
    it('calls onSave with edited content when Save is clicked', async () => {
      render(<MarkdownEditorModal {...defaultProps} isOpen={true} initialContent='# Initial' />);
      
      const textarea = screen.getByRole('textbox');
      const newContent = '# Updated Content\n\nThis is new text.';
      
      fireEvent.change(textarea, { target: { value: newContent } });
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
        expect(mockOnSave).toHaveBeenCalledWith(newContent);
      });
    });

    it('calls onSave with original content if not edited', () => {
      const initialContent = '# Original';
      render(<MarkdownEditorModal {...defaultProps} isOpen={true} initialContent={initialContent} />);
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith(initialContent);
    });
  });

  // Task 6.6: Test Cancel button functionality
  describe('Task 6.6: Cancel Button', () => {
    it('calls onCancel when Cancel button is clicked', () => {
      render(<MarkdownEditorModal {...defaultProps} isOpen={true} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel without saving edits', () => {
      render(<MarkdownEditorModal {...defaultProps} isOpen={true} initialContent='# Initial' />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '# Edited but not saved' } });
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  // Task 6.8: Test initialContent persistence
  describe('Task 6.8: InitialContent Persistence', () => {
    it('loads initialContent into textarea when modal opens', () => {
      const initialContent = '# My Title\n\nSome content here.';
      render(<MarkdownEditorModal {...defaultProps} isOpen={true} initialContent={initialContent} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe(initialContent);
    });

    it('resets to new initialContent when prop changes', () => {
      const { rerender } = render(
        <MarkdownEditorModal {...defaultProps} isOpen={true} initialContent='# First' />
      );
      
      let textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('# First');
      
      // Change initial content prop
      rerender(
        <MarkdownEditorModal {...defaultProps} isOpen={true} initialContent='# Second' />
      );
      
      textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('# Second');
    });
  });

  // Task 6.9: Test markdown styling in preview
  describe('Task 6.9: Markdown Styling', () => {
    it('applies inline CSS styles to headings in preview', async () => {
      const markdownWithHeadings = '# H1\n## H2\n### H3';
      render(<MarkdownEditorModal {...defaultProps} isOpen={true} initialContent='' />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: markdownWithHeadings } });
      
      await waitFor(() => {
        const h1 = screen.getByText('H1');
        const h2 = screen.getByText('H2');
        const h3 = screen.getByText('H3');
        
        expect(h1.tagName).toBe('H1');
        expect(h2.tagName).toBe('H2');
        expect(h3.tagName).toBe('H3');
      });
    });

    it('renders code blocks with proper styling', async () => {
      const markdownWithCode = '`inline code` and\n\n```\ncode block\n```';
      render(<MarkdownEditorModal {...defaultProps} isOpen={true} initialContent='' />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: markdownWithCode } });
      
      await waitFor(() => {
        const inlineCode = screen.getByText('inline code');
        expect(inlineCode.tagName).toBe('CODE');
        
        const codeBlock = screen.getByText('code block');
        expect(codeBlock).toBeTruthy();
      });
    });
  });

  // Task 6.10: Test Markdown Help toggle
  describe('Task 6.10: Markdown Help Toggle', () => {
    it('shows help section when "Show Markdown Help" is clicked', async () => {
      render(<MarkdownEditorModal {...defaultProps} isOpen={true} />);
      
      // Initially, help content should not be visible
      let helpContent = screen.queryByText(/Headings:/);
      expect(helpContent).toBeNull();
      
      // Click the toggle link
      const toggleLink = screen.getByText(/Show Markdown Help/);
      fireEvent.click(toggleLink);
      
      // Help content should now be visible
      await waitFor(() => {
        helpContent = screen.getByText(/Headings:/);
        expect(helpContent).toBeTruthy();
      });
    });

    it('hides help section when "Hide Markdown Help" is clicked', async () => {
      render(<MarkdownEditorModal {...defaultProps} isOpen={true} />);
      
      // Show help first
      const showLink = screen.getByText(/Show Markdown Help/);
      fireEvent.click(showLink);
      
      await waitFor(() => {
        const helpContent = screen.getByText(/Headings:/);
        expect(helpContent).toBeTruthy();
      });
      
      // Click to hide
      const hideLink = screen.getByText(/Hide Help/);
      fireEvent.click(hideLink);
      
      await waitFor(() => {
        const helpContent = screen.queryByText(/Headings:/);
        expect(helpContent).toBeNull();
      });
    });

    it('displays MARKDOWN_HELP constant content', async () => {
      render(<MarkdownEditorModal {...defaultProps} isOpen={true} />);
      
      const toggleLink = screen.getByText(/Show Markdown Help/);
      fireEvent.click(toggleLink);
      
      await waitFor(() => {
        // Check for various help content
        expect(screen.getByText(/Headings:/)).toBeTruthy();
        expect(screen.getByText(/Bold:/)).toBeTruthy();
        expect(screen.getByText(/Italic:/)).toBeTruthy();
        expect(screen.getByText(/Lists:/)).toBeTruthy();
        expect(screen.getByText(/Links:/)).toBeTruthy();
        expect(screen.getByText(/Code:/)).toBeTruthy();
      });
    });
  });

  // Additional edge cases
  describe('Additional Edge Cases', () => {
    it('handles empty initial content', () => {
      render(<MarkdownEditorModal {...defaultProps} isOpen={true} initialContent='' />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });

    it('handles very long content without crashing', () => {
      const longContent = '# Line\n\n'.repeat(1000);
      render(<MarkdownEditorModal {...defaultProps} isOpen={true} initialContent={longContent} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe(longContent);
    });

    it('sanitizes dangerous HTML in preview', async () => {
      const dangerousMarkdown = '# Safe\n\n<script>alert("XSS")</script>';
      render(<MarkdownEditorModal {...defaultProps} isOpen={true} initialContent='' />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: dangerousMarkdown } });
      
      await waitFor(() => {
        // Safe content should render in preview
        const safeHeading = screen.getByText('Safe');
        expect(safeHeading).toBeTruthy();
        expect(safeHeading.tagName).toBe('H1');
        
        // Verify that rehypeSanitize removed the script tag
        // There should be no <script> elements in the DOM
        const scripts = document.querySelectorAll('script');
        // Filter out any test framework scripts, look for user-provided scripts
        const userScripts = Array.from(scripts).filter(s => s.textContent?.includes('alert("XSS")'));
        expect(userScripts.length).toBe(0);
      });
    });
  });
});
