import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { api, buildUrl } from "@shared/routes";
import {
  metadataSchema,
  validationSchema,
  timeseriesDataPointSchema,
  snapshotDataPointSchema,
  tableRowSchema
} from "@shared/schema";

// Utility to log Zod parsing errors
function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useUploadSession() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(api.upload.path, {
        method: api.upload.method,
        body: formData,
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to upload files');
      }
      
      const data = await res.json();
      return parseWithLogging(api.upload.responses[200], data, "upload");
    },
  });
}

export function useMetadata(sessionId: string) {
  return useQuery({
    queryKey: ['metadata', sessionId],
    queryFn: async () => {
      const url = buildUrl(api.metadata.path, { session_id: sessionId });
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch metadata');
      const data = await res.json();
      return parseWithLogging(api.metadata.responses[200], data, "metadata");
    },
    enabled: !!sessionId,
  });
}

export function useNodes(sessionId: string) {
  return useQuery({
    queryKey: ['nodes', sessionId],
    queryFn: async () => {
      const url = buildUrl(api.nodes.path, { session_id: sessionId });
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch nodes');
      const data = await res.json();
      return parseWithLogging(api.nodes.responses[200], data, "nodes");
    },
    enabled: !!sessionId,
  });
}

export function useVariables(sessionId: string) {
  return useQuery({
    queryKey: ['variables', sessionId],
    queryFn: async () => {
      const url = buildUrl(api.variables.path, { session_id: sessionId });
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch variables');
      const data = await res.json();
      return parseWithLogging(api.variables.responses[200], data, "variables");
    },
    enabled: !!sessionId,
  });
}

export function useValidation(sessionId: string) {
  return useQuery({
    queryKey: ['validation', sessionId],
    queryFn: async () => {
      const url = buildUrl(api.validation.path, { session_id: sessionId });
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch validation');
      const data = await res.json();
      return parseWithLogging(api.validation.responses[200], data, "validation");
    },
    enabled: !!sessionId,
  });
}

export function useTimeseries(
  sessionId: string, 
  nodes: string[], 
  variable: string, 
  source: 'tab' | 'plt' | 'both' = 'both'
) {
  return useQuery({
    queryKey: ['timeseries', sessionId, nodes, variable, source],
    queryFn: async () => {
      if (!nodes.length || !variable) return {};
      
      let url = buildUrl(api.timeseries.path, { session_id: sessionId });
      const params = new URLSearchParams({
        nodes: nodes.join(','),
        variable,
        source
      });
      
      const res = await fetch(`${url}?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch timeseries');
      const data = await res.json();
      return parseWithLogging(api.timeseries.responses[200], data, "timeseries");
    },
    enabled: !!sessionId && nodes.length > 0 && !!variable,
  });
}

export function useSnapshot(
  sessionId: string, 
  time: string, 
  variable: string, 
  source: 'tab' | 'plt' = 'plt'
) {
  return useQuery({
    queryKey: ['snapshot', sessionId, time, variable, source],
    queryFn: async () => {
      if (!time || !variable) return [];
      
      let url = buildUrl(api.snapshot.path, { session_id: sessionId });
      const params = new URLSearchParams({
        time,
        variable,
        source
      });
      
      const res = await fetch(`${url}?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch snapshot');
      const data = await res.json();
      return parseWithLogging(api.snapshot.responses[200], data, "snapshot");
    },
    enabled: !!sessionId && !!time && !!variable,
  });
}

export function useTableData(
  sessionId: string,
  page: number,
  limit: number,
  node?: string,
  variable?: string
) {
  return useQuery({
    queryKey: ['table', sessionId, page, limit, node, variable],
    queryFn: async () => {
      let url = buildUrl(api.table.path, { session_id: sessionId });
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (node) params.append('node', node);
      if (variable) params.append('variable', variable);
      
      const res = await fetch(`${url}?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch table data');
      const data = await res.json();
      return parseWithLogging(api.table.responses[200], data, "table");
    },
    enabled: !!sessionId,
    placeholderData: (prev) => prev, // Keep previous data while fetching new page
  });
}
