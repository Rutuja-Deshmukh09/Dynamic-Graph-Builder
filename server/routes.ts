import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { inspectFiles } from "./parsers/fileInspector";
import { z } from "zod";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post(api.upload.path, upload.fields([{ name: 'tab', maxCount: 1 }, { name: 'plt', maxCount: 1 }]), (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const tabFile = files['tab']?.[0];
      const pltFile = files['plt']?.[0];
      
      if (!tabFile) {
        return res.status(400).json({ message: "TAB file is required" });
      }

      const sessionData = inspectFiles(tabFile.buffer, pltFile?.buffer || null);
      const sessionId = storage.saveSession(sessionData);

      res.status(200).json({ sessionId });
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ message: error.message || "Upload failed" });
    }
  });

  app.get(api.metadata.path, (req, res) => {
    const session = storage.getSession(req.params.session_id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session.metadata);
  });

  app.get(api.nodes.path, (req, res) => {
    const session = storage.getSession(req.params.session_id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session.metadata.nodes);
  });

  app.get(api.variables.path, (req, res) => {
    const session = storage.getSession(req.params.session_id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session.metadata.variables);
  });

  app.get(api.timeseries.path, (req, res) => {
    const session = storage.getSession(req.params.session_id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    
    const nodes = (req.query.nodes as string || "").split(",");
    const variable = req.query.variable as string;
    const source = req.query.source as string || "both";

    const result: Record<string, { tab?: any[], plt?: any[] }> = {};

    nodes.forEach(node => {
      if (!node) return;
      result[node] = {};
      
      if (source === "tab" || source === "both") {
        result[node].tab = session.tabData
          .filter(d => d.node === node && d.variable === variable)
          .map(d => ({ time: d.time, value: d.value }));
      }
      
      if (source === "plt" || source === "both") {
        result[node].plt = session.pltData
          .filter(d => d.node === node && d.variable === variable)
          .map(d => ({ time: d.time, value: d.value }));
      }
    });

    res.json(result);
  });

  app.get(api.snapshot.path, (req, res) => {
    const session = storage.getSession(req.params.session_id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    
    const time = parseFloat(req.query.time as string);
    const variable = req.query.variable as string;
    const source = req.query.source as string || "tab";

    const dataset = source === "plt" ? session.pltData : session.tabData;
    const filtered = dataset.filter(d => d.time === time && d.variable === variable);

    const result = filtered.map(d => ({
      node: d.node,
      value: d.value
    }));

    res.json(result);
  });

  app.get(api.validation.path, (req, res) => {
    const session = storage.getSession(req.params.session_id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session.validation);
  });

  app.get(api.table.path, (req, res) => {
    const session = storage.getSession(req.params.session_id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const page = parseInt(req.query.page as string || "1");
    const limit = parseInt(req.query.limit as string || "50");
    const nodeFilter = req.query.node as string;
    const varFilter = req.query.variable as string;

    let filtered = session.tabData;
    if (nodeFilter) filtered = filtered.filter(d => d.node === nodeFilter);
    if (varFilter) filtered = filtered.filter(d => d.variable === varFilter);

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    const data = paginated.map(t => {
      const p = session.pltData.find(pd => pd.time === t.time && pd.node === t.node && pd.variable === t.variable);
      return {
        time: t.time,
        node: t.node,
        variable: t.variable,
        tabValue: t.value,
        pltValue: p ? p.value : null,
        diff: p ? Math.abs(t.value - p.value) : null
      };
    });

    res.json({
      data,
      total,
      page,
      totalPages
    });
  });

  return httpServer;
}
