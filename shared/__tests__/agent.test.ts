import { resetDatabaseForTesting, getDatabase } from '../../mobile/src/db/database';
import {
  churchesRepository,
  usersRepository,
  servicesRepository,
  segmentsRepository,
  ministriesRepository,
  teamRepository,
} from '../../mobile/src/db/repositories';
import { assignTeamLocal } from '../domain/agent';

describe('Offline Intelligent Agent (Fase 4 Algorithm / TDD)', () => {
  beforeEach(async () => {
    await resetDatabaseForTesting();
  });

  it('automatically assigns team members based on ministry roles and priority', async () => {
    const db = await getDatabase();
    const church = await churchesRepository.create({ name: 'IACC Central', slug: 'iacc-central' });
    const pastor = await usersRepository.create({ name: 'Pastor', email: 'pastor@iacc.org', password: '123' });
    const musician1 = await usersRepository.create({ name: 'Juan Baterista', email: 'juan@iacc.org', password: '123' });
    const musician2 = await usersRepository.create({ name: 'Pedro Guitarra (Líder)', email: 'pedro@iacc.org', password: '123' });

    const ministry = await ministriesRepository.create(church.id, 'Alabanza');
    const roleBateria = await ministriesRepository.createRole(ministry.id, 'Batería');
    const roleGuitarra = await ministriesRepository.createRole(ministry.id, 'Guitarra');

    // Register user ministry roles (musician2 is leader)
    await db.runAsync(
      `INSERT INTO user_ministry_roles (id, userId, ministryId, ministryRoleId, isLeader, createdAt, updatedAt)
       VALUES ('umr-1', ?, ?, ?, 0, datetime('now'), datetime('now')),
              ('umr-2', ?, ?, ?, 1, datetime('now'), datetime('now'));`,
      [musician1.id, ministry.id, roleBateria.id, musician2.id, ministry.id, roleGuitarra.id]
    );

    // Create service and add segment with this ministry
    const service = await servicesRepository.create(church.id, pastor.id, {
      title: 'Culto Dominical con Alabanza',
      date: '2026-10-18T10:00:00.000Z',
    });
    await segmentsRepository.create(service.id, {
      title: 'Momento de Alabanza',
      durationMin: 30,
      ministryId: ministry.id,
    });

    // Run offline agent
    const result = await assignTeamLocal(church.id, service.id, pastor.id);

    expect(result.assignments.length).toBe(2);
    const assignedUserIds = result.assignments.map((a) => a.userId);
    expect(assignedUserIds).toContain(musician1.id);
    expect(assignedUserIds).toContain(musician2.id);

    // Verify service team in database
    const team = await teamRepository.getByService(service.id);
    expect(team.length).toBe(2);
  });

  it('excludes volunteers who have an active blackout date covering the service date', async () => {
    const db = await getDatabase();
    const church = await churchesRepository.create({ name: 'IACC Sur', slug: 'iacc-sur' });
    const pastor = await usersRepository.create({ name: 'Pastor Sur', email: 'pastor.sur@iacc.org', password: '123' });
    const singer1 = await usersRepository.create({ name: 'Líder Vocal (En Vacaciones)', email: 'vocal1@iacc.org', password: '123' });
    const singer2 = await usersRepository.create({ name: 'Vocal Suplente', email: 'vocal2@iacc.org', password: '123' });

    const ministry = await ministriesRepository.create(church.id, 'Alabanza');
    const roleVoz = await ministriesRepository.createRole(ministry.id, 'Voz Principal');

    // Both have Voz role, singer1 is leader
    await db.runAsync(
      `INSERT INTO user_ministry_roles (id, userId, ministryId, ministryRoleId, isLeader, createdAt, updatedAt)
       VALUES ('umr-s1', ?, ?, ?, 1, datetime('now'), datetime('now')),
              ('umr-s2', ?, ?, ?, 0, datetime('now'), datetime('now'));`,
      [singer1.id, ministry.id, roleVoz.id, singer2.id, ministry.id, roleVoz.id]
    );

    // Register blackout date for singer1 covering October 18
    await db.runAsync(
      `INSERT INTO blackout_dates (id, userId, startDate, endDate, reason, createdAt, updatedAt)
       VALUES ('bo-1', ?, '2026-10-15', '2026-10-22', 'Vacaciones familiares', datetime('now'), datetime('now'));`,
      [singer1.id]
    );

    // Create service on October 18
    const service = await servicesRepository.create(church.id, pastor.id, {
      title: 'Culto Especial',
      date: '2026-10-18T10:00:00.000Z',
    });
    await segmentsRepository.create(service.id, {
      title: 'Apertura',
      durationMin: 20,
      ministryId: ministry.id,
    });

    const result = await assignTeamLocal(church.id, service.id, pastor.id);

    // Singer1 must be excluded, singer2 should be assigned instead
    expect(result.assignments.length).toBe(1);
    expect(result.assignments[0].userId).toBe(singer2.id);
    expect(result.assignments[0].userName).toBe('Vocal Suplente');
    expect(result.log.some((l) => l.includes('bloqueo de fecha') || l.includes('blackout'))).toBe(true);
  });

  it('prioritizes volunteers who have not served recently to prevent fatigue', async () => {
    const db = await getDatabase();
    const church = await churchesRepository.create({ name: 'IACC Norte', slug: 'iacc-norte' });
    const pastor = await usersRepository.create({ name: 'Pastor Norte', email: 'pastor.norte@iacc.org', password: '123' });
    const pianistTired = await usersRepository.create({ name: 'Pianista Agotado', email: 'tired@iacc.org', password: '123' });
    const pianistRested = await usersRepository.create({ name: 'Pianista Descansado', email: 'rested@iacc.org', password: '123' });

    const ministry = await ministriesRepository.create(church.id, 'Alabanza');
    const rolePiano = await ministriesRepository.createRole(ministry.id, 'Teclados');

    // Both have the same role and neither is leader
    await db.runAsync(
      `INSERT INTO user_ministry_roles (id, userId, ministryId, ministryRoleId, isLeader, createdAt, updatedAt)
       VALUES ('umr-p1', ?, ?, ?, 0, datetime('now'), datetime('now')),
              ('umr-p2', ?, ?, ?, 0, datetime('now'), datetime('now'));`,
      [pianistTired.id, ministry.id, rolePiano.id, pianistRested.id, ministry.id, rolePiano.id]
    );

    // Pianist tired served 7 days ago (October 11)
    const prevService = await servicesRepository.create(church.id, pastor.id, {
      title: 'Culto Pasado',
      date: '2026-10-11T10:00:00.000Z',
    });
    await db.runAsync(
      `INSERT INTO service_teams (id, serviceId, userId, ministryId, ministryRoleId, status, createdAt, updatedAt)
       VALUES ('st-prev', ?, ?, ?, ?, 'confirmed', datetime('now'), datetime('now'));`,
      [prevService.id, pianistTired.id, ministry.id, rolePiano.id]
    );

    // Current service on October 18
    const currentService = await servicesRepository.create(church.id, pastor.id, {
      title: 'Culto Actual',
      date: '2026-10-18T10:00:00.000Z',
    });
    await segmentsRepository.create(currentService.id, {
      title: 'Adoración',
      durationMin: 25,
      ministryId: ministry.id,
    });

    const result = await assignTeamLocal(church.id, currentService.id, pastor.id);

    // Pianist rested should be chosen over tired pianist
    expect(result.assignments.length).toBe(1);
    expect(result.assignments[0].userId).toBe(pianistRested.id);
  });
});
