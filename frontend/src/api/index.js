import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

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
