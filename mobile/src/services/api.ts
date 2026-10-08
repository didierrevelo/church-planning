import AsyncStorage from '@react-native-async-storage/async-storage';
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
  agentRepository,
  searchRepository,
  reportsRepository,
} from '../db/repositories';
import { assignTeamLocal } from '@shared/domain/agent';
import { verifyPasswordWithPbkdf2, generateUUID } from '../platform/crypto';
import { getDatabase } from '../db/database';

function createApiError(message: string, status = 400): any {
  const err: any = new Error(message);
  err.response = { status, data: { error: message } };
  return err;
}

async function getContext(): Promise<{ churchId: string; userId: string; user: any }> {
  const churchId = (await AsyncStorage.getItem('churchId')) || '';
  const userJson = await AsyncStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const userId = user?.id || '';
  return { churchId, userId, user };
}

export const authAPI = {
  login: async (email: string, pass: string) => {
    try {
      const user = await usersRepository.getByEmail(email, true);
      if (!user || !user.password || !user.salt) {
        throw createApiError('Credenciales inválidas', 401);
      }
      const valid = await verifyPasswordWithPbkdf2(pass, user.password, user.salt);
      if (!valid) {
        throw createApiError('Credenciales inválidas', 401);
      }

      // Fetch user churches
      const db = await getDatabase();
      const churches = await db.getAllAsync(
        `SELECT c.id, c.name, c.slug, c.address, c.phone, uc.role
         FROM churches c
         JOIN user_churches uc ON c.id = uc.churchId
         WHERE uc.userId = ? AND c.isActive = 1;`,
        [user.id]
      );

      const token = `local-token-${generateUUID()}`;
      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isSuperAdmin: Boolean(user.isSuperAdmin),
      };

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(safeUser));
      if (churches.length > 0) {
        await AsyncStorage.setItem('churchId', churches[0].id);
      }

      return { data: { token, user: safeUser, churches } };
    } catch (err: any) {
      if (err.response) throw err;
      throw createApiError(err.message, 400);
    }
  },

  register: async (data: { name: string; email: string; password: string; churchName: string; churchSlug?: string }) => {
    try {
      const existing = await usersRepository.getByEmail(data.email);
      if (existing) {
        throw createApiError('El correo electrónico ya está registrado', 400);
      }

      const user = await usersRepository.create({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      const church = await churchesRepository.create({
        name: data.churchName,
        slug: data.churchSlug,
      });

      await churchesRepository.addMember(church.id, { userId: user.id, role: 'admin' });

      const token = `local-token-${generateUUID()}`;
      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isSuperAdmin: false,
      };

      const churches = [{ ...church, role: 'admin' }];
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(safeUser));
      await AsyncStorage.setItem('churchId', church.id);

      return { data: { token, user: safeUser, churches } };
    } catch (err: any) {
      if (err.response) throw err;
      throw createApiError(err.message, 400);
    }
  },

  getMe: async () => {
    try {
      const { userId } = await getContext();
      if (!userId) throw createApiError('No autenticado', 401);
      const user = await usersRepository.getById(userId);
      if (!user) throw createApiError('Usuario no encontrado', 404);
      return { data: user };
    } catch (err: any) {
      if (err.response) throw err;
      throw createApiError(err.message, 400);
    }
  },

  updateProfile: async (data: { name?: string; phone?: string }) => {
    try {
      const { userId } = await getContext();
      if (!userId) throw createApiError('No autenticado', 401);
      const updated = await usersRepository.updateProfile(userId, data);
      await AsyncStorage.setItem('user', JSON.stringify(updated));
      return { data: updated };
    } catch (err: any) {
      if (err.response) throw err;
      throw createApiError(err.message, 400);
    }
  },

  invite: async (data: { email: string; name: string; phone?: string; churchId: string }) => {
    try {
      let user = await usersRepository.getByEmail(data.email);
      if (!user) {
        user = await usersRepository.create({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: 'password123',
        });
      }
      await churchesRepository.addMember(data.churchId, { userId: user.id, role: 'member' });
      return { data: { message: 'Miembro agregado exitosamente', user } };
    } catch (err: any) {
      if (err.response) throw err;
      throw createApiError(err.message, 400);
    }
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    try {
      const { userId } = await getContext();
      if (!userId) throw createApiError('No autenticado', 401);
      const user = await usersRepository.getById(userId);
      if (!user) throw createApiError('Usuario no encontrado', 404);

      const userWithSecrets = await usersRepository.getByEmail(user.email, true);
      const valid = await verifyPasswordWithPbkdf2(
        data.currentPassword,
        userWithSecrets?.password || '',
        userWithSecrets?.salt || ''
      );
      if (!valid) throw createApiError('Contraseña actual incorrecta', 400);

      await usersRepository.updatePassword(userId, data.newPassword);
      return { data: { message: 'Contraseña actualizada' } };
    } catch (err: any) {
      if (err.response) throw err;
      throw createApiError(err.message, 400);
    }
  },
};

export const churchesAPI = {
  getAll: async () => {
    const list = await churchesRepository.getAll();
    return { data: list };
  },
  create: async (name: string) => {
    const church = await churchesRepository.create({ name });
    return { data: church };
  },
  getMembers: async (churchId: string) => {
    const members = await churchesRepository.getMembers(churchId);
    return { data: members };
  },
  addMember: async (churchId: string, data: { userId: string; role?: string }) => {
    const member = await churchesRepository.addMember(churchId, data);
    return { data: member };
  },
  removeMember: async (churchId: string, userId: string) => {
    await churchesRepository.removeMember(churchId, userId);
    return { data: { success: true } };
  },
  update: async (churchId: string, data: { name: string; address?: string; phone?: string }) => {
    const updated = await churchesRepository.update(churchId, data);
    return { data: updated };
  },
};

export const servicesAPI = {
  getAll: async () => {
    const { churchId } = await getContext();
    const services = await servicesRepository.getAll(churchId);
    return { data: services };
  },
  getById: async (id: string) => {
    const service = await servicesRepository.getById(id);
    if (!service) throw createApiError('Servicio no encontrado', 404);
    return { data: service };
  },
  create: async (data: { title: string; date: string; time?: string; type?: string; notes?: string; templateId?: string }) => {
    const { churchId, userId } = await getContext();
    const service = await servicesRepository.create(churchId, userId, data);
    return { data: service };
  },
  update: async (id: string, data: any) => {
    const updated = await servicesRepository.update(id, data);
    return { data: updated };
  },
  delete: async (id: string) => {
    await servicesRepository.delete(id);
    return { data: { success: true } };
  },
};

export const segmentsAPI = {
  getByService: async (serviceId: string) => {
    const segments = await segmentsRepository.getByService(serviceId);
    return { data: segments };
  },
  create: async (serviceId: string, data: any) => {
    const segment = await segmentsRepository.create(serviceId, data);
    return { data: segment };
  },
  update: async (id: string, data: any) => {
    const segment = await segmentsRepository.update(id, data);
    return { data: segment };
  },
  delete: async (id: string) => {
    await segmentsRepository.delete(id);
    return { data: { success: true } };
  },
};

export const teamAPI = {
  getByService: async (serviceId: string) => {
    const team = await teamRepository.getByService(serviceId);
    return { data: team };
  },
  addMember: async (serviceId: string, data: { userId: string; ministryId: string; ministryRoleId: string }) => {
    const member = await teamRepository.addMember(serviceId, data);
    return { data: member };
  },
  updateStatus: async (id: string, data: { status: string; note?: string }) => {
    await teamRepository.updateStatus(id, data);
    return { data: { success: true } };
  },
  removeMember: async (id: string) => {
    await teamRepository.removeMember(id);
    return { data: { success: true } };
  },
};

export const positionsAPI = {
  getByService: async (serviceId: string) => {
    const positions = await teamRepository.getPositionsByService(serviceId);
    return { data: positions };
  },
  create: async (serviceId: string, data: { ministryRoleId: string; userId?: string; note?: string }) => {
    const position = await teamRepository.createPosition(serviceId, data);
    return { data: position };
  },
  respond: async (id: string, status: 'accepted' | 'rejected') => {
    await teamRepository.respondPosition(id, status);
    return { data: { success: true } };
  },
};

export const songsAPI = {
  getByService: async (serviceId: string) => {
    const songs = await songsRepository.getByService(serviceId);
    return { data: songs };
  },
  create: async (serviceId: string, data: any) => {
    const { userId } = await getContext();
    const song = await songsRepository.create(serviceId, data, userId);
    return { data: song };
  },
  update: async (id: string, data: any) => {
    const { userId } = await getContext();
    const song = await songsRepository.update(id, data, userId);
    return { data: song };
  },
  getHistory: async (id: string) => {
    const history = await songsRepository.getHistory(id);
    return { data: history };
  },
  delete: async (id: string) => {
    await songsRepository.delete(id);
    return { data: { success: true } };
  },
};

export const ministriesAPI = {
  getAll: async () => {
    const { churchId } = await getContext();
    const ministries = await ministriesRepository.getAll(churchId);
    return { data: ministries };
  },
  create: async (name: string) => {
    const { churchId } = await getContext();
    const ministry = await ministriesRepository.create(churchId, name);
    return { data: ministry };
  },
  update: async (id: string, data: any) => {
    const ministry = await ministriesRepository.update(id, data);
    return { data: ministry };
  },
  getRoles: async (id: string) => {
    const roles = await ministriesRepository.getRoles(id);
    return { data: roles };
  },
  createRole: async (ministryId: string, name: string) => {
    const role = await ministriesRepository.createRole(ministryId, name);
    return { data: role };
  },
  updateRole: async (id: string, data: any) => {
    const role = await ministriesRepository.updateRole(id, data);
    return { data: role };
  },
};

export const filesAPI = {
  getByService: async (serviceId: string) => {
    const files = await filesRepository.getByService(serviceId);
    return { data: files };
  },
  upload: async (
    serviceId: string,
    data: { filename: string; filetype: string; filesize: number; ministryId?: string; fileUri?: string }
  ) => {
    const { userId } = await getContext();
    const file = await filesRepository.upload(serviceId, userId, data);
    return { data: file };
  },
  delete: async (id: string) => {
    await filesRepository.delete(id);
    return { data: { success: true } };
  },
};

export const templatesAPI = {
  getAll: async () => {
    const { churchId } = await getContext();
    const templates = await templatesRepository.getAll(churchId);
    return { data: templates };
  },
  getById: async (id: string) => {
    const template = await templatesRepository.getById(id);
    if (!template) throw createApiError('Plantilla no encontrada', 404);
    return { data: template };
  },
  create: async (data: { name: string; description?: string; segments: any[] }) => {
    const { churchId } = await getContext();
    const template = await templatesRepository.create(churchId, data);
    return { data: template };
  },
  update: async (id: string, data: any) => {
    const template = await templatesRepository.update(id, data);
    return { data: template };
  },
  delete: async (id: string) => {
    await templatesRepository.delete(id);
    return { data: { success: true } };
  },
  apply: async (templateId: string, serviceId: string) => {
    await templatesRepository.apply(templateId, serviceId);
    return { data: { success: true } };
  },
};

export const agentAPI = {
  assignTeam: async (serviceId: string) => {
    const { churchId, userId } = await getContext();
    const result = await assignTeamLocal(churchId, serviceId, userId);
    return { data: result };
  },
  getHistory: async (page = 1) => {
    const { churchId } = await getContext();
    const history = await agentRepository.getHistory(churchId, page, 20);
    return { data: history };
  },
};

export const reorderAPI = {
  segments: async (serviceId: string, segmentIds: string[]) => {
    await segmentsRepository.reorder(serviceId, segmentIds);
    return { data: { success: true } };
  },
};

export const notificationsAPI = {
  getAll: async (page = 1, limit = 20) => {
    const { userId, churchId } = await getContext();
    const res = await notificationsRepository.getAll(userId, churchId, page, limit);
    return { data: res };
  },
  getUnreadCount: async () => {
    const { userId, churchId } = await getContext();
    const count = await notificationsRepository.getUnreadCount(userId, churchId);
    return { data: { count } };
  },
  markRead: async (id: string) => {
    await notificationsRepository.markRead(id);
    return { data: { success: true } };
  },
  markAllRead: async () => {
    const { userId, churchId } = await getContext();
    await notificationsRepository.markAllRead(userId, churchId);
    return { data: { success: true } };
  },
  registerToken: async (_token: string, _platform = 'expo') => {
    return { data: { success: true } };
  },
  unregisterToken: async (_token: string) => {
    return { data: { success: true } };
  },
};

export const searchAPI = {
  search: async (q: string, types?: string) => {
    const { churchId } = await getContext();
    const results = await searchRepository.search(churchId, q, types);
    return { data: results };
  },
};

export const reportsAPI = {
  getDashboard: async () => {
    const { churchId } = await getContext();
    const data = await reportsRepository.getDashboard(churchId);
    return { data };
  },
  getMonthly: async (year?: number) => {
    const { churchId } = await getContext();
    const data = await reportsRepository.getMonthly(churchId, year);
    return { data };
  },
};

export const adminAPI = {
  getChurch: async () => {
    const { churchId } = await getContext();
    const church = await churchesRepository.getById(churchId);
    if (!church) throw createApiError('Iglesia no encontrada', 404);
    return { data: church };
  },
  getMembers: async () => {
    const { churchId } = await getContext();
    const members = await churchesRepository.getMembers(churchId);
    return { data: members };
  },
  updateRole: async (userId: string, role: string) => {
    const { churchId } = await getContext();
    await churchesRepository.updateMemberRole(churchId, userId, role);
    return { data: { success: true } };
  },
  removeMember: async (userId: string) => {
    const { churchId } = await getContext();
    await churchesRepository.removeMember(churchId, userId);
    return { data: { success: true } };
  },
};

export const superAdminAPI = {
  getChurches: async () => {
    const list = await churchesRepository.getAll();
    return { data: list };
  },
  getUsers: async () => {
    const list = await usersRepository.listAll();
    return { data: list };
  },
  updateUserRole: async (userId: string, isSuperAdmin: boolean) => {
    await usersRepository.setSuperAdmin(userId, isSuperAdmin);
    return { data: { success: true } };
  },
};

export default {
  authAPI,
  churchesAPI,
  servicesAPI,
  segmentsAPI,
  teamAPI,
  positionsAPI,
  songsAPI,
  ministriesAPI,
  filesAPI,
  templatesAPI,
  agentAPI,
  reorderAPI,
  notificationsAPI,
  searchAPI,
  reportsAPI,
  adminAPI,
  superAdminAPI,
};
