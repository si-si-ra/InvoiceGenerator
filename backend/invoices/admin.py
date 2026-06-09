from django.contrib import admin
from .models import Customer, Invoice, InvoiceItem


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0
    readonly_fields = ['subtotal', 'tax_amount', 'total']


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'created_at']
    search_fields = ['name', 'email']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'customer', 'invoice_date', 'due_date', 'status', 'total_amount']
    list_filter = ['status']
    search_fields = ['invoice_number', 'customer__name']
    inlines = [InvoiceItemInline]
