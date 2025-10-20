import { describe, it, expect, beforeEach } from "vitest";
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

    expect(screen.getByText(/Blob Editor Field/i)).toBeInTheDocument();
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

    expect(screen.getByText(/No contents/i)).toBeInTheDocument();
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
    expect(screen.getByText(/base64/i)).toBeInTheDocument();
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

    expect(screen.getByText(/No contents/i)).toBeInTheDocument();
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

    expect(screen.getByText(/No contents/i)).toBeInTheDocument();
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

    expect(screen.getByText(/Blob Editor Field/i)).toBeInTheDocument();
  });
});
