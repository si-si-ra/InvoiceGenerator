from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, InvoiceViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet)
router.register(r'invoices', InvoiceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
