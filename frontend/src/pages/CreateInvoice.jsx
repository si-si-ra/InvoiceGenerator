import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCustomers, createInvoice, updateInvoice, getInvoice } from '../api'

const today = () => new Date().toISOString().split('T')[0]
const dueDefault = () => {
  const d = new Date(); d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

const emptyItem = () => ({ item_name: '', description: '', quantity: 1, price: '', tax_percent: 18 })

export default function CreateInvoice() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [customers, setCustomers] = useState([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [loadError, setLoadError] = useState('')

  const [form, setForm] = useState({
    customer: '',
    invoice_date: today(),
    due_date: dueDefault(),
    status: 'pending',
    notes: '',
  })
  const [items, setItems] = useState([emptyItem()])

  useEffect(() => {
    setLoadError('')
    getCustomers()
      .then(r => setCustomers(r.data))
      .catch(() => setLoadError('Unable to load customers.'))

    if (isEdit) {
      getInvoice(id)
        .then(r => {
          const inv = r.data
          setForm({
            customer: inv.customer,
            invoice_date: inv.invoice_date,
            due_date: inv.due_date,
            status: inv.status,
            notes: inv.notes || '',
          })
          setItems(inv.items.map(i => ({
            item_name: i.item_name,
            description: i.description || '',
            quantity: i.quantity,
            price: i.price,
            tax_percent: i.tax_percent,
          })))
        })
        .catch(() => setLoadError('Unable to load invoice.'))
    }
  }, [id])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const setItem = (idx, k, v) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [k]: v } : it))
  }

  const addItem = () => setItems(prev => [...prev, emptyItem()])
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

  const calcItem = (item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.price) || 0
    const tax = parseFloat(item.tax_percent) || 0
    const subtotal = qty * price
    const taxAmt = subtotal * tax / 100
    return { subtotal, taxAmt, total: subtotal + taxAmt }
  }

  const totals = items.reduce((acc, it) => {
    const { subtotal, taxAmt, total } = calcItem(it)
    return { subtotal: acc.subtotal + subtotal, tax: acc.tax + taxAmt, total: acc.total + total }
  }, { subtotal: 0, tax: 0, total: 0 })

  const fmt = (n) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const validate = () => {
    const e = {}
    if (!form.customer) e.customer = 'Customer is required'
    if (!form.invoice_date) e.invoice_date = 'Required'
    if (!form.due_date) e.due_date = 'Required'
    items.forEach((it, i) => {
      if (!it.item_name.trim()) e[`item_name_${i}`] = 'Required'
      if (!it.price || parseFloat(it.price) <= 0) e[`price_${i}`] = 'Required'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        items: items.map(it => ({
          ...it,
          quantity: parseInt(it.quantity),
          price: parseFloat(it.price),
          tax_percent: parseFloat(it.tax_percent),
        }))
      }
      if (isEdit) {
        await updateInvoice(id, payload)
      } else {
        const res = await createInvoice(payload)
        navigate(`/invoices/${res.data.id}`)
        return
      }
      navigate(`/invoices/${id}`)
    } catch (err) {
      console.error(err)
      alert('Error saving invoice. Please check the form.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-link text-muted p-0" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left fs-5"></i>
        </button>
        <h4 className="fw-bold mb-0">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h4>
      </div>

      {loadError && (
        <div className="alert alert-danger" role="alert">
          {loadError}
        </div>
      )}
      <div className="row g-4">
        {/* Left column */}
        <div className="col-lg-8">

          {/* Invoice Details */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white fw-semibold border-bottom">
              <i className="bi bi-info-circle me-2 text-primary"></i>Invoice Details
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">Customer <span className="text-danger">*</span></label>
                  <select className={`form-select ${errors.customer ? 'is-invalid' : ''}`}
                    value={form.customer} onChange={e => setField('customer', e.target.value)}>
                    <option value="">— Select Customer —</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                  </select>
                  {errors.customer && <div className="invalid-feedback">{errors.customer}</div>}
                  <small className="text-muted">
                    <a href="/customers" className="text-primary">+ Add new customer</a>
                  </small>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Invoice Date <span className="text-danger">*</span></label>
                  <input type="date" className={`form-control ${errors.invoice_date ? 'is-invalid' : ''}`}
                    value={form.invoice_date} onChange={e => setField('invoice_date', e.target.value)} />
                  {errors.invoice_date && <div className="invalid-feedback">{errors.invoice_date}</div>}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Due Date <span className="text-danger">*</span></label>
                  <input type="date" className={`form-control ${errors.due_date ? 'is-invalid' : ''}`}
                    value={form.due_date} onChange={e => setField('due_date', e.target.value)} />
                  {errors.due_date && <div className="invalid-feedback">{errors.due_date}</div>}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white fw-semibold border-bottom d-flex justify-content-between align-items-center">
              <span><i className="bi bi-list-ul me-2 text-primary"></i>Line Items</span>
              <button className="btn btn-sm btn-outline-primary" onClick={addItem}>
                <i className="bi bi-plus-lg me-1"></i>Add Item
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table invoice-table mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Item / Service</th>
                      <th style={{ width: '20%' }}>Description</th>
                      <th style={{ width: '8%' }}>Qty</th>
                      <th style={{ width: '12%' }}>Price (₹)</th>
                      <th style={{ width: '10%' }}>Tax %</th>
                      <th style={{ width: '14%' }}>Total</th>
                      <th style={{ width: '6%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const { total } = calcItem(item)
                      return (
                        <tr key={idx}>
                          <td>
                            <input className={`form-control form-control-sm ${errors[`item_name_${idx}`] ? 'is-invalid' : ''}`}
                              placeholder="Item name" value={item.item_name}
                              onChange={e => setItem(idx, 'item_name', e.target.value)} />
                          </td>
                          <td>
                            <input className="form-control form-control-sm" placeholder="Optional"
                              value={item.description}
                              onChange={e => setItem(idx, 'description', e.target.value)} />
                          </td>
                          <td>
                            <input type="number" min="1" className="form-control form-control-sm quantity-input"
                              value={item.quantity}
                              onChange={e => setItem(idx, 'quantity', e.target.value)} />
                          </td>
                          <td>
                            <input type="number" min="0" step="0.01"
                              className={`form-control form-control-sm price-input ${errors[`price_${idx}`] ? 'is-invalid' : ''}`}
                              placeholder="0.00" value={item.price}
                              onChange={e => setItem(idx, 'price', e.target.value)} />
                          </td>
                          <td>
                            <input type="number" min="0" max="100" step="0.5"
                              className="form-control form-control-sm tax-input"
                              value={item.tax_percent}
                              onChange={e => setItem(idx, 'tax_percent', e.target.value)} />
                          </td>
                          <td className="fw-semibold text-end pe-3">{fmt(total)}</td>
                          <td>
                            {items.length > 1 && (
                              <button className="btn btn-sm btn-link text-danger p-0" onClick={() => removeItem(idx)}>
                                <i className="bi bi-x-lg"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white fw-semibold border-bottom">
              <i className="bi bi-chat-left-text me-2 text-primary"></i>Notes
            </div>
            <div className="card-body">
              <textarea className="form-control" rows="3" placeholder="Payment terms, thank you note..."
                value={form.notes} onChange={e => setField('notes', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Right column — Summary */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm sticky-top" style={{ top: '1rem' }}>
            <div className="card-header bg-white fw-semibold border-bottom">
              <i className="bi bi-calculator me-2 text-primary"></i>Summary
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Subtotal</span>
                <span className="fw-semibold">{fmt(totals.subtotal)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">GST / Tax</span>
                <span className="fw-semibold text-danger">{fmt(totals.tax)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <span className="fw-bold fs-5">Grand Total</span>
                <span className="fw-bold fs-5 text-primary">{fmt(totals.total)}</span>
              </div>

              <button className="btn btn-primary w-100 mb-2" onClick={handleSubmit} disabled={saving}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                  : <><i className="bi bi-check-lg me-1"></i>{isEdit ? 'Update Invoice' : 'Create Invoice'}</>
                }
              </button>
              <button className="btn btn-outline-secondary w-100" onClick={() => navigate(-1)}>
                Cancel
              </button>

              <div className="mt-3 p-2 rounded bg-light">
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Invoice number is auto-generated on save.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
