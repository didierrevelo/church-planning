import { getDatabase, Database } from '../database';
import { generateUUID } from '../../platform/crypto';
import { createServiceSchema, updateServiceSchema } from '@shared/validation/services';

export interface ServiceRecord {
  id: string;
  churchId: string;
  title: string;
  date: string;
  time: string;
  type: string;
  status: string;
  notes?: string | null;
  templateId?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  segments?: any[];
  team?: any[];
  songs?: any[];
}

export class ServicesRepository {
  constructor(private dbProvider = getDatabase) {}

  private async db(): Promise<Database> {
    return await this.dbProvider();
  }

  async getAll(churchId: string): Promise<ServiceRecord[]> {
    const db = await this.db();
    return await db.getAllAsync<ServiceRecord>(
      `SELECT id, churchId, title, date, time, type, status, notes, templateId, createdBy, createdAt, updatedAt
       FROM services
       WHERE churchId = ?
       ORDER BY date DESC, time DESC;`,
      [churchId]
    );
  }

  async getById(id: string): Promise<ServiceRecord | null> {
    const db = await this.db();
    const service = await db.getFirstAsync<ServiceRecord>(
      `SELECT id, churchId, title, date, time, type, status, notes, templateId, createdBy, createdAt, updatedAt
       FROM services
       WHERE id = ?;`,
      [id]
    );
    if (!service) return null;

    // Fetch related segments, team, songs
    const segments = await db.getAllAsync(
      `SELECT s.id, s.serviceId, s."order", s.title, s.durationMin, s.notes, s.ministryId, s.responsibleId,
              m.name as ministryName, u.name as responsibleName
       FROM service_segments s
       LEFT JOIN ministries m ON s.ministryId = m.id
       LEFT JOIN users u ON s.responsibleId = u.id
       WHERE s.serviceId = ?
       ORDER BY s."order" ASC;`,
      [id]
    );

    const team = await db.getAllAsync(
      `SELECT st.id, st.serviceId, st.userId, st.ministryId, st.ministryRoleId, st.status, st.note,
              u.name as userName, m.name as ministryName, mr.name as roleName
       FROM service_teams st
       JOIN users u ON st.userId = u.id
       JOIN ministries m ON st.ministryId = m.id
       JOIN ministry_roles mr ON st.ministryRoleId = mr.id
       WHERE st.serviceId = ?
       ORDER BY m.name ASC, mr.name ASC;`,
      [id]
    );

    const songs = await db.getAllAsync(
      `SELECT id, serviceId, "order", title, key, lyricsUrl, sheetMusicUrl, youtubeLink, updatedById, createdAt, updatedAt
       FROM songs
       WHERE serviceId = ?
       ORDER BY "order" ASC;`,
      [id]
    );

    return {
      ...service,
      segments: segments.map((s) => ({
        ...s,
        ministry: s.ministryId ? { id: s.ministryId, name: s.ministryName } : undefined,
        responsible: s.responsibleId ? { id: s.responsibleId, name: s.responsibleName } : undefined,
      })),
      team: team.map((t) => ({
        ...t,
        user: { id: t.userId, name: t.userName },
        ministry: { id: t.ministryId, name: t.ministryName },
        ministryRole: { id: t.ministryRoleId, name: t.roleName },
      })),
      songs,
    };
  }

  async create(
    churchId: string,
    createdBy: string,
    data: { title: string; date: string; time?: string; type?: string; notes?: string; templateId?: string }
  ): Promise<ServiceRecord> {
    const validated = createServiceSchema.parse({
      body: { title: data.title, date: data.date, templateId: data.templateId },
    }).body;

    const db = await this.db();
    const id = generateUUID();
    const now = new Date().toISOString();
    const time = data.time || '10:00';
    const type = data.type || 'worship';
    const notes = data.notes || null;

    await db.runAsync(
      `INSERT INTO services (id, churchId, title, date, time, type, status, notes, templateId, createdBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'planned', ?, ?, ?, ?, ?);`,
      [id, churchId, validated.title, validated.date, time, type, notes, validated.templateId || null, createdBy, now, now]
    );

    return {
      id,
      churchId,
      title: validated.title,
      date: validated.date,
      time,
      type,
      status: 'planned',
      notes,
      templateId: validated.templateId || null,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(id: string, data: any): Promise<ServiceRecord> {
    const validated = updateServiceSchema.parse({ body: data }).body;
    const db = await this.db();
    const current = await this.getById(id);
    if (!current) throw new Error('Servicio no encontrado');

    const now = new Date().toISOString();
    const title = validated.title !== undefined ? validated.title : current.title;
    const date = validated.date !== undefined ? validated.date : current.date;
    const time = data.time !== undefined ? data.time : current.time;
    const type = data.type !== undefined ? data.type : current.type;
    const status = validated.status !== undefined ? validated.status : current.status;
    const notes = validated.notes !== undefined ? validated.notes : current.notes;

    await db.runAsync(
      `UPDATE services SET title = ?, date = ?, time = ?, type = ?, status = ?, notes = ?, updatedAt = ? WHERE id = ?;`,
      [title, date, time, type, status, notes, now, id]
    );

    return {
      ...current,
      title,
      date,
      time,
      type,
      status,
      notes,
      updatedAt: now,
    };
  }

  async delete(id: string): Promise<void> {
    const db = await this.db();
    await db.runAsync('DELETE FROM services WHERE id = ?;', [id]);
  }
}

export const servicesRepository = new ServicesRepository();
