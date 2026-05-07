import api from './api';

export const adminService = {
  profile:  () => api.get('/admin/me'),
  summary:  () => api.get('/admin/summary'),
  payments: (params) => api.get('/admin/payments', { params }),

  // Credits & Communications
  getCredits:  (params) => api.get('/admin/credits', { params }),
  communicate: (data)   => api.post('/admin/communicate', data),

  // Convenience: student count for cost preview
  getStudents: (params) => api.get('/students', { params }),

  // Email config
  updateEmailConfig: (data) => api.patch('/admin/me/email-config', data),
  testEmailConfig:   ()     => api.post('/admin/me/email-config/test'),

  // WhatsApp config
  updateWhatsappConfig: (data) => api.patch('/admin/me/whatsapp-config', data),
};
