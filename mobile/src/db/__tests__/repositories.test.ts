import { resetDatabaseForTesting } from '../database';
import {
  churchesRepository,
  usersRepository,
  servicesRepository,
  segmentsRepository,
  ministriesRepository,
  teamRepository,
  songsRepository,
  filesRepository,
  templatesRepository,
  notificationsRepository,
  searchRepository,
  reportsRepository,
} from '../repositories';

describe('Local-First CRUD Repositories (Fase 1 Acceptance)', () => {
  beforeEach(async () => {
    await resetDatabaseForTesting();
  });

  it('performs full CRUD lifecycle on Church and Members', async () => {
    // 1. Create church
    const church = await churchesRepository.create({
      name: 'Iglesia Emmanuel',
      slug: 'emmanuel',
      address: 'Calle 10 # 5-20',
      phone: '3001234567',
    });
    expect(church.id).toBeDefined();
    expect(church.name).toBe('Iglesia Emmanuel');

    // 2. Read church
    const fetched = await churchesRepository.getById(church.id);
    expect(fetched?.slug).toBe('emmanuel');

    // 3. Update church
    const updated = await churchesRepository.update(church.id, { name: 'Iglesia Emmanuel Central' });
    expect(updated.name).toBe('Iglesia Emmanuel Central');

    // 4. Create user & Add member
    const user = await usersRepository.create({
      name: 'Pastor David',
      email: 'david@emmanuel.org',
      password: 'password123',
    });
    const member = await churchesRepository.addMember(church.id, { userId: user.id, role: 'admin' });
    expect(member.role).toBe('admin');

    const members = await churchesRepository.getMembers(church.id);
    expect(members.length).toBe(1);
    expect(members[0].user?.name).toBe('Pastor David');

    // 5. Remove member
    await churchesRepository.removeMember(church.id, user.id);
    const membersAfter = await churchesRepository.getMembers(church.id);
    expect(membersAfter.length).toBe(0);
  });

  it('performs full CRUD lifecycle on Services and Segments', async () => {
    const church = await churchesRepository.create({ name: 'IACC', slug: 'iacc' });
    const user = await usersRepository.create({ name: 'Líder Ana', email: 'ana@iacc.org', password: 'password123' });

    // 1. Create service
    const service = await servicesRepository.create(church.id, user.id, {
      title: 'Culto de Adoración',
      date: '2026-10-11T10:00:00.000Z',
      time: '10:00',
      type: 'worship',
      notes: 'Traer biblias',
    });
    expect(service.id).toBeDefined();

    // 2. Add segments
    const seg1 = await segmentsRepository.create(service.id, { title: 'Bienvenida', durationMin: 5 });
    const seg2 = await segmentsRepository.create(service.id, { title: 'Alabanza', durationMin: 30 });
    const seg3 = await segmentsRepository.create(service.id, { title: 'Prédica', durationMin: 40 });

    const segments = await segmentsRepository.getByService(service.id);
    expect(segments.length).toBe(3);
    expect(segments[0].title).toBe('Bienvenida');

    // 3. Reorder segments
    await segmentsRepository.reorder(service.id, [seg3.id, seg1.id, seg2.id]);
    const reordered = await segmentsRepository.getByService(service.id);
    expect(reordered[0].id).toBe(seg3.id);
    expect(reordered[1].id).toBe(seg1.id);
    expect(reordered[2].id).toBe(seg2.id);

    // 4. Update service
    const updatedService = await servicesRepository.update(service.id, { title: 'Culto Especial' });
    expect(updatedService.title).toBe('Culto Especial');

    // 5. Delete service (cascade deletes segments)
    await servicesRepository.delete(service.id);
    const segmentsAfter = await segmentsRepository.getByService(service.id);
    expect(segmentsAfter.length).toBe(0);
  });

  it('performs full CRUD lifecycle on Ministries and Roles', async () => {
    const church = await churchesRepository.create({ name: 'Sión', slug: 'sion' });

    const ministry = await ministriesRepository.create(church.id, 'Alabanza y Adoración');
    expect(ministry.id).toBeDefined();

    const role1 = await ministriesRepository.createRole(ministry.id, 'Voz Principal');
    const role2 = await ministriesRepository.createRole(ministry.id, 'Guitarra Eléctrica');

    const roles = await ministriesRepository.getRoles(ministry.id);
    expect(roles.length).toBe(2);

    await ministriesRepository.updateRole(role1.id, { name: 'Voz Líder' });
    const updatedRole = (await ministriesRepository.getRoles(ministry.id)).find((r) => r.id === role1.id);
    expect(updatedRole?.name).toBe('Voz Líder');

    const allMinistries = await ministriesRepository.getAll(church.id);
    expect(allMinistries.length).toBe(1);
    expect(allMinistries[0].roles?.length).toBe(2);
  });

  it('performs full CRUD lifecycle on Service Team and Positions', async () => {
    const church = await churchesRepository.create({ name: 'Bethel', slug: 'bethel' });
    const pastor = await usersRepository.create({ name: 'Pastor Carlos', email: 'carlos@bethel.org', password: 'password123' });
    const musician = await usersRepository.create({ name: 'Mateo', email: 'mateo@bethel.org', password: 'password123' });

    const service = await servicesRepository.create(church.id, pastor.id, {
      title: 'Vigilia',
      date: '2026-10-15T20:00:00.000Z',
    });

    const ministry = await ministriesRepository.create(church.id, 'Música');
    const role = await ministriesRepository.createRole(ministry.id, 'Baterista');

    // Add team member
    const teamMember = await teamRepository.addMember(service.id, {
      userId: musician.id,
      ministryId: ministry.id,
      ministryRoleId: role.id,
    });
    expect(teamMember.userId).toBe(musician.id);

    // Update status
    await teamRepository.updateStatus(teamMember.id, { status: 'confirmed', note: 'Confirmado por WhatsApp' });
    const team = await teamRepository.getByService(service.id);
    expect(team[0].status).toBe('confirmed');

    // Position request
    const position = await teamRepository.createPosition(service.id, { ministryRoleId: role.id, userId: musician.id });
    expect(position.status).toBe('pending');
    await teamRepository.respondPosition(position.id, 'accepted');
    const positions = await teamRepository.getPositionsByService(service.id);
    expect(positions[0].status).toBe('accepted');

    // Remove member
    await teamRepository.removeMember(teamMember.id);
    const teamAfter = await teamRepository.getByService(service.id);
    expect(teamAfter.length).toBe(0);
  });

  it('performs full CRUD lifecycle on Songs with SongHistory', async () => {
    const church = await churchesRepository.create({ name: 'Gracia', slug: 'gracia' });
    const user = await usersRepository.create({ name: 'Sara', email: 'sara@gracia.org', password: 'password123' });
    const service = await servicesRepository.create(church.id, user.id, { title: 'Culto', date: '2026-10-18T10:00:00.000Z' });

    // 1. Create song with ChordPro content and BPM
    const song = await songsRepository.create(service.id, {
      title: 'Cuán Grande es Él',
      key: 'G',
      chordContent: '[G]Señor mi Dios, al con[C]templar los cielos',
      bpm: 72,
      timeSignature: '4/4',
      youtubeLink: 'https://youtube.com/watch?v=123',
    }, user.id);
    expect(song.id).toBeDefined();
    expect(song.chordContent).toBe('[G]Señor mi Dios, al con[C]templar los cielos');
    expect(song.bpm).toBe(72);
    expect(song.timeSignature).toBe('4/4');

    // 2. Update song with key change and chordContent update
    await songsRepository.update(song.id, {
      key: 'A',
      chordContent: '[A]Señor mi Dios, al con[D]templar los cielos',
    }, user.id);
    const updated = await songsRepository.getById(song.id);
    expect(updated?.key).toBe('A');
    expect(updated?.chordContent).toBe('[A]Señor mi Dios, al con[D]templar los cielos');

    // 3. Verify history recorded for key and chordContent
    const history = await songsRepository.getHistory(song.id);
    expect(history.length).toBe(2);
    expect(history.some((h) => h.field === 'key' && h.newValue === 'A')).toBe(true);
    expect(history.some((h) => h.field === 'chordContent')).toBe(true);

    // 4. Delete song
    await songsRepository.delete(song.id);
    const songsAfter = await songsRepository.getByService(service.id);
    expect(songsAfter.length).toBe(0);
  });

  it('performs full CRUD lifecycle on Files', async () => {
    const church = await churchesRepository.create({ name: 'Fe', slug: 'fe' });
    const user = await usersRepository.create({ name: 'Luis', email: 'luis@fe.org', password: 'password123' });
    const service = await servicesRepository.create(church.id, user.id, { title: 'Culto', date: '2026-10-18T10:00:00.000Z' });

    const file = await filesRepository.upload(service.id, user.id, {
      filename: 'orden_del_culto.pdf',
      filetype: 'pdf',
      filesize: 2048,
    });
    expect(file.id).toBeDefined();
    expect(file.name).toBe('orden_del_culto.pdf');

    const files = await filesRepository.getByService(service.id);
    expect(files.length).toBe(1);

    await filesRepository.delete(file.id);
    const filesAfter = await filesRepository.getByService(service.id);
    expect(filesAfter.length).toBe(0);
  });

  it('performs full CRUD lifecycle on Templates and Applying them', async () => {
    const church = await churchesRepository.create({ name: 'Vida', slug: 'vida' });
    const user = await usersRepository.create({ name: 'Marta', email: 'marta@vida.org', password: 'password123' });

    // 1. Create template
    const template = await templatesRepository.create(church.id, {
      name: 'Plantilla Culto Dominical',
      description: 'Estructura estándar de domingo',
      segments: [
        { title: 'Oración Inicial', durationMin: 5 },
        { title: 'Alabanza', durationMin: 25 },
        { title: 'Mensaje', durationMin: 35 },
      ],
    });
    expect(template.id).toBeDefined();
    expect(template.segments?.length).toBe(3);

    // 2. Create blank service and apply template
    const service = await servicesRepository.create(church.id, user.id, {
      title: 'Domingo 25',
      date: '2026-10-25T10:00:00.000Z',
    });
    await templatesRepository.apply(template.id, service.id);

    // 3. Verify service now has the segments from template
    const serviceSegments = await segmentsRepository.getByService(service.id);
    expect(serviceSegments.length).toBe(3);
    expect(serviceSegments[0].title).toBe('Oración Inicial');
    expect(serviceSegments[1].title).toBe('Alabanza');
    expect(serviceSegments[2].title).toBe('Mensaje');
  });

  it('performs full CRUD lifecycle on Notifications', async () => {
    const church = await churchesRepository.create({ name: 'Esperanza', slug: 'esperanza' });
    const user = await usersRepository.create({ name: 'Jorge', email: 'jorge@esp.org', password: 'password123' });

    await notificationsRepository.create({
      userId: user.id,
      churchId: church.id,
      type: 'team_assigned',
      message: 'Has sido asignado al culto del domingo',
    });

    const unreadBefore = await notificationsRepository.getUnreadCount(user.id, church.id);
    expect(unreadBefore).toBe(1);

    const { data: list } = await notificationsRepository.getAll(user.id, church.id);
    expect(list.length).toBe(1);

    await notificationsRepository.markRead(list[0].id);
    const unreadAfter = await notificationsRepository.getUnreadCount(user.id, church.id);
    expect(unreadAfter).toBe(0);
  });

  it('performs Search across multiple entities and generates Reports', async () => {
    const church = await churchesRepository.create({ name: 'Roca Fuerte', slug: 'roca' });
    const user = await usersRepository.create({ name: 'Pedro Roca', email: 'pedro@roca.org', password: 'password123' });
    await churchesRepository.addMember(church.id, { userId: user.id, role: 'member' });

    const service = await servicesRepository.create(church.id, user.id, {
      title: 'Culto de Jóvenes',
      date: '2026-10-20T18:00:00.000Z',
      type: 'youth',
    });

    await songsRepository.create(service.id, { title: 'Roca Eterna', key: 'D' });
    await ministriesRepository.create(church.id, 'Ministerio de Jóvenes');

    // Search for "Jóvenes"
    const searchRes = await searchRepository.search(church.id, 'Jóvenes');
    expect(searchRes.services.length).toBe(1);
    expect(searchRes.ministries.length).toBe(1);

    // Dashboard report
    const dashboard = await reportsRepository.getDashboard(church.id);
    expect(dashboard.totalServices).toBe(1);
    expect(dashboard.totalSongs).toBe(1);
    expect(dashboard.totalMembers).toBe(1);
    expect(dashboard.totalMinistries).toBe(1);
  });
});
