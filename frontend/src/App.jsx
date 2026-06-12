import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import InvoiceList from './pages/InvoiceList'
import CreateInvoice from './pages/CreateInvoice'
import InvoiceDetail from './pages/InvoiceDetail'
import CustomerList from './pages/CustomerList'
import Login from './pages/Login'
import Signup from './pages/Signup'

function isAuthenticated() {
  return Boolean(localStorage.getItem('jwtToken'))
}

function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate replace to="/login" />
}

function Sidebar({ onLogout }) {
  return (
    <div className="sidebar">
      <div className="sidebar-brand d-flex justify-content-between align-items-center">
        <span><i className="bi bi-receipt me-2"></i>InvoiceGen Pro</span>
        <button className="btn btn-sm btn-outline-secondary" onClick={onLogout}>
          <i className="bi bi-box-arrow-right"></i>
        </button>
      </div>
      <nav className="sidebar-nav mt-2">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-speedometer2"></i> Dashboard
        </NavLink>
        <NavLink to="/invoices" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-file-earmark-text"></i> Invoices
        </NavLink>
        <NavLink to="/invoices/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-plus-circle"></i> New Invoice
        </NavLink>
        <NavLink to="/customers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-people"></i> Customers
        </NavLink>
      </nav>
    </div>
  )
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated())

  useEffect(() => {
    const checkAuth = () => {
      setAuthenticated(isAuthenticated())
    }

    // Check auth on every route change and storage change
    window.addEventListener('storage', checkAuth)
    return () => window.removeEventListener('storage', checkAuth)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('jwtToken')
    localStorage.removeItem('refreshToken')
    setAuthenticated(false)
    window.location.href = '/login'
  }

  return (
    <BrowserRouter>
      {authenticated && <Sidebar onLogout={handleLogout} />}
      <div className={`main-content ${authenticated ? '' : 'no-sidebar'}`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/invoices" element={<PrivateRoute><InvoiceList /></PrivateRoute>} />
          <Route path="/invoices/new" element={<PrivateRoute><CreateInvoice /></PrivateRoute>} />
          <Route path="/invoices/:id/edit" element={<PrivateRoute><CreateInvoice /></PrivateRoute>} />
          <Route path="/invoices/:id" element={<PrivateRoute><InvoiceDetail /></PrivateRoute>} />
          <Route path="/customers" element={<PrivateRoute><CustomerList /></PrivateRoute>} />
          <Route path="*" element={<Navigate replace to={authenticated ? '/' : '/login'} />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
