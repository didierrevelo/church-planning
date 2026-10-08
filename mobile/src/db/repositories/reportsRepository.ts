import { getDatabase, Database } from '../database';

export interface DashboardReport {
  totalServices: number;
  servicesThisMonth: number;
  servicesThisYear: number;
  totalSongs: number;
  totalMembers: number;
  totalMinistries: number;
  upcomingServices: any[];
  recentServices: any[];
}

export class ReportsRepository {
  constructor(private dbProvider = getDatabase) {}

  private async db(): Promise<Database> {
    return await this.dbProvider();
  }

  async getDashboard(churchId: string): Promise<DashboardReport> {
    const db = await this.db();
    const now = new Date();
    const startOfMonthIso = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfYearIso = new Date(now.getFullYear(), 0, 1).toISOString();
    const nowIso = now.toISOString();

    const [
      totalServicesRow,
      servicesThisMonthRow,
      servicesThisYearRow,
      totalSongsRow,
      totalMembersRow,
      totalMinistriesRow,
      upcomingServices,
      recentServices,
    ] = await Promise.all([
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM services WHERE churchId = ?;', [churchId]),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM services WHERE churchId = ? AND date >= ?;', [churchId, startOfMonthIso]),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM services WHERE churchId = ? AND date >= ?;', [churchId, startOfYearIso]),
      db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM songs s JOIN services srv ON s.serviceId = srv.id WHERE srv.churchId = ?;',
        [churchId]
      ),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM user_churches WHERE churchId = ?;', [churchId]),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM ministries WHERE churchId = ? AND isActive = 1;', [churchId]),
      db.getAllAsync(
        'SELECT id, title, date, status FROM services WHERE churchId = ? AND date >= ? ORDER BY date ASC LIMIT 5;',
        [churchId, nowIso]
      ),
      db.getAllAsync(
        'SELECT id, title, date, status, type FROM services WHERE churchId = ? ORDER BY date DESC LIMIT 5;',
        [churchId]
      ),
    ]);

    return {
      totalServices: totalServicesRow?.count || 0,
      servicesThisMonth: servicesThisMonthRow?.count || 0,
      servicesThisYear: servicesThisYearRow?.count || 0,
      totalSongs: totalSongsRow?.count || 0,
      totalMembers: totalMembersRow?.count || 0,
      totalMinistries: totalMinistriesRow?.count || 0,
      upcomingServices,
      recentServices,
    };
  }

  async getMonthly(churchId: string, year = new Date().getFullYear()): Promise<any> {
    const db = await this.db();
    const startIso = new Date(year, 0, 1).toISOString();
    const endIso = new Date(year + 1, 0, 1).toISOString();

    const services = await db.getAllAsync<{ id: string; title: string; date: string; type: string; status: string }>(
      'SELECT id, title, date, type, status FROM services WHERE churchId = ? AND date >= ? AND date < ? ORDER BY date ASC;',
      [churchId, startIso, endIso]
    );

    const monthly = Array.from({ length: 12 }, (_, i) => {
      const monthServices = services.filter((s) => new Date(s.date).getMonth() === i);
      return {
        month: i + 1,
        label: new Date(year, i).toLocaleString('es-ES', { month: 'long' }),
        count: monthServices.length,
        worship: monthServices.filter((s) => s.type === 'worship').length,
        youth: monthServices.filter((s) => s.type === 'youth').length,
        other: monthServices.filter((s) => s.type !== 'worship' && s.type !== 'youth').length,
      };
    });

    return { year, monthly, total: services.length };
  }
}

export const reportsRepository = new ReportsRepository();
