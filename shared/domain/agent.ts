import { getDatabase, Database } from '../../mobile/src/db/database';
import { generateUUID } from '../../mobile/src/platform/crypto';
import { notificationsRepository, agentRepository } from '../../mobile/src/db/repositories';

export interface AssignmentResult {
  userId: string;
  userName: string;
  ministryId: string;
  ministryName: string;
  ministryRoleId: string;
  roleName: string;
}

export async function assignTeamLocal(
  churchId: string,
  serviceId: string,
  triggeredBy?: string,
  dbProvider = getDatabase
): Promise<{ assignments: AssignmentResult[]; log: string[] }> {
  const log: string[] = [];
  const db: Database = await dbProvider();

  const service = await db.getFirstAsync<{ id: string; churchId: string; title: string; date: string }>(
    'SELECT id, churchId, title, date FROM services WHERE id = ?;',
    [serviceId]
  );

  if (!service || service.churchId !== churchId) {
    throw new Error('Servicio no encontrado');
  }

  // Load blackout dates covering the service date
  const serviceDateDay = service.date ? service.date.slice(0, 10) : '';
  const blackoutRows = await db.getAllAsync<{ userId: string; startDate: string; endDate: string; reason?: string }>(
    'SELECT userId, startDate, endDate, reason FROM blackout_dates;'
  );
  const blackoutUserMap = new Map<string, string>();
  for (const bo of blackoutRows) {
    const startDay = bo.startDate.slice(0, 10);
    const endDay = bo.endDate.slice(0, 10);
    if (serviceDateDay >= startDay && serviceDateDay <= endDay) {
      blackoutUserMap.set(bo.userId, bo.reason || 'Fecha no disponible');
    }
  }

  // Anti-fatigue check: find users who served within 14 days before the service date
  const recentlyServedUserIds = new Set<string>();
  if (service.date) {
    const serviceTime = new Date(service.date).getTime();
    const fourteenDaysAgo = new Date(serviceTime - 14 * 24 * 60 * 60 * 1000).toISOString();
    const recentRows = await db.getAllAsync<{ userId: string }>(
      `SELECT DISTINCT st.userId
       FROM service_teams st
       JOIN services s ON st.serviceId = s.id
       WHERE s.churchId = ?
         AND s.id != ?
         AND s.date >= ?
         AND s.date <= ?;`,
      [churchId, serviceId, fourteenDaysAgo, service.date]
    );
    for (const r of recentRows) {
      recentlyServedUserIds.add(r.userId);
    }
  }

  // Find ministries involved in segments
  const segments = await db.getAllAsync<{ ministryId: string; ministryName: string }>(
    `SELECT s.ministryId, m.name as ministryName
     FROM service_segments s
     JOIN ministries m ON s.ministryId = m.id
     WHERE s.serviceId = ? AND s.ministryId IS NOT NULL;`,
    [serviceId]
  );

  const uniqueMinistries = [...new Map(segments.map((s) => [s.ministryId, s.ministryName])).entries()]
    .map(([id, name]) => ({ id, name }));

  log.push(`Servicio: "${service.title}" (${uniqueMinistries.length} ministerios necesarios)`);

  // Existing assignments
  const existingRows = await db.getAllAsync<{ userId: string }>(
    'SELECT userId FROM service_teams WHERE serviceId = ?;',
    [serviceId]
  );
  const existingAssignments = existingRows.map((r) => r.userId);
  log.push(`Miembros ya asignados: ${existingAssignments.length}`);

  const assignments: AssignmentResult[] = [];

  for (const ministry of uniqueMinistries) {
    log.push(`\nBuscando miembros para: ${ministry.name}`);

    const roles = await db.getAllAsync<{ id: string; name: string }>(
      'SELECT id, name FROM ministry_roles WHERE ministryId = ? AND isActive = 1;',
      [ministry.id]
    );

    const members = await db.getAllAsync<{
      userId: string;
      userName: string;
      ministryRoleId: string;
      roleName: string;
      isLeader: number;
    }>(
      `SELECT umr.userId, u.name as userName, umr.ministryRoleId, mr.name as roleName, umr.isLeader
       FROM user_ministry_roles umr
       JOIN users u ON umr.userId = u.id
       JOIN ministry_roles mr ON umr.ministryRoleId = mr.id
       WHERE umr.ministryId = ? AND u.isActive = 1;`,
      [ministry.id]
    );

    // Filter out members with active blackout dates
    const availableMembers = members.filter((m) => {
      if (blackoutUserMap.has(m.userId)) {
        const reason = blackoutUserMap.get(m.userId);
        log.push(`  ⚠ ${m.userName} no disponible por bloqueo de fecha (blackout: ${reason})`);
        return false;
      }
      return true;
    });

    log.push(`  Roles disponibles: ${roles.map((r) => r.name).join(', ')}`);
    log.push(`  Miembros disponibles: ${availableMembers.length}`);

    // Prioritization:
    // 1. Leaders first (isLeader = 1 before 0)
    // 2. Anti-fatigue rotation: prefer members who have NOT served recently
    const prioritized = [...availableMembers].sort((a, b) => {
      if (b.isLeader !== a.isLeader) {
        return b.isLeader - a.isLeader;
      }
      const aRecent = recentlyServedUserIds.has(a.userId) ? 1 : 0;
      const bRecent = recentlyServedUserIds.has(b.userId) ? 1 : 0;
      if (aRecent !== bRecent) {
        return aRecent - bRecent; // Rested (0) comes before tired (1)
      }
      return 0;
    });

    for (const role of roles) {
      const candidate = prioritized.find(
        (m) => m.ministryRoleId === role.id && !existingAssignments.includes(m.userId)
      );

      if (candidate) {
        assignments.push({
          userId: candidate.userId,
          userName: candidate.userName,
          ministryId: ministry.id,
          ministryName: ministry.name,
          ministryRoleId: role.id,
          roleName: role.name,
        });
        existingAssignments.push(candidate.userId);
        log.push(`  → ${candidate.userName} asignado como ${role.name}`);
      } else {
        log.push(`  ⚠ No hay disponible para: ${role.name}`);
      }
    }
  }

  if (assignments.length > 0) {
    const now = new Date().toISOString();
    await db.withTransactionAsync(async () => {
      for (const a of assignments) {
        const id = generateUUID();
        await db.runAsync(
          `INSERT INTO service_teams (id, serviceId, userId, ministryId, ministryRoleId, status, note, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 'pending', null, ?, ?);`,
          [id, serviceId, a.userId, a.ministryId, a.ministryRoleId, now, now]
        );

        await notificationsRepository.create({
          userId: a.userId,
          churchId,
          type: 'team_assigned',
          message: `Has sido asignado a "${service.title}" como ${a.roleName} en ${a.ministryName}`,
          referenceId: serviceId,
          referenceType: 'service',
        });
      }
    });

    log.push(`\n✅ ${assignments.length} miembros asignados exitosamente`);
    log.push(`📬 ${assignments.length} notificaciones locales creadas`);
  } else {
    log.push('\n⚠ No se pudieron hacer asignaciones');
  }

  await agentRepository.createRun({
    churchId,
    type: 'assign-team',
    status: assignments.length > 0 ? 'completed' : 'completed_no_assignments',
    input: { serviceId },
    output: { assignments, log },
    triggeredBy,
  });

  return { assignments, log };
}
