import { useEffect, useState } from 'react'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api'

const emptyForm = { name: '', email: '', phone: '', address: '' }

export default function CustomerList() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const load = () => {
    setLoading(true)
    setError('')
    getCustomers(search ? { search } : {})
      .then(r => setCustomers(r.data))
      .catch(() => setError('Unable to load customers.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setShowModal(true) }
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, email: c.email, phone: c.phone, address: c.address }); setErrors({}); setShowModal(true) }
  const closeModal = () => setShowModal(false)

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (editing) {
        await updateCustomer(editing.id, form)
      } else {
        await createCustomer(form)
      }
      closeModal()
      load()
    } catch (err) {
      alert('Error saving customer.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c) => {
    if (!confirm(`Delete customer "${c.name}"? All their invoices will also be deleted.`)) return
    await deleteCustomer(c.id)
    load()
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Customers</h4>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="bi bi-person-plus me-1"></i> New Customer
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-4 p-3">
        <input className="form-control" placeholder="Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : customers.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-people fs-1 d-block mb-2"></i>
              No customers yet. <button className="btn btn-link p-0" onClick={openAdd}>Add one</button>
            </div>
          ) : (
            <table className="table invoice-table mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Invoices</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td className="fw-semibold">{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone || '—'}</td>
                    <td className="text-muted" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.address || '—'}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark rounded-pill">{c.invoice_count}</span>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-primary" onClick={() => openEdit(c)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-outline-danger" onClick={() => handleDelete(c)}>
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

      {/* Modal */}
      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person me-2 text-primary"></i>
                  {editing ? 'Edit Customer' : 'New Customer'}
                </h5>
                <button className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Name <span className="text-danger">*</span></label>
                  <input className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Full name" />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email <span className="text-danger">*</span></label>
                  <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    value={form.email} onChange={e => setField('email', e.target.value)} placeholder="email@example.com" />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Phone</label>
                  <input className="form-control" value={form.phone}
                    onChange={e => setField('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Address</label>
                  <textarea className="form-control" rows="3" value={form.address}
                    onChange={e => setField('address', e.target.value)} placeholder="Full address..." />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                    : <><i className="bi bi-check-lg me-1"></i>Save Customer</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
