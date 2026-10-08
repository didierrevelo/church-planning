import { getDatabase, Database } from '../database';

export interface SearchResults {
  services: any[];
  songs: any[];
  members: any[];
  ministries: any[];
}

export class SearchRepository {
  constructor(private dbProvider = getDatabase) {}

  private async db(): Promise<Database> {
    return await this.dbProvider();
  }

  async search(churchId: string, q: string, types?: string): Promise<SearchResults> {
    const trimmed = (q || '').trim();
    if (!trimmed) {
      return { services: [], songs: [], members: [], ministries: [] };
    }

    const typeList = (types || 'services,songs,members,ministries').split(',');
    const likeQuery = `%${trimmed}%`;
    const db = await this.db();

    const [services, songs, members, ministries] = await Promise.all([
      typeList.includes('services')
        ? db.getAllAsync(
            `SELECT id, title, date, type, status
             FROM services
             WHERE churchId = ? AND title LIKE ?
             ORDER BY date DESC
             LIMIT 10;`,
            [churchId, likeQuery]
          )
        : Promise.resolve([]),

      typeList.includes('songs')
        ? db.getAllAsync(
            `SELECT s.id, s.title, s.key, s.serviceId
             FROM songs s
             JOIN services srv ON s.serviceId = srv.id
             WHERE srv.churchId = ? AND s.title LIKE ?
             ORDER BY s.createdAt DESC
             LIMIT 10;`,
            [churchId, likeQuery]
          )
        : Promise.resolve([]),

      typeList.includes('members')
        ? db.getAllAsync<{ id: string; name: string; role: string }>(
            `SELECT u.id, u.name, uc.role
             FROM user_churches uc
             JOIN users u ON uc.userId = u.id
             WHERE uc.churchId = ? AND u.name LIKE ?
             LIMIT 10;`,
            [churchId, likeQuery]
          ).then((rows) => rows.map((r) => ({ user: { id: r.id, name: r.name }, role: r.role })))
        : Promise.resolve([]),

      typeList.includes('ministries')
        ? db.getAllAsync(
            `SELECT id, name, isActive
             FROM ministries
             WHERE churchId = ? AND name LIKE ?
             LIMIT 10;`,
            [churchId, likeQuery]
          )
        : Promise.resolve([]),
    ]);

    return { services, songs, members, ministries };
  }
}

export const searchRepository = new SearchRepository();
