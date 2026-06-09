import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getInvoice, deleteInvoice, downloadInvoicePDF, updateInvoice } from '../api'

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const STATUS_COLORS = {
  paid: { bg: '#d1fae5', color: '#065f46' },
  pending: { bg: '#fef3c7', color: '#92400e' },
  overdue: { bg: '#fee2e2', color: '#991b1b' },
  cancelled: { bg: '#f3f4f6', color: '#374151' },
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const printRef = useRef()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getInvoice(id)
      .then(r => setInvoice(r.data))
      .catch(() => setError('Unable to load invoice details.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!invoice) return
    if (!confirm(`Delete invoice ${invoice.invoice_number}? This cannot be undone.`)) return
    try {
      await deleteInvoice(id)
      navigate('/invoices')
    } catch {
      alert('Unable to delete invoice. Please try again.')
    }
  }

  const handleDownloadPDF = async () => {
    if (!invoice) return
    setDownloading(true)
    try {
      await downloadInvoicePDF(id, invoice.invoice_number)
    } catch {
      // Fallback to html2pdf if backend fails
      try {
        const html2pdf = (await import('html2pdf.js')).default
        const el = printRef.current
        if (!el) throw new Error('Invoice content unavailable')
        await html2pdf().set({
          margin: 10,
          filename: `${invoice.invoice_number}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        }).from(el).save()
      } catch (e) {
        alert('PDF generation failed. Please try printing instead.')
      }
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = () => window.print()

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true)
    try {
      const res = await updateInvoice(id, {
        customer: invoice.customer,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        status: newStatus,
        notes: invoice.notes,
        items: invoice.items.map(i => ({
          item_name: i.item_name,
          description: i.description,
          quantity: i.quantity,
          price: i.price,
          tax_percent: i.tax_percent,
        }))
      })
      setInvoice(res.data)
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
  if (error) return <div className="text-center py-5 text-danger">{error}</div>
  if (!invoice) return <div className="text-center py-5 text-muted">Invoice not found.</div>

  const st = STATUS_COLORS[invoice.status] || STATUS_COLORS.pending

  return (
    <div>
      {/* Toolbar */}
      <div className="d-flex align-items-center gap-2 mb-4 no-print">
        <button className="btn btn-link text-muted p-0 me-2" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left fs-5"></i>
        </button>
        <h4 className="fw-bold mb-0 me-auto">{invoice.invoice_number}</h4>

        <div className="d-flex gap-2">
          <select className="form-select form-select-sm" style={{ width: 130 }}
            value={invoice.status} disabled={updatingStatus}
            onChange={e => handleStatusChange(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <Link to={`/invoices/${id}/edit`} className="btn btn-sm btn-outline-primary">
            <i className="bi bi-pencil me-1"></i>Edit
          </Link>
          <button className="btn btn-sm btn-outline-secondary" onClick={handlePrint}>
            <i className="bi bi-printer me-1"></i>Print
          </button>
          <button className="btn btn-sm btn-primary" onClick={handleDownloadPDF} disabled={downloading}>
            {downloading
              ? <span className="spinner-border spinner-border-sm"></span>
              : <><i className="bi bi-download me-1"></i>PDF</>
            }
          </button>
          <button className="btn btn-sm btn-outline-danger" onClick={handleDelete}>
            <i className="bi bi-trash"></i>
          </button>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="invoice-preview mx-auto" ref={printRef}>
        {/* Header */}
        <div className="header-bar d-flex justify-content-between align-items-start">
          <div>
            <h2 className="fw-bold mb-0 fs-3">INVOICE</h2>
            <div className="opacity-75 mt-1">InvoiceGen Pro</div>
          </div>
          <div className="text-end">
            <div className="fs-5 fw-bold">{invoice.invoice_number}</div>
            <span className="badge mt-1" style={{ background: st.bg, color: st.color, fontSize: '0.8rem' }}>
              {invoice.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="row mb-4">
          <div className="col-6">
            <div className="text-muted small fw-semibold mb-2">BILL TO</div>
            <div className="fw-bold">{invoice.customer_name}</div>
            <div className="text-muted">{invoice.customer_email}</div>
          </div>
          <div className="col-6 text-end">
            <div className="mb-1">
              <span className="text-muted small">Invoice Date: </span>
              <span className="fw-semibold">{invoice.invoice_date}</span>
            </div>
            <div>
              <span className="text-muted small">Due Date: </span>
              <span className="fw-semibold">{invoice.due_date}</span>
            </div>
          </div>
        </div>

        {/* Items */}
        <table className="table invoice-table mb-0 border rounded overflow-hidden">
          <thead>
            <tr style={{ background: '#1a56db', color: 'white' }}>
              <th className="ps-3" style={{ background: '#1a56db', color: 'white' }}>#</th>
              <th style={{ background: '#1a56db', color: 'white' }}>Item / Service</th>
              <th className="text-end" style={{ background: '#1a56db', color: 'white' }}>Qty</th>
              <th className="text-end" style={{ background: '#1a56db', color: 'white' }}>Price</th>
              <th className="text-end" style={{ background: '#1a56db', color: 'white' }}>Tax</th>
              <th className="text-end pe-3" style={{ background: '#1a56db', color: 'white' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={item.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td className="ps-3 text-muted">{i + 1}</td>
                <td>
                  <div className="fw-semibold">{item.item_name}</div>
                  {item.description && <div className="text-muted small">{item.description}</div>}
                </td>
                <td className="text-end">{item.quantity}</td>
                <td className="text-end">{fmt(item.price)}</td>
                <td className="text-end text-muted">{item.tax_percent}%</td>
                <td className="text-end pe-3 fw-semibold">{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="row justify-content-end mt-3">
          <div className="col-md-5">
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">Subtotal</span>
              <span className="fw-semibold">{fmt(invoice.subtotal)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">GST / Tax</span>
              <span className="fw-semibold">{fmt(invoice.tax_total)}</span>
            </div>
            <hr className="my-2" style={{ borderColor: '#1a56db', borderWidth: 2 }} />
            <div className="d-flex justify-content-between">
              <span className="fw-bold fs-5">Grand Total</span>
              <span className="fw-bold fs-5 text-primary">{fmt(invoice.total_amount)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-4 p-3 bg-light rounded">
            <div className="fw-semibold small text-muted mb-1">NOTES</div>
            <div className="text-muted">{invoice.notes}</div>
          </div>
        )}

        <div className="text-center mt-4 pt-3 border-top text-muted small">
          Thank you for your business!
        </div>
      </div>
    </div>
  )
}
