import api from './api';

export const studentService = {
  list: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.patch(`/students/${id}`, data),
  remove: (id) => api.delete(`/students/${id}`),
  uploadCsv: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/students/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  listClasses: () => api.get('/students/classes'),
  backfillIds: () => api.post('/students/backfill-ids'),
  resetPassword: (id) => api.post(`/students/${id}/reset-password`),
};
