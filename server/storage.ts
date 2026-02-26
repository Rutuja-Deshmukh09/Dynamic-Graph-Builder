import { randomUUID } from "crypto";

export interface SessionData {
  id: string;
  metadata: any;
  tabData: any[];
  pltData: any[];
  validation: any;
}

export interface IStorage {
  saveSession(data: Omit<SessionData, "id">): string;
  getSession(id: string): SessionData | undefined;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, SessionData>;

  constructor() {
    this.sessions = new Map();
  }

  saveSession(data: Omit<SessionData, "id">): string {
    const id = randomUUID();
    this.sessions.set(id, { ...data, id });
    
    // Auto-expire after 1 hour
    setTimeout(() => {
      this.sessions.delete(id);
    }, 60 * 60 * 1000);
    
    return id;
  }

  getSession(id: string): SessionData | undefined {
    return this.sessions.get(id);
  }
}

export const storage = new MemStorage();
