import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetDatabaseForTesting } from '../../db/database';
import {
  authAPI,
  churchesAPI,
  servicesAPI,
  segmentsAPI,
  teamAPI,
  positionsAPI,
  songsAPI,
  ministriesAPI,
  templatesAPI,
  agentAPI,
  notificationsAPI,
  searchAPI,
  reportsAPI,
  adminAPI,
  superAdminAPI,
} from '../api';

describe('Local-First API Layer (Fase 2 Acceptance)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await resetDatabaseForTesting();
  });

  it('performs full auth workflow offline (register, login, me, changePassword)', async () => {
    // 1. Register
    const regRes = await authAPI.register({
      name: 'Pastor Local',
      email: 'pastor@local.church',
      password: 'password123',
      churchName: 'Iglesia Local',
      churchSlug: 'iglesia-local',
    });

    expect(regRes.data.token).toBeDefined();
    expect(regRes.data.user.email).toBe('pastor@local.church');
    expect(regRes.data.churches.length).toBe(1);

    // 2. getMe
    const meRes = await authAPI.getMe();
    expect(meRes.data.name).toBe('Pastor Local');

    // 3. Update profile
    const updateRes = await authAPI.updateProfile({ name: 'Pastor David Local', phone: '1234567890' });
    expect(updateRes.data.name).toBe('Pastor David Local');

    // 4. Change password
    const pwdRes = await authAPI.changePassword({
      currentPassword: 'password123',
      newPassword: 'newpassword123',
    });
    expect(pwdRes.data.message).toBe('Contraseña actualizada');

    // 5. Re-login with new password
    await AsyncStorage.clear();
    const loginRes = await authAPI.login('pastor@local.church', 'newpassword123');
    expect(loginRes.data.token).toBeDefined();
    expect(loginRes.data.user.name).toBe('Pastor David Local');
  });

  it('handles services, segments, team, songs, and templates completely offline', async () => {
    // Setup auth session
    await authAPI.register({
      name: 'Líder',
      email: 'lider@iglesia.org',
      password: 'pass123456',
      churchName: 'Iglesia Viva',
    });

    // 1. Create service
    const serviceRes = await servicesAPI.create({
      title: 'Culto de Adoración',
      date: '2026-10-18T10:00:00.000Z',
      time: '10:00',
    });
    const serviceId = serviceRes.data.id;
    expect(serviceId).toBeDefined();

    // 2. Add segment
    const segRes = await segmentsAPI.create(serviceId, { title: 'Bienvenida', durationMin: 10 });
    expect(segRes.data.id).toBeDefined();

    // 3. Add song
    const songRes = await songsAPI.create(serviceId, { title: 'Dios Incomparable', key: 'E' });
    expect(songRes.data.id).toBeDefined();

    // 4. Create ministry & role
    const minRes = await ministriesAPI.create('Alabanza');
    const roleRes = await ministriesAPI.createRole(minRes.data.id, 'Guitarra');

    // 5. Add team member
    const me = (await authAPI.getMe()).data;
    const teamRes = await teamAPI.addMember(serviceId, {
      userId: me.id,
      ministryId: minRes.data.id,
      ministryRoleId: roleRes.data.id,
    });
    expect(teamRes.data.userId).toBe(me.id);

    // 6. Template create and apply
    const tplRes = await templatesAPI.create({
      name: 'Plantilla Domingo',
      segments: [{ title: 'Intro', durationMin: 5 }],
    });
    expect(tplRes.data.id).toBeDefined();

    const applyRes = await templatesAPI.apply(tplRes.data.id, serviceId);
    expect(applyRes.data.success).toBe(true);

    // 7. Get full service detail
    const detailRes = await servicesAPI.getById(serviceId);
    expect(detailRes.data.segments?.length).toBeGreaterThanOrEqual(2);
    expect(detailRes.data.songs?.length).toBe(1);
    expect(detailRes.data.team?.length).toBe(1);

    // 8. Search
    const searchRes = await searchAPI.search('Adoración');
    expect(searchRes.data.services.length).toBe(1);

    // 9. Reports
    const repRes = await reportsAPI.getDashboard();
    expect(repRes.data.totalServices).toBe(1);
    expect(repRes.data.totalSongs).toBe(1);
  });
});
