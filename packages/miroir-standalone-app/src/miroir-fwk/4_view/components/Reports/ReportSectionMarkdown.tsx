import { useMemo, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Edit as EditIcon } from '@mui/icons-material';

import {
  ApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory,
  Uuid,
} from "miroir-core";

import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { useRenderTracker } from '../../tools/renderCountTracker.js';
import { RenderPerformanceMetrics } from '../../tools/renderPerformanceMeasure.js';
import {
  ThemedBox,
  ThemedContainer,
  ThemedIconButton,
  ThemedText,
  ThemedTitle,
  ThemedTooltip,
} from "../Themes/index";
import { MarkdownEditorModal } from './MarkdownEditorModal.js';
import type { MarkdownReportSection } from 'miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportSectionMarkdown"), "UI",
).then((logger: LoggerInterface) => {log = logger});

export interface ReportSectionMarkdownProps {
  applicationSection: ApplicationSection;
  deploymentUuid: Uuid;
  // markdownContent: string;
  reportSection: MarkdownReportSection;
  label?: string;
  onEdit?: () => void;
  onSave?: (newContent: string) => void;
  showPerformanceDisplay?: boolean;
}

export const ReportSectionMarkdown = (props: ReportSectionMarkdownProps) => {
  const renderStartTime = performance.now();
  
  // Modal state management
  const [isEditorOpen, setIsEditorOpen] = useState(false);
          // markdownContent={
          //   props.reportSection.definition.content
          //   // props.reportSection.definition.fetchedDataReference
          //   //   ? props.reportData.reportData[props.reportSection.definition.fetchedDataReference] ?? props.reportSection.definition.content ?? ""
          //   //   : props.reportSection.definition.content ?? ""
          // }
  const [currentContent, setCurrentContent] = useState(props.reportSection.definition.content || "");
  
  // Get navigation key for render tracking
  const navigationKey = `${props.deploymentUuid}-${props.applicationSection}`;
  
  // Track render count for performance monitoring
  const { navigationCount, totalCount } = useRenderTracker(
    "ReportSectionMarkdown",
    navigationKey
  );
  
  log.debug(
    () => "ReportSectionMarkdown render",
    navigationCount,
    "props:",
    props
  );

  // Handle opening the editor
  const handleEdit = useCallback(() => {
    log.info("ReportSectionMarkdown handleEdit");
    setIsEditorOpen(true);
    if (props.onEdit) {
      props.onEdit();
    }
  }, [props]);

  // Handle saving edited content
  const handleSave = useCallback((newContent: string) => {
    log.info("ReportSectionMarkdown handleSave", "new content length", newContent.length);
    setCurrentContent(newContent);
    setIsEditorOpen(false);
    if (props.onSave) {
      props.onSave(newContent);
    }
  }, [props]);

  // Handle canceling edit
  const handleCancel = useCallback(() => {
    log.info("ReportSectionMarkdown handleCancel");
    setIsEditorOpen(false);
  }, []);

  // Memoize the markdown content to avoid unnecessary re-renders
  const sanitizedMarkdown = useMemo(() => {
    return currentContent || "";
  }, [currentContent]);

  const renderEndTime = performance.now();
  const renderDuration = renderEndTime - renderStartTime;
  
  // Track performance
  const componentKey = `ReportSectionMarkdown-${props.deploymentUuid}`;
  RenderPerformanceMetrics.trackRenderPerformance(componentKey, renderDuration);

  return (
    <>
      <ThemedContainer
        style={{
          // position: 'relative',
          padding: '2em',
          marginBottom: '16px',
        }}
      >
        <span>ReportSectionMarkdown! {JSON.stringify(currentContent)}</span>
      {/* Performance display (optional) */}
      {props.showPerformanceDisplay && (
        <ThemedText>
          ReportSectionMarkdown renders: {navigationCount} (total: {totalCount})
        </ThemedText>
      )}
      
      {/* Optional label at the top */}
      {props.label && (
        <ThemedTitle 
          variant="h6" 
          style={{ marginBottom: '16px' }}
        >
          {props.label}
        </ThemedTitle>
      )}

      {/* Edit button in top-right corner if onEdit or onSave callback provided */}
      {(props.onEdit || props.onSave) && (
        <ThemedTooltip title="Edit Markdown">
          <ThemedIconButton
            onClick={handleEdit}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              zIndex: 1,
            }}
            aria-label="Edit Markdown"
          >
            <EditIcon fontSize="small" />
          </ThemedIconButton>
        </ThemedTooltip>
      )}

      {/* Markdown content rendering with sanitization */}
      <ThemedBox
        style={{
          padding: '8px',
        }}
      >
        <div
          style={{
            lineHeight: '1.6',
          }}
          className="markdown-content"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
          >
            {sanitizedMarkdown}
          </ReactMarkdown>
        </div>
      </ThemedBox>

      <style>{`
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          margin-top: 16px;
          margin-bottom: 8px;
        }
        
        .markdown-content p {
          margin-bottom: 8px;
        }
        
        .markdown-content ul,
        .markdown-content ol {
          padding-left: 24px;
          margin-bottom: 8px;
        }
        
        .markdown-content li {
          margin-bottom: 4px;
        }
        
        .markdown-content table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 16px;
        }
        
        .markdown-content th,
        .markdown-content td {
          border: 1px solid #ddd;
          padding: 8px;
        }
        
        .markdown-content th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        .markdown-content code {
          background-color: #f5f5f5;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 0.9em;
        }
        
        .markdown-content pre {
          background-color: #f5f5f5;
          padding: 16px;
          border-radius: 3px;
          overflow: auto;
          margin-bottom: 16px;
        }
        
        .markdown-content pre code {
          background-color: transparent;
          padding: 0;
        }
        
        .markdown-content blockquote {
          border-left: 4px solid #1976d2;
          padding-left: 16px;
          margin-left: 0;
          margin-bottom: 16px;
          font-style: italic;
        }
        
        .markdown-content hr {
          border: none;
          border-top: 1px solid #ddd;
          margin: 16px 0;
        }
        
        .markdown-content a {
          color: #1976d2;
          text-decoration: underline;
        }
        
        .markdown-content img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
      </ThemedContainer>

      {/* Markdown Editor Modal */}
      <MarkdownEditorModal
        isOpen={isEditorOpen}
        initialContent={currentContent}
        onSave={handleSave}
        onCancel={handleCancel}
        deploymentUuid={props.deploymentUuid}
        applicationSection={props.applicationSection}
      />
    </>
  );
};
