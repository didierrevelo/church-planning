import { getDatabase, Database } from '../database';
import { generateUUID } from '../../platform/crypto';
import { uploadFileSchema } from '@shared/validation/files';

export interface FileRecord {
  id: string;
  serviceId: string;
  ministryId?: string | null;
  uploadedById: string;
  name: string;
  type: string;
  url: string;
  size: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: { id: string; name: string };
  ministry?: { id: string; name: string };
}

export class FilesRepository {
  constructor(private dbProvider = getDatabase) {}

  private async db(): Promise<Database> {
    return await this.dbProvider();
  }

  async getByService(serviceId: string): Promise<FileRecord[]> {
    const db = await this.db();
    const rows = await db.getAllAsync<{
      id: string;
      serviceId: string;
      ministryId: string | null;
      uploadedById: string;
      name: string;
      type: string;
      url: string;
      size: number;
      version: number;
      createdAt: string;
      updatedAt: string;
      userName: string;
      ministryName: string | null;
    }>(
      `SELECT f.id, f.serviceId, f.ministryId, f.uploadedById, f.name, f.type, f.url, f.size, f.version,
              f.createdAt, f.updatedAt, u.name as userName, m.name as ministryName
       FROM files f
       JOIN users u ON f.uploadedById = u.id
       LEFT JOIN ministries m ON f.ministryId = m.id
       WHERE f.serviceId = ?
       ORDER BY f.createdAt DESC;`,
      [serviceId]
    );

    return rows.map((r) => ({
      id: r.id,
      serviceId: r.serviceId,
      ministryId: r.ministryId,
      uploadedById: r.uploadedById,
      name: r.name,
      type: r.type,
      url: r.url,
      size: r.size,
      version: r.version,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      uploadedBy: { id: r.uploadedById, name: r.userName },
      ministry: r.ministryId ? { id: r.ministryId, name: r.ministryName! } : undefined,
    }));
  }

  async upload(
    serviceId: string,
    uploadedById: string,
    data: { filename: string; filetype: string; filesize: number; ministryId?: string; fileUri?: string }
  ): Promise<FileRecord> {
    const validated = uploadFileSchema.parse({ body: data }).body;
    const db = await this.db();
    const id = generateUUID();
    const now = new Date().toISOString();
    const url = data.fileUri || `local://${id}/${validated.filename}`;

    await db.runAsync(
      `INSERT INTO files (id, serviceId, ministryId, uploadedById, name, type, url, size, version, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?);`,
      [
        id,
        serviceId,
        validated.ministryId || null,
        uploadedById,
        validated.filename,
        validated.filetype,
        url,
        validated.filesize,
        now,
        now,
      ]
    );

    return {
      id,
      serviceId,
      ministryId: validated.ministryId || null,
      uploadedById,
      name: validated.filename,
      type: validated.filetype,
      url,
      size: validated.filesize,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
  }

  async delete(id: string): Promise<void> {
    const db = await this.db();
    await db.runAsync('DELETE FROM files WHERE id = ?;', [id]);
  }
}

export const filesRepository = new FilesRepository();
