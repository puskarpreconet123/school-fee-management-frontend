import api from './api';

export const noticeService = {
  create: (data) => api.post('/notices/admin', data),
  listAdmin: () => api.get('/notices/admin'),
  remove: (id) => api.delete(`/notices/admin/${id}`),
  listStudent: () => api.get('/notices/student'),
};
