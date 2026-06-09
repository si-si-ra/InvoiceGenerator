import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getInvoices, deleteInvoice } from '../api'

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const statusBadge = (s) => {
  const map = { paid: 'badge-paid', pending: 'badge-pending', overdue: 'badge-overdue', cancelled: 'badge-cancelled' }
  return <span className={`badge ${map[s] || 'bg-secondary'} rounded-pill`}>{s}</span>
}

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    setError('')
    const params = {}
    if (search) params.search = search
    if (status) params.status = status
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    getInvoices(params)
      .then(r => setInvoices(r.data))
      .catch(() => setError('Unable to load invoices. Please try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, status, dateFrom, dateTo])

  const handleDelete = async (id, num) => {
    if (!confirm(`Delete invoice ${num}? This cannot be undone.`)) return
    await deleteInvoice(id)
    load()
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Invoices</h4>
        <Link to="/invoices/new" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1"></i> New Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4 p-3">
        <div className="row g-2">
          <div className="col-md-4">
            <input className="form-control" placeholder="Search invoice # or customer..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="col-md-2">
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="col-md-3">
            <input type="date" className="form-control" placeholder="From"
              value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="col-md-3">
            <input type="date" className="form-control" placeholder="To"
              value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : error ? (
            <div className="text-center py-5 text-danger">{error}</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-file-earmark-x fs-1 d-block mb-2"></i>
              No invoices found.
            </div>
          ) : (
            <table className="table invoice-table mb-0">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td><Link to={`/invoices/${inv.id}`} className="text-primary fw-semibold">{inv.invoice_number}</Link></td>
                    <td>{inv.customer_name}</td>
                    <td>{inv.invoice_date}</td>
                    <td>{inv.due_date}</td>
                    <td><span className="badge bg-light text-dark">{inv.item_count}</span></td>
                    <td className="fw-semibold">{fmt(inv.total_amount)}</td>
                    <td>{statusBadge(inv.status)}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-secondary" title="View"
                          onClick={() => navigate(`/invoices/${inv.id}`)}>
                          <i className="bi bi-eye"></i>
                        </button>
                        <button className="btn btn-outline-primary" title="Edit"
                          onClick={() => navigate(`/invoices/${inv.id}/edit`)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-outline-danger" title="Delete"
                          onClick={() => handleDelete(inv.id, inv.invoice_number)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
