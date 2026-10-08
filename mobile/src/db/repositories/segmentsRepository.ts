import { getDatabase, Database } from '../database';
import { generateUUID } from '../../platform/crypto';
import { createSegmentSchema, updateSegmentSchema, reorderSegmentsSchema } from '@shared/validation';

export interface ServiceSegmentRecord {
  id: string;
  serviceId: string;
  order: number;
  title: string;
  durationMin?: number | null;
  notes?: string | null;
  ministryId?: string | null;
  responsibleId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class SegmentsRepository {
  constructor(private dbProvider = getDatabase) {}

  private async db(): Promise<Database> {
    return await this.dbProvider();
  }

  async getByService(serviceId: string): Promise<ServiceSegmentRecord[]> {
    const db = await this.db();
    return await db.getAllAsync<ServiceSegmentRecord>(
      `SELECT id, serviceId, "order", title, durationMin, notes, ministryId, responsibleId, createdAt, updatedAt
       FROM service_segments
       WHERE serviceId = ?
       ORDER BY "order" ASC;`,
      [serviceId]
    );
  }

  async create(serviceId: string, data: any): Promise<ServiceSegmentRecord> {
    const validated = createSegmentSchema.parse({ body: data }).body;
    const db = await this.db();
    const id = generateUUID();
    const now = new Date().toISOString();

    let order = validated.order;
    if (order === undefined) {
      const last = await db.getFirstAsync<{ maxOrder: number | null }>(
        'SELECT MAX("order") as maxOrder FROM service_segments WHERE serviceId = ?;',
        [serviceId]
      );
      order = (last?.maxOrder !== null && last?.maxOrder !== undefined) ? last.maxOrder + 1 : 0;
    }

    const durationMin = validated.durationMin !== undefined ? validated.durationMin : (data.duration || null);
    const ministryId = data.ministryId || null;
    const responsibleId = data.responsibleId || null;

    await db.runAsync(
      `INSERT INTO service_segments (id, serviceId, "order", title, durationMin, notes, ministryId, responsibleId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [id, serviceId, order, validated.title, durationMin, validated.notes || null, ministryId, responsibleId, now, now]
    );

    return {
      id,
      serviceId,
      order,
      title: validated.title,
      durationMin,
      notes: validated.notes || null,
      ministryId,
      responsibleId,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(id: string, data: any): Promise<ServiceSegmentRecord> {
    const validated = updateSegmentSchema.parse({ body: data }).body;
    const db = await this.db();
    const current = await db.getFirstAsync<ServiceSegmentRecord>(
      'SELECT id, serviceId, "order", title, durationMin, notes, ministryId, responsibleId, createdAt, updatedAt FROM service_segments WHERE id = ?;',
      [id]
    );
    if (!current) throw new Error('Segmento no encontrado');

    const now = new Date().toISOString();
    const title = validated.title !== undefined ? validated.title : current.title;
    const order = validated.order !== undefined ? validated.order : current.order;
    const durationMin = validated.durationMin !== undefined ? validated.durationMin : (data.duration !== undefined ? data.duration : current.durationMin);
    const notes = validated.notes !== undefined ? validated.notes : current.notes;
    const ministryId = data.ministryId !== undefined ? data.ministryId : current.ministryId;
    const responsibleId = data.responsibleId !== undefined ? data.responsibleId : current.responsibleId;

    await db.runAsync(
      `UPDATE service_segments
       SET title = ?, "order" = ?, durationMin = ?, notes = ?, ministryId = ?, responsibleId = ?, updatedAt = ?
       WHERE id = ?;`,
      [title, order, durationMin, notes, ministryId, responsibleId, now, id]
    );

    return {
      ...current,
      title,
      order,
      durationMin,
      notes,
      ministryId,
      responsibleId,
      updatedAt: now,
    };
  }

  async delete(id: string): Promise<void> {
    const db = await this.db();
    await db.runAsync('DELETE FROM service_segments WHERE id = ?;', [id]);
  }

  async reorder(serviceId: string, segmentIds: string[]): Promise<void> {
    reorderSegmentsSchema.parse({ body: { segmentIds } });
    const db = await this.db();
    const now = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      for (let i = 0; i < segmentIds.length; i++) {
        await db.runAsync(
          'UPDATE service_segments SET "order" = ?, updatedAt = ? WHERE id = ? AND serviceId = ?;',
          [i, now, segmentIds[i], serviceId]
        );
      }
    });
  }
}

export const segmentsRepository = new SegmentsRepository();
