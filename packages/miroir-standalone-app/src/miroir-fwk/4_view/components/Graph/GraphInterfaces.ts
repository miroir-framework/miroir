import { JzodElement, JzodObject } from '@miroir-framework/jzod-ts';
import { graphConfig } from 'miroir-core';
import { z } from 'zod';
export {GraphConfig} from 'miroir-core'
// ################################################################################################
// Graph Data Schema using Jzod
// ################################################################################################

export const graphDataPointSchema: JzodObject = {
  type: "object",
  definition: {
    label: {
      type: "string"
    },
    value: {
      type: "number"
    },
    color: {
      type: "string",
      optional: true
    }
  }
} as const;

export const graphConfigSchema: JzodObject = {
  type: "object",
  definition: {
    width: {
      type: "number",
      optional: true
    },
    height: {
      type: "number",
      optional: true
    },
    margins: {
      type: "object",
      optional: true,
      definition: {
        top: { type: "number" },
        right: { type: "number" },
        bottom: { type: "number" },
        left: { type: "number" }
      }
    },
    colors: {
      type: "array",
      optional: true,
      definition: { type: "string" }
    },
    showLegend: {
      type: "boolean",
      optional: true
    },
    showTooltips: {
      type: "boolean",
      optional: true
    }
  }
} as const;
export const barChartDataSchema: JzodObject = {
  type: "object",
  definition: {
    type: {
      type: "literal",
      definition: "bar"
    },
    title: {
      type: "string",
      optional: true
    },
    data: {
      type: "array",
      definition: graphDataPointSchema
    },
    config: {
      type: "object",
      optional: true,
      definition: graphConfigSchema.definition
    }
  }
} as const;

export const lineChartDataSchema: JzodObject = {
  type: "object", 
  definition: {
    type: {
      type: "literal",
      definition: "line"
    },
    title: {
      type: "string",
      optional: true
    },
    data: {
      type: "array",
      definition: graphDataPointSchema
    },
    config: {
      type: "object",
      optional: true,
      definition: graphConfigSchema.definition
    }
  }
} as const;

export const pieChartDataSchema: JzodObject = {
  type: "object",
  definition: {
    type: {
      type: "literal",
      definition: "pie"
    },
    title: {
      type: "string",
      optional: true
    },
    data: {
      type: "array",
      definition: graphDataPointSchema
    },
    config: {
      type: "object",
      optional: true,
      definition: graphConfigSchema.definition
    }
  }
} as const;
export const graphDataSchema: JzodElement = {
  type: "union",
  definition: [
    barChartDataSchema,
    lineChartDataSchema,
    pieChartDataSchema
  ]
} as const;

// ################################################################################################
// Zod schemas derived from Jzod for runtime validation  
// ################################################################################################

export const GraphDataPointSchema = z.object({
  label: z.string(),
  value: z.number(),
  color: z.string().optional()
});

export const BarChartDataSchema = z.object({
  type: z.literal("bar"),
  title: z.string().optional(),
  data: z.array(GraphDataPointSchema),
  config: graphConfig.optional()
});

export const LineChartDataSchema = z.object({
  type: z.literal("line"),
  title: z.string().optional(),
  data: z.array(GraphDataPointSchema),
  config: graphConfig.optional()
});

export const PieChartDataSchema = z.object({
  type: z.literal("pie"),
  title: z.string().optional(),
  data: z.array(GraphDataPointSchema),
  config: graphConfig.optional()
});

export const GraphDataSchema = z.union([
  BarChartDataSchema,
  LineChartDataSchema,
  PieChartDataSchema
]);

// ################################################################################################
// TypeScript types
// ################################################################################################

export type GraphDataPoint = z.infer<typeof GraphDataPointSchema>;
// export type GraphConfig = z.infer<typeof GraphConfigSchema>;
export type BarChartData = z.infer<typeof BarChartDataSchema>;
export type LineChartData = z.infer<typeof LineChartDataSchema>;
export type PieChartData = z.infer<typeof PieChartDataSchema>;
export type GraphData = z.infer<typeof GraphDataSchema>;

// ################################################################################################
// Graph Report Section Schema for integration with Miroir report system
// ################################################################################################

// export const graphReportSectionSchema: JzodObject = {
//   type: "object",
//   definition: {
//     type: {
//       type: "literal",
//       definition: "graphReportSection"
//     },
//     definition: {
//       type: "object",
//       definition: {
//         label: {
//           type: "string",
//           optional: true
//         },
//         fetchedDataReference: {
//           type: "string"
//         },
//         graphType: {
//           type: "enum",
//           definition: ["bar", "line", "pie"]
//         },
//         dataMapping: {
//           type: "object",
//           definition: {
//             labelField: {
//               type: "string"
//             },
//             valueField: {
//               type: "string"
//             },
//             colorField: {
//               type: "string",
//               optional: true
//             }
//           }
//         },
//         config: {
//           type: "object",
//           optional: true,
//           definition: graphConfigSchema.definition
//         }
//       }
//     }
//   }
// } as const;

// export const GraphReportSectionSchema = z.object({
//   type: z.literal("graphReportSection"),
//   definition: z.object({
//     label: z.string().optional(),
//     fetchedDataReference: z.string(),
//     graphType: z.enum(["bar", "line", "pie"]),
//     dataMapping: z.object({
//       labelField: z.string(),
//       valueField: z.string(),
//       colorField: z.string().optional()
//     }),
//     config: GraphConfigSchema.optional()
//   })
// });

// export type GraphReportSection = z.infer<typeof GraphReportSectionSchema>;
// // export { graphReportSection } from '';
