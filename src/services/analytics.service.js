import api from './api';

export const analyticsService = {
  getAdminStats: () => api.get('/analytics/admin'),
  getSuperAdminStats: () => api.get('/analytics/superadmin'),
};
