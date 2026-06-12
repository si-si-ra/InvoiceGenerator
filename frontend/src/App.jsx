import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import InvoiceList from './pages/InvoiceList'
import CreateInvoice from './pages/CreateInvoice'
import InvoiceDetail from './pages/InvoiceDetail'
import CustomerList from './pages/CustomerList'

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <i className="bi bi-receipt me-2"></i>InvoiceGen Pro
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
  return (
    <BrowserRouter>
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/invoices" element={<InvoiceList />} />
          <Route path="/invoices/new" element={<CreateInvoice />} />
          <Route path="/invoices/:id/edit" element={<CreateInvoice />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
