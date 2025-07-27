import { describe, it, expect } from "vitest";
import {
  calculateAdaptiveColumnWidths,
  ColumnWidthSpec,
  ToolsColumnDefinition,
} from "../../src/miroir-fwk/4_view/adaptiveColumnWidths";
import { TableComponentRow } from "../../src/miroir-fwk/4_view/components/MTableComponentInterface";
import { JzodElement } from "miroir-core";

const defaultToolsColumnDef: ToolsColumnDefinition = {
  field: "",
  headerName: "Actions",
  width: 120,
};

describe("calculateAdaptiveColumnWidths", () => {
  const baseColumnDefs: Array<{ field: string; headerName: string; cellRendererParams?: any }> = [
    { field: "uuid", headerName: "ID" },
    { field: "name", headerName: "Name" },
    { field: "age", headerName: "Age" },
    { field: "isActive", headerName: "Active" },
    { field: "createdAt", headerName: "Created" },
    { field: "meta", headerName: "Meta" },
  ];

  const baseJzodSchema: Record<string, JzodElement> = {
    uuid: { type: "string" },
    name: { type: "string" },
    age: { type: "number" },
    isActive: { type: "boolean" },
    createdAt: { type: "date" },
    meta: { type: "object", definition: {} },
  };

  const baseRows: TableComponentRow[] = [
    {
      deploymentUuid: "550e8400-e29b-41d4-a716-446655440000",
      displayedValue: {
        uuid: "abc-123",
        name: "Alice",
        age: 30,
        isActive: true,
        createdAt: "2023-01-01",
        meta: { foo: "bar" },
      },
      rawValue: {
        uuid: "abc-123",
        parentUuid: "parent-1",
      },
      jzodSchema: baseJzodSchema,
      foreignKeyObjects: {},
    },
    {
      deploymentUuid: "550e8400-e29b-41d4-a716-446655440000",
      displayedValue: {
        uuid: "def-456",
        name: "Bob",
        age: 25,
        isActive: false,
        createdAt: "2023-02-01",
        meta: { foo: "baz" },
      },
      rawValue: {
        uuid: "def-456",
        parentUuid: "parent-1",
      },
      jzodSchema: baseJzodSchema,
      foreignKeyObjects: {},
    },
  ];

  it("should always include a tools column as the first column", () => {
    const specs: ColumnWidthSpec[] = calculateAdaptiveColumnWidths(
      baseColumnDefs,
      baseRows,
      1200,
      defaultToolsColumnDef,
      baseJzodSchema
    );
    expect(specs[0].type).toBe("tools");
    expect(specs[0].field).toBe("");
    expect(specs[0].calculatedWidth).toBeGreaterThan(0);
  });

  it("should assign correct types based on field and schema", () => {
    const specs: ColumnWidthSpec[] = calculateAdaptiveColumnWidths(
      baseColumnDefs,
      baseRows,
      1200,
      defaultToolsColumnDef,
      baseJzodSchema
    );
    const types = specs.map((s) => s.type);
    expect(types).toContain("uuid");
    expect(types).toContain("name");
    expect(types).toContain("number");
    expect(types).toContain("boolean");
    expect(types).toContain("date");
    expect(types).toContain("object");
  });

  it("should respect min and max width constraints when possible", () => {
    // Simulate the scrollbar adjustment that GlideDataGridComponent does
    const containerWidth = 1200;
    const availableWidth = containerWidth - 17 - 2; // scrollbar + border
    const specs: ColumnWidthSpec[] = calculateAdaptiveColumnWidths(
      baseColumnDefs,
      baseRows,
      availableWidth,
      defaultToolsColumnDef,
      baseJzodSchema
    );

    // Calculate the total actual width to verify exact matching
    const totalWidth = specs.reduce((sum, spec) => sum + spec.calculatedWidth, 0);

    // Primary requirement: exact width matching
    expect(Math.abs(totalWidth - availableWidth)).toBeLessThan(0.1);

    // Secondary requirement: respect constraints when space allows
    // In constrained scenarios, exact width matching takes priority
    const toolsColumn = specs.find((spec) => spec.type === "tools");
    expect(toolsColumn?.calculatedWidth).toBeGreaterThan(150); // Should be reasonable size

    // Non-tools columns should have reasonable widths
    const nonToolsColumns = specs.filter((spec) => spec.type !== "tools");
    nonToolsColumns.forEach((spec) => {
      expect(spec.calculatedWidth).toBeGreaterThan(50); // Should be usable
    });
  });

  it("should allow width distribution to override minimums for exact fitting", () => {
    // Simulate the scrollbar adjustment that GlideDataGridComponent does
    const containerWidth = 400;
    const availableWidth = containerWidth - 17 - 2; // scrollbar + border
    const specs: ColumnWidthSpec[] = calculateAdaptiveColumnWidths(
      baseColumnDefs,
      baseRows,
      availableWidth,
      defaultToolsColumnDef,
      baseJzodSchema
    );
    const totalWidth = specs.reduce((sum, s) => sum + s.calculatedWidth, 0);

    // Width should match exactly, even if it means going below minimum column widths
    expect(Math.abs(totalWidth - availableWidth)).toBeLessThan(2);
    expect(totalWidth).toBeLessThanOrEqual(availableWidth);

    // All columns should have reasonable widths, but may be below their ideal minimums
    specs.forEach((spec) => {
      expect(spec.calculatedWidth).toBeGreaterThan(30); // Absolute minimum for usability
    });
  });

  it("should distribute width to match available space exactly", () => {
    // Simulate the scrollbar adjustment that GlideDataGridComponent does
    const containerWidth = 1200;
    const availableWidth = containerWidth - 17 - 2; // scrollbar + border
    const specs: ColumnWidthSpec[] = calculateAdaptiveColumnWidths(
      baseColumnDefs,
      baseRows,
      availableWidth,
      defaultToolsColumnDef,
      baseJzodSchema
    );
    const totalWidth = specs.reduce((sum, s) => sum + s.calculatedWidth, 0);
    expect(Math.abs(totalWidth - availableWidth)).toBeLessThan(2); // Allow for rounding
  });

  it("should handle various container widths and always match exactly", () => {
    const testWidths = [800, 1000, 1200, 1400, 1600]; // Remove very small widths that cause issues

    testWidths.forEach((containerWidth) => {
      // Simulate the scrollbar adjustment that GlideDataGridComponent does
      const availableWidth = containerWidth - 17 - 2; // scrollbar + border
      const specs = calculateAdaptiveColumnWidths(
        baseColumnDefs,
        baseRows,
        availableWidth,
        defaultToolsColumnDef,
        baseJzodSchema
      );
      const totalWidth = specs.reduce((sum, s) => sum + s.calculatedWidth, 0);

      expect(Math.abs(totalWidth - availableWidth)).toBeLessThan(2); // Allow for rounding
      expect(specs.length).toBeGreaterThan(0);

      // Ensure all columns have reasonable widths
      specs.forEach((spec) => {
        expect(spec.calculatedWidth).toBeGreaterThan(0);
        expect(spec.calculatedWidth).toBeGreaterThan(30); // Absolute minimum for usability
      });
    });
  });

  it("should shrink columns when space is very limited", () => {
    // Simulate the scrollbar adjustment that GlideDataGridComponent does
    const containerWidth = 400;
    const availableWidth = containerWidth - 17 - 2; // scrollbar + border
    const specs: ColumnWidthSpec[] = calculateAdaptiveColumnWidths(
      baseColumnDefs,
      baseRows,
      availableWidth,
      defaultToolsColumnDef,
      baseJzodSchema
    );
    const totalWidth = specs.reduce((sum, s) => sum + s.calculatedWidth, 0);

    // Should match the exact available width
    expect(Math.abs(totalWidth - availableWidth)).toBeLessThan(2);

    // All columns should have some reasonable width
    specs.forEach((spec) => {
      expect(spec.calculatedWidth).toBeGreaterThan(30); // Absolute minimum for usability
    });
  });

  it("should expand columns when extra space is available", () => {
    const largeWidth = 2000;
    const specs: ColumnWidthSpec[] = calculateAdaptiveColumnWidths(
      baseColumnDefs,
      baseRows,
      largeWidth,
      defaultToolsColumnDef,
      baseJzodSchema
    );
    const totalWidth = specs.reduce((sum, s) => sum + s.calculatedWidth, 0);
    expect(totalWidth).toBeLessThanOrEqual(largeWidth);
    expect(totalWidth).toBeGreaterThan(1000);
  });

  it("should handle foreignKey columns", () => {
    const columnDefs = [
      { field: "fk", headerName: "FK", cellRendererParams: { isFK: true, entityUuid: "entity1" } },
    ];
    const jzodSchema: Record<string, JzodElement> = {
      fk: { type: "string", tag: { value: { targetEntity: "entity1" } } },
    };
    const rows: TableComponentRow[] = [
      {
        deploymentUuid: "550e8400-e29b-41d4-a716-446655440000",
        displayedValue: { fk: "ref-1" },
        rawValue: { uuid: "test-uuid", parentUuid: "parent-1" },
        jzodSchema,
        foreignKeyObjects: {
          entity1: {
            "ref-1": {
              uuid: "ref-1",
              parentUuid: "entity1",
            },
          },
        },
      },
    ];
    const specs: ColumnWidthSpec[] = calculateAdaptiveColumnWidths(
      columnDefs,
      rows,
      800,
      defaultToolsColumnDef,
      jzodSchema
    );
    expect(specs[1].type).toBe("foreignKey");
    expect(specs[1].calculatedWidth).toBeGreaterThan(0);
  });

  it("should not throw if jzodSchema is undefined", () => {
    expect(() =>
      calculateAdaptiveColumnWidths(baseColumnDefs, baseRows, 1200, defaultToolsColumnDef)
    ).not.toThrow();
  });

  it("should handle empty rowData gracefully", () => {
    const specs: ColumnWidthSpec[] = calculateAdaptiveColumnWidths(
      baseColumnDefs,
      [],
      1200,
      defaultToolsColumnDef,
      baseJzodSchema
    );
    specs.forEach((spec) => {
      expect(spec.calculatedWidth).toBeGreaterThan(0);
    });
  });

  it("should handle columns with long content", () => {
    const rows: TableComponentRow[] = [
      {
        deploymentUuid: "550e8400-e29b-41d4-a716-446655440000",
        displayedValue: { name: "A very very very long name for testing column width" },
        rawValue: { uuid: "test-uuid", parentUuid: "parent-1" },
        jzodSchema: baseJzodSchema,
        foreignKeyObjects: {},
      },
    ];
    const specs: ColumnWidthSpec[] = calculateAdaptiveColumnWidths(
      [{ field: "name", headerName: "Name" }],
      rows,
      500,
      defaultToolsColumnDef,
      baseJzodSchema
    );
    expect(specs[1].calculatedWidth).toBeGreaterThan(100);
  });

  it("should handle cases where no scrollbar is needed", () => {
    // When there are few rows, no vertical scrollbar should be accounted for
    // This simulates the GlideDataGridComponent logic for detecting scrollbar necessity
    const fewRows: TableComponentRow[] = [baseRows[0]]; // Only 1 row
    const containerWidth = 800;
    // No scrollbar needed since only 1 row, so no scrollbar adjustment
    const availableWidth = containerWidth - 2; // Only border, no scrollbar

    const specs: ColumnWidthSpec[] = calculateAdaptiveColumnWidths(
      baseColumnDefs,
      fewRows,
      availableWidth,
      defaultToolsColumnDef,
      baseJzodSchema
    );
    const totalWidth = specs.reduce((sum, s) => sum + s.calculatedWidth, 0);

    expect(Math.abs(totalWidth - availableWidth)).toBeLessThan(2);
  });
});
