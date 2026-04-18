import api from './api';

export const publicService = {
  getStudentDues: (studentIdString) => api.get(`/public/student/${studentIdString}/dues`),
  getProviders: (studentIdString) => api.get(`/public/student/${studentIdString}/providers`),
  createOrder: (data) => api.post('/public/payments/create-order', data),
  verifyPayment: (data) => api.post('/public/payments/verify', data),
};
