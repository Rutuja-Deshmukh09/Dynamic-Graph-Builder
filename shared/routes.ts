import { z } from "zod";
import { uploadResponseSchema, metadataSchema, validationSchema, timeseriesDataPointSchema, snapshotDataPointSchema, tableRowSchema } from "./schema";

export const errorSchemas = {
  badRequest: z.object({ message: z.string() }),
  notFound: z.object({ message: z.string() }),
};

export const api = {
  upload: {
    method: 'POST' as const,
    path: '/api/upload' as const,
    responses: {
      200: uploadResponseSchema,
      400: errorSchemas.badRequest,
    }
  },
  metadata: {
    method: 'GET' as const,
    path: '/api/:session_id/metadata' as const,
    responses: {
      200: metadataSchema,
      404: errorSchemas.notFound,
    }
  },
  nodes: {
    method: 'GET' as const,
    path: '/api/:session_id/nodes' as const,
    responses: {
      200: z.array(z.string()),
      404: errorSchemas.notFound,
    }
  },
  variables: {
    method: 'GET' as const,
    path: '/api/:session_id/variables' as const,
    responses: {
      200: z.array(z.string()),
      404: errorSchemas.notFound,
    }
  },
  timeseries: {
    method: 'GET' as const,
    path: '/api/:session_id/timeseries' as const,
    input: z.object({
      nodes: z.string(), // comma separated
      variable: z.string(),
      source: z.enum(["tab", "plt", "both"]).optional(),
    }).optional(),
    responses: {
      // Returns a map: node ID -> { tab: [...], plt: [...] }
      200: z.record(
        z.object({
          tab: z.array(timeseriesDataPointSchema).optional(),
          plt: z.array(timeseriesDataPointSchema).optional(),
        })
      ),
      404: errorSchemas.notFound,
    }
  },
  snapshot: {
    method: 'GET' as const,
    path: '/api/:session_id/snapshot' as const,
    input: z.object({
      time: z.string(),
      variable: z.string(),
      source: z.enum(["tab", "plt"]).optional(),
    }).optional(),
    responses: {
      200: z.array(snapshotDataPointSchema),
      404: errorSchemas.notFound,
    }
  },
  validation: {
    method: 'GET' as const,
    path: '/api/:session_id/validation' as const,
    responses: {
      200: validationSchema,
      404: errorSchemas.notFound,
    }
  },
  table: {
    method: 'GET' as const,
    path: '/api/:session_id/table' as const,
    input: z.object({
      page: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
      node: z.string().optional(),
      variable: z.string().optional(),
    }).optional(),
    responses: {
      200: z.object({
        data: z.array(tableRowSchema),
        total: z.number(),
        page: z.number(),
        totalPages: z.number(),
      }),
      404: errorSchemas.notFound,
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
