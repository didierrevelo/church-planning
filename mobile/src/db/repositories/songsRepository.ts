import { getDatabase, Database } from '../database';
import { generateUUID } from '../../platform/crypto';
import { createSongSchema, updateSongSchema } from '@shared/validation/songs';

export interface SongRecord {
  id: string;
  serviceId: string;
  order: number;
  title: string;
  key?: string | null;
  chordContent?: string | null;
  bpm?: number | null;
  timeSignature?: string | null;
  lyricsUrl?: string | null;
  sheetMusicUrl?: string | null;
  youtubeLink?: string | null;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SongHistoryRecord {
  id: string;
  songId: string;
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
  modifiedById?: string | null;
  createdAt: string;
}

export class SongsRepository {
  constructor(private dbProvider = getDatabase) {}

  private async db(): Promise<Database> {
    return await this.dbProvider();
  }

  async getByService(serviceId: string): Promise<SongRecord[]> {
    const db = await this.db();
    return await db.getAllAsync<SongRecord>(
      `SELECT id, serviceId, "order", title, key, chordContent, bpm, timeSignature, lyricsUrl, sheetMusicUrl, youtubeLink, updatedById, createdAt, updatedAt
       FROM songs
       WHERE serviceId = ?
       ORDER BY "order" ASC;`,
      [serviceId]
    );
  }

  async getById(id: string): Promise<SongRecord | null> {
    const db = await this.db();
    return await db.getFirstAsync<SongRecord>(
      `SELECT id, serviceId, "order", title, key, chordContent, bpm, timeSignature, lyricsUrl, sheetMusicUrl, youtubeLink, updatedById, createdAt, updatedAt
       FROM songs
       WHERE id = ?;`,
      [id]
    );
  }

  async create(serviceId: string, data: any, userId?: string): Promise<SongRecord> {
    const validated = createSongSchema.parse({ body: data }).body;
    const db = await this.db();
    const id = generateUUID();
    const now = new Date().toISOString();

    let order = validated.order;
    if (order === undefined) {
      const last = await db.getFirstAsync<{ maxOrder: number | null }>(
        'SELECT MAX("order") as maxOrder FROM songs WHERE serviceId = ?;',
        [serviceId]
      );
      order = (last?.maxOrder !== null && last?.maxOrder !== undefined) ? last.maxOrder + 1 : 0;
    }

    await db.runAsync(
      `INSERT INTO songs (id, serviceId, "order", title, key, chordContent, bpm, timeSignature, lyricsUrl, sheetMusicUrl, youtubeLink, updatedById, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        serviceId,
        order,
        validated.title,
        validated.key || null,
        validated.chordContent || null,
        validated.bpm || null,
        validated.timeSignature || '4/4',
        validated.lyricsUrl || null,
        validated.sheetMusicUrl || null,
        validated.youtubeLink || null,
        userId || null,
        now,
        now,
      ]
    );

    return {
      id,
      serviceId,
      order,
      title: validated.title,
      key: validated.key || null,
      chordContent: validated.chordContent || null,
      bpm: validated.bpm || null,
      timeSignature: validated.timeSignature || '4/4',
      lyricsUrl: validated.lyricsUrl || null,
      sheetMusicUrl: validated.sheetMusicUrl || null,
      youtubeLink: validated.youtubeLink || null,
      updatedById: userId || null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(id: string, data: any, userId?: string): Promise<SongRecord> {
    const validated = updateSongSchema.parse({ body: data }).body;
    const db = await this.db();
    const current = await this.getById(id);
    if (!current) throw new Error('Canción no encontrada');

    const now = new Date().toISOString();
    const title = validated.title !== undefined ? validated.title : current.title;
    const order = validated.order !== undefined ? validated.order : current.order;
    const key = validated.key !== undefined ? validated.key : current.key;
    const chordContent = validated.chordContent !== undefined ? validated.chordContent : current.chordContent;
    const bpm = validated.bpm !== undefined ? validated.bpm : current.bpm;
    const timeSignature = validated.timeSignature !== undefined ? validated.timeSignature : current.timeSignature;
    const lyricsUrl = validated.lyricsUrl !== undefined ? validated.lyricsUrl : current.lyricsUrl;
    const sheetMusicUrl = validated.sheetMusicUrl !== undefined ? validated.sheetMusicUrl : current.sheetMusicUrl;
    const youtubeLink = validated.youtubeLink !== undefined ? validated.youtubeLink : current.youtubeLink;

    // Record history for changes
    if (validated.title && validated.title !== current.title) {
      await this.recordHistory(id, 'title', current.title, validated.title, userId);
    }
    if (validated.key && validated.key !== current.key) {
      await this.recordHistory(id, 'key', current.key || '', validated.key, userId);
    }
    if (validated.chordContent && validated.chordContent !== current.chordContent) {
      await this.recordHistory(id, 'chordContent', current.chordContent || '', validated.chordContent, userId);
    }

    await db.runAsync(
      `UPDATE songs
       SET title = ?, "order" = ?, key = ?, chordContent = ?, bpm = ?, timeSignature = ?, lyricsUrl = ?, sheetMusicUrl = ?, youtubeLink = ?, updatedById = ?, updatedAt = ?
       WHERE id = ?;`,
      [title, order, key, chordContent, bpm, timeSignature, lyricsUrl, sheetMusicUrl, youtubeLink, userId || current.updatedById, now, id]
    );

    return {
      ...current,
      title,
      order,
      key,
      chordContent,
      bpm,
      timeSignature,
      lyricsUrl,
      sheetMusicUrl,
      youtubeLink,
      updatedById: userId || current.updatedById,
      updatedAt: now,
    };
  }

  async delete(id: string): Promise<void> {
    const db = await this.db();
    await db.runAsync('DELETE FROM songs WHERE id = ?;', [id]);
  }

  async getHistory(songId: string): Promise<SongHistoryRecord[]> {
    const db = await this.db();
    return await db.getAllAsync<SongHistoryRecord>(
      'SELECT id, songId, field, oldValue, newValue, modifiedById, createdAt FROM song_history WHERE songId = ? ORDER BY createdAt DESC;',
      [songId]
    );
  }

  private async recordHistory(
    songId: string,
    field: string,
    oldValue: string,
    newValue: string,
    userId?: string
  ): Promise<void> {
    const db = await this.db();
    const id = generateUUID();
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO song_history (id, songId, field, oldValue, newValue, modifiedById, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [id, songId, field, oldValue, newValue, userId || null, now]
    );
  }
}

export const songsRepository = new SongsRepository();
