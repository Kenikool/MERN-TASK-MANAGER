import axios from 'axios';
import { getStoredToken, removeStoredToken } from './storage';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;

    if (response?.status === 401) {
      // Token expired or invalid
      removeStoredToken();
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (response?.status === 403) {
      toast.error('Access denied. You don\'t have permission to perform this action.');
    } else if (response?.status === 404) {
      toast.error('Resource not found.');
    } else if (response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else if (!response) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  refreshToken: () => api.post('/auth/refresh'),
};

// Users API
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserDashboard: (id) => api.get(`/users/${id}/dashboard`),
  getTeamMembers: (params) => api.get('/users/team/members', { params }),
};

// Tasks API
export const tasksAPI = {
  getTasks: (params) => api.get('/tasks', { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (taskData) => api.post('/tasks', taskData),
  updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  addComment: (id, commentData) => api.post(`/tasks/${id}/comments`, commentData),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  toggleChecklistItem: (taskId, itemId) => api.patch(`/tasks/${taskId}/checklist/${itemId}`),
  archiveTask: (id, archived) => api.patch(`/tasks/${id}/archive`, { archived }),
};

// Projects API
export const projectsAPI = {
  getProjects: (params) => api.get('/projects', { params }),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (projectData) => api.post('/projects', projectData),
  updateProject: (id, projectData) => api.put(`/projects/${id}`, projectData),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  addMember: (id, memberData) => api.post(`/projects/${id}/members`, memberData),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
  updateMemberRole: (id, userId, role) => api.patch(`/projects/${id}/members/${userId}`, { role }),
  getProjectTasks: (id, params) => api.get(`/projects/${id}/tasks`, { params }),
};

// Upload API
export const uploadAPI = {
  uploadImage: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadImages: (imageFiles) => {
    const formData = new FormData();
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });
    return api.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadBase64: (base64Data, folder) => api.post('/upload/base64', { image: base64Data, folder }),
  deleteImage: (publicId) => api.delete(`/upload/image/${publicId}`),
  uploadAvatar: (avatarFile) => {
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    return api.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Reports API
export const reportsAPI = {
  generateReport: (reportData) => api.post('/reports/generate', reportData),
  downloadReport: (downloadData) => api.post('/reports/download', downloadData, {
    responseType: 'blob',
  }),
  getTemplates: () => api.get('/reports/templates'),
  getAnalytics: (params) => api.get('/reports/analytics', { params }),
};

// Time Tracking API
export const timeTrackingAPI = {
  startTimer: (data) => api.post('/time/start', data),
  stopTimer: (id) => api.post(`/time/stop/${id}`),
  getActiveTimer: () => api.get('/time/active'),
  getTimeEntries: (params) => api.get('/time/entries', { params }),
  createManualEntry: (data) => api.post('/time/manual', data),
  updateTimeEntry: (id, data) => api.put(`/time/entries/${id}`, data),
  deleteTimeEntry: (id) => api.delete(`/time/entries/${id}`),
  getTimeStats: (params) => api.get('/time/stats', { params }),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (notificationIds) => api.patch('/notifications/mark-read', { notificationIds }),
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (preferences) => api.put('/notifications/preferences', preferences),
  createNotification: (data) => api.post('/notifications', data),
  getStats: (params) => api.get('/notifications/stats', { params }),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getProject: (id, params) => api.get(`/analytics/projects/${id}`, { params }),
  getUser: (id, params) => api.get(`/analytics/users/${id}`, { params }),
  getSystem: (params) => api.get('/analytics/system', { params }),
};

// Subscription API
export const subscriptionAPI = {
  getCurrentSubscription: () => api.get('/subscription/current'),
  getPlans: () => api.get('/subscription/plans'),
  createSubscription: (data) => api.post('/subscription/create', data),
  updateSubscription: (data) => api.put('/subscription/update', data),
  cancelSubscription: () => api.post('/subscription/cancel'),
  resumeSubscription: () => api.post('/subscription/resume'),
  getInvoices: (params) => api.get('/subscription/invoices', { params }),
  downloadInvoice: (invoiceId) => api.get(`/subscription/invoices/${invoiceId}/download`, {
    responseType: 'blob'
  }),
  updatePaymentMethod: (data) => api.put('/subscription/payment-method', data),
  getUsage: () => api.get('/subscription/usage'),
  createPayPalOrder: (planId) => api.post('/subscription/paypal/create-order', { planId }),
  capturePayPalOrder: (orderId) => api.post('/subscription/paypal/capture-order', { orderId }),
  createStripeSession: (planId) => api.post('/subscription/stripe/create-session', { planId }),
  handleStripeWebhook: (data) => api.post('/subscription/stripe/webhook', data),
};

// AI API
export const aiAPI = {
  generateTaskSuggestions: (data) => api.post('/ai/task-suggestions', data),
  optimizeSchedule: (data) => api.post('/ai/optimize-schedule', data),
  generateInsights: (data) => api.post('/ai/generate-insights', data),
  improveDescription: (data) => api.post('/ai/improve-description', data),
  estimateDuration: (data) => api.post('/ai/estimate-duration', data),
  generateMeetingNotes: (data) => api.post('/ai/meeting-notes', data),
  analyzeProductivity: (data) => api.post('/ai/analyze-productivity', data),
  generateReportSummary: (data) => api.post('/ai/report-summary', data),
  prioritizeTasks: (data) => api.post('/ai/prioritize-tasks', data),
  chatWithAI: (data) => api.post('/ai/chat', data),
  getAIUsage: () => api.get('/ai/usage'),
  getAIInsights: (params) => api.get('/ai/insights', { params }),
};

// Payment API
export const paymentAPI = {
  createPayPalOrder: (amount, currency = 'USD', planId) => api.post('/payment/paypal/create-order', { amount, currency, planId }),
  capturePayPalOrder: (orderId, planId) => api.post('/payment/paypal/capture-order', { orderId, planId }),
  createStripePaymentIntent: (amount, currency = 'USD', planId) => api.post('/payment/stripe/create-intent', { amount, currency, planId }),
  confirmStripePayment: (paymentIntentId) => api.post('/payment/stripe/confirm', { paymentIntentId }),
  getPaymentHistory: (params) => api.get('/payment/history', { params }),
  refundPayment: (paymentId, amount) => api.post('/payment/refund', { paymentId, amount }),
  getPaymentStatus: () => api.get('/payment/status'),
};

// Generic API functions
export const apiUtils = {
  // Handle file download
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Convert file to base64
  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  },

  // Validate image file
  validateImageFile: (file, maxSize = 10 * 1024 * 1024) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload an image file.');
    }
    
    if (file.size > maxSize) {
      throw new Error(`File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
    }
    
    return true;
  },

  // Format API error message
  formatErrorMessage: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.errors) {
      return error.response.data.errors.map(err => err.message).join(', ');
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },
};

// Feature flags API
export const featureFlagsAPI = {
  getFlags: () => api.get('/feature-flags'),
  updateFlag: (flagId, enabled) => api.put(`/feature-flags/${flagId}`, { enabled }),
};

// Cleanup API (admin only)
export const cleanupAPI = {
  cleanupMockUrls: () => api.post('/cleanup/mock-urls'),
  getCleanupStats: () => api.get('/cleanup/stats'),
};

export default api;