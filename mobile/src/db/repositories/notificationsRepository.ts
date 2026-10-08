import { getDatabase, Database } from '../database';
import { generateUUID } from '../../platform/crypto';

export interface NotificationRecord {
  id: string;
  userId: string;
  churchId: string;
  type: string;
  message: string;
  referenceId?: string | null;
  referenceType?: string | null;
  read: boolean | number;
  createdAt: string;
}

export class NotificationsRepository {
  constructor(private dbProvider = getDatabase) {}

  private async db(): Promise<Database> {
    return await this.dbProvider();
  }

  async getAll(
    userId: string,
    churchId: string,
    page = 1,
    limit = 20
  ): Promise<{ data: NotificationRecord[]; pagination: { page: number; limit: number; total: number } }> {
    const db = await this.db();
    const offset = (page - 1) * limit;

    const countRow = await db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) as total FROM notifications WHERE userId = ? AND churchId = ?;',
      [userId, churchId]
    );
    const total = countRow?.total || 0;

    const rows = await db.getAllAsync<NotificationRecord>(
      `SELECT id, userId, churchId, type, message, referenceId, referenceType, read, createdAt
       FROM notifications
       WHERE userId = ? AND churchId = ?
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?;`,
      [userId, churchId, limit, offset]
    );

    return {
      data: rows,
      pagination: { page, limit, total },
    };
  }

  async getUnreadCount(userId: string, churchId: string): Promise<number> {
    const db = await this.db();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND churchId = ? AND read = 0;',
      [userId, churchId]
    );
    return row?.count || 0;
  }

  async create(data: {
    userId: string;
    churchId: string;
    type: string;
    message: string;
    referenceId?: string;
    referenceType?: string;
  }): Promise<NotificationRecord> {
    const db = await this.db();
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO notifications (id, userId, churchId, type, message, referenceId, referenceType, read, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?);`,
      [id, data.userId, data.churchId, data.type, data.message, data.referenceId || null, data.referenceType || null, now]
    );

    return {
      id,
      userId: data.userId,
      churchId: data.churchId,
      type: data.type,
      message: data.message,
      referenceId: data.referenceId || null,
      referenceType: data.referenceType || null,
      read: 0,
      createdAt: now,
    };
  }

  async markRead(id: string): Promise<void> {
    const db = await this.db();
    await db.runAsync('UPDATE notifications SET read = 1 WHERE id = ?;', [id]);
  }

  async markAllRead(userId: string, churchId: string): Promise<void> {
    const db = await this.db();
    await db.runAsync(
      'UPDATE notifications SET read = 1 WHERE userId = ? AND churchId = ?;',
      [userId, churchId]
    );
  }
}

export const notificationsRepository = new NotificationsRepository();
