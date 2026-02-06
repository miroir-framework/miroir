import React, { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

import {
  alterObjectAtPath2,
  alterObjectAtPathWithCreate,
  ApplicationSection,
  defaultMiroirModelEnvironment,
  getApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory,
  resolvePathOnObject,
  setValueAtPath,
  Uuid,
  type ApplicationDeploymentMap,
} from "miroir-core";

import { DraggableContainer } from '../DraggableContainer.js';
import {
  ThemedButton,
  ThemedBox,
  ThemedText,
  ThemedSpan,
} from '../Themes/index.js';
import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { useMiroirTheme } from '../../contexts/MiroirThemeContext.js';
import { useFormikContext } from 'formik';
import type { MarkdownReportSection } from 'miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js';
import { useDomainControllerService, useMiroirContextService } from '../../MiroirContextReactProvider.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MarkdownEditorModal"), "UI",
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export interface MarkdownEditorModalProps {
  reportName: string,
  formikValuePath: ( string | number )[],
  reportSectionPath?: ( string | number )[],
  formikReportDefinitionPathString?: string;

  // 
  isOpen: boolean;
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  deploymentUuid: Uuid;
  applicationSection: ApplicationSection;
}

// ################################################################################################
// Markdown Help Content
// ################################################################################################
const MARKDOWN_HELP = `
**Headings:** # H1, ## H2, ### H3
**Bold:** **text** or __text__
**Italic:** *text* or _text_
**Strikethrough:** ~~text~~
**Links:** [text](url)
**Images:** ![alt text](url)
**Blockquote:** > quote
**Horizontal Rule:** ---
**Lists:** - item or 1. item
**Code:** \`inline\` or \`\`\`block\`\`\`
**Tables:** | col1 | col2 |
**Task List:** - [ ] todo - [x] done
`;

// ################################################################################################
export const MarkdownEditorModal: React.FC<MarkdownEditorModalProps> = (props) => {
  const { currentTheme } = useMiroirTheme();
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const { serverBaseUrl } = useMiroirContextService();

  const domainController = useDomainControllerService(); 

  // formik context
  const formikContext = useFormikContext<any>();
  const formikValuePathAsString = props.formikValuePath?.join("_") || "";
  
  const formikReportSectionDefinitionPathString = [props.reportName, ...props.reportSectionPath || [], "definition"].join(".");

  const reportDefinitionFromFormik = useMemo(() => {
    return formikContext.values[props.reportName];
  }, [formikContext.values, props.formikReportDefinitionPathString]);
  
  const reportSectionDefinitionFromFormik = useMemo(() => {
    if (reportDefinitionFromFormik && props.reportSectionPath) {
      return resolvePathOnObject(
        reportDefinitionFromFormik,
        props.reportSectionPath
      ) as MarkdownReportSection;
    }
    return undefined;
  }, [reportDefinitionFromFormik, props.reportSectionPath]);
  
  log.info("MarkdownEditorModal render", "isOpen", props.isOpen, "initialContent length", props.initialContent.length);
  
  // local state for edited content. TODO: is it necessary to have local state here? Why not use the formik context directly?
  const [editedContent, setEditedContent] = useState<string>(props.initialContent);

  // Reset edited content when modal opens/closes or initial content changes
  useMemo(() => {
    if (props.isOpen) {
      setEditedContent(props.initialContent);
    }
  }, [props.isOpen, props.initialContent]);

  const handleTextareaChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(event.target.value);
  }, []);

  const handleSave = useCallback(async () => {
    // props.onSave(editedContent);
    // formikContext.setFieldValue(
    const newReportDefinition = alterObjectAtPath2( // does a deep clone
      reportDefinitionFromFormik,
      // ["definition", "section", "definition", 0, "definition", "content"].join("."),
      ["definition", "section", "definition", 0, "definition", "content"], // TODO: not always the right path!!!
      editedContent
    );
    // const newReportDefinition = {
    //   ...reportDefinitionFromFormik,
    //   definition:{
    //     ...reportDefinitionFromFormik?.definition,
    //     section: {
    //       ...reportDefinitionFromFormik?.definition.section,
    //       definition : [
    //         {
    //           "type": "markdownReportSection",
    //           "definition": {
    //             "label": "Toto",
    //             "content": editedContent,
    //           }
    //         },
    //         reportDefinitionFromFormik?.definition.section.definition[1]
    //       ],
    //     }
    //   }
    // };
    const applicationSection = getApplicationSection(props.application, newReportDefinition.parentUuid)
    log.info("MarkdownEditorModal handleSave", 
      "reportDefinitionFromFormik", reportDefinitionFromFormik,
      // "reportSectionDefinitionFromFormik", reportSectionDefinitionFromFormik,
      "content length", editedContent.length,
      "editedContent", JSON.stringify(editedContent),
      "applicationSection", applicationSection,
      "newReportDefinition", newReportDefinition,
    );

    await domainController.handleActionFromUI(
      {
        actionType: "transactionalInstanceAction",
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        payload: {
          application: props.application,
          instanceAction: {
            actionType: "updateInstance",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              application: props.application,
              applicationSection: applicationSection,
              parentUuid: newReportDefinition.parentUuid,
              objects: [
                {
                  parentName: newReportDefinition.name,
                  parentUuid: newReportDefinition.parentUuid,
                  applicationSection: applicationSection,
                  instances: [newReportDefinition],
                },
              ],
            },
          },
        },
      },
      props.applicationDeploymentMap,
      defaultMiroirModelEnvironment // TODO: use correct model environment
    );
    props.onSave(editedContent);
  }, [editedContent, props]);

  const handleCancel = useCallback(() => {
    log.info("MarkdownEditorModal handleCancel");
    setEditedContent(props.initialContent); // Reset to initial
    props.onCancel();
  }, [props]);

  const toggleHelp = useCallback(() => {
    setShowHelp(prev => !prev);
  }, []);

  if (!props.isOpen) {
    return null;
  }

  return (
    <DraggableContainer
      title="Edit Markdown"
      onClose={handleCancel}
      defaultSize={{ width: 900, height: 600 }}
      storageKey="markdownEditorModal"
    >
      <ThemedBox
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: currentTheme.spacing.md,
          gap: currentTheme.spacing.sm,
        }}
      >
        {/* Help Toggle and Link */}
        <ThemedBox
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: currentTheme.spacing.xs,
          }}
        >
          <ThemedText style={{ fontSize: currentTheme.typography.fontSize.sm, opacity: 0.7 }}>
            Edit your markdown content below. Changes preview in real-time.
          </ThemedText>
          <ThemedSpan
            onClick={toggleHelp}
            style={{
              cursor: 'pointer',
              fontSize: currentTheme.typography.fontSize.sm,
              textDecoration: 'underline',
              color: currentTheme.colors.primary,
            }}
          >
            {showHelp ? 'Hide Help' : 'Show Markdown Help'}
          </ThemedSpan>
        </ThemedBox>

        {/* Help Section */}
        {showHelp && (
          <ThemedBox
            style={{
              padding: currentTheme.spacing.sm,
              backgroundColor: currentTheme.colors.surfaceVariant,
              borderRadius: currentTheme.borderRadius.sm,
              fontSize: currentTheme.typography.fontSize.sm,
              marginBottom: currentTheme.spacing.sm,
              maxHeight: '150px',
              overflow: 'auto',
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {MARKDOWN_HELP}
            </pre>
          </ThemedBox>
        )}

        {/* Two-Panel Layout */}
        <ThemedBox
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: currentTheme.spacing.md,
            flex: 1,
            minHeight: 0, // Important for proper flex behavior
          }}
        >
          {/* Left Panel: Textarea Editor */}
          <ThemedBox
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: currentTheme.spacing.xs,
              minHeight: 0,
            }}
          >
            <ThemedText
              style={{
                fontWeight: 'bold',
                fontSize: currentTheme.typography.fontSize.md,
              }}
            >
              Editor
            </ThemedText>
            <textarea
              value={editedContent}
              onChange={handleTextareaChange}
              style={{
                flex: 1,
                fontFamily: 'monospace',
                fontSize: currentTheme.typography.fontSize.md,
                padding: currentTheme.spacing.sm,
                border: `1px solid ${currentTheme.colors.border}`,
                borderRadius: currentTheme.borderRadius.sm,
                backgroundColor: currentTheme.colors.backgroundPaper,
                color: currentTheme.colors.text,
                resize: 'none',
                minHeight: '300px',
              }}
              placeholder="Enter your markdown content here..."
              aria-label="Markdown content editor"
            />
          </ThemedBox>

          {/* Right Panel: Live Preview */}
          <ThemedBox
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: currentTheme.spacing.xs,
              minHeight: 0,
            }}
          >
            <ThemedText
              style={{
                fontWeight: 'bold',
                fontSize: currentTheme.typography.fontSize.md,
              }}
            >
              Preview
            </ThemedText>
            <ThemedBox
              style={{
                flex: 1,
                padding: currentTheme.spacing.sm,
                border: `1px solid ${currentTheme.colors.border}`,
                borderRadius: currentTheme.borderRadius.sm,
                backgroundColor: currentTheme.colors.backgroundPaper,
                overflow: 'auto',
                minHeight: '300px',
              }}
            >
              <div className="markdown-content" style={{ lineHeight: 1.6 }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                  components={{
                    // Transform relative image URLs to use the server base URL from config
                    img: ({node, src, alt, ...props}) => {
                      const resolvedSrc = src?.startsWith('/') ? `${serverBaseUrl}${src}` : src;
                      return <img src={resolvedSrc} alt={alt} {...props} />;
                    }
                  }}
                >
                  {editedContent || '*No content to preview*'}
                </ReactMarkdown>
              </div>

              {/* Inline styles for markdown elements */}
              <style>{`
                .markdown-content h1 { font-size: 2em; margin: 0.67em 0; font-weight: bold; }
                .markdown-content h2 { font-size: 1.5em; margin: 0.75em 0; font-weight: bold; }
                .markdown-content h3 { font-size: 1.17em; margin: 0.83em 0; font-weight: bold; }
                .markdown-content h4 { font-size: 1em; margin: 1em 0; font-weight: bold; }
                .markdown-content h5 { font-size: 0.83em; margin: 1.17em 0; font-weight: bold; }
                .markdown-content h6 { font-size: 0.67em; margin: 1.33em 0; font-weight: bold; }
                .markdown-content p { margin: 1em 0; }
                .markdown-content ul, .markdown-content ol { margin: 1em 0; padding-left: 2em; }
                .markdown-content li { margin: 0.5em 0; }
                .markdown-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                .markdown-content th, .markdown-content td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .markdown-content th { background-color: rgba(0, 0, 0, 0.05); font-weight: bold; }
                .markdown-content code { background-color: rgba(0, 0, 0, 0.05); padding: 2px 6px; border-radius: 3px; font-family: monospace; }
                .markdown-content pre { background-color: rgba(0, 0, 0, 0.05); padding: 1em; border-radius: 5px; overflow-x: auto; }
                .markdown-content pre code { background: none; padding: 0; }
                .markdown-content blockquote { border-left: 4px solid #ddd; margin: 1em 0; padding-left: 1em; color: #666; }
                .markdown-content hr { border: none; border-top: 1px solid #ddd; margin: 2em 0; }
                .markdown-content a { color: #0066cc; text-decoration: underline; }
                .markdown-content img { max-width: 100%; height: auto; }
              `}</style>
            </ThemedBox>
          </ThemedBox>
        </ThemedBox>

        {/* Footer with Buttons */}
        <ThemedBox
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: currentTheme.spacing.sm,
            marginTop: currentTheme.spacing.md,
            paddingTop: currentTheme.spacing.sm,
            borderTop: `1px solid ${currentTheme.colors.divider}`,
          }}
        >
          <ThemedButton
            onClick={handleCancel}
            variant="secondary"
            style={{
              minWidth: '100px',
            }}
          >
            Cancel
          </ThemedButton>
          <ThemedButton
            onClick={handleSave}
            variant="primary"
            style={{
              minWidth: '100px',
            }}
          >
            Save
          </ThemedButton>
        </ThemedBox>
      </ThemedBox>
    </DraggableContainer>
  );
};
