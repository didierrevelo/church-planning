import { getDatabase, Database } from '../database';
import { generateUUID } from '../../platform/crypto';
import { createChurchSchema, updateChurchSchema, addMemberSchema, updateMemberSchema } from '@shared/validation/churches';

export interface ChurchRecord {
  id: string;
  name: string;
  slug: string;
  address?: string | null;
  phone?: string | null;
  isActive: boolean | number;
  createdAt: string;
  updatedAt: string;
}

export interface ChurchMemberRecord {
  id: string;
  userId: string;
  churchId: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
}

export class ChurchesRepository {
  constructor(private dbProvider = getDatabase) {}

  private async db(): Promise<Database> {
    return await this.dbProvider();
  }

  async getAll(): Promise<ChurchRecord[]> {
    const db = await this.db();
    return await db.getAllAsync<ChurchRecord>(
      'SELECT id, name, slug, address, phone, isActive, createdAt, updatedAt FROM churches WHERE isActive = 1 ORDER BY name ASC;'
    );
  }

  async getById(id: string): Promise<ChurchRecord | null> {
    const db = await this.db();
    return await db.getFirstAsync<ChurchRecord>(
      'SELECT id, name, slug, address, phone, isActive, createdAt, updatedAt FROM churches WHERE id = ?;',
      [id]
    );
  }

  async getBySlug(slug: string): Promise<ChurchRecord | null> {
    const db = await this.db();
    return await db.getFirstAsync<ChurchRecord>(
      'SELECT id, name, slug, address, phone, isActive, createdAt, updatedAt FROM churches WHERE slug = ?;',
      [slug]
    );
  }

  async create(data: { name: string; slug?: string; address?: string; phone?: string }): Promise<ChurchRecord> {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const validated = createChurchSchema.parse({
      body: { name: data.name, slug, address: data.address, phone: data.phone },
    }).body;

    const db = await this.db();
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO churches (id, name, slug, address, phone, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?);`,
      [id, validated.name, validated.slug, validated.address || null, validated.phone || null, now, now]
    );

    return {
      id,
      name: validated.name,
      slug: validated.slug,
      address: validated.address || null,
      phone: validated.phone || null,
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(id: string, data: { name?: string; address?: string; phone?: string; isActive?: boolean }): Promise<ChurchRecord> {
    const validated = updateChurchSchema.parse({ body: data }).body;
    const db = await this.db();
    const current = await this.getById(id);
    if (!current) throw new Error('Iglesia no encontrada');

    const now = new Date().toISOString();
    const name = validated.name !== undefined ? validated.name : current.name;
    const address = validated.address !== undefined ? validated.address : current.address;
    const phone = validated.phone !== undefined ? validated.phone : current.phone;
    const isActive = validated.isActive !== undefined ? (validated.isActive ? 1 : 0) : current.isActive;

    await db.runAsync(
      `UPDATE churches SET name = ?, address = ?, phone = ?, isActive = ?, updatedAt = ? WHERE id = ?;`,
      [name, address, phone, isActive, now, id]
    );

    return {
      ...current,
      name,
      address,
      phone,
      isActive,
      updatedAt: now,
    };
  }

  async getMembers(churchId: string): Promise<ChurchMemberRecord[]> {
    const db = await this.db();
    const rows = await db.getAllAsync<{
      id: string;
      userId: string;
      churchId: string;
      role: string;
      createdAt: string;
      updatedAt: string;
      userName: string;
      userEmail: string;
      userPhone: string | null;
    }>(
      `SELECT uc.id, uc.userId, uc.churchId, uc.role, uc.createdAt, uc.updatedAt,
              u.name as userName, u.email as userEmail, u.phone as userPhone
       FROM user_churches uc
       JOIN users u ON uc.userId = u.id
       WHERE uc.churchId = ?
       ORDER BY u.name ASC;`,
      [churchId]
    );

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      churchId: r.churchId,
      role: r.role,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: {
        id: r.userId,
        name: r.userName,
        email: r.userEmail,
        phone: r.userPhone,
      },
    }));
  }

  async addMember(churchId: string, data: { userId: string; role?: string }): Promise<ChurchMemberRecord> {
    const role = (data.role as any) || 'member';
    const validated = addMemberSchema.parse({ body: { userId: data.userId, role } }).body;
    const db = await this.db();
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO user_churches (id, userId, churchId, role, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [id, validated.userId, churchId, validated.role, now, now]
    );

    return {
      id,
      userId: validated.userId,
      churchId,
      role: validated.role,
      createdAt: now,
      updatedAt: now,
    };
  }

  async updateMemberRole(churchId: string, userId: string, role: string): Promise<void> {
    const validated = updateMemberSchema.parse({ body: { role: role as any } }).body;
    const db = await this.db();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE user_churches SET role = ?, updatedAt = ? WHERE churchId = ? AND userId = ?;`,
      [validated.role, now, churchId, userId]
    );
  }

  async removeMember(churchId: string, userId: string): Promise<void> {
    const db = await this.db();
    await db.runAsync(
      `DELETE FROM user_churches WHERE churchId = ? AND userId = ?;`,
      [churchId, userId]
    );
  }
}

export const churchesRepository = new ChurchesRepository();
