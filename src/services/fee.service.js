import api from './api';

export const feeService = {
  list: (params) => api.get('/fees', { params }),
  create: (data) => api.post('/fees', data),
  listForStudent: (studentId, params) =>
    api.get(`/fees/student/${studentId}`, { params }),
  myFees: (params) => api.get('/fees/my', { params }),
  getById: (id) => api.get(`/fees/${id}`),
  update: (id, data) => api.patch(`/fees/${id}`, data),
  summary: () => api.get('/admin/summary'),
  toggleOverdueReminder: (feeId, enabled) =>
    api.patch(`/fees/${feeId}/overdue-reminder`, { enabled }),
  installments: (params) => api.get('/fees/installments', { params }),
  rebalance: (studentId, data) => api.post(`/fees/rebalance/${studentId}`, data),
};
