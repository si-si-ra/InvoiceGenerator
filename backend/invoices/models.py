from django.db import models
from django.utils import timezone
import datetime


class Customer(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]

    invoice_number = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='invoices')
    invoice_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.invoice_number

    @classmethod
    def generate_invoice_number(cls):
        today = timezone.now()
        prefix = f"INV-{today.strftime('%Y%m')}-"
        last = cls.objects.filter(invoice_number__startswith=prefix).order_by('-invoice_number').first()
        if last:
            try:
                num = int(last.invoice_number.split('-')[-1]) + 1
            except ValueError:
                num = 1
        else:
            num = 1
        return f"{prefix}{num:04d}"

    class Meta:
        ordering = ['-created_at']


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    item_name = models.CharField(max_length=100)
    description = models.CharField(max_length=255, blank=True)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    tax_percent = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)

    @property
    def subtotal(self):
        return self.quantity * self.price

    @property
    def tax_amount(self):
        return self.subtotal * self.tax_percent / 100

    @property
    def total(self):
        return self.subtotal + self.tax_amount

    def __str__(self):
        return f"{self.item_name} ({self.invoice.invoice_number})"
