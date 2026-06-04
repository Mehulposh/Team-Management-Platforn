import api from './apiInstance.js';

// ─── AUTH ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`),
};

// ─── USERS ────────────────────────────────────────────────────────────────
export const usersAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.patch('/users/me', data),
  changePassword: (data) => api.patch('/users/me/password', data),
  searchUsers: (q) => api.get(`/users/search?q=${q}`),
  getUser: (id) => api.get(`/users/${id}`),
};

// ─── WORKSPACES ───────────────────────────────────────────────────────────
export const workspacesAPI = {
  getAll: () => api.get('/workspaces'),
  create: (data) => api.post('/workspaces', data),
  get: (id) => api.get(`/workspaces/${id}`),
  update: (id, data) => api.patch(`/workspaces/${id}`, data),
  invite: (id, data) => api.post(`/workspaces/${id}/invite`, data),
  addMember: (id, data) => api.post(`/workspaces/${id}/add-member`, data),
  acceptInvite: (token) => api.post('/workspaces/accept-invite', { token }),
  updateMemberRole: (wsId, userId, role) => api.patch(`/workspaces/${wsId}/members/${userId}`, { role }),
  removeMember: (wsId, userId) => api.delete(`/workspaces/${wsId}/members/${userId}`),
};
// ─── PROJECTS ─────────────────────────────────────────────────────────────
export const projectsAPI = {
  getAll: (workspaceId) => api.get(`/projects?workspace=${workspaceId}`),
  create: (data) => api.post('/projects', data),
  get: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  archive: (id) => api.delete(`/projects/${id}`),
  getStats: (id) => api.get(`/projects/${id}/stats`),
};

// ─── BOARDS ───────────────────────────────────────────────────────────────
export const boardsAPI = {
  getByProject: (projectId) => api.get(`/boards/project/${projectId}`),
  addColumn: (boardId, data) => api.post(`/boards/${boardId}/columns`, data),
  updateColumn: (boardId, colId, data) => api.patch(`/boards/${boardId}/columns/${colId}`, data),
  deleteColumn: (boardId, colId) => api.delete(`/boards/${boardId}/columns/${colId}`),
  reorderColumns: (boardId, orderedIds) => api.patch(`/boards/${boardId}/columns/reorder`, { orderedIds }),
};

// ─── TASKS ────────────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  get: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  reorder: (data) => api.post('/tasks/reorder', data),
  updateAssignees: (id, assignees) => api.patch(`/tasks/${id}/assignees`, { assignees }),
  addSubtask: (id, title) => api.post(`/tasks/${id}/subtasks`, { title }),
  toggleSubtask: (id, subtaskId) => api.patch(`/tasks/${id}/subtasks/${subtaskId}`),
};

// ─── SPRINTS ──────────────────────────────────────────────────────────────
export const sprintsAPI = {
  getAll: (projectId) => api.get(`/sprints?project=${projectId}`),
  create: (data) => api.post('/sprints', data),
  get: (id) => api.get(`/sprints/${id}`),
  update: (id, data) => api.patch(`/sprints/${id}`, data),
  delete: (id) => api.delete(`/sprints/${id}`),
  getBurndown: (id) => api.get(`/sprints/${id}/burndown`),
};

// ─── COMMENTS ─────────────────────────────────────────────────────────────
export const commentsAPI = {
  getAll: (taskId) => api.get(`/comments?task=${taskId}`),
  create: (data) => api.post('/comments', data),
  update: (id, content) => api.patch(`/comments/${id}`, { content }),
  delete: (id) => api.delete(`/comments/${id}`),
  react: (id, emoji) => api.post(`/comments/${id}/react`, { emoji }),
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// ─── CHAT ─────────────────────────────────────────────────────────────────
export const chatAPI = {
  getChannels: (workspaceId) => api.get(`/chat/channels?workspace=${workspaceId}`),
  createChannel: (data) => api.post('/chat/channels', data),
  joinChannel: (id) => api.post(`/chat/channels/${id}/join`),
  getMessages: (channelId, params) => api.get(`/chat/channels/${channelId}/messages`, { params }),
  deleteMessage: (id) => api.delete(`/chat/messages/${id}`),
};

// ─── FILES ────────────────────────────────────────────────────────────────
export const filesAPI = {
  uploadTaskAttachment: (taskId, formData) =>
    api.post(`/files/upload/task/${taskId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteTaskAttachment: (taskId, attachmentId) => api.delete(`/files/task/${taskId}/${attachmentId}`),
  uploadAvatar: (formData) =>
    api.post('/files/upload/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ─── ANALYTICS ────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getProject: (id) => api.get(`/analytics/project/${id}`),
  getWorkspace: (id) => api.get(`/analytics/workspace/${id}`),
  getMe: () => api.get('/analytics/me'),
};