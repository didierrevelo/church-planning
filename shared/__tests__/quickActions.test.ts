import {
  generateQuickActionToken,
  verifyQuickActionToken,
  executeQuickAction,
  type QuickActionPayload,
} from '../domain/quickActions';
import { resetDatabaseForTesting, getDatabase } from '../../mobile/src/db/database';
import {
  churchesRepository,
  usersRepository,
  servicesRepository,
  ministriesRepository,
} from '../../mobile/src/db/repositories';

describe('QuickAction & 1-Touch Volunteer Confirmation (DeepLink / TDD)', () => {
  const secret = 'super-secret-church-signing-key';

  beforeEach(async () => {
    await resetDatabaseForTesting();
  });

  describe('generateQuickActionToken & verifyQuickActionToken', () => {
    it('generates a signed token and verifies it successfully', () => {
      const payload: QuickActionPayload = {
        teamMemberId: 'member-101',
        serviceId: 'service-50',
        userId: 'user-juan-1',
        action: 'confirm',
        expiresAt: Date.now() + 1000 * 60 * 60 * 48, // 48h
      };

      const token = generateQuickActionToken(payload, secret);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);

      const result = verifyQuickActionToken(token, secret);
      expect(result.valid).toBe(true);
      expect(result.payload?.teamMemberId).toBe('member-101');
      expect(result.payload?.action).toBe('confirm');
    });

    it('rejects an expired token', () => {
      const payload: QuickActionPayload = {
        teamMemberId: 'member-101',
        serviceId: 'service-50',
        userId: 'user-juan-1',
        action: 'decline',
        expiresAt: Date.now() - 1000, // already expired
      };

      const token = generateQuickActionToken(payload, secret);
      const result = verifyQuickActionToken(token, secret);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('expired');
    });

    it('rejects a tampered token with invalid signature', () => {
      const payload: QuickActionPayload = {
        teamMemberId: 'member-101',
        serviceId: 'service-50',
        userId: 'user-juan-1',
        action: 'confirm',
        expiresAt: Date.now() + 1000 * 60 * 60,
      };

      const token = generateQuickActionToken(payload, secret);
      const differentSecret = 'hacked-key-different';
      const result = verifyQuickActionToken(token, differentSecret);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('invalid_signature');
    });

    it('rejects a malformed token string', () => {
      expect(verifyQuickActionToken('malformed-string', secret).valid).toBe(false);
      expect(verifyQuickActionToken('', secret).valid).toBe(false);
    });
  });

  describe('executeQuickAction', () => {
    it('updates service_teams record to confirmed when action is confirm', async () => {
      const db = await getDatabase();
      const church = await churchesRepository.create({ name: 'Central', slug: 'central' });
      const user = await usersRepository.create({ name: 'Juan', email: 'juan@test.com', password: '123' });
      const service = await servicesRepository.create(church.id, user.id, {
        title: 'Culto',
        date: '2026-10-18T10:00:00.000Z',
      });
      const ministry = await ministriesRepository.create(church.id, 'Musica');
      const role = await ministriesRepository.createRole(ministry.id, 'Guitarra');

      const now = new Date().toISOString();

      // Seed service_teams row in pending status
      await db.runAsync(
        `INSERT INTO service_teams (id, serviceId, userId, ministryId, ministryRoleId, status, createdAt, updatedAt)
         VALUES ('team-row-1', ?, ?, ?, ?, 'pending', ?, ?);`,
        [service.id, user.id, ministry.id, role.id, now, now]
      );

      const payload: QuickActionPayload = {
        teamMemberId: 'team-row-1',
        serviceId: service.id,
        userId: user.id,
        action: 'confirm',
        expiresAt: Date.now() + 1000 * 60 * 60,
      };
      const token = generateQuickActionToken(payload, secret);

      const execResult = await executeQuickAction(token, secret, getDatabase);

      expect(execResult.success).toBe(true);
      expect(execResult.action).toBe('confirm');

      // Verify DB update
      const updated = await db.getFirstAsync<{ status: string }>(
        'SELECT status FROM service_teams WHERE id = ?;',
        ['team-row-1']
      );
      expect(updated?.status).toBe('confirmed');
    });

    it('updates service_teams record to cannot_attend when action is decline', async () => {
      const db = await getDatabase();
      const church = await churchesRepository.create({ name: 'Central', slug: 'central' });
      const user = await usersRepository.create({ name: 'Pedro', email: 'pedro@test.com', password: '123' });
      const service = await servicesRepository.create(church.id, user.id, {
        title: 'Culto',
        date: '2026-10-18T10:00:00.000Z',
      });
      const ministry = await ministriesRepository.create(church.id, 'Musica');
      const role = await ministriesRepository.createRole(ministry.id, 'Bajo');

      const now = new Date().toISOString();

      // Seed service_teams row in pending status
      await db.runAsync(
        `INSERT INTO service_teams (id, serviceId, userId, ministryId, ministryRoleId, status, createdAt, updatedAt)
         VALUES ('team-row-2', ?, ?, ?, ?, 'pending', ?, ?);`,
        [service.id, user.id, ministry.id, role.id, now, now]
      );

      const payload: QuickActionPayload = {
        teamMemberId: 'team-row-2',
        serviceId: service.id,
        userId: user.id,
        action: 'decline',
        expiresAt: Date.now() + 1000 * 60 * 60,
      };
      const token = generateQuickActionToken(payload, secret);

      const execResult = await executeQuickAction(token, secret, getDatabase);

      expect(execResult.success).toBe(true);
      expect(execResult.action).toBe('decline');

      // Verify DB update
      const updated = await db.getFirstAsync<{ status: string }>(
        'SELECT status FROM service_teams WHERE id = ?;',
        ['team-row-2']
      );
      expect(updated?.status).toBe('cannot_attend');
    });
  });
});
