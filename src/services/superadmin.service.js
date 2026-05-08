import api from './api';

export const superadminService = {
  login: (data) => api.post('/superadmin/login', data),
  profile: () => api.get('/superadmin/me'),
  summary: () => api.get('/superadmin/summary'),

  listSchools: (params) => api.get('/superadmin/schools', { params }),
  getSchool: (id) => api.get(`/superadmin/schools/${id}`),
  createSchool: (data) => api.post('/superadmin/schools', data),
  updateSchool: (id, data) => api.patch(`/superadmin/schools/${id}`, data),
  toggleSchoolStatus: (id) => api.patch(`/superadmin/schools/${id}/status`),
  resetSchoolPassword: (id) => api.post(`/superadmin/schools/${id}/reset-password`),
  deleteSchool: (id) => api.delete(`/superadmin/schools/${id}`),

  listPayments: (params) => api.get('/superadmin/payments', { params }),
  createPayment: (data) => api.post('/superadmin/payments', data),

  // Credits
  listCreditBalances: (params) => api.get('/superadmin/credits', { params }),
  topupCredits:       (data)   => api.post('/superadmin/credits/topup', data),
  getSchoolCredits:   (id, params) => api.get(`/superadmin/credits/${id}`, { params }),
};
