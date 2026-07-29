import { prisma } from '../lib/prisma';

interface AssignmentResult {
  userId: string;
  userName: string;
  ministryId: string;
  ministryName: string;
  ministryRoleId: string;
  roleName: string;
}

export async function assignTeam(
  churchId: string,
  serviceId: string,
  triggeredBy?: string
): Promise<{ assignments: AssignmentResult[]; log: string[] }> {
  const log: string[] = [];

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      team: { include: { ministry: true, ministryRole: true } },
      segments: { include: { ministry: true } },
    },
  });

  if (!service || service.churchId !== churchId) {
    throw new Error('Service not found');
  }

  const segmentMinistries = service.segments
    .filter((s) => s.ministryId)
    .map((s) => s.ministry!);
  const uniqueMinistries = [...new Map(segmentMinistries.map((m) => [m.id, m])).values()];

  log.push(`Servicio: "${service.title}" (${uniqueMinistries.length} ministerios necesarios)`);

  const existingAssignments = service.team.map((t) => t.userId);
  log.push(`Miembros ya asignados: ${existingAssignments.length}`);

  const assignments: AssignmentResult[] = [];

  for (const ministry of uniqueMinistries) {
    log.push(`\nBuscando miembros para: ${ministry.name}`);

    const roles = await prisma.ministryRole.findMany({
      where: { ministryId: ministry.id, isActive: true },
    });

    const members = await prisma.userMinistryRole.findMany({
      where: {
        ministryId: ministry.id,
        userId: { notIn: existingAssignments },
      },
      include: {
        user: { select: { id: true, name: true } },
        ministryRole: true,
      },
    });

    log.push(`  Roles disponibles: ${roles.map((r) => r.name).join(', ')}`);
    log.push(`  Miembros disponibles: ${members.length}`);

    const leaders = members.filter((m) => m.isLeader);
    const regulars = members.filter((m) => !m.isLeader);
    const prioritized = [...leaders, ...regulars];

    for (const role of roles) {
      const candidate = prioritized.find(
        (m) => m.ministryRoleId === role.id && !existingAssignments.includes(m.userId)
      );
      if (candidate) {
        assignments.push({
          userId: candidate.userId,
          userName: candidate.user.name,
          ministryId: ministry.id,
          ministryName: ministry.name,
          ministryRoleId: role.id,
          roleName: role.name,
        });
        existingAssignments.push(candidate.userId);
        log.push(`  → ${candidate.user.name} asignado como ${role.name}`);
      } else {
        log.push(`  ⚠ No hay disponible para: ${role.name}`);
      }
    }
  }

  if (assignments.length > 0) {
    await prisma.serviceTeam.createMany({
      data: assignments.map((a) => ({
        serviceId,
        userId: a.userId,
        ministryId: a.ministryId,
        ministryRoleId: a.ministryRoleId,
        status: 'pending',
      })),
    });

    log.push(`\n✅ ${assignments.length} miembros asignados exitosamente`);

    const notifications = assignments.map((a) => ({
      userId: a.userId,
      churchId,
      type: 'team_assigned',
      message: `Has sido asignado a "${service.title}" como ${a.roleName} en ${a.ministryName}`,
      referenceId: serviceId,
      referenceType: 'service',
    }));
    await prisma.notification.createMany({ data: notifications });
    log.push(`📬 ${notifications.length} notificaciones enviadas`);
  } else {
    log.push('\n⚠ No se pudieron hacer asignaciones');
  }

  await prisma.agentRun.create({
    data: {
      churchId,
      type: 'assign-team',
      status: assignments.length > 0 ? 'completed' : 'completed_no_assignments',
      input: JSON.stringify({ serviceId }),
      output: JSON.stringify({ assignments, log }),
      triggeredBy,
    },
  });

  return { assignments, log };
}
