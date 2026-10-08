import { getDatabase, Database } from '../database';
import { generateUUID, hashPasswordWithPbkdf2 } from '../../platform/crypto';
import { updateProfileSchema } from '@shared/validation/auth';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  password?: string;
  salt?: string;
  isActive: boolean | number;
  isSuperAdmin: boolean | number;
  createdAt: string;
  updatedAt: string;
}

export class UsersRepository {
  constructor(private dbProvider = getDatabase) {}

  private async db(): Promise<Database> {
    return await this.dbProvider();
  }

  async getById(id: string): Promise<UserRecord | null> {
    const db = await this.db();
    return await db.getFirstAsync<UserRecord>(
      'SELECT id, name, email, phone, isActive, isSuperAdmin, createdAt, updatedAt FROM users WHERE id = ?;',
      [id]
    );
  }

  async getByEmail(email: string, includeSecret = false): Promise<UserRecord | null> {
    const db = await this.db();
    const cols = includeSecret
      ? 'id, name, email, phone, password, salt, isActive, isSuperAdmin, createdAt, updatedAt'
      : 'id, name, email, phone, isActive, isSuperAdmin, createdAt, updatedAt';
    return await db.getFirstAsync<UserRecord>(
      `SELECT ${cols} FROM users WHERE LOWER(email) = LOWER(?);`,
      [email]
    );
  }

  async create(data: {
    id?: string;
    name: string;
    email: string;
    password: string;
    phone?: string | null;
    isSuperAdmin?: boolean;
  }): Promise<UserRecord> {
    const db = await this.db();
    const id = data.id || generateUUID();
    const now = new Date().toISOString();
    const { hash, salt } = await hashPasswordWithPbkdf2(data.password);

    await db.runAsync(
      `INSERT INTO users (id, name, email, phone, password, salt, isActive, isSuperAdmin, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?);`,
      [
        id,
        data.name.trim(),
        data.email.toLowerCase().trim(),
        data.phone || null,
        hash,
        salt,
        data.isSuperAdmin ? 1 : 0,
        now,
        now,
      ]
    );

    return {
      id,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      isActive: 1,
      isSuperAdmin: data.isSuperAdmin ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  async updateProfile(id: string, data: { name?: string; phone?: string }): Promise<UserRecord> {
    const validated = updateProfileSchema.parse({ body: data }).body;
    const db = await this.db();
    const current = await this.getById(id);
    if (!current) throw new Error('Usuario no encontrado');

    const name = validated.name !== undefined ? validated.name : current.name;
    const phone = validated.phone !== undefined ? validated.phone : current.phone;
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE users SET name = ?, phone = ?, updatedAt = ? WHERE id = ?;`,
      [name, phone, now, id]
    );

    return { ...current, name, phone, updatedAt: now };
  }

  async updatePassword(id: string, newPass: string): Promise<void> {
    const db = await this.db();
    const { hash, salt } = await hashPasswordWithPbkdf2(newPass);
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE users SET password = ?, salt = ?, updatedAt = ? WHERE id = ?;`,
      [hash, salt, now, id]
    );
  }

  async setSuperAdmin(id: string, isSuperAdmin: boolean): Promise<void> {
    const db = await this.db();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE users SET isSuperAdmin = ?, updatedAt = ? WHERE id = ?;`,
      [isSuperAdmin ? 1 : 0, now, id]
    );
  }

  async listAll(): Promise<UserRecord[]> {
    const db = await this.db();
    return await db.getAllAsync<UserRecord>(
      'SELECT id, name, email, phone, isActive, isSuperAdmin, createdAt, updatedAt FROM users ORDER BY name ASC;'
    );
  }
}

export const usersRepository = new UsersRepository();
