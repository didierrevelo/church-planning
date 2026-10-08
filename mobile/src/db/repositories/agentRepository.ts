import { getDatabase, Database } from '../database';
import { generateUUID } from '../../platform/crypto';

export interface AgentRunRecord {
  id: string;
  churchId: string;
  type: string;
  status: string;
  input?: string | null;
  output?: string | null;
  error?: string | null;
  triggeredBy?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export class AgentRepository {
  constructor(private dbProvider = getDatabase) {}

  private async db(): Promise<Database> {
    return await this.dbProvider();
  }

  async createRun(data: {
    churchId: string;
    type: string;
    status?: string;
    input?: any;
    output?: any;
    error?: string;
    triggeredBy?: string;
  }): Promise<AgentRunRecord> {
    const db = await this.db();
    const id = generateUUID();
    const now = new Date().toISOString();
    const status = data.status || 'pending';
    const input = data.input ? JSON.stringify(data.input) : null;
    const output = data.output ? JSON.stringify(data.output) : null;
    const completedAt = status.startsWith('completed') || status === 'failed' ? now : null;

    await db.runAsync(
      `INSERT INTO agent_runs (id, churchId, type, status, input, output, error, triggeredBy, createdAt, completedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [id, data.churchId, data.type, status, input, output, data.error || null, data.triggeredBy || null, now, completedAt]
    );

    return {
      id,
      churchId: data.churchId,
      type: data.type,
      status,
      input,
      output,
      error: data.error || null,
      triggeredBy: data.triggeredBy || null,
      createdAt: now,
      completedAt,
    };
  }

  async getHistory(churchId: string, page = 1, limit = 20): Promise<{ data: AgentRunRecord[]; pagination: any }> {
    const db = await this.db();
    const offset = (page - 1) * limit;

    const countRow = await db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) as total FROM agent_runs WHERE churchId = ?;',
      [churchId]
    );
    const total = countRow?.total || 0;

    const rows = await db.getAllAsync<AgentRunRecord>(
      `SELECT id, churchId, type, status, input, output, error, triggeredBy, createdAt, completedAt
       FROM agent_runs
       WHERE churchId = ?
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?;`,
      [churchId, limit, offset]
    );

    return {
      data: rows,
      pagination: { page, limit, total },
    };
  }
}

export const agentRepository = new AgentRepository();
