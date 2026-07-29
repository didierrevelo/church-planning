import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { offlineCache } from '../utils/offlineCache';

const API_URL = __DEV__
  ? 'http://localhost:3000'
  : (Constants.expoConfig?.extra?.apiUrl as string) || 'https://church-planning-production.up.railway.app';

const CACHEABLE_GETS = ['/services', '/ministries', '/notifications', '/team', '/songs/'];

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const churchId = await AsyncStorage.getItem('churchId');
  if (churchId) {
    config.headers['X-Church-Id'] = churchId;
  }
  return config;
});

api.interceptors.response.use(
  async (response) => {
    if (response.config.method === 'get') {
      const url = response.config.url || '';
      const shouldCache = CACHEABLE_GETS.some((prefix) => url.startsWith(prefix));
      if (shouldCache) {
        await offlineCache.set(url, response.data);
      }
    }
    return response;
  },
  async (error) => {
    if (!error.response && error.config?.method === 'get') {
      const cached = await offlineCache.get(error.config.url);
      if (cached) {
        return Promise.resolve({ data: cached, cached: true });
      }
    }
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user', 'churchId']);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; churchName: string; churchSlug?: string }) =>
    api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: { name?: string; phone?: string }) => api.put('/auth/me', data),
  invite: (data: { email: string; name: string; phone?: string; churchId: string }) =>
    api.post('/auth/invite', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/password', data),
};

export const churchesAPI = {
  getAll: () => api.get('/churches'),
  create: (name: string) => api.post('/churches', { name }),
  getMembers: (churchId: string) => api.get(`/churches/${churchId}/members`),
  addMember: (churchId: string, data: { userId: string; role?: string }) =>
    api.post(`/churches/${churchId}/members`, data),
  removeMember: (churchId: string, userId: string) =>
    api.delete(`/churches/${churchId}/members/${userId}`),
  update: (churchId: string, data: { name: string }) =>
    api.patch(`/churches/${churchId}`, data),
};

export const servicesAPI = {
  getAll: () => api.get('/services'),
  getById: (id: string) => api.get(`/services/${id}`),
  create: (data: { title: string; date: string; time: string; type?: string; notes?: string }) =>
    api.post('/services', data),
  update: (id: string, data: any) => api.patch(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
};

export const segmentsAPI = {
  getByService: (serviceId: string) => api.get(`/services/${serviceId}/segments`),
  create: (serviceId: string, data: any) => api.post(`/services/${serviceId}/segments`, data),
  update: (id: string, data: any) => api.patch(`/services/segments/${id}`, data),
  delete: (id: string) => api.delete(`/services/segments/${id}`),
};

export const teamAPI = {
  getByService: (serviceId: string) => api.get(`/team/${serviceId}`),
  addMember: (serviceId: string, data: { userId: string; ministryId: string; ministryRoleId: string }) =>
    api.post(`/team/${serviceId}`, data),
  updateStatus: (id: string, data: { status: string; note?: string }) =>
    api.patch(`/team/${id}/status`, data),
  removeMember: (id: string) => api.delete(`/team/${id}`),
};

export const positionsAPI = {
  getByService: (serviceId: string) => api.get(`/team/positions/${serviceId}`),
  create: (serviceId: string, data: { ministryRoleId: string; userId?: string }) =>
    api.post(`/team/positions/${serviceId}`, data),
  respond: (id: string, status: 'accepted' | 'rejected') =>
    api.patch(`/team/positions/${id}/respond`, { status }),
};

export const songsAPI = {
  getByService: (serviceId: string) => api.get(`/songs/${serviceId}`),
  create: (serviceId: string, data: any) => api.post(`/songs/${serviceId}`, data),
  update: (id: string, data: any) => api.patch(`/songs/${id}`, data),
  getHistory: (id: string) => api.get(`/songs/${id}/history`),
  delete: (id: string) => api.delete(`/songs/${id}`),
};

export const ministriesAPI = {
  getAll: () => api.get('/ministries'),
  create: (name: string) => api.post('/ministries', { name }),
  update: (id: string, data: any) => api.patch(`/ministries/${id}`, data),
  getRoles: (id: string) => api.get(`/ministries/${id}/roles`),
  createRole: (ministryId: string, name: string) =>
    api.post(`/ministries/${ministryId}/roles`, { name }),
  updateRole: (id: string, data: any) => api.patch(`/ministries/roles/${id}`, data),
};

export const filesAPI = {
  getByService: (serviceId: string) => api.get(`/files/${serviceId}`),
  upload: (serviceId: string, data: { filename: string; filetype: string; filesize: number; ministryId?: string }) =>
    api.post(`/files/${serviceId}/upload`, data),
  delete: (id: string) => api.delete(`/files/${id}`),
};

export const templatesAPI = {
  getAll: () => api.get('/templates'),
  getById: (id: string) => api.get(`/templates/${id}`),
  create: (data: { name: string; description?: string; segments: { title: string; durationMin?: number; notes?: string; ministryId?: string }[] }) =>
    api.post('/templates', data),
  update: (id: string, data: any) => api.patch(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
  apply: (templateId: string, serviceId: string) =>
    api.post(`/templates/${templateId}/apply/${serviceId}`),
};

export const agentAPI = {
  assignTeam: (serviceId: string) => api.post('/agent/assign-team', { serviceId }),
  getHistory: (page = 1) => api.get(`/agent/history?page=${page}&limit=20`),
};

export const reorderAPI = {
  segments: (serviceId: string, segmentIds: string[]) =>
    api.patch(`/services/${serviceId}/reorder-segments`, { segmentIds }),
};

export const notificationsAPI = {
  getAll: (page = 1, limit = 20) => api.get(`/notifications?page=${page}&limit=${limit}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  registerToken: (token: string, platform = 'expo') =>
    api.post('/notifications/register-token', { token, platform }),
  unregisterToken: (token: string) =>
    api.delete('/notifications/unregister-token', { data: { token } }),
};

export const searchAPI = {
  search: (q: string, types?: string) =>
    api.get(`/search?q=${encodeURIComponent(q)}${types ? `&types=${types}` : ''}`),
};

export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getMonthly: (year?: number) => api.get(`/reports/monthly${year ? `?year=${year}` : ''}`),
};

export const adminAPI = {
  getChurch: () => api.get('/admin/church'),
  getMembers: () => api.get('/admin/members'),
  updateRole: (userId: string, role: string) =>
    api.patch(`/admin/members/${userId}/role`, { role }),
  removeMember: (userId: string) => api.delete(`/admin/members/${userId}`),
};

export default api;
