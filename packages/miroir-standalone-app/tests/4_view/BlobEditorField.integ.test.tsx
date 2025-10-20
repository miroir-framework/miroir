import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import { Formik } from "formik";
import React from "react";

import {
  LoggerInterface,
  MiroirLoggerFactory,
} from "miroir-core";

import { BlobEditorField, BlobEditorFieldProps } from "../../src/miroir-fwk/4_view/components/ValueObjectEditor/BlobEditorField";
import { MiroirThemeProvider } from "../../src/miroir-fwk/4_view/contexts/MiroirThemeContext";
import { cleanLevel } from "../3_controllers/constants";

// ################################################################################################
const pageLabel = "BlobEditorField.integ.test";
const packageName = "miroir-standalone-app";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, pageLabel)
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// Mock Data
// ################################################################################################

const mockBlobWithImage = {
  filename: "test-image.png",
  contents: {
    encoding: "base64",
    mimeType: "image/png",
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", // 1x1 red pixel
  },
};

const mockBlobWithPdf = {
  filename: "document.pdf",
  contents: {
    encoding: "base64",
    mimeType: "application/pdf",
    data: "JVBERi0xLjQKJeLjz9MKCg==", // minimal PDF header
  },
};

const mockEmptyBlob = {
  filename: undefined,
  contents: undefined,
};

const mockInvalidBlob = {
  filename: "broken.txt",
  contents: {
    encoding: "invalid-encoding",
    mimeType: undefined,
    data: undefined,
  },
};

const mockBlobInvalidEncoding = {
  filename: "test.txt",
  contents: {
    encoding: "invalid-encoding",
    mimeType: "text/plain",
    data: "SGVsbG8gV29ybGQ=",
  },
};

const mockBlobMissingMimeType = {
  filename: "test.txt",
  contents: {
    encoding: "base64",
    mimeType: undefined,
    data: "SGVsbG8gV29ybGQ=",
  },
};

const mockBlobMissingData = {
  filename: "test.txt",
  contents: {
    encoding: "base64",
    mimeType: "text/plain",
    data: undefined,
  },
};

const mockBlobEmptyData = {
  filename: "test.txt",
  contents: {
    encoding: "base64",
    mimeType: "text/plain",
    data: "",
  },
};

const mockBlobMissingEncoding = {
  filename: "test.txt",
  contents: {
    encoding: undefined,
    mimeType: "text/plain",
    data: "SGVsbG8gV29ybGQ=",
  },
};

// ################################################################################################
// Test Wrapper Component
// ################################################################################################

const TestWrapper: React.FC<{ 
  children: React.ReactNode;
  initialValues?: any;
}> = ({ children, initialValues = {} }) => {
  return (
    <MiroirThemeProvider>
      <Formik
        initialValues={initialValues}
        onSubmit={() => {}}
      >
        {(formik) => (
          <div>
            {React.Children.map(children, child => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child, { formik } as any);
              }
              return child;
            })}
          </div>
        )}
      </Formik>
    </MiroirThemeProvider>
  );
};

// ################################################################################################
// Tests
// ################################################################################################

describe("BlobEditorField - Basic Structure", () => {
  it("should render without crashing with empty blob", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockEmptyBlob,
      readOnly: false,
      allowedMimeTypes: ["image/png", "image/jpeg"],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockEmptyBlob }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/Upload file/i)).toBeInTheDocument();
  });

  it("should render with image blob data", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobWithImage,
      readOnly: false,
      allowedMimeTypes: ["image/png", "image/jpeg"],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobWithImage }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/test-image\.png/i)).toBeInTheDocument();
    expect(screen.getByText(/image\/png/i)).toBeInTheDocument();
  });

  it("should render with PDF blob data", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobWithPdf,
      readOnly: false,
      allowedMimeTypes: ["application/pdf"],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobWithPdf }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/document\.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/application\/pdf/i)).toBeInTheDocument();
  });

  it("should display 'No contents' for empty blob", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockEmptyBlob,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockEmptyBlob }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/Upload file/i)).toBeInTheDocument();
  });

  it("should render in read-only mode", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobWithImage,
      readOnly: true,
      allowedMimeTypes: ["image/png"],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobWithImage }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/test-image\.png/i)).toBeInTheDocument();
  });
});

describe("BlobEditorField - useMemo Hook", () => {
  it("should parse blob data correctly using useMemo", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobWithImage,
      readOnly: false,
      allowedMimeTypes: ["image/png"],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobWithImage }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    // Verify that parsed values are displayed
    expect(screen.getByText(/test-image\.png/i)).toBeInTheDocument();
    expect(screen.getByText(/image\/png/i)).toBeInTheDocument();
  });

  it("should handle undefined currentValue", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: undefined,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: undefined }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/Upload file/i)).toBeInTheDocument();
  });

  it("should handle null currentValue", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: null,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: null }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/Upload file/i)).toBeInTheDocument();
  });
});

describe("BlobEditorField - Logger Integration", () => {
  it("should initialize logger correctly", () => {
    // Logger should be initialized without errors
    expect(log).toBeDefined();
  });

  it("should render component with logger active", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobWithImage,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobWithImage }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/test-image\.png/i)).toBeInTheDocument();
  });
});

describe("BlobEditorField - Validation Logic", () => {
  it("should NOT show error for empty blob (undefined contents)", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockEmptyBlob,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockEmptyBlob }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    // Should show "Upload file" not an error
    expect(screen.getByText(/Upload file/i)).toBeInTheDocument();
    expect(screen.queryByText(/Blob Validation Error/i)).not.toBeInTheDocument();
  });

  it("should NOT show error for null currentValue", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: null,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: null }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    // Should show "Upload file" not an error
    expect(screen.getByText(/Upload file/i)).toBeInTheDocument();
    expect(screen.queryByText(/Blob Validation Error/i)).not.toBeInTheDocument();
  });

  it("should display error for invalid encoding", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobInvalidEncoding,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobInvalidEncoding }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/Blob Validation Error/i)).toBeInTheDocument();
    expect(screen.getByText(/Invalid encoding: "invalid-encoding"/i)).toBeInTheDocument();
    expect(screen.getByText(/Expected 'base64' or 'data-uri'/i)).toBeInTheDocument();
  });

  it("should display error for missing mimeType", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobMissingMimeType,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobMissingMimeType }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/Blob Validation Error/i)).toBeInTheDocument();
    expect(screen.getByText(/MIME type is required/i)).toBeInTheDocument();
  });

  it("should display error for missing data", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobMissingData,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobMissingData }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/Blob Validation Error/i)).toBeInTheDocument();
    expect(screen.getByText(/Blob data is missing/i)).toBeInTheDocument();
  });

  it("should display error for empty string data", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobEmptyData,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobEmptyData }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/Blob Validation Error/i)).toBeInTheDocument();
    expect(screen.getByText(/Blob data is missing/i)).toBeInTheDocument();
  });

  it("should display error for missing encoding when contents exist", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobMissingEncoding,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobMissingEncoding }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/Blob Validation Error/i)).toBeInTheDocument();
    expect(screen.getByText(/Encoding is required when contents are present/i)).toBeInTheDocument();
  });

  it("should display multiple errors when multiple fields are invalid", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockInvalidBlob,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockInvalidBlob }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/Blob Validation Error/i)).toBeInTheDocument();
    // Should contain all three error messages
    const errorText = screen.getByText(/Invalid encoding/i).parentElement?.textContent || '';
    expect(errorText).toContain('Invalid encoding');
    expect(errorText).toContain('MIME type is required');
    expect(errorText).toContain('Blob data is missing');
  });

  it("should call onError callback when validation fails", () => {
    const onErrorMock = vi.fn();
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobInvalidEncoding,
      readOnly: false,
      allowedMimeTypes: [],
      onError: onErrorMock,
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobInvalidEncoding }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    expect(onErrorMock).toHaveBeenCalled();
    expect(onErrorMock).toHaveBeenCalledWith(expect.stringContaining('Invalid encoding'));
  });

  it("should NOT crash Formik form when validation error occurs", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobInvalidEncoding,
      readOnly: false,
      allowedMimeTypes: [],
    };

    // Should render without throwing
    expect(() => {
      render(
        <TestWrapper initialValues={{ testBlob: mockBlobInvalidEncoding }}>
          <BlobEditorField {...props as BlobEditorFieldProps} />
        </TestWrapper>
      );
    }).not.toThrow();

    // Validation error should be displayed
    expect(screen.getByText(/Blob Validation Error/i)).toBeInTheDocument();
  });

  it("should render valid blob without errors", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobWithImage,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobWithImage }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    // Should NOT show validation error
    expect(screen.queryByText(/Blob Validation Error/i)).not.toBeInTheDocument();
  });
});

describe("BlobEditorField - Display Functionality", () => {
  it("should display empty state with upload prompt when no contents", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockEmptyBlob,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockEmptyBlob }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/Upload file/i)).toBeInTheDocument();
  });

  it("should display image preview for image MIME types", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobWithImage,
      readOnly: false,
      allowedMimeTypes: ["image/png"],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobWithImage }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    // Should have image element
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
    
    // Should display metadata
    expect(screen.getByText(/test-image\.png/i)).toBeInTheDocument();
    expect(screen.getByText(/image\/png/i)).toBeInTheDocument();
  });

  it("should display file icon for non-image MIME types (PDF)", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobWithPdf,
      readOnly: false,
      allowedMimeTypes: ["application/pdf"],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobWithPdf }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    // Should display filename and MIME type
    expect(screen.getByText(/document\.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/application\/pdf/i)).toBeInTheDocument();
    
    // Should have download button
    expect(screen.getByText(/Download/i)).toBeInTheDocument();
  });

  it("should display metadata overlay on image preview", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobWithImage,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobWithImage }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    // Metadata should show filename
    expect(screen.getByText(/test-image\.png/i)).toBeInTheDocument();
    // Metadata should show MIME type
    expect(screen.getByText(/image\/png/i)).toBeInTheDocument();
    // Should NOT show encoding (internal detail)
    expect(screen.queryByText(/base64/i)).not.toBeInTheDocument();
  });

  it("should hide encoding field (internal detail)", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobWithImage,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobWithImage }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    // Encoding should NOT be visible to user
    expect(screen.queryByText(/encoding/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/base64/i)).not.toBeInTheDocument();
  });

  it("should render download button for non-image files", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobWithPdf,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobWithPdf }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    const downloadButton = screen.getByText(/Download/i);
    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton.closest('button')).toBeInTheDocument();
  });

  it("should display empty state in read-only mode without upload interactions", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockEmptyBlob,
      readOnly: true,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockEmptyBlob }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    // Should still show empty state message
    expect(screen.getByText(/Upload file/i)).toBeInTheDocument();
  });

  it("should display image preview in read-only mode", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobWithImage,
      readOnly: true,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobWithImage }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    // Should display image and metadata normally
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
    expect(screen.getByText(/test-image\.png/i)).toBeInTheDocument();
  });

  it("should keep download functionality enabled in read-only mode", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobWithPdf,
      readOnly: true,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobWithPdf }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    // Download button should still be present and functional
    expect(screen.getByText(/Download/i)).toBeInTheDocument();
  });

  it("should create correct data URI for base64 encoded images", () => {
    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobWithImage,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobWithImage }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    const images = screen.getAllByRole('img');
    const previewImage = images.find(img => 
      img.getAttribute('src')?.startsWith('data:image/png;base64,')
    );
    expect(previewImage).toBeDefined();
  });

  it("should handle data-uri encoding display correctly", () => {
    const mockBlobWithDataUri = {
      filename: "test.png",
      contents: {
        encoding: "data-uri",
        mimeType: "image/png",
        data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      },
    };

    const props: Partial<BlobEditorFieldProps> = {
      rootLessListKey: "testBlob",
      rootLessListKeyArray: ["testBlob"],
      currentValue: mockBlobWithDataUri,
      readOnly: false,
      allowedMimeTypes: [],
    };

    render(
      <TestWrapper initialValues={{ testBlob: mockBlobWithDataUri }}>
        <BlobEditorField {...props as BlobEditorFieldProps} />
      </TestWrapper>
    );

    // Should render without errors
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });
});
