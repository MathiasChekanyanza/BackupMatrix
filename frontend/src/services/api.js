import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
    }
    return Promise.reject(error)
  }
)

export default {
  // Auth
  login(username, password) {
    return api.post('/auth/login', { username, password })
  },
  
  getCurrentUser() {
    return api.get('/auth/me')
  },
  
  changePassword(currentPassword, newPassword) {
    return api.post('/auth/change-password', { currentPassword, newPassword })
  },

  // Dashboard
  getDashboardStats() {
    return api.get('/dashboard')
  },

  // Servers
  getServers(params = {}) {
    return api.get('/servers', { params })
  },

  getServerDetails(id, params = {}) {
    return api.get(`/servers/${id}`, { params })
  },

  updateServer(id, data) {
    return api.put(`/servers/${id}`, data)
  },

  // Reports
  getMatrixData(from, to) {
    return api.get('/reports/matrix', { params: { from, to } })
  },

  exportPDF(from, to, title) {
    return api.post('/reports/export/pdf', { from, to, title }, {
      responseType: 'blob'
    })
  },

  exportExcel(from, to, title) {
    return api.post('/reports/export/excel', { from, to, title }, {
      responseType: 'blob'
    })
  },
}
