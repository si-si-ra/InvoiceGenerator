# 🧾 InvoiceGen Pro 

A full-stack invoice generator built with Django REST Framework + React.

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Django 4.2, DRF, SQLite |
| Frontend | React 18, Vite, Bootstrap 5 |
| PDF | ReportLab (backend) / html2pdf.js (frontend fallback) |

## Features

- ✅ Customer management (add, edit, delete, search)
- ✅ Invoice creation with auto-generated invoice numbers (`INV-YYYYMM-XXXX`)
- ✅ Line items with GST/tax per item
- ✅ Auto-calculated subtotal, tax total, grand total
- ✅ Invoice status — Pending / Paid / Overdue / Cancelled
- ✅ Search & filter invoices (by keyword, status, date range)
- ✅ PDF download (ReportLab backend or html2pdf.js frontend fallback)
- ✅ Print invoice
- ✅ Dashboard with revenue stats

---

## Project Structure

```
invoice-generator/
├── backend/
│   ├── invoicegen/          # Django project (settings, urls, wsgi)
│   ├── invoices/            # Main app (models, views, serializers, urls)
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── api/             # Axios API calls
    │   ├── pages/           # Dashboard, InvoiceList, CreateInvoice, InvoiceDetail, CustomerList
    │   └── App.jsx
    ├── package.json
    └── vite.config.js
```

---

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # optional
python manage.py runserver
```

Backend runs at: http://localhost:8000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/customers/` | List / Create customers |
| GET/PUT/DELETE | `/api/customers/<id>/` | Customer detail |
| GET/POST | `/api/invoices/` | List / Create invoices |
| GET/PUT/DELETE | `/api/invoices/<id>/` | Invoice detail |
| GET | `/api/invoices/<id>/pdf/` | Download PDF |
| GET | `/api/invoices/dashboard/` | Dashboard stats |

### Query Parameters (GET /api/invoices/)

| Param | Description |
|-------|-------------|
| `search` | Filter by invoice # or customer name |
| `status` | Filter by status (`pending`, `paid`, `overdue`, `cancelled`) |
| `date_from` | Filter from date (YYYY-MM-DD) |
| `date_to` | Filter to date |
| `customer` | Filter by customer ID |

---

## Models

### Customer
```python
name, email, phone, address, created_at
```

### Invoice
```python
invoice_number (auto), customer (FK), invoice_date, due_date,
status, notes, total_amount, created_at, updated_at
```

### InvoiceItem
```python
invoice (FK), item_name, description, quantity, price, tax_percent
# Computed: subtotal, tax_amount, total
```

---

## Invoice Number Format

Auto-generated: `INV-YYYYMM-XXXX`
Example: `INV-202606-0001`

---

## PDF Generation

**Option 1 (Recommended):** ReportLab (backend)
```bash
pip install reportlab
```
Downloads a professional A4 PDF from `/api/invoices/<id>/pdf/`

**Option 2 (Fallback):** html2pdf.js (frontend)
- Automatically used if backend PDF fails
- Renders the on-screen invoice preview as PDF

---

## Django Admin

Visit http://localhost:8000/admin/ after creating a superuser.
