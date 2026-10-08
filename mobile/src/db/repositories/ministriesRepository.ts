import { getDatabase, Database } from '../database';
import { generateUUID } from '../../platform/crypto';
import { createMinistrySchema, updateMinistrySchema, createRoleSchema, updateRoleSchema } from '@shared/validation/ministries';

export interface MinistryRecord {
  id: string;
  churchId: string;
  name: string;
  isActive: boolean | number;
  createdAt: string;
  updatedAt: string;
  roles?: MinistryRoleRecord[];
}

export interface MinistryRoleRecord {
  id: string;
  ministryId: string;
  name: string;
  isActive: boolean | number;
  createdAt: string;
  updatedAt: string;
}

export class MinistriesRepository {
  constructor(private dbProvider = getDatabase) {}

  private async db(): Promise<Database> {
    return await this.dbProvider();
  }

  async getAll(churchId: string): Promise<MinistryRecord[]> {
    const db = await this.db();
    const ministries = await db.getAllAsync<MinistryRecord>(
      `SELECT id, churchId, name, isActive, createdAt, updatedAt
       FROM ministries
       WHERE churchId = ? AND isActive = 1
       ORDER BY name ASC;`,
      [churchId]
    );

    const roles = await db.getAllAsync<MinistryRoleRecord>(
      `SELECT r.id, r.ministryId, r.name, r.isActive, r.createdAt, r.updatedAt
       FROM ministry_roles r
       JOIN ministries m ON r.ministryId = m.id
       WHERE m.churchId = ? AND r.isActive = 1
       ORDER BY r.name ASC;`,
      [churchId]
    );

    const roleMap = new Map<string, MinistryRoleRecord[]>();
    for (const r of roles) {
      if (!roleMap.has(r.ministryId)) roleMap.set(r.ministryId, []);
      roleMap.get(r.ministryId)!.push(r);
    }

    return ministries.map((m) => ({
      ...m,
      roles: roleMap.get(m.id) || [],
    }));
  }

  async getById(id: string): Promise<MinistryRecord | null> {
    const db = await this.db();
    const ministry = await db.getFirstAsync<MinistryRecord>(
      'SELECT id, churchId, name, isActive, createdAt, updatedAt FROM ministries WHERE id = ?;',
      [id]
    );
    if (!ministry) return null;
    const roles = await this.getRoles(id);
    return { ...ministry, roles };
  }

  async create(churchId: string, name: string): Promise<MinistryRecord> {
    const validated = createMinistrySchema.parse({ body: { name } }).body;
    const db = await this.db();
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO ministries (id, churchId, name, isActive, createdAt, updatedAt) VALUES (?, ?, ?, 1, ?, ?);',
      [id, churchId, validated.name, now, now]
    );

    return { id, churchId, name: validated.name, isActive: 1, createdAt: now, updatedAt: now, roles: [] };
  }

  async update(id: string, data: { name?: string; isActive?: boolean }): Promise<MinistryRecord> {
    const validated = updateMinistrySchema.parse({ body: data }).body;
    const db = await this.db();
    const current = await this.getById(id);
    if (!current) throw new Error('Ministerio no encontrado');

    const name = validated.name !== undefined ? validated.name : current.name;
    const isActive = validated.isActive !== undefined ? (validated.isActive ? 1 : 0) : current.isActive;
    const now = new Date().toISOString();

    await db.runAsync(
      'UPDATE ministries SET name = ?, isActive = ?, updatedAt = ? WHERE id = ?;',
      [name, isActive, now, id]
    );

    return { ...current, name, isActive, updatedAt: now };
  }

  async getRoles(ministryId: string): Promise<MinistryRoleRecord[]> {
    const db = await this.db();
    return await db.getAllAsync<MinistryRoleRecord>(
      'SELECT id, ministryId, name, isActive, createdAt, updatedAt FROM ministry_roles WHERE ministryId = ? AND isActive = 1 ORDER BY name ASC;',
      [ministryId]
    );
  }

  async createRole(ministryId: string, name: string): Promise<MinistryRoleRecord> {
    const validated = createRoleSchema.parse({ body: { name } }).body;
    const db = await this.db();
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO ministry_roles (id, ministryId, name, isActive, createdAt, updatedAt) VALUES (?, ?, ?, 1, ?, ?);',
      [id, ministryId, validated.name, now, now]
    );

    return { id, ministryId, name: validated.name, isActive: 1, createdAt: now, updatedAt: now };
  }

  async updateRole(roleId: string, data: { name?: string; isActive?: boolean }): Promise<MinistryRoleRecord> {
    const validated = updateRoleSchema.parse({ body: data }).body;
    const db = await this.db();
    const current = await db.getFirstAsync<MinistryRoleRecord>(
      'SELECT id, ministryId, name, isActive, createdAt, updatedAt FROM ministry_roles WHERE id = ?;',
      [roleId]
    );
    if (!current) throw new Error('Rol no encontrado');

    const name = validated.name !== undefined ? validated.name : current.name;
    const isActive = validated.isActive !== undefined ? (validated.isActive ? 1 : 0) : current.isActive;
    const now = new Date().toISOString();

    await db.runAsync(
      'UPDATE ministry_roles SET name = ?, isActive = ?, updatedAt = ? WHERE id = ?;',
      [name, isActive, now, roleId]
    );

    return { ...current, name, isActive, updatedAt: now };
  }
}

export const ministriesRepository = new MinistriesRepository();
