import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwtToken')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true
      const refresh = localStorage.getItem('refreshToken')
      if (refresh) {
        try {
          const response = await axios.post('/api/token/refresh/', { refresh })
          const { access } = response.data
          localStorage.setItem('jwtToken', access)
          api.defaults.headers.common.Authorization = `Bearer ${access}`
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        } catch (refreshError) {
          logout()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export const login = (username, password) => axios.post('/api/token/', { username, password })
export const signup = (username, email, password) => axios.post('/api/register/', { username, email, password })
export const refreshToken = (refresh) => axios.post('/api/token/refresh/', { refresh })
export const logout = () => {
  localStorage.removeItem('jwtToken')
  localStorage.removeItem('refreshToken')
}

// Customers
export const getCustomers = (params) => api.get('/customers/', { params })
export const getCustomer = (id) => api.get(`/customers/${id}/`)
export const createCustomer = (data) => api.post('/customers/', data)
export const updateCustomer = (id, data) => api.put(`/customers/${id}/`, data)
export const deleteCustomer = (id) => api.delete(`/customers/${id}/`)

// Invoices
export const getInvoices = (params) => api.get('/invoices/', { params })
export const getInvoice = (id) => api.get(`/invoices/${id}/`)
export const createInvoice = (data) => api.post('/invoices/', data)
export const updateInvoice = (id, data) => api.put(`/invoices/${id}/`, data)
export const deleteInvoice = (id) => api.delete(`/invoices/${id}/`)
export const getDashboard = () => api.get('/invoices/dashboard/')

// PDF download
export const downloadInvoicePDF = async (id, invoiceNumber) => {
  const response = await api.get(`/invoices/${id}/pdf/`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${invoiceNumber}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export default api
