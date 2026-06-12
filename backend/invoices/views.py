from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Q, Sum
from django.http import HttpResponse
from django.utils import timezone
from django.contrib.auth.models import User
import datetime

from .models import Customer, Invoice, InvoiceItem
from .serializers import (
    CustomerSerializer, InvoiceSerializer,
    InvoiceListSerializer, InvoiceItemSerializer
)

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
    from io import BytesIO
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(email__icontains=search))
        return qs


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('customer').prefetch_related('items').all()

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        status_filter = self.request.query_params.get('status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        customer_id = self.request.query_params.get('customer')

        if search:
            qs = qs.filter(
                Q(invoice_number__icontains=search) |
                Q(customer__name__icontains=search)
            )
        if status_filter:
            qs = qs.filter(status=status_filter)
        if date_from:
            qs = qs.filter(invoice_date__gte=date_from)
        if date_to:
            qs = qs.filter(invoice_date__lte=date_to)
        if customer_id:
            qs = qs.filter(customer_id=customer_id)

        return qs

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        invoice = self.get_object()

        if not REPORTLAB_AVAILABLE:
            return Response(
                {'error': 'ReportLab not installed. Run: pip install reportlab'},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=20*mm,
            leftMargin=20*mm,
            topMargin=20*mm,
            bottomMargin=20*mm
        )

        styles = getSampleStyleSheet()
        story = []

        # Header
        header_style = ParagraphStyle('Header', parent=styles['Heading1'],
                                       fontSize=24, textColor=colors.HexColor('#1a56db'),
                                       spaceAfter=6)
        story.append(Paragraph("INVOICE", header_style))

        # Invoice meta
        meta_data = [
            ['Invoice No:', invoice.invoice_number, 'Status:', invoice.status.upper()],
            ['Invoice Date:', str(invoice.invoice_date), 'Due Date:', str(invoice.due_date)],
        ]
        meta_table = Table(meta_data, colWidths=[35*mm, 55*mm, 30*mm, 45*mm])
        meta_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (1, 0), (1, 0), colors.HexColor('#1a56db')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 8*mm))

        # Customer
        cust_style = ParagraphStyle('CustLabel', parent=styles['Normal'],
                                     fontName='Helvetica-Bold', fontSize=11,
                                     textColor=colors.HexColor('#374151'))
        story.append(Paragraph("Bill To:", cust_style))
        cust_info_style = ParagraphStyle('CustInfo', parent=styles['Normal'],
                                          fontSize=10, leading=16)
        story.append(Paragraph(invoice.customer.name, cust_info_style))
        story.append(Paragraph(invoice.customer.email, cust_info_style))
        if invoice.customer.phone:
            story.append(Paragraph(invoice.customer.phone, cust_info_style))
        if invoice.customer.address:
            story.append(Paragraph(invoice.customer.address.replace('\n', '<br/>'), cust_info_style))
        story.append(Spacer(1, 8*mm))

        # Items table
        item_header = ['#', 'Item / Service', 'Qty', 'Price (₹)', 'Tax %', 'Tax (₹)', 'Total (₹)']
        item_rows = [item_header]

        subtotal = 0
        tax_total = 0

        for i, item in enumerate(invoice.items.all(), 1):
            item_rows.append([
                str(i),
                item.item_name + (f'\n{item.description}' if item.description else ''),
                str(item.quantity),
                f'{float(item.price):,.2f}',
                f'{float(item.tax_percent)}%',
                f'{float(item.tax_amount):,.2f}',
                f'{float(item.total):,.2f}',
            ])
            subtotal += float(item.subtotal)
            tax_total += float(item.tax_amount)

        items_table = Table(item_rows, colWidths=[10*mm, 55*mm, 15*mm, 28*mm, 18*mm, 25*mm, 28*mm])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a56db')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
            ('ALIGN', (0, 0), (1, -1), 'LEFT'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 6*mm))

        # Totals
        grand_total = subtotal + tax_total
        totals_data = [
            ['', 'Subtotal:', f'₹{subtotal:,.2f}'],
            ['', 'Tax (GST):', f'₹{tax_total:,.2f}'],
            ['', 'Grand Total:', f'₹{grand_total:,.2f}'],
        ]
        totals_table = Table(totals_data, colWidths=[100*mm, 40*mm, 39*mm])
        totals_table.setStyle(TableStyle([
            ('FONTNAME', (1, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LINEABOVE', (1, 2), (-1, 2), 1.5, colors.HexColor('#1a56db')),
            ('LINEBELOW', (1, 2), (-1, 2), 1.5, colors.HexColor('#1a56db')),
            ('TEXTCOLOR', (1, 2), (-1, 2), colors.HexColor('#1a56db')),
            ('FONTSIZE', (1, 2), (-1, 2), 12),
        ]))
        story.append(totals_table)

        if invoice.notes:
            story.append(Spacer(1, 8*mm))
            story.append(Paragraph("Notes:", cust_style))
            story.append(Paragraph(invoice.notes, cust_info_style))

        # Footer
        story.append(Spacer(1, 10*mm))
        footer_style = ParagraphStyle('Footer', parent=styles['Normal'],
                                       fontSize=9, textColor=colors.grey,
                                       alignment=TA_CENTER)
        story.append(Paragraph("Thank you for your business!", footer_style))

        doc.build(story)
        buffer.seek(0)

        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{invoice.invoice_number}.pdf"'
        return response

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        total_invoices = Invoice.objects.count()
        paid = Invoice.objects.filter(status='paid').count()
        pending = Invoice.objects.filter(status='pending').count()
        overdue = Invoice.objects.filter(status='overdue').count()

        total_revenue = Invoice.objects.filter(status='paid').aggregate(
            total=Sum('total_amount'))['total'] or 0
        pending_amount = Invoice.objects.filter(status='pending').aggregate(
            total=Sum('total_amount'))['total'] or 0

        recent = Invoice.objects.select_related('customer')[:5]
        recent_data = InvoiceListSerializer(recent, many=True).data

        return Response({
            'total_invoices': total_invoices,
            'paid': paid,
            'pending': pending,
            'overdue': overdue,
            'total_revenue': float(total_revenue),
            'pending_amount': float(pending_amount),
            'recent_invoices': recent_data,
        })


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not username or not email or not password:
            return Response(
                {'error': 'Username, email, and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'username': 'Username already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {'email': 'Email already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(username=username, email=email, password=password)
        return Response(
            {'id': user.id, 'username': user.username, 'email': user.email},
            status=status.HTTP_201_CREATED
        )

