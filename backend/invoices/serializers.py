from rest_framework import serializers
from .models import Customer, Invoice, InvoiceItem


class CustomerSerializer(serializers.ModelSerializer):
    invoice_count = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = ['id', 'name', 'email', 'phone', 'address', 'created_at', 'invoice_count']

    def get_invoice_count(self, obj):
        return obj.invoices.count()


class InvoiceItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.ReadOnlyField()
    tax_amount = serializers.ReadOnlyField()
    total = serializers.ReadOnlyField()

    class Meta:
        model = InvoiceItem
        fields = ['id', 'item_name', 'description', 'quantity', 'price',
                  'tax_percent', 'subtotal', 'tax_amount', 'total']


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    subtotal = serializers.SerializerMethodField()
    tax_total = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = ['id', 'invoice_number', 'customer', 'customer_name', 'customer_email',
                  'invoice_date', 'due_date', 'status', 'notes', 'total_amount',
                  'subtotal', 'tax_total', 'items', 'created_at', 'updated_at']
        read_only_fields = ['invoice_number', 'total_amount', 'created_at', 'updated_at']

    def get_subtotal(self, obj):
        return sum(item.subtotal for item in obj.items.all())

    def get_tax_total(self, obj):
        return sum(item.tax_amount for item in obj.items.all())

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        validated_data['invoice_number'] = Invoice.generate_invoice_number()
        invoice = Invoice.objects.create(**validated_data)
        total = 0
        for item_data in items_data:
            item = InvoiceItem.objects.create(invoice=invoice, **item_data)
            total += float(item.total)
        invoice.total_amount = total
        invoice.save()
        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if items_data is not None:
            instance.items.all().delete()
            total = 0
            for item_data in items_data:
                item = InvoiceItem.objects.create(invoice=instance, **item_data)
                total += float(item.total)
            instance.total_amount = total

        instance.save()
        return instance


class InvoiceListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = ['id', 'invoice_number', 'customer_name', 'invoice_date',
                  'due_date', 'status', 'total_amount', 'item_count', 'created_at']

    def get_item_count(self, obj):
        return obj.items.count()
