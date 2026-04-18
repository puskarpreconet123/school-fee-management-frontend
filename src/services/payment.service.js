import api from './api';

export const paymentService = {
  getProviders: (studentId) => api.get(`/payments/providers/${studentId}`),
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
};
