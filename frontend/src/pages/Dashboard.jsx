import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../api'

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="col-md-3 col-6">
      <div className="stat-card d-flex align-items-center gap-3">
        <div className="rounded-3 p-3" style={{ background: bg }}>
          <i className={`bi ${icon} fs-4`} style={{ color }}></i>
        </div>
        <div>
          <div className="text-muted small">{label}</div>
          <div className="fw-bold fs-5">{value}</div>
        </div>
      </div>
    </div>
  )
}

const statusBadge = (s) => {
  const map = { paid: 'badge-paid', pending: 'badge-pending', overdue: 'badge-overdue', cancelled: 'badge-cancelled' }
  return <span className={`badge ${map[s] || 'bg-secondary'} rounded-pill`}>{s}</span>
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
const [error, setError] = useState('')

useEffect(() => {
  setLoading(true)
  setError('')
  getDashboard()
    .then(r => setData(r.data))
    .catch(() => setError('Unable to load dashboard. Please refresh the page.'))
    .finally(() => setLoading(false))
}, [])

if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
if (error) return <div className="text-center py-5 text-danger">{error}</div>
if (!data) return <div className="text-center py-5 text-muted">No dashboard data available.</div>

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">Dashboard</h4>
          <small className="text-muted">Welcome back! Here's your overview.</small>
        </div>
        <Link to="/invoices/new" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1"></i> New Invoice
        </Link>
      </div>

      <div className="row g-3 mb-4">
        <StatCard icon="bi-file-earmark-text" label="Total Invoices" value={data.total_invoices}
          color="#1a56db" bg="#e8f0fe" />
        <StatCard icon="bi-check-circle" label="Paid" value={data.paid}
          color="#059669" bg="#d1fae5" />
        <StatCard icon="bi-clock" label="Pending" value={data.pending}
          color="#d97706" bg="#fef3c7" />
        <StatCard icon="bi-exclamation-triangle" label="Overdue" value={data.overdue}
          color="#dc2626" bg="#fee2e2" />
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="stat-card">
            <div className="text-muted small mb-1">Total Revenue (Paid)</div>
            <div className="fw-bold fs-4 text-success">{fmt(data.total_revenue)}</div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="stat-card">
            <div className="text-muted small mb-1">Pending Amount</div>
            <div className="fw-bold fs-4 text-warning">{fmt(data.pending_amount)}</div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom fw-semibold">
          Recent Invoices
        </div>
        <div className="table-responsive">
          <table className="table invoice-table mb-0">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data.recent_invoices || []).map(inv => (
                <tr key={inv.id}>
                  <td><Link to={`/invoices/${inv.id}`} className="text-primary fw-semibold">{inv.invoice_number}</Link></td>
                  <td>{inv.customer_name}</td>
                  <td>{inv.invoice_date}</td>
                  <td className="fw-semibold">{fmt(inv.total_amount)}</td>
                  <td>{statusBadge(inv.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
