import { getDatabase, Database } from '../database';
import { generateUUID } from '../../platform/crypto';
import { createTemplateSchema, updateTemplateSchema } from '@shared/validation/templates';

export interface ServiceTemplateRecord {
  id: string;
  churchId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  segments?: ServiceTemplateSegmentRecord[];
}

export interface ServiceTemplateSegmentRecord {
  id: string;
  templateId: string;
  order: number;
  title: string;
  durationMin?: number | null;
  notes?: string | null;
  ministryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class TemplatesRepository {
  constructor(private dbProvider = getDatabase) {}

  private async db(): Promise<Database> {
    return await this.dbProvider();
  }

  async getAll(churchId: string): Promise<ServiceTemplateRecord[]> {
    const db = await this.db();
    const templates = await db.getAllAsync<ServiceTemplateRecord>(
      'SELECT id, churchId, name, description, createdAt, updatedAt FROM service_templates WHERE churchId = ? ORDER BY name ASC;',
      [churchId]
    );

    const segments = await db.getAllAsync<ServiceTemplateSegmentRecord>(
      `SELECT sts.id, sts.templateId, sts."order", sts.title, sts.durationMin, sts.notes, sts.ministryId, sts.createdAt, sts.updatedAt
       FROM service_template_segments sts
       JOIN service_templates st ON sts.templateId = st.id
       WHERE st.churchId = ?
       ORDER BY sts."order" ASC;`,
      [churchId]
    );

    const segMap = new Map<string, ServiceTemplateSegmentRecord[]>();
    for (const s of segments) {
      if (!segMap.has(s.templateId)) segMap.set(s.templateId, []);
      segMap.get(s.templateId)!.push(s);
    }

    return templates.map((t) => ({
      ...t,
      segments: segMap.get(t.id) || [],
    }));
  }

  async getById(id: string): Promise<ServiceTemplateRecord | null> {
    const db = await this.db();
    const template = await db.getFirstAsync<ServiceTemplateRecord>(
      'SELECT id, churchId, name, description, createdAt, updatedAt FROM service_templates WHERE id = ?;',
      [id]
    );
    if (!template) return null;

    const segments = await db.getAllAsync<ServiceTemplateSegmentRecord>(
      'SELECT id, templateId, "order", title, durationMin, notes, ministryId, createdAt, updatedAt FROM service_template_segments WHERE templateId = ? ORDER BY "order" ASC;',
      [id]
    );

    return { ...template, segments };
  }

  async create(
    churchId: string,
    data: { name: string; description?: string; segments: { title: string; durationMin?: number; notes?: string; ministryId?: string | null }[] }
  ): Promise<ServiceTemplateRecord> {
    const validated = createTemplateSchema.parse({ body: data }).body;
    const db = await this.db();
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'INSERT INTO service_templates (id, churchId, name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?);',
        [id, churchId, validated.name, validated.description || null, now, now]
      );

      for (let i = 0; i < validated.segments.length; i++) {
        const seg = validated.segments[i];
        const segId = generateUUID();
        await db.runAsync(
          `INSERT INTO service_template_segments (id, templateId, "order", title, durationMin, notes, ministryId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [segId, id, i, seg.title, seg.durationMin || null, seg.notes || null, seg.ministryId || null, now, now]
        );
      }
    });

    return (await this.getById(id))!;
  }

  async update(id: string, data: any): Promise<ServiceTemplateRecord> {
    const validated = updateTemplateSchema.parse({ body: data }).body;
    const db = await this.db();
    const current = await this.getById(id);
    if (!current) throw new Error('Plantilla no encontrada');

    const now = new Date().toISOString();
    const name = validated.name !== undefined ? validated.name : current.name;
    const description = validated.description !== undefined ? validated.description : current.description;

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'UPDATE service_templates SET name = ?, description = ?, updatedAt = ? WHERE id = ?;',
        [name, description, now, id]
      );

      if (validated.segments) {
        await db.runAsync('DELETE FROM service_template_segments WHERE templateId = ?;', [id]);
        for (let i = 0; i < validated.segments.length; i++) {
          const seg = validated.segments[i];
          const segId = seg.id || generateUUID();
          await db.runAsync(
            `INSERT INTO service_template_segments (id, templateId, "order", title, durationMin, notes, ministryId, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [segId, id, i, seg.title, seg.durationMin || null, seg.notes || null, seg.ministryId || null, now, now]
          );
        }
      }
    });

    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    const db = await this.db();
    await db.runAsync('DELETE FROM service_templates WHERE id = ?;', [id]);
  }

  async apply(templateId: string, serviceId: string): Promise<void> {
    const template = await this.getById(templateId);
    if (!template || !template.segments) throw new Error('Plantilla no encontrada');

    const db = await this.db();
    const now = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      // Find starting order index
      const maxRow = await db.getFirstAsync<{ maxOrder: number | null }>(
        'SELECT MAX("order") as maxOrder FROM service_segments WHERE serviceId = ?;',
        [serviceId]
      );
      let nextOrder = (maxRow?.maxOrder !== null && maxRow?.maxOrder !== undefined) ? maxRow.maxOrder + 1 : 0;

      for (const seg of template.segments || []) {
        const segId = generateUUID();
        await db.runAsync(
          `INSERT INTO service_segments (id, serviceId, "order", title, durationMin, notes, ministryId, responsibleId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, null, ?, ?);`,
          [segId, serviceId, nextOrder++, seg.title, seg.durationMin || null, seg.notes || null, seg.ministryId || null, now, now]
        );
      }

      await db.runAsync('UPDATE services SET templateId = ?, updatedAt = ? WHERE id = ?;', [templateId, now, serviceId]);
    });
  }
}

export const templatesRepository = new TemplatesRepository();
