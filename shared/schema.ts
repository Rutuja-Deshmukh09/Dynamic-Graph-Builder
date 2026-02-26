import { z } from "zod";

export const uploadResponseSchema = z.object({
  sessionId: z.string(),
});

export const metadataSchema = z.object({
  projectName: z.string(),
  runDate: z.string(),
  runTime: z.string(),
  nodeCount: z.number(),
  timeRange: z.tuple([z.number(), z.number()]),
  timestepAvg: z.number(),
  totalRecords: z.number(),
  nodes: z.array(z.string()),
  variables: z.array(z.string()),
});

export const validationNodeSchema = z.object({
  node: z.string(),
  variable: z.string(),
  mae: z.number(),
  maxDiff: z.number(),
  status: z.enum(["pass", "warn", "fail"])
});

export const validationSchema = z.object({
  recordCountMatch: z.boolean(),
  timeVectorMatch: z.boolean(),
  maxTimeDiff: z.number(),
  nodeValidation: z.array(validationNodeSchema),
  overallStatus: z.enum(["pass", "warn", "fail"])
});

export const timeseriesDataPointSchema = z.object({
  time: z.number(),
  value: z.number().nullable(),
});

export const snapshotDataPointSchema = z.object({
  node: z.string(),
  value: z.number().nullable(),
});

export const tableRowSchema = z.object({
  time: z.number(),
  node: z.string(),
  variable: z.string(),
  tabValue: z.number().nullable(),
  pltValue: z.number().nullable(),
  diff: z.number().nullable(),
});
