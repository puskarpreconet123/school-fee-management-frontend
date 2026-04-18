import api from './api';

export const authService = {
  adminLogin: (data) => api.post('/admin/login', data),
  adminRegister: (data) => api.post('/admin/register', data),
  adminProfile: () => api.get('/admin/me'),

  studentLogin: (data) => api.post('/students/login', data),
  studentProfile: () => api.get('/students/me/profile'),
};
