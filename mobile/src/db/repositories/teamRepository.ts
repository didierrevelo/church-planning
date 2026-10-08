import { getDatabase, Database } from '../database';
import { generateUUID } from '../../platform/crypto';
import { createTeamMemberSchema, updateTeamMemberSchema } from '@shared/validation/services';

export interface ServiceTeamMemberRecord {
  id: string;
  serviceId: string;
  userId: string;
  ministryId: string;
  ministryRoleId: string;
  status: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string };
  ministry?: { id: string; name: string };
  ministryRole?: { id: string; name: string };
}

export interface PositionRequestRecord {
  id: string;
  serviceId: string;
  ministryRoleId: string;
  userId?: string | null;
  status: string;
  note?: string | null;
  requestedAt: string;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class TeamRepository {
  constructor(private dbProvider = getDatabase) {}

  private async db(): Promise<Database> {
    return await this.dbProvider();
  }

  async getByService(serviceId: string): Promise<ServiceTeamMemberRecord[]> {
    const db = await this.db();
    const rows = await db.getAllAsync<{
      id: string;
      serviceId: string;
      userId: string;
      ministryId: string;
      ministryRoleId: string;
      status: string;
      note: string | null;
      createdAt: string;
      updatedAt: string;
      userName: string;
      ministryName: string;
      roleName: string;
    }>(
      `SELECT st.id, st.serviceId, st.userId, st.ministryId, st.ministryRoleId, st.status, st.note,
              st.createdAt, st.updatedAt, u.name as userName, m.name as ministryName, mr.name as roleName
       FROM service_teams st
       JOIN users u ON st.userId = u.id
       JOIN ministries m ON st.ministryId = m.id
       JOIN ministry_roles mr ON st.ministryRoleId = mr.id
       WHERE st.serviceId = ?
       ORDER BY m.name ASC, mr.name ASC;`,
      [serviceId]
    );

    return rows.map((r) => ({
      id: r.id,
      serviceId: r.serviceId,
      userId: r.userId,
      ministryId: r.ministryId,
      ministryRoleId: r.ministryRoleId,
      status: r.status,
      note: r.note,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: { id: r.userId, name: r.userName },
      ministry: { id: r.ministryId, name: r.ministryName },
      ministryRole: { id: r.ministryRoleId, name: r.roleName },
    }));
  }

  async addMember(
    serviceId: string,
    data: { userId: string; ministryId: string; ministryRoleId?: string; roleId?: string }
  ): Promise<ServiceTeamMemberRecord> {
    const ministryRoleId = data.ministryRoleId || data.roleId || '';
    const validated = createTeamMemberSchema.parse({
      body: { userId: data.userId, ministryId: data.ministryId, ministryRoleId },
    }).body;

    const db = await this.db();
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO service_teams (id, serviceId, userId, ministryId, ministryRoleId, status, note, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'pending', null, ?, ?);`,
      [id, serviceId, validated.userId, validated.ministryId, validated.ministryRoleId || ministryRoleId, now, now]
    );

    const members = await this.getByService(serviceId);
    return members.find((m) => m.id === id)!;
  }

  async updateStatus(id: string, data: { status: string; note?: string }): Promise<void> {
    const db = await this.db();
    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE service_teams SET status = ?, note = ?, updatedAt = ? WHERE id = ?;',
      [data.status, data.note || null, now, id]
    );
  }

  async removeMember(id: string): Promise<void> {
    const db = await this.db();
    await db.runAsync('DELETE FROM service_teams WHERE id = ?;', [id]);
  }

  // Positions
  async getPositionsByService(serviceId: string): Promise<PositionRequestRecord[]> {
    const db = await this.db();
    return await db.getAllAsync<PositionRequestRecord>(
      'SELECT id, serviceId, ministryRoleId, userId, status, note, requestedAt, respondedAt, createdAt, updatedAt FROM position_requests WHERE serviceId = ?;',
      [serviceId]
    );
  }

  async createPosition(
    serviceId: string,
    data: { ministryRoleId: string; userId?: string; note?: string }
  ): Promise<PositionRequestRecord> {
    const db = await this.db();
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO position_requests (id, serviceId, ministryRoleId, userId, status, note, requestedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?);`,
      [id, serviceId, data.ministryRoleId, data.userId || null, data.note || null, now, now, now]
    );

    return {
      id,
      serviceId,
      ministryRoleId: data.ministryRoleId,
      userId: data.userId || null,
      status: 'pending',
      note: data.note || null,
      requestedAt: now,
      createdAt: now,
      updatedAt: now,
    };
  }

  async respondPosition(id: string, status: 'accepted' | 'rejected'): Promise<void> {
    const db = await this.db();
    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE position_requests SET status = ?, respondedAt = ?, updatedAt = ? WHERE id = ?;',
      [status, now, now, id]
    );
  }
}

export const teamRepository = new TeamRepository();
